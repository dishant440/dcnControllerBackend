import dotenv from 'dotenv';
import { connectDB } from '../../config/db';
import { connectRedis, redisClient } from '../../config/redis';
import mqtt from 'mqtt';
import { MQTTService, mqttEmitter } from './mqtt.service';
import { Telemetry } from '../../modules/dcnDevice/telemetry.model';
import { DeviceHandlerFactory } from '../deviceHandlers/deviceHandler.factory';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Connect to Redis
connectRedis();

console.log('[MQTT Process] Starting separate MQTT service process...');

const protocol = process.env.MQTT_PROTOCOL || 'mqtt';
const host = process.env.MQTT_HOST || 'localhost';
const port = process.env.MQTT_PORT || '1883';
const username = process.env.MQTT_USER || undefined;
const password = process.env.MQTT_PASS || undefined;

const connectUrl = `${protocol}://${host}:${port}`;
console.log(`[MQTT Process] Connecting to MQTT broker at: ${connectUrl}`);

const mqttOptions: mqtt.IClientOptions = {
  clientId: `SBC_BACKGROUND_PROCESS_${Math.random().toString(16).substring(2, 10)}`,
  username,
  password,
  clean: true,
  connectTimeout: 30 * 1000,
  reconnectPeriod: 5000,
};

const client = mqtt.connect(connectUrl, mqttOptions);

client.on('connect', (connack) => {
  console.log('[MQTT Process] Connected to broker successfully. Connack:', connack);
  
  // Subscribe to live telemetry data from DCN gateways
  client.subscribe('topic/live/+', (err) => {
    if (err) {
      console.error('[MQTT Process] Failed to subscribe to telemetry topic:', err);
    } else {
      console.log('[MQTT Process] Subscribed to topic/live/+');
    }
  });
});

client.on('reconnect', () => {
  console.log('[MQTT Process] Attempting to reconnect to broker...');
});

client.on('close', () => {
  console.warn('[MQTT Process] Connection to broker closed');
});

client.on('offline', () => {
  console.warn('[MQTT Process] Broker is offline');
});

client.on('error', (err) => {
  console.error('[MQTT Process] Broker connection error:', err?.message || err);
});

// Initialize MQTTService with the client
MQTTService.init(client);

// Handle incoming messages for telemetry parsing
client.on('message', async (topic, message) => {
  const payloadStr = message.toString('utf-8');

  if (topic.startsWith('topic/live/')) {
    const mac = topic.replace('topic/live/', '');
    try {
      const mqttData = JSON.parse(payloadStr);
      const slaveCount = mqttData.SLAVE_COUNT || 0;
      
      console.log(`[MQTT Process] Telemetry packet received from DCN [${mqttData.DCN_NAME}] (MAC: ${mac}) containing ${slaveCount} sub-devices`);

      for (let i = 1; i <= slaveCount; i++) {
        const slave = mqttData[`SLAVE_${i}`];
        if (!slave) continue;

        const deviceType = slave.DEVICE_TYPE;
        const deviceName = slave.DEVICE_NAME;
        const batchId = slave.DEVICE_BATCH_ID || 'NO_BATCH';

        if (!deviceType || !deviceName) {
          console.warn(`[MQTT Process] Missing DEVICE_TYPE or DEVICE_NAME in SLAVE_${i}. Skipping.`);
          continue;
        }

        if (DeviceHandlerFactory.hasHandler(deviceType)) {
          const handler = DeviceHandlerFactory.getHandler(deviceType);
          const parsedValues = handler.parseTelemetry(slave);

          const telemetryItem = {
            timestamp: new Date(),
            metadata: {
              batchId,
              dcnName: mqttData.DCN_NAME || 'UNKNOWN_DCN',
              deviceName,
              deviceType,
            },
            values: parsedValues,
          };

          // Buffer parsed telemetry values in Redis queue
          await redisClient.rPush('telemetry:queue', JSON.stringify(telemetryItem));
          console.log(`[MQTT Process] Telemetry buffered to Redis for ${deviceName} (${deviceType})`);
        } else {
          console.warn(`[MQTT Process] No handler found for device type "${deviceType}". Skipping DB insertion.`);
        }
      }
    } catch (err: any) {
      console.error(`[MQTT Process] Error processing live telemetry JSON:`, err?.message || err);
    }
  }
});

// Listen to raw messages emitted by the service
mqttEmitter.on('rawMessage', ({ topic, payloadStr }) => {
  console.log(`[MQTT Process] Received message on topic [${topic}]:`, payloadStr.substring(0, 100));
});

// Background job to periodically flush buffered telemetry from Redis to MongoDB
const flushIntervalMs = parseInt(process.env.DB_WRITE_INTERVAL || '10000', 10);
console.log(`[MQTT Process] Starting database flusher with interval: ${flushIntervalMs}ms`);

setInterval(async () => {
  try {
    const queueLen = await redisClient.lLen('telemetry:queue');
    if (queueLen === 0) return;

    console.log(`[MQTT Process] Flushing ${queueLen} records from Redis queue to MongoDB...`);
    
    // lPopCount pops up to 500 items at a time
    const poppedData = await redisClient.lPopCount('telemetry:queue', 500);
    if (!poppedData || poppedData.length === 0) return;

    const parsedDocs = poppedData.map((item) => JSON.parse(item));
    await Telemetry.insertMany(parsedDocs);
    console.log(`[MQTT Process] Successfully bulk inserted ${parsedDocs.length} telemetry records to MongoDB.`);
  } catch (err: any) {
    console.error('[MQTT Process] Failed to flush telemetry batch to MongoDB:', err?.message || err);
  }
}, flushIntervalMs);

// Handle clean shutdown
const shutdown = () => {
  console.log('[MQTT Process] Received shutdown signal. Closing connection...');
  client.end(false, () => {
    console.log('[MQTT Process] MQTT connection ended. Exiting.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

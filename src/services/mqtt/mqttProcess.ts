import dotenv from 'dotenv';
import { connectDB } from '../../config/db';
import mqtt from 'mqtt';
import { MQTTService, mqttEmitter } from './mqtt.service';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

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
  
  // Here we can subscribe to topic patterns such as heartbeats, telemetry, etc.
  // client.subscribe('topic/heartbeat/+');
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

// Listen to raw messages emitted by the service
mqttEmitter.on('rawMessage', ({ topic, payloadStr }) => {
  console.log(`[MQTT Process] Received message on topic [${topic}]:`, payloadStr.substring(0, 100));
});

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

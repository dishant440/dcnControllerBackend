import { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';

class MqttServiceEventEmitter extends EventEmitter {}
export const mqttEmitter = new MqttServiceEventEmitter();

let mqttClient: MqttClient | null = null;
const pendingResponses = new Map<string, {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}>();

export class MQTTService {
  /**
   * Initialize MQTT service with a client instance
   */
  public static init(client: MqttClient): void {
    mqttClient = client;
    mqttClient.on('message', this.onMessage.bind(this));
  }

  /**
   * Handle incoming messages
   */
  private static async onMessage(topic: string, message: Buffer): Promise<void> {
    const payloadStr = message.toString('utf-8');
    mqttEmitter.emit('rawMessage', { topic, payloadStr });

    if (topic.startsWith('dcn-response/')) {
      const mac = topic.replace('dcn-response/', '');
      if (pendingResponses.has(mac)) {
        const item = pendingResponses.get(mac);
        if (item) {
          const { resolve, timeout } = item;
          clearTimeout(timeout);
          pendingResponses.delete(mac);
          try {
            const data = JSON.parse(payloadStr);
            resolve(data);
          } catch (err) {
            resolve({
              Error: {
                PARAMETER_NAME: 'ALL',
                REASON: 'INVALID_JSON',
                STATUS: 'FAILED',
                UPDATED_VALUE: '---'
              }
            });
          }
        }
      }
    }
  }

  /**
   * Publish a payload and wait for a response on a subscription topic
   */
  public static publishAndWaitResponse(
    topicPublish: string,
    topicSubscribe: string,
    mac: string,
    payload: any,
    timeoutMs: number = 30000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!mqttClient) {
        return reject(new Error('MQTT Client not initialized'));
      }
      try {
        mqttClient.subscribe(topicSubscribe, (err) => {
          if (err) {
            return reject(err);
          }
          console.log('topic to publish : ', topicPublish);
          console.log('payload to Publish : ', payload);
          mqttClient!.publish(topicPublish, JSON.stringify(payload));

          const timeout = setTimeout(() => {
            pendingResponses.delete(mac);
            if (mqttClient) {
              mqttClient.unsubscribe(topicSubscribe);
            }
            resolve({
              Error: {
                PARAMETER_NAME: 'ALL',
                REASON: 'RESPONSE TIMEOUT',
                STATUS: 'FAILED',
                UPDATED_VALUE: '---'
              }
            });
          }, timeoutMs);

          pendingResponses.set(mac, { resolve, reject, timeout });
        });
      } catch (err) {
        return reject(err);
      }
    });
  }

  /**
   * Send SV payload to multiple DCN MACs concurrently and return mapped DCN->response
   */
  public static async sendSvToMultiple(
    dcnToMacMap: Record<string, string>,
    payloadByDcn: Record<string, any>
  ): Promise<Record<string, any>> {
    const promises = Object.entries(payloadByDcn).map(async ([dcnName, payload]) => {
      const mac = dcnToMacMap[dcnName];
      if (!mac) {
        return {
          [dcnName]: {
            Error: {
              PARAMETER_NAME: 'ALL',
              REASON: 'MAC_NOT_FOUND',
              STATUS: 'FAILED'
            }
          }
        };
      }
      const topicSubscribe = `dcn-response/${mac}`;
      const topicPublish = `sbc/sv_profile_set/${mac}`;
      console.log('Publishing to topic:', topicPublish, 'with multiple payload:', payload);
      try {
        const res = await this.publishAndWaitResponse(topicPublish, topicSubscribe, mac, { [dcnName]: payload });
        return { [dcnName]: res?.[dcnName] ?? res };
      } catch (err) {
        return {
          [dcnName]: {
            Error: {
              PARAMETER_NAME: 'ALL',
              REASON: 'CONNECTION_FAILURE',
              STATUS: 'FAILED'
            }
          }
        };
      }
    });

    const settled = await Promise.allSettled(promises);
    return Object.assign(
      {},
      ...settled.map((s) => (s.status === 'fulfilled' ? s.value : {}))
    );
  }
}

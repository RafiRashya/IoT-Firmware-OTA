import mqtt, { IClientOptions, MqttClient } from 'mqtt';

interface MQTTConfig {
  broker: string;
  port: number;
  username: string;
  password: string;
  topic: string;
}

const MQTT_CONFIG: MQTTConfig = {
  broker: 'ws://34.101.184.154:8083/mqtt',  // Don't include port in URL
  port: 1883,
  username: 'lokatani',
  password: 'lokatani711',
  topic: 'monitoring/sensor'
};

interface SensorPayload {
  node_id: string;
  data?: Array<{ tipe: string; nilai: number }>;
  tipe?: string;
  nilai?: number;
}

class MQTTClient {
  private static instance: MqttClient | null = null;
  private static subscribers: Set<(payload: SensorPayload) => void> = new Set();
  private static reconnectAttempts = 0;
  private static readonly maxReconnectAttempts = 5;
  private static connected = false;

  public static connect(): MqttClient | null {
    if (!this.instance) {
      const options: IClientOptions = {
        port: MQTT_CONFIG.port,
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        protocol: 'mqtt',
        rejectUnauthorized: false,
        connectTimeout: 4000,        // 4 seconds timeout
        reconnectPeriod: 3000,       // Try to reconnect every 3 seconds
        clientId: `lokatani_dashboard_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        keepalive: 30               // Reduced keepalive interval
      };

      try {
        console.log('Connecting to MQTT broker:', {
          broker: MQTT_CONFIG.broker,
          port: MQTT_CONFIG.port,
          clientId: options.clientId,
          topic: MQTT_CONFIG.topic
        });

        this.instance = mqtt.connect(MQTT_CONFIG.broker, options);

        this.instance.on('connect', () => {
          console.log('Successfully connected to MQTT broker');
          this.connected = true;
          this.reconnectAttempts = 0;

          // Subscribe to the topic
          this.instance?.subscribe(MQTT_CONFIG.topic, { qos: 0 }, (err) => {
            if (err) {
              console.error('Failed to subscribe:', err);
            } else {
              console.log(`Subscribed to ${MQTT_CONFIG.topic}`);
            }
          });
        });

        this.instance.on('message', (topic: string, message: Buffer) => {
          try {
            const payload: SensorPayload = JSON.parse(message.toString());
            console.log('Received message:', { topic, payload });
            this.subscribers.forEach(callback => callback(payload));
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        });

        this.instance.on('error', (err: Error) => {
          console.error('MQTT error:', err.message);
          this.connected = false;
        });

        this.instance.on('offline', () => {
          console.log('MQTT client offline');
          this.connected = false;
        });

        this.instance.on('reconnect', () => {
          this.reconnectAttempts++;
          console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached, giving up');
            this.disconnect();
          }
        });

        this.instance.on('close', () => {
          console.log('MQTT connection closed');
          this.connected = false;
        });

      } catch (error) {
        console.error('Failed to create MQTT connection:', error);
        return null;
      }
    }

    return this.instance;
  }

  public static isConnected(): boolean {
    return this.connected && this.instance?.connected || false;
  }

  public static subscribe(callback: (payload: SensorPayload) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public static disconnect(): void {
    if (this.instance) {
      this.instance.end(true, {}, () => {
        console.log('MQTT connection terminated');
      });
      this.instance = null;
    }
    this.connected = false;
    this.reconnectAttempts = 0;
    this.subscribers.clear();
  }
}

export default MQTTClient;

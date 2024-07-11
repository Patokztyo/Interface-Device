import mqtt, { MqttClient, IClientOptions } from "mqtt";
import socketIOServer from "./global";

interface Metrics {
  temperature: string[];
  availableRam: string[];
  totalRam: string[];
  availableRom: string[];
  totalRom: string[];
  cameras: string[];
}

const metrics: Metrics = {
  temperature: [''],
  availableRam: [''],
  totalRam: [''],
  availableRom: [''],
  totalRom: [''],
  cameras: ['']
};

const options: IClientOptions = {
  host: '192.168.68.105',
  port: 8999,
  protocol: 'mqtt'
};

const mqttClient: MqttClient = mqtt.connect(options);

const setupMyMQTTClient = async (): Promise<void> => {
  mqttClient.on('connect', () => {
    console.log('Aquí Toy dentro del Connect');
    mqttClient.subscribe('main', (err) => {
      if (!err) {
        console.log('Aquí Toy suscrito al tópico');
      }
    });
  });

  mqttClient.on('message', (mqttTopic: string, message: Buffer) => {
    const payload = message.toString('utf-8');
    const payloadInParts = payload.split('|');

    metrics.temperature = payloadInParts[0].split('Temperatura:');
    metrics.availableRam = payloadInParts[1].split('RAM Disponible:');
    metrics.totalRam = payloadInParts[2].split('RAM Total:');
    metrics.availableRom = payloadInParts[3].split('ROM Disponible:');
    metrics.totalRom = payloadInParts[4].split('ROM Total:');
    metrics.cameras = payloadInParts[5].split('Cámaras Conectadas:');
    if (socketIOServer.socket !== null) {
      socketIOServer.socket.emit(
        'main', {
          type: 'device',
          metrics: {
            temperatura: metrics.temperature[1],
            totalRam: metrics.totalRam[1],
            availableRam: metrics.availableRam[1],
            totalRom: metrics.totalRom[1],
            availableRom: metrics.availableRom[1],
            cameras: metrics.cameras[1]
          }
        });
    } else {
      console.log('El Mensaje no puede ser emitido al cliente');
    }
  });
};

export default setupMyMQTTClient;

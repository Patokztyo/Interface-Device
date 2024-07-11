import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';

const MQTTComponent = () => {
    const [message, setMessage] = useState('');
    const [metrics, setMetrics] = useState({
        temperatura: 0,
        availableRam: 0,
        totalRam: 0,
        availableRom: 0,
        totalRom: 0,
        cameras: 0,
      });
    
   
    useEffect(() => {
      // Conéctate al servidor MQTT usando tu IP
      console.log('Aquí Toy en el useEffect')
      const client = mqtt.connect('ws://192.168.68.105:8999');
   
      client.on('connect', () => {
        console.log('Aquí Toy dentro del Connect');
        console.log('Conectado al broker MQTT con el ID de cliente:');
        client.subscribe('main', (err) => {
          if (err) {
            console.error('Error al suscribirse al tópico "main"', err);
          } else {
            console.log('Suscripción exitosa al tópico "main"');
          }
        });
      });

    //   client.on('message', (topic, message) => {
    //     const payload = message.toString('utf-8');
    //     const payloadInParts = payload.split('|');
    //   });

    //     setMetrics(data);

    //     setMetrics(prevMetrics => ({
    //         ...prevMetrics,
    //         temperatura: parseFloat(payloadInParts[0].split('Temperatura:')[1]),
    //         availableRam: parseFloat(payloadInParts[1].split('RAM Disponible:')[1]),
    //         totalRam: parseFloat(payloadInParts[2].split('RAM Total:')[1]),
    //         availableRom: parseFloat(payloadInParts[3].split('ROM Disponible:')[1]),
    //         totalRom: parseFloat(payloadInParts[4].split('ROM Total:')[1]),
    //         cameras: parseInt(payloadInParts[5].split('Cámaras Conectadas:')[1]),
    //       }));

      // Limpieza al desmontar el componente

      console.log('metrics:', metrics)
      return () => {
        client.end();
      };
    }, []);
   
    return (
        <div className="metrics-container">
        <div className="metrics-header">Device's Data</div>
        <div className="metrics-body">
          <p>Temperatura: <span className="metrics-data">{metrics.temperature?.toFixed(2) || 0}°C</span></p>
          <p>RAM Disponible: <span className="metrics-data">{metrics.ramAvailable?.toFixed(2) || 0} MB</span></p>
          <p>RAM Total: <span className="metrics-data">{metrics.ramTotal?.toFixed(2) || 0} MB</span></p>
          <p>ROM Disponible: <span className="metrics-data">{metrics.romAvailable?.toFixed(2) || 0} MB</span></p>
          <p>ROM Total: <span className="metrics-data">{metrics.romTotal?.toFixed(2) || 0} MB</span></p>
          <p>Cámaras Conectadas: <span className="metrics-data">{metrics.connectedCameras || 0}</span></p>
        </div>
      </div>
    );
  };
   
  export default MQTTComponent;
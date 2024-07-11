import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';
import executing from './assets/executing.png';
import VideoFeed from './VideoFeed.js';
import MQTTComponent from './mqtt/mqttClient.js';

const socket = io('http://localhost:3001');

function App() {
  const [content, setContent] = useState('Device');
  const [showContent, setShowContent] = useState(false);
  const [streams, setStreams] = useState(Array(8).fill(null));
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState('');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const videoRefs = Array(8).fill().map(() => useRef(null));

  console.log('A')

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      socket.emit('log', { type: 'log', message: args.join(' ') });
      originalLog(...args);
    };

    console.error = (...args) => {
      socket.emit('log', { type: 'error', message: args.join(' ') });
      originalError(...args);
    };

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setDevices(videoDevices);
        })
        .catch(err => {
          console.error("Error enumerating devices: ", err);
        });
    } else {
      console.error("enumerateDevices is not supported by this browser.");
    }

    socket.on('terminalOutput', (data) => {
      setTerminalOutput(prevOutput => prevOutput + data + '\n');
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    return () => {
      socket.off('terminalOutput');
      socket.off('metrics');
      console.log = originalLog;
      console.error = originalError;
    };
  }, [streams.length]);

  const startVideo = (index, deviceId) => {
    console.log('Cámara', index, ' Encendida');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId ? { exact: deviceId } : undefined } })
        .then(stream => {
          const newStreams = [...streams];
          newStreams[index] = stream;
          setStreams(newStreams);
          if (videoRefs[index].current) {
            videoRefs[index].current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing the camera: ", err);
        });
    } else {
      console.error("getUserMedia is not supported by this browser.");
    }
  };

  const stopVideo = (index) => {
    console.log('Cámara', index, ' Apagada');
    if (streams[index]) {
      streams[index].getTracks().forEach(track => track.stop());
      const newStreams = [...streams];
      newStreams[index] = null;
      setStreams(newStreams);
      if (videoRefs[index].current) {
        videoRefs[index].current.srcObject = null;
      }
    }
  };

  const toggleVideo = (index, deviceId) => {
    if (streams[index]) {
      stopVideo(index);
    } else {
      startVideo(index, deviceId);
    }
  };

  const renderContent = () => {
    switch (content) {
      case 'Device':
        return (
          <div>
            <div className="image-container">
              <img src={executing} alt="Device" className="centered-image" />
            </div>
          </div>
        );
      case 'Metrics':
        return (
          <MQTTComponent />
        );
      case 'Canvas':
        return (
          <div className="canvas-container">
            {error ? (
              <div className="error-message">{error}</div>
            ) : (
              renderVideos()
            )}
          </div>
        );
      case 'Cameras':
        return (
          <div className="cameras-container">
            <div className="video-section">
              <VideoFeed />
            </div>
            <div className="video-section">
              <VideoFeed />
            </div>
            <div className="video-section">
              <VideoFeed />
            </div>
            <div className="video-section">
              <VideoFeed />
            </div>
          </div>
        );
      case 'Terminal':
        return (
          <Terminal output={terminalOutput} />
        );
      default:
        return <div>Deploy Content</div>;
    }
  };

  const renderVideos = () => {
    console.log("Cameras Detected:", devices.length)
    if (devices.length === 3) {
      return (
        <div className="three-cameras-layout">
          <div className="video-section large">
            <video ref={videoRefs[0]} autoPlay className="video" />
            <div className="button-container">
              <button
                className={`control-button ${streams[0] ? 'on' : 'off'}`}
                onClick={() => toggleVideo(0, devices[0].deviceId)}
              >
                <FontAwesomeIcon icon={faPowerOff} />
              </button>
            </div>
          </div>
          <div className="small-videos">
            <div className="video-section small">
              <video ref={videoRefs[1]} autoPlay className="video-down" />
              <div className="button-container">
                <button
                  className={`control-button ${streams[1] ? 'on' : 'off'}`}
                  onClick={() => toggleVideo(1, devices[1].deviceId)}
                >
                  <FontAwesomeIcon icon={faPowerOff} />
                </button>
              </div>
            </div>
            <div className="video-section small">
              <video ref={videoRefs[2]} autoPlay className="video-down" />
              <div className="button-container">
                <button
                  className={`control-button ${streams[2] ? 'on' : 'off'}`}
                  onClick={() => toggleVideo(2, devices[2].deviceId)}
                >
                  <FontAwesomeIcon icon={faPowerOff} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const rows = Math.ceil(Math.sqrt(devices.length));
      const cols = Math.ceil(devices.length / rows);
      const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '10px',
        width: '100%',
        height: '100%',
      };
  
      return (
        <div style={gridStyle}>
          {devices.slice(0, 8).map((device, index) => (
            <div key={index} className="video-section">
              <video ref={videoRefs[index]} autoPlay className="video-multiple" />
              <div className="button-container">
                <button
                  className={`control-button ${streams[index] ? 'on' : 'off'}`}
                  onClick={() => toggleVideo(index, device.deviceId)}
                >
                  <FontAwesomeIcon icon={faPowerOff} />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };  

  return (
    <div className="App">
      {!showContent ? (
        <div className="start-container">
          <button className="start-button" onClick={() => setShowContent(true)}>
            Deploy
          </button>
        </div>
      ) : (
        <div className="header">
          <div className="sidebar">
            <ul>
              <li className={content === 'Device' ? 'active' : ''}>
                <a href="#Device" onClick={() => setContent('Device')}>Device</a>
              </li>
              <li className={content === 'Metrics' ? 'active' : ''}>
                <a href="#Metrics" onClick={() => setContent('Metrics')}>Metrics</a>
              </li>
              <li className={content === 'Canvas' ? 'active' : ''}>
                <a href="#Canvas" onClick={() => setContent('Canvas')}>Canvas</a>
              </li>
              <li className={content === 'Cameras' ? 'active' : ''}>
                <a href="#Cameras" onClick={() => setContent('Cameras')}>Cameras</a>
              </li>
              <li className={content === 'Terminal' ? 'active' : ''}>
                <a href="#Terminal" onClick={() => setContent('Terminal')}>Terminal</a>
              </li>
            </ul>
          </div>
          <div className="content">
            <div className={`container ${content === 'Canvas' ? 'no-header' : ''}`}>
              {content !== 'Canvas' && <h1 className="container-header">{content}</h1>}
              <div className="content-section">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Terminal = ({ output }) => {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="terminal-section">
      <div className="terminal">
        <div className="terminal-header">Terminal</div>
        <div className="terminal-content" ref={terminalRef}>
          {output.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;

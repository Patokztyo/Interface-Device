import 'ts-node/register';
import setupMyMQTTClient from './connectToMQTT';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { spawn } from 'child_process';
import cors from 'cors';
import socketIOServer from './global';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const socketIO = socketIOServer.socket = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected');
  io.emit('terminalOutput', 'Server log message: A user connected');

  socket.on('log', (data) => {
    console.log(`Client ${data.type}: ${data.message}`);
    io.emit('terminalOutput', `Client ${data.type.toUpperCase()}: ${data.message}`);
  });

  socket.emit('terminalOutput', 'Server log message: This is a test message from the server.');

  const terminalProcess = spawn('node', ['-e', 'console.log("Hello from server")']);

  terminalProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    socket.emit('terminalOutput', data.toString());
  });

  terminalProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    socket.emit('terminalOutput', data.toString());
  });

  terminalProcess.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    socket.emit('terminalOutput', `Process exited with code ${code}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    io.emit('terminalOutput', 'Server log message: A user disconnected');
    terminalProcess.kill();
  });
});

server.listen(3001, async () => {
  console.log('listening on *:3001');
  await setupMyMQTTClient();
});


//Funcionalidad exclusiva de la terminal
// import express from 'express';
// import http from 'http';
// import { Server as SocketServer } from 'socket.io';
// import { spawn } from 'child_process';
// import cors from 'cors';

// const app = express();
// const server = http.createServer(app);
// const io = new SocketServer(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });

// app.use(cors());
// app.use(express.static('public'));

// io.on('connection', (socket) => {
//   console.log('A user connected');
//   io.emit('terminalOutput', 'Server log message: A user connected');

//   socket.on('log', (data) => {
//     console.log(`Client ${data.type}: ${data.message}`);
//     io.emit('terminalOutput', `Client ${data.type.toUpperCase()}: ${data.message}`);
//   });

//   socket.emit('terminalOutput', 'Server log message: This is a test message from the server.');

//   const terminalProcess = spawn('node', ['-e', 'console.log("Hello from server")']);

//   terminalProcess.stdout.on('data', (data) => {
//     console.log(`stdout: ${data}`);
//     socket.emit('terminalOutput', data.toString());
//   });

//   terminalProcess.stderr.on('data', (data) => {
//     console.error(`stderr: ${data}`);
//     socket.emit('terminalOutput', data.toString());
//   });

//   terminalProcess.on('close', (code) => {
//     console.log(`Child process exited with code ${code}`);
//     socket.emit('terminalOutput', `Process exited with code ${code}`);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//     io.emit('terminalOutput', 'Server log message: A user disconnected');
//     terminalProcess.kill();
//   });
// });

// server.listen(3001, () => {
//   console.log('listening on *:3001');
// });

require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

wss.on('connection', (ws) => {
  console.log('🔌 Cliente conectado');

  let whisperSocket;

  const connectToOpenAI = async () => {
    whisperSocket = new WebSocket('wss://api.openai.com/v1/audio/translations/stream', {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    whisperSocket.on('open', () => {
      console.log('🧠 Conectado a OpenAI Whisper');
    });

    whisperSocket.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const text = parsed.text?.trim();
        if (text) {
          console.log('🗣 Sub:', text);
          ws.send(JSON.stringify({ subtitle: text }));
        }
      } catch (e) {
        console.error('❌ Error parseando respuesta de Whisper', e);
      }
    });

    whisperSocket.on('close', () => {
      console.log('🧠 Conexión con Whisper cerrada');
    });

    whisperSocket.on('error', (err) => {
      console.error('❌ Error en Whisper WebSocket', err);
    });
  };

  connectToOpenAI();

  ws.on('message', (msg) => {
    if (whisperSocket?.readyState === WebSocket.OPEN) {
      whisperSocket.send(msg); // Envía fragmento de audio en binario
    }
  });

  ws.on('close', () => {
    console.log('👋 Cliente desconectado');
    whisperSocket?.close();
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

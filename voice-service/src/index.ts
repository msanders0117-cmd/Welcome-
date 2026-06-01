import Fastify from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { VoiceOrchestrator } from './services/voice-orchestrator.js';

dotenv.config();

const fastify = Fastify({ logger: true });
const PORT = Number(process.env.PORT) || 8080;

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// Twilio Webhook to start the stream
fastify.all('/inbound-call', async (request, reply) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${request.hostname}/media-stream" />
      </Connect>
    </Response>`;
  reply.type('text/xml').send(twiml);
});

// Register WebSocket support
fastify.register(async function (fastify) {
  const wss = new WebSocketServer({ server: fastify.server, path: '/media-stream' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[Server] Twilio connected to media stream');
    let orchestrator: VoiceOrchestrator | null = null;

    ws.on('message', async (message: string) => {
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch (e) {
        console.error('Failed to parse message', message);
        return;
      }

      switch (data.event) {
        case 'start':
          console.log('[Server] Stream started:', data.start.streamSid);
          orchestrator = new VoiceOrchestrator(
            data.start.callSid,
            data.start.streamSid,
            ws,
            process.env.DEEPGRAM_API_KEY!,
            process.env.OPENAI_API_KEY!
          );
          await orchestrator.start();
          break;

        case 'media':
          if (orchestrator) {
            const audio = Buffer.from(data.media.payload, 'base64');
            orchestrator.handleAudio(audio);
          }
          break;

        case 'stop':
          console.log('[Server] Stream stopped');
          if (orchestrator) {
            await orchestrator.stop();
          }
          break;
      }
    });

    ws.on('close', () => {
      console.log('[Server] Twilio disconnected');
    });
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[Server] Listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

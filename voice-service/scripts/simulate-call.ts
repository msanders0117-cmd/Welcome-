import WebSocket from 'ws';

/**
 * Simulates a Twilio Media Stream connection for testing the Voice Service.
 * 
 * This script connects to the WebSocket endpoint, sends a 'start' event,
 * and then sends dummy audio chunks (mulaw silence).
 */

const URL = process.env.VOICE_SERVICE_URL || 'ws://localhost:8080/media-stream';
const ws = new WebSocket(URL);

ws.on('open', () => {
  console.log(`[Simulator] Connected to ${URL}`);
  
  // 1. Send 'start' event
  const startEvent = {
    event: 'start',
    streamSid: 'test-stream-' + Math.floor(Math.random() * 1000),
    start: {
      accountSid: 'AC-test-account',
      callSid: 'CA-test-call-' + Date.now(),
      tracks: ['inbound'],
      mediaFormat: {
        encoding: 'audio/x-mulaw',
        sampleRate: 8000,
        channels: 1
      }
    }
  };
  
  console.log('[Simulator] Sending start event...');
  ws.send(JSON.stringify(startEvent));

  // 2. Simulate sending audio chunks
  // 160 bytes of mulaw silence (0xff) represents 20ms of audio at 8kHz
  const silencePayload = Buffer.alloc(160, 0xff).toString('base64');
  
  let chunkCount = 0;
  const maxChunks = 100; // Simulate ~2 seconds of audio
  
  const interval = setInterval(() => {
    if (chunkCount >= maxChunks) {
      console.log('[Simulator] Finished sending audio. Hanging up...');
      clearInterval(interval);
      
      // Send stop event
      ws.send(JSON.stringify({
        event: 'stop',
        streamSid: startEvent.streamSid
      }));
      
      setTimeout(() => ws.close(), 500);
      return;
    }
    
    ws.send(JSON.stringify({
      event: 'media',
      streamSid: startEvent.streamSid,
      media: {
        payload: silencePayload,
        timestamp: String(chunkCount * 20)
      }
    }));
    
    chunkCount++;
    if (chunkCount % 50 === 0) {
      console.log(`[Simulator] Sent ${chunkCount} chunks...`);
    }
  }, 20);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log(`[Server -> Simulator] Event: ${msg.event}`, msg.media ? '(audio data)' : '');
  } catch (e) {
    console.log('[Server -> Simulator] Raw message:', data.toString());
  }
});

ws.on('close', () => {
  console.log('[Simulator] Connection closed');
});

ws.on('error', (err) => {
  console.error('[Simulator] WebSocket error:', err.message);
});

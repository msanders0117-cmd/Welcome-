# Voice Service Test Scripts

This directory contains utility scripts for testing and debugging the Voice Service without needing a real Twilio number.

## `simulate-call.ts`

A WebSocket client that simulates the Twilio Media Stream protocol.

### Prerequisites

- Node.js installed
- `voice-service` dependencies installed (`npm install` in the parent directory)

### Usage

1. Start the Voice Service:
   ```bash
   cd voice-service
   npm run dev
   ```

2. Run the simulator in another terminal:
   ```bash
   npx ts-node scripts/simulate-call.ts
   ```

### Configuration

You can change the target URL by setting the `VOICE_SERVICE_URL` environment variable:
```bash
VOICE_SERVICE_URL=ws://your-remote-host:8080/media-stream npx ts-node scripts/simulate-call.ts
```

### What it does

- Connects to the `/media-stream` endpoint.
- Sends a `start` event with mock `callSid` and `streamSid`.
- Streams 2 seconds of μ-law silence to the service.
- Logs all events received back from the service (e.g., audio responses from the AI).
- Sends a `stop` event and closes the connection.

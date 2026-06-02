# CallFlow AI - Voice Service

This service handles real-time voice interactions using Twilio Media Streams, Deepgram (STT/TTS), and OpenAI (LLM/Brain).

## Architecture

- **Twilio Integration**: Receives bidirectional audio streams over WebSockets.
- **Deepgram Nova-2**: High-speed, low-latency streaming Speech-to-Text.
- **OpenAI GPT-4o**: Orchestrates the conversation and performs tool-calling for business logic.
- **Deepgram Aura**: Fast, natural-sounding Text-to-Speech.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Deepgram API Key
- OpenAI API Key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=8080
DEEPGRAM_API_KEY=your_key
OPENAI_API_KEY=your_key
BACKEND_API_URL=http://localhost:3000
```

### Running Locally

```bash
npm run dev
```

## Testing

Use the simulator script to test the service without a Twilio number:

```bash
npx ts-node scripts/simulate-call.ts
```

See [scripts/README.md](scripts/README.md) for more details.

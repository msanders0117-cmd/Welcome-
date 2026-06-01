import { DeepgramClient } from '@deepgram/sdk';
import { EventEmitter } from 'events';

export class DeepgramService extends EventEmitter {
  private deepgram: DeepgramClient;
  private dgLive: any;

  constructor(apiKey: string) {
    super();
    this.deepgram = new DeepgramClient({ apiKey });
  }

  async startTranscription() {
    this.dgLive = await this.deepgram.listen.v1.connect({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      encoding: 'mulaw',
      sample_rate: 8000,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
    } as any);

    this.dgLive.on('open', () => {
      console.log('[Deepgram] Connection opened');
      this.emit('open');
    });

    this.dgLive.on('results', (data: any) => {
      const transcript = data.channel.alternatives[0].transcript;
      if (transcript && data.is_final) {
        this.emit('transcript', transcript);
      }
    });

    this.dgLive.on('speech_started', () => {
      this.emit('speech-started');
    });

    this.dgLive.on('error', (err: any) => {
      console.error('[Deepgram] Error:', err);
      this.emit('error', err);
    });

    this.dgLive.on('close', () => {
      console.log('[Deepgram] Connection closed');
      this.emit('close');
    });
  }

  sendAudio(audio: Buffer) {
    if (this.dgLive) {
      this.dgLive.send(audio);
    }
  }

  async stopTranscription() {
    if (this.dgLive) {
      this.dgLive.finish();
    }
  }

  async speak(text: string): Promise<Buffer> {
    console.log(`[Deepgram] Speaking: ${text}`);
    // Using v1 REST API for speak
    const response = await this.deepgram.speak.v1.audio.generate(
      { text },
      {
        model: 'aura-asteria-en',
        encoding: 'mulaw',
        container: 'none',
        sample_rate: '8000',
      } as any
    );

    const stream = await (response as any).stream();
    if (!stream) {
      throw new Error('Failed to get Deepgram TTS stream');
    }

    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
      }
    }

    return Buffer.concat(chunks);
  }
}

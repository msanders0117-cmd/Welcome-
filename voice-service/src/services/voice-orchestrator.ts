import { DeepgramService } from './deepgram-service.js';
import { OpenAIService } from './openai-service.js';
import { BackendService } from './backend-service.js';
import type { CallState } from '../types/index.js';
import WebSocket from 'ws';

export class VoiceOrchestrator {
  private callState: CallState;
  private deepgramService: DeepgramService;
  private openaiService: OpenAIService;
  private backendService: BackendService;
  private twilioWs: WebSocket;

  constructor(
    callSid: string,
    streamSid: string,
    twilioWs: WebSocket,
    dgApiKey: string,
    oaApiKey: string
  ) {
    this.twilioWs = twilioWs;
    this.callState = {
      callSid,
      streamSid,
      transcriptHistory: [],
      isUserSpeaking: false,
      isAiSpeaking: false,
    };

    this.deepgramService = new DeepgramService(dgApiKey);
    this.openaiService = new OpenAIService(oaApiKey);
    this.backendService = new BackendService();

    this.setupListeners();
  }

  private setupListeners() {
    this.deepgramService.on('transcript', async (transcript: string) => {
      console.log(`[Orchestrator] User: ${transcript}`);
      this.callState.transcriptHistory.push({ role: 'user', content: transcript });
      
      // Interrupt AI if it's speaking
      if (this.callState.isAiSpeaking) {
        this.interruptAi();
      }

      await this.processTurn();
    });

    this.deepgramService.on('speech-started', () => {
      if (this.callState.isAiSpeaking) {
        this.interruptAi();
      }
    });
  }

  async start() {
    await this.deepgramService.startTranscription();
    const config = await this.backendService.getBusinessConfig('default');
    
    // Send initial greeting
    await this.speak(config.greeting);
    this.callState.transcriptHistory.push({ role: 'assistant', content: config.greeting });
  }

  handleAudio(audio: Buffer) {
    this.deepgramService.sendAudio(audio);
  }

  private async processTurn() {
    const config = await this.backendService.getBusinessConfig('default');
    const message = await this.openaiService.getResponse(
      this.callState.transcriptHistory,
      config.persona
    );

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const result = await this.executeTool(toolCall);
        this.callState.transcriptHistory.push(message as any);
        this.callState.transcriptHistory.push({
          role: 'system',
          content: JSON.stringify(result),
        } as any);
      }
      // Get follow up response after tool execution
      await this.processTurn();
    } else if (message.content) {
      await this.speak(message.content);
      this.callState.transcriptHistory.push({ role: 'assistant', content: message.content });
    }
  }

  private async executeTool(toolCall: any) {
    const { name } = toolCall.function;
    const args = JSON.parse(toolCall.function.arguments);

    console.log(`[Orchestrator] Executing tool: ${name}`, args);

    let result;
    switch (name) {
      case 'check_availability':
        result = await this.backendService.getAvailability('default', args.date);
        break;
      case 'create_booking':
        result = await this.backendService.createBooking(args);
        break;
      case 'capture_lead':
        result = await this.backendService.captureLead(args);
        break;
      case 'transfer_to_human':
        result = { status: 'transferring', reason: args.reason };
        break;
      default:
        result = { error: 'Unknown tool' };
    }

    return { tool_call_id: toolCall.id, result };
  }

  private async speak(text: string) {
    this.callState.isAiSpeaking = true;
    const audio = await this.deepgramService.speak(text);
    
    // Send to Twilio
    this.twilioWs.send(JSON.stringify({
      event: 'media',
      streamSid: this.callState.streamSid,
      media: {
        payload: audio.toString('base64'),
      },
    }));
    this.callState.isAiSpeaking = false;
  }

  private interruptAi() {
    console.log('[Orchestrator] Interrupting AI');
    this.twilioWs.send(JSON.stringify({
      event: 'clear',
      streamSid: this.callState.streamSid,
    }));
    this.callState.isAiSpeaking = false;
  }

  async stop() {
    await this.deepgramService.stopTranscription();
  }
}

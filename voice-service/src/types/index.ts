export interface CallState {
  callSid: string;
  streamSid: string;
  transcriptHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  isUserSpeaking: boolean;
  isAiSpeaking: boolean;
}

export interface ToolCallResult {
  tool_call_id: string;
  result: string;
}

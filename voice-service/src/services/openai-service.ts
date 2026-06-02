import OpenAI from 'openai';

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async getResponse(
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    persona: string
  ) {
    console.log('[OpenAI] Getting response');
    const systemMessage = "You are an AI phone receptionist for a business. " + persona;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        ...history,
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'check_availability',
            description: 'Check available time slots for a specific date.',
            parameters: {
              type: 'object',
              properties: {
                date: { type: 'string', description: 'The date to check availability for (e.g. 2024-06-01).' },
              },
              required: ['date'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'create_booking',
            description: 'Create a new appointment booking.',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: "The customer's name." },
                date: { type: 'string', description: 'The date for the booking.' },
                time: { type: 'string', description: 'The time for the booking.' },
              },
              required: ['name', 'date', 'time'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'capture_lead',
            description: 'Capture lead information if the user is interested but not ready to book.',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: "The lead's name." },
                phone: { type: 'string', description: "The lead's phone number." },
                notes: { type: 'string', description: "Any notes about the lead's interest." },
              },
              required: ['name', 'phone'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'transfer_to_human',
            description: 'Transfer the call to a human receptionist.',
            parameters: {
              type: 'object',
              properties: {
                reason: { type: 'string', description: 'The reason for the transfer.' },
              },
              required: ['reason'],
            },
          },
        },
      ],
    });

    const message = response.choices[0].message;
    if (!message) {
      throw new Error('No message received from OpenAI');
    }
    return message;
  }
}

import axios from 'axios';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

export class BackendService {
  async getAvailability(businessId: string, date: string) {
    console.log(`[BackendService] Getting availability for ${businessId} on ${date}`);
    // Placeholder logic
    return [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '11:00', available: false },
    ];
  }

  async createBooking(bookingData: any) {
    console.log(`[BackendService] Creating booking: `, bookingData);
    // Placeholder logic
    return { success: true, bookingId: 'bk-12345' };
  }

  async captureLead(leadData: any) {
    console.log(`[BackendService] Capturing lead: `, leadData);
    // Placeholder logic
    return { success: true, leadId: 'ld-67890' };
  }

  async getBusinessConfig(businessId: string) {
    console.log(`[BackendService] Getting config for ${businessId}`);
    return {
      name: 'Sample Salon',
      persona: 'Friendly receptionist named Sarah.',
      greeting: 'Hello! Thank you for calling Sample Salon. How can I help you today?',
    };
  }
}

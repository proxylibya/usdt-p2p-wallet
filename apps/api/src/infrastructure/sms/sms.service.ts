import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<boolean>;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private provider: string;
  private twilioClient: any = null;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get('SMS_PROVIDER', 'console');
  }

  private async getTwilioClient() {
    if (this.twilioClient) return this.twilioClient;

    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured');
      return null;
    }

    try {
      const twilio = await import('twilio');
      this.twilioClient = twilio.default(accountSid, authToken);
      return this.twilioClient;
    } catch (error) {
      this.logger.error('Failed to initialize Twilio client');
      return null;
    }
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const message = `Your USDT Wallet verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    return this.sendSms(phone, message);
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    switch (this.provider) {
      case 'twilio':
        return this.sendViaTwilio(to, message);
      case 'vonage':
        return this.sendViaVonage(to, message);
      case 'console':
      default:
        return this.sendViaConsole(to, message);
    }
  }

  private async sendViaTwilio(to: string, message: string): Promise<boolean> {
    try {
      const client = await this.getTwilioClient();
      if (!client) {
        this.logger.warn('Twilio not available, falling back to console');
        return this.sendViaConsole(to, message);
      }

      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
      if (!fromNumber) {
        this.logger.warn('Twilio phone number not configured');
        return this.sendViaConsole(to, message);
      }

      await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      this.logger.log(`SMS sent to ${to.slice(0, 6)}***`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS via Twilio: ${error.message}`);
      return false;
    }
  }

  private async sendViaVonage(to: string, message: string): Promise<boolean> {
    try {
      const apiKey = this.configService.get('VONAGE_API_KEY');
      const apiSecret = this.configService.get('VONAGE_API_SECRET');
      const fromNumber = this.configService.get('VONAGE_FROM_NUMBER', 'USDT Wallet');

      if (!apiKey || !apiSecret) {
        this.logger.warn('Vonage not configured, falling back to console');
        return this.sendViaConsole(to, message);
      }

      const { Vonage } = await import('@vonage/server-sdk');
      const vonage = new Vonage({ apiKey, apiSecret } as any);

      await (vonage.sms as any).send({ to, from: fromNumber, text: message });
      this.logger.log(`SMS sent to ${to.slice(0, 6)}***`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS via Vonage: ${error.message}`);
      return false;
    }
  }

  private sendViaConsole(to: string, message: string): Promise<boolean> {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    if (isDev) {
      this.logger.warn(`[DEV MODE] SMS to ${to}: ${message}`);
    } else {
      this.logger.error('SMS provider not configured for production!');
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }
}

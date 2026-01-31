import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get('EMAIL_PROVIDER', 'console');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    switch (this.provider) {
      case 'sendgrid':
        return this.sendViaSendGrid(options);
      case 'resend':
        return this.sendViaResend(options);
      case 'console':
      default:
        return this.sendViaConsole(options);
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'USDT Wallet - Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This code expires in 5 minutes. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
      text: `Your USDT Wallet verification code is: ${otp}. Valid for 5 minutes.`,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Welcome to USDT Wallet',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Welcome, ${name}!</h2>
          <p>Thank you for joining USDT Wallet. Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>Deposit and withdraw USDT</li>
            <li>Trade P2P with other users</li>
            <li>Track market prices</li>
            <li>Manage your wallet securely</li>
          </ul>
          <p>If you have any questions, our support team is here to help.</p>
        </div>
      `,
    });
  }

  async sendTransactionNotification(to: string, type: string, amount: number, asset: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `USDT Wallet - ${type} Notification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">${type} Confirmation</h2>
          <p>A ${type.toLowerCase()} of <strong>${amount} ${asset}</strong> has been processed.</p>
          <p>Check your wallet for details.</p>
        </div>
      `,
    });
  }

  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    try {
      const apiKey = this.configService.get('SENDGRID_API_KEY');
      const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@usdtwallet.com');

      if (!apiKey) {
        this.logger.warn('SendGrid API key not configured');
        return this.sendViaConsole(options);
      }

      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(apiKey);

      await sgMail.default.send({
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email via SendGrid: ${error.message}`);
      return false;
    }
  }

  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    try {
      const apiKey = this.configService.get('RESEND_API_KEY');
      const fromEmail = this.configService.get('EMAIL_FROM', 'noreply@usdtwallet.com');

      if (!apiKey) {
        this.logger.warn('Resend API key not configured');
        return this.sendViaConsole(options);
      }

      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);

      await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`);
      return false;
    }
  }

  private sendViaConsole(options: EmailOptions): Promise<boolean> {
    const isDev = this.configService.get('NODE_ENV') !== 'production';
    if (isDev) {
      this.logger.warn(`[DEV MODE] Email to ${options.to}: ${options.subject}`);
    } else {
      this.logger.error('Email provider not configured for production!');
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }
}

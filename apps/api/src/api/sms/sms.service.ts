import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateSmsProviderDto } from './dto/create-provider.dto';
import { UpdateSmsProviderDto } from './dto/update-provider.dto';
import { SmsGateway } from './interfaces/sms-gateway.interface';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  // --- Admin Methods ---

  async createProvider(dto: CreateSmsProviderDto) {
    return this.prisma.smsProvider.create({
      data: dto,
    });
  }

  async findAllProviders() {
    return this.prisma.smsProvider.findMany({
      orderBy: { priority: 'desc' },
    });
  }

  async findProvider(id: string) {
    const provider = await this.prisma.smsProvider.findUnique({
      where: { id },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async updateProvider(id: string, dto: UpdateSmsProviderDto) {
    return this.prisma.smsProvider.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProvider(id: string) {
    return this.prisma.smsProvider.delete({
      where: { id },
    });
  }

  async getLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.smsLog.findMany({
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: { provider: { select: { name: true } } },
      }),
      this.prisma.smsLog.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // --- Sending Logic ---

  /**
   * Send OTP for login/registration
   */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const message = `Your verification code is: ${otp}. Valid for 5 minutes.`;
    return this.sendSms(phone, message);
  }

  /**
   * 🔒 Send OTP for withdrawal confirmation - Enterprise grade
   */
  async sendWithdrawalOtp(
    phone: string, 
    otp: string, 
    amount: number, 
    asset: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<boolean> {
    const templates = {
      en: `⚠️ WITHDRAWAL ALERT\nCode: ${otp}\nAmount: ${amount} ${asset}\n\nDO NOT share this code. Valid for 10 minutes.\n\nIf you didn't request this, contact support immediately.`,
      ar: `⚠️ تنبيه سحب\nالرمز: ${otp}\nالمبلغ: ${amount} ${asset}\n\nلا تشارك هذا الرمز. صالح لمدة 10 دقائق.\n\nإذا لم تطلب هذا، تواصل مع الدعم فوراً.`,
    };
    
    const message = templates[language] || templates.en;
    
    this.logger.log(`Sending withdrawal OTP to ${phone.slice(0, 5)}****`);
    
    const success = await this.sendSms(phone, message);
    
    if (!success) {
      this.logger.error(`Failed to send withdrawal OTP to ${phone.slice(0, 5)}****`);
    }
    
    return success;
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(
    phone: string,
    type: 'deposit' | 'withdrawal' | 'transfer',
    amount: number,
    asset: string,
    status: 'completed' | 'pending' | 'failed',
    language: 'en' | 'ar' = 'en'
  ): Promise<boolean> {
    const statusText = {
      en: { completed: 'Completed', pending: 'Pending', failed: 'Failed' },
      ar: { completed: 'مكتمل', pending: 'قيد الانتظار', failed: 'فشل' },
    };
    
    const typeText = {
      en: { deposit: 'Deposit', withdrawal: 'Withdrawal', transfer: 'Transfer' },
      ar: { deposit: 'إيداع', withdrawal: 'سحب', transfer: 'تحويل' },
    };

    const templates = {
      en: `${typeText.en[type]} ${statusText.en[status]}\nAmount: ${amount} ${asset}\n\nCheck your app for details.`,
      ar: `${typeText.ar[type]} ${statusText.ar[status]}\nالمبلغ: ${amount} ${asset}\n\nتحقق من التطبيق للتفاصيل.`,
    };

    return this.sendSms(phone, templates[language] || templates.en);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(
    phone: string,
    alertType: 'login' | 'password_change' | 'suspicious_activity',
    language: 'en' | 'ar' = 'en'
  ): Promise<boolean> {
    const templates = {
      en: {
        login: '🔐 New login detected on your account. If this wasn\'t you, secure your account immediately.',
        password_change: '🔐 Your password was changed. If this wasn\'t you, contact support immediately.',
        suspicious_activity: '⚠️ Suspicious activity detected on your account. Please review your recent transactions.',
      },
      ar: {
        login: '🔐 تم اكتشاف تسجيل دخول جديد. إذا لم يكن هذا أنت، قم بتأمين حسابك فوراً.',
        password_change: '🔐 تم تغيير كلمة المرور. إذا لم يكن هذا أنت، تواصل مع الدعم فوراً.',
        suspicious_activity: '⚠️ تم اكتشاف نشاط مشبوه. يرجى مراجعة معاملاتك الأخيرة.',
      },
    };

    return this.sendSms(phone, templates[language][alertType] || templates.en[alertType]);
  }

  async sendSms(recipient: string, message: string) {
    // 1. Find active providers sorted by priority
    const providers = await this.prisma.smsProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    if (providers.length === 0) {
      this.logger.error('No active SMS providers found');
      // Create a failed log entry with no provider
      await this.prisma.smsLog.create({
        data: {
          recipient,
          message,
          status: 'FAILED',
          response: { error: 'No active providers' },
        },
      });
      return false;
    }

    // 2. Try each provider until one succeeds
    for (const provider of providers) {
      try {
        const result = await this.executeGateway(provider, recipient, message);
        
        // Log the attempt
        await this.prisma.smsLog.create({
          data: {
            providerId: provider.id,
            recipient,
            message,
            status: result.success ? 'SENT' : 'FAILED',
            response: result.response ?? {},
            cost: result.success ? provider.costPerMsg : 0,
          },
        });

        if (result.success) {
          return true;
        }
      } catch (error) {
        this.logger.error(`Failed to send SMS via ${provider.name}: ${error.message}`);
         await this.prisma.smsLog.create({
          data: {
            providerId: provider.id,
            recipient,
            message,
            status: 'FAILED',
            response: { error: error.message },
          },
        });
      }
    }

    return false;
  }

  private async executeGateway(provider: any, recipient: string, message: string): Promise<{ success: boolean; response: any }> {
    const config = provider.config as any;

    if (provider.type === 'generic_http') {
      // Basic HTTP Request implementation
      // Config expects: url, method, headers, bodyTemplate (with {{phone}}, {{message}})
      try {
        const method = config.method || 'POST';
        const url = config.url;
        const headers = config.headers || {};
        
        // Simple template replacement
        let body = config.bodyTemplate || {};
        if (typeof body === 'string') {
            body = body.replace('{{phone}}', recipient).replace('{{message}}', message);
            try { body = JSON.parse(body); } catch(e) {} // Try to parse if it became valid JSON
        } else if (typeof body === 'object') {
            // Deep clone to avoid mutating cached config if any
             body = JSON.parse(JSON.stringify(body)); 
             this.replaceTemplateInObject(body, recipient, message);
        }

        const response = await axios({
          method,
          url,
          headers,
          data: body,
          timeout: 10000,
        });

        // Determine success based on config or status code
        // Simple default: 2xx = success
        const isSuccess = response.status >= 200 && response.status < 300;
        
        return { success: isSuccess, response: response.data };
      } catch (e) {
        return { success: false, response: e.response?.data || e.message };
      }
    }
    
    // Fallback or other types (twilio, etc - can be added later)
    return { success: false, response: { error: 'Unsupported provider type' } };
  }

  private replaceTemplateInObject(obj: any, phone: string, msg: string) {
      for (const key in obj) {
          if (typeof obj[key] === 'string') {
              obj[key] = obj[key].replace('{{phone}}', phone).replace('{{message}}', msg);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              this.replaceTemplateInObject(obj[key], phone, msg);
          }
      }
  }
}

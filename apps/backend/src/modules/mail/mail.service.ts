import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') || 'BanglaCart <onboarding@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY is not defined. Outgoing emails will be logged only.');
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to BanglaCart! Your Bangladeshi Shopping Destination';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #006A4E;">Welcome to BanglaCart, ${name}!</h2>
        <p>Thank you for creating an account with us.</p>
        <p>Explore our curated collections:</p>
        <ul>
          <li><strong>Fashion & Apparel</strong>: Premium Men, Women, and Kids wear</li>
          <li><strong>Footwear & Sneakers</strong>: Sizes 5 to 10 for every occasion</li>
          <li><strong>Electronics & Gadgets</strong>: Genuine Watches, Chargers, Power Banks & Earbuds</li>
        </ul>
        <p>Enjoy fast delivery inside Dhaka (৳60) and nationwide delivery across all 64 districts (৳120) with Cash on Delivery available!</p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          BanglaCart Marketplace &bull; Bangladesh
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendPasswordResetEmail(to: string, resetToken: string, name: string): Promise<boolean> {
    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const resetLink = `${webUrl}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your BanglaCart Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #006A4E;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password for your BanglaCart account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #006A4E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          BanglaCart Security Team
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendOrderConfirmationEmail(
    to: string,
    orderNumber: string,
    totalAmount: number,
    paymentMethod: string,
    customerName: string
  ): Promise<boolean> {
    const subject = `Order Confirmed: ${orderNumber} - BanglaCart`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #006A4E;">Thank You for Your Order, ${customerName}!</h2>
        <p>Your order has been received and is being processed.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p style="margin: 4px 0;"><strong>Total Amount:</strong> ৳${totalAmount.toLocaleString('en-BD')}</p>
        </div>
        <p>You can track your order status anytime on our website using your order number.</p>
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          BanglaCart Orders Team
        </div>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendTrackingUpdateEmail(
    to: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string
  ): Promise<boolean> {
    const subject = `Order Update: ${orderNumber} is now ${status}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #006A4E;">Order Status Update</h2>
        <p>Your order <strong>${orderNumber}</strong> has been updated to: <span style="font-weight: bold; color: #006A4E;">${status}</span>.</p>
        ${trackingNumber ? `<p><strong>Courier Tracking Number:</strong> ${trackingNumber}</p>` : ''}
        <p>Thank you for shopping with BanglaCart!</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.resend) {
      this.logger.log(`[DRY RUN EMAIL] To: ${to} | Subject: ${subject}`);
      return true;
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject,
        html,
      });

      if (result.error) {
        this.logger.error(`Resend Email Error: ${result.error.message}`);
        return false;
      }

      this.logger.log(`Email successfully sent to ${to} with ID: ${result.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }
}

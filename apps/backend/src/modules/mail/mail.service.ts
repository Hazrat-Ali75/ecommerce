import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface OrderEmailItem {
  productTitleSnapshot: string;
  variantInfoSnapshot?: Record<string, any> | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderConfirmationOptions {
  to: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  customerName: string;
  customerPhone?: string;
  deliveryZone?: string;
  deliveryFee?: number;
  subtotal?: number;
  shippingAddress?: any;
  items?: OrderEmailItem[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const rawFrom = this.configService.get<string>('EMAIL_FROM');

    // Resend requires a verified custom domain or its default sandbox sender 'onboarding@resend.dev'.
    // Public webmail providers (@gmail.com, @yahoo.com, etc.) cannot be used as sender addresses.
    const isPublicWebmail = /@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)/i.test(rawFrom || '');
    if (rawFrom && !isPublicWebmail) {
      this.fromEmail = rawFrom;
    } else {
      if (isPublicWebmail) {
        this.logger.warn(
          `EMAIL_FROM was configured as a public webmail domain (${rawFrom}). Resend requires a verified domain or 'onboarding@resend.dev'. Defaulting to 'BanglaCart <onboarding@resend.dev>'.`
        );
      }
      this.fromEmail = 'BanglaCart <onboarding@resend.dev>';
    }

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
    this.logger.log(`🔑 [PASSWORD RESET LINK for ${to}]: ${resetLink}`);
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
    optionsOrTo: OrderConfirmationOptions | string,
    orderNumber?: string,
    totalAmount?: number,
    paymentMethod?: string,
    customerName?: string,
    items?: OrderEmailItem[],
    deliveryZone?: string,
    deliveryFee?: number,
    subtotal?: number,
    shippingAddress?: any,
    customerPhone?: string
  ): Promise<boolean> {
    const opts: OrderConfirmationOptions =
      typeof optionsOrTo === 'object'
        ? optionsOrTo
        : {
            to: optionsOrTo,
            orderNumber: orderNumber || '',
            totalAmount: totalAmount || 0,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            customerName: customerName || 'Valued Customer',
            items,
            deliveryZone,
            deliveryFee,
            subtotal,
            shippingAddress,
            customerPhone,
          };

    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const trackingLink = `${webUrl}/track?orderNumber=${encodeURIComponent(opts.orderNumber)}${
      opts.customerPhone ? `&phone=${encodeURIComponent(opts.customerPhone)}` : ''
    }`;

    this.logger.log(`📦 [ORDER CONFIRMATION EMAIL for ${opts.to}]: Order ${opts.orderNumber} (৳${opts.totalAmount})`);

    const zoneLabel =
      opts.deliveryZone === 'OUTSIDE_DHAKA'
        ? 'Outside Dhaka (All 64 Districts)'
        : 'Inside Dhaka (Capital)';
    const deliveryTimeframe =
      opts.deliveryZone === 'OUTSIDE_DHAKA' ? '3–5 days across 64 districts' : '24–48 hours';

    // Build items table rows
    const itemsHtml =
      opts.items && opts.items.length > 0
        ? `
        <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; color: #475569; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 10px 14px; font-weight: 600;">Product</th>
                <th style="padding: 10px 14px; text-align: center; font-weight: 600;">Qty</th>
                <th style="padding: 10px 14px; text-align: right; font-weight: 600;">Unit Price</th>
                <th style="padding: 10px 14px; text-align: right; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${opts.items
                .map((item, idx) => {
                  let variantDesc = '';
                  if (item.variantInfoSnapshot && typeof item.variantInfoSnapshot === 'object') {
                    const v = item.variantInfoSnapshot as Record<string, any>;
                    const parts: string[] = [];
                    if (v.gender) parts.push(`Gender: ${v.gender}`);
                    if (v.size) parts.push(`Size: ${String(v.size).toUpperCase()}`);
                    if (v.type) parts.push(`Type: ${v.type}`);
                    if (parts.length > 0) variantDesc = parts.join(' | ');
                  }
                  const borderStyle =
                    idx < (opts.items?.length || 0) - 1 ? 'border-bottom: 1px solid #f1f5f9;' : '';
                  return `
                    <tr style="${borderStyle}">
                      <td style="padding: 12px 14px;">
                        <div style="font-weight: 600; color: #0f172a;">${item.productTitleSnapshot}</div>
                        ${variantDesc ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${variantDesc}</div>` : ''}
                      </td>
                      <td style="padding: 12px 14px; text-align: center; color: #475569; font-weight: bold;">
                        ${item.quantity}
                      </td>
                      <td style="padding: 12px 14px; text-align: right; color: #475569;">
                        ৳${Number(item.unitPrice).toLocaleString('en-BD')}
                      </td>
                      <td style="padding: 12px 14px; text-align: right; font-weight: 600; color: #0f172a;">
                        ৳${Number(item.totalPrice).toLocaleString('en-BD')}
                      </td>
                    </tr>
                  `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      `
        : '';

    // Build address summary
    const address = opts.shippingAddress as Record<string, any> | undefined;
    const addressLine = address
      ? `${address.streetAddress || ''}, ${address.district || ''}, ${address.division || ''}`
      : '';

    const subject = `Order Confirmed: ${opts.orderNumber} - BanglaCart`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #006A4E; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #006A4E; margin: 0; font-size: 22px;">BanglaCart Order Confirmation</h1>
        </div>

        <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Thank You for Your Order, ${opts.customerName}!</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your order has been placed successfully and is now in our fulfillment queue. Here are your purchase and shipping details:
        </p>

        <!-- Order Summary Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 35%;">Order Number:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${opts.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Payment Method:</td>
              <td style="padding: 4px 0; font-weight: bold; color: #0f172a;">${opts.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Delivery Zone:</td>
              <td style="padding: 4px 0; color: #0f172a;">${zoneLabel} (${deliveryTimeframe})</td>
            </tr>
            ${addressLine ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Shipping To:</td>
              <td style="padding: 4px 0; color: #0f172a;">${addressLine}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <!-- Items Table -->
        ${itemsHtml}

        <!-- Price Breakdown -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 16px; font-size: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${opts.subtotal !== undefined ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; color: #0f172a;">৳${Number(opts.subtotal).toLocaleString('en-BD')}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Delivery Fee:</td>
              <td style="padding: 4px 0; text-align: right; color: #0f172a;">৳${Number(opts.deliveryFee ?? (opts.deliveryZone === 'OUTSIDE_DHAKA' ? 120 : 60)).toLocaleString('en-BD')}</td>
            </tr>
            <tr style="border-top: 2px solid #006A4E;">
              <td style="padding: 10px 0 4px 0; font-size: 16px; font-weight: bold; color: #006A4E;">Total Amount:</td>
              <td style="padding: 10px 0 4px 0; text-align: right; font-size: 18px; font-weight: 900; color: #006A4E;">৳${Number(opts.totalAmount).toLocaleString('en-BD')}</td>
            </tr>
          </table>
        </div>

        <!-- Track CTA Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${trackingLink}" style="background-color: #006A4E; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Track Order Live Status
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          Keep your order number handy. If you selected Cash on Delivery, please have exact cash ready at the time of delivery.
        </p>

        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          BanglaCart Marketplace &bull; Bangladesh &bull; Helpline: 01700000000
        </div>
      </div>
    `;

    return this.sendEmail(opts.to, subject, html);
  }

  async sendTrackingUpdateEmail(
    to: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
    customerName?: string,
    note?: string
  ): Promise<boolean> {
    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
    const trackingLink = `${webUrl}/track?orderNumber=${encodeURIComponent(orderNumber)}`;
    const recipient = customerName || 'Valued Customer';

    let statusDescription = `Your order status has been updated to ${status}.`;
    let statusColor = '#006A4E';

    switch (status) {
      case 'CONFIRMED':
        statusDescription = 'Your order has been verified and confirmed by our operations team.';
        statusColor = '#0284c7';
        break;
      case 'PROCESSING':
        statusDescription = 'Your order is currently being inspected and packed at our fulfillment hub.';
        statusColor = '#2563eb';
        break;
      case 'SHIPPED':
        statusDescription = 'Your package has been dispatched and handed over to our courier partner for delivery.';
        statusColor = '#7c3aed';
        break;
      case 'OUT_FOR_DELIVERY':
        statusDescription = 'Our courier rider is out for delivery today. Please keep your mobile phone reachable.';
        statusColor = '#4f46e5';
        break;
      case 'DELIVERED':
        statusDescription = 'Your parcel has been successfully delivered! Thank you for shopping authentic Bangladeshi products with us.';
        statusColor = '#059669';
        break;
      case 'CANCELLED':
        statusDescription = 'Your order has been cancelled. If any online payment was collected, a refund will be processed.';
        statusColor = '#dc2626';
        break;
    }

    const subject = `Order Update: ${orderNumber} is now ${status} - BanglaCart`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #006A4E; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #006A4E; margin: 0; font-size: 22px;">BanglaCart Delivery Update</h1>
        </div>
        
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${recipient}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">${statusDescription}</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 40%;">Order Number:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Current Status:</td>
              <td style="padding: 6px 0;"><span style="background-color: ${statusColor}; color: white; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">${status}</span></td>
            </tr>
            ${trackingNumber ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Courier Consignment ID:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a; font-family: monospace;">${trackingNumber}</td>
            </tr>
            ` : ''}
            ${note ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Milestone Note:</td>
              <td style="padding: 6px 0; color: #334155; font-style: italic;">"${note}"</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${trackingLink}" style="background-color: #006A4E; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Track Order Status Online
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          Estimated delivery windows: Inside Dhaka 24–48 hours &bull; Outside Dhaka 3–5 days across 64 districts.
        </p>

        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          BanglaCart Marketplace &bull; Bangladesh &bull; Customer Care
        </div>
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

        // Handle Resend sandbox restriction:
        // In free sandbox mode with 'onboarding@resend.dev', Resend only delivers to the account owner's email.
        const isSandboxRestricted =
          result.error.message.includes('only send testing emails to your own email address') ||
          result.error.message.includes('can only send testing emails');

        if (isSandboxRestricted) {
          const ownerMatch = result.error.message.match(/\(([^)]+@\S+)\)/);
          const fallbackEmail =
            this.configService.get<string>('RESEND_TEST_RECIPIENT') ||
            (ownerMatch ? ownerMatch[1] : 'hazratali515a@gmail.com');

          if (fallbackEmail && fallbackEmail.toLowerCase() !== to.toLowerCase()) {
            this.logger.warn(
              `⚠️ [Resend Sandbox Restriction]: Cannot deliver directly to ${to}. Forwarding to account owner (${fallbackEmail}) so you can preview the notification in your inbox!`
            );

            const forwardedHtml = `
              <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; color: #92400e;">
                <strong>[SANDBOX NOTICE]</strong>: This email was generated for customer <code>${to}</code>. Resend free tier redirected it to account owner <code>${fallbackEmail}</code>. To send directly to any customer email address, add and verify your custom domain on <a href="https://resend.com/domains" style="color: #b45309; text-decoration: underline;">resend.com/domains</a>.
              </div>
              ${html}
            `;

            const retryResult = await this.resend.emails.send({
              from: this.fromEmail,
              to: [fallbackEmail],
              subject: `[Sandbox - For: ${to}] ${subject}`,
              html: forwardedHtml,
            });

            if (!retryResult.error) {
              this.logger.log(
                `✅ Sandbox email successfully delivered to ${fallbackEmail} (ID: ${retryResult.data?.id})`
              );
              return true;
            }
          }
        }

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

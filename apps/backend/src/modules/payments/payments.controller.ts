import {
  Controller,
  Post,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('stripe/create-session/:orderId')
  @HttpCode(HttpStatus.OK)
  async createStripeSession(@Param('orderId') orderId: string) {
    return this.paymentsService.createCheckoutSession(orderId);
  }

  @Public()
  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // req.body or raw body
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    return this.paymentsService.handleWebhook(signature, rawBody);
  }
}

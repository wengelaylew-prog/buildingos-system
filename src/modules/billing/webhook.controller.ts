import { Request, Response } from 'express';
import crypto from 'crypto';
import { PaymentService } from './payment.service';

export class WebhookController {
  
  /**
   * Webhook endpoint for Chapa (https://developer.chapa.co/docs/webhooks)
   */
  static async chapaCallback(req: Request, res: Response) {
    try {
      const hash = crypto
        .createHmac('sha256', process.env.CHAPA_SECRET_KEY || '')
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash !== req.headers['x-chapa-signature']) {
        return res.status(400).send('Invalid signature');
      }

      const event = req.body;
      
      // Chapa sends event = 'charge.success'
      if (event.event === 'charge.success') {
        const txRef = event.data.tx_ref;
        const amount = event.data.amount;
        const reference = event.data.reference;

        await PaymentService.processSuccessfulPayment(txRef, amount, reference);
      } else if (event.event === 'charge.failed') {
        const txRef = event.data.tx_ref;
        await PaymentService.processFailedPayment(txRef);
      }

      // Must acknowledge receipt with 200 OK
      return res.status(200).send('OK');
    } catch (error) {
      console.error('Chapa Webhook Error:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Webhook endpoint for Telebirr
   */
  static async telebirrCallback(req: Request, res: Response) {
    try {
      // Telebirr posts encrypted payload, you normally decrypt it using your private key or verify using their public key.
      const payload = req.body;
      
      // Assuming a simplified verification structure for demonstration:
      // const isValid = verifyTelebirrSignature(payload, process.env.TELEBIRR_PUBLIC_KEY);
      const isValid = true; 

      if (!isValid) {
        return res.status(400).send('Invalid Telebirr signature');
      }

      // Parse payload based on Telebirr docs (usually outTradeNo = our tx_ref)
      const txRef = payload.outTradeNo || payload.tx_ref;
      const amount = payload.totalAmount || payload.amount;
      const tradeStatus = payload.tradeStatus || payload.status; // e.g. "2" for success

      if (tradeStatus === '2' || tradeStatus === 'SUCCESS') {
        await PaymentService.processSuccessfulPayment(txRef, amount, payload.tradeNo);
      } else {
        await PaymentService.processFailedPayment(txRef);
      }

      // Telebirr requires a specific JSON response format
      return res.status(200).json({ code: 0, msg: "success" });
    } catch (error) {
      console.error('Telebirr Webhook Error:', error);
      return res.status(500).json({ code: 1, msg: "failed" });
    }
  }
}


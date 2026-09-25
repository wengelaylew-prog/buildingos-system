import { db } from '../../db';
import { payments, invoices, receipts, tenants, users } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';

export class PaymentService {
  /**
   * Initializes a payment with the chosen gateway and returns the Checkout URL.
   */
  static async initiatePayment(
    paymentId: string, 
    amount: string, 
    gateway: 'CHAPA' | 'TELEBIRR' | 'CBE_BIRR', 
    tenantInfo: { id: string, name: string, email: string, phone: string }
  ) {
    const txRef = `${gateway.substring(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let checkoutUrl = '';

    if (gateway === 'CHAPA') {
      const CHAPA_URL = 'https://api.chapa.co/v1/transaction/initialize';
      const CHAPA_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST_...'; // Fallback for dev

      // Call Chapa API
      const response = await fetch(CHAPA_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CHAPA_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'ETB',
          email: tenantInfo.email || 'tenant@buildingos.com',
          first_name: tenantInfo.name,
          tx_ref: txRef,
          callback_url: `${process.env.APP_URL}/api/v1/webhooks/chapa`,
          return_url: `${process.env.APP_URL}/telegram`, // Or TMA Deep Link
          customization: {
            title: 'BuildingOS Rent & Utilities',
            description: 'Payment for your property invoice.'
          }
        }),
      });

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(`Chapa Init Failed: ${data.message || 'Unknown error'}`);
      }
      checkoutUrl = data.data.checkout_url;

    } else if (gateway === 'TELEBIRR') {
      // Telebirr requires complex Fabric App/H5 signing (RSA + AES).
      // In a real prod setup, you use the Telebirr Node SDK or implement the encryption standard here.
      // We set a placeholder URL that simulates the redirect to Telebirr H5 SuperApp payment page.
      const TELEBIRR_URL = process.env.TELEBIRR_H5_URL || 'https://app.ethiomobilebroadband.et/checkout';
      checkoutUrl = `${TELEBIRR_URL}?req=${txRef}&appid=${process.env.TELEBIRR_APP_ID}`;
      
    } else if (gateway === 'CBE_BIRR') {
      // Placeholder for CBE Birr
      checkoutUrl = `https://cbebirr.com/pay/${txRef}`;
    }

    // Update the payment record with the real gateway transaction ID and checkout URL
    await db.update(payments)
      .set({ 
        gatewayTransactionId: txRef, 
        checkoutUrl: checkoutUrl 
      })
      .where(eq(payments.id, paymentId));

    return checkoutUrl;
  }

  /**
   * Core logic to mark a payment as successful and update the invoice.
   * Can be called by any Webhook controller after signature verification.
   */
  static async processSuccessfulPayment(txRef: string, gatewayAmount: string, gatewayReference?: string) {
    // 1. Find the pending payment
    const paymentList = await db.select().from(payments).where(eq(payments.gatewayTransactionId, txRef));
    if (paymentList.length === 0) throw new Error('Transaction not found in system.');
    
    const payment = paymentList[0];
    if (payment.status === 'PAID') {
      return { status: 'already_processed', payment };
    }

    // Security check: ensure gateway amount matches requested amount (prevent partial manipulation)
    if (parseFloat(gatewayAmount) < parseFloat(payment.amount)) {
      throw new Error('Paid amount is less than expected amount.');
    }

    // 2. Mark Payment as PAID
    await db.update(payments)
      .set({ status: 'PAID', referenceNumber: gatewayReference || txRef })
      .where(eq(payments.id, payment.id));

    // 3. Update Invoice Paid Amount
    const invoiceList = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId!));
    if (invoiceList.length > 0) {
      const invoice = invoiceList[0];
      const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(payment.amount);
      const invoiceTotal = parseFloat(invoice.amount);
      
      const newStatus = newPaidAmount >= invoiceTotal ? 'PAID' : 'PARTIALLY_PAID';

      await db.update(invoices)
        .set({ paidAmount: newPaidAmount.toString(), status: newStatus })
        .where(eq(invoices.id, invoice.id));
    }

    // 4. Generate Receipt
    const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    await db.insert(receipts).values({
      organizationId: payment.organizationId,
      paymentId: payment.id,
      receiptNumber: receiptNumber,
      issueDate: new Date().toISOString(),
      amount: payment.amount,
      receiptUrl: `${process.env.APP_URL}/receipts/${receiptNumber}` // In future, generate actual PDF URL
    });

    return { status: 'success', payment };
  }

  /**
   * Handle Webhook failure callbacks (e.g. user cancelled)
   */
  static async processFailedPayment(txRef: string) {
    await db.update(payments)
      .set({ status: 'FAILED' })
      .where(eq(payments.gatewayTransactionId, txRef));
  }
}


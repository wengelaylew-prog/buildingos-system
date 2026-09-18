import { db } from './db/index.ts';
import { invoices, tenants, telegramAccounts } from './db/schema.ts';
import { eq, and } from 'drizzle-orm';

export function startCronJobs() {
  console.log('🚀 Starting Cron Jobs for Automated Reminders...');
  
  // Run once after 10s for presentation
  setTimeout(async () => {
    await checkUpcomingInvoices();
  }, 10000);
  
  // And then every 24 hours
  setInterval(async () => {
    await checkUpcomingInvoices();
  }, 24 * 60 * 60 * 1000);
}

async function checkUpcomingInvoices() {
  try {
    console.log('⏳ Running scheduled invoice check...');

    // Find pending invoices
    const pendingInvoices = await db.select({
      id: invoices.id,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      tenantId: invoices.tenantId,
    })
    .from(invoices)
    .where(eq(invoices.status, 'PENDING'));

    for (const inv of pendingInvoices) {
      if (!inv.tenantId) continue;
      
      // Get the tenant's user ID
      const tenantRecord = (await db.select().from(tenants).where(eq(tenants.id, inv.tenantId)))[0];
      if (!tenantRecord || !tenantRecord.userId) continue;

      // Find telegram account via userId
      const tgAccount = (await db.select().from(telegramAccounts).where(eq(telegramAccounts.userId, tenantRecord.userId)))[0];
      
      if (tgAccount && tgAccount.telegramUserId) {
        const msg = `⚠️ *የኪራይ ክፍያ ማሳሰቢያ*\n\nውድ ተከራይ፣ እባክዎ ያልተከፈለ የኪራይ ሂሳብ (${inv.amount} ETB) እንዳለዎ እናስታውሳለን።`;
        
        // Mock send message
        console.log(`✅ [CRON] Sent Telegram message to Chat ID ${tgAccount.telegramUserId}:`);
        console.log(msg);
      }
    }
  } catch (error) {
    console.error('Error in cron job checkUpcomingInvoices:', error);
  }
}

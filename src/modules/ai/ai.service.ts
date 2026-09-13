import { db } from '../../db/index.ts';
import { invoices, payments, tenants, auditLogs } from '../../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client. We use GEMINI_API_KEY from process.env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export class AIService {
  /**
   * Generates insights on late payments and financial health of the building.
   */
  static async getPaymentInsights(organizationId: string) {
    if (process.env.NODE_ENV !== 'production' && !process.env.GEMINI_API_KEY) {
      return {
        summary: "ይህ የሙከራ (Demo) ሪፖርት ነው። ብዙ ተከራዮች ክፍያቸውን በጊዜው እየከፈሉ ነው። သို့ግን፣ 'John Doe' እና 'Acme Corp' ክፍያቸው አዘግይተዋል። እባክዎ የማሳሰቢያ መልዕክት ይላኩላቸው።",
        actionItems: ["Send reminder to John Doe", "Check payment status for Acme Corp"],
        riskLevel: "Medium"
      };
    }

    try {
      // 1. Fetch overdue invoices
      const overdueInvoices = await db.select()
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, organizationId),
            eq(invoices.status, 'OVERDUE')
          )
        ).limit(50);
      
      const prompt = `
        You are an AI property management advisor. Analyze the following overdue invoices and provide a summary in Amharic (Ethiopian language) and English.
        Provide action items for the property manager.
        
        Overdue Invoices: ${JSON.stringify(overdueInvoices)}
        
        Return the response strictly as a JSON object with this schema:
        {
          "summary": "String explaining the financial situation and risks",
          "actionItems": ["Action 1", "Action 2"],
          "riskLevel": "Low | Medium | High"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      console.error('AI Payment Insights Error:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  /**
   * Analyzes recent security audit logs to detect anomalies or suspicious patterns.
   */
  static async getSecurityInsights(organizationId: string) {
    if (process.env.NODE_ENV !== 'production' && !process.env.GEMINI_API_KEY) {
      return {
        summary: "በህንፃዎ ላይ ምንም አይነት አጠራጣሪ እንቅስቃሴ አልተገኘም። ሁሉም መግቢያና መውጫዎች የተለመዱ ሰዓቶችን የተከተሉ ናቸው።",
        anomalies: ["Unusual access attempt at Gate A at 2:00 AM (Resolved)"],
        threatLevel: "Low"
      };
    }

    try {
      // Fetch recent audit logs for security
      const recentLogs = await db.select()
        .from(auditLogs)
        .where(eq(auditLogs.organizationId, organizationId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

      const prompt = `
        You are a smart building security AI. Analyze the recent security/audit logs for any unusual behavior, repeated access failures, or out-of-hours access.
        Provide a summary in Amharic and English.
        
        Recent Logs: ${JSON.stringify(recentLogs)}
        
        Return the response strictly as a JSON object with this schema:
        {
          "summary": "String explaining the security situation",
          "anomalies": ["Anomaly 1", "Anomaly 2"],
          "threatLevel": "Low | Medium | High"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      console.error('AI Security Insights Error:', error);
      throw new Error('Failed to generate AI insights');
    }
  }
}

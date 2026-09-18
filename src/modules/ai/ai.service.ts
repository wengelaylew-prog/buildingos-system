import { db } from '../../db/index.ts';
import { invoices, payments, tenants, auditLogs } from '../../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client. We use GEMINI_API_KEY from process.env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export class AIService {

  static async scanIdCard(base64Image: string) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
      // Mock for presentation without a real key
      return {
        fullName: 'Wengelaylew',
        phone: '+251 911 234567',
        idNumber: 'ID-8723912'
      };
    }
    
    try {
      const prompt = `Extract the person's full name, phone number (if any), and ID number from this ID card image. 
      Return ONLY a JSON object with this exact structure, with no markdown formatting:
      {
        "fullName": "First Last",
        "phone": "+251...",
        "idNumber": "..."
      }`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Image.split(',')[1] || base64Image,
              mimeType: 'image/jpeg'
            }
          }
        ]
      });

      const text = response.text || '{}';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to read ID card');
    }
  }

  /**
   * AI Assistant for Tenants via Telegram
   */
  static async processTenantMessage(tenantId: string, message: string) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
      return {
        intent: 'INQUIRY',
        category: 'GENERAL',
        priority: 'LOW',
        summary: message,
        reply: "ይቅርታ፣ ይህ የሙከራ (Demo) ስሪት ነው። እባክዎ API Key ያስገቡ።",
      };
    }

    try {
      const prompt = `
        You are an intelligent property management assistant. A tenant has sent a message. 
        You must analyze the message and classify the intent, extract the category, and determine the priority.
        Also, provide a short, helpful, and empathetic reply to the tenant IN AMHARIC.

        Tenant Message: "${message}"

        Return the response strictly as a JSON object with this schema:
        {
          "intent": "MAINTENANCE" | "INQUIRY" | "COMPLAINT",
          "category": "PLUMBING" | "ELECTRICAL" | "CLEANING" | "SECURITY" | "BILLING" | "GENERAL",
          "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
          "summary": "English summary of the issue (max 10 words)",
          "reply": "Empathetic reply to the tenant in Amharic"
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
      console.error('AI Tenant Message Error:', error);
      throw new Error('Failed to process message with AI');
    }
  }

  /**
   * Generates insights on late payments and financial health of the building.
   */
  static async getPaymentInsights(organizationId: string) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
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
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
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

  /**
   * Interactive AI Assistant for Property Managers/Admins
   */
  static async handleAdminQuery(organizationId: string, query: string) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
      return {
        reply: "ይህ የሙከራ መልስ ነው። ሲስተሙ በትክክል ከ Gemini ጋር ሲገናኝ ትክክለኛ ምላሽ ይሰጣል። (Mock Mode)"
      };
    }

    try {
      // 1. Fetch some contextual data so the AI has context
      const overdueInvoices = await db.select()
        .from(invoices)
        .where(
          and(
            eq(invoices.organizationId, organizationId),
            eq(invoices.status, 'OVERDUE')
          )
        ).limit(10);
      
      const recentLogs = await db.select()
        .from(auditLogs)
        .where(eq(auditLogs.organizationId, organizationId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(10);

      const prompt = `
        You are a highly helpful and professional Property Management Assistant named "BuildingOS Assistant". 
        Your job is to answer the admin's questions about their building, payments, and security. 
        You MUST always reply in Amharic (Ethiopian language), but you can use English technical terms if needed.
        
        Here is the current context for the admin's organization:
        - Recent Overdue Invoices: ${JSON.stringify(overdueInvoices)}
        - Recent System Logs: ${JSON.stringify(recentLogs)}
        
        Admin's Query: "${query}"
        
        Provide a helpful, direct, and professional answer.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return { reply: response.text };
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}


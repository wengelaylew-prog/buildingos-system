import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export interface ThreatAnalysisResult {
  threatDetected: boolean;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedObjects: string[];
  description: string;
  recommendedAction: string;
  confidence: number;
}

export class ThreatDetectionService {
  /**
   * Analyze a camera frame (base64 image or public URL) for security threats.
   * Uses Gemini Vision AI with a structured threat-detection prompt.
   */
  static async analyzeFrame(imageBase64OrUrl: string, cameraId: string): Promise<ThreatAnalysisResult> {
    // Mock mode
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'mock-key') {
      return {
        threatDetected: false,
        threatLevel: 'NONE',
        detectedObjects: ['pedestrians', 'vehicles'],
        description: 'Mock mode: No real analysis. Configure GEMINI_API_KEY for live AI threat detection.',
        recommendedAction: 'No action required.',
        confidence: 0,
      };
    }

    const prompt = `You are an AI security analyst for a building management system. 
    Analyze this security camera frame (Camera ID: ${cameraId}) for potential threats.
    
    Look for:
    - Firearms or weapons
    - Suspicious packages or objects
    - Unusual crowd behavior or gathering
    - Unauthorized access attempts
    - Perimeter breaches
    - Masked individuals in restricted zones
    - Vehicles parked in restricted areas
    - Smoke, fire, or explosions
    
    Respond ONLY with a JSON object in this exact structure:
    {
      "threatDetected": boolean,
      "threatLevel": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "detectedObjects": ["object1", "object2"],
      "description": "Brief description of what is visible",
      "recommendedAction": "Specific action for security personnel",
      "confidence": 0-100
    }`;

    try {
      let contents: any;

      if (imageBase64OrUrl.startsWith('http')) {
        // Public URL (for IP cameras that expose JPEG snapshots)
        contents = [
          { text: prompt },
          { inlineData: { 
              mimeType: 'image/jpeg',
              // Fetch and convert URL to base64
              data: await fetch(imageBase64OrUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b).toString('base64'))
            }
          }
        ];
      } else {
        // Base64 image
        const mimeMatch = imageBase64OrUrl.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64Data = imageBase64OrUrl.replace(/^data:[^;]+;base64,/, '');
        contents = [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { responseMimeType: 'application/json' }
      });

      const result: ThreatAnalysisResult = JSON.parse(response.text || '{}');

      // Emit socket alert if threat detected
      if (result.threatDetected && (global as any).io) {
        const icon = result.threatLevel === 'CRITICAL' ? '🚨' : result.threatLevel === 'HIGH' ? '⚠️' : '🔔';
        (global as any).io.emit('new_notification', {
          icon,
          message: `AI Camera Alert [${cameraId}]: ${result.description} — Action: ${result.recommendedAction}`,
        });
      }

      return result;
    } catch (error: any) {
      console.error('ThreatDetectionService.analyzeFrame error:', error);
      throw new Error(`AI threat analysis failed: ${error.message}`);
    }
  }

  /**
   * Fetch a JPEG snapshot from an HTTP/MJPEG IP camera URL.
   * Returns base64 string for further analysis.
   */
  static async captureSnapshot(cameraUrl: string): Promise<string> {
    const res = await fetch(cameraUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Camera fetch failed: ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  }
}


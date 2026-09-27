export class TurnstileService {
  static async triggerRelay(gateIp: string, direction: 'IN' | 'OUT'): Promise<boolean> {
    try {
      console.log(`[IoT TURNSTILE] Sending OPEN command to physical gate at ${gateIp} (Direction: ${direction})`);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    } catch (error) {
      return false;
    }
  }
}
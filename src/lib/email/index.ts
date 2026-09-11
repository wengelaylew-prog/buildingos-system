interface EmailProvider {
  send(to: string, subject: string, text: string, html?: string): Promise<boolean>;
}

class MockEmailProvider implements EmailProvider {
  async send(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Text: ${text}`);
    return true;
  }
}

export function getEmailProvider(): EmailProvider {
  // Always use mock provider since we don't have a real email provider configured yet
  return new MockEmailProvider();
}


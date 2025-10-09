import type { EmailAdapter, EmailParams } from "./adapter";

/**
 * Mock email adapter for development and testing
 * Logs emails to console instead of sending them
 */
export class MockEmailAdapter implements EmailAdapter {
  private sentEmails: EmailParams[] = [];

  async send(params: EmailParams): Promise<void> {
    console.log("📧 [Mock Email] Sending email:", {
      to: params.to,
      subject: params.subject,
      from: params.from || "noreply@quinielas.local"
    });

    console.log("📧 [Mock Email] HTML Preview:");
    console.log(params.html.substring(0, 200) + "...");

    // Store for testing
    this.sentEmails.push(params);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Get all sent emails (for testing)
   */
  getSentEmails(): EmailParams[] {
    return this.sentEmails;
  }

  /**
   * Clear sent emails (for testing)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }
}

import type { EmailAdapter, EmailParams } from "./adapter";

/**
 * SMTP email adapter using nodemailer
 * Note: nodemailer is imported dynamically to avoid bundling issues
 */

interface SMTPConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class SMTPEmailAdapter implements EmailAdapter {
  private transporter: any;
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
  }

  private async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    // Dynamic import to avoid bundling nodemailer in all environments
    const nodemailer = await import("nodemailer");

    this.transporter = nodemailer.default.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure ?? this.config.port === 465,
      auth: this.config.auth
    });

    return this.transporter;
  }

  async send(params: EmailParams): Promise<void> {
    const transporter = await this.getTransporter();

    const mailOptions = {
      from: params.from || this.config.from,
      to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("📧 [SMTP] Email sent:", info.messageId);
    } catch (error) {
      console.error("📧 [SMTP] Failed to send email:", error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      console.log("📧 [SMTP] Connection verified");
      return true;
    } catch (error) {
      console.error("📧 [SMTP] Connection failed:", error);
      return false;
    }
  }
}

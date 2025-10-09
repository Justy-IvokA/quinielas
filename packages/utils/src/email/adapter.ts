/**
 * Email adapter interface
 * Provides abstraction for sending emails via different providers
 */

export interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailAdapter {
  send(params: EmailParams): Promise<void>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

import type { EmailAdapter } from "./adapter";
import { MockEmailAdapter } from "./mock";
import { SMTPEmailAdapter } from "./smtp";

export * from "./adapter";
export * from "./mock";
export * from "./smtp";

/**
 * Get email adapter based on environment configuration
 */
export function getEmailAdapter(config: {
  provider: "mock" | "smtp";
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
}): EmailAdapter {
  if (config.provider === "smtp") {
    if (!config.smtp) {
      throw new Error("SMTP configuration is required when provider is 'smtp'");
    }

    return new SMTPEmailAdapter({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      },
      from: config.smtp.from
    });
  }

  // Default to mock
  return new MockEmailAdapter();
}

/**
 * Email templates
 */
export const emailTemplates = {
  invitation: (params: { poolName: string; inviteUrl: string; expiresAt: Date }) => ({
    subject: `You're invited to join ${params.poolName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
            </div>
            <div class="content">
              <p>You've been invited to join <strong>${params.poolName}</strong>.</p>
              <p>Click the button below to accept your invitation and start making predictions:</p>
              <p style="text-align: center;">
                <a href="${params.inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p><small>This invitation expires on ${params.expiresAt.toLocaleDateString()}.</small></p>
              <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${params.inviteUrl}</small></p>
            </div>
            <div class="footer">
              <p>Quinielas WL - Sports Prediction Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `You've been invited to join ${params.poolName}.\n\nAccept your invitation: ${params.inviteUrl}\n\nThis invitation expires on ${params.expiresAt.toLocaleDateString()}.`
  }),

  inviteCode: (params: { poolName: string; code: string; poolUrl: string }) => ({
    subject: `Your invite code for ${params.poolName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; padding: 15px; background: white; border: 2px dashed #0ea5e9; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Invite Code</h1>
            </div>
            <div class="content">
              <p>Use this code to join <strong>${params.poolName}</strong>:</p>
              <div class="code">${params.code}</div>
              <p style="text-align: center;">
                <a href="${params.poolUrl}" class="button">Join Pool</a>
              </p>
            </div>
            <div class="footer">
              <p>Quinielas WL - Sports Prediction Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Your invite code for ${params.poolName}: ${params.code}\n\nJoin the pool: ${params.poolUrl}`
  })
};

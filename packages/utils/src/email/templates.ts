import type {
  EmailTemplate,
  InvitationEmailParams,
  InviteCodeEmailParams,
  MagicLinkEmailParams,
} from "./types";
import { getEmailTranslations, replacePlaceholders } from "./translations";

/**
 * Base HTML structure for all email templates
 * Modern, responsive design with brand colors
 */
function createEmailHtml(params: {
  title: string;
  preheader: string;
  brandName: string;
  brandLogoUrl?: string;
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  mutedColor: string;
  borderColor: string;
  content: string;
  footerText: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
  </style>
  <![endif]-->
  <title>${params.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${params.foregroundColor};
      background-color: ${params.mutedColor};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-wrapper {
      width: 100%;
      background-color: ${params.mutedColor};
      padding: 40px 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${params.backgroundColor};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .email-header {
      background: linear-gradient(135deg, ${params.primaryColor} 0%, ${adjustColorBrightness(params.primaryColor, -20)} 100%);
      padding: 40px 32px;
      text-align: center;
    }
    
    .email-logo {
      max-width: 180px;
      height: auto;
      margin-bottom: 16px;
    }
    
    .email-header h1 {
      color: ${params.primaryForeground};
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .email-body {
      padding: 40px 32px;
    }
    
    .email-body p {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.6;
      color: ${params.foregroundColor};
    }
    
    .email-body strong {
      font-weight: 600;
      color: ${params.primaryColor};
    }
    
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    
    .button {
      display: inline-block;
      padding: 16px 32px;
      background-color: ${params.primaryColor};
      color: ${params.primaryForeground} !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .button:hover {
      background-color: ${adjustColorBrightness(params.primaryColor, -10)};
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
    
    .info-box {
      background-color: ${params.mutedColor};
      border-left: 4px solid ${params.primaryColor};
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 6px;
    }
    
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: ${adjustColorBrightness(params.foregroundColor, 20)};
    }
    
    .code-box {
      background-color: ${params.backgroundColor};
      border: 2px dashed ${params.primaryColor};
      padding: 24px;
      margin: 24px 0;
      border-radius: 8px;
      text-align: center;
    }
    
    .code-text {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: ${params.primaryColor};
      font-family: 'Courier New', monospace;
    }
    
    .link-text {
      word-break: break-all;
      color: ${params.primaryColor};
      font-size: 14px;
      margin-top: 16px;
    }
    
    .email-footer {
      background-color: ${params.mutedColor};
      padding: 32px;
      text-align: center;
      border-top: 1px solid ${params.borderColor};
    }
    
    .email-footer p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: ${adjustColorBrightness(params.foregroundColor, 40)};
    }
    
    .brand-name {
      font-weight: 600;
      color: ${params.primaryColor};
    }
    
    .divider {
      height: 1px;
      background-color: ${params.borderColor};
      margin: 24px 0;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .email-header {
        padding: 32px 24px;
      }
      
      .email-header h1 {
        font-size: 24px;
      }
      
      .email-body {
        padding: 32px 24px;
      }
      
      .button {
        padding: 14px 28px;
        font-size: 15px;
      }
      
      .code-text {
        font-size: 24px;
        letter-spacing: 2px;
      }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0; overflow: hidden;">${params.preheader}</div>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        ${params.brandLogoUrl ? `<img src="${params.brandLogoUrl}" alt="${params.brandName}" class="email-logo">` : ''}
        <h1>${params.title}</h1>
      </div>
      <div class="email-body">
        ${params.content}
      </div>
      <div class="email-footer">
        <p>${params.footerText}</p>
        <p><span class="brand-name">${params.brandName}</span></p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Adjust color brightness (simple hex color adjustment)
 */
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + (r * percent) / 100));
  g = Math.max(0, Math.min(255, g + (g * percent) / 100));
  b = Math.max(0, Math.min(255, b + (b * percent) / 100));
  
  // Convert back to hex
  const rr = Math.round(r).toString(16).padStart(2, '0');
  const gg = Math.round(g).toString(16).padStart(2, '0');
  const bb = Math.round(b).toString(16).padStart(2, '0');
  
  return `#${rr}${gg}${bb}`;
}

/**
 * Create invitation email template
 */
export function createInvitationEmail(params: InvitationEmailParams): EmailTemplate {
  const t = getEmailTranslations(params.locale);
  const dateStr = params.expiresAt.toLocaleDateString(
    params.locale === "es-MX" ? "es-MX" : "en-US",
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  
  const subject = replacePlaceholders(t.invitation.subject, {
    poolName: params.poolName,
    brandName: params.brand.name
  });
  
  const content = `
    <p>${t.invitation.greeting}</p>
    <p>${replacePlaceholders(t.invitation.body, { poolName: params.poolName })}</p>
    <div class="button-container">
      <a href="${params.inviteUrl}" class="button">${t.invitation.button}</a>
    </div>
    <div class="info-box">
      <p><strong>${replacePlaceholders(t.invitation.expiresNote, { date: dateStr })}</strong></p>
    </div>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #6b7280;">${t.invitation.linkNote}</p>
    <p class="link-text">${params.inviteUrl}</p>
  `;
  
  const html = createEmailHtml({
    title: t.invitation.title,
    preheader: replacePlaceholders(t.invitation.body, { poolName: params.poolName }),
    brandName: params.brand.name,
    brandLogoUrl: params.brand.logoUrl,
    primaryColor: params.brand.colors.primary,
    primaryForeground: params.brand.colors.primaryForeground,
    backgroundColor: params.brand.colors.background,
    foregroundColor: params.brand.colors.foreground,
    mutedColor: params.brand.colors.muted,
    borderColor: params.brand.colors.border,
    content,
    footerText: t.invitation.footer
  });
  
  const text = `
${t.invitation.greeting}

${replacePlaceholders(t.invitation.body, { poolName: params.poolName })}

${t.invitation.button}: ${params.inviteUrl}

${replacePlaceholders(t.invitation.expiresNote, { date: dateStr })}

${params.brand.name}
${t.invitation.footer}
  `.trim();
  
  return { subject, html, text };
}

/**
 * Create invite code email template
 */
export function createInviteCodeEmail(params: InviteCodeEmailParams): EmailTemplate {
  const t = getEmailTranslations(params.locale);
  
  const subject = replacePlaceholders(t.inviteCode.subject, {
    poolName: params.poolName,
    brandName: params.brand.name
  });
  
  const content = `
    <p>${replacePlaceholders(t.inviteCode.body, { poolName: params.poolName })}</p>
    <div class="code-box">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${params.brand.colors.foreground};">${t.inviteCode.codeLabel}</p>
      <div class="code-text">${params.code}</div>
    </div>
    <div class="button-container">
      <a href="${params.poolUrl}" class="button">${t.inviteCode.button}</a>
    </div>
  `;
  
  const html = createEmailHtml({
    title: t.inviteCode.title,
    preheader: replacePlaceholders(t.inviteCode.body, { poolName: params.poolName }),
    brandName: params.brand.name,
    brandLogoUrl: params.brand.logoUrl,
    primaryColor: params.brand.colors.primary,
    primaryForeground: params.brand.colors.primaryForeground,
    backgroundColor: params.brand.colors.background,
    foregroundColor: params.brand.colors.foreground,
    mutedColor: params.brand.colors.muted,
    borderColor: params.brand.colors.border,
    content,
    footerText: t.inviteCode.footer
  });
  
  const text = `
${t.inviteCode.title}

${replacePlaceholders(t.inviteCode.body, { poolName: params.poolName })}

${t.inviteCode.codeLabel}: ${params.code}

${t.inviteCode.button}: ${params.poolUrl}

${params.brand.name}
${t.inviteCode.footer}
  `.trim();
  
  return { subject, html, text };
}

/**
 * Create magic link email template
 */
export function createMagicLinkEmail(params: MagicLinkEmailParams): EmailTemplate {
  const t = getEmailTranslations(params.locale);
  
  const subject = replacePlaceholders(t.magicLink.subject, {
    brandName: params.brand.name
  });
  
  const content = `
    <p>${t.magicLink.greeting}</p>
    <p>${t.magicLink.body}</p>
    <div class="button-container">
      <a href="${params.url}" class="button">${t.magicLink.button}</a>
    </div>
    <div class="info-box">
      <p><strong>${t.magicLink.expiresNote}</strong></p>
    </div>
    <div class="divider"></div>
    <p style="font-size: 14px; color: #6b7280;">${t.magicLink.securityNote}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">${t.magicLink.linkNote}</p>
    <p class="link-text">${params.url}</p>
  `;
  
  const html = createEmailHtml({
    title: t.magicLink.title,
    preheader: t.magicLink.body,
    brandName: params.brand.name,
    brandLogoUrl: params.brand.logoUrl,
    primaryColor: params.brand.colors.primary,
    primaryForeground: params.brand.colors.primaryForeground,
    backgroundColor: params.brand.colors.background,
    foregroundColor: params.brand.colors.foreground,
    mutedColor: params.brand.colors.muted,
    borderColor: params.brand.colors.border,
    content,
    footerText: t.magicLink.footer
  });
  
  const text = `
${t.magicLink.greeting}

${t.magicLink.body}

${t.magicLink.button}: ${params.url}

${t.magicLink.expiresNote}

${t.magicLink.securityNote}

${params.brand.name}
${t.magicLink.footer}
  `.trim();
  
  return { subject, html, text };
}

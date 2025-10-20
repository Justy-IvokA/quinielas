/**
 * Email templates for invitations
 * Supports multiple locales (es-MX, en-US)
 */

interface InvitationEmailParams {
  poolName: string;
  brandName: string;
  invitationUrl: string;
  locale?: string;
}

const translations = {
  "es-MX": {
    subject: "Invitación a {poolName}",
    title: "Estás Invitado a {poolName}",
    intro: "Has sido invitado a unirte a <strong>{poolName}</strong> en {brandName}!",
    cta: "Haz clic en el botón para registrarte y comenzar a hacer tus predicciones:",
    button: "Aceptar Invitación",
    expiry: "Este enlace de invitación es único para ti y expirará en 7 días.",
    ignore: "Si no esperabas esta invitación, puedes ignorar este correo de forma segura.",
    fallback: "Si el botón no funciona, copia y pega este enlace en tu navegador:",
    footer: "{brandName} - Powered by Quinielas WL"
  },
  "en-US": {
    subject: "Invitation to {poolName}",
    title: "You're Invited to {poolName}",
    intro: "You've been invited to join <strong>{poolName}</strong> on {brandName}!",
    cta: "Click the button below to register and start making your predictions:",
    button: "Accept Invitation",
    expiry: "This invitation link is unique to you and will expire in 7 days.",
    ignore: "If you didn't expect this invitation, you can safely ignore this email.",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    footer: "{brandName} - Powered by Quinielas WL"
  }
};

function replaceVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

export function getInvitationEmailSubject(params: InvitationEmailParams): string {
  const locale = params.locale || "es-MX";
  const t = translations[locale as keyof typeof translations] || translations["es-MX"];
  return replaceVars(t.subject, { poolName: params.poolName });
}

export function getInvitationEmailHtml(params: InvitationEmailParams): string {
  const locale = params.locale || "es-MX";
  const t = translations[locale as keyof typeof translations] || translations["es-MX"];
  
  const vars = {
    poolName: params.poolName,
    brandName: params.brandName,
    invitationUrl: params.invitationUrl
  };

  return `
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
            <h1>${replaceVars(t.title, vars)}</h1>
          </div>
          <div class="content">
            <p>${replaceVars(t.intro, vars)}</p>
            <p>${t.cta}</p>
            <p style="text-align: center;">
              <a href="${params.invitationUrl}" class="button">${t.button}</a>
            </p>
            <p><small>${t.expiry}</small></p>
            <p><small>${t.ignore}</small></p>
            <p><small>${t.fallback}<br>${params.invitationUrl}</small></p>
          </div>
          <div class="footer">
            <p>${replaceVars(t.footer, vars)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getInvitationEmailText(params: InvitationEmailParams): string {
  const locale = params.locale || "es-MX";
  const t = translations[locale as keyof typeof translations] || translations["es-MX"];
  
  const vars = {
    poolName: params.poolName,
    brandName: params.brandName
  };

  return `${replaceVars(t.title, vars)}

${replaceVars(t.intro, vars).replace(/<\/?strong>/g, "")}

${t.cta}

${params.invitationUrl}

${t.expiry}
${t.ignore}`;
}

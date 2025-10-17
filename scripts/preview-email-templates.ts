/**
 * Script to preview email templates
 * Generates HTML files that can be opened in a browser
 * 
 * Usage:
 *   pnpm tsx scripts/preview-email-templates.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { emailTemplates, createEmailBrandInfo } from "../packages/utils/src/email";

// Create output directory
const outputDir = join(process.cwd(), "email-previews");
try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {
  // Directory already exists
}

console.log("📧 Generating email template previews...\n");

// Brand examples
const brands = [
  {
    name: "Coca-Cola",
    logoUrl: "https://via.placeholder.com/180x60/FF0000/FFFFFF?text=Coca-Cola",
    colors: {
      primary: "#FF0000",
      primaryForeground: "#FFFFFF",
      background: "#FFFFFF",
      foreground: "#000000",
      muted: "#F5F5F5",
      border: "#E0E0E0",
    }
  },
  {
    name: "Pepsi",
    logoUrl: "https://via.placeholder.com/180x60/004B93/FFFFFF?text=Pepsi",
    colors: {
      primary: "#004B93",
      primaryForeground: "#FFFFFF",
      background: "#FFFFFF",
      foreground: "#000000",
      muted: "#F0F4F8",
      border: "#D1E0F0",
    }
  },
  {
    name: "Nike",
    logoUrl: "https://via.placeholder.com/180x60/000000/FFFFFF?text=Nike",
    colors: {
      primary: "#000000",
      primaryForeground: "#FFFFFF",
      background: "#FFFFFF",
      foreground: "#111111",
      muted: "#F5F5F5",
      border: "#E5E5E5",
    }
  }
];

// Generate templates for each brand
brands.forEach((brandData) => {
  const brandInfo = createEmailBrandInfo(brandData);
  const brandSlug = brandData.name.toLowerCase().replace(/\s+/g, "-");

  console.log(`\n🎨 Generating templates for ${brandData.name}...`);

  // 1. Invitation Email (Spanish)
  const invitationES = emailTemplates.invitation({
    brand: brandInfo,
    locale: "es-MX",
    poolName: "Mundial FIFA 2026",
    inviteUrl: `https://${brandSlug}.quinielas.mx/es-MX/pools/mundial-2026/join?token=abc123xyz`,
    expiresAt: new Date("2026-06-01")
  });

  const filenameES = join(outputDir, `${brandSlug}-invitation-es.html`);
  writeFileSync(filenameES, invitationES.html);
  console.log(`  ✅ Invitation (ES): ${filenameES}`);

  // 2. Invitation Email (English)
  const invitationEN = emailTemplates.invitation({
    brand: brandInfo,
    locale: "en-US",
    poolName: "FIFA World Cup 2026",
    inviteUrl: `https://${brandSlug}.quinielas.mx/en-US/pools/mundial-2026/join?token=abc123xyz`,
    expiresAt: new Date("2026-06-01")
  });

  const filenameEN = join(outputDir, `${brandSlug}-invitation-en.html`);
  writeFileSync(filenameEN, invitationEN.html);
  console.log(`  ✅ Invitation (EN): ${filenameEN}`);

  // 3. Invite Code Email (Spanish)
  const inviteCodeES = emailTemplates.inviteCode({
    brand: brandInfo,
    locale: "es-MX",
    poolName: "Mundial FIFA 2026",
    code: `${brandSlug.toUpperCase().slice(0, 4)}2026`,
    poolUrl: `https://${brandSlug}.quinielas.mx/es-MX/pools/mundial-2026`
  });

  const filenameCodeES = join(outputDir, `${brandSlug}-invite-code-es.html`);
  writeFileSync(filenameCodeES, inviteCodeES.html);
  console.log(`  ✅ Invite Code (ES): ${filenameCodeES}`);

  // 4. Invite Code Email (English)
  const inviteCodeEN = emailTemplates.inviteCode({
    brand: brandInfo,
    locale: "en-US",
    poolName: "FIFA World Cup 2026",
    code: `${brandSlug.toUpperCase().slice(0, 4)}2026`,
    poolUrl: `https://${brandSlug}.quinielas.mx/en-US/pools/mundial-2026`
  });

  const filenameCodeEN = join(outputDir, `${brandSlug}-invite-code-en.html`);
  writeFileSync(filenameCodeEN, inviteCodeEN.html);
  console.log(`  ✅ Invite Code (EN): ${filenameCodeEN}`);

  // 5. Magic Link Email (Spanish)
  const magicLinkES = emailTemplates.magicLink({
    brand: brandInfo,
    locale: "es-MX",
    email: "usuario@example.com",
    url: `https://${brandSlug}.quinielas.mx/api/auth/callback/email?token=xyz789abc`
  });

  const filenameMagicES = join(outputDir, `${brandSlug}-magic-link-es.html`);
  writeFileSync(filenameMagicES, magicLinkES.html);
  console.log(`  ✅ Magic Link (ES): ${filenameMagicES}`);

  // 6. Magic Link Email (English)
  const magicLinkEN = emailTemplates.magicLink({
    brand: brandInfo,
    locale: "en-US",
    email: "user@example.com",
    url: `https://${brandSlug}.quinielas.mx/api/auth/callback/email?token=xyz789abc`
  });

  const filenameMagicEN = join(outputDir, `${brandSlug}-magic-link-en.html`);
  writeFileSync(filenameMagicEN, magicLinkEN.html);
  console.log(`  ✅ Magic Link (EN): ${filenameMagicEN}`);
});

// Generate index.html for easy navigation
const indexHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Templates Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 16px;
      font-size: 36px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .subtitle {
      color: rgba(255,255,255,0.9);
      text-align: center;
      margin-bottom: 40px;
      font-size: 18px;
    }
    
    .brand-section {
      background: white;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    
    .brand-section h2 {
      color: #1a202c;
      margin-bottom: 24px;
      font-size: 28px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 12px;
    }
    
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .template-card {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.2s ease;
    }
    
    .template-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }
    
    .template-card h3 {
      color: #2d3748;
      margin-bottom: 8px;
      font-size: 18px;
    }
    
    .template-card p {
      color: #718096;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .template-card a {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s ease;
    }
    
    .template-card a:hover {
      background: #5568d3;
    }
    
    .locale-badge {
      display: inline-block;
      background: #edf2f7;
      color: #4a5568;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    
    .footer {
      text-align: center;
      color: rgba(255,255,255,0.8);
      margin-top: 40px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email Templates Preview</h1>
    <p class="subtitle">Templates modernos con branding personalizado e i18n</p>
    
    ${brands.map(brand => {
      const brandSlug = brand.name.toLowerCase().replace(/\s+/g, "-");
      return `
        <div class="brand-section">
          <h2>${brand.name}</h2>
          <div class="templates-grid">
            <div class="template-card">
              <h3>Invitación <span class="locale-badge">ES</span></h3>
              <p>Email de invitación a un pool en español</p>
              <a href="${brandSlug}-invitation-es.html" target="_blank">Ver Preview</a>
            </div>
            
            <div class="template-card">
              <h3>Invitation <span class="locale-badge">EN</span></h3>
              <p>Pool invitation email in English</p>
              <a href="${brandSlug}-invitation-en.html" target="_blank">View Preview</a>
            </div>
            
            <div class="template-card">
              <h3>Código de Invitación <span class="locale-badge">ES</span></h3>
              <p>Email con código de acceso en español</p>
              <a href="${brandSlug}-invite-code-es.html" target="_blank">Ver Preview</a>
            </div>
            
            <div class="template-card">
              <h3>Invite Code <span class="locale-badge">EN</span></h3>
              <p>Access code email in English</p>
              <a href="${brandSlug}-invite-code-en.html" target="_blank">View Preview</a>
            </div>
            
            <div class="template-card">
              <h3>Magic Link <span class="locale-badge">ES</span></h3>
              <p>Email de autenticación en español</p>
              <a href="${brandSlug}-magic-link-es.html" target="_blank">Ver Preview</a>
            </div>
            
            <div class="template-card">
              <h3>Magic Link <span class="locale-badge">EN</span></h3>
              <p>Authentication email in English</p>
              <a href="${brandSlug}-magic-link-en.html" target="_blank">View Preview</a>
            </div>
          </div>
        </div>
      `;
    }).join('')}
    
    <div class="footer">
      <p>Quinielas WL - Email Templates System</p>
      <p>Generado el ${new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>
  </div>
</body>
</html>
`;

const indexPath = join(outputDir, "index.html");
writeFileSync(indexPath, indexHtml);

console.log("\n" + "=".repeat(60));
console.log("✅ Email templates generated successfully!");
console.log("=".repeat(60));
console.log(`\n📂 Output directory: ${outputDir}`);
console.log(`🌐 Open in browser: file://${indexPath}\n`);
console.log("Templates generated:");
console.log(`  - ${brands.length * 6} HTML files (3 templates × 2 locales × ${brands.length} brands)`);
console.log(`  - 1 index.html for easy navigation\n`);

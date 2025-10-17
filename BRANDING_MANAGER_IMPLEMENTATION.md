# Branding Manager Implementation

## Overview
Complete implementation of the Branding Manager page at `/branding` in the admin app. Allows tenant admins to configure brand appearance including colors, logos, hero assets, main card media, and typography with live preview.

## Implementation Summary

### 1. Schema & Validation (`packages/branding/src/schema.ts`)
- **BrandTheme Schema**: Complete Zod schema with validation for:
  - Colors (hex/HSL format with auto-conversion)
  - Logo and logotype (URL validation, alt text)
  - Hero assets (image/video/none with overlay, autoplay options)
  - Main card media (image/video/none)
  - Typography (font families, base size, line height)
- **Security**: URL sanitization to prevent `javascript:` and unsafe `data:` URIs
- **File Validation**: MIME type and size limits (images ≤2MB, videos ≤20MB)

### 2. Storage Adapter (`packages/utils/src/storage/adapter.ts`)
Multi-provider storage abstraction supporting:
- **Local**: File system storage for development
- **Cloudinary**: Cloud-based media management
- **Firebase Storage**: Google Cloud Storage integration
- **S3**: AWS S3 and S3-compatible services

**Features**:
- Automatic file key generation with timestamps
- Content type validation
- Size limit enforcement
- Public URL generation

**Configuration** (via environment variables):
```env
STORAGE_PROVIDER=local|cloudinary|firebase|s3
# Local
STORAGE_LOCAL_PATH=./public/uploads
STORAGE_LOCAL_BASE_URL=/uploads
# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
# Firebase
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_CREDENTIALS={"type":"service_account",...}
# S3
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
```

### 3. API Router (`packages/api/src/routers/branding/index.ts`)
**Procedures**:
- `getCurrentBrand()`: Get current tenant's brand (any authenticated user)
- `updateBrandTheme(theme)`: Update brand theme (TENANT_ADMIN only)
- `uploadMedia(kind, file)`: Upload logo/hero/mainCard media (TENANT_ADMIN only)
- `getBrandById(id)`: Get specific brand by ID
- `resetTheme()`: Reset to default theme (TENANT_ADMIN only)

**Security**:
- RBAC via `requireTenantAdmin` middleware
- Tenant scoping (no cross-tenant access)
- Audit logging for all mutations
- File validation on server side

### 4. Contrast Checker (`packages/branding/src/contrast.ts`)
- **WCAG Compliance**: Checks contrast ratios for AA/AAA standards
- **Auto Dark Theme**: Generates dark theme colors from light theme
- **Warnings**: Advisory messages for low contrast combinations

### 5. UI Components

#### Main Page (`apps/admin/app/[locale]/(authenticated)/branding/page.tsx`)
- Two-column layout: form editor (left) + live preview (right)
- Real-time preview updates
- Loading and error states
- RBAC enforcement (only TENANT_ADMIN can access)

#### Branding Form (`components/branding-form.tsx`)
Tabbed interface with:
- **Colors Tab**: Color inputs with presets, contrast warnings
- **Logo Tab**: Upload/URL for logo and logotype with preview
- **Hero Tab**: Image/video selection with overlay and playback options
- **Main Card Tab**: Similar to hero for card media
- **Typography Tab**: Font selection with live preview

**Actions**:
- Save (persists to database)
- Reset (confirmation dialog)
- Copy JSON (for debugging)

#### Live Preview (`components/branding-preview.tsx`)
- Light/dark mode toggle
- Hero section preview
- Logo display
- Main card with media
- Color swatches
- Applies theme via CSS variables in real-time

### 6. Internationalization
Complete Spanish (es-MX) translations in `apps/admin/messages/es-MX.json`:
- Form labels and descriptions
- Tab names
- Upload hints and guidelines
- Success/error messages
- Preview content

### 7. Database Updates (`packages/db/src/seed.ts`)
Updated seed data to use new BrandTheme schema:
- Converted hex colors to HSL format
- Added logo, heroAssets, mainCard, typography objects
- Updated both Innotecnia (agency) and Ivoka (customer) themes

## File Structure
```
packages/
├── branding/src/
│   ├── schema.ts          # Zod schemas and validation
│   ├── contrast.ts        # WCAG contrast checker
│   ├── colorUtils.ts      # Color conversion utilities
│   └── resolveTheme.ts    # Theme resolution and CSS generation
├── utils/src/storage/
│   └── adapter.ts         # Storage abstraction layer
└── api/src/routers/
    └── branding/
        └── index.ts       # tRPC router

apps/admin/app/[locale]/(authenticated)/branding/
├── page.tsx               # Main branding page
└── components/
    ├── branding-form.tsx  # Form container with tabs
    ├── branding-preview.tsx # Live preview component
    └── tabs/
        ├── colors-tab.tsx
        ├── logo-tab.tsx
        ├── hero-tab.tsx
        ├── main-card-tab.tsx
        └── typography-tab.tsx
```

## Usage

### Accessing the Page
1. Navigate to `/branding` in the admin app
2. Must be authenticated as TENANT_ADMIN or SUPERADMIN
3. Automatically loads current tenant's brand

### Updating Colors
1. Go to **Colors** tab
2. Use color picker or enter HSL/hex values
3. Apply presets for quick themes
4. Watch for contrast warnings
5. Preview updates in real-time
6. Click **Save** to persist

### Uploading Media
1. Go to **Logo**, **Hero**, or **Main Card** tab
2. Choose file or enter URL
3. For videos: upload poster image, set playback options
4. Preview appears immediately
5. Click **Save** to persist

### Typography
1. Go to **Typography** tab
2. Select font family (presets or custom)
3. Set base size and line height
4. Preview shows live rendering
5. For Google Fonts: add `<link>` tag to app

### Resetting Theme
1. Click **Reset** button
2. Confirm action (irreversible)
3. Theme reverts to defaults

## Testing Checklist

### Unit Tests
- [ ] Zod schema validation (valid/invalid inputs)
- [ ] Color conversion (hex to HSL)
- [ ] Contrast checker (AA/AAA compliance)
- [ ] Storage adapter (file validation, size limits)

### Integration Tests
- [ ] `updateBrandTheme` persists correctly
- [ ] `uploadMedia` returns valid URL
- [ ] RBAC blocks non-admins
- [ ] Tenant scoping prevents cross-tenant access

### UI Tests
- [ ] Live preview updates on color change
- [ ] File upload shows loading state
- [ ] Save button triggers mutation
- [ ] Reset confirmation dialog works
- [ ] Contrast warnings appear for low contrast
- [ ] Light/dark mode toggle works

### E2E Tests (Playwright)
- [ ] Login as TENANT_ADMIN
- [ ] Navigate to /branding
- [ ] Update colors and save
- [ ] Upload logo
- [ ] Reset theme
- [ ] Verify changes persist after refresh

## Security Considerations

1. **URL Validation**: All URLs validated to prevent XSS
2. **File Validation**: MIME type and size checked server-side
3. **RBAC**: Only TENANT_ADMIN can modify
4. **Tenant Scoping**: No cross-tenant data access
5. **Audit Logging**: All changes logged with actor, IP, timestamp
6. **Rate Limiting**: Apply rate limits to upload endpoints (recommended)

## Performance Notes

1. **File Uploads**: Base64 encoding increases payload size by ~33%
   - Consider direct S3 uploads with presigned URLs for production
2. **Preview Rendering**: CSS variables injected via `<style>` tag
   - Minimal performance impact
3. **Image Optimization**: Recommend CDN with automatic optimization

## Future Enhancements

1. **Advanced Features**:
   - Custom CSS injection (with sanitization)
   - Font file uploads
   - Multiple brand variants per tenant
   - A/B testing themes

2. **UX Improvements**:
   - Drag-and-drop file upload
   - Color palette generator from image
   - Accessibility score dashboard
   - Theme templates marketplace

3. **Developer Experience**:
   - Theme export/import (JSON)
   - Version history and rollback
   - Theme preview on public site before publishing

## Troubleshooting

### Upload Fails
- Check file size (images ≤2MB, videos ≤20MB)
- Verify MIME type is allowed
- Check storage provider configuration
- Review server logs for detailed errors

### Preview Not Updating
- Ensure form state is syncing correctly
- Check browser console for errors
- Verify CSS variables are being applied

### Colors Look Wrong
- Confirm HSL format: `h s% l%` (e.g., `221 83% 53%`)
- Check contrast warnings
- Test in both light and dark modes

### RBAC Issues
- Verify user has TENANT_ADMIN or SUPERADMIN role
- Check tenant context is set correctly
- Review middleware logs

## Related Documentation
- `.windsurfrules` - Project conventions
- `SCHEMA_ALIGNMENT_SUMMARY.md` - Database schema
- `AUTH_ARCHITECTURE.md` - Authentication and RBAC
- `THEMING_AND_TOAST.md` - Theming system
- `I18N_IMPLEMENTATION.md` - Internationalization

## API Reference

### tRPC Endpoints

```typescript
// Get current brand
const brand = await trpc.branding.getCurrentBrand.query();

// Update theme
await trpc.branding.updateBrandTheme.mutate({
  theme: {
    colors: { primary: "221 83% 53%", ... },
    logo: { url: "...", alt: "..." },
    ...
  }
});

// Upload media
const result = await trpc.branding.uploadMedia.mutate({
  kind: "logo",
  filename: "logo.png",
  contentType: "image/png",
  size: 12345,
  data: "base64EncodedData"
});

// Reset theme
await trpc.branding.resetTheme.mutate({});
```

## Environment Setup

1. **Development** (local storage):
```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./public/uploads
STORAGE_LOCAL_BASE_URL=/uploads
```

2. **Production** (Cloudinary example):
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CLOUDINARY_FOLDER=quinielas
```

3. **Create uploads directory**:
```bash
mkdir -p public/uploads
```

4. **Run seed** to populate demo themes:
```bash
pnpm db:seed
```

## Deployment Notes

1. Ensure storage provider is configured in production environment
2. Set up CDN for uploaded media (recommended)
3. Configure CORS if using direct S3 uploads
4. Enable audit log monitoring
5. Set up alerts for failed uploads
6. Test file upload limits match server configuration

---

**Status**: ✅ Complete and ready for testing
**Version**: 1.0.0
**Last Updated**: 2025-01-13

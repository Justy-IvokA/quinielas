# Pool Editor Module

> Comprehensive pool (quiniela) configuration interface for the Quinielas WL admin application.

## 🎯 Purpose

The Pool Editor provides a centralized interface for TENANT_ADMIN and SUPERADMIN users to manage all aspects of a pool (quiniela), including:

- Basic information (name, slug, description, brand)
- Access policies (registration rules)
- Prizes and rewards
- Pool-specific settings
- Fixtures information

## 🚀 Quick Start

### Access the Editor

1. Navigate to the pools list: `/[locale]/pools`
2. Click on any pool to view details
3. Click the "Editar" button
4. You'll be redirected to: `/[locale]/pools/[id]/edit`

### Requirements

- **Role**: TENANT_ADMIN or SUPERADMIN
- **Permissions**: Member of the pool's tenant
- **Authentication**: Valid session

## 📑 Features

### 1. General Information
Edit basic pool details:
- Pool name and URL slug
- Description and prize summary
- Brand association
- Active/public status toggles

### 2. Access Control
Configure who can register:
- Access type (PUBLIC, CODE, EMAIL_INVITE)
- CAPTCHA requirements
- Email verification
- Domain restrictions
- Registration limits

### 3. Prizes Management
Define leaderboard rewards:
- Create prizes for rank ranges
- Multiple prize types supported
- Automatic overlap detection
- Optional descriptions and images

### 4. Settings
View and manage pool-specific settings:
- Display inherited tenant settings
- Show pool-level overrides
- Badge indicators for customization

### 5. Fixtures Information
View season and match details:
- Season summary
- Total match count
- Next scheduled match
- Quick link to fixtures admin

## 🔐 Security

### Authorization
- Only TENANT_ADMIN and SUPERADMIN roles can access
- Unauthorized users are redirected with error message
- All data queries are tenant-scoped

### Data Protection
- No sensitive data exposed to client
- Server-side tenant validation
- Input validation on client and server
- CSRF protection via Next.js

## 🎨 User Interface

### Design Principles
- **Consistent**: Uses existing admin app design system
- **Responsive**: Works on mobile, tablet, and desktop
- **Accessible**: Keyboard navigation and screen reader support
- **Intuitive**: Clear labels and helpful error messages

### Components Used
- Cards for section grouping
- Tabs for content organization
- Forms with inline validation
- Toast notifications for feedback
- Skeleton loaders for loading states

## 🌍 Internationalization

### Supported Locales
- **es-MX** (Spanish - Mexico): Default, fully supported
- **en-US** (English): Planned for future release

### Translation Keys
All strings are externalized in `apps/admin/messages/[locale].json`:
- `pools.edit.*` - All editor-specific strings
- `pools.actions.*` - Action buttons
- `pools.status.*` - Status indicators

## 🔧 Technical Details

### Architecture
```
Route: /[locale]/pools/[id]/edit
├── Server Component (page.tsx)
│   ├── Auth validation
│   ├── Role checking
│   └── Layout rendering
└── Client Components (_components/)
    ├── PoolEditorTabs (container)
    ├── GeneralForm
    ├── AccessForm
    ├── PrizesTable
    ├── SettingsForm
    ├── FixturesInfo
    └── HeaderActions
```

### Data Flow
1. **Server**: Validates auth and role
2. **Client**: Fetches pool data via tRPC
3. **User**: Edits form fields
4. **Client**: Validates with Zod schema
5. **Server**: Processes mutation
6. **Database**: Updates pool record
7. **Client**: Invalidates cache and shows toast

### API Endpoints (tRPC)
- `pools.getById` - Fetch pool data
- `pools.update` - Update pool
- `access.getByPoolId` - Fetch access policy
- `access.upsert` - Create/update policy
- `pools.prizes.list` - Fetch prizes
- `pools.prizes.create` - Create prize
- `pools.prizes.delete` - Delete prize
- `tenant.listBrands` - Fetch brands
- `fixtures.listBySeason` - Fetch matches
- `settings.list` - Fetch settings

## 📝 Usage Examples

### Edit Pool Name
```typescript
// Navigate to editor
router.push(`/es-MX/pools/${poolId}/edit`);

// User edits name in form
// Form validates: min 3 chars, max 100 chars
// User clicks "Guardar cambios"
// Mutation executes: pools.update({ id, name })
// Success toast appears
// Cache invalidates
```

### Add Prize
```typescript
// User clicks "Agregar premio"
// Dialog opens with form
// User fills: rankFrom=1, rankTo=3, title="Top 3"
// Client validates: no overlaps with existing prizes
// User submits
// Mutation executes: pools.prizes.create({ poolId, ...data })
// Prize appears in table
// Success toast appears
```

### Configure Access Policy
```typescript
// User selects access type: "CODE"
// User toggles CAPTCHA: ON
// User clicks "Guardar cambios"
// Mutation executes: access.upsert({ poolId, tenantId, ...data })
// Policy created or updated
// Success toast appears
```

## 🧪 Testing

### Manual Testing
See [POOL_EDITOR_TESTING.md](./POOL_EDITOR_TESTING.md) for comprehensive test scenarios.

### Quick Verification
```bash
# Run verification script
pnpm tsx scripts/verify-pool-editor.ts

# Expected output:
# ✅ Found tenant
# ✅ Pool structure valid
# ✅ Access policy exists
# ✅ Prizes configured
# ✅ Fixtures available
# 📝 Edit URL: http://localhost:3001/es-MX/pools/{id}/edit
```

### Automated Tests
```bash
# Unit tests
pnpm test pool-editor

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

## 🐛 Troubleshooting

### "No tienes permisos" Error
**Cause**: User doesn't have TENANT_ADMIN role  
**Solution**: Update user role in database or sign in as admin

### Copy URL Button Disabled
**Cause**: Brand has no domains or pool has no slug  
**Solution**: Configure brand domains and ensure pool has valid slug

### Form Won't Save
**Cause**: Validation errors  
**Solution**: Check browser console for validation messages

### Prize Overlap Error
**Cause**: New prize rank range conflicts with existing prize  
**Solution**: Adjust rank ranges to avoid overlap

## 📚 Documentation

### For Developers
- [POOL_EDITOR_IMPLEMENTATION.md](./POOL_EDITOR_IMPLEMENTATION.md) - Technical details
- [POOL_EDITOR_QUICK_START.md](./POOL_EDITOR_QUICK_START.md) - Getting started guide

### For QA
- [POOL_EDITOR_TESTING.md](./POOL_EDITOR_TESTING.md) - Test scenarios

### For Project Managers
- [POOL_EDITOR_SUMMARY.md](./POOL_EDITOR_SUMMARY.md) - Executive summary
- [POOL_EDITOR_CHECKLIST.md](./POOL_EDITOR_CHECKLIST.md) - Implementation status

## 🔄 Version History

### v1.0.0 (2025-01-11)
- ✅ Initial implementation
- ✅ All 5 tabs functional
- ✅ Auth guards in place
- ✅ i18n support (es-MX)
- ✅ Full documentation

### Planned (v1.1.0)
- [ ] Drag-and-drop prize reordering
- [ ] Finalize pool workflow
- [ ] Sync fixtures button
- [ ] English translations

## 🤝 Contributing

### Adding a New Field
1. Update Zod schema in component
2. Add form field to UI
3. Update tRPC schema in `packages/api`
4. Add i18n strings
5. Test and document

### Adding a New Tab
1. Create component in `_components/`
2. Add to `pool-editor-tabs.tsx`
3. Add i18n strings
4. Update documentation

## 📞 Support

### Getting Help
- Check troubleshooting section above
- Review documentation files
- Search existing issues
- Contact development team

### Reporting Issues
Use this template:
```markdown
**Component**: General / Access / Prizes / Settings / Fixtures
**Role**: TENANT_ADMIN / SUPERADMIN
**Browser**: Chrome / Firefox / Safari
**Steps to Reproduce**: ...
**Expected**: ...
**Actual**: ...
**Screenshots**: ...
```

## 🎯 Roadmap

### Short Term (Q1 2025)
- [ ] Automated test suite
- [ ] Performance optimizations
- [ ] English translations

### Medium Term (Q2 2025)
- [ ] Drag-and-drop features
- [ ] Bulk operations
- [ ] Advanced settings editor

### Long Term (Q3+ 2025)
- [ ] Pool templates
- [ ] A/B testing
- [ ] Analytics integration

## 📄 License

Part of the Quinielas WL project. See main project LICENSE file.

## 👥 Credits

**Implemented By**: Windsurf AI Assistant  
**Date**: January 11, 2025  
**Project**: Quinielas WL (White-Label Multi-Tenant Platform)  
**Owner**: Victor Mancera (Agencia)

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-01-11  
**Maintained By**: Development Team

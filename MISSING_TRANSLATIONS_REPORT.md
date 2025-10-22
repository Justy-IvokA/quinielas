# Missing Translations Report

## Summary
- **Source file**: `apps/admin/messages/es-MX.json` (Spanish - Mexico)
- **Target file**: `apps/admin/messages/en-US.json` (English - US)
- **Total keys in Spanish**: 1,126
- **Total keys in English**: 876
- **Missing translations**: 251

## Missing Translation Keys by Section

### Navigation & Branding
- `nav.sync`
- `nav.branding`
- `branding.tabs.textLabel`
- `branding.tabs.text.title.label`
- `branding.tabs.text.title.placeholder`
- `branding.tabs.text.title.description`
- `branding.tabs.text.description.label`
- `branding.tabs.text.description.placeholder`
- `branding.tabs.text.description.description`
- `branding.tabs.text.slogan.label`
- `branding.tabs.text.slogan.placeholder`
- `branding.tabs.text.slogan.description`
- `branding.tabs.text.paragraph.label`
- `branding.tabs.text.paragraph.placeholder`
- `branding.tabs.text.paragraph.description`
- `branding.tabs.text.link.label`
- `branding.tabs.text.link.placeholder`
- `branding.tabs.text.link.description`

### Profile Management
- `profile.title`
- `profile.accountInfo`
- `profile.verificationStatus`
- `profile.tenantMemberships`
- `profile.activeRegistrations`
- `profile.memberSince`
- `profile.lastAccess`
- `profile.predictions`
- `profile.prizesWon`
- `profile.emailVerified`
- `profile.emailNotVerified`
- `profile.phoneVerified`
- `profile.phoneNotVerified`
- `profile.verifiedOn`
- `profile.pleaseVerify`
- `profile.tenants`
- `profile.pools`
- `profile.active`
- `profile.andMore`

### System Settings
- `settings.title`
- `settings.settingsSaved`
- `settings.selectTenant`
- `settings.antiAbuse.title`
- `settings.antiAbuse.captchaLevel.label`
- `settings.antiAbuse.captchaLevel.description`
- `settings.antiAbuse.captchaLevel.off`
- `settings.antiAbuse.captchaLevel.auto`
- `settings.antiAbuse.captchaLevel.force`
- `settings.privacy.title`
- `settings.privacy.ipLogging.label`
- `settings.privacy.ipLogging.description`
- `settings.privacy.cookieBanner.label`
- `settings.privacy.cookieBanner.description`
- `settings.privacy.deviceFingerprint.label`
- `settings.privacy.deviceFingerprint.description`
- `settings.note`

### Pool Management
- `pools.list.brand`
- `pools.list.noBrand`
- `pools.list.description`
- `pools.list.registrations`
- `pools.list.prizes`

### Synchronization
- `sync.title`
- `sync.description`

### Access & Invitations
- `access.tabs.invitations`
- `access.invites.table.expires`
- `access.invites.status.EXPIRED`
- `access.invites.sentCount`
- `access.invites.noExpiration`

### Codes Management
- `codes.title`
- `codes.subtitle`
- `codes.createBatch`
- `codes.createFirst`
- `codes.noBatches`
- `codes.loading`
- `codes.wrongAccessType`
- `codes.stats.totalCodes`
- `codes.stats.unused`
- `codes.stats.used`
- `codes.stats.redemptions`
- `codes.stats.redemptionRate`
- `codes.batch.unnamed`
- `codes.batch.totalCodes`
- `codes.batch.usedCodes`
- `codes.batch.usesPerCode`
- `codes.batch.created`
- `codes.batch.prefix`
- `codes.batch.usage`
- `codes.batch.status.UNUSED`
- `codes.batch.status.PARTIALLY_USED`
- `codes.batch.status.USED`
- `codes.batch.status.EXPIRED`
- `codes.batch.status.PAUSED`
- `codes.actions.downloadCsv`
- `codes.actions.viewCodes`
- `codes.actions.pause`
- `codes.actions.unpause`
- `codes.modal.createTitle`
- `codes.modal.createDescription`
- `codes.modal.batchNameLabel`
- `codes.modal.batchNamePlaceholder`
- `codes.modal.batchNameHelp`
- `codes.modal.prefixLabel`
- `codes.modal.prefixPlaceholder`
- `codes.modal.prefixHelp`
- `codes.modal.quantityLabel`
- `codes.modal.quantityPlaceholder`
- `codes.modal.quantityHelp`
- `codes.modal.usesPerCodeLabel`
- `codes.modal.usesPerCodeHelp`
- `codes.modal.descriptionLabel`
- `codes.modal.descriptionPlaceholder`
- `codes.modal.validFromLabel`
- `codes.modal.validToLabel`
- `codes.modal.expiresAtLabel`
- `codes.modal.preview`
- `codes.modal.previewFormat`
- `codes.modal.generating`
- `codes.modal.detailsTitle`
- `codes.modal.detailsDescription`
- `codes.modal.searchPlaceholder`
- `codes.modal.exportCsv`
- `codes.modal.codeColumn`
- `codes.modal.statusColumn`
- `codes.modal.usedCountColumn`
- `codes.modal.maxUsesColumn`
- `codes.modal.expiresColumn`
- `codes.modal.redeemedByColumn`
- `codes.modal.redeemedAtColumn`
- `codes.modal.never`
- `codes.messages.createSuccess`
- `codes.messages.downloadSuccess`
- `codes.messages.pauseSuccess`
- `codes.messages.unpauseSuccess`
- `codes.messages.copySuccess`
- `codes.messages.missingData`

### Superadmin Templates
- `superadmin.templates.edit.status.DRAFT`
- `superadmin.templates.edit.status.PUBLISHED`
- `superadmin.templates.edit.status.ARCHIVED`

## Next Steps

1. **Priority Sections**: Focus on adding translations for core functionality first:
   - Profile Management (24 missing keys)
   - System Settings (14 missing keys)
   - Navigation & Branding (18 missing keys)

2. **Implementation Strategy**:
   - Add missing keys to `en-US.json` with appropriate English translations
   - Ensure proper capitalization and terminology consistency
   - Test translations in the admin interface
   - Consider hiring professional translators for critical sections

3. **Quality Assurance**:
   - Verify context and meaning of Spanish translations before creating English equivalents
   - Maintain consistent tone and terminology throughout
   - Test UI layout with new translations to ensure no breaking changes

## Files Analyzed
- Source: `apps/admin/messages/es-MX.json` (1,497 lines)
- Target: `apps/admin/messages/en-US.json` (1,164 lines)

Generated on: $(date)

# Invitations & Codes Management - Implementation Guide

## Overview
Complete implementation of admin UI for managing email invitations and invite codes for pools with EMAIL_INVITE and CODE access types.

## Status
- ✅ Backend routers exist (`packages/api/src/routers/access/index.ts`)
- ✅ Backend services exist (`packages/api/src/services/invites.service.ts`, `codes.service.ts`)
- ⚠️ Frontend pages exist but need enhancement
- ❌ Modals need to be added
- ❌ Wizard integration needed
- ❌ i18n messages needed

## File Structure

```
apps/admin/app/[locale]/(authenticated)/pools/[id]/
├── invitations/
│   ├── page.tsx                    # Main invitations page (needs enhancement)
│   └── _components/
│       ├── CreateInvitationsModal.tsx   # NEW
│       └── SendInvitationsModal.tsx     # NEW
├── codes/
│   ├── page.tsx                    # Main codes page (needs enhancement)
│   └── _components/
│       ├── CreateCodeBatchModal.tsx     # NEW
│       ├── CodeBatchDetailsModal.tsx    # NEW
│       └── CodesList.tsx                # NEW
└── new/components/steps/
    └── StepAccess.tsx              # Needs modal integration
```

## Implementation Steps

### 1. Invitations Page Enhancement

**File**: `apps/admin/app/[locale]/(authenticated)/pools/[id]/invitations/page.tsx`

**Key Changes**:
- Add tRPC queries for pool, access policy, invitations, and stats
- Add mutations for upload, send, and resend
- Add search and filter functionality
- Add bulk selection and actions
- Add modals for create and send operations

**tRPC Queries Needed**:
```typescript
const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
const { data: accessPolicy } = trpc.access.getByPoolId.useQuery({ poolId });
const { data: invitations } = trpc.access.getEmailInvitations.useQuery({ accessPolicyId });
const { data: stats } = trpc.access.invitationStats.useQuery({ poolId, tenantId });
```

**tRPC Mutations Needed**:
```typescript
const uploadCsv = trpc.access.uploadInvitationsCsv.useMutation();
const sendInvitations = trpc.access.sendInvitations.useMutation();
const resendInvitation = trpc.access.resendEmailInvitation.useMutation();
```

**Features**:
- Stats cards: Total, Sent, Opened (%), Activated (%), Bounced
- Progress bar for activation rate
- Search by email
- Filter by status (ALL, PENDING, SENT, OPENED, ACCEPTED, EXPIRED, BOUNCED)
- Bulk selection with checkboxes
- Actions: Resend, Copy Link, Send Selected
- CSV upload via file input
- Manual entry via modal (textarea with one email per line)

### 2. Codes Page Enhancement

**File**: `apps/admin/app/[locale]/(authenticated)/pools/[id]/codes/page.tsx`

**Key Changes**:
- Add tRPC queries for batches and stats
- Add mutations for create batch, pause/unpause
- Add batch details modal
- Add CSV download functionality

**tRPC Queries Needed**:
```typescript
const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
const { data: accessPolicy } = trpc.access.getByPoolId.useQuery({ poolId });
const { data: batches } = trpc.access.getCodeBatches.useQuery({ accessPolicyId });
const { data: stats } = trpc.access.codeStats.useQuery({ poolId, tenantId });
```

**tRPC Mutations Needed**:
```typescript
const createBatch = trpc.access.createCodeBatch.useMutation();
const downloadCodes = trpc.access.downloadCodes.useQuery(); // lazy query
```

**Features**:
- Stats cards: Total Codes, Unused, Used, Redemptions, Redemption Rate (%)
- Create batch modal with fields:
  - Batch name (optional)
  - Prefix (e.g., "MUNDIAL2026", max 10 chars)
  - Quantity (1-1000)
  - Max uses per code (default 1)
  - Valid from/to dates (optional)
  - Expiry date (optional)
- Batch list with:
  - Name, prefix, total/used counts, status, created date
  - Progress bar for usage
  - Actions: Download CSV, View Codes, Pause/Unpause
- Batch details modal showing all codes in batch

### 3. Create Invitations Modal

**File**: `apps/admin/app/[locale]/(authenticated)/pools/[id]/invitations/_components/CreateInvitationsModal.tsx`

```typescript
interface CreateInvitationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolId: string;
  accessPolicyId: string;
  tenantId: string;
  brandId: string;
  onSuccess: () => void;
}
```

**Features**:
- Textarea for email entry (one per line)
- Live count of valid emails
- Email validation (basic @ check)
- Submit button disabled if no valid emails
- Loading state during creation
- Success/error toasts

### 4. Create Code Batch Modal

**File**: `apps/admin/app/[locale]/(authenticated)/pools/[id]/codes/_components/CreateCodeBatchModal.tsx`

```typescript
interface CreateCodeBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessPolicyId: string;
  tenantId: string;
  onSuccess: () => void;
}
```

**Features**:
- Form fields: name, prefix, quantity, usesPerCode, validFrom, validTo, expiresAt
- Code preview: `{PREFIX}-XXXX-XXXX` format
- Validation: quantity 1-1000, prefix max 10 chars
- Progress indicator during generation
- Download CSV button on success

### 5. Wizard Integration

**File**: `apps/admin/app/[locale]/(authenticated)/pools/new/components/steps/StepAccess.tsx`

**Changes Needed**:
- When CODE is selected, show button to "Manage Codes" (opens modal or navigates after pool creation)
- When EMAIL_INVITE is selected, show button to "Manage Invitations"
- Add helper text explaining that codes/invitations can be managed after pool creation
- Consider adding a "Quick Setup" option to create initial batch/invitations during wizard

**Approach**:
Since pool doesn't exist yet during wizard, we have two options:
1. **Post-creation**: Show message "You can create codes/invitations after creating the pool"
2. **Deferred creation**: Store intent in wizard data, create codes/invitations in StepReview after pool creation

Recommended: **Option 1** (simpler, clearer UX)

### 6. CSV Utilities

**File**: `apps/admin/src/lib/csv-utils.ts` (NEW)

```typescript
export function parseEmailsCsv(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line && line.includes('@'));
}

export function generateCodesCsv(codes: Array<{
  code: string;
  status: string;
  usedCount: number;
  usesPerCode: number;
  expiresAt?: string;
}>): string {
  const headers = ['Code', 'Status', 'Used Count', 'Uses Per Code', 'Expires At'];
  const rows = codes.map(c => [
    c.code,
    c.status,
    c.usedCount.toString(),
    c.usesPerCode.toString(),
    c.expiresAt || 'Never'
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 7. i18n Messages

**File**: `apps/admin/messages/es-MX.json`

Add section:
```json
{
  "invitations": {
    "title": "Invitaciones por Email",
    "subtitle": "Gestiona las invitaciones por email para esta quiniela",
    "uploadCsv": "Subir CSV",
    "uploading": "Subiendo...",
    "createInvitations": "Crear Invitaciones",
    "createFirst": "Crear Primera Invitación",
    "noInvitations": "No se encontraron invitaciones",
    "loading": "Cargando invitaciones...",
    "searchPlaceholder": "Buscar por email...",
    "sendSelected": "Enviar Seleccionados",
    "activationProgress": "Progreso de Activación",
    "tableTitle": "Lista de Invitaciones",
    "stats": {
      "total": "Total Enviadas",
      "sent": "Entregadas",
      "opened": "Abiertas",
      "activated": "Activadas",
      "bounced": "Rebotadas"
    },
    "filters": {
      "all": "Todos",
      "pending": "Pendientes",
      "sent": "Enviadas",
      "opened": "Abiertas",
      "accepted": "Aceptadas",
      "expired": "Expiradas",
      "bounced": "Rebotadas"
    },
    "table": {
      "email": "Email",
      "status": "Estado",
      "sent": "Enviado",
      "opened": "Abierto",
      "activated": "Activado",
      "actions": "Acciones"
    },
    "modal": {
      "createTitle": "Crear Invitaciones por Email",
      "createDescription": "Ingresa direcciones de email (una por línea) o sube un archivo CSV",
      "emailsLabel": "Direcciones de Email",
      "emailsPlaceholder": "user1@example.com\nuser2@example.com\nuser3@example.com",
      "validEmailsCount": "{count} emails válidos",
      "sendTitle": "Enviar Invitaciones",
      "sendDescription": "¿Enviar {count} invitación(es)?",
      "sendAllDescription": "¿Enviar todas las invitaciones pendientes?",
      "sendNote": "Se enviarán emails de invitación a los destinatarios con un enlace único de registro."
    }
  },
  "codes": {
    "title": "Códigos de Invitación",
    "subtitle": "Gestiona lotes de códigos y rastrea canjes",
    "createBatch": "Crear Lote",
    "createFirst": "Crear Primer Lote",
    "noBatches": "No hay lotes de códigos aún",
    "loading": "Cargando lotes...",
    "stats": {
      "totalCodes": "Total de Códigos",
      "unused": "Sin Usar",
      "used": "Usados",
      "redemptions": "Canjes",
      "redemptionRate": "Tasa de Canje"
    },
    "batch": {
      "unnamed": "Lote Sin Nombre",
      "totalCodes": "Total de Códigos",
      "usedCodes": "Usados",
      "usesPerCode": "Usos por Código",
      "created": "Creado",
      "prefix": "Prefijo",
      "usage": "Uso"
    },
    "actions": {
      "downloadCsv": "Descargar CSV",
      "viewCodes": "Ver Códigos",
      "pause": "Pausar",
      "unpause": "Reanudar"
    },
    "modal": {
      "createTitle": "Crear Lote de Códigos",
      "createDescription": "Genera un nuevo lote de códigos de invitación",
      "batchNameLabel": "Nombre del Lote",
      "batchNamePlaceholder": "ej: Campaña de Lanzamiento",
      "prefixLabel": "Prefijo (opcional)",
      "prefixPlaceholder": "ej: LAUNCH",
      "quantityLabel": "Cantidad",
      "quantityPlaceholder": "100",
      "usesPerCodeLabel": "Usos por Código",
      "descriptionLabel": "Descripción",
      "descriptionPlaceholder": "Notas opcionales...",
      "preview": "Vista Previa",
      "generating": "Generando...",
      "detailsTitle": "Detalles del Lote",
      "codeColumn": "Código",
      "statusColumn": "Estado",
      "usedCountColumn": "Usos",
      "maxUsesColumn": "Máx. Usos",
      "expiresColumn": "Expira"
    }
  }
}
```

## Testing Checklist

### Invitations Page
- [ ] Page loads without errors
- [ ] Stats cards display correctly
- [ ] Can upload CSV file
- [ ] Can create invitations via modal
- [ ] Email validation works
- [ ] Can search invitations
- [ ] Can filter by status
- [ ] Can select multiple invitations
- [ ] Can send selected invitations
- [ ] Can resend individual invitation
- [ ] Can copy invitation link
- [ ] Progress bar updates correctly

### Codes Page
- [ ] Page loads without errors
- [ ] Stats cards display correctly
- [ ] Can create code batch
- [ ] Code preview shows correct format
- [ ] Batch list displays correctly
- [ ] Can download CSV
- [ ] Can view batch details
- [ ] Can pause/unpause batch
- [ ] Progress bars update correctly

### Wizard Integration
- [ ] Access step shows correct options
- [ ] Helper text appears for CODE and EMAIL_INVITE
- [ ] Can complete wizard with each access type
- [ ] Redirects to appropriate management page after creation

## Next Steps

1. Fix corrupted invitations/page.tsx file
2. Create modal components
3. Enhance codes page
4. Add CSV utilities
5. Add i18n messages
6. Integrate with wizard
7. Test all functionality
8. Add analytics charts (optional, future enhancement)

## Notes

- The backend is fully implemented and ready to use
- Focus on clean, reusable modal components
- Use existing @qp/ui components for consistency
- Follow RBAC patterns from other admin pages
- Ensure mobile responsiveness (horizontal scroll for tables)
- Add loading states for all async operations
- Use optimistic updates where appropriate

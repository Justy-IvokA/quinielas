# Configuración de Firebase Storage para Branding

## ✅ Estado Actual

Todos los módulos necesarios para la personalización de branding están implementados y listos:

- ✅ Storage adapter con soporte Firebase
- ✅ API router de branding con endpoints de upload
- ✅ Componentes UI completos (logo, hero, colors, typography, main-card)
- ✅ Traducciones en español (es-MX)
- ✅ `firebase-admin` instalado en `packages/utils`

## 📋 Configuración de Variables de Entorno

### Tu `.env.local` actual debe tener:

```env
# ============================================
# STORAGE / MEDIA UPLOADS
# ============================================
# Firebase Storage (servidor)
STORAGE_PROVIDER=firebase
FIREBASE_STORAGE_BUCKET=empresax.firebasestorage.app
FIREBASE_CREDENTIALS='{
  "type": "service_account",
  "project_id": "empresax",
  "private_key_id": "3a8e6af074e0aa3b7d...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nA...Z\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-6odzx@empresax.iam.gserviceaccount.com",
  "client_id": "113352082765200679071",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-6odzx%40rodsardb.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'

STORAGE_LOCAL_PATH=./tenants/branding
STORAGE_LOCAL_BASE_URL=/branding
```

### ⚠️ Importante: Diferencia entre variables

- **`FIREBASE_STORAGE_BUCKET`** (sin NEXT_PUBLIC): Usada por `firebase-admin` en el servidor
- **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`**: Usada por el SDK de Firebase en el navegador (si fuera necesario)

## 📁 Estructura de Archivos Organizados

El sistema **ya está configurado** para organizar archivos de forma ordenada:

### Estructura de carpetas por tenant:

```
Firebase Storage Root:
└── {tenant-slug}/          # Ejemplo: "ivoka" o "innotecnia"
    ├── logo/
    │   └── 1705234567890-a1b2c3-company-logo.png
    ├── logotype/
    │   └── 1705234568123-d4e5f6-company-logotype.svg
    ├── hero/
    │   ├── 1705234569456-g7h8i9-hero-image.jpg
    │   └── 1705234570789-j1k2l3-hero-video.mp4
    ├── poster/
    │   └── 1705234571012-m4n5o6-video-poster.jpg
    └── mainCard/
        └── 1705234572345-p7q8r9-card-background.webp
```

### Formato de nombres de archivo:

```
{timestamp}-{random}-{filename-sanitized}.{ext}
```

**Ejemplo real:**
```
ivoka/logo/1705234567890-a1b2c3-company-logo.png
```

**Componentes:**
- `ivoka`: Slug del tenant (identifica al cliente)
- `logo`: Tipo de medio (logo, hero, mainCard, poster, logotype)
- `1705234567890`: Timestamp (milisegundos desde epoch)
- `a1b2c3`: String aleatorio de 6 caracteres
- `company-logo`: Nombre original sanitizado (sin espacios ni caracteres especiales)
- `.png`: Extensión original

### Código responsable (ya implementado):

**En `packages/api/src/routers/branding/index.ts` línea 216-219:**
```typescript
const key = generateFileKey(
  input.filename,
  `${ctx.tenant.slug}/${input.kind}`  // ← Organiza por tenant y tipo
);
```

**En `packages/utils/src/storage/adapter.ts` línea 90-100:**
```typescript
export function generateFileKey(filename: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = filename.split('.').pop() || '';
  const baseName = filename.replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
  
  const key = prefix 
    ? `${prefix}/${timestamp}-${random}-${baseName}.${ext}`
    : `${timestamp}-${random}-${baseName}.${ext}`;
  
  return key;
}
```

## 🔐 Permisos de Firebase Storage

Asegúrate de que las reglas de Firebase Storage permitan escritura desde el servidor:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura pública
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Escritura solo desde servidor (firebase-admin)
    // No necesitas reglas de escritura para usuarios autenticados
    // porque firebase-admin tiene acceso total
  }
}
```

## 🗑️ Limpieza Automática de Archivos

**✅ IMPLEMENTADO:** El sistema elimina automáticamente archivos antiguos cuando subes nuevos.

### Cómo funciona:

1. **Antes de subir un archivo nuevo**, el sistema:
   - Busca el archivo anterior del mismo tipo en el tema actual
   - Extrae la URL del archivo antiguo
   - Valida que pertenezca al tenant actual

2. **Durante la subida**:
   - Elimina el archivo antiguo del bucket (si existe)
   - Sube el nuevo archivo
   - Actualiza el tema en la base de datos
   - Registra ambas acciones en el audit log

3. **Protecciones**:
   - Solo elimina archivos que pertenecen al tenant actual
   - Si la eliminación falla, no bloquea la subida del nuevo archivo
   - Registra warnings en los logs para debugging

### Ejemplo de flujo:

```typescript
// Usuario sube logo.png
// Sistema busca: theme.logo.url = "https://storage.googleapis.com/.../old-logo.png"
// ↓
// Elimina: ivoka/logo/1234567890-abc123-old-logo.png
// ↓
// Sube: ivoka/logo/1705234567890-xyz789-logo.png
// ↓
// Actualiza theme.logo.url con la nueva URL
```

### Archivos que se limpian automáticamente:

- ✅ **Logo principal** (`logo`)
- ✅ **Logotipo** (`logotype`)
- ✅ **Imagen/video hero** (`hero`)
- ✅ **Póster de video hero** (`poster`)
- ✅ **Imagen/video de tarjeta principal** (`mainCard`)

### Endpoint adicional para eliminación manual:

```typescript
// Si necesitas eliminar un archivo sin reemplazarlo
await trpc.branding.deleteMedia.mutate({
  url: "https://storage.googleapis.com/.../file.png",
  kind: "logo"
});
```

## 🚀 Uso del Módulo de Branding

### 1. Acceder a la página de branding

Como **TENANT_ADMIN** o **SUPERADMIN**:

```
http://localhost:3001/es-MX/branding
```

### 2. Funcionalidades disponibles

#### **Tab de Colores:**
- Selector de colores HSL/HEX
- Paletas predefinidas
- Advertencias de contraste WCAG
- Vista previa en tiempo real

#### **Tab de Logo:**
- Subir logo principal (PNG, JPG, WebP, SVG ≤ 2MB)
- Subir logotipo alternativo (opcional)
- Texto alternativo para accesibilidad
- Vista previa inmediata

#### **Tab de Hero:**
- Seleccionar tipo: imagen, video o ninguno
- Subir imagen hero (≤ 2MB)
- Subir video hero (MP4, WebM ≤ 20MB)
- Subir póster para video
- Configurar overlay, loop, autoplay, muted

#### **Tab de Tarjeta Principal:**
- Similar al hero pero para la tarjeta principal
- Imagen o video de fondo

#### **Tab de Tipografía:**
- Seleccionar fuente principal
- Fuente de encabezados (opcional)
- Tamaño base y altura de línea
- Vista previa en vivo

### 3. Flujo de subida de archivos

```typescript
// El usuario selecciona un archivo en el navegador
// ↓
// Se convierte a base64 en el cliente
// ↓
// Se envía al endpoint tRPC branding.uploadMedia
// ↓
// El servidor valida tipo y tamaño
// ↓
// Se genera la clave: {tenant-slug}/{kind}/{timestamp}-{random}-{filename}
// ↓
// Se sube a Firebase Storage usando firebase-admin
// ↓
// Se hace público el archivo
// ↓
// Se retorna la URL pública
// ↓
// Se actualiza el tema en la base de datos
// ↓
// Se registra en audit log
```

## 🧪 Verificación

### 1. Verificar que Firebase Storage esté configurado

```bash
# En apps/admin, verifica que las variables estén cargadas
cd apps/admin
pnpm dev
```

### 2. Probar subida de logo

1. Navega a `http://localhost:3001/es-MX/branding`
2. Ve al tab "Logo"
3. Sube una imagen PNG de prueba
4. Verifica que aparezca la vista previa
5. Haz clic en "Guardar Cambios"
6. Verifica en Firebase Console que el archivo se subió a:
   ```
   {tu-tenant-slug}/logo/{timestamp}-{random}-{filename}.png
   ```

### 3. Verificar en Firebase Console

1. Ve a Firebase Console → Storage
2. Deberías ver la estructura:
   ```
   rodsardb.firebasestorage.app/
   └── {tenant-slug}/
       └── logo/
           └── {archivo-subido}
   ```

## 🐛 Troubleshooting

### Error: "Firebase Storage bucket not configured"

**Causa:** Falta la variable `FIREBASE_STORAGE_BUCKET`

**Solución:** Agrega en `.env.local`:
```env
FIREBASE_STORAGE_BUCKET=rodsardb.firebasestorage.app
```

### Error: "Permission denied" al subir archivos

**Causa:** Firebase Admin no tiene permisos o las credenciales son incorrectas

**Solución:** 
- Si usas Application Default Credentials (local), asegúrate de estar autenticado con `gcloud`
- O proporciona un Service Account:
  1. Ve a Firebase Console → Project Settings → Service Accounts
  2. Genera una nueva clave privada (JSON)
  3. Agrega en `.env.local`:
     ```env
     FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"rodsardb",...}'
     ```

### Los archivos se suben pero no se organizan por tenant

**Causa:** El contexto de tenant no está disponible

**Solución:** Verifica que el usuario esté autenticado y tenga un tenant asignado. El middleware `requireTenantAdmin` debe establecer `ctx.tenant`.

### Error: "File too large"

**Límites:**
- Imágenes: 2MB
- Videos: 20MB

**Solución:** Optimiza los archivos antes de subirlos o ajusta los límites en:
```typescript
// packages/utils/src/storage/adapter.ts
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
```

## 📊 Monitoreo

### Audit Logs

Todas las subidas y eliminaciones se registran en la tabla `AuditLog`:

```sql
-- Ver todas las subidas
SELECT * FROM "AuditLog" 
WHERE action = 'brand.media.upload' 
ORDER BY "createdAt" DESC;

-- Ver todas las eliminaciones
SELECT * FROM "AuditLog" 
WHERE action = 'brand.media.delete' 
ORDER BY "createdAt" DESC;

-- Ver historial completo de un tenant
SELECT * FROM "AuditLog" 
WHERE "tenantId" = 'tu-tenant-id' 
  AND action LIKE 'brand.media.%'
ORDER BY "createdAt" DESC;
```

Campos registrados para **uploads**:
- `tenantId`: ID del tenant
- `actorId`: ID del usuario que subió
- `metadata.kind`: Tipo de medio (logo, hero, etc.)
- `metadata.filename`: Nombre original
- `metadata.url`: URL pública generada
- `metadata.size`: Tamaño en bytes
- `ipAddress`: IP del usuario
- `createdAt`: Timestamp

Campos registrados para **deletes**:
- `tenantId`: ID del tenant
- `actorId`: ID del usuario que eliminó
- `metadata.kind`: Tipo de medio
- `metadata.url`: URL del archivo eliminado
- `metadata.fileKey`: Clave del archivo en el storage
- `ipAddress`: IP del usuario
- `createdAt`: Timestamp

## 🎯 Resumen

✅ **Todo está listo para usar**. Solo necesitas:

1. Agregar `FIREBASE_STORAGE_BUCKET=rodsardb.firebasestorage.app` a tu `.env.local`
2. Reiniciar el servidor admin (`pnpm dev`)
3. Navegar a `/branding` y comenzar a personalizar

Los archivos se organizarán automáticamente por:
- **Tenant** (slug del tenant)
- **Tipo** (logo, hero, mainCard, poster, logotype)
- **Timestamp único** (evita colisiones)

---

**Última actualización:** 2025-01-17
**Versión:** 1.0.0

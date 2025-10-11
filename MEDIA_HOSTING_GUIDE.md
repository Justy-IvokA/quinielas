# Media Hosting Guide - Hero Assets (Video & Images)

**Last Updated:** 2025-01-10  
**Purpose:** Configure video and image backgrounds for brand hero sections

---

## 🚨 Problema con Google Drive

### **Por qué NO funciona Google Drive:**

❌ **URLs de Google Drive NO son directas:**
```
https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
```

**Problemas:**
1. Requiere autenticación del usuario
2. Sirve una página HTML, no el archivo directo
3. Tiene restricciones CORS
4. No funciona con `<video>` o `<img>` tags

---

## ✅ Soluciones Recomendadas

### **Opción 1: Cloudinary (Recomendado)** ⭐

**Ventajas:**
- ✅ Gratis hasta 25GB de almacenamiento
- ✅ 25GB de bandwidth mensual gratis
- ✅ Optimización automática de imágenes
- ✅ Transformaciones on-the-fly
- ✅ CDN global incluido
- ✅ Soporte para video y streaming

**Setup:**

1. **Crear cuenta:** https://cloudinary.com/users/register_free

2. **Subir archivos:**
   - Dashboard → Media Library → Upload
   - O usar CLI: `npm install -g cloudinary-cli`

3. **Obtener URL:**
   ```
   Video:  https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/hero-video.mp4
   Imagen: https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/hero-bg.jpg
   ```

4. **Actualizar base de datos:**
   ```sql
   UPDATE "Brand" 
   SET theme = jsonb_set(
     theme::jsonb,
     '{heroAssets}',
     '{
       "video": true,
       "assetUrl": "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/hero-video.mp4",
       "fallbackImageUrl": "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/hero-poster.jpg"
     }'::jsonb
   )
   WHERE slug = 'default';
   ```

---

### **Opción 2: Bunny CDN (Mejor Precio)** 💰

**Ventajas:**
- ✅ Muy económico: $0.01/GB
- ✅ Sin límite de bandwidth
- ✅ CDN ultra rápido
- ✅ Soporte para video streaming

**Setup:**

1. **Crear cuenta:** https://bunny.net/

2. **Crear Storage Zone:**
   - Dashboard → Storage → Add Storage Zone
   - Nombre: `quinielas-media`

3. **Subir archivos:**
   - Via FTP o Dashboard
   - O usar API

4. **Obtener URL:**
   ```
   https://quinielas-media.b-cdn.net/hero-video.mp4
   https://quinielas-media.b-cdn.net/hero-poster.jpg
   ```

---

### **Opción 3: Vercel Blob (Si usas Vercel)** 🔺

**Ventajas:**
- ✅ Integración perfecta con Next.js
- ✅ 500MB gratis en plan Hobby
- ✅ CDN global automático

**Setup:**

1. **Instalar:**
   ```bash
   pnpm add @vercel/blob
   ```

2. **Subir archivos:**
   ```typescript
   import { put } from '@vercel/blob';
   
   const blob = await put('hero-video.mp4', file, {
     access: 'public',
   });
   
   console.log(blob.url);
   // https://abc123.public.blob.vercel-storage.com/hero-video.mp4
   ```

3. **Usar URL en base de datos**

---

### **Opción 4: AWS S3 + CloudFront (Empresarial)** ☁️

**Ventajas:**
- ✅ Escalabilidad infinita
- ✅ Control total
- ✅ Integración con AWS

**Setup:**

1. **Crear S3 Bucket:**
   - AWS Console → S3 → Create Bucket
   - Nombre: `quinielas-media`
   - Region: `us-east-1`

2. **Configurar permisos públicos:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::quinielas-media/*"
       }
     ]
   }
   ```

3. **Crear CloudFront Distribution:**
   - Origin: S3 bucket
   - Viewer Protocol: Redirect HTTP to HTTPS

4. **URL final:**
   ```
   https://d1234567890.cloudfront.net/hero-video.mp4
   ```

---

### **Opción 5: Hosting Propio (Archivos Pequeños)** 📁

**Solo para archivos <5MB**

1. **Colocar en `/public`:**
   ```
   apps/web/public/
   ├── videos/
   │   └── hero-video.mp4  (< 5MB)
   └── images/
       └── hero-poster.jpg
   ```

2. **Actualizar base de datos:**
   ```sql
   UPDATE "Brand" 
   SET theme = jsonb_set(
     theme::jsonb,
     '{heroAssets}',
     '{
       "video": true,
       "assetUrl": "/videos/hero-video.mp4",
       "fallbackImageUrl": "/images/hero-poster.jpg"
     }'::jsonb
   )
   WHERE slug = 'default';
   ```

⚠️ **Limitaciones:**
- Vercel tiene límite de 50MB por archivo
- Aumenta el tamaño del bundle
- No recomendado para producción

---

## 🔧 Conversión Automática de URLs

El sistema ahora incluye conversión automática de URLs de Google Drive:

**Función:** `getOptimizedMediaUrl()`

**Ubicación:** `packages/utils/src/media-url.ts`

**Qué hace:**
```typescript
// Input (Google Drive view link)
"https://drive.google.com/file/d/1r7AQ0ecsMq2vhprrTaabx9ocCuA4gXdz/view?usp=drive_link"

// Output (Direct download link)
"https://drive.google.com/uc?export=download&id=1r7AQ0ecsMq2vhprrTaabx9ocCuA4gXdz"
```

⚠️ **Advertencia:** Esto puede funcionar para archivos públicos pequeños, pero **NO es confiable** para producción.

---

## 📊 Comparación de Servicios

| Servicio | Precio | Bandwidth | Storage | Video | CDN | Recomendado |
|----------|--------|-----------|---------|-------|-----|-------------|
| **Cloudinary** | Gratis (25GB) | 25GB/mes | 25GB | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **Bunny CDN** | $0.01/GB | Ilimitado | $0.01/GB | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **Vercel Blob** | $0.15/GB | Incluido | 500MB gratis | ✅ | ✅ | ⭐⭐⭐⭐ |
| **AWS S3+CF** | Variable | Variable | Variable | ✅ | ✅ | ⭐⭐⭐ |
| **Google Drive** | Gratis | Limitado | 15GB | ❌ | ❌ | ❌ |
| **Hosting Propio** | Incluido | Limitado | Limitado | ⚠️ | ❌ | ⭐⭐ |

---

## 🎬 Recomendaciones para Videos

### **Formato:**
- ✅ **MP4 (H.264)** - Mejor compatibilidad
- ✅ **WebM** - Mejor compresión (opcional)

### **Resolución:**
- ✅ **1920x1080 (Full HD)** - Recomendado
- ⚠️ **3840x2160 (4K)** - Solo si es necesario (archivo grande)

### **Duración:**
- ✅ **10-30 segundos** - Loop perfecto
- ⚠️ **>60 segundos** - Archivo muy grande

### **Tamaño:**
- ✅ **< 5MB** - Ideal
- ⚠️ **5-10MB** - Aceptable
- ❌ **> 10MB** - Demasiado grande

### **Optimización:**
```bash
# Comprimir video con FFmpeg
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k output.mp4

# Reducir resolución
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 output.mp4
```

---

## 🖼️ Recomendaciones para Imágenes

### **Formato:**
- ✅ **WebP** - Mejor compresión (moderno)
- ✅ **JPEG** - Buena compatibilidad
- ⚠️ **PNG** - Solo para transparencias

### **Resolución:**
- ✅ **1920x1080** - Full HD
- ✅ **2560x1440** - 2K (opcional)

### **Tamaño:**
- ✅ **< 500KB** - Ideal
- ⚠️ **500KB-1MB** - Aceptable
- ❌ **> 1MB** - Demasiado grande

### **Optimización:**
```bash
# Convertir a WebP
cwebp -q 80 input.jpg -o output.webp

# Optimizar JPEG
jpegoptim --max=85 input.jpg

# Redimensionar
convert input.jpg -resize 1920x1080 -quality 85 output.jpg
```

---

## 🧪 Testing

### **Verificar que el video se carga:**

1. **Abrir DevTools → Network**
2. **Filtrar por "media"**
3. **Recargar página**
4. **Verificar:**
   - ✅ Status: 200 OK
   - ✅ Type: video/mp4
   - ✅ Size: Tamaño del archivo
   - ✅ Time: < 3 segundos

### **Verificar en consola:**

```javascript
// Abrir DevTools → Console
const video = document.querySelector('video');
console.log('Video src:', video?.src);
console.log('Video ready state:', video?.readyState);
console.log('Video error:', video?.error);

// Ready states:
// 0 = HAVE_NOTHING
// 1 = HAVE_METADATA
// 2 = HAVE_CURRENT_DATA
// 3 = HAVE_FUTURE_DATA
// 4 = HAVE_ENOUGH_DATA (playing)
```

---

## 🐛 Troubleshooting

### **Video no se reproduce:**

1. **Verificar URL directa:**
   ```bash
   curl -I "YOUR_VIDEO_URL"
   # Debe retornar: Content-Type: video/mp4
   ```

2. **Verificar CORS:**
   - El servidor debe permitir CORS
   - Headers necesarios:
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: GET
     ```

3. **Verificar formato:**
   - Debe ser MP4 con codec H.264
   - Usar herramienta: https://www.videohelp.com/software/MediaInfo

4. **Verificar tamaño:**
   - Si es muy grande (>10MB), puede tardar en cargar
   - Comprimir el video

### **Imagen no se muestra:**

1. **Verificar URL:**
   ```bash
   curl -I "YOUR_IMAGE_URL"
   # Debe retornar: Content-Type: image/jpeg o image/png
   ```

2. **Verificar permisos:**
   - La imagen debe ser pública
   - No debe requerir autenticación

---

## 📝 Ejemplo Completo

```sql
-- Tenant con video de Cloudinary
UPDATE "Brand" 
SET theme = jsonb_set(
  theme::jsonb,
  '{heroAssets}',
  '{
    "video": true,
    "assetUrl": "https://res.cloudinary.com/demo/video/upload/v1234567890/hero-video.mp4",
    "fallbackImageUrl": "https://res.cloudinary.com/demo/image/upload/v1234567890/hero-poster.jpg"
  }'::jsonb
)
WHERE slug = 'default';

-- Tenant con imagen de Unsplash
UPDATE "Brand" 
SET theme = jsonb_set(
  theme::jsonb,
  '{heroAssets}',
  '{
    "video": false,
    "assetUrl": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&h=1080&fit=crop&q=80",
    "fallbackImageUrl": null
  }'::jsonb
)
WHERE slug = 'demo';
```

---

## 🎯 Recomendación Final

**Para MVP y desarrollo:**
- ✅ Usar **Cloudinary** (gratis, fácil, confiable)
- ✅ Subir videos optimizados (< 5MB)
- ✅ Usar imágenes de Unsplash para demos

**Para producción:**
- ✅ **Bunny CDN** (mejor precio/rendimiento)
- ✅ O **Cloudinary Pro** si necesitas transformaciones
- ✅ Videos < 10MB, imágenes < 500KB

**NO usar:**
- ❌ Google Drive
- ❌ Dropbox
- ❌ OneDrive
- ❌ Enlaces temporales

---

**¿Necesitas ayuda?** Revisa la documentación de cada servicio o contacta al equipo de desarrollo.

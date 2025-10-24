# Guía Visual - Páginas Legales

## Estructura Visual del Diseño

### Desktop (md+) - 75% ancho
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [LOGO]  Brand Name                              [← BACK]      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ╔═══════════════════════════╗               │
│                    ║  Términos y Condiciones   ║               │
│                    ║                           ║               │
│                    ║  1. Introducción          ║               │
│                    ║  Estos Términos y...      ║               │
│                    ║                           ║               │
│                    ║  2. Definiciones          ║               │
│                    ║  "Plataforma" se refiere  ║               │
│                    ║  ...                      ║               │
│                    ║                           ║               │
│                    ║  [Scroll para más]        ║               │
│                    ╚═══════════════════════════╝               │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (<md) - 90% ancho
```
┌──────────────────────────────────┐
│                                  │
│  [LOGO]                  [← BACK]│
│                                  │
├──────────────────────────────────┤
│                                  │
│  ╔════════════════════════════╗  │
│  ║ Términos y Condiciones     ║  │
│  ║                            ║  │
│  ║ 1. Introducción            ║  │
│  ║ Estos Términos y...        ║  │
│  ║                            ║  │
│  ║ 2. Definiciones            ║  │
│  ║ "Plataforma" se refiere... ║  │
│  ║                            ║  │
│  ║ [Scroll para más]          ║  │
│  ╚════════════════════════════╝  │
│                                  │
└──────────────────────────────────┘
```

---

## Componentes Visuales

### Header
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────┐                                                   │
│  │ [LOGO]  │ Brand Name                      [← Volver]        │
│  └─────────┘                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Características:**
- Sticky (se queda en la parte superior al scroll)
- Logo: 40px (móvil) a 48px (desktop)
- Nombre del brand visible en desktop
- Botón de retroceso alineado a la derecha
- Borde inferior sutil
- Fondo semi-transparente con blur

### Contenedor Principal
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  Términos y Condiciones de Servicio                          ║
║                                                               ║
║  1. Introducción                                             ║
║  ───────────────────────────────────────────────────────────  ║
║  Estos Términos y Condiciones de Servicio ("Términos")      ║
║  rigen el acceso y uso de la plataforma de quinielas...     ║
║                                                               ║
║  2. Definiciones                                             ║
║  ───────────────────────────────────────────────────────────  ║
║  • "Plataforma" se refiere a nuestro sitio web...           ║
║  • "Usuario" o "Usted" se refiere a cualquier persona...    ║
║  • "Quiniela" se refiere a un evento de predicción...       ║
║                                                               ║
║  [Continúa...]                                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Características:**
- Fondo: white/60 (light) | white/5 (dark)
- Bordes: border-white/10
- Radio: rounded-2xl
- Sombra: shadow-2xl
- Padding: 2rem (móvil) a 3rem (desktop)

---

## Paleta de Colores

### Colores Aplicados del Tenant
```
Primario:
- Gradientes de fondo
- Acentos de secciones
- Enlaces

Acento:
- Gradientes secundarios
- Destacados

Foreground:
- Texto principal: text-foreground
- Texto secundario: text-foreground/90
- Texto terciario: text-foreground/75
- Texto deshabilitado: text-foreground/60

Fondo:
- Fondo principal: bg-background
- Fondo secundario: bg-background/95
- Bordes: border-border/40
```

---

## Secciones de Contenido

### Título Principal
```
Términos y Condiciones de Servicio
├─ Tamaño: 24px (móvil) | 30px (desktop)
├─ Peso: bold (700)
├─ Color: text-foreground
└─ Margen inferior: 2rem
```

### Secciones Numeradas
```
1. Introducción
├─ Tamaño: 20px
├─ Peso: semibold (600)
├─ Color: text-foreground
└─ Margen: 1rem inferior

Contenido de la sección...
├─ Tamaño: 14px (móvil) | 16px (desktop)
├─ Color: text-foreground/90
├─ Line-height: relaxed
└─ Margen inferior: 1rem
```

### Listas
```
Usted se compromete a no:
├─ Utilizar la Plataforma de manera que viole leyes...
├─ Participar en fraude, manipulación de resultados...
├─ Acceder o intentar acceder a sistemas...
└─ [Más items...]

Estilo:
├─ Marcador: disc (•)
├─ Indentación: list-inside
├─ Espaciado: space-y-2
└─ Tamaño: 14px
```

### Cajas de Énfasis
```
┌─────────────────────────────────────────────────────┐
│ Sistema de Puntuación:                              │
│                                                     │
│ Marcador exacto: 5 puntos                           │
│ Signo correcto (1X2): 3 puntos                      │
│ Diferencia de goles: 1 punto                        │
│                                                     │
│ Los desempates se resuelven mediante criterios...   │
└─────────────────────────────────────────────────────┘

Estilo:
├─ Fondo: bg-primary/5
├─ Borde: border-primary/20
├─ Radio: rounded-lg
├─ Padding: 1rem
└─ Tamaño texto: 14px
```

### Tabla (Política de Cookies)
```
┌─────────────────┬──────────────────────┬──────────────┐
│ Nombre          │ Propósito            │ Duración     │
├─────────────────┼──────────────────────┼──────────────┤
│ session_id      │ Mantener sesión      │ Sesión       │
├─────────────────┼──────────────────────┼──────────────┤
│ user_preferences│ Guardar preferencias │ 1 año        │
├─────────────────┼──────────────────────┼──────────────┤
│ analytics_token │ Rastrear actividad   │ 2 años       │
└─────────────────┴──────────────────────┴──────────────┘

Estilo:
├─ Borde: border-collapse
├─ Encabezado: font-semibold
├─ Filas: border-b border-border/20
└─ Padding: 0.5rem
```

---

## Interactividad

### Botón de Retroceso
```
Estado Normal:
┌──────────────┐
│ ← Volver     │
└──────────────┘

Estado Hover:
┌──────────────┐
│ ← Volver     │ (fondo: bg-accent)
└──────────────┘

Comportamiento:
1. Click → router.back()
2. Si no hay historial → router.push("/")
3. No usa fallbackHref
```

### Enlaces Internos
```
<a href="/legal/privacy">Política de Privacidad</a>

Estilo:
├─ Decoración: underline
├─ Offset: underline-offset-4
├─ Color normal: text-foreground
├─ Color hover: text-primary
└─ Abre en: nueva pestaña (_blank)
```

---

## Responsividad

### Breakpoints
```
Mobile (<640px):
├─ Ancho contenedor: 90%
├─ Padding: 1.5rem
├─ Tamaño título: 24px
├─ Tamaño texto: 14px
└─ Logo: 40px

Tablet (640px - 1024px):
├─ Ancho contenedor: 80%
├─ Padding: 2rem
├─ Tamaño título: 28px
├─ Tamaño texto: 15px
└─ Logo: 44px

Desktop (>1024px):
├─ Ancho contenedor: 75% (max 512px)
├─ Padding: 3rem
├─ Tamaño título: 30px
├─ Tamaño texto: 16px
└─ Logo: 48px
```

---

## Animaciones

### Gradientes de Fondo
```
Animación continua:
├─ Gradiente superior: radial-gradient (primary/10%)
├─ Gradiente inferior: radial-gradient (accent/8%)
├─ Duración: suave
└─ Efecto: profundidad visual

Código:
<div className="absolute inset-x-0 top-0 h-[600px] 
  bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary))/10%,_transparent_50%)]" />
```

### Backdrop Blur
```
Header:
├─ Blur: blur-xl
├─ Fondo: bg-background/80
└─ Efecto: frosted glass

Diálogo:
├─ Blur: blur-2xl
├─ Fondo: bg-white/60 (light) | bg-white/5 (dark)
└─ Efecto: profundidad
```

---

## Estados de Carga

### Suspense Fallback
```
┌─────────────────────────────────────────┐
│                                         │
│         Cargando...                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## Ejemplo de Página Completa

### Términos y Condiciones (Vista Completa)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [LOGO]  Quinielas                              [← Volver]      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                                                           ║ │
│  ║  Términos y Condiciones de Servicio                      ║ │
│  ║                                                           ║ │
│  ║  1. Introducción                                         ║ │
│  ║  Estos Términos y Condiciones de Servicio ("Términos")  ║ │
│  ║  rigen el acceso y uso de la plataforma de quinielas... ║ │
│  ║                                                           ║ │
│  ║  2. Definiciones                                         ║ │
│  ║  • "Plataforma" se refiere a nuestro sitio web...       ║ │
│  ║  • "Usuario" o "Usted" se refiere a cualquier persona..║ │
│  ║  • "Quiniela" se refiere a un evento de predicción...   ║ │
│  ║  • "Predicción" se refiere a la estimación del resultado║ │
│  ║  • "Puntos" se refiere a la puntuación acumulada...     ║ │
│  ║                                                           ║ │
│  ║  3. Elegibilidad del Usuario                            ║ │
│  ║  Para utilizar nuestro Servicio, usted debe cumplir...  ║ │
│  ║  • Tener al menos 18 años de edad                       ║ │
│  ║  • Tener la capacidad legal para celebrar un contrato   ║ │
│  ║  • No estar prohibido de usar el Servicio               ║ │
│  ║  • Proporcionar información de registro precisa         ║ │
│  ║                                                           ║ │
│  ║  [Continúa con más secciones...]                        ║ │
│  ║                                                           ║ │
│  ║  ────────────────────────────────────────────────────    ║ │
│  ║  Última actualización: 23/10/2025                        ║ │
│  ║                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Notas de Diseño

1. **Consistencia:** Todas las páginas legales usan el mismo `LegalLayout`
2. **Branding:** Logo y colores del tenant se aplican automáticamente
3. **Accesibilidad:** Contraste suficiente, navegación por teclado
4. **Rendimiento:** Componentes server-side, sin JavaScript innecesario
5. **Mantenibilidad:** Componente reutilizable facilita cambios futuros

---

## Verificación Visual

- [ ] Logo se muestra correctamente en la parte superior izquierda
- [ ] Botón de retroceso está alineado a la derecha
- [ ] Contenido está centrado y bien espaciado
- [ ] Colores del tenant se aplican correctamente
- [ ] Responsive en móviles (90% ancho)
- [ ] Responsive en desktop (75% ancho)
- [ ] Tipografía es legible en todos los tamaños
- [ ] Gradientes de fondo se ven bien
- [ ] Scroll funciona correctamente
- [ ] Enlaces abren en nueva pestaña

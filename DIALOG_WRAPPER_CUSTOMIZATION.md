# Dialog Wrapper - Guía de Personalización

## 🎨 Personalizaciones Comunes

### 1. Cambiar Altura Máxima

#### Actual (80vh)
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
```

#### Opciones Alternativas
```typescript
// Más pequeño (60vh)
<DialogContent className="max-w-2xl max-h-[60vh] overflow-y-auto">

// Más grande (90vh)
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

// Pantalla completa (100vh)
<DialogContent className="max-w-2xl max-h-[100vh] overflow-y-auto">

// Dinámico (basado en contenido)
<DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
```

---

### 2. Cambiar Ancho Máximo

#### Actual (max-w-2xl = 672px)
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
```

#### Opciones Alternativas
```typescript
// Más estrecho (max-w-lg = 512px)
<DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">

// Más ancho (max-w-4xl = 896px)
<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">

// Pantalla completa (max-w-full)
<DialogContent className="max-w-full max-h-[80vh] overflow-y-auto">

// Personalizado (usando arbitrary values)
<DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
```

---

### 3. Personalizar Scrollbar

#### Scrollbar Personalizado
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/40">
```

#### Scrollbar Más Grueso
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-thumb]:bg-primary/30 [&::-webkit-scrollbar-thumb]:rounded">
```

#### Scrollbar Oculto (Scroll Invisible)
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide">
```

---

### 4. Agregar Padding Interno

#### Actual (padding del DialogContent)
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
  {/* p-6 viene del DialogContent por defecto */}
</DialogContent>
```

#### Aumentar Padding
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-8">
  {/* Padding más grande */}
</DialogContent>
```

#### Reducir Padding
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-4">
  {/* Padding más pequeño */}
</DialogContent>
```

---

### 5. Agregar Sombra Personalizada

#### Sombra Más Pronunciada
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
```

#### Sombra Más Sutil
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto shadow-sm">
```

#### Sin Sombra
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto shadow-none">
```

---

### 6. Cambiar Color del Backdrop

#### Backdrop Más Oscuro
```typescript
// Modificar DialogOverlay en @qp/ui/components/dialog.tsx
className={cn(
  "fixed inset-0 z-50 bg-background/90 backdrop-blur-sm ...",
  className
)}
```

#### Backdrop Más Claro
```typescript
className={cn(
  "fixed inset-0 z-50 bg-background/60 backdrop-blur-sm ...",
  className
)}
```

#### Backdrop Sin Blur
```typescript
className={cn(
  "fixed inset-0 z-50 bg-background/80 ...",
  className
)}
```

---

### 7. Agregar Header Sticky

#### Con Header Fijo
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
  <div className="sticky top-0 bg-background border-b border-border/40 p-4 z-10">
    <h2 className="text-xl font-semibold">{t("title")}</h2>
  </div>
  <div className="overflow-y-auto flex-1 p-6">
    {/* Contenido scrollable */}
  </div>
</DialogContent>
```

---

### 8. Agregar Footer Sticky

#### Con Footer Fijo
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
  <div className="overflow-y-auto flex-1">
    {/* Contenido scrollable */}
  </div>
  <div className="sticky bottom-0 bg-background border-t border-border/40 p-4 flex gap-2 justify-end">
    <Button variant="outline">Cancelar</Button>
    <Button>Aceptar</Button>
  </div>
</DialogContent>
```

---

### 9. Agregar Tabla de Contenidos Lateral

#### Con TOC Sidebar
```typescript
<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex gap-4">
  <aside className="w-48 border-r border-border/40 overflow-y-auto hidden md:block">
    <nav className="sticky top-0 p-4 space-y-2">
      <a href="#section1" className="block text-sm hover:text-primary">
        1. Introducción
      </a>
      <a href="#section2" className="block text-sm hover:text-primary">
        2. Definiciones
      </a>
      {/* Más links */}
    </nav>
  </aside>
  <main className="flex-1 overflow-y-auto">
    {/* Contenido con id="section1", id="section2", etc */}
  </main>
</DialogContent>
```

---

### 10. Hacer Dialog Cerrable

#### Cambiar de `open` a estado controlado
```typescript
"use client";

import { useState } from "react";

export function TermsContent() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Contenido */}
      </DialogContent>
    </Dialog>
  );
}
```

#### Con botón de cierre personalizado
```typescript
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
  <div className="overflow-y-auto">
    {/* Contenido */}
  </div>
  <div className="flex gap-2 justify-end mt-6 pt-6 border-t">
    <Button onClick={() => setOpen(false)}>
      Cerrar
    </Button>
  </div>
</DialogContent>
```

---

## 🔧 Ejemplos Avanzados

### 1. Dialog con Búsqueda

```typescript
"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export function SearchableDialog() {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  const sections = [
    { id: "intro", title: "Introducción", content: "..." },
    { id: "definitions", title: "Definiciones", content: "..." },
    // ...
  ];

  const results = useMemo(() => {
    if (!query) return sections;
    return sections.filter(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.content.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="overflow-y-auto flex-1 mt-4">
          {results.map(section => (
            <section key={section.id} id={section.id} className="mb-6">
              <h2 className="font-semibold mb-2">{section.title}</h2>
              <p className="text-sm text-foreground/80">{section.content}</p>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 2. Dialog con Tabs

```typescript
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qp/ui/components/tabs";

export function TabbedDialog() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <Tabs defaultValue="terms" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="terms">Términos</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="terms" className="overflow-y-auto flex-1">
            {/* Contenido de términos */}
          </TabsContent>
          
          <TabsContent value="privacy" className="overflow-y-auto flex-1">
            {/* Contenido de privacidad */}
          </TabsContent>
          
          <TabsContent value="cookies" className="overflow-y-auto flex-1">
            {/* Contenido de cookies */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3. Dialog con Acordeón

```typescript
"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@qp/ui/components/accordion";

export function AccordionDialog() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <Accordion type="single" collapsible>
            <AccordionItem value="section1">
              <AccordionTrigger>1. Introducción</AccordionTrigger>
              <AccordionContent>
                {/* Contenido de la sección */}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="section2">
              <AccordionTrigger>2. Definiciones</AccordionTrigger>
              <AccordionContent>
                {/* Contenido de la sección */}
              </AccordionContent>
            </AccordionItem>
            
            {/* Más items */}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 4. Dialog con Impresión

```typescript
"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

export function PrintableDialog() {
  const [open, setOpen] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Términos y Condiciones</h2>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 print:overflow-visible">
          {/* Contenido imprimible */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 5. Dialog con Descarga PDF

```typescript
"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function DownloadableDialog() {
  const [open, setOpen] = useState(true);

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = document.querySelector(".legal-content");
      
      const options = {
        margin: 10,
        filename: "terminos-condiciones.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" }
      };

      html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Términos y Condiciones</h2>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 legal-content">
          {/* Contenido */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📋 Checklist de Personalización

### Antes de Cambiar
- [ ] Entender el cambio deseado
- [ ] Verificar compatibilidad con responsive
- [ ] Probar en múltiples dispositivos
- [ ] Verificar accesibilidad

### Después de Cambiar
- [ ] Verificar en móvil
- [ ] Verificar en tablet
- [ ] Verificar en desktop
- [ ] Probar scroll
- [ ] Probar navegación por teclado
- [ ] Verificar con screen reader

---

## 🚀 Mejores Prácticas

### 1. Mantener Consistencia
```typescript
// ✅ Bueno - Consistente con otras páginas
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">

// ❌ Malo - Inconsistente
<DialogContent className="max-w-3xl max-h-[70vh] overflow-auto">
```

### 2. Considerar Accesibilidad
```typescript
// ✅ Bueno - Accesible
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
  <div role="region" aria-label="Contenido legal">
    {/* Contenido */}
  </div>
</DialogContent>

// ❌ Malo - No accesible
<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
  {/* Sin atributos ARIA */}
</DialogContent>
```

### 3. Probar Rendimiento
```typescript
// ✅ Bueno - Eficiente
const results = useMemo(() => {
  return sections.filter(s => s.title.includes(query));
}, [query, sections]);

// ❌ Malo - Ineficiente
const results = sections.filter(s => s.title.includes(query));
```

---

## 📞 Referencia Rápida

### Clases Tailwind Comunes
```
Tamaños:
- max-w-lg (512px)
- max-w-2xl (672px) ← Actual
- max-w-4xl (896px)
- max-w-full (100%)

Alturas:
- max-h-[60vh] (60% viewport)
- max-h-[80vh] (80% viewport) ← Actual
- max-h-[100vh] (100% viewport)

Overflow:
- overflow-y-auto ← Actual
- overflow-hidden
- overflow-visible

Padding:
- p-4 (16px)
- p-6 (24px) ← Actual
- p-8 (32px)
```

---

**Última actualización:** 23 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Completado

# Ejemplos de Código - Páginas Legales

## 1. Usar el Componente LegalLayout

### Ejemplo Básico
```typescript
import { LegalLayout } from "../_components/legal-layout";
import { getTranslations } from "next-intl/server";

export default async function MyLegalPage() {
  const t = await getTranslations("legal.myPage");
  
  return (
    <LegalLayout
      title={t("title")}
      brandLogo={brandLogo}
      brandName={brandName}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold">{t("section1.title")}</h2>
          <p>{t("section1.content")}</p>
        </section>
      </div>
    </LegalLayout>
  );
}
```

---

## 2. Agregar Tabla de Contenidos

### Componente TableOfContents
```typescript
"use client";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  return (
    <nav className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <h3 className="font-semibold mb-4">Tabla de Contenidos</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} style={{ marginLeft: `${item.level * 1}rem` }}>
            <a
              href={`#${item.id}`}
              className="text-primary hover:text-primary/80 underline"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Uso
```typescript
const toc = [
  { id: "intro", title: "1. Introducción", level: 0 },
  { id: "definitions", title: "2. Definiciones", level: 0 },
  { id: "def-platform", title: "Plataforma", level: 1 },
  { id: "def-user", title: "Usuario", level: 1 },
];

<TableOfContents items={toc} />
```

---

## 3. Agregar Búsqueda

### Componente SearchLegal
```typescript
"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface SearchableSection {
  id: string;
  title: string;
  content: string;
}

interface SearchLegalProps {
  sections: SearchableSection[];
}

export function SearchLegal({ sections }: SearchLegalProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.content.toLowerCase().includes(lowerQuery)
    );
  }, [query, sections]);

  return (
    <div className="mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar en este documento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>
      
      {query && (
        <div className="mt-4 space-y-2">
          {results.length > 0 ? (
            results.map((result) => (
              <a
                key={result.id}
                href={`#${result.id}`}
                className="block p-3 bg-accent/10 border border-accent/20 rounded hover:bg-accent/20"
              >
                <p className="font-semibold">{result.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.content}
                </p>
              </a>
            ))
          ) : (
            <p className="text-muted-foreground">No se encontraron resultados</p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 4. Agregar Aceptación de Términos

### Componente TermsAcceptance
```typescript
"use client";

import { useState } from "react";
import { Checkbox } from "@qp/ui/components/checkbox";
import { Button } from "@qp/ui/components/button";

interface TermsAcceptanceProps {
  onAccept: () => void;
  onReject: () => void;
}

export function TermsAcceptance({ onAccept, onReject }: TermsAcceptanceProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="accept-terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
          />
          <label htmlFor="accept-terms" className="text-sm cursor-pointer">
            Acepto los términos y condiciones
          </label>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReject}>
            Rechazar
          </Button>
          <Button onClick={onAccept} disabled={!accepted}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Agregar Historial de Cambios

### Componente ChangeHistory
```typescript
"use client";

interface Change {
  date: string;
  version: string;
  description: string;
}

interface ChangeHistoryProps {
  changes: Change[];
}

export function ChangeHistory({ changes }: ChangeHistoryProps) {
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h3 className="text-xl font-semibold mb-6">Historial de Cambios</h3>
      
      <div className="space-y-4">
        {changes.map((change, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              {index < changes.length - 1 && (
                <div className="w-0.5 h-12 bg-border" />
              )}
            </div>
            
            <div className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{change.version}</span>
                <span className="text-sm text-muted-foreground">{change.date}</span>
              </div>
              <p className="text-sm">{change.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Uso
```typescript
const changes = [
  {
    date: "23/10/2025",
    version: "v1.0",
    description: "Versión inicial de términos y condiciones"
  },
  {
    date: "15/10/2025",
    version: "v0.9",
    description: "Versión beta para revisión legal"
  }
];

<ChangeHistory changes={changes} />
```

---

## 6. Agregar Exportar a PDF

### Función exportToPDF
```typescript
"use client";

export async function exportLegalPageToPDF(
  title: string,
  content: string,
  filename: string
) {
  try {
    // Importar dinámicamente html2pdf
    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.createElement("div");
    element.innerHTML = `
      <h1>${title}</h1>
      <div>${content}</div>
      <p style="margin-top: 2rem; font-size: 0.8rem; color: #999;">
        Generado el ${new Date().toLocaleDateString()}
      </p>
    `;

    const options = {
      margin: 10,
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" }
    };

    html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error("Error exporting PDF:", error);
  }
}
```

### Botón de Descarga
```typescript
<button
  onClick={() => exportLegalPageToPDF(
    "Términos y Condiciones",
    document.querySelector(".legal-content")?.innerHTML || "",
    "terminos-condiciones"
  )}
  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
>
  <Download className="w-4 h-4" />
  Descargar PDF
</button>
```

---

## 7. Agregar Notificación de Cambios

### Componente UpdateNotification
```typescript
"use client";

import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface UpdateNotificationProps {
  title: string;
  message: string;
  date: string;
}

export function UpdateNotification({
  title,
  message,
  date
}: UpdateNotificationProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-foreground/80 mt-1">{message}</p>
        <p className="text-xs text-foreground/60 mt-2">Actualizado: {date}</p>
      </div>
      
      <button
        onClick={() => setDismissed(true)}
        className="text-foreground/60 hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### Uso
```typescript
<UpdateNotification
  title="Política Actualizada"
  message="Hemos actualizado nuestra política de privacidad. Por favor, revisa los cambios."
  date="23/10/2025"
/>
```

---

## 8. Agregar Navegación entre Páginas Legales

### Componente LegalNavigation
```typescript
"use client";

import { Link } from "@web/i18n/navigation";
import { ChevronRight } from "lucide-react";

interface LegalPage {
  href: string;
  title: string;
  description: string;
}

const LEGAL_PAGES: LegalPage[] = [
  {
    href: "/legal/terms",
    title: "Términos y Condiciones",
    description: "Términos de servicio y condiciones de uso"
  },
  {
    href: "/legal/privacy",
    title: "Política de Privacidad",
    description: "Cómo protegemos tu información"
  },
  {
    href: "/legal/cookies",
    title: "Política de Cookies",
    description: "Cómo usamos cookies y tecnologías similares"
  }
];

export function LegalNavigation() {
  return (
    <div className="grid gap-4">
      {LEGAL_PAGES.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="font-semibold">{page.title}</h3>
            <p className="text-sm text-muted-foreground">{page.description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
```

---

## 9. Agregar Secciones Colapsables

### Componente CollapsibleSection
```typescript
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/5 transition-colors"
      >
        <h3 className="font-semibold">{title}</h3>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      
      {open && (
        <div className="px-4 py-3 border-t border-border bg-background/50">
          {children}
        </div>
      )}
    </div>
  );
}
```

### Uso
```typescript
<CollapsibleSection title="1. Introducción">
  <p>Contenido de la sección...</p>
</CollapsibleSection>
```

---

## 10. Agregar Traducción Dinámica

### Hook useTranslatedLegalPage
```typescript
"use client";

import { useTranslations } from "next-intl";

export function useTranslatedLegalPage(pageKey: string) {
  const t = useTranslations(`legal.${pageKey}`);

  return {
    title: t("title"),
    sections: Array.from({ length: 13 }, (_, i) => ({
      title: t(`section${i + 1}.title`),
      content: t(`section${i + 1}.content`)
    })).filter(s => s.title && s.content),
    lastUpdated: t("lastUpdated", {
      date: new Date().toLocaleDateString()
    })
  };
}
```

### Uso
```typescript
export default function TermsPage() {
  const legal = useTranslatedLegalPage("terms");

  return (
    <LegalLayout title={legal.title}>
      {legal.sections.map((section, i) => (
        <section key={i}>
          <h2>{section.title}</h2>
          <p>{section.content}</p>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">{legal.lastUpdated}</p>
    </LegalLayout>
  );
}
```

---

## 11. Agregar Validación de Edad

### Componente AgeVerification
```typescript
"use client";

import { useState } from "react";
import { Button } from "@qp/ui/components/button";
import { AlertCircle } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age < 18) {
      setError("Debes tener al menos 18 años para acceder a este contenido");
    } else {
      onVerified();
    }
  };

  return (
    <div className="p-6 bg-accent/10 border border-accent/20 rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">Verificación de Edad</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Debes confirmar que tienes al menos 18 años
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <input
          type="number"
          placeholder="Año de nacimiento"
          value={birthYear}
          onChange={(e) => {
            setBirthYear(e.target.value);
            setError("");
          }}
          className="w-full px-3 py-2 border rounded-lg"
          min="1900"
          max={new Date().getFullYear()}
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button onClick={handleVerify} className="w-full">
          Verificar Edad
        </Button>
      </div>
    </div>
  );
}
```

---

## 12. Agregar Estadísticas de Lectura

### Componente ReadingStats
```typescript
"use client";

import { useEffect, useState } from "react";
import { Clock, Eye } from "lucide-react";

interface ReadingStatsProps {
  content: string;
}

export function ReadingStats({ content }: ReadingStatsProps) {
  const [stats, setStats] = useState({ words: 0, readTime: 0 });

  useEffect(() => {
    const words = content.split(/\s+/).length;
    const readTime = Math.ceil(words / 200); // 200 palabras por minuto

    setStats({ words, readTime });
  }, [content]);

  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>{stats.words} palabras</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>~{stats.readTime} min de lectura</span>
      </div>
    </div>
  );
}
```

---

## Conclusión

Estos ejemplos muestran cómo extender las páginas legales con funcionalidades adicionales. Todos los componentes siguen las convenciones del proyecto y se integran fácilmente con el `LegalLayout` existente.

Para más información, consulta:
- `LEGAL_PAGES_IMPLEMENTATION.md` - Documentación técnica
- `LEGAL_PAGES_QUICK_REFERENCE.md` - Referencia rápida

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@qp/ui";

import { CreatePoolWizard } from "./components/CreatePoolWizard";

export const metadata: Metadata = {
  title: "Crear Quiniela"
};

export default function NewPoolPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/pools">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
        <div className="mt-4">
          <h1 className="text-3xl font-semibold">Crear Quiniela</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Asistente guiado para crear una quiniela e importar eventos
          </p>
        </div>
      </div>

      {/* Wizard Container */}
      <div className="rounded-2xl border border-border/70 bg-card/60 shadow-sm backdrop-blur">
        <CreatePoolWizard />
      </div>
    </div>
  );
}

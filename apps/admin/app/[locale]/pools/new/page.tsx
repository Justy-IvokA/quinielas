import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@qp/ui";

import { CreatePoolForm } from "./components/create-pool-form";

export const metadata: Metadata = {
  title: "Crear Quiniela"
};

export default function NewPoolPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="minimal" size="sm">
          <Link href="/pools">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Crear Quiniela</h1>
          <p className="text-muted-foreground">
            Configura una nueva quiniela
          </p>
        </div>
      </header>

      <CreatePoolForm />
    </div>
  );
}

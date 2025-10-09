import { Metadata } from "next";

import { AccessPolicyManager } from "./components/access-policy-manager";

export const metadata: Metadata = {
  title: "Gestión de Acceso"
};

export default function AccessPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Gestión de Acceso</h1>
        <p className="text-muted-foreground">
          Administra políticas de acceso, códigos de invitación y listas de correo para tus pools.
        </p>
      </header>

      <AccessPolicyManager />
    </div>
  );
}

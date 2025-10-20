import { SportsLoader } from "@qp/ui";

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SportsLoader size="lg" text="Cargando plantillas" />
    </div>
  );
}

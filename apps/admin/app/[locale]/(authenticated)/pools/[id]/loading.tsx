import { SportsLoader } from "@qp/ui";

export default function Loading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <SportsLoader size="lg" text="Cargando quiniela" />
    </div>
  );
}

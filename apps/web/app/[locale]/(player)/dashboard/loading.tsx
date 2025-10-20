import { SportsLoader } from "@qp/ui";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center py-20">
        <SportsLoader size="lg" text="Cargando dashboard" />
      </div>
    </div>
  );
}

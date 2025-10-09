import { Metadata } from "next";

import { FixturesManager } from "./components/fixtures-manager";

export const metadata: Metadata = {
  title: "Fixtures"
};

export default function FixturesPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Fixtures</h1>
        <p className="text-muted-foreground">
          Administra partidos, horarios y resultados de tus temporadas.
        </p>
      </header>

      <FixturesManager />
    </div>
  );
}

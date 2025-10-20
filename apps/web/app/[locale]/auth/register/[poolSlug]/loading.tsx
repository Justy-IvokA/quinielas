import { SportsLoader } from "@qp/ui";

export default function Loading() {
  return (
    <section className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
      <SportsLoader size="xl" text="Cargando registro" />
    </section>
  );
}

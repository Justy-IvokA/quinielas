"use client";

import { Button, ThemeToggle, toastSuccess, Badge } from "@qp/ui";
import { Trophy, Users } from "lucide-react";

/**
 * Demo component for apps/web showing theme toggle and toast usage
 */
export function DemoThemeCTA() {
  const handleJoinClick = () => {
    toastSuccess("¡Bienvenido a la quiniela!", {
      description: "Tu registro ha sido exitoso"
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="success" StartIcon={Users}>
          1,234 jugadores
        </Badge>
        <Badge variant="warning" StartIcon={Trophy}>
          $50,000 en premios
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={handleJoinClick} size="lg" StartIcon={Trophy}>
          Unirse a la Quiniela
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}

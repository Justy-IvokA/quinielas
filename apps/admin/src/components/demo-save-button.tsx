"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
  toastSuccess,
  toastError,
  toastPromise
} from "@qp/ui";
import { Save, Settings } from "lucide-react";

/**
 * Demo component for apps/admin showing toast usage with async operations
 */
export function DemoSaveButton() {
  const [isSaving, setIsSaving] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [accessType, setAccessType] = useState("public");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toastSuccess("Configuración guardada", {
        description: "Los cambios se han aplicado correctamente"
      });
    } catch (error) {
      toastError("No se pudo guardar", {
        description: "Ocurrió un error al guardar la configuración"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithPromise = () => {
    const savePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail for demo
        Math.random() > 0.3 ? resolve("OK") : reject(new Error("Failed"));
      }, 2000);
    });

    toastPromise(savePromise, {
      loading: "Guardando configuración...",
      success: "¡Configuración guardada exitosamente!",
      error: "Error al guardar la configuración"
    });
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Configuración de Pool</CardTitle>
        </div>
        <CardDescription>
          Configura el acceso y las reglas de tu quiniela
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="info">
          <AlertTitle>Modo Demo</AlertTitle>
          <AlertDescription>
            Este es un ejemplo de formulario con componentes UI mejorados
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="pool-name">Nombre del Pool</Label>
          <Input
            id="pool-name"
            placeholder="Mundial 2026"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-type">Tipo de Acceso</Label>
          <Select value={accessType} onValueChange={setAccessType}>
            <SelectTrigger id="access-type">
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Público</SelectItem>
              <SelectItem value="code">Por Código</SelectItem>
              <SelectItem value="invite">Por Invitación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          Ejemplos de guardado con diferentes patrones de toast
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSave}
          loading={isSaving}
          StartIcon={Save}
        >
          Guardar (Manual)
        </Button>
        <Button
          onClick={handleSaveWithPromise}
          variant="secondary"
          StartIcon={Save}
        >
          Guardar (Promise)
        </Button>
      </CardFooter>
    </Card>
  );
}

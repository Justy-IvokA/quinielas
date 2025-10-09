import { Metadata } from "next";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@qp/ui";

import { RegistrationFlow } from "./components/registration-flow";

export const metadata: Metadata = {
  title: "Registro"
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Únete a la quiniela</CardTitle>
          <CardDescription>
            Completa tu registro para comenzar a hacer predicciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RegistrationSkeleton />}>
            <RegistrationFlow />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function RegistrationSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-32" />
    </div>
  );
}

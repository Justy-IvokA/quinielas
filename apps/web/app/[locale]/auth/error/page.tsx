import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui/components/card";
import { Button } from "@qp/ui/components/button";
import { AlertCircle } from "lucide-react";

interface ErrorPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AuthErrorPage({ params, searchParams }: ErrorPageProps) {
  const t = await getTranslations("auth.errors");
  const tSignin = await getTranslations("auth.signin");
  const { locale } = await params;
  const { error } = await searchParams;

  const errorMessage = error || t("generic");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Error de autenticación</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href={`/${locale}/auth/signin`}>{tSignin("backToSignin")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

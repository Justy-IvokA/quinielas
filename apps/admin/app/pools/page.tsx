import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@qp/ui";

import { PoolsList } from "./components/pools-list";

export const metadata: Metadata = {
  title: "Pools"
};

export default function PoolsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Pools</h1>
          <p className="text-muted-foreground">
            Administra tus quinielas activas e inactivas.
          </p>
        </div>
        <Button asChild StartIcon={Plus}>
          <Link href="/pools/new">Crear pool</Link>
        </Button>
      </header>

      <PoolsList />
    </div>
  );
}

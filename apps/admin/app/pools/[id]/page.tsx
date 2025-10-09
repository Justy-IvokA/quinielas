import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";

import { Button } from "@qp/ui";

import { PoolDetails } from "./components/pool-details";
import { PrizesManager } from "./components/prizes-manager";

export const metadata: Metadata = {
  title: "Detalles del Pool"
};

interface PoolPageProps {
  params: {
    id: string;
  };
}

export default function PoolPage({ params }: PoolPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="minimal" size="sm">
            <Link href="/pools">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Detalles del Pool</h1>
          </div>
        </div>
        <Button asChild StartIcon={Edit}>
          <Link href={`/pools/${params.id}/edit`}>Editar pool</Link>
        </Button>
      </header>

      <PoolDetails poolId={params.id} />
      <PrizesManager poolId={params.id} />
    </div>
  );
}

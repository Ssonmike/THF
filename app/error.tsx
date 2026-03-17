"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pageStack">
      <Card>
        <h1 className="pageTitle">Algo ha fallado</h1>
        <p className="pageDescription">
          La aplicación ha encontrado un error inesperado. Puedes volver a intentarlo sin perder tus datos.
        </p>
        <div className="cluster">
          <Button type="button" onClick={reset}>
            Reintentar
          </Button>
        </div>
      </Card>
    </div>
  );
}

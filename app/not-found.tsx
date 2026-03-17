import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";

export default function NotFoundPage() {
  return (
    <div className="pageStack">
      <Card>
        <h1 className="pageTitle">No encontrado</h1>
        <p className="pageDescription">
          La vista que intentas abrir no existe o ya no está disponible.
        </p>
        <ButtonLink href="/" variant="secondary">
          Volver al dashboard
        </ButtonLink>
      </Card>
    </div>
  );
}

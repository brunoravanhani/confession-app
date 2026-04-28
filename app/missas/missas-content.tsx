import ServicePageContent from "@/app/components/ServicePageContent";
import { MASS_TYPE, getCityEntry } from "@/app/lib/parishes";

const cityEntry = getCityEntry();

export default function MissasContent() {
  return (
    <ServicePageContent
      serviceType={MASS_TYPE}
      pageTitle={`Missas em ${cityEntry.city}`}
      sectionTitle="Missas hoje?"
      badgeLabel="Missa"
      badgeClassName="bg-stone-200 text-stone-800"
      emptyMessage="Nenhuma missa encontrada para esta busca."
      navigationHref="/"
      navigationLabel="Ver confissões"
    />
  );
}

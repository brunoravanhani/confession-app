import ServicePageContent from "@/app/components/ServicePageContent";
import { CONFESSION_TYPE, getCityEntry } from "@/app/lib/parishes";

const cityEntry = getCityEntry();

export default function HomeContent() {
  return (
    <ServicePageContent
      serviceType={CONFESSION_TYPE}
      pageTitle={`Onde se confessar em ${cityEntry.city}?`}
      sectionTitle="Onde confessar hoje?"
      badgeLabel="Confissão"
      badgeClassName="bg-amber-100 text-amber-900"
      emptyMessage="Nenhum horário de confissão encontrado para esta busca."
      navigationHref="/missas"
      navigationLabel="Ver missas"
    />
  );
}

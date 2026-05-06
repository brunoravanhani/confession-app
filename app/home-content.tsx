import ServicePageContent from "@/app/components/ServicePageContent";
import { CONFESSION_TYPE } from "@/app/lib/parishes";
import { getCityEntry, getServicesByType } from "@/app/lib/parishes-data";

const cityEntry = getCityEntry();
const confessionServices = getServicesByType(cityEntry, CONFESSION_TYPE);

export default function HomeContent() {
  return (
    <ServicePageContent
      cityEntry={cityEntry}
      allServices={confessionServices}
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

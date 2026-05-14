import ServicePageContent from "@/app/components/ServicePageContent";
import { MASS_TYPE } from "@/app/lib/parishes";
import { getCityEntry, getServicesByType } from "@/app/lib/parishes-data";

const cityEntry = getCityEntry();
const massServices = getServicesByType(cityEntry, MASS_TYPE);
const MASS_TIME_FILTER_OPTIONS = [
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

export default function MissasContent() {
  return (
    <ServicePageContent
      cityEntry={cityEntry}
      allServices={massServices}
      pageTitle={`Missas em ${cityEntry.city}`}
      sectionTitle={`Horários de missas em ${cityEntry.city}`}
      badgeLabel="Missa"
      badgeClassName="bg-stone-200 text-stone-800"
      emptyMessage="Nenhuma missa encontrada para esta busca."
      navigationHref="/"
      navigationLabel="Ver confissões"
      timeFilterOptions={MASS_TIME_FILTER_OPTIONS}
      filterByCurrentTime={false}
      showHeadFilter
    />
  );
}

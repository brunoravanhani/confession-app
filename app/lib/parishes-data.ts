import "server-only";
import parishesData from "@/data/parishes.json";
import type { CityEntry, Parish, ParishesData, ServiceItem } from "@/app/lib/parishes";

export const CITY_SLUG = "cuiaba";

export function getCityEntry(): CityEntry {
  const data = parishesData as ParishesData;
  return data[CITY_SLUG];
}

export function getServicesByType(cityEntry: CityEntry, serviceType: number): ServiceItem[] {
  return cityEntry.parishes.flatMap((parish) =>
    [...parish.churches]
      .sort((a, b) => (b.head ? 1 : 0) - (a.head ? 1 : 0))
      .flatMap((church) =>
      church.services
        .filter((service) => service.type === serviceType)
        .map((service) => ({
          parishName: parish.name,
          parishSlug: parish.slug,
          churchName: church.name,
          churchAddress: church.address,
          churchLocation: church.location,
          churchHead: church.head,
          service,
        }))
    ),
  );
}

export function getHighlightedParishes(cityEntry: CityEntry): Parish[] {
  return cityEntry.parishes.filter((p) => p.highlight);
}

export function getHighlightedServicesByType(cityEntry: CityEntry, serviceType: number): ServiceItem[] {
  const highlighted = { ...cityEntry, parishes: getHighlightedParishes(cityEntry) };
  return getServicesByType(highlighted, serviceType);
}

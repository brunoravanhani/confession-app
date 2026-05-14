export type Service = {
  type: number;
  type_name: string;
  day: string;
  time: string;
  notes?: string;
};

export type ChurchLocation = {
  latitude?: number | null;
  longitude?: number | null;
  link?: string;
};

export type Church = {
  name: string;
  address: string;
  location?: ChurchLocation;
  head?: boolean;
  services: Service[];
};

export type Parish = {
  name: string;
  slug: string;
  highlight?: boolean;
  churches: Church[];
};

export type CityEntry = {
  diocese: string;
  city: string;
  state: string;
  parishes: Parish[];
};

export type ParishesData = Record<string, CityEntry>;

export type ServiceItem = {
  parishName: string;
  parishSlug: string;
  churchName: string;
  churchAddress: string;
  churchLocation?: ChurchLocation;
  churchHead?: boolean;
  service: Service;
};

export type GroupedServiceItem = {
  parishName: string;
  parishSlug: string;
  churchName: string;
  churchAddress: string;
  churchLocation?: ChurchLocation;
  churchHead?: boolean;
  services: Service[];
};

export const MASS_TYPE = 1;
export const CONFESSION_TYPE = 2;
export const ITEMS_PER_PAGE = 8;

export function normalizeDay(day: string): string {
  return day
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getTodayInPortuguese(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "America/Cuiaba",
  }).format(new Date());
}

export function getRelativeDayInPortuguese(daysFromToday: number): string {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + daysFromToday);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "America/Cuiaba",
  }).format(baseDate);
}

export function getCurrentTimeInCuiaba(): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Cuiaba",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  return { hours: parseInt(parts.hour, 10), minutes: parseInt(parts.minute, 10) };
}

export function isServiceInFuture(
  serviceTime: string,
  currentHours: number,
  currentMinutes: number,
): boolean {
  const [h, m] = serviceTime.split(":").map(Number);
  return h > currentHours || (h === currentHours && m > currentMinutes);
}

export function getTimeInMinutes(serviceTime: string): number {
  const [h, m] = serviceTime.split(":").map(Number);
  return h * 60 + m;
}

export function groupServicesByChurch(items: ServiceItem[]): GroupedServiceItem[] {
  const groups = new Map<string, GroupedServiceItem>();

  items.forEach((item) => {
    const key = `${item.parishSlug}|${item.churchName}|${item.churchAddress}`;
    const existing = groups.get(key);

    if (existing) {
      existing.services.push(item.service);
      return;
    }

    groups.set(key, {
      parishName: item.parishName,
      parishSlug: item.parishSlug,
      churchName: item.churchName,
      churchAddress: item.churchAddress,
      churchLocation: item.churchLocation,
      churchHead: item.churchHead,
      services: [item.service],
    });
  });

  return Array.from(groups.values());
}

export function getServicesByType(cityEntry: CityEntry, serviceType: number): ServiceItem[] {
  return cityEntry.parishes.flatMap((parish) =>
    parish.churches.flatMap((church) =>
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

export function getGoogleMapsLink(location?: ChurchLocation): string | null {
  if (location?.link) {
    return location.link;
  }

  if (typeof location?.latitude === "number" && typeof location?.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }

  return null;
}

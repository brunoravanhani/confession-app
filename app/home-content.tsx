"use client";

import Link from "next/link";
import { useState } from "react";
import parishesData from "@/data/parishes.json";

type Service = {
  type: number;
  type_name: string;
  day: string;
  time: string;
  notes?: string;
};

type ChurchLocation = {
  latitude?: number | null;
  longitude?: number | null;
  link?: string;
};

type Church = {
  name: string;
  address: string;
  location?: ChurchLocation;
  services: Service[];
};

type Parish = {
  name: string;
  slug: string;
  churches: Church[];
};

type CityEntry = {
  diocese: string;
  city: string;
  state: string;
  parishes: Parish[];
};

type ParishesData = Record<string, CityEntry>;

type ServiceItem = {
  parishName: string;
  parishSlug: string;
  churchName: string;
  churchAddress: string;
  churchLocation?: ChurchLocation;
  service: Service;
};

type GroupedServiceItem = {
  parishName: string;
  parishSlug: string;
  churchName: string;
  churchAddress: string;
  churchLocation?: ChurchLocation;
  services: Service[];
};

const MASS_TYPE = 1;
const CONFESSION_TYPE = 2;
const CITY_SLUG = "cuiaba";
const ITEMS_PER_PAGE = 8;

function normalizeDay(day: string): string {
  return day
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getTodayInPortuguese(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "America/Cuiaba",
  }).format(new Date());
}

function getRelativeDayInPortuguese(daysFromToday: number): string {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + daysFromToday);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "America/Cuiaba",
  }).format(baseDate);
}

function getCurrentTimeInCuiaba(): { hours: number; minutes: number } {
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

function isServiceInFuture(serviceTime: string, currentHours: number, currentMinutes: number): boolean {
  const [h, m] = serviceTime.split(":").map(Number);
  return h > currentHours || (h === currentHours && m > currentMinutes);
}

function getTimeInMinutes(serviceTime: string): number {
  const [h, m] = serviceTime.split(":").map(Number);
  return h * 60 + m;
}

function groupServicesByChurch(items: ServiceItem[]): GroupedServiceItem[] {
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
      services: [item.service],
    });
  });

  return Array.from(groups.values());
}

function getServicesByType(cityEntry: CityEntry, serviceType: number): ServiceItem[] {
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
          service,
        })),
    ),
  );
}

function getGoogleMapsLink(location?: ChurchLocation): string | null {
  if (location?.link) {
    return location.link;
  }

  if (typeof location?.latitude === "number" && typeof location?.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }

  return null;
}

function ChurchLocationDetails({ address, location }: { address: string; location?: ChurchLocation }) {
  const googleMapsLink = getGoogleMapsLink(location);

  return (
    <>
      <p className="text-sm text-stone-700">{address}</p>
      {googleMapsLink ? (
        <p className="mt-1 text-sm">
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 transition hover:text-amber-900"
          >
            Ver no Google Maps
          </a>
        </p>
      ) : null}
    </>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-200 pt-4">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>

      <p className="text-sm text-stone-600">
        Página {currentPage} de {totalPages}
      </p>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Próxima
      </button>
    </div>
  );
}

export default function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTodayTomorrow, setShowTodayTomorrow] = useState(true);
  const [confessionsPage, setConfessionsPage] = useState(1);
  const [massesPage, setMassesPage] = useState(1);

  const data = parishesData as ParishesData;
  const dioceseInfo = data[CITY_SLUG];
  const allConfessions = getServicesByType(dioceseInfo, CONFESSION_TYPE);
  const masses = getServicesByType(dioceseInfo, MASS_TYPE);

  const today = getTodayInPortuguese();
  const tomorrow = getRelativeDayInPortuguese(1);
  const todayNormalized = normalizeDay(today);
  const tomorrowNormalized = normalizeDay(tomorrow);
  const normalizedSearch = normalizeText(searchQuery);

  const currentTime = getCurrentTimeInCuiaba();

  const matchesName = (item: ServiceItem): boolean => {
    if (!normalizedSearch) return true;

    return (
      normalizeText(item.churchName).includes(normalizedSearch) ||
      normalizeText(item.parishName).includes(normalizedSearch)
    );
  };

  const matchesDayFilter = (item: ServiceItem): boolean => {
    if (!showTodayTomorrow) return true;

    const serviceDay = normalizeDay(item.service.day);

    if (serviceDay === todayNormalized) {
      return isServiceInFuture(item.service.time, currentTime.hours, currentTime.minutes);
    }

    if (serviceDay === tomorrowNormalized) {
      return true;
    }

    return false;
  };

  const filteredConfessions = allConfessions.filter((item) => {
    return matchesName(item) && matchesDayFilter(item);
  });

  const filteredMasses = masses.filter((item) => {
    return matchesName(item) && matchesDayFilter(item);
  });

  const sortByDayAndTimeAsc = (a: ServiceItem, b: ServiceItem): number => {
    const dayOrder = (day: string): number => {
      if (day === todayNormalized) return 0;
      if (day === tomorrowNormalized) return 1;
      return 2;
    };

    const dayComparison = dayOrder(normalizeDay(a.service.day)) - dayOrder(normalizeDay(b.service.day));
    if (dayComparison !== 0) return dayComparison;

    return getTimeInMinutes(a.service.time) - getTimeInMinutes(b.service.time);
  };

  const displayedConfessions = showTodayTomorrow
    ? [...filteredConfessions].sort(sortByDayAndTimeAsc)
    : filteredConfessions;

  const displayedMasses = showTodayTomorrow ? [...filteredMasses].sort(sortByDayAndTimeAsc) : filteredMasses;
  const groupedConfessions = groupServicesByChurch(displayedConfessions);
  const groupedMasses = groupServicesByChurch(displayedMasses);

  const confessionTotalPages = Math.max(1, Math.ceil(groupedConfessions.length / ITEMS_PER_PAGE));
  const massTotalPages = Math.max(1, Math.ceil(groupedMasses.length / ITEMS_PER_PAGE));

  const safeConfessionsPage = Math.min(confessionsPage, confessionTotalPages);
  const safeMassesPage = Math.min(massesPage, massTotalPages);

  const goToConfessionsPage = (page: number): void => {
    setConfessionsPage(Math.min(Math.max(page, 1), confessionTotalPages));
  };

  const goToMassesPage = (page: number): void => {
    setMassesPage(Math.min(Math.max(page, 1), massTotalPages));
  };

  const paginatedConfessions = groupedConfessions.slice(
    (safeConfessionsPage - 1) * ITEMS_PER_PAGE,
    safeConfessionsPage * ITEMS_PER_PAGE,
  );

  const paginatedMasses = groupedMasses.slice(
    (safeMassesPage - 1) * ITEMS_PER_PAGE,
    safeMassesPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-full flex-1 bg-white px-4 py-10">
      <main className="w-full">
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Onde se confessar em {dioceseInfo.city}?
            </h1>
            <p className="mt-2 text-stone-600">
              {dioceseInfo.diocese} · {dioceseInfo.city}/{dioceseInfo.state}
            </p>

            <div className="mx-auto mt-5 max-w-xl text-left">
              <label htmlFor="name-search" className="mb-1 block text-sm font-medium text-stone-800">
                Buscar por nome
              </label>
              <input
                id="name-search"
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setConfessionsPage(1);
                  setMassesPage(1);
                }}
                placeholder="Igreja ou paróquia"
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none ring-amber-200 transition focus:border-amber-500 focus:ring-2"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTodayTomorrow((current) => !current);
                    setConfessionsPage(1);
                    setMassesPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    showTodayTomorrow
                      ? "border-amber-600 bg-amber-100 text-amber-900"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  Hoje e amanhã
                </button>
              </div>
            </div>
          </header>

          <section className="mb-10 border-b border-stone-200 pb-8">
            <h2 className="text-2xl font-semibold text-amber-900">Onde confessar hoje?</h2>
            <p className="mt-1 text-sm text-amber-800">
              {showTodayTomorrow
                ? "Filtrando por hoje e amanhã. Apenas horários futuros."
                : "Sem filtro de dia. Exibindo todos os horários cadastrados."}
            </p>

            <div className="mt-4 space-y-3">
              {groupedConfessions.length > 0 ? (
                paginatedConfessions.map((item) => (
                  <article
                    key={`${item.parishName}-${item.churchName}-${item.churchAddress}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                        Confissão
                      </span>
                    </div>
                    <ChurchLocationDetails address={item.churchAddress} location={item.churchLocation} />
                    <p className="mt-2 text-sm text-stone-800">
                      <span className="font-medium">Paróquia:</span> {item.parishName}{" "}
                      <Link
                        href={`/parish/${item.parishSlug}`}
                        className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2"
                      >
                        Ver detalhes
                      </Link>
                    </p>
                    <p className="text-sm text-stone-800">
                      <span className="font-medium">Horários:</span>{" "}
                      {item.services
                        .map((service) =>
                          service.notes
                            ? `${service.day}, ${service.time} (${service.notes})`
                            : `${service.day}, ${service.time}`,
                        )
                        .join(" · ")}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-stone-600">Nenhum horário de confissão encontrado para esta busca.</p>
              )}

              <PaginationControls
                currentPage={safeConfessionsPage}
                totalPages={confessionTotalPages}
                onPageChange={goToConfessionsPage}
              />
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900">Horários e locais de missa</h2>

            <div className="mt-4 space-y-3">
              {groupedMasses.length > 0 ? (
                paginatedMasses.map((item) => (
                  <article
                    key={`${item.parishName}-${item.churchName}-${item.churchAddress}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-stone-800">
                        Missa
                      </span>
                    </div>
                    <ChurchLocationDetails address={item.churchAddress} location={item.churchLocation} />
                    <p className="mt-2 text-sm text-stone-800">
                      <span className="font-medium">Paróquia:</span> {item.parishName}{" "}
                      <Link
                        href={`/parish/${item.parishSlug}`}
                        className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2"
                      >
                        Ver detalhes
                      </Link>
                    </p>
                    <p className="text-sm text-stone-800">
                      <span className="font-medium">Horários:</span>{" "}
                      {item.services
                        .map((service) =>
                          service.notes
                            ? `${service.day}, ${service.time} (${service.notes})`
                            : `${service.day}, ${service.time}`,
                        )
                        .join(" · ")}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-stone-600">Nenhuma missa encontrada para esta busca.</p>
              )}

              <PaginationControls
                currentPage={safeMassesPage}
                totalPages={massTotalPages}
                onPageChange={goToMassesPage}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
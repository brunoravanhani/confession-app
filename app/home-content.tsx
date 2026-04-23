"use client";

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
  churchName: string;
  churchAddress: string;
  churchLocation?: ChurchLocation;
  service: Service;
};

const MASS_TYPE = 1;
const CONFESSION_TYPE = 2;
const CITY_SLUG = "cuiaba";

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

function getServicesByType(cityEntry: CityEntry, serviceType: number): ServiceItem[] {
  return cityEntry.parishes.flatMap((parish) =>
    parish.churches.flatMap((church) =>
      church.services
        .filter((service) => service.type === serviceType)
        .map((service) => ({
          parishName: parish.name,
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

export default function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTodayTomorrow, setShowTodayTomorrow] = useState(true);

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
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Igreja ou paróquia"
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none ring-amber-200 transition focus:border-amber-500 focus:ring-2"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowTodayTomorrow((current) => !current)}
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
              {displayedConfessions.length > 0 ? (
                displayedConfessions.map((item) => (
                  <article
                    key={`${item.churchName}-${item.service.day}-${item.service.time}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                    <ChurchLocationDetails address={item.churchAddress} location={item.churchLocation} />
                    <p className="mt-2 text-sm text-stone-800">
                      <span className="font-medium">Paróquia:</span> {item.parishName}
                    </p>
                    <p className="text-sm text-stone-800">
                      <span className="font-medium">Horário:</span> {item.service.day}, {item.service.time}
                    </p>
                    {item.service.notes ? (
                      <p className="text-sm text-stone-600">{item.service.notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="text-sm text-stone-600">Nenhum horário de confissão encontrado para esta busca.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-stone-900">Horários e locais de missa</h2>

            <div className="mt-4 space-y-3">
              {displayedMasses.length > 0 ? (
                displayedMasses.map((item) => (
                  <article
                    key={`${item.churchName}-${item.service.day}-${item.service.time}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                    <ChurchLocationDetails address={item.churchAddress} location={item.churchLocation} />
                    <p className="mt-2 text-sm text-stone-800">
                      <span className="font-medium">Paróquia:</span> {item.parishName}
                    </p>
                    <p className="text-sm text-stone-800">
                      <span className="font-medium">Horário:</span> {item.service.day}, {item.service.time}
                    </p>
                    {item.service.notes ? (
                      <p className="text-sm text-stone-600">{item.service.notes}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="text-sm text-stone-600">Nenhuma missa encontrada para esta busca.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
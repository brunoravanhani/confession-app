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

type Church = {
  name: string;
  address: string;
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

function getServicesByType(cityEntry: CityEntry, serviceType: number): ServiceItem[] {
  return cityEntry.parishes.flatMap((parish) =>
    parish.churches.flatMap((church) =>
      church.services
        .filter((service) => service.type === serviceType)
        .map((service) => ({
          parishName: parish.name,
          churchName: church.name,
          churchAddress: church.address,
          service,
        })),
    ),
  );
}

export default function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showToday, setShowToday] = useState(true);
  const [showTomorrow, setShowTomorrow] = useState(false);

  const data = parishesData as ParishesData;
  const dioceseInfo = data[CITY_SLUG];
  const allConfessions = getServicesByType(dioceseInfo, CONFESSION_TYPE);
  const masses = getServicesByType(dioceseInfo, MASS_TYPE);

  const today = getTodayInPortuguese();
  const tomorrow = getRelativeDayInPortuguese(1);
  const todayNormalized = normalizeDay(today);
  const tomorrowNormalized = normalizeDay(tomorrow);
  const normalizedSearch = normalizeText(searchQuery);

  const shouldFilterByDay = showToday || showTomorrow;

  const matchesName = (item: ServiceItem): boolean => {
    if (!normalizedSearch) return true;

    return (
      normalizeText(item.churchName).includes(normalizedSearch) ||
      normalizeText(item.parishName).includes(normalizedSearch)
    );
  };

  const matchesDayFilter = (item: ServiceItem): boolean => {
    if (!shouldFilterByDay) return true;

    const serviceDay = normalizeDay(item.service.day);

    return (showToday && serviceDay === todayNormalized) ||
      (showTomorrow && serviceDay === tomorrowNormalized);
  };

  const filteredConfessions = allConfessions.filter((item) => {
    return matchesName(item) && matchesDayFilter(item);
  });

  const filteredMasses = masses.filter((item) => {
    return matchesName(item) && matchesDayFilter(item);
  });

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
                  onClick={() => setShowToday((current) => !current)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    showToday
                      ? "border-amber-600 bg-amber-100 text-amber-900"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setShowTomorrow((current) => !current)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    showTomorrow
                      ? "border-amber-600 bg-amber-100 text-amber-900"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  Amanhã
                </button>
              </div>
            </div>
          </header>

          <section className="mb-10 border-b border-stone-200 pb-8">
            <h2 className="text-2xl font-semibold text-amber-900">Onde confessar hoje?</h2>
            <p className="mt-1 text-sm text-amber-800">
              {showToday || showTomorrow
                ? `Filtrando por: ${[showToday ? "Hoje" : "", showTomorrow ? "Amanhã" : ""]
                    .filter(Boolean)
                    .join(" e ")}.`
                : "Sem filtro de dia. Exibindo todos os horários cadastrados."}
            </p>

            <div className="mt-4 space-y-3">
              {filteredConfessions.length > 0 ? (
                filteredConfessions.map((item) => (
                  <article
                    key={`${item.churchName}-${item.service.day}-${item.service.time}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                    <p className="text-sm text-stone-700">{item.churchAddress}</p>
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
              {filteredMasses.length > 0 ? (
                filteredMasses.map((item) => (
                  <article
                    key={`${item.churchName}-${item.service.day}-${item.service.time}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                    <p className="text-sm text-stone-700">{item.churchAddress}</p>
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
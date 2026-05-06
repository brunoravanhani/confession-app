"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getCityEntry,
  getServicesByType,
  groupServicesByChurch,
  getTodayInPortuguese,
  getCurrentTimeInCuiaba,
  isServiceInFuture,
  getTimeInMinutes,
  normalizeDay,
  normalizeText,
  ITEMS_PER_PAGE,
  type ServiceItem,
} from "@/app/lib/parishes";
import ChurchLocationDetails from "@/app/components/ChurchLocationDetails";
import PaginationControls from "@/app/components/PaginationControls";

const WEEKDAY_FILTERS = [
  { label: "Segunda", normalized: normalizeDay("Segunda-feira") },
  { label: "Terça", normalized: normalizeDay("Terça-feira") },
  { label: "Quarta", normalized: normalizeDay("Quarta-feira") },
  { label: "Quinta", normalized: normalizeDay("Quinta-feira") },
  { label: "Sexta", normalized: normalizeDay("Sexta-feira") },
  { label: "Sábado", normalized: normalizeDay("Sábado") },
  { label: "Domingo", normalized: normalizeDay("Domingo") },
];

function getOrderedWeekdayFilters(todayNormalized: string) {
  const currentDayIndex = WEEKDAY_FILTERS.findIndex((day) => day.normalized === todayNormalized);

  if (currentDayIndex === -1) {
    return WEEKDAY_FILTERS;
  }

  return [
    ...WEEKDAY_FILTERS.slice(currentDayIndex),
    ...WEEKDAY_FILTERS.slice(0, currentDayIndex),
  ];
}

type ServicePageContentProps = {
  serviceType: number;
  pageTitle: string;
  sectionTitle: string;
  badgeLabel: string;
  badgeClassName: string;
  emptyMessage: string;
  navigationHref: string;
  navigationLabel: string;
  timeFilterOptions?: string[];
  filterByCurrentTime?: boolean;
};

export default function ServicePageContent({
  serviceType,
  pageTitle,
  sectionTitle,
  badgeLabel,
  badgeClassName,
  emptyMessage,
  navigationHref,
  navigationLabel,
  timeFilterOptions,
  filterByCurrentTime = true,
}: ServicePageContentProps) {
  const today = getTodayInPortuguese();
  const todayNormalized = normalizeDay(today);
  const orderedWeekdayFilters = getOrderedWeekdayFilters(todayNormalized);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(() =>
    orderedWeekdayFilters.slice(0, 1).map((day) => day.normalized),
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const dioceseInfo = getCityEntry();
  const allServices = getServicesByType(dioceseInfo, serviceType);

  const normalizedSearch = normalizeText(searchQuery);
  const hasDayFilter = selectedDays.length > 0;
  const weekdayOrder = new Map(
    orderedWeekdayFilters.map((day, index) => [day.normalized, index]),
  );

  const currentTime = getCurrentTimeInCuiaba();

  const matchesName = (item: ServiceItem): boolean => {
    if (!normalizedSearch) return true;
    return (
      normalizeText(item.churchName).includes(normalizedSearch) ||
      normalizeText(item.parishName).includes(normalizedSearch)
    );
  };

  const matchesDayFilter = (item: ServiceItem): boolean => {
    if (!hasDayFilter) return true;

    const serviceDay = normalizeDay(item.service.day);

    if (!selectedDays.includes(serviceDay)) {
      return false;
    }

    if (serviceDay === todayNormalized) {
      if (!filterByCurrentTime) return true;
      return isServiceInFuture(item.service.time, currentTime.hours, currentTime.minutes);
    }

    return true;
  };

  const matchesTimeFilter = (item: ServiceItem): boolean => {
    if (!timeFilterOptions?.length || selectedTimes.length === 0) return true;
    return selectedTimes.includes(item.service.time);
  };

  const filteredServices = allServices.filter(
    (item) => matchesName(item) && matchesDayFilter(item) && matchesTimeFilter(item),
  );

  const sortByDayAndTimeAsc = (a: ServiceItem, b: ServiceItem): number => {
    const dayComparison =
      (weekdayOrder.get(normalizeDay(a.service.day)) ?? Number.MAX_SAFE_INTEGER) -
      (weekdayOrder.get(normalizeDay(b.service.day)) ?? Number.MAX_SAFE_INTEGER);
    if (dayComparison !== 0) return dayComparison;

    return getTimeInMinutes(a.service.time) - getTimeInMinutes(b.service.time);
  };

  const shouldSort = hasDayFilter;
  const displayedServices = shouldSort
    ? [...filteredServices].sort(sortByDayAndTimeAsc)
    : filteredServices;

  const groupedServices = groupServicesByChurch(displayedServices);
  const totalPages = Math.max(1, Math.ceil(groupedServices.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const goToPage = (page: number): void => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const paginatedServices = groupedServices.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const selectedDayLabels = orderedWeekdayFilters
    .filter((day) => selectedDays.includes(day.normalized))
    .map((day) => day.label);

  const dayFilterLabel = selectedDayLabels.length > 0 ? selectedDayLabels.join(", ") : null;

  return (
    <div className="min-h-full flex-1 bg-white px-4 py-10">
      <main className="w-full">
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-2 text-stone-600">
              {dioceseInfo.diocese} · {dioceseInfo.city}/{dioceseInfo.state}
            </p>

            <nav className="mt-4 flex justify-center text-sm font-medium">
              <Link
                href={navigationHref}
                className="inline-flex items-center rounded-md border border-amber-600 bg-amber-50 px-4 py-2 text-amber-900 transition hover:bg-amber-100"
              >
                {navigationLabel}
              </Link>
            </nav>

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
                  setCurrentPage(1);
                }}
                placeholder="Igreja ou paróquia"
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none ring-amber-200 transition focus:border-amber-500 focus:ring-2"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {orderedWeekdayFilters.map((day) => {
                  const isSelected = selectedDays.includes(day.normalized);

                  return (
                    <button
                      key={day.normalized}
                      type="button"
                      onClick={() => {
                        setSelectedDays((current) =>
                          current.includes(day.normalized)
                            ? current.filter((selectedDay) => selectedDay !== day.normalized)
                            : [...current, day.normalized],
                        );
                        setCurrentPage(1);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        isSelected
                          ? "border-amber-600 bg-amber-100 text-amber-900"
                          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>

              {timeFilterOptions?.length ? (
                <div className="mt-3">
                  <p className="mb-1 block text-sm font-medium text-stone-800">
                    Filtrar por horário
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {timeFilterOptions.map((timeOption) => {
                      const isSelected = selectedTimes.includes(timeOption);

                      return (
                        <button
                          key={timeOption}
                          type="button"
                          onClick={() => {
                            setSelectedTimes((current) =>
                              current.includes(timeOption)
                                ? current.filter((time) => time !== timeOption)
                                : [...current, timeOption],
                            );
                            setCurrentPage(1);
                          }}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                            isSelected
                              ? "border-amber-600 bg-amber-100 text-amber-900"
                              : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {timeOption}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <section>
            <h2 className="text-2xl font-semibold text-amber-900">{sectionTitle}</h2>
            <p className="mt-1 text-sm text-amber-800">
              {dayFilterLabel
                ? `Filtrando por ${dayFilterLabel}.`
                : "Exibindo todos os horários."}
            </p>

            <div className="mt-4 space-y-3">
              {paginatedServices.length > 0 ? (
                paginatedServices.map((item) => (
                  <article
                    key={`${item.parishName}-${item.churchName}-${item.churchAddress}`}
                    className="border-b border-stone-200 pb-4"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{item.churchName}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClassName}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                    <ChurchLocationDetails
                      address={item.churchAddress}
                      location={item.churchLocation}
                    />
                    <p className="mt-2 text-sm text-stone-800">
                      <span className="font-medium">Paróquia:</span> {item.parishName}{" "}
                      <Link
                        href={`/paroquia/${item.parishSlug}`}
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
                <p className="text-sm text-stone-600">{emptyMessage}</p>
              )}

              <PaginationControls
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

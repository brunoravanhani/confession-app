"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getCityEntry,
  getServicesByType,
  groupServicesByChurch,
  getTodayInPortuguese,
  getRelativeDayInPortuguese,
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
}: ServicePageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showToday, setShowToday] = useState(true);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const dioceseInfo = getCityEntry();
  const allServices = getServicesByType(dioceseInfo, serviceType);

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
    const serviceDay = normalizeDay(item.service.day);

    if (serviceDay === todayNormalized) {
      if (!showToday) return false;
      return isServiceInFuture(item.service.time, currentTime.hours, currentTime.minutes);
    }

    if (serviceDay === tomorrowNormalized) {
      return showTomorrow;
    }

    return false;
  };

  const matchesTimeFilter = (item: ServiceItem): boolean => {
    if (!timeFilterOptions?.length || selectedTimes.length === 0) return true;
    return selectedTimes.includes(item.service.time);
  };

  const filteredServices = allServices.filter(
    (item) => matchesName(item) && matchesDayFilter(item) && matchesTimeFilter(item),
  );

  const sortByDayAndTimeAsc = (a: ServiceItem, b: ServiceItem): number => {
    const dayOrder = (day: string): number => {
      if (day === todayNormalized) return 0;
      if (day === tomorrowNormalized) return 1;
      return 2;
    };

    const dayComparison =
      dayOrder(normalizeDay(a.service.day)) - dayOrder(normalizeDay(b.service.day));
    if (dayComparison !== 0) return dayComparison;

    return getTimeInMinutes(a.service.time) - getTimeInMinutes(b.service.time);
  };

  const shouldSort = showToday || showTomorrow;
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

  const dayFilterLabel =
    showToday && showTomorrow
      ? "hoje e amanhã"
      : showToday
        ? "hoje"
        : showTomorrow
          ? "amanhã"
          : null;

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
                <button
                  type="button"
                  onClick={() => {
                    setShowToday((current) => !current);
                    setCurrentPage(1);
                  }}
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
                  onClick={() => {
                    setShowTomorrow((current) => !current);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    showTomorrow
                      ? "border-amber-600 bg-amber-100 text-amber-900"
                      : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                  }`}
                >
                  Amanhã
                </button>
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
                : "Selecione um filtro de dia para ver os horários."}
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

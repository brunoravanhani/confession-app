import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  address?: string;
  location?: ChurchLocation;
  services: Service[];
};

type Priest = {
  name: string;
  role?: string;
};

type Parish = {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  priests?: Priest[];
  churches: Church[];
};

type CityEntry = {
  diocese: string;
  city: string;
  state: string;
  parishes: Parish[];
};

type ParishesData = Record<string, CityEntry>;

type ParishMatch = {
  citySlug: string;
  city: CityEntry;
  parish: Parish;
};

const data = parishesData as ParishesData;

function findParishBySlug(slug: string): ParishMatch | null {
  for (const [citySlug, city] of Object.entries(data)) {
    const parish = city.parishes.find((entry) => entry.slug === slug);
    if (parish) {
      return { citySlug, city, parish };
    }
  }

  return null;
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

export function generateStaticParams(): Array<{ slug: string }> {
  return Object.values(data)
    .flatMap((city) => city.parishes)
    .map((parish) => ({ slug: parish.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const match = findParishBySlug(slug);

  if (!match) {
    return {
      title: "Paróquia não encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${match.parish.name} em ${match.city.city}`,
    description: `Informações da ${match.parish.name}: contatos, igrejas e horários cadastrados.`,
    alternates: {
      canonical: `/parish/${match.parish.slug}`,
    },
    openGraph: {
      title: `${match.parish.name} em ${match.city.city}`,
      description: `Veja os dados completos da ${match.parish.name}.`,
      url: `/parish/${match.parish.slug}`,
      locale: "pt_BR",
      type: "website",
    },
  };
}

export default async function ParishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = findParishBySlug(slug);

  if (!match) {
    notFound();
  }

  const { citySlug, city, parish } = match;

  return (
    <main className="min-h-full flex-1 bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 border-b border-stone-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-amber-800">{city.diocese}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{parish.name}</h1>
          <p className="mt-2 text-stone-600">
            {city.city}/{city.state}
          </p>
          <div className="mt-4">
            <Link
              href={`/?city=${citySlug}`}
              className="inline-flex items-center rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 transition hover:border-stone-400"
            >
              Voltar para horários
            </Link>
          </div>
        </header>

        <section className="rounded-lg border border-stone-200 bg-stone-50/50 p-5">
          <h2 className="text-xl font-semibold text-stone-900">Informações da paróquia</h2>

          <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
            {parish.address ? (
              <p>
                <span className="font-medium text-stone-900">Endereço:</span> {parish.address}
              </p>
            ) : null}
            {parish.phone ? (
              <p>
                <span className="font-medium text-stone-900">Telefone:</span> {parish.phone}
              </p>
            ) : null}
            {parish.email ? (
              <p>
                <span className="font-medium text-stone-900">Email:</span> {parish.email}
              </p>
            ) : null}
            {parish.website ? (
              <p>
                <span className="font-medium text-stone-900">Site:</span>{" "}
                <a
                  href={parish.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 underline decoration-amber-300 underline-offset-2"
                >
                  Acessar
                </a>
              </p>
            ) : null}
            {parish.instagram ? (
              <p>
                <span className="font-medium text-stone-900">Instagram:</span>{" "}
                <a
                  href={parish.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 underline decoration-amber-300 underline-offset-2"
                >
                  Perfil
                </a>
              </p>
            ) : null}
            <p>
              <span className="font-medium text-stone-900">Igrejas:</span> {parish.churches.length}
            </p>
          </div>

          {parish.priests && parish.priests.length > 0 ? (
            <p className="mt-3 text-sm text-stone-700">
              <span className="font-medium text-stone-900">Padres:</span>{" "}
              {parish.priests
                .map((priest) => (priest.role ? `${priest.name} (${priest.role})` : priest.name))
                .join(" · ")}
            </p>
          ) : null}
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-2xl font-semibold text-stone-900">Igrejas e horários</h2>

          {parish.churches.map((church) => {
            const mapLink = getGoogleMapsLink(church.location);

            return (
              <article key={church.name} className="rounded-lg border border-stone-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-stone-900">{church.name}</h3>

                {church.address ? <p className="mt-1 text-sm text-stone-700">{church.address}</p> : null}

                {mapLink ? (
                  <p className="mt-1 text-sm">
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-amber-800 underline decoration-amber-300 underline-offset-2"
                    >
                      Ver no Google Maps
                    </a>
                  </p>
                ) : null}

                <ul className="mt-3 space-y-2 text-sm text-stone-800">
                  {church.services.map((service, index) => (
                    <li key={`${church.name}-${service.type_name}-${service.day}-${service.time}-${index}`}>
                      <span className="font-medium text-stone-900">{service.type_name}:</span> {service.day},{" "}
                      {service.time}
                      {service.notes ? ` (${service.notes})` : ""}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import MissasContent from "./missas-content";
import parishesData from "@/data/parishes.json";

type Service = {
  type: number;
};

type Church = {
  name: string;
  address?: string;
  services: Service[];
};

type Parish = {
  name: string;
  churches: Church[];
};

type CityEntry = {
  city: string;
  state: string;
  parishes: Parish[];
};

type ParishesData = Record<string, CityEntry>;

type ListItem = {
  "@type": "ListItem";
  position: number;
  name: string;
  address?: string;
};

const CITY_SLUG = "cuiaba";
const MASS_TYPE = 1;

const data = parishesData as ParishesData;
const cityEntry = data[CITY_SLUG];

export const metadata: Metadata = {
  title: `Missas em ${cityEntry.city}`,
  description: `Encontre horários de missa em ${cityEntry.city} com busca por igreja e filtros por dia.`,
  alternates: {
    canonical: "/missas",
  },
  openGraph: {
    title: `Missas em ${cityEntry.city}`,
    description: `Consulte horários de missa em ${cityEntry.city} por igreja, paróquia e dia da semana.`,
    url: "/missas",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    title: `Missas em ${cityEntry.city}`,
    description: `Consulte horários de missa em ${cityEntry.city} por igreja, paróquia e dia da semana.`,
  },
};

function buildStructuredData(entry: CityEntry): { "@context": "https://schema.org"; "@graph": unknown[] } {
  const massPlaces: ListItem[] = entry.parishes
    .flatMap((parish) =>
      parish.churches
        .filter((church) => church.services.some((service) => service.type === MASS_TYPE))
        .map((church) => ({
          "@type": "ListItem" as const,
          position: 0,
          name: `${church.name} (${parish.name})`,
          address: church.address,
        })),
    )
    .slice(0, 30)
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Missas em Cuiabá",
        inLanguage: "pt-BR",
        url: "/missas",
      },
      {
        "@type": "CollectionPage",
        name: `Horários de missa em ${entry.city}`,
        about: ["Missa", "Paróquias"],
      },
      {
        "@type": "ItemList",
        name: `Igrejas com horários de missa em ${entry.city}`,
        numberOfItems: massPlaces.length,
        itemListElement: massPlaces,
      },
    ],
  };
}

export default function MissasPage() {
  const structuredData = buildStructuredData(cityEntry);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MissasContent />
    </>
  );
}

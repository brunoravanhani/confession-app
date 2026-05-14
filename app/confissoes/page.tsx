import type { Metadata } from "next";
import ConfissoesContent from "./confissoes-content";
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
const CONFESSION_TYPE = 2;

const data = parishesData as ParishesData;
const cityEntry = data[CITY_SLUG];

export const metadata: Metadata = {
  title: `Onde se confessar em ${cityEntry.city}`,
  description:
    "Encontre horários atualizados de confissão e missa em Cuiabá, com busca por igreja e filtros por dia.",
  alternates: {
    canonical: "/confissoes",
  },
  openGraph: {
    title: `Onde se confessar em ${cityEntry.city}`,
    description:
      "Consulte horários de confissão e missa em Cuiabá por igreja, paróquia e dia da semana.",
    url: "/confissoes",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    title: `Onde se confessar em ${cityEntry.city}`,
    description:
      "Consulte horários de confissão e missa em Cuiabá por igreja, paróquia e dia da semana.",
  },
};

function buildStructuredData(entry: CityEntry): { "@context": "https://schema.org"; "@graph": unknown[] } {
  const confessionPlaces: ListItem[] = entry.parishes
    .flatMap((parish) =>
      parish.churches
        .filter((church) => church.services.some((service) => service.type === CONFESSION_TYPE))
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
        name: "Confissão em Cuiabá",
        inLanguage: "pt-BR",
        url: "/confissoes",
      },
      {
        "@type": "CollectionPage",
        name: `Horários de confissão e missa em ${entry.city}`,
        about: ["Confissão", "Missa", "Paróquias"],
      },
      {
        "@type": "ItemList",
        name: `Igrejas com horários de confissão em ${entry.city}`,
        numberOfItems: confessionPlaces.length,
        itemListElement: confessionPlaces,
      },
    ],
  };
}

export default function ConfissoesPage() {
  const structuredData = buildStructuredData(cityEntry);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ConfissoesContent />
    </>
  );
}

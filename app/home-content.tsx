import Link from "next/link";
import {
  CONFESSION_TYPE,
  MASS_TYPE,
  type Church,
  type Parish,
  type Service,
} from "@/app/lib/parishes";
import { getCityEntry, getHighlightedParishes } from "@/app/lib/parishes-data";
import ChurchLocationDetails from "@/app/components/ChurchLocationDetails";

const cityEntry = getCityEntry();
const highlightedParishes = getHighlightedParishes(cityEntry);

function ServiceGroup({
  label,
  badgeClassName,
  services,
}: {
  label: string;
  badgeClassName: string;
  services: Service[];
}) {
  if (services.length === 0) return null;

  return (
    <div>
      <span className={`mb-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClassName}`}>
        {label}
      </span>
      <ul className="space-y-0.5">
        {services.map((s, i) => (
          <li key={i} className="text-sm text-stone-700">
            <span className="font-medium">{s.day}</span>
            {" · "}
            {s.time}
            {s.notes ? <span className="text-stone-500"> — {s.notes}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChurchCard({ church }: { church: Church }) {
  const confessions = church.services.filter((s) => s.type === CONFESSION_TYPE);
  const masses = church.services.filter((s) => s.type === MASS_TYPE);

  if (confessions.length === 0 && masses.length === 0) return null;

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="mb-2 font-semibold text-stone-900">{church.name}</p>
      <div className="mb-3">
        <ChurchLocationDetails address={church.address} location={church.location} />
      </div>
      <div className="space-y-3">
        <ServiceGroup
          label="Confissão"
          badgeClassName="bg-amber-100 text-amber-900"
          services={confessions}
        />
        <ServiceGroup
          label="Missa"
          badgeClassName="bg-blue-100 text-blue-900"
          services={masses}
        />
      </div>
    </div>
  );
}

function ParishCard({ parish }: { parish: Parish }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-stone-900">{parish.name}</h2>
        <Link
          href={`/paroquia/${parish.slug}`}
          className="shrink-0 text-sm font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-900"
        >
          Ver paróquia
        </Link>
      </div>
      <div className="space-y-3">
        {parish.churches
          .filter((church) => church.head === true)
          .map((church) => (
            <ChurchCard key={church.name} church={church} />
          ))}
      </div>
    </div>
  );
}

export default function HomeContent() {
  return (
    <div className="min-h-full flex-1 bg-white px-4 py-10">
      <main className="w-full">
        <div className="mx-auto w-full max-w-4xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Onde se confessar em {cityEntry.city}?
            </h1>
            <p className="mt-2 text-stone-600">
              {cityEntry.diocese} · {cityEntry.city}/{cityEntry.state}
            </p>
            <nav className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-medium">
              <Link
                href="/confissoes"
                className="inline-flex items-center rounded-md border border-amber-600 bg-amber-50 px-4 py-2 text-amber-900 transition hover:bg-amber-100"
              >
                Confissões de todas as paróquias
              </Link>
              <Link
                href="/missas"
                className="inline-flex items-center rounded-md border border-blue-600 bg-blue-50 px-4 py-2 text-blue-900 transition hover:bg-blue-100"
              >
                Missas de todas as paróquias
              </Link>
            </nav>
          </header>
          <section>
            <div className="space-y-6">
              {highlightedParishes.map((parish) => (
                <ParishCard key={parish.slug} parish={parish} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


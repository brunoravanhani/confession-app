import { getGoogleMapsLink } from "@/app/lib/parishes";
import type { ChurchLocation } from "@/app/lib/parishes";

export default function ChurchLocationDetails({
  address,
  location,
}: {
  address: string;
  location?: ChurchLocation;
}) {
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

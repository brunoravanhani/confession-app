export const dynamic = "force-static";

const adsTxt = "google.com, pub-4860902403546438, DIRECT, f08c47fec0942fa0\n";

export async function GET(): Promise<Response> {
  return new Response(adsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
const base = "https://casher-five.vercel.app";
const origin = "https://cutsaloon.com";

const res = await fetch(`${base}/api/public/booking/DOES-NOT-EXIST-8B2`, {
  headers: { Origin: origin },
  cache: "no-store",
});
const text = await res.text();
let json = null;
try {
  json = JSON.parse(text);
} catch {
  /* ignore */
}

console.log(
  JSON.stringify(
    {
      status: res.status,
      acao: res.headers.get("access-control-allow-origin"),
      contract: res.headers.get("x-booking-contract-version"),
      expose: res.headers.get("access-control-expose-headers"),
      requestId: res.headers.get("x-request-id"),
      errorCode: json?.error?.code ?? json?.error_code ?? null,
      createSkipped: true,
      cancelSkipped: true,
      note: "Invalid lookup probe only — no controlled cancel",
    },
    null,
    2,
  ),
);

const r = await fetch(
  "https://casher-five.vercel.app/api/public/booking/services?branchCode=GLEEM",
  { headers: { Origin: "https://cutsaloon.com" }, cache: "no-store" },
);
const j = await r.json();
console.log(
  JSON.stringify(
    {
      status: r.status,
      services: (j.services || []).length,
      contract: r.headers.get("x-booking-contract-version"),
      expose: r.headers.get("access-control-expose-headers"),
      acao: r.headers.get("access-control-allow-origin"),
    },
    null,
    2,
  ),
);

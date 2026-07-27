const base = "https://casher-five.vercel.app";
const origin = "https://cutsaloon.com";
const today = new Date().toISOString().slice(0, 10);

const global = await fetch(`${base}/api/public/booking/barbers`, {
  headers: { Origin: origin },
  cache: "no-store",
});
const gj = await global.json();
const b = (gj.barbers || [])[0];
console.log(
  JSON.stringify(
    {
      status: global.status,
      count: (gj.barbers || []).length,
      sample: b
        ? {
            id: b.id,
            empId: b.empId,
            name: b.name,
            serviceIds: b.serviceIds,
            branches: b.branches,
            isBookableOnline: b.isBookableOnline,
          }
        : null,
    },
    null,
    2,
  ),
);

if (b?.id) {
  const loc = await fetch(
    `${base}/api/public/booking/barbers/${b.id}/location?date=${today}`,
    { headers: { Origin: origin }, cache: "no-store" },
  );
  console.log("location", loc.status, (await loc.text()).slice(0, 600));
}

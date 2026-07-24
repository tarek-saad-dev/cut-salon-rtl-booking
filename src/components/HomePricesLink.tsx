export default function HomePricesLink() {
  return (
    <section id="services" className="relative overflow-hidden bg-cut-black py-20 text-cut-ivory md:py-28" dir="rtl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cut-bronze/35 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(74,0,15,0.38),transparent_48%)]" />
      <div className="container relative z-10 px-5 text-center md:px-8">
        <p className="font-display text-xs tracking-[0.3em] text-cut-bronze">CUT SALON</p>
        <h2 className="mt-4 text-4xl font-black md:text-6xl">اكتشف أسعار وخدمات Cut Salon</h2>
        <a href="/prices" className="mt-8 inline-flex min-h-12 items-center justify-center bg-cut-ivory px-7 font-bold text-cut-black transition hover:bg-cut-warm-beige focus:outline-none focus-visible:ring-2 focus-visible:ring-cut-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-cut-black">
          عرض قائمة الأسعار
        </a>
      </div>
    </section>
  );
}

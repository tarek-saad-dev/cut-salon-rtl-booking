/** One art-directed resource, discovered in server HTML without a JS or CSS gate. */
export default function HeroPicture() {
  return (
    <picture className="block w-full h-full">
      <source media="(min-width: 768px)" type="image/webp" srcSet="/hero-1280.webp 1280w, /hero-1672.webp 1672w" sizes="100vw" />
      <source media="(min-width: 768px)" srcSet="/hero.png" />
      <source media="(max-width: 767px)" type="image/webp" srcSet="/hero_vertical-480.webp 480w, /hero_vertical-941.webp 941w" sizes="100vw" />
      <img
        src="/hero_vertical.png"
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        className="w-full h-full object-cover object-[center_18%] opacity-75 md:object-[right_center] md:scale-105 md:opacity-40 md:mix-blend-luminosity"
      />
    </picture>
  );
}

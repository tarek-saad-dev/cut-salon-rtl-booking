---
name: cut-salon-frontend-design
description: Design and implement premium, production-ready frontend interfaces for Cut Salon landing pages, booking flows, POS/operations screens, and customer-facing salon experiences. Use this skill when creating or improving Cut Salon UI, booking pages, barber/service sections, queue interfaces, receipt screens, loyalty flows, or admin/POS modules.
license: Internal project skill for Cut Salon
---

# Cut Salon Frontend Design Skill

## Purpose

This skill guides the creation of distinctive, production-grade frontend interfaces for **Cut Salon**, a premium men’s salon brand in Alexandria with two branches:

1. **جليم - سابا باشا**

The goal is to produce interfaces that feel premium, fast, clear, and commercially effective while preserving the brand’s dark luxury identity.

Use this skill for:

- Public landing pages
- Booking pages
- Barber selection flows
- Service/pricing sections
- Queue and operations interfaces
- POS screens
- Receipt and ticket previews
- Loyalty card/customer reward flows
- Admin modules related to employees, bookings, treasury, salaries, services, or branches

---

## Brand Direction

Cut Salon should feel like a **premium masculine grooming brand**, not a generic SaaS product.

### Core aesthetic

- Dark luxury
- Cinematic barber atmosphere
- Masculine, clean, confident
- Minimal but visually strong
- Premium black/gold identity
- High contrast, polished spacing, refined typography

### Avoid

- Generic AI-generated UI
- Basic template layouts
- Flat gray dashboards without hierarchy
- Random color accents
- Cluttered cards
- Oversized mobile sections
- White broken image placeholders
- Weak CTA visibility
- Low-contrast Arabic text
- UI that feels like a cheap booking form

---

## Visual Identity

### Colors

Use these as the default direction unless the current project defines exact tokens:

```css
--cut-black: #050505;
--cut-bg: #0a0a0a;
--cut-surface: #111111;
--cut-surface-soft: #171717;
--cut-border: rgba(212, 175, 55, 0.18);
--cut-gold: #d4af37;
--cut-gold-soft: #e7c766;
--cut-gold-dark: #9f7a18;
--cut-white: #f7f7f2;
--cut-muted: #a1a1aa;
--cut-muted-dark: #71717a;
```

### Background style

Use layered dark backgrounds:

- Near-black base
- Subtle radial gold glow
- Soft vignette overlays
- Very subtle grid/noise texture if appropriate
- Cinematic gradients over images

Example direction:

```tsx
<section className="relative overflow-hidden bg-[#050505] text-white">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_35%)]" />
  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
</section>
```

### Typography

- Arabic RTL must be clear, spacious, and premium.
- Use strong hierarchy: small gold eyebrow, large headline, muted supporting text.
- Avoid making Arabic text too thin or too small.
- Buttons should have confident weight.

Recommended structure:

```tsx
<p className="text-sm font-semibold tracking-wide text-[#D4AF37]">أسلوبك يبدأ من هنا</p>
<h1 className="text-4xl md:text-6xl font-black leading-tight text-white">احجز ستايلك بسهولة</h1>
<p className="text-base md:text-lg leading-8 text-zinc-300">اختر الحلاق المناسب لك واحجز في ثواني داخل Cut Salon.</p>
```

---

## UX Principles

### 1. Conversion first

Every public page should guide the customer toward one clear action:

**احجز الآن**

Secondary actions can include:

- شاهد الحلاقين
- اعرف الأسعار
- اختار أقرب حلاق
- تواصل معنا

### 2. Trust quickly

Above the fold, communicate:

- Professional barbers
- Fast booking
- Organized queue
- Premium experience
- Clear branches

### 3. Mobile-first practicality

Most users will likely visit from mobile. Mobile must be:

- Compact
- Fast to scan
- CTA visible early
- No huge empty vertical spaces
- No oversized image cards
- No broken placeholders
- Horizontal scroll only when it improves UX

### 4. RTL done properly

- Use `dir="rtl"` when needed.
- Arabic alignment should feel natural.
- Icons should not visually conflict with RTL direction.
- Timelines and step flows should read right-to-left.

---

## Public Landing Page Structure

When designing the full Cut Salon landing page, use this preferred structure:

1. Header / Navigation
2. Hero section
3. Barber preview strip
4. Team / Barber selection
5. Booking notice
6. Services and prices
7. Main booking CTA
8. Why choose Cut Salon
9. How booking works
10. Branches / Contact
11. Footer

---

## Section Guidelines

## 1. Header

The header should be minimal and premium.

Include:

- CUT logo
- Navigation links if available:
  - الرئيسية
  - الخدمات
  - الحلاقين
  - الفروع
- Primary CTA: احجز الآن

Style:

- Transparent or dark glass over hero
- Thin gold active indicator
- Compact on mobile
- Avoid bulky navbar blocks

---

## 2. Hero Section

The hero is the most important section.

### Required content

- Logo or brand mark
- Eyebrow: `أسلوبك يبدأ من هنا`
- Main headline: `احجز ستايلك بسهولة`
- Supporting text: explain that the customer can choose the right barber and book quickly.
- Primary CTA: `احجز الآن`
- Secondary CTA: `شاهد الحلاقين`
- Trust badges:
  - حجز سريع
  - حلاقين محترفين
  - مواعيد دقيقة
  - تجربة فاخرة

### Visual direction

- Use a cinematic barber/salon image.
- Add a strong dark overlay for readability.
- Place headline with strong contrast.
- Add subtle gold highlights, not too much.
- Desktop can feel wide and cinematic.
- Mobile should be compact and focused.

### Hero layout pattern

```tsx
<section
  className="relative min-h-[760px] md:min-h-screen overflow-hidden bg-black text-white"
  dir="rtl"
>
  <Image
    src="/images/hero-barber.jpg"
    alt="Cut Salon"
    fill
    className="object-cover opacity-55"
    priority
  />
  <div className="absolute inset-0 bg-gradient-to-l from-black via-black/80 to-black/30" />
  <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-5 py-24">
    <div className="max-w-2xl">
      <p className="mb-4 text-sm font-bold text-[#D4AF37]">
        أسلوبك يبدأ من هنا
      </p>
      <h1 className="text-5xl font-black leading-tight md:text-7xl">
        احجز ستايلك بسهولة
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-9 text-zinc-300">
        اختار الحلاق المناسب لك واحجز في ثواني داخل Cut Salon. تجربة سريعة،
        منظمة، وراقية.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="bg-[#D4AF37] text-black hover:bg-[#E7C766]">
          احجز الآن
        </Button>
        <Button
          variant="outline"
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          شاهد الحلاقين
        </Button>
      </div>
    </div>
  </div>
</section>
```

---

## 3. Barber Preview Strip

This strip should create immediate confidence that real barbers are available.

### Include

- Barber image or placeholder
- Barber name
- Rating if available
- Compact card design

### UX

- Horizontal scroll on mobile
- Premium mini-cards on desktop
- Subtle gold border/glow
- No broken empty images

### Missing image rule

If barber image is missing, show:

- Dark gradient placeholder
- Barber initials
- Small CUT mark or scissors icon
- Never show a white blank image box

---

## 4. Team / Barber Selection

Section title:

- Eyebrow: `فريقنا`
- Headline: `اختر حلاقك المفضل`

### Barber card content

- Image or luxury placeholder
- Name
- Role: `حلاق`
- Optional status: available/offline if real data exists
- CTA: `احجز مع [الاسم]`

### Card style

- Dark surface
- Thin gold border
- Large image area
- Strong name typography
- Gold CTA button
- Hover lift/glow on desktop

### Important behavior

Do not break existing booking logic. Use the existing click handlers/routes/API data.

---

## 5. Booking Notice

Keep this message:

`علشان نحافظ على جودة الخدمة، الحجز يكون قبلها بـ 4 ساعات`

Add this line:

`ولو جاي دلوقتي فورًا، بتاخد دور وبتدخل في دورك على طول.`

### Style

This should feel like a premium service policy card, not an error alert.

Recommended design:

- Dark glass card
- Small gold icon
- Gold border
- Calm wording
- Centered but not huge

---

## 6. Services and Pricing

Section title:

- Eyebrow: `خدماتنا`
- Headline: `أسعار Cut Salon`
- Supporting text: `اكتشف مجموعة متكاملة من الخدمات المتميزة بأفضل الأسعار.`

### Preferred categories

For customer-facing landing pages, keep services grouped clearly:

1. `خدمات الشعر`
2. `العناية بالبشرة`
3. `خدمات إضافية للشعر`
4. `خدمات إضافية`

### Item display

Each item should show:

- Arabic service name
- English service name if available
- Price in `جنيه`

Example:

```tsx
<div className="flex items-center justify-between gap-4 border-b border-white/8 py-4 last:border-0">
  <div>
    <p className="font-bold text-white">قص شعر</p>
    <p className="text-sm text-zinc-500">Haircut</p>
  </div>
  <p className="font-black text-[#D4AF37]">150 جنيه</p>
</div>
```

### Mobile UX

Do not show too much content at once.

Good options:

- Category tabs
- Accordion cards
- Horizontal category panels
- Compact list design

### Important

Do not invent prices unless the user explicitly provides them.
Use existing data source if available.

---

## 7. Main Booking CTA

After prices, add a strong CTA block.

Content:

- Headline: `جاهز لتجربة Cut Salon؟`
- Text: `احجز موعدك الآن في أقل من دقيقة.`
- Button: `احجز موعدك الآن`

Style:

- Dark premium block
- Gold gradient edge
- Subtle glow
- Centered and visually strong

---

## 8. Why Choose Cut Salon

Section title:

- Eyebrow: `لماذا Cut Salon؟`
- Headline: `ليه تختار Cut Salon؟`

Feature cards:

1. `حجز سريع` — `احجز موعدك خلال ثواني.`
2. `اختيار الحلاق` — `اختار الحلاق اللي تفضله بسهولة.`
3. `تنظيم المواعيد` — `نظام حجز يساعد على تقليل الزحام داخل الصالون.`
4. `تجربة احترافية` — `خدمة مميزة وجودة عالية في كل زيارة.`

### Style

- Icon circle
- Gold icon
- Dark card
- Clear Arabic title
- Muted description
- Equal heights on desktop

---

## 9. How Booking Works

Section title:

- Eyebrow: `خطوات الحجز`
- Headline: `كيف تحجز؟`

Steps:

1. `اختر الحلاق`
   - `تصفح فريقنا واختر الحلاق المناسب لك.`
2. `اختر الميعاد`
   - `اختر اليوم والوقت المناسب.`
3. `أكد الحجز`
   - `استلم تأكيد حجزك فورًا.`

Add note:

`عند حضورك في الموعد، قد يكون هناك انتظار بسيط من 1 إلى 10 دقائق كحد أقصى حسب دورك.`

### Visual direction

- Desktop: horizontal RTL timeline
- Mobile: stacked vertical timeline
- Large numbered icons
- Gold connecting line if appropriate

---

## 10. Branches and Contact

Include:

- Phone / WhatsApp if available
- Branch 1: `فرع جليم - سابا باشا`
- Branch 2: `فرع سيدي جابر - مساكن الضباط`
- Location links if already available

### Style

- Split layout on desktop
- Compact cards on mobile
- Map/location icons
- Gold link text

---

## 11. Footer

Footer should feel premium and balanced.

Include:

- CUT logo
- Short description:
  `صالون رجالي متخصص في قصات الشعر الحديثة والعناية باللحية، مع نظام حجز مسبق لتنظيم المواعيد وتقديم تجربة أفضل للعملاء.`
- Contact info
- Branches
- Copyright:
  `© 2026 Cut Salon. جميع الحقوق محفوظة.`

---

# Booking Flow Guidelines

When creating booking UI:

## Booking modes

Support both concepts if available:

- Choose a specific barber
- Choose nearest available barber

## Booking settings

Respect existing backend/settings when available:

- `allowSpecificBarber`
- `allowNearestBarber`
- `defaultMode`
- `slotIntervalMinutes`
- `maxBookingDaysAhead`
- `minNoticeMinutes`
- `timezone: Africa/Cairo`
- `currency: EGP`

## Availability logic

Do not fake availability in the frontend if backend data exists.
Do not show off-duty barbers as available.
Respect schedules, including overnight shifts such as `15:00–02:00`.

## Booking copy

Use friendly Egyptian Arabic:

- `احجز الآن`
- `اختار الحلاق`
- `أقرب ميعاد`
- `اختار الميعاد المناسب`
- `أكد الحجز`
- `تم تأكيد الحجز`

---

# Queue / Operations UI Guidelines

Use this skill for operations and queue pages too.

## Tone

Operations pages should feel:

- Fast
- Clear
- Control-room style
- Premium but practical
- Arabic-first

## Queue ticket language

When announcing a customer:

`عميلنا [الاسم]، يتفضل يتوجه إلى الأستاذ [اسم الحلاق]`

## Queue ticket cards

Show:

- Ticket code: `A0`, `A1`, `A2`
- Customer name
- Barber name
- Status
- Estimated wait/start time
- Services if available
- Actions: call, start, complete, cancel

## ETA logic display

Avoid showing misleading “available now” if there are waiting tickets.
Frontend should trust the shared backend estimator when available.

---

# POS UI Guidelines

Cut Salon POS screens should prioritize speed and accuracy.

## Design direction

- Functional luxury
- Dense but readable
- Clear payment state
- Strong action buttons
- No accidental double-submit

## Important POS safeguards

- Disable save/plus button while invoice is saving.
- Prevent duplicate invoice insertion.
- Show selected payment method clearly.
- Auto-select cash/default payment method when payment methods load if nothing is selected.
- When print service is available, do not open Chrome print dialog.
- If print service is not available, fallback to browser print.

## Receipt preview

Receipt/thermal print should match the POS invoice design as closely as possible, not a generic plain receipt.

---

# Payroll / Treasury UI Guidelines

For admin/finance pages:

## Key principles

- Clear filters
- Date range defaults
- Payment method clarity
- No null payment labels
- Professional Arabic financial labels

## Payroll pages

Show:

- Employee name
- Work date
- Check-in / check-out
- Hours worked
- Hourly rate snapshot
- Earned wage
- Status: Generated / Earned / PostedToCashMove / PendingCheckout
- Warnings for missing attendance

## Treasury pages

Show:

- Incoming / outgoing
- Payment method
- Category
- Reference
- Date and time
- Filter by payment method
- Today default range where appropriate

---

# Loyalty System UI Direction

Cut Salon has a loyalty concept:

- Customers with 10+ haircuts can receive a Golden Loyal Card.
- Rewards can appear across visits:
  - 3rd haircut: 20% off
  - 5th haircut: free skin cleaning
  - 8th haircut: 50% off
  - 10th haircut: free haircut + cleaning
- Loyal customer can receive referral/gift cards.

## Design direction

- Premium black/gold card
- Card-like UI
- Progress steps
- Reward milestones
- Elegant but simple explanation

Avoid making it look childish or like a cheap points app.

---

# Component Patterns

Create reusable components when helpful:

- `SectionHeader`
- `PremiumCard`
- `GoldButton`
- `BarberCard`
- `ServiceCategoryCard`
- `FeatureCard`
- `StepCard`
- `BranchCard`
- `BookingNotice`
- `LuxuryPlaceholderImage`

## SectionHeader pattern

```tsx
type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center" dir="rtl">
      {eyebrow && (
        <p className="mb-3 text-sm font-bold text-[#D4AF37]">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-black text-white md:text-5xl">{title}</h2>
      {description && (
        <p className="mt-4 text-base leading-8 text-zinc-400">{description}</p>
      )}
    </div>
  );
}
```

## Gold button pattern

```tsx
<button className="rounded-2xl bg-gradient-to-b from-[#E7C766] to-[#B88916] px-6 py-3 font-black text-black shadow-[0_18px_50px_rgba(212,175,55,0.22)] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]">
  احجز الآن
</button>
```

## Premium card pattern

```tsx
<div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur transition hover:border-[#D4AF37]/40 hover:bg-white/[0.055]">
  ...
</div>
```

## Luxury placeholder image pattern

```tsx
<div className="flex aspect-[4/5] items-center justify-center rounded-t-3xl bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.16),rgba(255,255,255,0.03)_45%,rgba(0,0,0,0.8))]">
  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-black/40 text-2xl font-black text-[#D4AF37]">
    CUT
  </div>
</div>
```

---

# Animation Guidelines

Use animation carefully.

Good:

- Subtle card hover
- Button press state
- Soft reveal on scroll
- Small glow transitions
- Smooth scroll to booking/team/services

Avoid:

- Excessive bouncing
- Too many animated elements
- Heavy animation on mobile
- Anything that slows down booking

If using Framer Motion, keep it minimal and production-safe.

---

# Accessibility and Performance

Always:

- Use semantic HTML.
- Use readable contrast.
- Add alt text for images.
- Keep buttons keyboard accessible.
- Avoid layout shift.
- Use optimized images.
- Use `priority` only for hero-critical images.
- Avoid importing heavy libraries unnecessarily.
- Do not break SSR/hydration.

---

# Technical Rules

## Stack assumptions

The project commonly uses:

- Next.js
- React
- Tailwind CSS
- TypeScript
- SQL-backed API routes
- Vercel deployment

## Before editing

Always inspect:

- Current route/page file
- Existing components
- Existing data/API calls
- Current booking logic
- Current CSS/theme setup
- Existing image paths

## Do not break

- Booking routes
- API endpoints
- Barber selection behavior
- Service loading behavior
- Existing environment variables
- Existing POS/print-service integration
- Existing queue estimator logic

## Build quality

After implementation:

- Run TypeScript/build/lint if available.
- Fix import errors.
- Fix hydration issues.
- Remove unused imports.
- Check mobile layout.
- Check missing image handling.

---

# Copywriting Style

Use simple premium Egyptian Arabic.

## Good examples

- `احجز ستايلك بسهولة`
- `اختار الحلاق المناسب لك واحجز في ثواني.`
- `تجربة منظمة وراقية من أول الحجز لحد خروجك من الصالون.`
- `علشان نحافظ على جودة الخدمة، الحجز يكون قبلها بـ 4 ساعات.`
- `ولو جاي دلوقتي فورًا، بتاخد دور وبتدخل في دورك على طول.`

## Avoid

- Overly formal Arabic
- Long paragraphs
- Sales copy that feels fake
- English-heavy labels unless needed for service names
- Unclear technical terms for customers

---

# Final Delivery Checklist

Before finishing any Cut Salon UI task, verify:

- The page looks premium and distinctive.
- The black/gold identity is consistent.
- RTL is correct.
- Mobile layout is compact and polished.
- CTAs are clear and visible.
- Missing barber images do not look broken.
- Services/prices are readable.
- Booking logic still works.
- No random colors or generic template feel.
- No TypeScript/build errors.
- Changed files are summarized clearly.

---

# Default Windsurf Prompt Template

Use this template when asking Windsurf to build or redesign a Cut Salon page:

```text
Use the cut-salon-frontend-design skill.

I want you to design and implement [page/component name] for Cut Salon.

Context:
Cut Salon is a premium men’s salon in Alexandria with a dark luxury black/gold identity. The page should help customers trust the brand, choose a barber/service, and book quickly.

Aesthetic direction:
Luxury barber / cinematic / masculine / premium minimal. Use near-black backgrounds, warm gold accents, refined typography, subtle glow, and polished responsive layouts. Avoid generic AI design.

Technical stack:
Next.js + React + TypeScript + Tailwind CSS. Arabic RTL. Preserve existing data/API/booking logic.

Requirements:
[Add the exact page sections/features here]

Important:
Do not break existing routes, API calls, booking handlers, or data loading. Do not show broken white image placeholders. Make it production-ready, responsive, fast, and visually distinctive.

After implementation:
Run build/lint if available and summarize changed files.
```

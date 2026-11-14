# CUT Salon Website & CUT CLUB — Project Contract

> Contract ID: CUT-WEB-001 | Version: 1.1 candidate | Recorded: 2026-11-13; responsive/security additions 2026-11-14
> Status: **Working direction agreed in project discussion; implementation gates are binding until explicitly revised.**
> This is a living product/engineering agreement, not a legal contract. Changes require a recorded decision and linked Issue/PR.

## 1) الهدف

بناء تجربة رقمية واحدة لـ CUT Salon:
- **Public Website**: جذب عميل جديد؛ البراند، الخدمات، الأسعار، الحلاقون، الفروع، المحتوى، والحجز.
- **CUT CLUB**: زيادة العودة والارتباط؛ CUT ID، Coins، العضويات، Wallet، Rewards، Challenges، Referrals وتجارب مخصصة.
- **Casher/Booking**: مصدر الحقيقة للفواتير والخدمات والحجوزات والعمليات؛ لا ننشئ أرقامًا متناقضة بين الواجهات.
- **SEO / Local SEO / GEO**: محتوى عام دقيق وفريد وسهل الوصول لمحركات البحث ومحركات الإجابات؛ بدون وعود ترتيب.

## 2) قرارات بنية الموقع (Stable Contracts)

1. **دومين واحد للعميل**: cutsaloon.com. لا نبدأ موقعًا منفصلًا للـ CLUB.
2. **/** تبقى Landing عامة سواء العميل سجل دخول أو لا. ممكن تخصيص Navigation/CTA للعضو؛ لا نستبدل محتوى الصفحة كله بشكل شخصي.
3. **/cut-club**: صفحة عامة قابلة للفهرسة للتعريف بالنادي والمميزات المتاحة فعلًا (Proposed; not in main yet).
4. **/club**: Dashboard خاص للعميل؛ وجميع المسارات الخاصة تحته noindex + authorization + no-store (Proposed).
5. **/book**: بداية حجز عامة. لا نفرض عضوية للوصول للأسعار أو إجراء حجز.
6. **/prices**: صفحة أسعار عامة ومستقلة ومفهرسة، من بيانات Casher الصحيحة، مع إمكانية عرض سعر فرع محدد بوضوح.
7. **/services** وصفحات خدمات أساسية قابلة للفهرسة، محتوى فعلي لا صفحات مكررة (Proposed).
8. **/branches/gleem** و **/branches/camp-caesar** للبحث المحلي، مع معلومات فرع موثقة (في PR #32 غير المدموج حين التوثيق).
9. **/client** و **/client/loyalty** روابط Legacy؛ لا نكسرها قبل إطلاق وصحة البديل. Migration/redirect بعد تأمين المصادقة فقط.
10. **ops.cutsaloon.com** يبقى نظام تشغيل داخلي، وليس Landing مفهرسة.

### Public vs Private Indexation

| Public indexable candidate | Private / noindex |
|---|---|
| /, /prices, /services, /services/[slug], /branches/[slug], /cut-club, /book, active campaign pages | /client, /client/loyalty, /club/**, /booking, /book inner steps, /dev/**, expired/no-value offers |

الـ Sitemap لا يدخل إلا Routes موجودة فعلًا وبمحتوى مفيد؛ لا نضيف Routes على أساس أنها مخططة فقط. الصفحات الخاصة لا تعتمد على noindex كوسيلة أمان؛ يلزم Auth.

## 3) Public UX Contract

- الهوية: نفس ألوان CUT الرسمية وخطوطها وصورها الحقيقية؛ تصميم Editorial/Premium ومناسب للعربي.
- Hero واضح + CTA حجز أساسي + CTA خدمات/أسعار ثانوي.
- Landing sections المستهدفة: Hero → Services → Branches → Barbers → CUT CLUB → Groom → Real Work/Guides → Final Booking → Footer.
- Mobile-first، RTL عربي أساسي والإنجليزية مدعومة، روابط مفهومة وCore Web Vitals.
- الصور تكون واقعية ومرخصة، وندعم lazy-loading خارج أول شاشة وتقليل JavaScript غير الضروري.
- أي قسم يمكن إخفاؤه إذا لم يوجد محتوى صحيح دون خلق SEO thin pages.

### Responsive implementation rules (PR #38 / #41; not merged yet)

- Public Desktop navigation uses the `xl` layout at **1280px and above**. Under 1280px, use the compact/mobile navigation. Keep its CSS height offsets and any campaign/hero spacing matched to the same breakpoint; avoid mixing `lg` and `xl` for opposing navs.
- A short-screen bottom-sheet menu MUST provide a bounded internal scrolling region so the final account link remains reachable, including when the page behind it is scroll-locked.
- Browser acceptance for public navigation at minimum: **360×640, 390×844, 768×1024, 1024×768, 1279×800, 1280×800, 1440×900**. At the desktop boundary, test AR/EN links for overlap with brand/logo and booking actions.
- The restricted private Club shell uses its own member layout and mobile-friendly five-item nav, but must **never** create verified identity from query `clientId`, phone lookup or editable localStorage.
- At least one real-browser CI check must verify rendered viewport layout, menu reachability and no horizontal overflow; DOM/unit assertions alone do not demonstrate responsive behavior.
- Before member data: `/club` is a feature-gated **restricted notice only**. Private response `noindex`/`no-store` must be tested over HTTP and cannot substitute for authorization.

## 4) CUT CLUB UX Contract

- Primary member navigation: **Home / Explore / Book / Wallet / Me**.
- الصفحة الرئيسية شخصية: كارت واحد + أهم إجراء + أهم تنبيه/مكافأة + أقرب تقدم + أفضل عرض ملائم.
- لا نحشر كل البرامج في Home؛ المحتوى الإضافي تحت Explore ومناطق التفاصيل.
- CUT ID واحد لكل عميل عبر الفرعين، مع منع دمج الأشخاص لمجرد تشابه الاسم/الموبايل دون تحقق.
- الفرق الواضح: **Tier** (مستوى ولاء) / **Affiliation** (جهة) / **Membership/Pass** (برنامج) / **Balance & Entitlements** (الرصيد والحقوق).
- Member benefits: Campus, MED, Corporate, Family, Ambassadors وغيرها كبرامج قابلة للتوسعة.
- يتم إصدار المكافآت وفق Rules منضبطة بالميزانية والتاريخ والأهلية والفروع، وليس بكود خاص لكل حملة.
- لا نقدم رصيد Coins وكأنه نقد؛ Promo Credit ≠ Paid Balance ≠ CUT Coins ≠ Voucher.

## 5) Data, Auth & Integration Contract

- Repository الموقع: **tarek-saad-dev/cut-salon-rtl-booking**، Repository السيستم: **tarek-saad-dev/casher**.
- Casher هو مرجع الخدمة والسعر والفاتورة والتسويات والـ booking facts. CUT CLUB Economy تظل بمالك واحد للـ Ledger.
- Cross-system actions through documented APIs/events; no direct unauthorized DB writes from public frontend.
- لا نعتبر phone lookup / localStorage / query clientId جلسة موثقة.
- لا صرف Wallet، طلب بيانات شخصية، شراء Coins/Rewards أو Profile update قبل Auth موثق (مثل OTP) وServer-side authorization.
- Events/transactions idempotent، Referrals لها Fraud Controls، الفاتورة المستردة تعكس المكافآت بشكل قابل للتدقيق.
- Configurable feature flags لكل طرح، وتقييم مخاطر الإنتاج قبل التفعيل.
- لا نجمع بيانات حساسة لمجرد التخصيص؛ موافقات تسويقية منفصلة حسب القناة.

## 6) SEO + GEO Contract

- كل صفحة عامة لها هدف واضح ومحتوى أساسي قابل للقراءة في Server HTML قدر الإمكان، Metadata وCanonical صحيحان.
- الأسعار والخدمات تظهر بشكل صحيح من مصدر مُتحقق؛ لا تستخدم static hardcoded mock prices كأنها الإنتاج.
- Local SEO: صفحة منفصلة ومحتوى مختلف لكل فرع، بيانات Name/Address/Phone متطابقة مع الحقيقة والخرائط. **NAP conflict for Gleem** يجب حسمه، ولا نخترع عنوان كامب شيزار.
- استخدام Schema مناسب وواقعي (Organization, LocalBusiness/BarberShop, Service, BreadcrumbList, Article عند تحقق الشروط)، بلا تقييمات وهمية أو تضمين بيانات غير موجودة في الصفحة.
- محتوى CUT Guides بشواهد وخبرة الفريق، ليس mass AI pages؛ الأسئلة الشائعة تخدم القارئ قبل محرك البحث.
- تمييز Search Console وGoogle Business Profile عن إيرادات الحجوزات؛ الأرقام لا تتبدل بين المصادر.
- القياس: impressions, clicks, indexation, CWV, local actions, completed bookings & attributable margin مع إفصاح عن حدود القياس.
- GEO ليس تقنية منفصلة تضمن ذكر CUT؛ جودة SEO وإمكانية القراءة وصدق المحتوى هي الأساس.

## 7) Release, Quality & Governance Contract

- GitHub Issues للنطاق؛ PRs للتنفيذ؛ GitHub CI + independent review + موافقة صاحب المشروع للدمج.
- اتبع AGENTS.md وdocs/agent-control-plane/CONTROL-PLANE.md. لا auto-merge ولا production deploy بدون موافقة بشرية صريحة.
- لا اختبارات تغيّر حجوزات حية أو أرصدة أو معلومات عميل في Production؛ tests/mocks/read-only verification.
- لا يصبح PR مكتملًا إلا بعد: Acceptance criteria + tests + security/SEO impact + rollback path + تحديث TASK_TRACKER وWORK_LOG.
- حالات **MERGED** و **DEPLOYED** و **VERIFIED_LIVE** منفصلة، وكل واحدة تحتاج دليلها.
- أي تعديل لقواعد العقد يسجل أولًا أو مع نفس PR في DECISION_LOG ونسخة هنا، مع سبب ودليل.

## 8) Non-goals / ما لن نفعله حاليًا

- إعادة بناء الموقع من الصفر أو فصل CUT CLUB في دومين مستقل.
- تحويل / إلى Dashboard عضو.
- إطلاق Wallet معاملات حقيقية قبل المصادقة والتسوية.
- دمج PR #27 الخاص بالأداء بلا حل تعارضات الخطوط مع PR #30/#32.
- نشر صفحات فروع بعناوين غير متحقق منها، أو صفحات أسعار بنسخ ثابتة مخالفة للـ POS.
- بناء Microservices كاملة أو Mobile Native App في أول مرحلة دون عائد واضح.
- اعتبار أي Feature مقترحة أنها منفذة بمجرد وجودها في التوثيق.

## 9) Change Control

أي تغيير قرار من الأعلى:
1. افتح Issue يذكر CONTRACT CHANGE مع Before/After.
2. وثق السبب والمخاطر وبدائل القرار في DECISION_LOG.
3. اختبر تأثيره على الروابط والبيانات والحسابات والـ SEO والـ Booking.
4. حدّث العقد والـ Roadmap والـ Tracker في PR واحد أو PRs مرتبطة.
5. اعتماد صريح قبل Merge/Deploy.

Owner approval remains required even for urgent release decisions.

# CUT Salon Website Program — Source of Truth

> Version: 1.0 | Snapshot date: 2026-11-13 (Africa/Cairo)
> Scope: cutsaloon.com customer website + CUT CLUB member experience.
> Implementation: GitHub Issues/PRs. This folder is **planning and snapshot documentation**, not proof that a feature is live.

## اقرأ من هنا أولًا

| الملف | الهدف | يتحدث إمتى؟ |
|---|---|---|
| [PROJECT_CONTRACT.md](PROJECT_CONTRACT.md) | الاتفاق الثابت: الرؤية والقرارات والحدود الفنية والأمنية | عند تغيير قرار معماري أو نطاق |
| [MASTER_ROADMAP.md](MASTER_ROADMAP.md) | الخطة المتدرجة والاعتماديات ومعايير الخروج | عند تعديل خطة أو ترتيب الأولويات |
| [TASK_TRACKER.md](TASK_TRACKER.md) | موقف كل Task وIssue وPR وأين توقفنا | مع بداية/نهاية كل مهمة وتغير حالتها |
| [DECISION_LOG.md](DECISION_LOG.md) | سجل القرارات: لماذا اخترنا هذا الاتجاه؟ | كل قرار مؤثر أو إلغاء قرار |
| [WORK_LOG.md](WORK_LOG.md) | سجل تسليمات متراكم، ملاحظات الاختبار والـ handoff | عند كل Sprint أو PR أو Deployment |
| [TASK_TEMPLATE.md](TASK_TEMPLATE.md) | قالب لبدء أي مهمة جديدة بدون غموض | انسخ المحتوى عند فتح Issue جديدة |
| [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) | ترتيب PRs وخطوات التحقق والرجوع قبل وبعد أي نشر | عند تجهيز Release أو تغيير الاعتماديات |

## ترتيب مصادر الحقيقة (الأهم عند التعارض)

1. **الكود المدموج على main** يوضح المتاح في Repository، لا يثبت أنه نُشر.
2. **دليل نشر موثق وقراءات Production** يثبت ما نُشر فعليًا.
3. **GitHub Issue** مرجع نطاق المهمة ومعايير قبولها.
4. **GitHub PR + CI + Review** مرجع التنفيذ والتحقق ومخاطر الدمج.
5. **الملفات هنا** مرجع لاتفاق الخطة والقرارات ولقطة الحالة؛ ليست بديلًا عن التحقق الحي.

لو ظهر تعارض: لا نعدل الحالة بالتخمين. نرجع للمصدر الأعلى، ثم نسجل التغيير مع رابط الدليل وتاريخه.

## بروتوكول العمل المتكرر

**قبل أي Task**
- اقرأ هذا الملف + PROJECT_CONTRACT + TASK_TRACKER.
- راجع آخر حالة على GitHub فعلًا بدل الاعتماد على Snapshot قديم.
- افتح Issue محددًا (أو استخدم الموجود)، وعرّف الهدف وOut of Scope وAcceptance Criteria والاعتماديات.
- حدد أي Contract Decision هيتأثر قبل كتابة الكود.

**أثناء التنفيذ**
- استخدم مسار التطوير الموصوف في AGENTS.md و docs/agent-control-plane/CONTROL-PLANE.md.
- خصص Branch واحدًا للمهمة وPR إلى main.
- لا ندمج ولا ننشر تلقائيًا. لا نغيّر بيانات العملاء الحية أثناء التجربة.
- حدّث سجل المهمة بالمرحلة الحالية والأدلة والـ Blockers.

**عند تسليم PR**
- حدث TASK_TRACKER بحالة **PR_OPEN / IN_REVIEW**، واربط PR، واذكر الاختبارات التي شُغلت فعليًا.
- حدّث WORK_LOG بنتيجة المهمة والقرار التالي.
- إذا غيّرت Architecture أو URL أو Security Policy حدّث PROJECT_CONTRACT وDECISION_LOG وMASTER_ROADMAP في نفس التغيير أو PR توثيق مرتبط.

**بعد اعتماد الدمج**
- تحقق من CI والـ Review ومن الـ exact head.
- بعد الدمج تتغير الحالة إلى MERGED، وليس DEPLOYED.
- بعد النشر تحقق read-only من الرابط الفعلي، ثم حدّثها إلى VERIFIED_LIVE إن توفر دليل واضح.
- احتفظ بتفاصيل خط الرجوع (rollback) إن كانت ميزة حساسة.

## حالات المهام المعتمدة

PLANNED → READY → IN_PROGRESS → PR_OPEN → IN_REVIEW → READY_FOR_APPROVAL → MERGED → DEPLOYED → VERIFIED_LIVE

حالات إضافية: BLOCKED / ON_HOLD / CANCELLED. لا تُستخدم DONE بدون توضيح هل المقصود merge أم verification في Production.

## الخدمات والمستودعات

- Customer website: https://cutsaloon.com — repository: https://github.com/tarek-saad-dev/cut-salon-rtl-booking
- POS/ERP: https://ops.cutsaloon.com — repository: https://github.com/tarek-saad-dev/casher
- أي تغيير في الـ POS أو اقتصادات CUT CLUB يحتاج Issue/PR مستقلًا في مستودع casher، واختبارات تكامل وتوثيق للـ API.

## قواعد السلامة

- لا كلمات سر، Tokens أو بيانات عملاء حقيقية في التوثيق.
- لا أسعار أو تقييمات أو عناوين غير متحقق منها.
- لا تزوير لحالات PR أو CI أو Production.
- لا تغيير لـ slash routes القديمة دون خطة Redirect والتحقق من Search Console والروابط السابقة.
- لا ادعاء بأن Structured Data أو GEO يضمن ترتيبًا أو ظهورًا معينًا في محركات البحث.

## Update Checklist سريع

- [ ] آخر حالة GitHub تم التحقق منها الآن
- [ ] الحالة والأدلة في TASK_TRACKER محدثة
- [ ] آخر خطوة والـ Blocker في WORK_LOG
- [ ] اعتماديات MASTER_ROADMAP ما زالت صحيحة
- [ ] أي تغيير قرار سُجل في DECISION_LOG
- [ ] لا دمج/نشر قبل موافقة بشرية واضحة

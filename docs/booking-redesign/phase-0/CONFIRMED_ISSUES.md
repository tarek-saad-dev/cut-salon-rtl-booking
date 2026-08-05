# Confirmed Issues Register

Classification key: Category · Priority · Confidence

---

### ISSUE-001 — English site opens Arabic RTL booking modal
- **Category:** Localization  
- **Priority:** P0  
- **Affected flow:** All EN booking entry modes  
- **Repro:** Switch to EN → View Times / Find nearest  
- **Expected:** EN LTR modal  
- **Actual:** Arabic copy + `dir="rtl"`  
- **Evidence:** `screenshots/en-home-opens-arabic-modal-ziad.png`  
- **Files:** `BookingModal.tsx` ~1381, steps ~116–124; `EnglishHome.tsx` ~105  
- **Endpoints:** n/a  
- **Suspected → Confirmed root cause:** Modal ignores `LanguageContext`; hardcoded RTL/Arabic  
- **Phase:** 1  

---

### ISSUE-002 — Ahmed barber-first: no public branches; sidebar shows GLEEM
- **Category:** Frontend logic + Data/configuration  
- **Priority:** P0  
- **Affected flow:** Barber-first (Ahmed; any Camp-only barber)  
- **Repro:** AR home → احجز مع احمد  
- **Expected:** Bookable branch path or hide barber  
- **Actual:** Error `لا توجد فروع عامة متاحة لهذا الحلاق`; sidebar جليم  
- **Evidence:** screenshot + `evidence/api-barber-profile-18.json`  
- **Files:** `BookingModal.tsx` ~235–241, ~365–366, ~552–553; `BranchContext.tsx` ~47–50; `barbers.ts` ~60–61  
- **Endpoints:** `GET /api/public/booking/barbers/18` (succeeds); branches list  
- **Confirmed root cause:** Profile Camp-only ∩ public list without Camp = ∅; sidebar reads selectedBranch  
- **Phase:** 1 (product policy) + data if assigning GLEEM  

---

### ISSUE-003 — Duplicate close buttons
- **Category:** UI / Accessibility  
- **Priority:** P1  
- **Affected flow:** All modal opens  
- **Repro:** Open any booking modal  
- **Expected:** Single close control  
- **Actual:** StepHeader X + Dialog default X (`إغلاق` + `Close`)  
- **Evidence:** screenshots; a11y dual buttons  
- **Files:** `BookingStepHeader.tsx` ~41–47; `ui/dialog.tsx` ~45–48  
- **Confirmed root cause:** DialogContent always renders default Close  
- **Phase:** 1  

---

### ISSUE-004 — Mode step missing Back
- **Category:** UX  
- **Priority:** P1  
- **Affected flow:** branch_first without initialMode  
- **Repro:** Reach mode step  
- **Expected:** Back to branch  
- **Actual:** No Back control (handleBack supports mode→branch but UI omits button)  
- **Files:** `BookingModal.tsx` mode case ~618–688 vs handleBack ~350  
- **Phase:** 1  

---

### ISSUE-005 — Overnight UI exposes dayOffset / operational jargon
- **Category:** Localization / UX  
- **Priority:** P1  
- **Affected flow:** Time step overnight section  
- **Evidence:** `BookingTimeSlots.tsx` ~328–346  
- **Live overnight slots:** Needs reproduction (none in sample window)  
- **Phase:** 1 copy; 1/2 E2E overnight  

---

### ISSUE-006 — AR/EN are different products visually
- **Category:** UI  
- **Priority:** P1  
- **Evidence:** `HomePageClient` split; `AR_EN_VISUAL_COMPARISON.md`  
- **Phase:** 2 redesign (after Phase 1 technical fixes)  

---

### ISSUE-007 — Dual API clients
- **Category:** Frontend logic / Performance  
- **Priority:** P2  
- **Files:** `booking-api/*` vs `publicBookingApi.ts`  
- **Phase:** 1 cleanup  

---

### ISSUE-008 — Pure state.ts unused by UI
- **Category:** State management  
- **Priority:** P2  
- **Files:** `lib/booking-api/state.ts` vs `useBookingFlow.ts`  
- **Phase:** 1 state consolidation  

---

### ISSUE-009 — Gold / muted text contrast on cream & black
- **Category:** Accessibility  
- **Priority:** P1  
- **Evidence:** visual inspection; estimate <4.5:1 for gold-on-cream & white/40  
- **Phase:** 1 tokens  

---

### ISSUE-010 — Customer lookup failures appear as “new customer”
- **Category:** UX / Frontend logic  
- **Priority:** P2  
- **Files:** `BookingModal.tsx` lookup catch → `new`  
- **Phase:** 1  

---

### ISSUE-011 — Lookup by phone digits only (no verification)
- **Category:** Backend/API / Privacy  
- **Priority:** P2 (product/security policy)  
- **Endpoints:** `/api/client/lookup`  
- **Confidence:** Confirmed behavior; risk acceptance needs product  
- **Phase:** later / security review  

---

### ISSUE-012 — Dialog onOpenChange ignores open boolean
- **Category:** Frontend logic  
- **Priority:** P2  
- **Files:** `BookingModal.tsx` ~1378 `onOpenChange={handleClose}`  
- **Phase:** 1  

---

### ISSUE-013 — EN branch rail hides Camp-only barbers while AR global shows them
- **Category:** UX / Data  
- **Priority:** P2  
- **Evidence:** EN GLEEM rail without Ahmed; AR global includes Ahmed  
- **Phase:** 1 policy aligned with ISSUE-002  

---

## Counts

| Priority | Confirmed |
|----------|-----------|
| P0 | 2 (001, 002) |
| P1 | 5 (003–006, 009) |
| P2 | 6 (007–008, 010–013) |

Needs backend/data verification: overnight live inventory; DB time storage; full phone format matrix; contrast lab measurements.

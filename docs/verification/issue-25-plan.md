# Issue 25 implementation plan

Scope: preserve photography, crops, typography, SEO routes and booking semantics.

1. Measure source image sizes; use static WebP variants and one responsive picture (PNG fallback). Runtime optimization cannot establish Nginx compatibility here. The finalizer uses git diff/apply --binary and includes new files.
2. Preserve all four font families through next/font; remove duplicate external CSS and legacy LAXR delivery.
3. Split optional upcoming-booking dialog code; retain SSR for indexable sections. Reserve async hero strip height and honor reduced motion.
4. Test resource selection and layout contracts; run install, tests, typecheck, build and safe local smoke. Record limitations and reproducible measurement instructions.

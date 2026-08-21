"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Plus, ShoppingBag, X } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServicePresentation } from "@/lib/booking/service-presentation";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingServiceImage from "./BookingServiceImage";
import BookingPromoPrice from "@/components/booking/BookingPromoPrice";

interface BookingServiceCartProps {
  selectedServices: BookingService[];
  totalPrice: number;
  totalDuration: number;
  onRemove: (id: number) => void;
  /** Opens the services list so the guest can pick another service (not quick-price chips). */
  onBrowseServices?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  onBack?: () => void;
  backLabel?: string;
  /**
   * Bumps whenever a service is newly added (parent-driven).
   * Prefer this over counting so the first add (cart mount) still toasts.
   */
  addedSignal?: { serviceId: number; nonce: number } | null;
}

const TOAST_MS = 1650;

export default function BookingServiceCart({
  selectedServices,
  totalPrice,
  totalDuration,
  onRemove,
  onBrowseServices,
  onContinue,
  continueDisabled = false,
  onBack,
  backLabel,
  addedSignal = null,
}: BookingServiceCartProps) {
  const { t, format, lang, dir } = useBookingTranslations();
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const lastNonceRef = useRef<number | null>(null);

  const count = selectedServices.length;

  useEffect(() => {
    if (count === 0) {
      setExpanded(false);
      setAddedToast(null);
      setPulse(false);
    }
  }, [count]);

  useEffect(() => {
    if (!addedSignal) return;
    if (lastNonceRef.current === addedSignal.nonce) return;
    lastNonceRef.current = addedSignal.nonce;

    const added =
      selectedServices.find((s) => s.id === addedSignal.serviceId) ?? null;
    const name = added
      ? getServicePresentation(added, lang).name || added.name || ""
      : "";
    setAddedToast(name.trim() || null);
    setPulse(true);
    const timer = window.setTimeout(() => {
      setPulse(false);
      setAddedToast(null);
    }, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [addedSignal, selectedServices, lang]);

  const countLabel = useMemo(() => {
    if (count === 1) return `1 ${t("service.countOne")}`;
    if (count === 2 && dir === "rtl") return t("service.countTwo");
    return `${format.number(count)} ${t("service.countMany")}`;
  }, [count, dir, format, t]);

  const toastLabel = useMemo(() => {
    if (!addedToast) return t("service.cartAddedToastShort");
    return t("service.cartAddedToast", { name: addedToast });
  }, [addedToast, t]);

  if (count <= 0) return null;

  const preview = selectedServices.slice(0, 3);
  const overflow = count - preview.length;
  const showToast = pulse;

  const handleBrowseServices = () => {
    setExpanded(false);
    onBrowseServices?.();
  };

  return (
    <div
      className={`
        relative flex-shrink-0 sticky bottom-0 z-20 border-t border-[var(--booking-border)]
        bg-[var(--booking-bg)] shadow-[0_-8px_28px_rgba(15,23,42,0.08)]
        transition-[box-shadow] duration-300
        ${pulse ? "booking-cart-success-flash" : ""}
      `}
      data-service-cart
      data-service-summary
      data-cart-expanded={expanded ? "true" : "false"}
      data-cart-pulse={pulse ? "true" : "false"}
      dir={dir}
    >
      {showToast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-3 bottom-full z-30 mb-2 flex justify-center sm:inset-x-4"
          data-cart-added-toast
        >
          <div
            className="
              booking-cart-added-toast inline-flex max-w-full items-center gap-2 rounded-full
              border border-[color-mix(in_srgb,var(--booking-success)_28%,transparent)]
              bg-[var(--booking-success-soft)] px-3.5 py-2
              text-[13px] font-bold text-[var(--booking-success)]
              shadow-[0_10px_28px_rgba(21,115,71,0.18)]
            "
          >
            <span
              className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--booking-success)] text-white"
              aria-hidden
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="min-w-0 truncate">{toastLabel}</span>
          </div>
        </div>
      ) : null}

      <div
        id={panelId}
        role="region"
        aria-label={t("service.cartItemsAria")}
        aria-hidden={!expanded}
        className={`
          overflow-hidden transition-[max-height,opacity] duration-300 ease-out
          ${expanded ? "max-h-[min(52vh,420px)] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        `}
      >
        <div className="px-4 md:px-5 pt-3 pb-2 border-b border-[var(--booking-border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag
              className={`w-4 h-4 flex-shrink-0 ${pulse ? "text-[var(--booking-success)] booking-cart-bag-pop" : "text-[var(--booking-accent)]"}`}
              aria-hidden
            />
            <h4 className="font-heading font-bold text-[var(--booking-text)] text-sm truncate">
              {t("service.cartTitle")}
            </h4>
            <span className="text-xs font-bold text-[var(--booking-text-muted)] tabular-nums">
              ({countLabel})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="min-h-9 px-2.5 rounded-lg text-xs font-bold text-[var(--booking-text-secondary)] hover:bg-[var(--booking-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            {t("service.cartHide")}
          </button>
        </div>

        <ul className="max-h-[28vh] overflow-y-auto px-3 md:px-4 py-2 space-y-1.5" role="list">
          {selectedServices.map((service) => {
            const presentation = getServicePresentation(service, lang);
            const visual = getServiceVisual({ service });
            return (
              <li
                key={service.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--booking-border-subtle)] bg-[var(--booking-surface)] px-2.5 py-2 booking-cart-item-in"
                data-cart-item={service.id}
              >
                <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-lg [&_.w-8]:!w-5 [&_.w-8]:!h-5">
                  <BookingServiceImage
                    visual={visual}
                    alt={presentation.name || service.name || "Service"}
                    aspectClassName="aspect-square"
                    className="rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-[var(--booking-text)] truncate">
                    {presentation.name}
                  </p>
                  <p className="text-[12px] text-[var(--booking-text-secondary)]">
                    {format.duration(service.durationMinutes)}
                    <span className="text-[var(--booking-text-muted)]"> · </span>
                    <span className="font-semibold text-[var(--booking-text)] tabular-nums">
                      <BookingPromoPrice amount={service.price} formatPrice={format.price} />
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(service.id)}
                  aria-label={`${t("service.cartRemoveAria")}: ${presentation.name || service.name}`}
                  className="flex-shrink-0 min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-[var(--booking-text-muted)] hover:text-[var(--booking-text)] hover:bg-[var(--booking-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
                >
                  <X className="w-4 h-4" aria-hidden />
                  <span className="sr-only">{t("service.cartRemove")}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {onBrowseServices ? (
          <div
            className="px-4 md:px-5 py-3 border-t border-[var(--booking-border-subtle)] bg-[var(--booking-surface)]"
            data-cart-upsell
            data-cart-browse-services
          >
            <p className="text-[13px] font-bold text-[var(--booking-text)] mb-0.5">
              {t("service.cartUpsellTitle")}
            </p>
            <p className="text-[12px] text-[var(--booking-text-secondary)] mb-2.5">
              {t("service.cartUpsellHint")}
            </p>
            <button
              type="button"
              onClick={handleBrowseServices}
              className="
                w-full min-h-11 inline-flex items-center justify-center gap-2 px-3 rounded-xl
                border border-dashed border-[var(--booking-border)] bg-[var(--booking-bg)]
                text-sm font-bold text-[var(--booking-text)]
                hover:border-[var(--booking-accent)] hover:bg-[var(--booking-accent-soft)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
              "
              data-cart-add-service
            >
              <Plus className="w-4 h-4 text-[var(--booking-accent)]" aria-hidden />
              {t("service.cartAddAnother")}
            </button>
          </div>
        ) : null}
      </div>

      <div className="px-4 md:px-5 py-3 space-y-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="
            w-full min-h-11 flex items-center gap-3 rounded-xl
            px-1 text-start
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
          "
          data-cart-toggle
        >
          <div
            className={`
              relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full
              ${pulse
                ? "bg-[var(--booking-success-soft)] text-[var(--booking-success)] booking-cart-bag-pop"
                : "bg-[var(--booking-accent-soft)] text-[var(--booking-accent)]"}
            `}
            aria-hidden
          >
            {pulse ? (
              <Check className="h-4 w-4" strokeWidth={2.75} />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
          </div>
          <div className="flex -space-x-2 rtl:space-x-reverse flex-shrink-0" aria-hidden>
            {preview.map((service, i) => {
              const visual = getServiceVisual({ service });
              const presentation = getServicePresentation(service, lang);
              return (
                <div
                  key={service.id}
                  className="w-9 h-9 rounded-full border-2 border-[var(--booking-bg)] overflow-hidden bg-[var(--booking-surface)] [&_.w-8]:!w-4 [&_.w-8]:!h-4"
                  style={{ zIndex: preview.length - i }}
                >
                  <BookingServiceImage
                    visual={visual}
                    alt={presentation.name || service.name || "Service"}
                    aspectClassName="aspect-square"
                  />
                </div>
              );
            })}
            {overflow > 0 ? (
              <div className="w-9 h-9 rounded-full border-2 border-[var(--booking-bg)] bg-[var(--booking-accent-soft)] text-[11px] font-bold text-[var(--booking-text)] flex items-center justify-center">
                +{overflow}
              </div>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-bold truncate ${pulse ? "text-[var(--booking-success)]" : "text-[var(--booking-text)]"}`}
            >
              {pulse ? toastLabel : countLabel}
              {!pulse ? (
                <>
                  <span className="text-[var(--booking-text-muted)] font-medium"> · </span>
                  <span className="text-[var(--booking-text-secondary)] font-medium">
                    {format.duration(totalDuration)}
                  </span>
                </>
              ) : null}
            </p>
            <p className="text-[12px] text-[var(--booking-text-secondary)] flex items-center gap-1">
              {expanded ? t("service.cartHide") : t("service.cartView")}
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden />
              )}
            </p>
          </div>
          <div className="text-end flex-shrink-0">
            <p className="text-[11px] text-[var(--booking-text-muted)] font-medium">
              {t("service.cartSubtotal")}
            </p>
            <p className="font-bold text-[var(--booking-text)] tabular-nums text-sm">
              <BookingPromoPrice amount={totalPrice} formatPrice={format.price} />
            </p>
          </div>
        </button>

        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled}
            className="w-full min-h-11 py-3 rounded-xl bg-[var(--booking-accent)] text-white font-bold text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            data-cart-continue
          >
            {t("service.cartContinue")}
          </button>
        ) : null}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-11 py-2.5 rounded-xl border border-[var(--booking-border)] text-[var(--booking-text-secondary)] font-medium text-sm inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            data-cart-back
          >
            {dir === "rtl" ? (
              <ArrowRight className="w-4 h-4" aria-hidden />
            ) : (
              <ArrowLeft className="w-4 h-4" aria-hidden />
            )}
            {backLabel ?? t("actions.back")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { Plus, ShoppingBag, X } from "lucide-react";
import type { BookingService } from "@/lib/booking-api";
import { getServicePresentation } from "@/lib/booking/service-presentation";
import { getServiceVisual } from "@/lib/booking/service-visuals";
import { useBookingTranslations } from "@/hooks/useBookingTranslations";
import BookingServiceImage from "./BookingServiceImage";
import BookingPromoPrice from "@/components/booking/BookingPromoPrice";

interface BookingServiceCartSheetProps {
  open: boolean;
  onClose: () => void;
  selectedServices: BookingService[];
  totalPrice: number;
  totalDuration: number;
  onRemove: (id: number) => void;
  onBrowseServices?: () => void;
}

export default function BookingServiceCartSheet({
  open,
  onClose,
  selectedServices,
  totalPrice,
  totalDuration,
  onRemove,
  onBrowseServices,
}: BookingServiceCartSheetProps) {
  const { t, format, lang, dir } = useBookingTranslations();
  const count = selectedServices.length;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open && count === 0) onClose();
  }, [open, count, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const countLabel =
    count === 1
      ? `1 ${t("service.countOne")}`
      : count === 2 && dir === "rtl"
        ? t("service.countTwo")
        : `${format.number(count)} ${t("service.countMany")}`;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" dir={dir} data-cart-mobile-modal>
      <button
        type="button"
        aria-label={t("actions.close")}
        className="absolute inset-0 bg-cut-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        data-cart-modal-overlay
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("service.cartItemsAria")}
        className="
          absolute inset-x-0 bottom-0 flex max-h-[min(82vh,640px)] flex-col
          rounded-t-[1.35rem] border-t border-[var(--booking-border)]
          bg-[var(--booking-bg)] shadow-[0_-16px_48px_rgba(15,23,42,0.18)]
          pb-[max(0.75rem,env(safe-area-inset-bottom))]
        "
        data-cart-modal-panel
      >
        <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-[var(--booking-border)]" />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[var(--booking-border-subtle)] px-4 pb-3 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <ShoppingBag className="h-4 w-4 shrink-0 text-[var(--booking-accent)]" aria-hidden />
            <h4 className="truncate font-heading text-sm font-bold text-[var(--booking-text)]">
              {t("service.cartTitle")}
            </h4>
            <span className="text-xs font-bold text-[var(--booking-text-muted)] tabular-nums">
              ({countLabel})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[var(--booking-text-muted)] hover:bg-[var(--booking-surface)] hover:text-[var(--booking-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            data-cart-modal-close
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t("actions.close")}</span>
          </button>
        </div>

        <ul
          className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3"
          role="list"
          data-cart-modal-items
        >
          {selectedServices.map((service) => {
            const presentation = getServicePresentation(service, lang);
            const visual = getServiceVisual({ service });
            return (
              <li
                key={service.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--booking-border-subtle)] bg-[var(--booking-surface)] px-2.5 py-2"
                data-cart-item={service.id}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg [&_.w-8]:!w-5 [&_.w-8]:!h-5">
                  <BookingServiceImage
                    visual={visual}
                    alt={presentation.displayName || service.name || "Service"}
                    aspectClassName="aspect-square"
                    className="rounded-lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--booking-text)]">
                    {presentation.displayName}
                  </p>
                  <p className="text-[12px] text-[var(--booking-text-secondary)]">
                    {format.duration(service.durationMinutes)}
                    <span className="text-[var(--booking-text-muted)]"> · </span>
                    <span className="font-semibold tabular-nums text-[var(--booking-text)]">
                      <BookingPromoPrice amount={service.price} formatPrice={format.price} />
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(service.id)}
                  aria-label={`${t("service.cartRemoveAria")}: ${presentation.displayName || service.name}`}
                  className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg text-[var(--booking-text-muted)] hover:bg-[var(--booking-bg)] hover:text-[var(--booking-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{t("service.cartRemove")}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-[var(--booking-border-subtle)] px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-[var(--booking-text-muted)]">
                {t("service.cartSubtotal")}
              </p>
              <p className="text-[12px] text-[var(--booking-text-secondary)]">
                {format.duration(totalDuration)}
              </p>
            </div>
            <p className="text-base font-bold tabular-nums text-[var(--booking-text)]">
              <BookingPromoPrice amount={totalPrice} formatPrice={format.price} />
            </p>
          </div>

          {onBrowseServices ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBrowseServices();
              }}
              className="
                flex min-h-11 w-full items-center justify-center gap-2 rounded-xl
                border border-dashed border-[var(--booking-border)] bg-[var(--booking-surface)]
                text-sm font-bold text-[var(--booking-text)]
                hover:border-[var(--booking-accent)] hover:bg-[var(--booking-accent-soft)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]
              "
              data-cart-add-service
            >
              <Plus className="h-4 w-4 text-[var(--booking-accent)]" aria-hidden />
              {t("service.cartAddAnother")}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-xl bg-[var(--booking-accent)] text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent)]"
            data-cart-modal-done
          >
            {t("actions.doneThanks")}
          </button>
        </div>
      </div>
    </div>
  );
}

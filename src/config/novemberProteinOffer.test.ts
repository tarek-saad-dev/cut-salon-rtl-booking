import { afterEach, describe, expect, it } from "vitest";
import {
  NOVEMBER_PACKAGE_CODE,
  NOVEMBER_WHATSAPP_MESSAGE,
  buildNovemberBookHref,
  clearRememberedNovemberPackageId,
  isNovemberCampaignActive,
  isNovemberPromoPackageId,
  novemberCampaignEndsAtMs,
  novemberCampaignStartsAtMs,
  novemberProteinOffer,
  readNovemberPackageIdFromEnv,
  rememberNovemberPackageId,
} from "./novemberProteinOffer";

describe("novemberProteinOffer config", () => {
  afterEach(() => {
    clearRememberedNovemberPackageId();
  });

  it("uses the POS package code and fixed marketing price without inventing a package id", () => {
    expect(NOVEMBER_PACKAGE_CODE).toBe("NOV-PRO600");
    expect(novemberProteinOffer.price).toBe(600);
    expect(novemberProteinOffer.href).toBe("/offers/november-protein");
    expect(readNovemberPackageIdFromEnv("")).toBeNull();
    expect(readNovemberPackageIdFromEnv("0")).toBeNull();
    expect(readNovemberPackageIdFromEnv("12")).toBe(12);
  });

  it("is active only within 1–30 November 2026 Africa/Cairo", () => {
    expect(isNovemberCampaignActive(novemberCampaignStartsAtMs())).toBe(true);
    expect(isNovemberCampaignActive(novemberCampaignEndsAtMs())).toBe(true);
    expect(isNovemberCampaignActive(novemberCampaignStartsAtMs() - 1)).toBe(false);
    expect(isNovemberCampaignActive(novemberCampaignEndsAtMs() + 1)).toBe(false);
  });

  it("builds book hrefs with barber choice and the real numeric package id", () => {
    expect(buildNovemberBookHref(42)).toBe("/book?mode=barber&packageId=42");
    expect(buildNovemberBookHref(42, "GLEEM")).toBe("/book?mode=barber&branch=GLEEM&packageId=42");
  });

  it("encodes the official WhatsApp assistance message", () => {
    expect(novemberProteinOffer.whatsappHref).toContain("wa.me/201012126899");
    expect(novemberProteinOffer.whatsappHref).toContain(encodeURIComponent(NOVEMBER_WHATSAPP_MESSAGE));
  });

  it("tracks the resolved November package id for anti-stack checks", () => {
    expect(isNovemberPromoPackageId(99)).toBe(false);
    rememberNovemberPackageId(99);
    expect(isNovemberPromoPackageId(99)).toBe(true);
    expect(isNovemberPromoPackageId(7)).toBe(false);
  });
});

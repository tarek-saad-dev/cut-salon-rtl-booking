import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import LoyaltyPage from "@/app/client/loyalty/page";
import { LOYALTY_IDENTITY_UNAVAILABLE } from "../loyaltyIdentity";

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  vi.unstubAllGlobals();
});

it.each([
  { phone: "01012345678", name: "Fixture" },
  { id: 42, phone: "01012345678", name: "Fixture" },
])("does not trust stored identity or URL override: %j", async (saved) => {
  localStorage.setItem("cut_client", JSON.stringify(saved));
  window.history.replaceState({}, "", "/client/loyalty?clientId=99&branchCode=foreign");
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(<LoyaltyPage />);
  expect(await screen.findByText(LOYALTY_IDENTITY_UNAVAILABLE)).toBeInTheDocument();
  const retry = screen.getByRole("button", { name: /حاول|محاولة/ });
  fireEvent.click(retry);
  expect(fetch).not.toHaveBeenCalled();
});

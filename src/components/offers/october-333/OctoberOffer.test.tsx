import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OctoberOffer, OctoberOfferSuccess } from "./OctoberOffer";
import { octoberOfferApi } from "@/lib/offers/octoberOfferApi";
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/offers/octoberOfferApi", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/offers/octoberOfferApi")>(), octoberOfferApi: { campaign: vi.fn(), claim: vi.fn() } }));
const campaign = { status: "active" as const, remainingClaims: 8, terms: "Test terms", validUntil: "2099-10-31T23:59:59Z" };
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); vi.mocked(octoberOfferApi.campaign).mockResolvedValue(campaign); });
describe("October offer funnel", () => {
  it("disables claims when unavailable", async () => {
    vi.mocked(octoberOfferApi.campaign).mockRejectedValue(new Error("unavailable"));
    render(<OctoberOffer />);
    await screen.findByText(/تأكيد العرض غير متاح/);
    expect(screen.getByRole("button", { name: "أكد عرض الـ333 جنيه" })).toBeDisabled();
    expect(octoberOfferApi.claim).not.toHaveBeenCalled();
  });
  it("keeps an ended campaign accessible without a claim form", async () => {
    vi.mocked(octoberOfferApi.campaign).mockResolvedValue({ ...campaign, remainingClaims: 0 });
    render(<OctoberOffer />);
    await screen.findByRole("heading", { name: "انتهى عرض أكتوبر" });
    expect(screen.queryByLabelText("الاسم")).not.toBeInTheDocument();
  });
  it("only navigates to success after a confirmed mock claim", async () => {
    vi.mocked(octoberOfferApi.claim).mockResolvedValue({ claimId: "mock-confirmation", validUntil: campaign.validUntil });
    render(<OctoberOffer />);
    await waitFor(() => expect(screen.getByRole("button", { name: "أكد عرض الـ333 جنيه" })).toBeEnabled());
    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "Test Customer" } });
    fireEvent.change(screen.getByLabelText("رقم الموبايل المصري"), { target: { value: "01012345678" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "أكد عرض الـ333 جنيه" })); });
    expect(push).toHaveBeenCalledWith("/offers/october-333/success");
    expect(sessionStorage.getItem("cut:october-333:receipt")).toContain("mock-confirmation");
    expect(sessionStorage.getItem("cut:october-333:receipt")).not.toContain("01012345678");
  });
  it("does not present a direct success visit as a confirmed claim", async () => {
    render(<OctoberOfferSuccess />);
    expect(await screen.findByText("لا يوجد تأكيد محفوظ")).toBeInTheDocument();
  });
  it("keeps failed claims on the form and uses the same key on retry", async () => {
    vi.mocked(octoberOfferApi.claim).mockRejectedValue(new Error("unavailable"));
    render(<OctoberOffer />);
    const button = screen.getByRole("button", { name: "أكد عرض الـ333 جنيه" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("رقم الموبايل المصري"), { target: { value: "01012345678" } });
    await act(async () => { fireEvent.click(button); });
    expect(await screen.findByText(/تعذر تأكيد الطلب/)).toBeInTheDocument();
    await act(async () => { fireEvent.click(button); });
    const calls = vi.mocked(octoberOfferApi.claim).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][3]).toBe(calls[1][3]);
    expect(push).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("cut:october-333:receipt")).toBeNull();
    fireEvent.change(screen.getByLabelText("الاسم"), { target: { value: "Changed" } });
    await act(async () => { fireEvent.click(button); });
    expect(octoberOfferApi.claim).toHaveBeenCalledTimes(2);
  });
  it("renders an expired campaign at its existing URL", async () => {
    vi.mocked(octoberOfferApi.campaign).mockResolvedValue({ ...campaign, validUntil: "2020-10-31T23:59:59Z" });
    render(<OctoberOffer />);
    await screen.findByRole("heading", { name: "انتهى عرض أكتوبر" });
    expect(screen.queryByLabelText("الاسم")).not.toBeInTheDocument();
  });
});

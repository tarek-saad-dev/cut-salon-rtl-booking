import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve(process.cwd(), "src/components/BookingModal.tsx"), "utf8");
const executable = src.replace(/\/\*[\s\S]*?\*\//g, "");

describe("CUT CLUB legacy lookup retirement preserves public guest booking (#62)", () => {
  it("does not issue a customer-profile lookup based solely on a typed phone", () => {
    for (const unsafe of [
      "lookupClientByMobile", "saveClient", "ClientLookupStatus",
      "lookupStatus", "lookedUpName", "clientWebsiteApi",
      "clientStorage", "setTimeout(async () =>",
    ]) expect(executable).not.toContain(unsafe);
    expect(executable).not.toContain("details.welcomeBack");
    expect(executable).not.toContain("details.newCustomer");
  });

  it("still asks for a phone and editable customer name, without OTP requiring booking", () => {
    expect(executable).toContain('id="bk-phone"');
    expect(executable).toContain('id="bk-name"');
    expect(executable).toContain("flow.setCustomerPhone(e.target.value)");
    expect(executable).toContain("flow.setCustomerName(e.target.value)");
    expect(executable).toContain("flow.isPhoneReady(flow.customerPhone)");
    expect(executable).toContain("flow.customerName.trim().length >= 2");
    expect(executable).not.toContain('readOnly={lookupStatus === "found"}');
    expect(executable).toContain("className=\"cut-input\"");
    expect(executable).toContain("Enter your name to book");
  });

  it("retains booking flow completion, date/slot selection and branch choices", () => {
    expect(executable).toContain("flow.selectSlot");
    expect(executable).toContain("flow.selectDate");
    expect(executable).toContain("BookingReviewStep");
    expect(executable).toContain("BookingSuccessStep");
    expect(executable).toContain("BranchPicker");
    expect(executable).toContain("flow.step");
    expect(executable).not.toContain("customerIdFromPhone");
  });
});

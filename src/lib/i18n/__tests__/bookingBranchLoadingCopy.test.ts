import { describe, it, expect } from "vitest";
import { bookingCatalog } from "@/lib/i18n/booking";

describe("branch loading i18n copy", () => {
  it("Arabic slow / error / title strings match product copy", () => {
    expect(bookingCatalog.branch.titleBarberFirst.ar).toBe("اختر الفرع الأنسب لك");
    expect(bookingCatalog.branch.loadingSlow.ar).toBe(
      "جارٍ تجهيز فروع {name}، قد يستغرق ذلك لحظات.",
    );
    expect(bookingCatalog.branch.loadFailedTitle.ar).toBe("تعذر تحميل فروع {name}");
    expect(bookingCatalog.branch.loadFailedBody.ar).toBe(
      "حاول مرة أخرى، أو ارجع لاختيار حلاق آخر.",
    );
    expect(bookingCatalog.actions.retry.ar).toBe("إعادة المحاولة");
    expect(bookingCatalog.branch.chooseAnotherBarber.ar).toBe("اختيار حلاق آخر");
  });

  it("English slow / error / title strings match product copy", () => {
    expect(bookingCatalog.branch.titleBarberFirst.en).toBe("Choose the branch that suits you");
    expect(bookingCatalog.branch.loadingSlow.en).toBe(
      "Preparing {name}’s branches. This may take a moment.",
    );
    expect(bookingCatalog.branch.loadFailedTitle.en).toBe("Couldn’t load {name}’s branches");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeServiceStep,
  normalizeServiceSteps,
  serviceCatalogHasSteps,
  getServiceSteps,
} from "@/lib/serviceStepsApi";

describe("serviceStepsApi", () => {
  it("normalizes admin PascalCase steps", () => {
    const steps = normalizeServiceSteps({
      steps: [
        {
          StepID: 123,
          ProID: 11,
          SortOrder: 20,
          TitleAr: "تنظيف البشرة بالغسول المناسب",
          TitleEn: null,
          DetailAr: null,
          DetailEn: null,
          DurationMinutes: 3,
        },
        {
          StepID: 122,
          SortOrder: 10,
          TitleAr: "استشارة سريعة",
          TitleEn: "Quick consult",
          DurationMinutes: 2,
        },
      ],
    });

    expect(steps).toHaveLength(2);
    expect(steps[0]?.titleAr).toBe("استشارة سريعة");
    expect(steps[0]?.sortOrder).toBe(10);
    expect(steps[1]?.id).toBe(123);
    expect(steps[1]?.durationMinutes).toBe(3);
  });

  it("normalizes camelCase public steps", () => {
    const step = normalizeServiceStep({
      id: 9,
      sortOrder: 30,
      titleEn: "Steam",
      detailEn: "Opens pores",
      durationMinutes: 5,
    });
    expect(step).toEqual({
      id: 9,
      sortOrder: 30,
      titleAr: null,
      titleEn: "Steam",
      detailAr: null,
      detailEn: "Opens pores",
      durationMinutes: 5,
    });
  });

  it("detects catalog hasSteps signals", () => {
    expect(serviceCatalogHasSteps({ hasSteps: true })).toBe(true);
    expect(serviceCatalogHasSteps({ stepCount: 8 })).toBe(true);
    expect(serviceCatalogHasSteps({ steps: [{ TitleAr: "أ", SortOrder: 10 }] })).toBe(true);
    expect(serviceCatalogHasSteps({})).toBe(false);
  });
});

afterEach(() => vi.unstubAllGlobals());

it("sends branch identity for public execution stages", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, steps: [] }),
  });
  vi.stubGlobal("fetch", fetchMock);
  await getServiceSteps(11, "GLEEM");
  const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
  expect(requestUrl.pathname).toBe("/api/public/services/11/steps");
  expect(requestUrl.searchParams.get("branchCode")).toBe("GLEEM");
});

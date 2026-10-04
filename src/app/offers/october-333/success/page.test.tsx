import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import Page from "./page";

describe("legacy October success route", () => {
  it("sends visitors back to the October experience instead of a 404", () => {
    Page();
    expect(redirect).toHaveBeenCalledWith("/offers/october-333");
  });
});

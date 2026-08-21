import { describe, expect, it } from "vitest";
import { buildBookHref } from "@/lib/book-o2/buildBookHref";

describe("buildBookHref", () => {
  it("defaults to /book", () => {
    expect(buildBookHref({})).toBe("/book");
  });

  it("encodes barber intent", () => {
    expect(buildBookHref({ mode: "barber", empId: 5 })).toBe(
      "/book?mode=barber&empId=5",
    );
  });

  it("encodes nearest + branch", () => {
    expect(buildBookHref({ mode: "nearest", branch: "CAMP_CAESAR" })).toBe(
      "/book?mode=nearest&branch=CAMP_CAESAR",
    );
  });

  it("forces barber mode when empId present", () => {
    expect(buildBookHref({ mode: "nearest", empId: 12 })).toBe(
      "/book?mode=barber&empId=12",
    );
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BranchPicker from "@/components/BranchPicker";

vi.mock("@/hooks/useBookingTranslations", () => ({
  useBookingTranslations: () => ({
    t: (key: string) => key,
    dir: "ltr",
    lang: "en",
    format: {},
  }),
}));

describe("BranchPicker loading skeletons", () => {
  it("renders two branch-card skeletons while loading", () => {
    const { container } = render(
      <BranchPicker branches={[]} onSelect={() => undefined} isLoading />,
    );
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);
    expect(screen.queryByText("branch.empty")).not.toBeInTheDocument();
  });
});

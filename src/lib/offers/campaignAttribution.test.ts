import { beforeEach, describe, expect, it } from "vitest";
import { captureCampaignAttribution, readCampaignAttribution } from "./campaignAttribution";

describe("campaignAttribution", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("captures utm and click ids from the query string", () => {
    const attrs = captureCampaignAttribution(
      "?utm_source=meta&utm_campaign=nov_protein&utm_medium=cpc&fbclid=abc",
    );
    expect(attrs).toEqual({
      utm_source: "meta",
      utm_campaign: "nov_protein",
      utm_medium: "cpc",
      fbclid: "abc",
    });
    expect(readCampaignAttribution()).toEqual(attrs);
  });

  it("does not overwrite first-touch values", () => {
    captureCampaignAttribution("?utm_source=meta");
    captureCampaignAttribution("?utm_source=google&utm_campaign=retarget");
    expect(readCampaignAttribution()).toEqual({
      utm_source: "meta",
      utm_campaign: "retarget",
    });
  });
});

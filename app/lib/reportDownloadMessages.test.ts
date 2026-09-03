import { describe, expect, it } from "vitest";

import {
  buildAnalysisReportDownloadToast,
  buildPreviewReportDownloadToast,
} from "@/app/lib/reportDownloadMessages";

describe("report download toast messaging", () => {
  it("returns success message when analysis report is saved", () => {
    const toast = buildAnalysisReportDownloadToast(false, true);
    expect(toast.type).toBe("success");
    expect(toast.message).toContain("saved in Adigator IQ");
  });

  it("returns skipped message when analysis report save is skipped", () => {
    const toast = buildAnalysisReportDownloadToast(true, false);
    expect(toast.type).toBe("error");
    expect(toast.message).toContain("save was skipped");
  });

  it("returns success message when preview report is saved", () => {
    const toast = buildPreviewReportDownloadToast("preview.pdf", false, true);
    expect(toast.type).toBe("success");
    expect(toast.message).toContain("saved");
  });

  it("returns skipped message when preview report save is skipped", () => {
    const toast = buildPreviewReportDownloadToast("preview.pdf", true, false);
    expect(toast.type).toBe("error");
    expect(toast.message).toContain("save was skipped");
  });
});

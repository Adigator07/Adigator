export function buildAnalysisReportDownloadToast(fromCache: boolean, persistedOnDownload: boolean): { message: string; type: "success" | "error" } {
  if (persistedOnDownload) {
    return {
      message: fromCache
        ? "Analysis report downloaded and saved in Adigator."
        : "Analysis report generated, downloaded, and saved in Adigator.",
      type: "success",
    };
  }

  return {
    message: fromCache
      ? "Analysis report downloaded, but campaign save was skipped."
      : "Analysis report generated and downloaded, but campaign save was skipped.",
    type: "error",
  };
}

export function buildPreviewReportDownloadToast(filename: string, fromCache: boolean, persistedOnDownload: boolean): { message: string; type: "success" | "error" } {
  if (persistedOnDownload) {
    return {
      message: fromCache
        ? `Preview report downloaded and saved: ${filename}`
        : `Preview report generated, downloaded, and saved: ${filename}`,
      type: "success",
    };
  }

  return {
    message: fromCache
      ? `Preview report downloaded, but campaign save was skipped: ${filename}`
      : `Preview report generated and downloaded, but campaign save was skipped: ${filename}`,
    type: "error",
  };
}

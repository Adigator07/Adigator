import { NextRequest, NextResponse } from "next/server";
import { refreshGoogleAdsAccessToken } from "@/app/lib/googleAds/client";
import { readGoogleAdsSession, writeGoogleAdsSession } from "@/app/lib/googleAds/session";
import { getGoogleAdsCampaignHealthSnapshot } from "@/app/lib/googleAds/healthSnapshot";
import { diffHealthIssues, evaluateCampaignHealth } from "@/app/lib/campaignHealth/engine";
import type { CampaignHealthMonitor } from "@/app/lib/campaignHealth/types";

export const runtime = "nodejs";
export const maxDuration = 120;

async function resolveAccessToken(request: NextRequest) {
  const session = readGoogleAdsSession(request);
  if (!session?.accessToken) return { accessToken: null as string | null, refreshedSession: null as typeof session };
  const now = Date.now();
  const willExpireSoon = session.expiryAt ? session.expiryAt - now < 60_000 : false;
  if (!willExpireSoon || !session.refreshToken) {
    return { accessToken: session.accessToken, refreshedSession: null };
  }
  const refreshed = await refreshGoogleAdsAccessToken(session.refreshToken);
  return {
    accessToken: refreshed.access_token,
    refreshedSession: {
      ...session,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token || session.refreshToken,
      expiryAt: Date.now() + ((refreshed.expires_in || 3600) * 1000),
      scope: refreshed.scope || session.scope,
      tokenType: refreshed.token_type || session.tokenType,
    },
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST { monitors } to run live Google Ads health checks. The Campaign Health workspace also runs on the selected interval while it is open.",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshedSession } = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Connect Google Ads to run campaign health checks." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const monitors = (Array.isArray(body?.monitors) ? body.monitors : []) as CampaignHealthMonitor[];
    const enabled = monitors.filter((monitor) => monitor.enabled && monitor.campaignId && monitor.customerId).slice(0, 12);
    if (!enabled.length) {
      return NextResponse.json({ error: "Select at least one campaign to monitor." }, { status: 400 });
    }

    const reports = [];
    const openedAlerts = [];
    const audit = [];
    const now = new Date().toISOString();

    for (const monitor of enabled) {
      const snapshot = await getGoogleAdsCampaignHealthSnapshot({
        accessToken,
        customerId: monitor.customerId,
        campaignId: monitor.campaignId,
        loginCustomerId: monitor.loginCustomerId,
        accountName: monitor.accountName,
      });
      const report = evaluateCampaignHealth(snapshot, monitor.id);
      const diff = diffHealthIssues(monitor.lastIssueIds || [], report.issues);
      reports.push(report);
      audit.push({
        id: `audit-${monitor.id}-${Date.now()}`,
        monitorId: monitor.id,
        campaignName: monitor.campaignName,
        event: "check_completed",
        summary: `${monitor.campaignName} scored ${report.score} (${report.grade}). ${report.issues.length} issue(s).`,
        createdAt: now,
      });
      for (const issue of diff.opened) {
        openedAlerts.push({
          id: `alert-${monitor.id}-${issue.id}-${Date.now()}`,
          monitorId: monitor.id,
          campaignName: monitor.campaignName,
          severity: issue.severity,
          title: issue.title,
          detail: issue.detail,
          recommendation: issue.recommendation,
          createdAt: now,
          acknowledged: false,
        });
        audit.push({
          id: `audit-open-${monitor.id}-${issue.id}-${Date.now()}`,
          monitorId: monitor.id,
          campaignName: monitor.campaignName,
          event: "issue_opened",
          summary: issue.title,
          createdAt: now,
        });
      }
      for (const issueId of diff.resolved) {
        audit.push({
          id: `audit-resolved-${monitor.id}-${issueId}-${Date.now()}`,
          monitorId: monitor.id,
          campaignName: monitor.campaignName,
          event: "issue_resolved",
          summary: `Resolved: ${issueId}`,
          createdAt: now,
        });
      }
    }

    const response = NextResponse.json({ reports, openedAlerts, audit, checkedAt: now });
    if (refreshedSession) writeGoogleAdsSession(response, refreshedSession);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useState } from "react";
import {
  AdChoicesMark,
  BrandAvatar,
  DeviceChrome,
  EnvironmentPreviewCard,
  MediaFrame,
  PhoneFrame,
  ScaledDeviceEnvironment,
  ScaledEnvironment,
} from "../shared/envShared";

function VideoShellCard({
  creative,
  badge,
  badgeClassName,
  deviceMode = "desktop",
  children,
  onCopy,
  onEdit,
}) {
  const [scaleLabel, setScaleLabel] = useState(null);
  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge={badge}
      badgeClassName={badgeClassName}
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      hideSizeLabel
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {typeof children === "function" ? children(setScaleLabel) : children}
    </EnvironmentPreviewCard>
  );
}

/** Google Video Partners — publisher page with embedded video player. */
export function GoogleVideoPartnersEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Google Video Partners"
      badgeClassName="bg-blue-500/20 text-blue-100 border-blue-400/30"
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledDeviceEnvironment
          deviceMode={deviceMode}
          mobile={{ width: 390, height: 780 }}
          desktop={{ width: 1100, height: 720 }}
          onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
        >
          {({ isMobile }) => (
            <DeviceChrome isMobile={isMobile} width={isMobile ? 390 : 1100} height={isMobile ? 780 : 720}>
              <div className="flex h-full flex-col bg-[#f8f9fa] text-slate-900">
                <div className="border-b border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Partner Publisher</p>
                  <p className="text-lg font-black">{creative.brandName || "Feature Story"}</p>
                </div>
                <div className="relative flex-1 bg-black">
                  <MediaFrame creative={creative} aspectRatio={isMobile ? "9 / 16" : "16 / 9"} fit="contain" />
                  <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Ad · Skip in 5</div>
                  <AdChoicesMark className="absolute right-2 top-2 text-white/80" />
                </div>
                <div className="bg-white p-4">
                  <p className="text-sm font-semibold">{creative.headline || "Sponsored video"}</p>
                  <p className="mt-1 text-xs text-slate-500">{creative.description || "Continues after this message."}</p>
                </div>
              </div>
            </DeviceChrome>
          )}
        </ScaledDeviceEnvironment>
      )}
    </VideoShellCard>
  );
}

/** Meta in-stream / rewarded style player. */
export function MetaInStreamEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Meta In-Stream"
      badgeClassName="bg-indigo-500/20 text-indigo-100 border-indigo-400/30"
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledDeviceEnvironment
          deviceMode={deviceMode}
          mobile={{ width: 390, height: 780 }}
          desktop={{ width: 960, height: 640 }}
          onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
        >
          {({ isMobile }) => (
            <DeviceChrome isMobile={isMobile} width={isMobile ? 390 : 960} height={isMobile ? 780 : 640}>
              <div className="relative flex h-full flex-col bg-black text-white">
                <div className="flex items-center justify-between px-4 py-3 text-xs text-white/70">
                  <span>In-stream ad</span>
                  <span>Sponsored</span>
                </div>
                <div className="relative flex-1">
                  <MediaFrame creative={creative} aspectRatio={isMobile ? "9 / 16" : "16 / 9"} fit="contain" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">
                    <div>
                      <p className="text-sm font-semibold">{creative.headline || creative.brandName}</p>
                      <p className="text-xs text-white/70">{creative.cta || "Learn More"}</p>
                    </div>
                    <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black">
                      {creative.cta || "Learn More"}
                    </button>
                  </div>
                  <AdChoicesMark className="absolute right-3 top-3 text-white/70" />
                </div>
              </div>
            </DeviceChrome>
          )}
        </ScaledDeviceEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgPublisherVideoEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Publisher Website"
      badgeClassName="bg-slate-500/20 text-slate-100 border-slate-400/30"
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledDeviceEnvironment
          deviceMode={deviceMode}
          mobile={{ width: 390, height: 820 }}
          desktop={{ width: 1080, height: 760 }}
          onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
        >
          {({ isMobile }) => (
            <DeviceChrome isMobile={isMobile} width={isMobile ? 390 : 1080} height={isMobile ? 820 : 760}>
              {isMobile ? (
                <div className="flex h-full flex-col bg-white text-slate-900">
                  <div className="flex justify-between px-5 pt-3 text-[11px] font-semibold text-slate-500">
                    <span>9:41</span>
                    <span>▮▮▮ 🔋</span>
                  </div>
                  <header className="border-b border-slate-200 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Mobile News</p>
                    <h2 className="mt-1 text-lg font-black leading-tight">Morning briefing</h2>
                  </header>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                      Sponsored video appears in your mobile article scroll.
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-md">
                      <MediaFrame creative={creative} aspectRatio="9 / 16" fit="contain" />
                      <div className="flex items-center justify-between bg-slate-900 px-3 py-2.5 text-[11px] text-white/85">
                        <span>Advertisement</span>
                        <span className="font-semibold">{creative.cta || "Learn More"}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Continue reading after the placement.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col bg-white text-slate-900">
                  <header className="border-b border-slate-200 px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Daily Chronicle</p>
                    <h2 className="mt-1 text-xl font-black">Morning briefing</h2>
                  </header>
                  <div className="space-y-3 p-5">
                    <p className="text-sm leading-relaxed text-slate-600">
                      Top stories continue below. Video unit loads in the article body.
                    </p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                      <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
                      <div className="flex items-center justify-between bg-slate-900 px-3 py-2 text-[10px] text-white/80">
                        <span>Advertisement</span>
                        <span>{creative.cta || "Learn More"}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      More coverage and analysis from our newsroom follows the sponsored break.
                    </p>
                  </div>
                </div>
              )}
            </DeviceChrome>
          )}
        </ScaledDeviceEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgMobileAppVideoEnvironment({ creative, onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Mobile App"
      badgeClassName="bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledEnvironment naturalWidth={375} naturalHeight={812} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
          <PhoneFrame width={375} height={812} className="border-[8px] bg-black">
            <div className="relative h-full w-full overflow-hidden text-white">
              <MediaFrame creative={creative} aspectRatio="9 / 16" fit="cover" className="!rounded-none" />
              <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-4">
                <p className="text-xs text-white/70">In-app video</p>
                <p className="text-sm font-semibold">Rewarded placement</p>
              </div>
              <div className="absolute inset-x-4 bottom-8 rounded-2xl bg-white/95 p-4 text-slate-900">
                <div className="flex items-center gap-3">
                  <BrandAvatar creative={creative} size={40} />
                  <div>
                    <p className="text-sm font-bold">{creative.brandName || "Brand"}</p>
                    <p className="text-xs text-slate-500">{creative.headline || "Sponsored"}</p>
                  </div>
                </div>
                <button type="button" className="mt-3 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white">
                  {creative.cta || "Watch & Continue"}
                </button>
              </div>
            </div>
          </PhoneFrame>
        </ScaledEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgInStreamEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="In-Stream Video"
      badgeClassName="bg-rose-500/20 text-rose-100 border-rose-400/30"
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledDeviceEnvironment
          deviceMode={deviceMode}
          mobile={{ width: 390, height: 700 }}
          desktop={{ width: 1040, height: 640 }}
          onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
        >
          {({ isMobile }) => (
            <DeviceChrome isMobile={isMobile} width={isMobile ? 390 : 1040} height={isMobile ? 780 : 640}>
              {isMobile ? (
                <div className="flex h-full flex-col bg-[#0b0b0f] text-white">
                  <div className="flex justify-between px-5 pt-3 text-[11px] font-semibold text-white/70">
                    <span>9:41</span>
                    <span>▮▮▮ 🔋</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/60">
                    <span>Mobile Player</span>
                    <span>Pre-roll</span>
                  </div>
                  <div className="relative flex-1 bg-black">
                    <MediaFrame creative={creative} aspectRatio="9 / 16" fit="contain" />
                    <div className="absolute bottom-5 inset-x-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{creative.headline || creative.brandName || "Sponsored"}</p>
                        <p className="text-[11px] text-white/70">Tap to visit site</p>
                      </div>
                      <div className="rounded border border-white/25 bg-black/70 px-3 py-1.5 text-xs">
                        Skip ›
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col bg-[#0b0b0f] text-white">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-white/60">
                    <span>Stream Player</span>
                    <span>Pre-roll</span>
                  </div>
                  <div className="relative flex-1 bg-black">
                    <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
                    <div className="absolute bottom-4 right-4 rounded border border-white/20 bg-black/70 px-3 py-1.5 text-xs">
                      Skip Ad ›
                    </div>
                  </div>
                </div>
              )}
            </DeviceChrome>
          )}
        </ScaledDeviceEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgOutStreamEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Out-Stream Video"
      badgeClassName="bg-amber-500/20 text-amber-100 border-amber-400/30"
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledDeviceEnvironment
          deviceMode={deviceMode}
          mobile={{ width: 390, height: 780 }}
          desktop={{ width: 980, height: 720 }}
          onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
        >
          {({ isMobile }) => (
            <DeviceChrome isMobile={isMobile} width={isMobile ? 390 : 980} height={isMobile ? 820 : 720}>
              {isMobile ? (
                <div className="flex h-full flex-col bg-[#f8f5ef] text-slate-900">
                  <div className="flex justify-between px-5 pt-3 text-[11px] font-semibold text-slate-500">
                    <span>9:41</span>
                    <span>▮▮▮ 🔋</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mobile Blog</p>
                    <h2 className="mt-1 text-xl font-black leading-tight">Teams plan modern media buys</h2>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                      Out-stream units appear in mobile reading flow.
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-black shadow-lg">
                      <MediaFrame creative={creative} aspectRatio="9 / 16" fit="contain" />
                      <div className="flex items-center justify-between bg-white px-3 py-3">
                        <div>
                          <p className="text-sm font-semibold">{creative.headline || "Sponsored"}</p>
                          <p className="text-xs text-slate-500">{creative.brandName}</p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                          {creative.cta || "Learn More"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-[#f4f1ea] p-5 text-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publisher Blog</p>
                  <h2 className="mt-2 text-2xl font-black">How teams plan modern media buys</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Out-stream units appear naturally in the reading experience.
                  </p>
                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-black shadow-lg">
                    <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
                    <div className="flex items-center justify-between bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">{creative.headline || "Sponsored"}</p>
                        <p className="text-xs text-slate-500">{creative.brandName}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {creative.cta || "Learn More"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DeviceChrome>
          )}
        </ScaledDeviceEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgCtvEnvironment({ creative, onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Connected TV"
      badgeClassName="bg-violet-500/20 text-violet-100 border-violet-400/30"
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledEnvironment naturalWidth={1200} naturalHeight={700} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#050508] shadow-2xl" style={{ width: 1200, height: 700 }}>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-8 py-4 text-sm text-white/60">
                <span>Living Room · CTV</span>
                <span>Ad break</span>
              </div>
              <div className="relative mx-8 flex-1 overflow-hidden rounded-2xl bg-black">
                <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" className="h-full" />
                <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-black">
                  {creative.cta || "Learn More"}
                </div>
              </div>
              <div className="px-8 py-4 text-white">
                <p className="text-lg font-semibold">{creative.headline || creative.brandName}</p>
              </div>
            </div>
          </div>
        </ScaledEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgOttEnvironment({ creative, onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="OTT Platform"
      badgeClassName="bg-cyan-500/20 text-cyan-100 border-cyan-400/30"
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledEnvironment naturalWidth={1180} naturalHeight={680} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#020617]" style={{ width: 1180, height: 680 }}>
            <div className="grid h-full grid-cols-[280px_1fr]">
              <aside className="border-r border-white/10 p-6 text-white/70">
                <p className="text-sm font-bold text-white">StreamNow+</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {["Home", "Shows", "Movies", "Live", "My List"].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </aside>
              <div className="relative p-6">
                <div className="overflow-hidden rounded-2xl bg-black">
                  <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
                </div>
                <p className="mt-4 text-xl font-bold text-white">{creative.headline || "Featured title"}</p>
                <p className="mt-1 text-sm text-white/60">Sponsored stream · {creative.brandName || "Brand"}</p>
              </div>
            </div>
          </div>
        </ScaledEnvironment>
      )}
    </VideoShellCard>
  );
}

export function ProgDoohEnvironment({ creative, onCopy, onEdit }) {
  return (
    <VideoShellCard
      creative={creative}
      badge="Digital Out-of-Home"
      badgeClassName="bg-orange-500/20 text-orange-100 border-orange-400/30"
      onCopy={onCopy}
      onEdit={onEdit}
    >
      {(setScaleLabel) => (
        <ScaledEnvironment naturalWidth={1100} naturalHeight={640} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
          <div className="relative overflow-hidden rounded-[24px] border border-slate-700 bg-slate-900" style={{ width: 1100, height: 640 }}>
            <div className="absolute inset-x-10 top-8 bottom-20 overflow-hidden rounded-2xl border-4 border-slate-600 bg-black shadow-[0_0_60px_rgba(0,0,0,0.45)]">
              <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-slate-800 px-8 py-4 text-center text-sm text-slate-300">
              Urban screen · DOOH placement preview
            </div>
          </div>
        </ScaledEnvironment>
      )}
    </VideoShellCard>
  );
}

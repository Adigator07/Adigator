"use client";

import { getPlatformAdapter } from "@/app/lib/platforms/registry";

type Props = {
  platform: string;
  taskType: string;
  onTaskTypeChange: (value: string) => void;
};

export default function PlatformStep1Fields({
  platform,
  taskType,
  onTaskTypeChange,
}: Props) {
  const adapter = getPlatformAdapter(platform);

  return (
    <section className="neon-card space-y-4 rounded-2xl p-5" id="platform-task-type">
      <div>
        <p className="tool-neon-accent text-[11px] font-semibold uppercase tracking-[0.22em]">
          {adapter.label} Workflow
        </p>
        <h3 className="mt-2 text-lg font-bold text-[#f4f4f8]">What are you doing today?</h3>
        <p className="mt-1 text-sm text-[#c8c8d4]">
          Each workflow applies {adapter.shortLabel}-specific validation, analysis rules, and reporting.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {adapter.taskTypes.map((item) => {
          const active = taskType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTaskTypeChange(item.id)}
              className={`studio-focus-ring rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-studio-accent bg-studio-accent/15 shadow-studio-glow"
                  : "border-white/12 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <p className="text-sm font-semibold text-[#f4f4f8]">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#9a9aad]">{item.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Download, FolderUp, UploadCloud, XCircle } from "lucide-react";

import CreativeCard from "@/app/components/CreativeCard";
import ValidationIssueRow from "@/app/components/ValidationIssueRow";
import { ToolDropzone, ToolInput, ToolStatCard, ToolSurface } from "@/app/components/preview-tool/PreviewToolUi";
import { buildValidationSummary } from "@/app/lib/creativeValidation";
import {
  getImageFilesFromDataTransfer,
  preventDropDefaults,
  selectFolderFiles,
  selectImageFiles,
  type UploadableFileInput,
} from "@/app/lib/folderUpload";
import type { ProgrammaticAdGroup } from "@/app/lib/programmaticWorkflow";
import { getProgrammaticAdGroupDisplayName } from "@/app/lib/programmaticWorkflow";

type CreativeItem = {
  id: string;
  name?: string;
  valid?: boolean;
  url?: string;
  text?: string;
  image?: string;
  title?: string;
  mimeType?: string;
  adGroupId?: string | null;
  validation?: {
    status?: string;
    issues?: Array<Record<string, unknown>>;
  };
};

type ProgrammaticFolderSectionsProps = {
  folders: ProgrammaticAdGroup[];
  singleFolder?: boolean;
  singleFolderLabel?: string;
  creatives: CreativeItem[];
  isLoading: boolean;
  editingId: string | null;
  editingName: string;
  targetSizeByCreative: Record<string, string>;
  compressingCreativeIds: string[];
  fixingCreativeIds: string[];
  isBulkCompressing: boolean;
  onFolderSelect: (files: UploadableFileInput, adGroup: ProgrammaticAdGroup) => void;
  onRemoveCreative: (id: string) => void;
  onStartEdit: (id: string, name: string) => void;
  onEditingNameChange: (value: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDownloadCreative: (creative: CreativeItem) => void;
  onTargetSizeChange: (id: string, value: string) => void;
  onCompressCreative: (id: string, options: { enforceSizeCompliance: boolean; targetSizeKB?: string }) => void;
  onEditCreative: (creative: CreativeItem) => void;
  onApplyFix: (creativeId: string, actionId: string) => void;
};

function isRenderableCreative(creative: CreativeItem): boolean {
  return Boolean(creative?.url || creative?.text || creative?.image || creative?.title);
}

function creativesForFolder(folderId: string, creatives: CreativeItem[], singleFolder: boolean): CreativeItem[] {
  if (singleFolder) {
    return creatives;
  }
  return creatives.filter((creative) => creative.adGroupId === folderId);
}

function CreativeActions({
  creative,
  editingId,
  editingName,
  targetSizeByCreative,
  compressingCreativeIds,
  fixingCreativeIds,
  isBulkCompressing,
  invalid = false,
  onRemoveCreative,
  onStartEdit,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onDownloadCreative,
  onTargetSizeChange,
  onCompressCreative,
  onEditCreative,
  onApplyFix,
}: {
  creative: CreativeItem;
  editingId: string | null;
  editingName: string;
  targetSizeByCreative: Record<string, string>;
  compressingCreativeIds: string[];
  fixingCreativeIds: string[];
  isBulkCompressing: boolean;
  invalid?: boolean;
  onRemoveCreative: (id: string) => void;
  onStartEdit: (id: string, name: string) => void;
  onEditingNameChange: (value: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDownloadCreative: (creative: CreativeItem) => void;
  onTargetSizeChange: (id: string, value: string) => void;
  onCompressCreative: (id: string, options: { enforceSizeCompliance: boolean; targetSizeKB?: string }) => void;
  onEditCreative: (creative: CreativeItem) => void;
  onApplyFix: (creativeId: string, actionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <CreativeCard
        creative={creative}
        onEdit={invalid ? (entry: CreativeItem) => onEditCreative(entry) : undefined}
        onRemove={onRemoveCreative}
        disableLayoutAnimation={isBulkCompressing || compressingCreativeIds.length > 0}
      />
      {!invalid && (
        editingId === creative.id ? (
          <div className="mt-1 flex gap-1">
            <input
              autoFocus
              value={editingName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onEditingNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSaveEdit(creative.id);
                if (event.key === "Escape") onCancelEdit();
              }}
              className="min-w-0 flex-1 rounded-lg border border-purple-500 bg-white/10 px-2 py-1 text-xs text-white outline-none"
            />
            <button type="button" onClick={() => onSaveEdit(creative.id)} className="rounded-lg bg-sky-600 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-700">✓</button>
            <button type="button" onClick={onCancelEdit} className="studio-btn-ghost rounded-lg px-2 py-1 text-xs font-semibold">✕</button>
          </div>
        ) : (
          <button type="button" onClick={() => onStartEdit(creative.id, creative.name || "")} className="group/rn mt-1 flex items-center gap-1 text-left">
            <span className="truncate text-xs text-[#c8c8d4] group-hover/rn:text-cyan-300">{creative.name}</span>
            <span className="text-[10px] text-[#9a9aad] group-hover/rn:text-cyan-400">✏️</span>
          </button>
        )
      )}
      {!invalid ? (
        <button type="button" onClick={() => onDownloadCreative(creative)} className="studio-btn-ghost mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium">
          <Download size={12} /> Download
        </button>
      ) : null}
      <div className="mt-1 flex items-center gap-2">
        <ToolInput
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={targetSizeByCreative[creative.id] ?? ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTargetSizeChange(creative.id, event.target.value)}
          placeholder="Target KB"
          className="w-full px-2 py-1.5 text-xs"
        />
        <span className="text-[10px] font-semibold text-studio-tertiary">KB</span>
      </div>
      <button
        type="button"
        onClick={() => onCompressCreative(creative.id, {
          enforceSizeCompliance: true,
          targetSizeKB: targetSizeByCreative[creative.id],
        })}
        disabled={compressingCreativeIds.includes(creative.id) || String(creative.mimeType || "").toLowerCase() === "image/gif"}
        className={`mt-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          invalid
            ? "w-full border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800"
            : "border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800"
        }`}
      >
        {compressingCreativeIds.includes(creative.id)
          ? "Compressing..."
          : String(creative.mimeType || "").toLowerCase() === "image/gif"
            ? "GIF Unsupported"
            : "Compress Size"}
      </button>
      {creative.validation?.issues?.length ? (
        <div className={`mt-2 rounded-lg border p-2 ${invalid ? "border-red-500/25 bg-red-500/10" : "border-amber-500/25 bg-amber-500/10"}`}>
          {!invalid ? (
            <p className="text-[11px] font-semibold text-amber-300">
              {creative.validation.status} • {creative.validation.issues.length} issue{creative.validation.issues.length > 1 ? "s" : ""}
            </p>
          ) : null}
          <div className="mt-2 space-y-1.5">
            {creative.validation.issues.slice(0, 3).map((issue, index) => (
              <ValidationIssueRow
                key={`${creative.id}-issue-${index}`}
                issue={issue}
                creativeId={creative.id}
                onApplyFix={onApplyFix}
                isFixing={fixingCreativeIds.includes(creative.id) || compressingCreativeIds.includes(creative.id)}
                variant={invalid ? "critical" : "warning"}
              />
            ))}
            {creative.validation.issues.length > 3 ? (
              <p className={`text-[10px] ${invalid ? "text-red-200/80" : "text-amber-200/80"}`}>
                +{creative.validation.issues.length - 3} more issue(s)
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ProgrammaticFolderSections({
  folders,
  singleFolder = false,
  singleFolderLabel = "Upload Creative Folder",
  creatives,
  isLoading,
  editingId,
  editingName,
  targetSizeByCreative,
  compressingCreativeIds,
  fixingCreativeIds,
  isBulkCompressing,
  onFolderSelect,
  onRemoveCreative,
  onStartEdit,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  onDownloadCreative,
  onTargetSizeChange,
  onCompressCreative,
  onEditCreative,
  onApplyFix,
}: ProgrammaticFolderSectionsProps) {
  const folderInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragActiveGroupId, setDragActiveGroupId] = useState<string | null>(null);
  const [extractingGroupId, setExtractingGroupId] = useState<string | null>(null);

  const uploadFilesForGroup = useCallback((files: UploadableFileInput, group: ProgrammaticAdGroup) => {
    if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0)) return;
    onFolderSelect(files, group);
  }, [onFolderSelect]);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>, group: ProgrammaticAdGroup) => {
    preventDropDefaults(event);
    setDragActiveGroupId(null);
    setExtractingGroupId(group.id);
    void getImageFilesFromDataTransfer(event.dataTransfer)
      .then((files) => {
        if (files.length) uploadFilesForGroup(files, group);
      })
      .finally(() => {
        setExtractingGroupId((current) => (current === group.id ? null : current));
      });
  }, [uploadFilesForGroup]);
  const groups = singleFolder
    ? [{ id: "programmatic-folder", name: singleFolderLabel, objective: "" as const }]
    : folders;

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const displayName = singleFolder ? singleFolderLabel : getProgrammaticAdGroupDisplayName(group);
        const folderCreatives = creativesForFolder(group.id, creatives, singleFolder);
        const validFolderCreatives = folderCreatives.filter((creative) => creative.valid && isRenderableCreative(creative));
        const invalidFolderCreatives = folderCreatives.filter((creative) => !creative.valid || !isRenderableCreative(creative));
        const folderValidation = buildValidationSummary(
          folderCreatives.map((creative) => creative.validation).filter(Boolean),
        );

        return (
          <ToolSurface key={group.id} className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-studio-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FolderUp size={18} className="text-studio-accent" />
                  <h3 className="studio-heading text-lg font-bold text-studio-text">{displayName}</h3>
                </div>
                <p className="mt-1 text-sm text-studio-muted">
                  {folderCreatives.length > 0
                    ? `${folderCreatives.length} creative${folderCreatives.length === 1 ? "" : "s"} in this folder`
                    : "No creatives uploaded for this folder yet"}
                  {group.objective ? ` · Objective: ${group.objective}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-studio-success/30 bg-studio-success/10 px-3 py-1 text-studio-success">
                  {validFolderCreatives.length} ready
                </span>
                <span className="rounded-full border border-studio-error/30 bg-studio-error/10 px-3 py-1 text-studio-error">
                  {invalidFolderCreatives.length} critical
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                  {folderValidation.warningCount} warning{folderValidation.warningCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <ToolDropzone
              active={dragActiveGroupId === group.id}
              onClick={() => {
                void (async () => {
                  const files = await selectFolderFiles(folderInputRefs.current[group.id]);
                  if (files?.length) uploadFilesForGroup(files, group);
                })();
              }}
              onDragEnter={(event: DragEvent<HTMLDivElement>) => {
                preventDropDefaults(event);
                setDragActiveGroupId(group.id);
              }}
              onDragOver={(event: DragEvent<HTMLDivElement>) => {
                preventDropDefaults(event);
                setDragActiveGroupId(group.id);
              }}
              onDragLeave={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.stopPropagation();
                const related = event.relatedTarget as Node | null;
                if (related && event.currentTarget.contains(related)) return;
                setDragActiveGroupId((current) => (current === group.id ? null : current));
              }}
              onDrop={(event: DragEvent<HTMLDivElement>) => handleDrop(event, group)}
            >
              <UploadCloud size={32} className="mx-auto mb-2 text-studio-accent" />
              <p className="text-sm font-semibold text-studio-text">
                {dragActiveGroupId === group.id ? "Drop creatives here" : "Upload folder or individual creatives"}
              </p>
              <p className="mt-1 text-xs text-studio-muted">
                Drag and drop files or folders, or use the buttons below. Changes only affect {displayName}.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void (async () => {
                      const files = await selectFolderFiles(folderInputRefs.current[group.id]);
                      if (files?.length) uploadFilesForGroup(files, group);
                    })();
                  }}
                  className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-2 rounded-xl border border-studio-border px-4 py-2 text-xs font-semibold"
                >
                  <FolderUp size={14} />
                  Select folder
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void (async () => {
                      const files = await selectImageFiles(fileInputRefs.current[group.id]);
                      if (files?.length) uploadFilesForGroup(files, group);
                    })();
                  }}
                  className="studio-btn-ghost studio-focus-ring inline-flex items-center gap-2 rounded-xl border border-studio-border px-4 py-2 text-xs font-semibold"
                >
                  <UploadCloud size={14} />
                  Select files
                </button>
              </div>
              <input
                ref={(node) => {
                  folderInputRefs.current[group.id] = node;
                }}
                type="file"
                hidden
                multiple
                accept="image/*"
                tabIndex={-1}
                aria-hidden
              />
              <input
                ref={(node) => {
                  fileInputRefs.current[group.id] = node;
                }}
                type="file"
                hidden
                multiple
                accept="image/*"
                tabIndex={-1}
                aria-hidden
              />
            </ToolDropzone>

            {folderCreatives.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <ToolStatCard value={folderCreatives.length} label="Total" tone="accent" />
                <ToolStatCard value={validFolderCreatives.length} label="Ready" tone="success" />
                <ToolStatCard value={folderValidation.warningCount} label="Warnings" tone="warning" />
                <ToolStatCard value={folderValidation.criticalCount} label="Critical" tone="error" />
              </div>
            ) : null}

            {validFolderCreatives.length > 0 ? (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-studio-text">
                  <CheckCircle2 className="text-studio-success" size={16} />
                  Valid Creatives
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {validFolderCreatives.map((creative) => (
                    <CreativeActions
                      key={creative.id}
                      creative={creative}
                      editingId={editingId}
                      editingName={editingName}
                      targetSizeByCreative={targetSizeByCreative}
                      compressingCreativeIds={compressingCreativeIds}
                      fixingCreativeIds={fixingCreativeIds}
                      isBulkCompressing={isBulkCompressing}
                      onRemoveCreative={onRemoveCreative}
                      onStartEdit={onStartEdit}
                      onEditingNameChange={onEditingNameChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onDownloadCreative={onDownloadCreative}
                      onTargetSizeChange={onTargetSizeChange}
                      onCompressCreative={onCompressCreative}
                      onEditCreative={onEditCreative}
                      onApplyFix={onApplyFix}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {invalidFolderCreatives.length > 0 ? (
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-studio-text">
                  <XCircle className="text-studio-error" size={16} />
                  Critical Creatives (Fix Before Analysis)
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {invalidFolderCreatives.map((creative) => (
                    <CreativeActions
                      key={creative.id}
                      creative={creative}
                      editingId={editingId}
                      editingName={editingName}
                      targetSizeByCreative={targetSizeByCreative}
                      compressingCreativeIds={compressingCreativeIds}
                      fixingCreativeIds={fixingCreativeIds}
                      isBulkCompressing={isBulkCompressing}
                      invalid
                      onRemoveCreative={onRemoveCreative}
                      onStartEdit={onStartEdit}
                      onEditingNameChange={onEditingNameChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onDownloadCreative={onDownloadCreative}
                      onTargetSizeChange={onTargetSizeChange}
                      onCompressCreative={onCompressCreative}
                      onEditCreative={onEditCreative}
                      onApplyFix={onApplyFix}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {isLoading || extractingGroupId === group.id ? (
              <p className="text-xs text-studio-muted">
                {extractingGroupId === group.id
                  ? `Reading dropped files for ${displayName}…`
                  : `Validating uploads for ${displayName}…`}
              </p>
            ) : null}
          </ToolSurface>
        );
      })}
    </div>
  );
}

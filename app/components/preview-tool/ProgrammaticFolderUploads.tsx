"use client";

import type { DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { FolderUp, UploadCloud } from "lucide-react";

import { ToolDropzone } from "@/app/components/preview-tool/PreviewToolUi";
import {
  getImageFilesFromDataTransfer,
  preventDropDefaults,
  selectFolderFiles,
  selectImageFiles,
  type UploadableFileInput,
} from "@/app/lib/folderUpload";
import {
  getProgrammaticAdGroupDisplayName,
  type ProgrammaticAdGroup,
} from "@/app/lib/programmaticWorkflow";

type ProgrammaticFolderUploadsProps = {
  adGroups: ProgrammaticAdGroup[];
  creativesByAdGroup: Record<string, number>;
  isLoading: boolean;
  onFolderSelect: (files: UploadableFileInput, adGroup: ProgrammaticAdGroup) => void;
  singleFolder?: boolean;
  singleFolderLabel?: string;
};

export default function ProgrammaticFolderUploads({
  adGroups,
  creativesByAdGroup,
  isLoading,
  onFolderSelect,
  singleFolder = false,
  singleFolderLabel = "Upload Creative Folder",
}: ProgrammaticFolderUploadsProps) {
  const folderInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragActiveGroupId, setDragActiveGroupId] = useState<string | null>(null);

  const uploadFilesForGroup = useCallback((files: UploadableFileInput, group: ProgrammaticAdGroup) => {
    if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0)) return;
    onFolderSelect(files, group);
  }, [onFolderSelect]);

  const groups: ProgrammaticAdGroup[] = singleFolder
    ? [{ id: "programmatic-folder", name: singleFolderLabel, objective: "" }]
    : adGroups;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.map((group) => {
        const uploadCount = creativesByAdGroup[group.id] || 0;
        const displayName = singleFolder ? singleFolderLabel : getProgrammaticAdGroupDisplayName(group);

        return (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-studio-text">{displayName}</p>
                <p className="text-xs text-studio-muted">
                  {uploadCount > 0 ? `${uploadCount} creative${uploadCount === 1 ? "" : "s"} uploaded` : "No folder uploaded yet"}
                </p>
              </div>
              <FolderUp size={18} className="shrink-0 text-studio-accent" aria-hidden />
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
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                preventDropDefaults(event);
                setDragActiveGroupId(null);
                void getImageFilesFromDataTransfer(event.dataTransfer).then((files) => {
                  if (files.length) uploadFilesForGroup(files, group);
                });
              }}
            >
              <UploadCloud size={36} className="mx-auto mb-3 text-studio-accent" />
              <h3 className="studio-heading mb-1 text-lg font-bold text-studio-text">
                {dragActiveGroupId === group.id ? "Drop creatives here" : "Upload Creatives"}
              </h3>
              <p className="text-sm text-studio-muted">
                Drag files or folders for {displayName.toLowerCase()}, or choose below.
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
          </div>
        );
      })}

      {isLoading ? (
        <p className="text-xs text-studio-muted lg:col-span-2">Validating uploaded folders…</p>
      ) : null}
    </div>
  );
}

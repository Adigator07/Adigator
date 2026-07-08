import { filterImageFiles } from "@/app/lib/programmaticWorkflow";
import { filterMediaFiles } from "@/app/lib/video/videoClient";

/** Filter dropped/selected files to images (default) or images + videos when allowVideo is set. */
function filterUploadFiles(files: FileList | File[] | null | undefined, allowVideo: boolean): File[] {
  return allowVideo ? filterMediaFiles(files, { allowVideo: true }) : filterImageFiles(files);
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
};

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
  entries?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
  values?: () => AsyncIterableIterator<FileSystemHandle>;
};

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve(), { timeout: 48 });
    } else if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export function preventDropDefaults(event: Pick<DragEvent, "preventDefault" | "stopPropagation" | "dataTransfer">): void {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
}

export function supportsFolderPicker(): boolean {
  return typeof window !== "undefined" && typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function";
}

async function listDirectoryChildren(handle: FileSystemDirectoryHandle): Promise<FileSystemHandle[]> {
  const directory = handle as DirectoryHandleWithEntries;
  const children: FileSystemHandle[] = [];

  if (typeof directory.entries === "function") {
    for await (const [, entry] of directory.entries()) {
      children.push(entry);
    }
    if (children.length > 0) return children;
  }

  if (typeof directory.values === "function") {
    for await (const entry of directory.values()) {
      children.push(entry);
    }
  }

  return children;
}

async function readDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<File[]> {
  const files: File[] = [];

  async function walk(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    const children = await listDirectoryChildren(dirHandle);
    for (const entry of children) {
      if (entry.kind === "file") {
        try {
          files.push(await (entry as FileSystemFileHandle).getFile());
        } catch (error) {
          console.warn("[Adigator] Skipped unreadable file in folder:", error);
        }
        if (files.length % 25 === 0) await yieldToMain();
        continue;
      }
      if (entry.kind === "directory") {
        await walk(entry as FileSystemDirectoryHandle);
      }
    }
  }

  await walk(handle);
  return files;
}

export async function pickFolderImageFiles(allowVideo = false): Promise<File[] | null> {
  if (!supportsFolderPicker()) return null;

  try {
    const handle = await (window as DirectoryPickerWindow).showDirectoryPicker!({ mode: "read" });
    const files = filterUploadFiles(await readDirectoryHandle(handle), allowVideo);
    return files;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    throw error;
  }
}

async function traverseFileTree(entry: FileSystemEntry, files: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    files.push(file);
    if (files.length % 25 === 0) await yieldToMain();
    return;
  }

  if (!entry.isDirectory) return;

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const readBatch = (): Promise<FileSystemEntry[]> => new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });

  let batch = await readBatch();
  while (batch.length > 0) {
    for (const child of batch) {
      await traverseFileTree(child, files);
    }
    batch = await readBatch();
    await yieldToMain();
  }
}

export async function getImageFilesFromDataTransfer(
  dataTransfer: DataTransfer,
  allowVideo = false,
): Promise<File[]> {
  const directFiles = filterUploadFiles(dataTransfer.files, allowVideo);
  const items = dataTransfer.items;

  if (!items?.length) {
    return directFiles;
  }

  let hasDirectoryEntry = false;
  for (let index = 0; index < items.length; index += 1) {
    const entry = items[index].webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      hasDirectoryEntry = true;
      break;
    }
  }

  // Fast path for dragged files (no folder traversal needed).
  if (!hasDirectoryEntry && directFiles.length > 0) {
    return directFiles;
  }

  const collected: File[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const entry = items[index].webkitGetAsEntry?.();
    if (entry) {
      await traverseFileTree(entry, collected);
    }
  }

  if (collected.length > 0) {
    return filterUploadFiles(collected, allowVideo);
  }

  return directFiles;
}

export function filesToFileList(files: File[]): FileList {
  const transfer = new DataTransfer();
  files.forEach((file) => transfer.items.add(file));
  return transfer.files;
}

export type UploadableFileInput = FileList | File[] | null | undefined;

export function normalizeUploadFiles(files: UploadableFileInput): File[] {
  return filterImageFiles(files);
}

function configureDirectoryInput(input: HTMLInputElement, directory: boolean): void {
  if (directory) {
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.setAttribute("mozdirectory", "");
  } else {
    input.removeAttribute("webkitdirectory");
    input.removeAttribute("directory");
    input.removeAttribute("mozdirectory");
  }
  input.multiple = true;
}

/** Open a hidden file input and resolve when the user picks or cancels. */
export function promptForInputFiles(
  input: HTMLInputElement,
  options: { directory?: boolean; allowVideo?: boolean } = {},
): Promise<File[]> {
  return new Promise((resolve) => {
    configureDirectoryInput(input, Boolean(options.directory));

    let settled = false;
    const finish = (files: File[]) => {
      if (settled) return;
      settled = true;
      input.removeEventListener("change", onChange);
      window.removeEventListener("focus", onWindowFocus);
      input.value = "";
      resolve(files);
    };

    const onChange = () => {
      finish(filterUploadFiles(input.files, Boolean(options.allowVideo)));
    };

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (!settled) finish([]);
      }, 800);
    };

    input.addEventListener("change", onChange);
    window.addEventListener("focus", onWindowFocus, { once: true });
    input.click();
  });
}

export async function selectFolderFiles(
  input: HTMLInputElement | null,
  options: { allowVideo?: boolean } = {},
): Promise<File[] | null> {
  const allowVideo = Boolean(options.allowVideo);
  if (supportsFolderPicker()) {
    try {
      const picked = await pickFolderImageFiles(allowVideo);
      if (picked && picked.length > 0) return picked;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return null;
      console.warn("[Adigator] Directory picker failed, falling back to folder input.", error);
    }
  }

  if (!input) return null;

  const files = await promptForInputFiles(input, { directory: true, allowVideo });
  return files.length > 0 ? files : null;
}

export async function selectImageFiles(
  input: HTMLInputElement | null,
  options: { allowVideo?: boolean } = {},
): Promise<File[] | null> {
  if (!input) return null;

  const files = await promptForInputFiles(input, { directory: false, allowVideo: Boolean(options.allowVideo) });
  return files.length > 0 ? files : null;
}

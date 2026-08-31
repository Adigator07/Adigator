import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env as nodeEnv } from "node:process";

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const parsed: Record<string, string> = {};
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim().replace(/^\uFEFF/, "");
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function localFileEnv(): Record<string, string> {
  return {
    ...parseEnvFile(resolve(process.cwd(), ".env")),
    ...parseEnvFile(resolve(process.cwd(), ".env.local")),
  };
}

export function readMetaEnv(name: string): string {
  const fromFile = String(localFileEnv()[name] || "").trim();
  if (fromFile) return fromFile;
  return String(nodeEnv[name] || "").trim();
}

export function requiredMetaEnv(name: string): string {
  const value = readMetaEnv(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PROJECTS_DIR = path.join(ROOT, "src", "projects");

export const TOOLS_DIR = path.join(ROOT, "tools", "projects");

export const FORMAT_VERSION = 1;
export const API_VERSION = 1;

export function projectDir(id) {
  return path.join(PROJECTS_DIR, id);
}

export function listProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => {
      try {
        return fs.statSync(path.join(PROJECTS_DIR, name, "manifest.json")).isFile();
      } catch {
        return false;
      }
    })
    .sort();
}

export function readManifest(id) {
  return JSON.parse(fs.readFileSync(path.join(projectDir(id), "manifest.json"), "utf-8"));
}

export function requireProject(id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Invalid project id: "${id}" (allowed: lowercase letters, digits, dashes)`);
  }
  const dir = projectDir(id);
  if (!fs.existsSync(dir)) {
    throw new Error(`Project "${id}" not found in ${PROJECTS_DIR}`);
  }
  return dir;
}

export function walkFiles(dir, rel = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walkFiles(full, relPath));
    else out.push([relPath, full]);
  }
  return out;
}

/** Нормализует имя записи в архиве; возвращает безопасный относительный путь или null. */
export function safeZipEntryName(name) {
  const n = name.replace(/\\/g, "/");
  if (n.startsWith("/")) return null;
  const parts = n.split("/");
  for (const part of parts) {
    if (part === ".." || part === "." || part === "") return null;
  }
  return parts.join("/");
}
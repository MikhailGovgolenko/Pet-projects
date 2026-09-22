import fs from "node:fs";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import {
  PROJECTS_DIR,
  projectDir,
  safeZipEntryName,
  FORMAT_VERSION,
  API_VERSION,
} from "./lib.mjs";

export default function run(argv) {
  const file = argv[0];
  if (!file) throw new Error("Usage: pnpm project import <file.project> (--force to overwrite)");
  const force = argv.includes("--force");

  if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`);

  let entries;
  try {
    entries = unzipSync(fs.readFileSync(file));
  } catch (e) {
    throw new Error(`Not a valid .project archive: ${e.message}`);
  }

  const names = Object.keys(entries);
  const mfName = names.find((n) => n.replace(/\\/g, "/") === "manifest.json");
  if (!mfName) throw new Error("Archive has no manifest.json — not a valid .project file");

  let manifest;
  try {
    manifest = JSON.parse(strFromU8(entries[mfName]));
  } catch {
    throw new Error("manifest.json is not valid JSON");
  }

  if (manifest.formatVersion !== FORMAT_VERSION) {
    throw new Error(`Unsupported formatVersion ${manifest.formatVersion} (expected ${FORMAT_VERSION})`);
  }
  if (manifest.apiVersion !== API_VERSION) {
    throw new Error(`Incompatible apiVersion ${manifest.apiVersion} (supported: ${API_VERSION})`);
  }

  const id = manifest.id;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id || "")) {
    throw new Error(`Invalid project id in manifest: "${id}"`);
  }

  const dest = path.resolve(projectDir(id));
  const base = dest + path.sep;

  // Защита от path traversal: каждая запись должна распаковываться внутри src/projects/<id>.
  const safeEntries = [];
  for (const raw of names) {
    if (raw.endsWith("/")) continue;
    const rel = safeZipEntryName(raw);
    if (!rel) throw new Error(`Unsafe archive entry name: "${raw}"`);
    const target = path.resolve(dest, ...rel.split("/"));
    if (target !== dest && !target.startsWith(base)) {
      throw new Error(`Archive entry escapes project directory: "${raw}"`);
    }
    safeEntries.push([rel, raw]);
  }

  if (fs.existsSync(dest)) {
    if (!force) {
      throw new Error(
        `Project "${id}" already exists at ${dest}. Pass --force to overwrite.`
      );
    }
    fs.rmSync(dest, { recursive: true, force: true });
  }

  fs.mkdirSync(dest, { recursive: true });
  for (const [rel, raw] of safeEntries) {
    const target = path.resolve(dest, ...rel.split("/"));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, entries[raw]);
  }

  console.log(
    `Imported "${id}" -> ${path.relative(process.cwd(), dest)} (${safeEntries.length} files)`
  );
}
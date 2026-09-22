import fs from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";
import { readManifest, requireProject, walkFiles, FORMAT_VERSION, API_VERSION } from "./lib.mjs";

export default function run(argv) {
  const id = argv[0];
  if (!id) throw new Error("Usage: pnpm project export <id>");

  const dir = requireProject(id);
  const manifest = readManifest(id);
  if (manifest.formatVersion !== FORMAT_VERSION) {
    throw new Error(`Unsupported formatVersion ${manifest.formatVersion} (expected ${FORMAT_VERSION})`);
  }
  if (manifest.apiVersion !== API_VERSION) {
    throw new Error(`Incompatible apiVersion ${manifest.apiVersion} (supported: ${API_VERSION})`);
  }

  const files = {};
  for (const [rel, full] of walkFiles(dir)) {
    files[rel] = fs.readFileSync(full);
  }

  const out = path.join(process.cwd(), `${id}.project`);
  const buf = zipSync(files, { level: 6 });
  fs.writeFileSync(out, buf);

  console.log(
    `Exported "${id}" -> ${path.relative(process.cwd(), out)} (${Object.keys(files).length} files, ${buf.byteLength} bytes)`
  );
}
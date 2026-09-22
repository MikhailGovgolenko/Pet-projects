import fs from "node:fs";
import path from "node:path";
import { listProjects, readManifest, projectDir, FORMAT_VERSION, API_VERSION } from "./lib.mjs";

export default function run(argv) {
  const target = argv[0];
  const ids = target ? [target] : listProjects();
  if (!ids.length) {
    console.log("No projects found.");
    return;
  }

  let failed = 0;
  for (const id of ids) {
    const errors = validateOne(id);
    if (errors.length) {
      failed++;
      console.log(`x ${id}`);
      for (const e of errors) console.log(`    - ${e}`);
    } else {
      console.log(`ok ${id}`);
    }
  }

  if (failed) {
    console.error(`\n${failed} project(s) failed validation.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${ids.length} project(s) OK.`);
  }
}

function validateOne(id) {
  const errs = [];
  const dir = projectDir(id);

  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) errs.push(`invalid folder name: "${id}"`);
  if (!fs.existsSync(path.join(dir, "manifest.json"))) {
    errs.push("manifest.json missing");
    return errs;
  }
  if (!fs.existsSync(path.join(dir, "index.tsx"))) errs.push("index.tsx missing (module entry)");

  let m;
  try {
    m = readManifest(id);
  } catch (e) {
    errs.push(`manifest.json is not valid JSON: ${e.message}`);
    return errs;
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(m.id || "")) errs.push(`invalid manifest id: "${m.id}"`);
  if (m.id !== id) errs.push(`manifest id "${m.id}" != folder "${id}"`);
  if (m.route !== `/${id}`) errs.push(`route "${m.route}" should be "/${id}"`);
  if (typeof m.title !== "string" || !m.title) errs.push("title missing");
  if (typeof m.description !== "string" || !m.description) errs.push("description missing");
  if (typeof m.icon !== "string" || !m.icon) errs.push("icon missing");
  if (m.formatVersion !== FORMAT_VERSION) errs.push(`formatVersion ${m.formatVersion} != ${FORMAT_VERSION}`);
  if (m.apiVersion !== API_VERSION) errs.push(`apiVersion ${m.apiVersion} != ${API_VERSION}`);
  if (m.ogImage) {
    if (!fs.existsSync(path.join(dir, "assets", m.ogImage))) {
      errs.push(`ogImage not found: ${m.ogImage}`);
    }
  }
  return errs;
}
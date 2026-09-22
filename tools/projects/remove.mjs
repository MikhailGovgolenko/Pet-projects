import fs from "node:fs";
import path from "node:path";
import { requireProject } from "./lib.mjs";

export default function run(argv) {
  const id = argv[0];
  if (!id) throw new Error("Usage: pnpm project remove <id>");
  const dir = requireProject(id);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`Removed "${id}" (${path.relative(process.cwd(), dir)})`);
}
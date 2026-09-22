import { listProjects, readManifest } from "./lib.mjs";

export default function run() {
  const ids = listProjects();
  if (!ids.length) {
    console.log("No projects found.");
    return;
  }
  console.log("id".padEnd(14) + "route".padEnd(17) + "title");
  console.log("-".repeat(60));
  for (const id of ids) {
    const m = readManifest(id);
    console.log(m.id.padEnd(14) + m.route.padEnd(17) + m.title);
  }
}
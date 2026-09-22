import type { ProjectModule } from "../core/types";

const modules = import.meta.glob<{ default: ProjectModule }>("./*/index.tsx", {
  eager: true,
});

export const projects: ProjectModule[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));

export function getProject(id: string): ProjectModule | undefined {
  return projects.find((p) => p.manifest.id === id);
}
export type WorldPoint = { z: number; r: number };

export type Box = { z0: number; z1: number; r1: number };

export type Camera = {
  scale: number;
  x: number;
  y: number;
  zoomAt(sx: number, sy: number, factor: number): void;
  pan(dx: number, dy: number): void;
  reset(width: number, height: number): void;
  fit(box: Box, width: number, height: number): void;
  worldToScreen(p: WorldPoint): { x: number; y: number };
  screenToWorld(sx: number, sy: number): WorldPoint;
};

// Линза на экране занимает долю меньшего измерения вьюпорта
// (соответствует тому, как старая линза выглядела при масштабе 7).
const FILL = 0.5;
// Ограничения масштаба, чтобы не улететь в экстремальный зум.
const MIN_SCALE = 0.01;
const MAX_SCALE = 1000;

export function createCamera(scale = 7): Camera {
  const initScale = scale;
  const cam: Camera = {
    scale,
    x: 0,
    y: 0,
    zoomAt(sx, sy, factor) {
      const w = cam.screenToWorld(sx, sy);
      cam.scale = cam.scale * factor;
      cam.x = sx - w.z * cam.scale;
      cam.y = sy + w.r * cam.scale;
    },
    pan(dx, dy) {
      cam.x += dx;
      cam.y += dy;
    },
    reset(width, height) {
      cam.scale = initScale;
      cam.x = width / 2;
      cam.y = height / 2;
    },
    fit(box, width, height) {
      const zSpan = Math.max(box.z1 - box.z0, 1e-6);
      const rSpan = Math.max(2 * box.r1, 1e-6);
      const target = Math.min(width, height) * FILL;
      cam.scale = Math.min(target / zSpan, target / rSpan);
      cam.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cam.scale));
      const zc = 0.5 * (box.z0 + box.z1);
      cam.x = width / 2 - zc * cam.scale;
      cam.y = height / 2;
    },
    worldToScreen(p) {
      return { x: cam.x + p.z * cam.scale, y: cam.y - p.r * cam.scale };
    },
    screenToWorld(sx, sy) {
      return { z: (sx - cam.x) / cam.scale, r: (cam.y - sy) / cam.scale };
    },
  };
  return cam;
}

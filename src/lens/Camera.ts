export type WorldPoint = { z: number; r: number };

export type Camera = {
  scale: number;
  x: number;
  y: number;
  zoomAt(sx: number, sy: number, factor: number): void;
  pan(dx: number, dy: number): void;
  reset(width: number, height: number): void;
  worldToScreen(p: WorldPoint): { x: number; y: number };
  screenToWorld(sx: number, sy: number): WorldPoint;
};

export function createCamera(scale = 7): Camera {
  const cam: Camera = {
    scale,
    x: 0,
    y: 0,
    zoomAt(sx, sy, factor) {
      const w = cam.screenToWorld(sx, sy);
      cam.scale = Math.min(10000, Math.max(2, cam.scale * factor));
      cam.x = sx - w.z * cam.scale;
      cam.y = sy + w.r * cam.scale;
    },
    pan(dx, dy) {
      cam.x += dx;
      cam.y += dy;
    },
    reset(width, height) {
      cam.scale = 7;
      cam.x = width / 4;
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

export const ControlType = {
  Boolean: "boolean",
  Number: "number",
  String: "string",
  Color: "color",
  Enum: "enum",
  File: "file",
  ResponsiveImage: "responsiveImage",
  SegmentedEnum: "segmentedEnum",
} as const;

export function addPropertyControls(_component: unknown, _controls?: unknown): void {}
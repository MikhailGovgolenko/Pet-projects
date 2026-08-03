import { memo } from "react";

export default memo(function RangeSlider({
  name,
  label,
  min, max, step, value,
  onChange,
  format,
}: {
  name?: any;
  label: any;
  min: any; max: any; step: any; value: any;
  onChange: any;
  format?: any;
}) {
  const display = format
    ? format(value)
    : parseFloat(value).toFixed(1).replace(/\.0$/, "");

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "4px 0",
        fontSize: 12,
        fontWeight: 500,
        gap: 6,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          color: "var(--text-sec)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          flex: 1,
          justifyContent: "flex-end",
          minWidth: 0,
        }}
      >
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            WebkitAppearance: "none",
            flex: 1,
            minWidth: 40,
            maxWidth: 90,
            height: 3,
            background: "var(--range-track)",
            borderRadius: 2,
            outline: "none",
            cursor: "pointer",
          }}
        />
        <input
          type="number"
          name={name}
          value={value}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: 10,
            padding: "4px 5px",
            color: "inherit",
            fontSize: 11,
            fontFamily: '"SF Mono", monospace',
            outline: "none",
            width: 52,
            textAlign: "center",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            display: "inline-block",
            width: 36,
            textAlign: "right",
            fontFamily: '"SF Mono", monospace',
            fontSize: 10.5,
            color: "var(--accent)",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {display}
        </span>
      </div>
    </label>
  );
});

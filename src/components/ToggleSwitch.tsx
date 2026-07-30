export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "5px 0",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span>{label}</span>
      <label
        style={{
          position: "relative",
          width: 34,
          height: 17,
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: checked
              ? "linear-gradient(135deg, #00d4ff, #0077b6)"
              : "rgba(255,255,255,0.15)",
            borderRadius: 17,
            transition: "0.25s",
            border: checked
              ? "1px solid transparent"
              : "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <span
            style={{
              position: "absolute",
              content: '""',
              height: 11,
              width: 11,
              left: checked ? 19 : 2,
              bottom: 2,
              background: "white",
              borderRadius: "50%",
              transition: "0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          />
        </span>
      </label>
    </div>
  );
}

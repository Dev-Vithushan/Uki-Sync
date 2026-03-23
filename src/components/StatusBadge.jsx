const STATUS_CLASS = {
  "To Do": "badge--todo",
  "In Progress": "badge--inprogress",
  Review: "badge--review",
  Done: "badge--done"
};

const PRIORITY_CLASS = {
  Low: "badge--low",
  Medium: "badge--medium",
  High: "badge--high"
};

export default function StatusBadge({ value, kind = "status" }) {
  const toneClass = kind === "priority" ? PRIORITY_CLASS[value] : STATUS_CLASS[value];

  return <span className={`badge ${toneClass || ""}`}>{value}</span>;
}

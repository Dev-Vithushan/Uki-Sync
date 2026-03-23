import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

const STATUS_OPTIONS = ["To Do", "In Progress", "Review", "Done"];

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString();
}

export default function TicketCard({ ticket, onQuickStatusChange }) {
  const ticketKey = ticket.ticketKey || `UKI-${ticket._id?.slice(-6)?.toUpperCase() || "000000"}`;

  return (
    <article className="ticket-card">
      <div className="ticket-card-head">
        <div>
          <span className="ticket-key">{ticketKey}</span>
          <Link to={`/tickets/${ticket._id}`} className="ticket-title-link">
            {ticket.title}
          </Link>
        </div>
        <StatusBadge kind="priority" value={ticket.priority} />
      </div>

      <p className="ticket-description">{ticket.description}</p>

      <div className="ticket-meta">
        <span>Assignee: {ticket.assignedTo?.name || "Unassigned"}</span>
        <span>Due: {formatDate(ticket.dueDate)}</span>
      </div>

      <div className="ticket-footer">
        <StatusBadge value={ticket.status} />

        {onQuickStatusChange ? (
          <select
            className="select select-inline"
            value={ticket.status}
            onChange={(event) => onQuickStatusChange(ticket._id, event.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </article>
  );
}

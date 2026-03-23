import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ticketsApi, usersApi } from "../services/api";

const STATUS_OPTIONS = ["To Do", "In Progress", "Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

function dateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

function mapTicketToForm(ticketData) {
  return {
    title: ticketData.title,
    description: ticketData.description,
    status: ticketData.status,
    priority: ticketData.priority,
    assignedTo: ticketData.assignedTo?._id || ticketData.assignedTo || "",
    dueDate: dateForInput(ticketData.dueDate)
  };
}

export default function TicketDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "To Do",
    priority: "Medium",
    assignedTo: "",
    dueDate: ""
  });
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  const canManageFullTicket = user?.role === "Admin" || user?.role === "Lecturer";

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError("");

      try {
        const requests = [ticketsApi.get(token, id)];

        if (canManageFullTicket) {
          requests.push(usersApi.list(token));
        }

        const responses = await Promise.all(requests);
        const ticketData = responses[0].ticket;

        if (!cancelled) {
          setTicket(ticketData);
          setForm(mapTicketToForm(ticketData));
          setIsEditing(false);
          if (canManageFullTicket) {
            setUsers(responses[1]?.users || []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load ticket");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [token, id, canManageFullTicket]);

  async function handleSaveChanges(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = canManageFullTicket
        ? {
            title: form.title,
            description: form.description,
            status: form.status,
            priority: form.priority,
            assignedTo: form.assignedTo,
            dueDate: form.dueDate || null
          }
        : {
            status: form.status
          };

      const data = await ticketsApi.update(token, id, payload);
      setTicket(data.ticket);
      setForm(mapTicketToForm(data.ticket));
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to save ticket");
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit() {
    setError("");
    setForm(mapTicketToForm(ticket));
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setError("");
    setForm(mapTicketToForm(ticket));
    setIsEditing(false);
  }

  async function handleSubmitComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    setSubmittingComment(true);
    setError("");

    try {
      const data = await ticketsApi.comment(token, id, { text: commentText });
      setTicket(data.ticket);
      setCommentText("");
    } catch (err) {
      setError(err.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return <p className="empty-state">Loading ticket...</p>;
  }

  if (!ticket) {
    return <p className="empty-state">Ticket not found.</p>;
  }

  const ticketKey = ticket.ticketKey || `UKI-${ticket._id?.slice(-6)?.toUpperCase() || "000000"}`;

  return (
    <section className="detail-layout">
      <div className="page-head">
        <h2>Ticket Detail</h2>
        <p>
          <Link to="/board">Back to board</Link>
        </p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="ticket-detail-split">
        <div className="ticket-detail-main">
          {isEditing ? (
            <form className="panel detail-form" onSubmit={handleSaveChanges}>
              <div className="detail-panel-head">
                <div className="detail-heading">
                  <StatusBadge value={form.status} />
                  <StatusBadge value={form.priority} kind="priority" />
                </div>

                <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>

              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                disabled={!canManageFullTicket}
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                disabled={!canManageFullTicket}
                required
              />

              <div className="detail-grid">
                <div>
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={form.priority}
                    onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
                    disabled={!canManageFullTicket}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignee">Assignee</label>
                  <select
                    id="assignee"
                    value={form.assignedTo}
                    onChange={(event) => setForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                    disabled={!canManageFullTicket}
                  >
                    <option value="">Choose assignee</option>
                    {(canManageFullTicket ? users : [ticket.assignedTo]).map((assignee) => (
                      <option key={assignee?._id || assignee} value={assignee?._id || assignee}>
                        {assignee?.name || "Unknown user"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                    disabled={!canManageFullTicket}
                  />
                </div>
              </div>

              <div className="detail-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="panel detail-read-panel">
              <div className="detail-panel-head">
                <div className="detail-heading">
                  <StatusBadge value={ticket.status} />
                  <StatusBadge value={ticket.priority} kind="priority" />
                </div>

                <button
                  type="button"
                  className="btn btn-ghost icon-btn"
                  onClick={handleStartEdit}
                  aria-label="Edit ticket"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M4 16.5V20h3.5L19 8.5l-3.5-3.5L4 16.5zm16.7-9.3a1 1 0 0 0 0-1.4l-2.5-2.5a1 1 0 0 0-1.4 0l-1.2 1.2 3.5 3.5 1.6-1.6z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Edit</span>
                </button>
              </div>

              <h3 className="detail-read-title">{ticket.title}</h3>
              <p className="detail-read-description">{ticket.description}</p>

              <div className="detail-read-grid">
                <div className="detail-read-item">
                  <span className="detail-read-label">Assignee</span>
                  <span>{ticket.assignedTo?.name || "Unassigned"}</span>
                </div>
                <div className="detail-read-item">
                  <span className="detail-read-label">Reporter</span>
                  <span>{ticket.createdBy?.name || "Unknown"}</span>
                </div>
                <div className="detail-read-item">
                  <span className="detail-read-label">Board</span>
                  <span>
                    {ticket.board?.code
                      ? `${ticket.board.code} - ${ticket.board.name}`
                      : ticket.board?.name || "Not assigned"}
                  </span>
                </div>
                <div className="detail-read-item">
                  <span className="detail-read-label">Due Date</span>
                  <span>{formatDate(ticket.dueDate)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="panel comments-panel">
            <h3>Comments</h3>

            <div className="comment-list">
              {ticket.comments?.length ? (
                ticket.comments.map((comment) => (
                  <article key={comment._id} className="comment-item">
                    <header>
                      <strong>{comment.user?.name || "User"}</strong>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </header>
                    <p>{comment.text}</p>
                  </article>
                ))
              ) : (
                <p className="empty-state">No comments yet.</p>
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="comment-form">
              <textarea
                rows={3}
                placeholder="Write a comment"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={submittingComment}>
                {submittingComment ? "Posting..." : "Add Comment"}
              </button>
            </form>
          </div>
        </div>

        <aside className="panel ticket-side-panel">
          <h3>Issue Information</h3>

          <div className="issue-meta-list">
            <div className="issue-meta-item">
              <span className="issue-meta-label">Ticket Key</span>
              <span className="issue-meta-value issue-key">{ticketKey}</span>
            </div>
            <div className="issue-meta-item">
              <span className="issue-meta-label">Board</span>
              <span className="issue-meta-value">
                {ticket.board?.code
                  ? `${ticket.board.code} - ${ticket.board.name}`
                  : ticket.board?.name || "Not assigned"}
              </span>
            </div>
            <div className="issue-meta-item">
              <span className="issue-meta-label">Assignee</span>
              <span className="issue-meta-value">{ticket.assignedTo?.name || "Unassigned"}</span>
            </div>
            <div className="issue-meta-item">
              <span className="issue-meta-label">Reporter</span>
              <span className="issue-meta-value">{ticket.createdBy?.name || "Unknown"}</span>
            </div>
            <div className="issue-meta-item">
              <span className="issue-meta-label">Due Date</span>
              <span className="issue-meta-value">{formatDate(ticket.dueDate)}</span>
            </div>
            <div className="issue-meta-item">
              <span className="issue-meta-label">Created</span>
              <span className="issue-meta-value">{formatDateTime(ticket.createdAt)}</span>
            </div>
            <div className="issue-meta-item">
              <span className="issue-meta-label">Updated</span>
              <span className="issue-meta-value">{formatDateTime(ticket.updatedAt)}</span>
            </div>
            <div className="issue-meta-item issue-meta-item--stack">
              <span className="issue-meta-label">Current Status</span>
              <span className="issue-meta-value">
                <StatusBadge value={ticket.status} />
              </span>
            </div>
            <div className="issue-meta-item issue-meta-item--stack">
              <span className="issue-meta-label">Priority</span>
              <span className="issue-meta-value">
                <StatusBadge value={ticket.priority} kind="priority" />
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

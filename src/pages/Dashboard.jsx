import { useEffect, useMemo, useState } from "react";
import TicketCard from "../components/TicketCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ticketsApi } from "../services/api";

const STATUS_ORDER = ["To Do", "In Progress", "Review", "Done"];

export default function Dashboard() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      setLoading(true);
      setError("");
      try {
        const data = await ticketsApi.list(token);
        if (!cancelled) {
          setTickets(data.tickets || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load tickets");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const stats = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      label: status,
      count: tickets.filter((ticket) => ticket.status === status).length
    }));
  }, [tickets]);

  const recentTickets = tickets.slice(0, 6);

  return (
    <section>
      <div className="page-head">
        <h2>Dashboard</h2>
        <p>Live overview of ticket progress across your workspace.</p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="stats-grid">
        {stats.map((item) => (
          <article key={item.label} className="stat-card">
            <p>{item.label}</p>
            <strong>{item.count}</strong>
          </article>
        ))}
      </div>

      <div className="section-block">
        <div className="section-head">
          <h3>Recent Tickets</h3>
        </div>

        {loading ? <p className="empty-state">Loading tickets...</p> : null}

        {!loading && recentTickets.length === 0 ? (
          <p className="empty-state">No tickets yet.</p>
        ) : (
          <div className="ticket-grid">
            {recentTickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

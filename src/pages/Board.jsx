import { useEffect, useMemo, useState } from "react";
import TicketCard from "../components/TicketCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { boardsApi, ticketsApi, usersApi } from "../services/api";

const STATUSES = ["To Do", "In Progress", "Review", "Done"];

const initialTicketForm = {
  title: "",
  description: "",
  assignedTo: "",
  status: "To Do",
  priority: "Medium",
  dueDate: ""
};

const initialBoardForm = {
  name: "",
  description: ""
};

export default function Board() {
  const { token, user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [boardForm, setBoardForm] = useState(initialBoardForm);
  const [ticketForm, setTicketForm] = useState(initialTicketForm);

  const [creatingBoard, setCreatingBoard] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);

  const canCreateBoard = user?.role === "Admin" || user?.role === "Lecturer";
  const canCreateTickets = user?.role === "Admin" || user?.role === "Lecturer";

  useEffect(() => {
    let cancelled = false;

    async function loadBoardData() {
      setLoading(true);
      setError("");

      try {
        const boardData = await boardsApi.list(token);
        const nextBoards = boardData.boards || [];

        const selectedExists = nextBoards.some((board) => board._id === selectedBoardId);
        const nextBoardId = selectedExists ? selectedBoardId : nextBoards[0]?._id || "";

        const requests = [
          nextBoardId ? ticketsApi.list(token, { board: nextBoardId }) : Promise.resolve({ tickets: [] })
        ];

        if (canCreateTickets) {
          requests.push(usersApi.list(token, { role: "Student" }));
        }

        const responses = await Promise.all(requests);

        if (!cancelled) {
          setBoards(nextBoards);
          setTickets(responses[0].tickets || []);

          if (nextBoardId !== selectedBoardId) {
            setSelectedBoardId(nextBoardId);
          }

          if (canCreateTickets) {
            const studentUsers = responses[1]?.users || [];
            setUsers(studentUsers);
            setTicketForm((prev) => ({
              ...prev,
              assignedTo: prev.assignedTo || studentUsers[0]?._id || ""
            }));
          } else {
            setUsers([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load board");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBoardData();

    return () => {
      cancelled = true;
    };
  }, [token, canCreateTickets, selectedBoardId]);

  async function handleQuickStatusChange(ticketId, status) {
    try {
      const data = await ticketsApi.update(token, ticketId, { status });
      setTickets((prev) => prev.map((item) => (item._id === ticketId ? data.ticket : item)));
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  async function handleCreateBoard(event) {
    event.preventDefault();

    setCreatingBoard(true);
    setError("");

    try {
      const data = await boardsApi.create(token, boardForm);
      setBoards((prev) => [data.board, ...prev]);
      setSelectedBoardId(data.board._id);
      setBoardForm(initialBoardForm);
    } catch (err) {
      setError(err.message || "Failed to create board");
    } finally {
      setCreatingBoard(false);
    }
  }

  async function handleCreateTicket(event) {
    event.preventDefault();

    if (!selectedBoardId) {
      setError("Create a board first before creating tickets");
      return;
    }

    setCreatingTicket(true);
    setError("");

    try {
      const payload = {
        ...ticketForm,
        board: selectedBoardId,
        dueDate: ticketForm.dueDate || null
      };

      const data = await ticketsApi.create(token, payload);
      setTickets((prev) => [data.ticket, ...prev]);
      setTicketForm((prev) => ({
        ...initialTicketForm,
        assignedTo: prev.assignedTo
      }));
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setCreatingTicket(false);
    }
  }

  const groupedTickets = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status] = tickets
        .filter((ticket) => ticket.status === status)
        .sort((a, b) => {
          const aSeq = a.boardSequence ?? Number.MAX_SAFE_INTEGER;
          const bSeq = b.boardSequence ?? Number.MAX_SAFE_INTEGER;
          return aSeq - bSeq;
        });
      return acc;
    }, {});
  }, [tickets]);

  const selectedBoard = boards.find((board) => board._id === selectedBoardId) || null;

  return (
    <section>
      <div className="page-head">
        <h2>Board</h2>
        <p>Create boards (Admin) and manage tickets under each board.</p>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {canCreateBoard ? (
        <form className="panel form-grid" onSubmit={handleCreateBoard}>
          <h3>Create Board</h3>

          <input
            placeholder="Board name"
            value={boardForm.name}
            onChange={(event) => setBoardForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />

          <input
            placeholder="Board description (optional)"
            value={boardForm.description}
            onChange={(event) =>
              setBoardForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />

          <button type="submit" className="btn btn-primary" disabled={creatingBoard}>
            {creatingBoard ? "Creating..." : "Create Board"}
          </button>
        </form>
      ) : null}

      <div className="panel board-select-panel">
        <div className="section-head">
          <h3>Active Board</h3>
        </div>

        <select
          value={selectedBoardId}
          onChange={(event) => setSelectedBoardId(event.target.value)}
          disabled={boards.length === 0}
        >
          {boards.length === 0 ? (
            <option value="">No boards available</option>
          ) : (
            boards.map((board) => (
              <option key={board._id} value={board._id}>
                {board.code ? `${board.code} - ${board.name}` : board.name}
              </option>
            ))
          )}
        </select>

        {selectedBoard?.code ? (
          <p className="board-description">Board ID: {selectedBoard.code}</p>
        ) : null}

        {selectedBoard?.description ? (
          <p className="board-description">{selectedBoard.description}</p>
        ) : null}
      </div>

      {canCreateTickets && selectedBoardId ? (
        <form className="panel form-grid" onSubmit={handleCreateTicket}>
          <h3>Create Ticket ({selectedBoard?.name || "Board"})</h3>

          <input
            placeholder="Title"
            value={ticketForm.title}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />

          <input
            placeholder="Description"
            value={ticketForm.description}
            onChange={(event) =>
              setTicketForm((prev) => ({ ...prev, description: event.target.value }))
            }
            required
          />

          <select
            value={ticketForm.assignedTo}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
            required
          >
            <option value="">Assign to student</option>
            {users.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>

          <select
            value={ticketForm.priority}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, priority: event.target.value }))}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>

          <input
            type="date"
            value={ticketForm.dueDate}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, dueDate: event.target.value }))}
          />

          <button type="submit" className="btn btn-primary" disabled={creatingTicket}>
            {creatingTicket ? "Creating..." : "Create Ticket"}
          </button>
        </form>
      ) : null}

      {!loading && boards.length === 0 ? (
        <p className="empty-state">
          No boards yet. {canCreateBoard ? "Create a board to start adding tickets." : "Ask Admin to create a board."}
        </p>
      ) : null}

      {loading ? <p className="empty-state">Loading board...</p> : null}

      {!loading && selectedBoardId ? (
        <div className="kanban-grid">
          {STATUSES.map((status) => (
            <section key={status} className="kanban-column">
              <header>
                <h3>{status}</h3>
                <span>{groupedTickets[status]?.length || 0}</span>
              </header>

              <div className="kanban-cards">
                {(groupedTickets[status] || []).map((ticket) => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onQuickStatusChange={handleQuickStatusChange}
                  />
                ))}

                {(groupedTickets[status] || []).length === 0 ? (
                  <p className="empty-state">No tickets here.</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

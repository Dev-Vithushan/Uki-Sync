import dbConnect from "../lib/dbConnect.js";
import { ApiError, requireAuth } from "../lib/auth.js";
import { ensureObjectId, methodNotAllowed, readBody, sendError } from "../lib/http.js";
import { ensureBoardCode } from "../lib/boardCode.js";
import Ticket from "../lib/models/Ticket.js";
import User from "../lib/models/User.js";
import Board from "../lib/models/Board.js";

const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

const TICKET_POPULATE = [
  { path: "board", select: "name description code" },
  { path: "createdBy", select: "name email role" },
  { path: "assignedTo", select: "name email role" }
];

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["GET", "POST"])) {
    return;
  }

  try {
    await dbConnect();

    if (req.method === "GET") {
      const authUser = requireAuth(req);
      const query = {};

      if (authUser.role === "Student") {
        query.assignedTo = authUser.userId;
      }

      if (req.query.status) {
        if (!STATUSES.includes(req.query.status)) {
          throw new ApiError("Invalid status filter", 400);
        }
        query.status = req.query.status;
      }

      if (req.query.priority) {
        if (!PRIORITIES.includes(req.query.priority)) {
          throw new ApiError("Invalid priority filter", 400);
        }
        query.priority = req.query.priority;
      }

      if (req.query.assignedTo && authUser.role !== "Student") {
        ensureObjectId(req.query.assignedTo, "assignedTo");
        query.assignedTo = req.query.assignedTo;
      }

      if (req.query.board) {
        ensureObjectId(req.query.board, "board");
        query.board = req.query.board;
      }

      const tickets = await Ticket.find(query)
        .populate(TICKET_POPULATE)
        .sort({ boardSequence: 1, createdAt: 1 });

      res.status(200).json({ tickets });
      return;
    }

    const authUser = requireAuth(req, ["Admin", "Lecturer"]);
    const body = readBody(req);

    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    const board = body.board;
    const assignedTo = body.assignedTo;

    if (!title || !description || !assignedTo || !board) {
      throw new ApiError("title, description, board, and assignedTo are required", 400);
    }

    ensureObjectId(board, "board");
    ensureObjectId(assignedTo, "assignedTo");

    let boardDoc = await Board.findByIdAndUpdate(
      board,
      { $inc: { ticketCounter: 1 } },
      { new: true }
    );

    if (!boardDoc) {
      throw new ApiError("Board not found", 404);
    }

    boardDoc = await ensureBoardCode(Board, boardDoc);
    const boardSequence = boardDoc.ticketCounter;
    const ticketKey = `${boardDoc.code}-${String(boardSequence).padStart(2, "0")}`;

    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      throw new ApiError("Assigned user not found", 404);
    }

    const status = body.status || "To Do";
    const priority = body.priority || "Medium";

    if (!STATUSES.includes(status)) {
      throw new ApiError("Invalid status", 400);
    }

    if (!PRIORITIES.includes(priority)) {
      throw new ApiError("Invalid priority", 400);
    }

    let dueDate = null;
    if (body.dueDate) {
      const parsed = new Date(body.dueDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new ApiError("Invalid dueDate", 400);
      }
      dueDate = parsed;
    }

    const ticket = await Ticket.create({
      title,
      description,
      status,
      priority,
      createdBy: authUser.userId,
      board,
      boardSequence,
      ticketKey,
      assignedTo,
      dueDate
    });

    const populatedTicket = await Ticket.findById(ticket._id).populate(TICKET_POPULATE);

    res.status(201).json({ ticket: populatedTicket });
  } catch (error) {
    sendError(res, error);
  }
}

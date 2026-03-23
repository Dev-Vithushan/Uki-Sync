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
  { path: "assignedTo", select: "name email role" },
  { path: "comments.user", select: "name email role" }
];

function isStudentOwner(authUser, ticket) {
  const assignedId = ticket.assignedTo?._id?.toString() || ticket.assignedTo?.toString();
  return authUser.role === "Student" && assignedId === authUser.userId;
}

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["GET", "PUT", "DELETE"])) {
    return;
  }

  try {
    await dbConnect();
    const authUser = requireAuth(req);

    const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    ensureObjectId(idParam, "ticket id");

    const ticket = await Ticket.findById(idParam).populate(TICKET_POPULATE);

    if (!ticket) {
      throw new ApiError("Ticket not found", 404);
    }

    const studentOwnsTicket = isStudentOwner(authUser, ticket);

    if (authUser.role === "Student" && !studentOwnsTicket) {
      throw new ApiError("Forbidden", 403);
    }

    if (req.method === "GET") {
      res.status(200).json({ ticket });
      return;
    }

    if (req.method === "PUT") {
      const body = readBody(req);

      if (authUser.role === "Student") {
        const bodyKeys = Object.keys(body);

        if (bodyKeys.length !== 1 || !bodyKeys.includes("status")) {
          throw new ApiError("Students can only update ticket status", 403);
        }

        if (!STATUSES.includes(body.status)) {
          throw new ApiError("Invalid status", 400);
        }

        ticket.status = body.status;
        await ticket.save();
      } else {
        if (body.title !== undefined) {
          const nextTitle = String(body.title).trim();
          if (!nextTitle) {
            throw new ApiError("title cannot be empty", 400);
          }
          ticket.title = nextTitle;
        }

        if (body.description !== undefined) {
          const nextDescription = String(body.description).trim();
          if (!nextDescription) {
            throw new ApiError("description cannot be empty", 400);
          }
          ticket.description = nextDescription;
        }

        if (body.status !== undefined) {
          if (!STATUSES.includes(body.status)) {
            throw new ApiError("Invalid status", 400);
          }
          ticket.status = body.status;
        }

        if (body.priority !== undefined) {
          if (!PRIORITIES.includes(body.priority)) {
            throw new ApiError("Invalid priority", 400);
          }
          ticket.priority = body.priority;
        }

        if (body.assignedTo !== undefined) {
          ensureObjectId(body.assignedTo, "assignedTo");
          const assignee = await User.findById(body.assignedTo);
          if (!assignee) {
            throw new ApiError("Assigned user not found", 404);
          }
          ticket.assignedTo = body.assignedTo;
        }

        if (body.board !== undefined) {
          ensureObjectId(body.board, "board");
          let boardDoc = await Board.findByIdAndUpdate(
            body.board,
            { $inc: { ticketCounter: 1 } },
            { new: true }
          );
          if (!boardDoc) {
            throw new ApiError("Board not found", 404);
          }
          boardDoc = await ensureBoardCode(Board, boardDoc);
          ticket.board = body.board;
          ticket.boardSequence = boardDoc.ticketCounter;
          ticket.ticketKey = `${boardDoc.code}-${String(boardDoc.ticketCounter).padStart(2, "0")}`;
        }

        if (body.dueDate !== undefined) {
          if (body.dueDate === null || body.dueDate === "") {
            ticket.dueDate = null;
          } else {
            const parsedDate = new Date(body.dueDate);
            if (Number.isNaN(parsedDate.getTime())) {
              throw new ApiError("Invalid dueDate", 400);
            }
            ticket.dueDate = parsedDate;
          }
        }

        await ticket.save();
      }

      const updated = await Ticket.findById(ticket._id).populate(TICKET_POPULATE);
      res.status(200).json({ ticket: updated });
      return;
    }

    if (authUser.role === "Student") {
      throw new ApiError("Students cannot delete tickets", 403);
    }

    await ticket.deleteOne();
    res.status(200).json({ message: "Ticket deleted" });
  } catch (error) {
    sendError(res, error);
  }
}

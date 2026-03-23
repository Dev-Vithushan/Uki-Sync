import dbConnect from "../../lib/dbConnect.js";
import { ApiError, requireAuth } from "../../lib/auth.js";
import { ensureObjectId, methodNotAllowed, readBody, sendError } from "../../lib/http.js";
import Ticket from "../../lib/models/Ticket.js";

const TICKET_POPULATE = [
  { path: "board", select: "name description code" },
  { path: "createdBy", select: "name email role" },
  { path: "assignedTo", select: "name email role" },
  { path: "comments.user", select: "name email role" }
];

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["POST"])) {
    return;
  }

  try {
    await dbConnect();

    const authUser = requireAuth(req);
    const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    ensureObjectId(idParam, "ticket id");

    const ticket = await Ticket.findById(idParam);

    if (!ticket) {
      throw new ApiError("Ticket not found", 404);
    }

    const isAssignedStudent =
      authUser.role === "Student" && ticket.assignedTo.toString() === authUser.userId;

    if (authUser.role === "Student" && !isAssignedStudent) {
      throw new ApiError("Students can only comment on their own tickets", 403);
    }

    const body = readBody(req);
    const text = (body.text || "").trim();

    if (!text) {
      throw new ApiError("Comment text is required", 400);
    }

    ticket.comments.push({ text, user: authUser.userId });
    await ticket.save();

    const updated = await Ticket.findById(ticket._id).populate(TICKET_POPULATE);

    res.status(201).json({ ticket: updated });
  } catch (error) {
    sendError(res, error);
  }
}

import dbConnect from "../lib/dbConnect.js";
import { ApiError, requireAuth } from "../lib/auth.js";
import { methodNotAllowed, readBody, sendError } from "../lib/http.js";
import { ensureBoardCode, generateUniqueBoardCode } from "../lib/boardCode.js";
import Board from "../lib/models/Board.js";

export default async function handler(req, res) {
  if (methodNotAllowed(req, res, ["GET", "POST"])) {
    return;
  }

  try {
    await dbConnect();

    if (req.method === "GET") {
      requireAuth(req);

      const boards = await Board.find()
        .populate({ path: "createdBy", select: "name email role" })
        .sort({ createdAt: -1 });

      for (const board of boards) {
        if (!board.code) {
          // Backfill code for any old board documents created before code support.
          // eslint-disable-next-line no-await-in-loop
          await ensureBoardCode(Board, board);
        }
      }

      res.status(200).json({ boards });
      return;
    }

    const authUser = requireAuth(req, ["Admin", "Lecturer"]);
    const body = readBody(req);

    const name = (body.name || "").trim();
    const description = (body.description || "").trim();

    if (!name) {
      throw new ApiError("Board name is required", 400);
    }

    const existing = await Board.findOne({ name });
    if (existing) {
      throw new ApiError("Board name already exists", 409);
    }

    const code = await generateUniqueBoardCode(Board, name);

    const board = await Board.create({
      name,
      code,
      description,
      createdBy: authUser.userId
    });

    const populated = await Board.findById(board._id).populate({
      path: "createdBy",
      select: "name email role"
    });

    res.status(201).json({ board: populated });
  } catch (error) {
    sendError(res, error);
  }
}

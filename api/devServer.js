import express from "express";
import registerHandler from "./auth/register.js";
import loginHandler from "./auth/login.js";
import meHandler from "./auth/me.js";
import usersIndexHandler from "./users/index.js";
import usersByIdHandler from "./users/[id].js";
import boardsIndexHandler from "./boards/index.js";
import ticketsIndexHandler from "./tickets/index.js";
import ticketsByIdHandler from "./tickets/[id].js";
import ticketCommentsHandler from "./tickets/[id]/comments.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function withParams(handler, options = {}) {
  return async (req, res) => {
    if (options.idParam) {
      Object.defineProperty(req, "query", {
        value: { ...(req.query || {}), id: req.params[options.idParam] },
        writable: true,
        configurable: true,
        enumerable: true
      });
    }

    try {
      await handler(req, res);
    } catch (error) {
      // Fallback for unhandled errors inside function handlers
      // eslint-disable-next-line no-console
      console.error(error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  };
}

app.post("/api/auth/register", withParams(registerHandler));
app.post("/api/auth/login", withParams(loginHandler));
app.get("/api/auth/me", withParams(meHandler));

app.get("/api/users", withParams(usersIndexHandler));
app.get("/api/users/:id", withParams(usersByIdHandler, { idParam: "id" }));
app.put("/api/users/:id", withParams(usersByIdHandler, { idParam: "id" }));
app.delete("/api/users/:id", withParams(usersByIdHandler, { idParam: "id" }));

app.get("/api/boards", withParams(boardsIndexHandler));
app.post("/api/boards", withParams(boardsIndexHandler));

app.get("/api/tickets", withParams(ticketsIndexHandler));
app.post("/api/tickets", withParams(ticketsIndexHandler));
app.get("/api/tickets/:id", withParams(ticketsByIdHandler, { idParam: "id" }));
app.put("/api/tickets/:id", withParams(ticketsByIdHandler, { idParam: "id" }));
app.delete("/api/tickets/:id", withParams(ticketsByIdHandler, { idParam: "id" }));
app.post("/api/tickets/:id/comments", withParams(ticketCommentsHandler, { idParam: "id" }));

app.all(/^\/api\/.*/, (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server running on http://localhost:${port}`);
});

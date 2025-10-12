import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import matchRoutes from "./routes/match.routes.js";
import teamRoutes from "./routes/team.routes.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);

// DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on("join-match", (matchId) => socket.join(`match:${matchId}`));
  socket.on("disconnect", () => console.log("socket disconnected", socket.id));
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`API listening on :${port}`));

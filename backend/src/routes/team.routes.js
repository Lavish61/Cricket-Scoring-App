import { Router } from "express";
import Team from "../models/team.model.js";
import { createTeam, listTeams } from "../services/match.service.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const team = await createTeam(req.body);
    res.status(201).json(team);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listTeams());
  } catch (e) {
    next(e);
  }
});

router.post("/:teamId/players", async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    team.players.push(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (e) {
    next(e);
  }
});

export default router;

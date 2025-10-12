import Match from "../models/match.model.js";
import Team from "../models/team.model.js";
import { io } from "../server.js";
import { calcOversFromDeliveries } from "../utils/scoring.js";

export async function createTeam({ name, players }) {
  const team = await Team.create({ name, players });
  return team;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createMatch(payload) {
  const { title, type = "T20", oversLimit = 20, venue, teams } = payload;
  if (!teams || teams.length !== 2) throw new Error("2 teams required");
  const match = await Match.create({
    title,
    type,
    oversLimit,
    venue,
    teams: teams.map((t) => ({
      teamId: t.teamId,
      playingXI: t.playingXI || [],
    })),
    status: "scheduled",
  });
  return match;
}

export async function startInnings(
  matchId,
  { battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId }
) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error("match not found");
  match.status = "live";
  match.innings.push({
    battingTeamId,
    bowlingTeamId,
    strikerId,
    nonStrikerId,
    currentBowlerId: bowlerId,
    oversLimit: match.oversLimit,
    deliveries: [],
    totals: {},
  });
  await match.save();
  io.to(`match:${matchId}`).emit("match:update", { matchId });
  return match;
}

export async function recordBall(matchId, data) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error("match not found");
  const inn = match.innings.at(-1);
  if (!inn || inn.completed) throw new Error("no active innings");

  // Determine legal ball count and over/ball numbers
  const legalDeliveries = inn.deliveries.filter(
    (d) => (d.extras?.wd ?? 0) === 0 && (d.extras?.nb ?? 0) === 0
  );
  const ballsInOver = legalDeliveries.length % 6;
  const overNumber = Math.floor(legalDeliveries.length / 6);
  const ballNumber = ballsInOver + 1;

  // Build delivery
  const del = {
    over: overNumber,
    ball: ballNumber,
    batsmanId: inn.strikerId,
    nonStrikerId: inn.nonStrikerId,
    bowlerId: inn.currentBowlerId,
    runs: data.runs || 0,
    extras: { nb: 0, wd: 0, b: 0, lb: 0, p: 0 },
    wicket: { kind: null, playerOutId: null, fielder: null },
    summary: "",
  };

  // Extras handling
  if (data.type === "wd") del.extras.wd = data.runs ?? 1; // wd always adds at least 1
  if (data.type === "nb") {
    del.extras.nb = 1;
    del.runs = data.runs || 0;
  }
  if (data.type === "b") del.extras.b = data.runs || 0;
  if (data.type === "lb") del.extras.lb = data.runs || 0;
  if (data.type === "p") del.extras.p = data.runs || 0;

  // Wicket
  if (data.wicket?.kind) {
    del.wicket.kind = data.wicket.kind;
    del.wicket.playerOutId = data.wicket.playerOutId || inn.strikerId;
    del.wicket.fielder = data.wicket.fielder || null;
  }

  inn.deliveries.push(del);

  // Update totals
  const t = inn.totals;
  const totalExtras =
    (del.extras.nb || 0) +
    (del.extras.wd || 0) +
    (del.extras.b || 0) +
    (del.extras.lb || 0) +
    (del.extras.p || 0);
  t.runs = (t.runs || 0) + (del.runs || 0) + totalExtras;
  if (del.wicket.kind) t.wickets = (t.wickets || 0) + 1;

  // Update overs
  inn.totals.overs = calcOversFromDeliveries(inn.deliveries);

  // Strike rotation
  const runsOffBat = del.runs || 0;
  const runningRuns = runsOffBat + (del.extras.b || 0) + (del.extras.lb || 0);
  const isLegal = del.extras.wd === 0 && del.extras.nb === 0;
  if (isLegal && runningRuns % 2 === 1) {
    // swap strike
    const tmp = inn.strikerId;
    inn.strikerId = inn.nonStrikerId;
    inn.nonStrikerId = tmp;
  }

  // Over end: change ends
  const newLegalCount = inn.deliveries.filter(
    (d) => (d.extras?.wd ?? 0) === 0 && (d.extras?.nb ?? 0) === 0
  ).length;
  if (newLegalCount % 6 === 0) {
    // swap strike at end of over
    const tmp = inn.strikerId;
    inn.strikerId = inn.nonStrikerId;
    inn.nonStrikerId = tmp;
    if (data.nextBowlerId) inn.currentBowlerId = data.nextBowlerId;
  }

  // Complete innings if overs done
  if (Math.floor(newLegalCount / 6) >= inn.oversLimit) {
    inn.completed = true;
    match.status = "completed";
  }

  await match.save();
  io.to(`match:${matchId}`).emit("match:update", { matchId });
  return match;
}

export async function undoLastBall(matchId) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error("match not found");
  const inn = match.innings.at(-1);
  if (!inn || inn.deliveries.length === 0) throw new Error("nothing to undo");
  const last = inn.deliveries.pop();

  // Recompute totals safely
  const t = {
    runs: 0,
    wickets: 0,
    overs: 0,
    extras: { nb: 0, wd: 0, b: 0, lb: 0, p: 0 },
  };
  for (const d of inn.deliveries) {
    const extraSum =
      (d.extras.nb || 0) +
      (d.extras.wd || 0) +
      (d.extras.b || 0) +
      (d.extras.lb || 0) +
      (d.extras.p || 0);
    t.runs += (d.runs || 0) + extraSum;
    if (d.wicket?.kind) t.wickets += 1;
    t.extras.nb += d.extras.nb || 0;
    t.extras.wd += d.extras.wd || 0;
    t.extras.b += d.extras.b || 0;
    t.extras.lb += d.extras.lb || 0;
    t.extras.p += d.extras.p || 0;
  }
  t.overs = (() => {
    const legal = inn.deliveries.filter(
      (d) => (d.extras?.wd ?? 0) === 0 && (d.extras?.nb ?? 0) === 0
    ).length;
    return Math.floor(legal / 6) + (legal % 6) / 10;
  })();
  inn.totals = t;

  await match.save();
  io.to(`match:${matchId}`).emit("match:update", { matchId });
  return match;
}

export async function getMatch(matchId) {
  const match = await Match.findById(matchId).lean();
  return match;
}

export async function listMatches() {
  return Match.find().sort({ createdAt: -1 }).lean();
}

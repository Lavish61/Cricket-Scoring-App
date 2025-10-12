import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    ball: Number, // 1..6; legal balls only count here
    over: Number, // 0-based over index
    batsmanId: mongoose.Schema.Types.ObjectId,
    nonStrikerId: mongoose.Schema.Types.ObjectId,
    bowlerId: mongoose.Schema.Types.ObjectId,
    runs: { type: Number, default: 0 }, // off the bat
    extras: {
      nb: { type: Number, default: 0 },
      wd: { type: Number, default: 0 },
      b: { type: Number, default: 0 },
      lb: { type: Number, default: 0 },
      p: { type: Number, default: 0 }, // penalty
    },
    wicket: {
      kind: {
        type: String,
        enum: [
          null,
          "bowled",
          "lbw",
          "caught",
          "runout",
          "stumped",
          "hitwicket",
          "obstructing",
          "retired",
        ],
        default: null,
      },
      playerOutId: mongoose.Schema.Types.ObjectId,
      fielder: String,
    },
    summary: String,
    ts: { type: Date, default: Date.now },
  },
  { _id: true }
);

const inningsSchema = new mongoose.Schema(
  {
    battingTeamId: mongoose.Schema.Types.ObjectId,
    bowlingTeamId: mongoose.Schema.Types.ObjectId,
    strikerId: mongoose.Schema.Types.ObjectId,
    nonStrikerId: mongoose.Schema.Types.ObjectId,
    currentBowlerId: mongoose.Schema.Types.ObjectId,
    oversLimit: Number,
    deliveries: [deliverySchema],
    totals: {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 }, // e.g., 4.3 overs -> 4 + 3/6
      extras: {
        nb: { type: Number, default: 0 },
        wd: { type: Number, default: 0 },
        b: { type: Number, default: 0 },
        lb: { type: Number, default: 0 },
        p: { type: Number, default: 0 },
      },
    },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const matchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["T20", "ODI", "Custom"], default: "T20" },
    oversLimit: { type: Number, default: 20 },
    venue: String,
    toss: {
      wonByTeamId: mongoose.Schema.Types.ObjectId,
      decision: { type: String, enum: ["bat", "bowl", null], default: null },
    },
    teams: [
      {
        teamId: mongoose.Schema.Types.ObjectId,
        playingXI: [mongoose.Schema.Types.ObjectId],
      },
    ],
    innings: [inningsSchema],
    status: {
      type: String,
      enum: ["scheduled", "live", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);

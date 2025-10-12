import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, enum: ["bat", "bowl", "all", "wk"], default: "bat" },
  },
  { _id: true }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    players: [playerSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);

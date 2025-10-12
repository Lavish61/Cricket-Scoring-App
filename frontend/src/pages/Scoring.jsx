import React, { useEffect, useMemo, useState } from "react";
import { API } from "../api";

const BALL_TYPES = [
  { key: "runs", label: "0", value: 0 },
  { key: "runs", label: "1", value: 1 },
  { key: "runs", label: "2", value: 2 },
  { key: "runs", label: "3", value: 3 },
  { key: "runs", label: "4", value: 4 },
  { key: "runs", label: "6", value: 6 },
  { key: "wd", label: "Wd" },
  { key: "nb", label: "Nb" },
  { key: "b", label: "Bye" },
  { key: "lb", label: "LB" },
  { key: "wicket", label: "wicket", value: null, wicket: { kind: "bowled" } },
  { key: "wicket", label: "caught out", value: null, wicket: { kind: "caught" } },
];

function Summary({ match }) {
  const inn = match?.innings?.[match.innings.length - 1];
  if (!inn) return <div className="card">No innings yet.</div>;
  const t = inn.totals || {};
  return (
    <div className="card">
      <h2>Score</h2>
      <div className="row">
        <div style={{ fontSize: 28, fontWeight: 700 }}>
          {t.runs || 0}/{t.wickets || 0}
        </div>
        <div className="badge">
          Ov {t.overs?.toFixed ? t.overs.toFixed(1) : t.overs}
        </div>
        <div className="badge">
          Extras{" "}
          {Object.values(t.extras || {}).reduce((a, b) => a + (b || 0), 0)}
        </div>
      </div>
    </div>
  );
}

export default function Scoring({ matchId, socket }) {
  const [match, setMatch] = useState(null);
  const load = () =>
    API.get(`/matches/${matchId}`).then((r) => setMatch(r.data));
  useEffect(() => {
    load();
  }, [matchId]);
  useEffect(() => {
    socket.emit("join-match", matchId);
    const handler = () => load();
    socket.on("match:update", handler);
    return () => socket.off("match:update", handler);
  }, [matchId]);

  const inn = match?.innings?.[match?.innings?.length - 1];

  const [form, setForm] = useState({
    runs: 0,
    type: null,
    wicket: null,
    nextBowlerId: null,
  });
  function send(evt) {
    const payload = {};
    if (evt.key === "runs") {
      payload.runs = evt.value;
    } else if (evt.key === "wicket") {
      payload.wicket = evt.wicket; // pass wicket info
    } else {
      payload.type = evt.key;
      payload.runs = evt.value;
    }
    API.post(`/matches/${matchId}/ball`, payload).then(load);
  }

  function startInnings() {
    const a = match.teams[0],
      b = match.teams[1];
    const striker = a.playingXI[0],
      nonStriker = a.playingXI[1],
      bowler = b.playingXI[0];
    API.post(`/matches/${matchId}/innings/start`, {
      battingTeamId: a.teamId,
      bowlingTeamId: b.teamId,
      strikerId: striker,
      nonStrikerId: nonStriker,
      bowlerId: bowler,
    }).then(load);
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Controls</h2>
        {!inn && (
          <button className="primary" onClick={startInnings}>
            Start Innings
          </button>
        )}
        {inn && (
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {BALL_TYPES.map((b) => (
              <button key={b.label} onClick={() => send(b)}>
                {b.label}
              </button>
            ))}
            <button
              className="danger"
              onClick={() => API.post(`/matches/${matchId}/undo`).then(load)}
            >
              Undo
            </button>
          </div>
        )}
        <div className="hr" />
        <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(inn?.deliveries?.slice(-12), null, 2)}
        </pre>
      </div>
      <Summary match={match} />
    </div>
  );
}

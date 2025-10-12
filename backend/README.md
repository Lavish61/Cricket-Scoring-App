# Cricket Scoring Backend (Node.js + Express + MongoDB)

## Quick start
```bash
cd backend
cp .env.example .env
# edit if needed
npm i
npm run dev
```
### REST API (examples)
- `POST /api/teams` `{ "name":"Team A", "players":[{"name":"P1"},{"name":"P2"}] }`
- `GET /api/teams`
- `POST /api/matches` 
```json
{
  "title":"Practice Match",
  "type":"T20",
  "oversLimit":20,
  "teams":[
    {"teamId":"<teamAId>", "playingXI":["<p1>", "<p2>"]},
    {"teamId":"<teamBId>", "playingXI":["<p1>", "<p2>"]}
  ]
}
```
- `POST /api/matches/:id/innings/start` 
```json
{
  "battingTeamId":"<teamAId>",
  "bowlingTeamId":"<teamBId>",
  "strikerId":"<playerIdA1>",
  "nonStrikerId":"<playerIdA2>",
  "bowlerId":"<playerIdB1>"
}
```
- `POST /api/matches/:id/ball`
```json
{ "runs": 1 }                        // legal single
{ "type":"wd", "runs":1 }             // wide (adds 1; +runs if specified)
{ "type":"nb", "runs":2 }             // no-ball + 2 off bat
{ "type":"b", "runs":1 }              // bye
{ "type":"lb", "runs":2 }             // leg-bye
{ "runs":0, "wicket":{"kind":"bowled"}} // wicket
{ "runs":0, "nextBowlerId":"<id>" }   // set next bowler at over end
```
- `POST /api/matches/:id/undo`

### Realtime
Socket.io rooms: client emits `join-match` with matchId to receive `match:update` pushes.

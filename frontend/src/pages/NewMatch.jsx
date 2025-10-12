import React, { useEffect, useState } from 'react'
import { API } from '../api'

export default function NewMatch({ onCreated }){
  const [teams, setTeams] = useState([])
  const [title, setTitle] = useState('Practice Match')
  const [overs, setOvers] = useState(20)
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')
  const [aXI, setAXI] = useState([])
  const [bXI, setBXI] = useState([])
  const [teamName, setTeamName] = useState('')

  useEffect(()=>{ API.get('/teams').then(r=>setTeams(r.data)) },[])

  function createTeam(){
    if (!teamName.trim()) return;
    API.post('/teams', { name: teamName, players: Array.from({length:11}).map((_,i)=>({name:`Player ${i+1}`})) })
      .then(r=>{ setTeams(t=>[...t, r.data]); setTeamName('') })
  }

  function createMatch(){
    const payload = {
      title, oversLimit: Number(overs), teams: [
        { teamId: teamA, playingXI: aXI },
        { teamId: teamB, playingXI: bXI },
      ]
    }
    API.post('/matches', payload).then(r=> onCreated(r.data))
  }

  const players = (id)=> teams.find(t=>t._id===id)?.players || []

  return (
    <div className="grid">
      <div className="card">
        <h2>Setup</h2>
        <div className="row"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Match title"/></div>
        <div className="row"><input type="number" value={overs} onChange={e=>setOvers(e.target.value)} placeholder="Overs"/></div>
        <div className="row">
          <select value={teamA} onChange={e=>setTeamA(e.target.value)}>
            <option value="">Team A</option>
            {teams.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <select value={teamB} onChange={e=>setTeamB(e.target.value)}>
            <option value="">Team B</option>
            {teams.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div className="row">
          <button className="primary" onClick={createMatch} disabled={!teamA||!teamB}>Create Match</button>
        </div>
      </div>
      <div className="card">
        <h2>Teams</h2>
        <div className="row">
          <input placeholder="New team name" value={teamName} onChange={e=>setTeamName(e.target.value)} />
          <button onClick={createTeam}>Add</button>
        </div>
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div>
            <h3>Team A XI</h3>
            <small className="small">Select from players</small>
            <div className="list">
              {players(teamA).map(p=> (
                <label key={p._id} className="row">
                  <input type="checkbox" checked={aXI.includes(p._id)} onChange={(e)=>{
                    setAXI(x=> e.target.checked? [...x,p._id] : x.filter(id=>id!==p._id))
                  }} />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3>Team B XI</h3>
            <small className="small">Select from players</small>
            <div className="list">
              {players(teamB).map(p=> (
                <label key={p._id} className="row">
                  <input type="checkbox" checked={bXI.includes(p._id)} onChange={(e)=>{
                    setBXI(x=> e.target.checked? [...x,p._id] : x.filter(id=>id!==p._id))
                  }} />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

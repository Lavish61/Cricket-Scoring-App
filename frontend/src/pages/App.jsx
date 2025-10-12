import React, { useEffect, useMemo, useState } from 'react'
import io from 'socket.io-client'
import { API } from '../api'
import MatchList from './MatchList.jsx'
import NewMatch from './NewMatch.jsx'
import Scoring from './Scoring.jsx'

const socket = io(import.meta.env.VITE_SOCKET || 'http://localhost:4000')

export default function App(){
  const [view, setView] = useState('matches')
  const [selected, setSelected] = useState(null)

  return (
    <div className="container">
      <h1>🏏 Cricket Scoring</h1>
      <div className="row" style={{marginBottom:12}}>
        <button className="primary" onClick={()=>setView('matches')}>Matches</button>
        <button onClick={()=>setView('new')}>New Match</button>
        {selected && <button onClick={()=>setView('score')}>Open Scoring</button>}
      </div>
      {view==='matches' && <MatchList onSelect={(m)=>{ setSelected(m); setView('score') }} />}
      {view==='new' && <NewMatch onCreated={(m)=>{ setSelected(m); setView('score') }} />}
      {view==='score' && selected && <Scoring matchId={selected._id} socket={socket} />}
    </div>
  )
}

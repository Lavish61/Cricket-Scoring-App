import React, { useEffect, useState } from 'react'
import { API } from '../api'

export default function MatchList({ onSelect }){
  const [matches, setMatches] = useState([])
  useEffect(()=>{ API.get('/matches').then(r=>setMatches(r.data)) },[])

  return (
    <div className="card">
      <div className="row">
        <h2>Recent Matches</h2>
        <span className="badge">{matches.length}</span>
      </div>
      <div className="list">
        {matches.map(m=> (
          <div key={m._id} className="row card" style={{Padding:'12px 16px', cursor:'pointer'}} onClick={()=>onSelect(m)}>
            <div style={{fontWeight:600}}>{m.title}</div>
            <div className="small">overs: {m.oversLimit} • status: {m.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

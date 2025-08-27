import React, { useMemo, useState, useEffect } from 'react'

// v1.3 — mapa por URL (?map=BASE64_JSON), PIN docente (?pin=...), generador de enlace en la app.

const LEFT_PHASES = [
  { id: 'req-sis', label: 'Requerimientos del sistema' },
  { id: 'req-sw', label: 'Requisitos de software' },
  { id: 'dis-arq', label: 'Diseño de arquitectura' },
  { id: 'dis-mod', label: 'Diseño de módulos' },
  { id: 'cod', label: 'Codificación' },
]
const RIGHT_TESTS = [
  { id: 't-unit', label: 'Pruebas unitarias' },
  { id: 't-int', label: 'Pruebas de integración' },
  { id: 't-sis', label: 'Pruebas de sistema' },
  { id: 't-acep', label: 'Pruebas de aceptación' },
]

const SCENARIOS = [
  { id:'parking', name:'Parqueaderos (Centro Comercial)', description:'App móvil para cupos de parqueo en tiempo real, con integración a mapas y pagos.' },
  { id:'auto', name:'Automotriz (ISO 26262)', description:'Software embebido para ABS con requisitos de seguridad y trazabilidad.' },
  { id:'med', name:'Médico (Signos vitales)', description:'Monitoreo continuo con alarmas y validación regulatoria.' },
  { id:'aero', name:'Aeroespacial (Dron)', description:'Rutas, evasión de obstáculos, redundancia y verificación sistemática.' },
]

function parseMapParam(){ try{ const b64=new URLSearchParams(location.search).get('map'); if(!b64) return null; return JSON.parse(atob(b64)) }catch(e){ console.warn('No se pudo leer ?map', e); return null } }
function parsePinParam(){ try{ const pin=new URLSearchParams(location.search).get('pin'); return pin && pin.trim() ? pin.trim() : null }catch(e){ console.warn('No se pudo leer ?pin', e); return null } }

function shuffle(a){ const arr=[...a]; for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }
function useTimer(running){ const [s,setS]=useState(0); useEffect(()=>{ if(!running) return; const id=setInterval(()=>setS(v=>v+1),1000); return()=>clearInterval(id) },[running]); return [s,setS] }

function Card({id,label,onDragStart,onDragEnd}){
  return <div className="card" draggable onDragStart={()=>onDragStart(id)} onDragEnd={onDragEnd}>{label}</div>
}

function Slot({id, cards, placement, setPlacement, validated, teacherUnlocked, hasMap}){
  const cardId = placement[id]
  const card = cards.find(c=>c.id===cardId)
  const isRight = RIGHT_TESTS.some(t=>t.id===id)
  const canReveal = validated && teacherUnlocked && hasMap
  const isMatch = canReveal && cardId===id

  const onDrop = (e)=>{
    e.preventDefault()
    const dragId = e.dataTransfer.getData('text/plain')
    if(!dragId) return
    if(placement[id]) return
    const next = {...placement}
    Object.keys(next).forEach(k=>{ if(next[k]===dragId) next[k]=null })
    next[id]=dragId
    setPlacement(next)
  }

  return (
    <div className={'slot'+(isMatch?' ok':'')} onDragOver={(e)=>e.preventDefault()} onDrop={onDrop} style={{background:isRight?'#ffffffb3':'#fff'}}>
      {card ? <Card id={card.id} label={card.label} onDragStart={()=>{}} onDragEnd={()=>{}}/> : <span className="small" style={{color:'#94a3b8'}}>Arrastra aquí</span>}
    </div>
  )
}

export default function App(){
  const [cards,setCards]=useState(()=>shuffle([...LEFT_PHASES, ...RIGHT_TESTS]))
  const left=LEFT_PHASES.map(x=>x.id), right=RIGHT_TESTS.map(x=>x.id)
  const [placement,setPlacement]=useState(()=>{ const p={}; [...left,...right].forEach(s=>p[s]=null); return p })
  const [team,setTeam]=useState('Equipo 1')
  const [scenario,setScenario]=useState('parking')
  const [running,setRunning]=useState(true)
  const [seconds,setSeconds]=useTimer(running)
  const [validated,setValidated]=useState(false)
  const [score,setScore]=useState(0)

  // Mapa + PIN
  const CORRECT_MAP = useMemo(()=>parseMapParam(),[])
  const TEACHER_PIN = useMemo(()=>parsePinParam(),[])
  const [teacherUnlocked,setTeacherUnlocked]=useState(()=>{ try{return sessionStorage.getItem('vmodel_teacher_unlocked')==='1'}catch{return false} })
  useEffect(()=>{ try{sessionStorage.setItem('vmodel_teacher_unlocked', teacherUnlocked?'1':'0')}catch{} },[teacherUnlocked])

  const scenarioObj = SCENARIOS.find(s=>s.id===scenario)

  function onDragStart(id){ return (e)=>{ e.dataTransfer.setData('text/plain', id) } }
  function onDragEnd(){}

  function onDropBank(e){
    e.preventDefault()
    const dragId = e.dataTransfer.getData('text/plain')
    if(!dragId) return
    const next={...placement}
    Object.keys(next).forEach(k=>{ if(next[k]===dragId) next[k]=null })
    setPlacement(next)
  }

  function resetBoard(reshuffle=false){
    const p={}; [...left,...right].forEach(s=>p[s]=null)
    setPlacement(p); setValidated(false); setScore(0); setRunning(true); setSeconds(0)
    if(reshuffle) setCards(shuffle(cards))
  }

  function validate(){
    if(!CORRECT_MAP){ alert('Validación protegida: agrega ?map=... (Base64) en la URL (solo docente).'); return }
    let pts=0
    Object.entries(CORRECT_MAP).forEach(([phaseId,testId])=>{
      if(placement[phaseId]===phaseId && placement[testId]===testId) pts+=1
    })
    const allPlaced=[...left,...right].every(s=>placement[s])
    if(allPlaced) pts+=1
    setScore(pts); setValidated(true); setRunning(false)
  }

  function exportResults(){
    const data={ team, scenario, elapsed_seconds:seconds, score, placement, timestamp:new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href=url; a.download=`resultado_vmodel_${team.replace(/\s+/g,'_')}.json`; a.click(); URL.revokeObjectURL(url)
  }

  function unlockTeacher(){
    if(!TEACHER_PIN){ alert('No hay PIN configurado en la URL (?pin=...).'); return }
    const val = prompt('Ingresa PIN docente')
    if(val===TEACHER_PIN) setTeacherUnlocked(true); else alert('PIN incorrecto')
  }

  // Generador de links (docente)
  const [mapInput,setMapInput]=useState('{"req-sis":"t-acep","req-sw":"t-sis","dis-arq":"t-int","dis-mod":"t-unit"}')
  const [pinInput,setPinInput]=useState('2468')
  const [generatedLink,setGeneratedLink]=useState('')
  function generateLink(){
    try{
      const obj = JSON.parse(mapInput)
      const b64 = btoa(JSON.stringify(obj))
      const base = location.origin + location.pathname
      const url = base + `?map=${b64}` + (pinInput?`&pin=${encodeURIComponent(pinInput)}`:'')
      setGeneratedLink(url)
      if(navigator.clipboard) navigator.clipboard.writeText(url).catch(()=>{})
    }catch(e){
      alert('JSON inválido en el mapa. Verifica comillas y llaves.')
    }
  }

  const placedIds = new Set(Object.values(placement).filter(Boolean))
  const bankCards = cards.filter(c=>!placedIds.has(c.id))

  function formatTime(s){ const m=Math.floor(s/60); const r=s%60; return `${m}:${String(r).padStart(2,'0')}` }

  return (
    <div className="container">
      <div className="panel">
        <div className="h1">Dinámica interactiva — Modelo en V</div>
        <div className="muted">Arrastra tarjetas para formar la “V” y emparejar fases ↔ pruebas. Exporta el resultado.</div>
      </div>

      <div className="panel" style={{marginTop:12}}>
        <div className="row">
          <div><div className="small muted">Equipo</div><input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Ej: Grupo A"/></div>
          <div><div className="small muted">Escenario</div><select value={scenario} onChange={e=>setScenario(e.target.value)}>{SCENARIOS.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
          <div className="small muted">Tiempo</div><div className="score">{formatTime(seconds)}</div>
          <div className="row"><button onClick={()=>setRunning(r=>!r)}>{running?'Pausar':'Reanudar'}</button><button onClick={()=>{setSeconds(0); setRunning(true)}}>Reiniciar</button></div>
        </div>
        <div className="small muted" style={{marginTop:6}}>{SCENARIOS.find(s=>s.id===scenario)?.description}</div>
      </div>

      <div className="grid grid-3" style={{marginTop:12}}>
        <div>
          <div className="small" style={{fontWeight:600, marginBottom:6}}>Desarrollo</div>
          <div className="grid">
            {LEFT_PHASES.map(f=>(<Slot key={f.id} id={f.id} cards={cards} placement={placement} setPlacement={setPlacement} validated={validated} teacherUnlocked={teacherUnlocked} hasMap={!!CORRECT_MAP}/>))}
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="row" style={{justifyContent:'space-between'}}>
              <div style={{fontWeight:600}}>Banco de tarjetas</div>
              <div className="small muted">Arrastra desde aquí</div>
            </div>
            <div className="bank" onDrop={e=>{e.preventDefault(); const dragId=e.dataTransfer.getData('text/plain'); if(!dragId)return; const next={...placement}; Object.keys(next).forEach(k=>{if(next[k]===dragId) next[k]=null}); setPlacement(next)}} onDragOver={e=>e.preventDefault()}>
              {bankCards.length===0 ? <div className="small muted">No hay tarjetas disponibles.</div> :
                <div className="row">{bankCards.map(c=>(<div key={c.id} draggable onDragStart={(e)=>{e.dataTransfer.setData('text/plain', c.id)}} className="card">{c.label}</div>))}</div>}
            </div>
            <div className="row" style={{marginTop:10}}>
              <button onClick={()=>resetBoard(false)}>Reiniciar</button>
              <button onClick={()=>resetBoard(true)}>Mezclar tarjetas</button>
              <button className="primary" onClick={validate}>Validar</button>
              <button onClick={exportResults}>Exportar resultado</button>
              <button onClick={unlockTeacher}>Modo docente (PIN)</button>
              {teacherUnlocked ? <span className="small">🔓 Docente activo</span> : <span className="small">🔒 Docente bloqueado</span>}
            </div>

            {validated && (
              <div className="panel" style={{marginTop:10}}>
                {!CORRECT_MAP ? (
                  <div className="small" style={{color:'#b91c1c'}}>Validación deshabilitada — agrega ?map=... (Base64).</div>
                ) : !teacherUnlocked ? (
                  <div className="small" style={{color:'#a16207'}}>Solución oculta — activa Modo docente con PIN.</div>
                ) : (
                  <div>Puntaje: <span className="score">{score}</span></div>
                )}
                <div className="small muted">+1 por cada emparejamiento correcto y +1 si todas las tarjetas están colocadas.</div>
              </div>
            )}
          </div>

          <div className="panel" style={{marginTop:8}}>
            <div style={{fontWeight:600, marginBottom:6}}>Relaciones esperadas</div>
            {CORRECT_MAP && teacherUnlocked ? (
              <ul className="small">
                <li>Requerimientos del sistema ↔ Pruebas de aceptación</li>
                <li>Requisitos de software ↔ Pruebas de sistema</li>
                <li>Diseño de arquitectura ↔ Pruebas de integración</li>
                <li>Diseño de módulos ↔ Pruebas unitarias</li>
              </ul>
            ) : (
              <div className="small muted">(Oculto para estudiantes) — Habilitar con ?map=... y PIN docente.</div>
            )}
          </div>
        </div>

        <div>
          <div className="small" style={{fontWeight:600, marginBottom:6}}>Pruebas</div>
          <div className="grid">
            {RIGHT_TESTS.map(t=>(<Slot key={t.id} id={t.id} cards={cards} placement={placement} setPlacement={setPlacement} validated={validated} teacherUnlocked={teacherUnlocked} hasMap={!!CORRECT_MAP}/>))}
          </div>
        </div>
      </div>

      <div className="panel" style={{marginTop:12}}>
        <div style={{fontWeight:600, marginBottom:6}}>Generador de enlace (docente)</div>
        <div className="small muted">Crea un enlace con <code>?map</code> (Base64 del JSON) y <code>?pin</code> opcional. Se copia al portapapeles.</div>
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8}}>
          <div>
            <div className="small muted">Mapa (JSON)</div>
            <textarea value={mapInput} onChange={e=>setMapInput(e.target.value)} style={{width:'100%', height:110, fontFamily:'monospace', fontSize:12, marginTop:6, border:'1px solid var(--border)', borderRadius:12, padding:8}}/>
          </div>
          <div>
            <div className="small muted">PIN docente (opcional)</div>
            <input value={pinInput} onChange={e=>setPinInput(e.target.value)} />
            <div className="row" style={{marginTop:8}}>
              <button onClick={generateLink}>Generar enlace</button>
              {generatedLink && <a href={generatedLink} target="_blank" rel="noreferrer"><button className="primary">Abrir</button></a>}
            </div>
            {generatedLink && <div className="small" style={{marginTop:6, wordBreak:'break-all'}}><b>Enlace:</b> {generatedLink}</div>}
          </div>
        </div>
      </div>

      <div className="footer">© Dinámica educativa — Modelo en V</div>
    </div>
  )
}

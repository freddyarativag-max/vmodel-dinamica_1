import React, { useMemo, useState, useEffect } from 'react'

// v1.7 — Requisitos unificados, columna derecha reordenada (Acep→Sis→Int→Unit) y tablero en V real con conectores.

const LEFT_PHASES = [
  { id: 'req', label: 'Requisitos (sistema + software)' },
  { id: 'dis-arq', label: 'Diseño de arquitectura' },
  { id: 'dis-mod', label: 'Diseño de módulos' },
  { id: 'cod', label: 'Codificación' },
]
const RIGHT_TESTS = [
  { id: 't-acep', label: 'Pruebas de aceptación' },
  { id: 't-sis', label: 'Pruebas de sistema' },
  { id: 't-int', label: 'Pruebas de integración' },
  { id: 't-unit', label: 'Pruebas unitarias' },
]

const SCENARIOS = [
  { id:'parking', name:'Parqueaderos (Centro Comercial)', description:'App móvil para cupos de parqueo en tiempo real, con integración a mapas y pagos.' },
  { id:'auto', name:'Automotriz (ISO 26262)', description:'Software embebido para ABS con requisitos de seguridad y trazabilidad.' },
  { id:'med', name:'Médico (Signos vitales)', description:'Monitoreo continuo con alarmas y validación regulatoria.' },
  { id:'aero', name:'Aeroespacial (Dron)', description:'Rutas, evasión de obstáculos, redundancia y verificación sistemática.' },
]

function parseMapParam(){ try{ const b64=new URLSearchParams(location.search).get('map'); if(!b64) return null; return JSON.parse(atob(b64)) }catch(e){ console.warn('No se pudo leer ?map', e); return null } }
function parsePinParam(){ try{ const pin=new URLSearchParams(location.search).get('pin'); return pin && pin.trim() ? pin.trim() : null }catch(e){ console.warn('No se pudo leer ?pin', e); return null } }
function getParam(name, def=''){ try{ const v=new URLSearchParams(location.search).get(name); return v??def }catch{ return def } }

function shuffle(a){ const arr=[...a]; for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr }
function useTimer(running){ const [s,setS]=useState(0); useEffect(()=>{ if(!running) return; const id=setInterval(()=>setS(v=>v+1),1000); return()=>clearInterval(id) },[running]); return [s,setS] }
function timeFmt(s){ const m=Math.floor(s/60); const r=s%60; return `${m}:${String(r).padStart(2,'0')}` }

function AppCard({id,label}){ return <div className="card" draggable onDragStart={e=>e.dataTransfer.setData('text/plain', id)}>{label}</div> }

function Slot({id, cards, placement, setPlacement, validated}){
  const cardId = placement[id]
  const card = cards.find(c=>c.id===cardId)
  const isCorrect = validated && placement[id] === id
  const isWrong = validated && placement[id] && placement[id] !== id

  const onDrop = (e)=>{
    e.preventDefault()
    const dragId = e.dataTransfer.getData('text/plain')
    if(!dragId) return
    if(placement[id]) return
    const next={...placement}
    Object.keys(next).forEach(k=>{ if(next[k]===dragId) next[k]=null })
    next[id]=dragId
    setPlacement(next)
  }

  const cls = `slot${isCorrect?' ok':''}${isWrong?' bad':''}`

  return (
    <div className={cls} onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
      {card ? <AppCard id={card.id} label={card.label}/> : <span className="small" style={{color:'#94a3b8'}}>Arrastra aquí</span>}
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
  const [slotCorrectState,setSlotCorrectState]=useState({})

  const CORRECT_MAP = useMemo(()=>parseMapParam(),[])
  const TEACHER_PIN = useMemo(()=>parsePinParam(),[])
  const SESSION_ID = useMemo(()=>getParam('session','sesion-general'),[])
  const ADMIN_VIEW = useMemo(()=>getParam('admin','')==='1',[])
  const SINK_URL = useMemo(()=>getParam('sink',''),[])

  const [teacherUnlocked,setTeacherUnlocked]=useState(()=>{ try{return sessionStorage.getItem('vmodel_teacher_unlocked')==='1'}catch{return false} })
  useEffect(()=>{ try{sessionStorage.setItem('vmodel_teacher_unlocked', teacherUnlocked?'1':'0')}catch{} },[teacherUnlocked])

  const loadResults = ()=>{ try{ return JSON.parse(localStorage.getItem('vmodel_results_'+SESSION_ID)) || [] }catch{ return [] } }
  const [results,setResults]=useState(loadResults)
  const [lastEval,setLastEval]=useState(null)

  const scenarioObj = SCENARIOS.find(s=>s.id===scenario)

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
    const slotCorrect = {}; [...left, ...right].forEach(id => { slotCorrect[id] = placement[id] === id })
    let pairsOK = 0
    if(CORRECT_MAP){
      Object.entries(CORRECT_MAP).forEach(([phaseId,testId])=>{
        if(slotCorrect[phaseId] && slotCorrect[testId]) pairsOK += 1
      })
    }
    setScore(pairsOK); setValidated(true); setRunning(false); setSlotCorrectState(slotCorrect)

    const result = {
      session: SESSION_ID, team, scenario, elapsed_seconds: seconds,
      pairs_ok: pairsOK, total_pairs: CORRECT_MAP ? Object.keys(CORRECT_MAP).length : 0,
      slots_ok: Object.values(slotCorrect).filter(Boolean).length, total_slots: left.length + right.length,
      placement, slot_correct: slotCorrect,
      timestamp: new Date().toISOString(), user_agent: navigator.userAgent
    }
    setLastEval(result)
    try{ const next=[...results, result]; setResults(next); localStorage.setItem('vmodel_results_'+SESSION_ID, JSON.stringify(next)) }catch{}
    if(SINK_URL){ try{ fetch(SINK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)}).catch(()=>{}) }catch{} }
  }

  function exportResults(){
    const data = lastEval || { team, scenario, elapsed_seconds: seconds, score, placement, timestamp: new Date().toISOString(), session: SESSION_ID }
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href=url; a.download=`resultado_vmodel_${(data.team||team).replace(/\\s+/g,'_')}.json`; a.click(); URL.revokeObjectURL(url)
  }

  function unlockTeacher(){
    if(!TEACHER_PIN){ alert('No hay PIN configurado en la URL (?pin=...).'); return }
    const val = prompt('Ingresa PIN docente'); if(val===TEACHER_PIN) setTeacherUnlocked(true); else alert('PIN incorrecto')
  }

  // Generador de enlaces
  const [mapInput,setMapInput]=useState('{\"req\":\"t-acep\",\"dis-arq\":\"t-sis\",\"dis-mod\":\"t-int\",\"cod\":\"t-unit\"}')
  const [pinInput,setPinInput]=useState('2468')
  const [sessionInput,setSessionInput]=useState(SESSION_ID)
  const [sinkInput,setSinkInput]=useState(SINK_URL)
  const [studentLink,setStudentLink]=useState('')
  const [teacherLink,setTeacherLink]=useState('')

  function generateLinks(){
    try{
      const obj = JSON.parse(mapInput)
      const b64 = btoa(JSON.stringify(obj))
      const base = location.origin + location.pathname
      const sinkPart = sinkInput ? `&sink=${encodeURIComponent(sinkInput)}` : ''
      const stud = `${base}?session=${encodeURIComponent(sessionInput)}&map=${b64}${sinkPart}`
      const teach = `${base}?session=${encodeURIComponent(sessionInput)}&map=${b64}${sinkPart}&pin=${encodeURIComponent(pinInput)}&admin=1`
      setStudentLink(stud); setTeacherLink(teach)
      if(navigator.clipboard) navigator.clipboard.writeText(stud).catch(()=>{}) // copia link estudiante
    }catch(e){ alert('JSON inválido en el mapa. Verifica comillas y llaves.') }
  }
  const openStudent = ()=>{ if(studentLink) window.open(studentLink,'_blank') }
  const openTeacher = ()=>{ if(teacherLink) window.open(teacherLink,'_blank') }

  // Posiciones de la V
  const leftOrder=['req','dis-arq','dis-mod','cod']
  const rightOrder=['t-acep','t-sis','t-int','t-unit']
  const leftY=[5,30,55,85]
  const rightY=[15,40,65,90]

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
          <div className="small muted">Tiempo</div><div className="score">{timeFmt(seconds)}</div>
          <div className="row"><button onClick={()=>setRunning(r=>!r)}>{running?'Pausar':'Reanudar'}</button><button onClick={()=>{setSeconds(0); setRunning(true)}}>Reiniciar</button></div>
        </div>
        <div className="small muted" style={{marginTop:6}}>{scenarioObj?.description}</div>
      </div>

      {/* Tablero en V */}
      <div className="panel" style={{marginTop:12}}>
        <div style={{fontWeight:600, marginBottom:6}}>Tablero en “V”</div>
        <div className="vboard">
          {/* Conectores */}
          <svg width="100%" height="100%" style={{position:'absolute', inset:0, pointerEvents:'none'}}>
            {rightOrder.map((rid, i)=>{
              const x1 = '12%'; const x2 = '88%'
              const y1 = `${leftY[i]}%`; const y2 = `${rightY[i]}%`
              const ok = validated ? ((slotCorrectState[leftOrder[i]] && slotCorrectState[rightOrder[i]]) ? '#16a34a' : '#ef4444') : '#cbd5e1'
              return <line key={rid} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ok} strokeWidth={2} strokeDasharray={validated?0:6} />
            })}
          </svg>

          {/* Columna izquierda */}
          {leftOrder.map((id,idx)=> (\n            <div key={id} className="vleft" style={{top:`${leftY[idx]}%`}}>\n              <div className="vlabel">{idx===0?'Desarrollo':''}</div>\n              <Slot id={id} cards={cards} placement={placement} setPlacement={setPlacement} validated={validated}/>\n            </div>\n          ))}

          {/* Banco al centro */}
          <div className="vcenter" style={{top:'10%'}}>
            <div className="panel" style={{padding:12}}>
              <div className="row" style={{justifyContent:'space-between'}}>
                <div style={{fontWeight:600}}>Banco de tarjetas</div>
                <div className="small muted">Arrastra desde aquí</div>
              </div>
              <div className="bank" onDrop={onDropBank} onDragOver={e=>e.preventDefault()}>
                {cards.filter(c=>!Object.values(placement).includes(c.id)).length===0
                  ? <div className="small muted">No hay tarjetas disponibles.</div>
                  : <div className="row">{cards.filter(c=>!Object.values(placement).includes(c.id)).map(c=>(<AppCard key={c.id} id={c.id} label={c.label}/>))}</div>}
              </div>
              <div className="row" style={{marginTop:10}}>
                <button onClick={()=>resetBoard(false)}>Reiniciar</button>
                <button onClick={()=>resetBoard(true)}>Mezclar</button>
                <button className="primary" onClick={validate}>Validar</button>
                <button onClick={exportResults}>Exportar</button>
                <button onClick={()=>{ if(!parsePinParam()) alert('No hay PIN en la URL (?pin=...)'); else unlockTeacher(); }}>Modo docente (PIN)</button>
                {teacherUnlocked ? <span className="small">🔓</span> : <span className="small">🔒</span>}
              </div>\n              {validated && (\n                <div className="panel" style={{marginTop:10}}>\n                  {!CORRECT_MAP ? (\n                    <div className="small" style={{color:'#b91c1c'}}>Validación deshabilitada — agrega ?map=... (Base64).</div>\n                  ) : (\n                    <div className="small">Parejas correctas: <b>{score}</b> / {Object.keys(CORRECT_MAP).length}</div>\n                  )}\n                  <div className="small muted">Las celdas correctas se marcan en verde; incorrectas en rojo.</div>\n                </div>\n              )}\n            </div>\n          </div>\n\n          {/* Columna derecha */}\n          {rightOrder.map((id,idx)=> (\n            <div key={id} className="vright" style={{top:`${rightY[idx]}%`}}>\n              <div className="vlabel" style={{textAlign:'right'}}>{idx===0?'Pruebas':''}</div>\n              <Slot id={id} cards={cards} placement={placement} setPlacement={setPlacement} validated={validated}/>\n            </div>\n          ))}\n        </div>\n      </div>\n\n      {/* Generador de enlaces */}\n      <div className="panel" style={{marginTop:12}}>\n        <div style={{fontWeight:600, marginBottom:6}}>Generador de enlaces (docente)</div>\n        <div className="small muted">Crea un <b>link de estudiantes</b> (único para todos) y un <b>link de docente</b> (admin) con PIN. Usa <b>Session ID</b> para agrupar resultados y un <b>Sink</b> opcional para recoger respuestas vía POST.</div>\n        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8}}>\n          <div>\n            <div className="small muted">Mapa (JSON)</div>\n            <textarea value={mapInput} onChange={e=>setMapInput(e.target.value)} style={{width:'100%', height:110, fontFamily:'monospace', fontSize:12, marginTop:6, border:'1px solid var(--border)', borderRadius:12, padding:8}}/>\n            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8}}>\n              <div><div className="small muted">Session ID</div><input value={sessionInput} onChange={e=>setSessionInput(e.target.value)}/></div>\n              <div><div className="small muted">PIN docente</div><input value={pinInput} onChange={e=>setPinInput(e.target.value)}/></div>\n            </div>\n            <div style={{marginTop:8}}><div className="small muted">Sink (opcional, recibe POST)</div><input value={sinkInput} onChange={e=>setSinkInput(e.target.value)} placeholder="https://..."/></div>\n          </div>\n          <div>\n            <button onClick={generateLinks}>Generar enlaces</button>\n            {studentLink && (\n              <div className="small" style={{marginTop:8}}>\n                <div className="score">Estudiante:</div><div className="break-all">{studentLink}</div>\n                <div className="score" style={{marginTop:6}}>Docente (admin):</div><div className="break-all">{teacherLink}</div>\n                <div className="row" style={{marginTop:6}}>\n                  <button onClick={openStudent}>Abrir Estudiante</button>\n                  <button onClick={openTeacher}>Abrir Docente</button>\n                </div>\n              </div>\n            )}\n          </div>\n        </div>\n      </div>\n\n      {ADMIN_VIEW && (\n        <div className="panel" style={{marginTop:12}}>\n          <div className="row" style={{justifyContent:'space-between'}}>\n            <div style={{fontWeight:600}}>Resultados de la sesión: {SESSION_ID}</div>\n            <div className="row">\n              <button onClick={()=>setResults(loadResults())}>Actualizar</button>\n              <button onClick={()=>{const data=JSON.stringify(results,null,2); const b=new Blob([data],{type:'application/json'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`resultados_${SESSION_ID}.json`; a.click(); URL.revokeObjectURL(u);}}>Exportar JSON</button>\n              <button onClick={()=>{const header=['team','scenario','pairs_ok','total_pairs','slots_ok','total_slots','elapsed_seconds','timestamp']; const rows=results.map(r=>[r.team,r.scenario,r.pairs_ok,r.total_pairs,r.slots_ok,r.total_slots,r.elapsed_seconds,r.timestamp].map(x=>`\"${(x??'').toString().replace(/\\\"/g,'\\\"\\\"')}\"`).join(',')); const csv=[header.join(','),...rows].join('\\n'); const b=new Blob([csv],{type:'text/csv'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=`resultados_${SESSION_ID}.csv`; a.click(); URL.revokeObjectURL(u);}}>Exportar CSV</button>\n              <button onClick={()=>{ if(confirm('¿Borrar resultados locales de esta sesión?')){ localStorage.removeItem('vmodel_results_'+SESSION_ID); setResults([]); }}}>Borrar</button>\n            </div>\n          </div>\n          <div className="small muted" style={{marginTop:6}}>(Para ver contenido, activa <b>Modo docente (PIN)</b> en la vista con &admin=1 y PIN en la URL.)</div>\n        </div>\n      )}\n\n      <div className=\"footer\">© Dinámica educativa — Modelo en V</div>\n    </div>\n  )\n}\n
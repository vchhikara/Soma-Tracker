import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ── STORAGE ───────────────────────────────────────────────
const PROFILES_KEY  = 'soma_profiles_v1'
const ENTRIES_KEY   = (pid: string) => `soma_entries_${pid}_v1`
const WORKOUTS_KEY  = (pid: string) => `soma_workouts_${pid}_v1`
const ACTIVE_KEY    = 'soma_active_profile_v1'

const DB = {
  // Profiles
  getProfiles(): any[]   { try { return JSON.parse(localStorage.getItem(PROFILES_KEY)||'[]') } catch { return [] } },
  saveProfiles(p: any[]) { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)) },
  getActiveId(): string|null { return localStorage.getItem(ACTIVE_KEY)||null },
  setActiveId(id: string|null) { if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY) },

  // Entries (per profile)
  getEntries(pid: string): any[] { try { return JSON.parse(localStorage.getItem(ENTRIES_KEY(pid))||'[]').sort((a: any,b: any)=>new Date(b.date).getTime()-new Date(a.date).getTime()) } catch { return [] } },
  saveEntry(pid: string, entry: any) {
    const all = this.getEntries(pid)
    const idx = all.findIndex((e: any)=>e.id===entry.id)
    if (idx>=0) all[idx]=entry; else all.unshift(entry)
    all.sort((a: any,b: any)=>new Date(b.date).getTime()-new Date(a.date).getTime())
    localStorage.setItem(ENTRIES_KEY(pid), JSON.stringify(all))
  },
  deleteEntry(pid: string, id: string) { localStorage.setItem(ENTRIES_KEY(pid), JSON.stringify(this.getEntries(pid).filter((e: any)=>e.id!==id))) },

  // Workouts (per profile)
  getWorkouts(pid: string): any[] { try { return JSON.parse(localStorage.getItem(WORKOUTS_KEY(pid))||'[]').sort((a: any,b: any)=>new Date(b.date).getTime()-new Date(a.date).getTime()) } catch { return [] } },
  saveWorkout(pid: string, w: any) {
    const all = this.getWorkouts(pid)
    const idx = all.findIndex((x: any)=>x.id===w.id)
    if (idx>=0) all[idx]=w; else all.unshift(w)
    localStorage.setItem(WORKOUTS_KEY(pid), JSON.stringify(all))
  },
  deleteWorkout(pid: string, id: string) { localStorage.setItem(WORKOUTS_KEY(pid), JSON.stringify(this.getWorkouts(pid).filter((w: any)=>w.id!==id))) },
}

// ── HELPERS ───────────────────────────────────────────────
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
const today = () => new Date().toISOString().split('T')[0]

function createEmptyEntry(date=today()) {
  return {
    id: uid(), date,
    overall: { heightFt:'', heightIn:'', weight:'', bodyFatPct:'' },
    measurements: { neck:'', shoulders:'', chest:'', belly:'', waist:'', glutes:'' },
    bilateral: { bicepsL:'', bicepsR:'', forearmsL:'', forearmsR:'', wristsL:'', wristsR:'', thighsMaxL:'', thighsMaxR:'', thighsMinL:'', thighsMinR:'', calvesL:'', calvesR:'', anklesL:'', anklesR:'' }
  }
}

function createEmptyWorkout(date=today()) {
  return { id: uid(), date, name:'', category:'Strength', duration:'', notes:'', exercises:[] }
}

function createEmptySetRow() {
  return { id: uid(), reps:'', weight:'' }
}

function createEmptyExercise() {
  return { id: uid(), name:'', muscleGroup:'Chest', unit:'kg', setRows:[createEmptySetRow()] }
}



function seedData(pid: string) {
  if (DB.getEntries(pid).length>0) return
  const base=[
    {w:88.5,bf:22.1,neck:15.8,shoulders:46.5,chest:40.2,belly:36.8,waist:34.5,glutes:39.2,bicepsL:14.5,bicepsR:14.6,forearmsL:11.8,forearmsR:11.9,wristsL:6.8,wristsR:6.8,thighsMaxL:23.5,thighsMaxR:23.6,thighsMinL:15.2,thighsMinR:15.3,calvesL:14.8,calvesR:14.9,anklesL:8.5,anklesR:8.5},
    {w:87.2,bf:21.4,neck:15.9,shoulders:46.8,chest:40.5,belly:36.1,waist:33.8,glutes:39.0,bicepsL:14.8,bicepsR:14.9,forearmsL:12.0,forearmsR:12.1,wristsL:6.8,wristsR:6.8,thighsMaxL:23.2,thighsMaxR:23.3,thighsMinL:15.0,thighsMinR:15.1,calvesL:14.9,calvesR:15.0,anklesL:8.4,anklesR:8.4},
    {w:85.8,bf:20.5,neck:16.0,shoulders:47.2,chest:40.9,belly:35.3,waist:33.0,glutes:38.7,bicepsL:15.1,bicepsR:15.2,forearmsL:12.2,forearmsR:12.3,wristsL:6.9,wristsR:6.9,thighsMaxL:22.9,thighsMaxR:23.0,thighsMinL:14.8,thighsMinR:14.9,calvesL:15.1,calvesR:15.2,anklesL:8.4,anklesR:8.3},
    {w:84.1,bf:19.7,neck:16.1,shoulders:47.6,chest:41.3,belly:34.5,waist:32.2,glutes:38.4,bicepsL:15.4,bicepsR:15.5,forearmsL:12.4,forearmsR:12.5,wristsL:6.9,wristsR:6.9,thighsMaxL:22.6,thighsMaxR:22.7,thighsMinL:14.6,thighsMinR:14.7,calvesL:15.2,calvesR:15.3,anklesL:8.3,anklesR:8.3},
    {w:83.0,bf:19.0,neck:16.2,shoulders:47.9,chest:41.8,belly:33.8,waist:31.5,glutes:38.1,bicepsL:15.7,bicepsR:15.8,forearmsL:12.6,forearmsR:12.7,wristsL:7.0,wristsR:7.0,thighsMaxL:22.3,thighsMaxR:22.4,thighsMinL:14.4,thighsMinR:14.5,calvesL:15.3,calvesR:15.4,anklesL:8.2,anklesR:8.2},
  ]
  const now=new Date()
  base.forEach((d,i)=>{
    const date=new Date(now); date.setDate(date.getDate()-(base.length-1-i)*21)
    DB.saveEntry(pid,{
      id:`seed_${i}`, date:date.toISOString().split('T')[0],
      overall:{heightFt:'5',heightIn:'11',weight:String(d.w),bodyFatPct:String(d.bf)},
      measurements:{neck:String(d.neck),shoulders:String(d.shoulders),chest:String(d.chest),belly:String(d.belly),waist:String(d.waist),glutes:String(d.glutes)},
      bilateral:{bicepsL:String(d.bicepsL),bicepsR:String(d.bicepsR),forearmsL:String(d.forearmsL),forearmsR:String(d.forearmsR),wristsL:String(d.wristsL),wristsR:String(d.wristsR),thighsMaxL:String(d.thighsMaxL),thighsMaxR:String(d.thighsMaxR),thighsMinL:String(d.thighsMinL),thighsMinR:String(d.thighsMinR),calvesL:String(d.calvesL),calvesR:String(d.calvesR),anklesL:String(d.anklesL),anklesR:String(d.anklesR)}
    })
  })
}

// ── BODY PARTS ────────────────────────────────────────────
const BODY_PARTS = [
  {id:'neck',      label:'Neck',             field:'measurements.neck',      unit:'in'},
  {id:'shoulders', label:'Shoulders',        field:'measurements.shoulders', unit:'in'},
  {id:'chest',     label:'Chest',            field:'measurements.chest',     unit:'in'},
  {id:'belly',     label:'Belly',            field:'measurements.belly',     unit:'in'},
  {id:'waist',     label:'Waist',            field:'measurements.waist',     unit:'in'},
  {id:'glutes',    label:'Glutes',           field:'measurements.glutes',    unit:'in'},
  {id:'bicepsL',   label:'Left Bicep',       field:'bilateral.bicepsL',      unit:'in', side:'L'},
  {id:'bicepsR',   label:'Right Bicep',      field:'bilateral.bicepsR',      unit:'in', side:'R'},
  {id:'forearmsL', label:'Left Forearm',     field:'bilateral.forearmsL',    unit:'in', side:'L'},
  {id:'forearmsR', label:'Right Forearm',    field:'bilateral.forearmsR',    unit:'in', side:'R'},
  {id:'wristsL',   label:'Left Wrist',       field:'bilateral.wristsL',      unit:'in', side:'L'},
  {id:'wristsR',   label:'Right Wrist',      field:'bilateral.wristsR',      unit:'in', side:'R'},
  {id:'thighsMaxL',label:'Left Thigh (max)', field:'bilateral.thighsMaxL',   unit:'in', side:'L'},
  {id:'thighsMaxR',label:'Right Thigh (max)',field:'bilateral.thighsMaxR',   unit:'in', side:'R'},
  {id:'thighsMinL',label:'Left Thigh (min)', field:'bilateral.thighsMinL',   unit:'in', side:'L'},
  {id:'thighsMinR',label:'Right Thigh (min)',field:'bilateral.thighsMinR',   unit:'in', side:'R'},
  {id:'calvesL',   label:'Left Calf',        field:'bilateral.calvesL',      unit:'in', side:'L'},
  {id:'calvesR',   label:'Right Calf',       field:'bilateral.calvesR',      unit:'in', side:'R'},
  {id:'anklesL',   label:'Left Ankle',       field:'bilateral.anklesL',      unit:'in', side:'L'},
  {id:'anklesR',   label:'Right Ankle',      field:'bilateral.anklesR',      unit:'in', side:'R'},
]
const PART_MAP = Object.fromEntries(BODY_PARTS.map(p=>[p.id,p]))
const MAT_GREY = new THREE.MeshStandardMaterial({color:'#B0B8C1',roughness:0.7,metalness:0.05})

// ── CHART THEME ───────────────────────────────────────────
const C = {cyan:'#00D4FF',lime:'#A8FF3E',rose:'#FF4D6A',amber:'#FFB443',purple:'#B48AFF',teal:'#00E5CC',grid:'rgba(255,255,255,0.05)',text:'#4A5A6A'}
const ttStyle = {background:'#0D1117',border:'1px solid rgba(255,255,255,0.12)',borderRadius:8,fontFamily:'monospace',fontSize:11,color:'#F0F4F8'}

// ── SHARED UI COMPONENTS ──────────────────────────────────
const inputStyle = {background:'#131920',border:'1px solid #1A2A3A',borderRadius:6,padding:'6px 10px',color:'#F0F4F8',fontFamily:'monospace',fontSize:12,outline:'none',width:'100%'}
const labelStyle = {fontSize:10,color:'#4A5A6A',fontFamily:'monospace',letterSpacing:'0.05em'}

function Input({label, value, onChange, type='text', placeholder='', style={}}: {label?: string, value: string, onChange: (v: string)=>void, type?: string, placeholder?: string, style?: React.CSSProperties}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3,flex:1}}>
      {label && <label style={labelStyle}>{label}</label>}
      <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
        style={{...inputStyle,...style}} onWheel={e=>e.currentTarget.blur()}/>
    </div>
  )
}

function Select({label, value, onChange, options}: {label?: string, value: string, onChange: (v: string)=>void, options: string[]}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3,flex:1}}>
      {label && <label style={labelStyle}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{...inputStyle,cursor:'pointer'}}>
        {options.map((o: string)=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Btn({children, onClick, variant='ghost', style={}}: {children: React.ReactNode, onClick: ()=>void, variant?: string, style?: React.CSSProperties}) {
  const base = {borderRadius:6,fontFamily:'monospace',fontSize:12,cursor:'pointer',padding:'7px 14px',border:'none',transition:'all 0.15s'}
  const variants: Record<string, React.CSSProperties> = {
    primary: {background:'#00D4FF',color:'#080C10',fontWeight:700},
    ghost:   {background:'#131920',border:'1px solid #1A2A3A',color:'#8A9BB0'},
    danger:  {background:'rgba(255,77,106,0.1)',border:'1px solid rgba(255,77,106,0.3)',color:'#FF4D6A'},
    cyan:    {background:'rgba(0,212,255,0.1)',border:'1px solid rgba(0,212,255,0.3)',color:'#00D4FF'},
  }
  return <button onClick={onClick} style={{...base,...variants[variant],...style}}>{children}</button>
}

function SectionTitle({children}: {children: React.ReactNode}) {
  return <div style={{fontSize:10,color:'#4A5A6A',fontFamily:'monospace',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8,marginTop:12}}>{children}</div>
}

function Row({children, gap=6}: {children: React.ReactNode, gap?: number}) {
  return <div style={{display:'flex',gap,marginBottom:6}}>{children}</div>
}

function Modal({title, onClose, children, width=560}: {title: string, onClose: ()=>void, children: React.ReactNode, width?: number}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20}}>
      <div style={{background:'#0D1117',border:'1px solid #1A2A3A',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 80px rgba(0,0,0,0.8)'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #1A2A3A',flexShrink:0}}>
          <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#F0F4F8'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#4A5A6A',fontSize:18,cursor:'pointer',lineHeight:1}}>✕</button>
        </div>
        {/* Body */}
        <div style={{overflowY:'auto',padding:'16px 20px',flex:1}}>{children}</div>
      </div>
    </div>
  )
}

function ChartCard({title, children, span=1}: {title: string, children: React.ReactNode, span?: number}) {
  return (
    <div style={{background:'#0D1117',border:'1px solid #1A2A3A',borderRadius:14,padding:'18px 20px',gridColumn:`span ${span}`}}>
      <div style={{fontSize:10,color:C.text,fontFamily:'monospace',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:16}}>{title}</div>
      {children}
    </div>
  )
}

// ── PROFILE SELECTOR SCREEN ───────────────────────────────
function ProfileScreen({onSelect}: {onSelect: (p: any)=>void}) {
  const [profiles, setProfiles] = useState(DB.getProfiles())
  const [creating, setCreating] = useState(false)
  const [name, setName]         = useState('')
  const [avatar, setAvatar]     = useState('💪')

  const AVATARS = ['💪','🏋️','🧘','🏃','🚴','⚽','🥊','🎯','🔥','⚡']

  const create = () => {
    if (!name.trim()) return
    const p = {id:uid(), name:name.trim(), avatar, createdAt:today()}
    const updated = [...profiles, p]
    DB.saveProfiles(updated)
    setProfiles(updated)
    setName(''); setCreating(false)
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this profile and all its data?')) return
    const updated = profiles.filter(p=>p.id!==id)
    DB.saveProfiles(updated)
    setProfiles(updated)
  }

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#080C10',color:'#F0F4F8',padding:32}}>
      <div style={{fontFamily:'monospace',fontWeight:800,fontSize:32,letterSpacing:'0.12em',color:'#00D4FF',marginBottom:8}}>SOMA</div>
      <div style={{fontFamily:'monospace',fontSize:12,color:'#4A5A6A',marginBottom:40,letterSpacing:'0.1em'}}>SELECT PROFILE</div>

      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center',maxWidth:640,marginBottom:32}}>
        {profiles.map(p=>(
          <div key={p.id} onClick={()=>onSelect(p)}
            style={{background:'#0D1117',border:'1px solid #1A2A3A',borderRadius:16,padding:'24px 28px',cursor:'pointer',textAlign:'center',minWidth:140,position:'relative',transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#00D4FF'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#1A2A3A'}>
            <div style={{fontSize:36,marginBottom:10}}>{p.avatar}</div>
            <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,color:'#F0F4F8',marginBottom:4}}>{p.name}</div>
            <div style={{fontFamily:'monospace',fontSize:10,color:'#4A5A6A'}}>since {p.createdAt}</div>
            <button onClick={e=>remove(p.id,e)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',color:'#2A3A4A',fontSize:12,cursor:'pointer'}}>✕</button>
          </div>
        ))}

        {/* Add new profile card */}
        {!creating && (
          <div onClick={()=>setCreating(true)}
            style={{background:'#0D1117',border:'1px dashed #1A2A3A',borderRadius:16,padding:'24px 28px',cursor:'pointer',textAlign:'center',minWidth:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,color:'#4A5A6A',transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#00D4FF'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#1A2A3A'}>
            <div style={{fontSize:28}}>＋</div>
            <div style={{fontFamily:'monospace',fontSize:12}}>New Profile</div>
          </div>
        )}
      </div>

      {/* Create profile form */}
      {creating && (
        <div style={{background:'#0D1117',border:'1px solid #1A2A3A',borderRadius:16,padding:24,width:'100%',maxWidth:400}}>
          <div style={{fontFamily:'monospace',fontSize:11,color:'#4A5A6A',letterSpacing:'0.1em',marginBottom:14,textTransform:'uppercase'}}>New Profile</div>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}
            style={{...inputStyle,marginBottom:14,fontSize:14}}
            onKeyDown={e=>e.key==='Enter'&&create()}
            autoFocus/>
          <div style={{fontFamily:'monospace',fontSize:10,color:'#4A5A6A',marginBottom:8}}>CHOOSE AVATAR</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
            {AVATARS.map(a=>(
              <button key={a} onClick={()=>setAvatar(a)}
                style={{fontSize:22,padding:'6px 10px',borderRadius:8,border:`1px solid ${avatar===a?'#00D4FF':'#1A2A3A'}`,background:avatar===a?'rgba(0,212,255,0.1)':'#131920',cursor:'pointer'}}>
                {a}
              </button>
            ))}
          </div>
          <Row>
            <Btn onClick={()=>setCreating(false)}>Cancel</Btn>
            <Btn onClick={create} variant="primary" style={{flex:1}}>Create Profile</Btn>
          </Row>
        </div>
      )}
    </div>
  )
}

// ── HOVER POPUP ───────────────────────────────────────────
function HoverPopup({part, entry, mouseX, mouseY}: {part: any, entry: any, mouseX: number, mouseY: number}) {
  if (!part) return null
  const key     = part.field.split('.')[1]
  const section = part.field.split('.')[0]
  const val     = entry?.[section]?.[key]
  return (
    <div style={{position:'fixed',left:mouseX+18,top:mouseY-10,background:'#0D1117',border:'1px solid rgba(255,255,255,0.15)',borderTop:'2px solid #00D4FF',borderRadius:10,padding:'12px 16px',pointerEvents:'none',zIndex:999,minWidth:180,boxShadow:'0 12px 40px rgba(0,0,0,0.7)'}}>
      <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,color:'#F0F4F8',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10,paddingBottom:8,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>{part.label}</div>
      {[
        {label:'Measurement', value: val ? `${val} ${part.unit}` : '— not recorded'},
        {label:'Date',        value: entry?.date ?? '—'},
        {label:'Weight',      value: entry?.overall?.weight ? `${entry.overall.weight} kg` : '—'},
        {label:'Body Fat',    value: entry?.overall?.bodyFatPct ? `${entry.overall.bodyFatPct}%` : '—'},
      ].map(r=>(
        <div key={r.label} style={{display:'flex',justifyContent:'space-between',gap:20,marginBottom:5}}>
          <span style={{fontFamily:'monospace',fontSize:11,color:'#4A5A6A',textTransform:'uppercase',letterSpacing:'0.06em'}}>{r.label}</span>
          <span style={{fontFamily:'monospace',fontSize:12,color:String(r.value).startsWith('—')?'#2A3A4A':'#F0F4F8',fontWeight:500}}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── 3D MODEL ──────────────────────────────────────────────
function HumanModel({setHovered, setMousePos}: {setHovered: (id: string|null)=>void, setMousePos: (pos: {x:number,y:number})=>void}) {
  const {scene} = useGLTF('/models/human_body.glb')
  const groupRef = useRef<any>(null)

  useEffect(()=>{ scene.traverse(c=>{ if (c instanceof THREE.Mesh) c.material=MAT_GREY }) },[scene])

  const handlePointerMove = useCallback((e: any)=>{ setMousePos({x:e.clientX,y:e.clientY}) },[setMousePos])
  const handlePointerOver = useCallback((e: any)=>{ e.stopPropagation(); if(PART_MAP[e.object.name]){setHovered(e.object.name);document.body.style.cursor='crosshair'} },[setHovered])
  const handlePointerOut  = useCallback((e: any)=>{ e.stopPropagation(); setHovered(null); document.body.style.cursor='auto' },[setHovered])

  return (
    <group ref={groupRef}>
      <primitive object={scene} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onPointerMove={handlePointerMove}/>
    </group>
  )
}

// ── MEASUREMENT MODAL ─────────────────────────────────────
function MeasurementModal({entries, onSave, onClose}: {entries: any[], onSave: (entry: any)=>void, onClose: ()=>void}) {
  const [form, setForm] = useState(()=>createEmptyEntry())

  const update = (section: string, key: string, val: string) => setForm((prev: any)=>({...prev,[section]:{...prev[section],[key]:val}}))
  const quickFill = () => { if (!entries.length) return; const p=entries[0]; setForm((f: any)=>({...f,overall:{...p.overall},measurements:{...p.measurements},bilateral:{...p.bilateral}})) }
  const save = () => { onSave({...form,id:uid()}); onClose() }

  const F = ({label, section, k, placeholder='0.00'}: {label: string, section: string, k: string, placeholder?: string}) => (
    <div style={{display:'flex',flexDirection:'column',gap:3,flex:1}}>
      <label style={labelStyle}>{label}</label>
      <input type="number" step="0.01" placeholder={placeholder}
        value={(form as any)[section][k]||''} onChange={e=>update(section,k,e.target.value)}
        style={inputStyle} onWheel={e=>e.currentTarget.blur()}/>
    </div>
  )

  const sideTag = (s: string) => <span style={{fontSize:9,fontFamily:'monospace',padding:'1px 4px',borderRadius:3,marginLeft:3,background:s==='L'?'rgba(0,212,255,0.15)':'rgba(168,255,62,0.12)',color:s==='L'?'#00D4FF':'#A8FF3E'}}>{s}</span>

  return (
    <Modal title="Add Measurements" onClose={onClose} width={620}>
      {/* Date + quick fill */}
      <Row>
        <Input label="Date" type="date" value={form.date} onChange={v=>setForm(f=>({...f,date:v}))}/>
      </Row>
      <Row gap={8}>
        {entries.length>0 && <Btn onClick={quickFill} variant="cyan" style={{flex:1}}>⚡ Quick-fill from last entry</Btn>}
        <Btn onClick={save} variant="primary" style={{flex:1}}>✓ Save Entry</Btn>
      </Row>

      <SectionTitle>Overall</SectionTitle>
      <Row><F label="Height ft" section="overall" k="heightFt" placeholder="5"/><F label="Height in" section="overall" k="heightIn" placeholder="11"/></Row>
      <Row><F label="Weight kg" section="overall" k="weight"/><F label="Body Fat %" section="overall" k="bodyFatPct"/></Row>

      <SectionTitle>Circumference — inches</SectionTitle>
      <Row><F label="Neck" section="measurements" k="neck"/><F label="Shoulders" section="measurements" k="shoulders"/></Row>
      <Row><F label="Chest" section="measurements" k="chest"/><F label="Belly" section="measurements" k="belly"/></Row>
      <Row><F label="Waist" section="measurements" k="waist"/><F label="Glutes" section="measurements" k="glutes"/></Row>

      <SectionTitle>Bilateral — inches</SectionTitle>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {([['BICEPS','bicepsL','bicepsR'],['FOREARMS','forearmsL','forearmsR'],['WRISTS','wristsL','wristsR'],['THIGH MAX','thighsMaxL','thighsMaxR'],['THIGH MIN','thighsMinL','thighsMinR'],['CALVES','calvesL','calvesR'],['ANKLES','anklesL','anklesR']] as [string,string,string][]).map(([name,L,R])=>(
          <div key={name} style={{background:'#131920',borderRadius:8,padding:'10px 12px'}}>
            <div style={{fontSize:9,color:'#4A5A6A',fontFamily:'monospace',letterSpacing:'0.1em',marginBottom:8}}>{name}</div>
            <Row>
              <div style={{display:'flex',flexDirection:'column',gap:3,flex:1}}>
                <label style={labelStyle}>Left {sideTag('L')}</label>
                <input type="number" step="0.01" placeholder="0.00" value={(form.bilateral as any)[L]||''} onChange={e=>update('bilateral',L,e.target.value)} style={inputStyle} onWheel={e=>e.currentTarget.blur()}/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:3,flex:1}}>
                <label style={labelStyle}>Right {sideTag('R')}</label>
                <input type="number" step="0.01" placeholder="0.00" value={(form.bilateral as any)[R]||''} onChange={e=>update('bilateral',R,e.target.value)} style={inputStyle} onWheel={e=>e.currentTarget.blur()}/>
              </div>
            </Row>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ── WORKOUT PAGE ──────────────────────────────────────────
const WORKOUT_CATEGORIES = ['Strength','Cardio','Hypertrophy','Flexibility','Sports','Other']
const MUSCLE_GROUPS      = ['Chest','Back','Shoulders','Biceps','Triceps','Legs','Glutes','Core','Full Body','Cardio']

function WorkoutPage({profileId}: {profileId: string}) {
  const [workouts,   setWorkouts]   = useState(()=>DB.getWorkouts(profileId))
  const [showModal,  setShowModal]  = useState(false)
  const [editId,     setEditId]     = useState<string|null>(null)
  const [filterCat,  setFilterCat]  = useState('All')

  const refresh = () => setWorkouts(DB.getWorkouts(profileId))

  const deleteWorkout = (id: string) => { if (!confirm('Delete this workout?')) return; DB.deleteWorkout(profileId,id); refresh() }

  const filtered = filterCat==='All' ? workouts : workouts.filter(w=>w.category===filterCat)

  // Volume chart data
  const volData = [...workouts].reverse().slice(-10).map(w=>({
    date: w.date.slice(5),
    exercises: w.exercises.length,
    volume: w.exercises.reduce((sum: number,ex: any)=>sum+(ex.setRows||[]).reduce((s: number,r: any)=>s+(parseFloat(r.reps)||0)*(parseFloat(r.weight)||0),0),0),
  }))

  // Category breakdown
  const catCounts = WORKOUT_CATEGORIES.map(c=>({name:c, value:workouts.filter(w=>w.category===c).length})).filter(d=>d.value>0)
  const PIE_COLORS = [C.cyan,C.lime,C.amber,C.rose,C.purple,C.teal]

  return (
    <div style={{flex:1,overflowY:'auto',padding:24,display:'flex',flexDirection:'column',gap:20,background:'#080C10'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:22,fontWeight:700,letterSpacing:'-0.02em',color:'#F0F4F8'}}>Workout Tracker</div>
        <Btn onClick={()=>{setEditId(null);setShowModal(true)}} variant="primary">＋ Log Workout</Btn>
      </div>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {[
          {label:'Total Workouts',   value:workouts.length,                                         unit:''},
          {label:'This Month',       value:workouts.filter(w=>w.date.slice(0,7)===today().slice(0,7)).length, unit:''},
          {label:'Avg Duration',     value:workouts.length ? Math.round(workouts.reduce((s,w)=>s+(parseFloat(w.duration)||0),0)/workouts.length) : 0, unit:'min'},
          {label:'Total Exercises',  value:workouts.reduce((s,w)=>s+w.exercises.length,0),           unit:''},
        ].map(s=>(
          <div key={s.label} style={{background:'#0D1117',border:'1px solid #1A2A3A',borderRadius:10,padding:'14px 12px',textAlign:'center'}}>
            <div style={{fontSize:10,color:C.text,fontFamily:'monospace',marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:'#F0F4F8'}}>{s.value}<span style={{fontSize:12,color:C.text,fontWeight:400}}>{s.unit&&' '+s.unit}</span></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {workouts.length>1 && (
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
          <ChartCard title="Training volume over time">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={volData} margin={{top:4,right:8,bottom:0,left:-20}}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.grid} vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={ttStyle}/>
                <Line type="monotone" dataKey="volume" name="Volume (sets×reps×kg)" stroke={C.cyan} strokeWidth={2} dot={{r:3}} connectNulls/>
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="By category">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catCounts} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                  {catCounts.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={ttStyle}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10,fontFamily:'monospace',color:C.text}}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {['All',...WORKOUT_CATEGORIES].map(c=>(
          <button key={c} onClick={()=>setFilterCat(c)} style={{padding:'4px 12px',borderRadius:20,fontSize:11,fontFamily:'monospace',cursor:'pointer',border:`1px solid ${filterCat===c?C.cyan:'#1A2A3A'}`,background:filterCat===c?'rgba(0,212,255,0.1)':'transparent',color:filterCat===c?C.cyan:C.text}}>
            {c}
          </button>
        ))}
      </div>

      {/* Workout list */}
      {filtered.length===0 ? (
        <div style={{textAlign:'center',padding:60,color:'#2A3A4A',fontFamily:'monospace',fontSize:13}}>
          No workouts yet — hit "Log Workout" to start tracking
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(w=>(
            <div key={w.id} style={{background:'#0D1117',border:'1px solid #1A2A3A',borderRadius:12,padding:'16px 18px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <div style={{fontFamily:'monospace',fontSize:14,fontWeight:700,color:'#F0F4F8',marginBottom:4}}>{w.name||'Unnamed Workout'}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontFamily:'monospace',fontSize:10,color:C.text}}>{w.date}</span>
                    <span style={{fontFamily:'monospace',fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(0,212,255,0.1)',color:C.cyan,border:'1px solid rgba(0,212,255,0.2)'}}>{w.category}</span>
                    {w.duration && <span style={{fontFamily:'monospace',fontSize:10,color:C.text}}>⏱ {w.duration} min</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <Btn onClick={()=>{setEditId(w.id);setShowModal(true)}} style={{fontSize:11,padding:'4px 10px'}}>Edit</Btn>
                  <Btn onClick={()=>deleteWorkout(w.id)} variant="danger" style={{fontSize:11,padding:'4px 10px'}}>Delete</Btn>
                </div>
              </div>

              {/* Exercises table */}
              {w.exercises.length>0 && (
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr>{['Exercise','Sets','Reps','Weight','Volume'].map(h=>(
                      <th key={h} style={{textAlign:'left',padding:'4px 8px',fontFamily:'monospace',fontSize:9,color:C.text,letterSpacing:'0.08em',textTransform:'uppercase',borderBottom:'1px solid #1A2A3A'}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {w.exercises.map((ex: any)=>(
                      <tr key={ex.id}>
                        <td style={{padding:'5px 8px',fontFamily:'monospace',color:'#F0F4F8'}}>{ex.name||'—'}</td>
                        <td style={{padding:'5px 8px',fontFamily:'monospace',color:'#8A9BB0'}}>{ex.sets||'—'}</td>
                        <td style={{padding:'5px 8px',fontFamily:'monospace',color:'#8A9BB0'}}>{ex.reps||'—'}</td>
                        <td style={{padding:'5px 8px',fontFamily:'monospace',color:'#8A9BB0'}}>{ex.weight?`${ex.weight} ${ex.unit}`:'—'}</td>
                        <td style={{padding:'5px 8px',fontFamily:'monospace',color:C.cyan}}>
                          {(ex.setRows||[]).reduce((s: number,r: any)=>s+(parseFloat(r.reps)||0)*(parseFloat(r.weight)||0),0)||'—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {w.notes && <div style={{fontFamily:'monospace',fontSize:11,color:'#4A5A6A',marginTop:10,paddingTop:10,borderTop:'1px solid #1A2A3A'}}>📝 {w.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Workout modal */}
      {showModal && (
        <WorkoutModal
          profileId={profileId}
          editWorkout={editId ? workouts.find(w=>w.id===editId) : null}
          onSave={()=>{refresh();setShowModal(false);setEditId(null)}}
          onClose={()=>{setShowModal(false);setEditId(null)}}
        />
      )}
    </div>
  )
}

// ── WORKOUT MODAL ─────────────────────────────────────────
function WorkoutModal({profileId, editWorkout, onSave, onClose}: {profileId: string, editWorkout: any, onSave: ()=>void, onClose: ()=>void}) {
  const [form, setForm] = useState(()=>editWorkout ? {...editWorkout,exercises:[...editWorkout.exercises]} : createEmptyWorkout())

  const setField    = (k: string,v: any) => setForm((f: any)=>({...f,[k]:v}))
  const addExercise = ()           => setForm((f: any)=>({...f,exercises:[...f.exercises,createEmptyExercise()]}))
  const removeEx    = (id: string) => setForm((f: any)=>({...f,exercises:f.exercises.filter((e: any)=>e.id!==id)}))
  const updateEx    = (id: string,k: string,v: any) => setForm((f: any)=>({...f,exercises:f.exercises.map((e: any)=>e.id===id?{...e,[k]:v}:e)}))
  const addSetRow   = (exId: string) => setForm((f: any)=>({...f,exercises:f.exercises.map((e: any)=>e.id===exId?{...e,setRows:[...e.setRows,createEmptySetRow()]}:e)}))
  const removeSetRow= (exId: string,rowId: string) => setForm((f: any)=>({...f,exercises:f.exercises.map((e: any)=>e.id===exId?{...e,setRows:e.setRows.filter((r: any)=>r.id!==rowId)}:e)}))
  const updateSetRow= (exId: string,rowId: string,k: string,v: any) => setForm((f: any)=>({...f,exercises:f.exercises.map((e: any)=>e.id===exId?{...e,setRows:e.setRows.map((r: any)=>r.id===rowId?{...r,[k]:v}:r)}:e)}))

  const save = () => { DB.saveWorkout(profileId,form); onSave() }

  return (
    <Modal title={editWorkout?'Edit Workout':'Log Workout'} onClose={onClose} width={700}>
      <Row>
        <Input label="Workout name" value={form.name} onChange={v=>setField('name',v)} placeholder="e.g. Push Day A"/>
        <Input label="Date" type="date" value={form.date} onChange={v=>setField('date',v)}/>
      </Row>
      <Row>
        <Select label="Category" value={form.category} onChange={v=>setField('category',v)} options={WORKOUT_CATEGORIES}/>
        <Input label="Duration (min)" type="number" value={form.duration} onChange={v=>setField('duration',v)} placeholder="60"/>
      </Row>

      <SectionTitle>Exercises</SectionTitle>
      {form.exercises.map((ex: any,i: number)=>(
        <div key={ex.id} style={{background:'#131920',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
          {/* Exercise header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <span style={{fontFamily:'monospace',fontSize:10,color:C.text,letterSpacing:'0.08em'}}>EXERCISE {i+1}</span>
            <button onClick={()=>removeEx(ex.id)} style={{background:'none',border:'none',color:'#FF4D6A',fontSize:11,cursor:'pointer',fontFamily:'monospace'}}>✕ remove</button>
          </div>
          {/* Exercise name + muscle group + unit */}
          <Row>
            <Input label="Exercise name" value={ex.name} onChange={v=>updateEx(ex.id,'name',v)} placeholder="e.g. Bench Press"/>
            <Select label="Muscle group" value={ex.muscleGroup||'Chest'} onChange={v=>updateEx(ex.id,'muscleGroup',v)} options={MUSCLE_GROUPS}/>
            <Select label="Unit" value={ex.unit} onChange={v=>updateEx(ex.id,'unit',v)} options={['kg','lbs','bodyweight']}/>
          </Row>

          {/* Per-set rows */}
          <div style={{marginTop:8}}>
            <div style={{display:'grid',gridTemplateColumns:'40px 1fr 1fr 32px',gap:6,marginBottom:4}}>
              {['SET','REPS', ex.unit==='bodyweight'?'NOTE':'WEIGHT',''].map(h=>(
                <div key={h} style={{fontFamily:'monospace',fontSize:9,color:C.text,letterSpacing:'0.08em',padding:'0 2px'}}>{h}</div>
              ))}
            </div>
            {(ex.setRows||[]).map((row: any,si: number)=>(
              <div key={row.id} style={{display:'grid',gridTemplateColumns:'40px 1fr 1fr 32px',gap:6,marginBottom:6,alignItems:'center'}}>
                <div style={{fontFamily:'monospace',fontSize:11,color:C.text,textAlign:'center',background:'#0D1117',borderRadius:4,padding:'6px 0'}}>{si+1}</div>
                <input type="number" step="1" placeholder="10" value={row.reps} onChange={e=>updateSetRow(ex.id,row.id,'reps',e.target.value)}
                  style={{...inputStyle,textAlign:'center'}} onWheel={e=>e.currentTarget.blur()}/>
                {ex.unit==='bodyweight'
                  ? <input type="text" placeholder="note" value={row.weight} onChange={e=>updateSetRow(ex.id,row.id,'weight',e.target.value)} style={{...inputStyle,textAlign:'center'}}/>
                  : <input type="number" step="0.5" placeholder="0" value={row.weight} onChange={e=>updateSetRow(ex.id,row.id,'weight',e.target.value)} style={{...inputStyle,textAlign:'center'}} onWheel={e=>e.currentTarget.blur()}/>
                }
                <button onClick={()=>removeSetRow(ex.id,row.id)} style={{background:'none',border:'none',color:'#2A3A4A',fontSize:14,cursor:'pointer',lineHeight:1}}>✕</button>
              </div>
            ))}
            <button onClick={()=>addSetRow(ex.id)} style={{fontFamily:'monospace',fontSize:11,color:C.cyan,background:'none',border:'1px dashed rgba(0,212,255,0.3)',borderRadius:6,padding:'5px 0',width:'100%',cursor:'pointer',marginTop:2}}>
              ＋ add set
            </button>
          </div>
        </div>
      ))}

      <Btn onClick={addExercise} variant="cyan" style={{width:'100%',marginBottom:14,textAlign:'center'}}>＋ Add Exercise</Btn>

      <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:14}}>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="How did it feel? Any PRs?" rows={3}
          style={{...inputStyle,resize:'vertical',lineHeight:1.5}}/>
      </div>

      <Btn onClick={save} variant="primary" style={{width:'100%'}}>✓ Save Workout</Btn>
    </Modal>
  )
}

// ── ANALYTICS ─────────────────────────────────────────────
function Analytics({entries}: {entries: any[]}) {
  const [lineKey, setLineKey] = useState('weight')
  if (!entries.length) return <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#4A5A6A',fontFamily:'monospace'}}>No entries yet.</div>

  const latest   = entries[0]
  const prev     = entries[1]
  const reversed = [...entries].reverse()


  const circData    = ['neck','shoulders','chest','belly','waist','glutes'].map(k=>({name:k.charAt(0).toUpperCase()+k.slice(1),value:parseFloat(latest.measurements[k])||0}))
  const bilateralData = [['Bicep','bicepsL','bicepsR'],['Forearm','forearmsL','forearmsR'],['Thigh','thighsMaxL','thighsMaxR'],['Calf','calvesL','calvesR'],['Ankle','anklesL','anklesR']].map(([n,L,R])=>({name:n,L:parseFloat(latest.bilateral[L])||0,R:parseFloat(latest.bilateral[R])||0}))
  const bf          = parseFloat(latest.overall.bodyFatPct)||0
  const pieData     = [{name:'Fat mass',value:parseFloat(bf.toFixed(1))},{name:'Lean mass',value:parseFloat((100-bf).toFixed(1))}]
  const maxVal      = Math.max(...circData.map(d=>d.value),1)
  const radarData   = circData.map(d=>({subject:d.name,value:parseFloat(((d.value/maxVal)*100).toFixed(1))}))
  const progressData= reversed.map(e=>({date:e.date.slice(5),weight:parseFloat(e.overall.weight)||null,bf:parseFloat(e.overall.bodyFatPct)||null,waist:parseFloat(e.measurements.waist)||null,chest:parseFloat(e.measurements.chest)||null,bicepsL:parseFloat(e.bilateral.bicepsL)||null}))
  const lines       = [{key:'weight',label:'Weight kg',color:C.cyan},{key:'bf',label:'Body Fat %',color:C.rose},{key:'waist',label:'Waist',color:C.amber},{key:'chest',label:'Chest',color:C.lime},{key:'bicepsL',label:'L Bicep',color:C.purple}]
  const delta       = (a: any,b: any)=>{ const c=parseFloat(a),p=parseFloat(b); return isNaN(c)||isNaN(p)?null:(c-p).toFixed(2) }

  const StatCard = ({label,value,unit,prevVal,inv=false}: {label: string, value: any, unit: string, prevVal?: any, inv?: boolean})=>{
    const d=delta(value,prevVal); const good=d==null?null:(inv?parseFloat(d)<0:parseFloat(d)>0)
    return <div style={{background:'#131920',border:'1px solid #1A2A3A',borderRadius:10,padding:'14px 12px',textAlign:'center'}}>
      <div style={{fontSize:10,color:C.text,fontFamily:'monospace',marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:'#F0F4F8'}}>{value||'–'}<span style={{fontSize:11,color:C.text,fontWeight:400}}> {unit}</span></div>
      {d!==null&&<div style={{fontSize:10,fontFamily:'monospace',color:parseFloat(d)==0?C.text:good?C.lime:C.rose,marginTop:4}}>{parseFloat(d)>0?'▲':'▼'} {Math.abs(parseFloat(d))}</div>}
    </div>
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:24,display:'flex',flexDirection:'column',gap:20,background:'#080C10'}}>
      <div style={{fontSize:22,fontWeight:700,letterSpacing:'-0.02em',color:'#F0F4F8'}}>Progress Analytics</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
        <StatCard label="Weight"   value={latest.overall.weight}     unit="kg" prevVal={prev?.overall.weight}      inv/>
        <StatCard label="Body Fat" value={latest.overall.bodyFatPct} unit="%"  prevVal={prev?.overall.bodyFatPct}  inv/>
        <StatCard label="Waist"    value={latest.measurements.waist} unit="in" prevVal={prev?.measurements.waist} inv/>
        <StatCard label="Chest"    value={latest.measurements.chest} unit="in" prevVal={prev?.measurements.chest}/>
        <StatCard label="L Bicep"  value={latest.bilateral.bicepsL}  unit="in" prevVal={prev?.bilateral.bicepsL}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
        <ChartCard title="Progress over time">
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {lines.map(l=><button key={l.key} onClick={()=>setLineKey(l.key)} style={{padding:'4px 12px',borderRadius:20,fontSize:11,fontFamily:'monospace',cursor:'pointer',border:`1px solid ${lineKey===l.key?l.color:'#1A2A3A'}`,background:lineKey===l.key?l.color+'22':'transparent',color:lineKey===l.key?l.color:C.text}}>{l.label}</button>)}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={progressData} margin={{top:4,right:8,bottom:0,left:-20}}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.grid} vertical={false}/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={ttStyle}/>
              <Line type="monotone" dataKey={lineKey} stroke={lines.find(l=>l.key===lineKey)?.color||C.cyan} strokeWidth={2} dot={{r:3}} activeDot={{r:5}} connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Body composition">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value"><Cell fill={C.rose}/><Cell fill={C.cyan}/></Pie><Tooltip contentStyle={ttStyle} formatter={v=>`${v}%`}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,fontFamily:'monospace',color:C.text}}/></PieChart>
          </ResponsiveContainer>
          <div style={{textAlign:'center'}}><div style={{fontSize:26,fontWeight:700,color:'#F0F4F8'}}>{latest.overall.bodyFatPct||'–'}<span style={{fontSize:12,color:C.text}}> %</span></div><div style={{fontSize:10,color:C.text,fontFamily:'monospace'}}>BODY FAT</div></div>
        </ChartCard>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <ChartCard title="Circumference snapshot (in)">
          <ResponsiveContainer width="100%" height={220}><BarChart data={circData} margin={{top:4,right:8,bottom:0,left:-20}}><CartesianGrid strokeDasharray="2 4" stroke={C.grid} vertical={false}/><XAxis dataKey="name" tick={{fontSize:9,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/><Tooltip contentStyle={ttStyle} formatter={v=>[`${v} in`]}/><Bar dataKey="value" radius={[4,4,0,0]}>{circData.map((_,i)=><Cell key={i} fill={[C.cyan,C.lime,C.amber,C.rose,C.purple,C.teal][i%6]}/>)}</Bar></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Left vs right (in)">
          <ResponsiveContainer width="100%" height={220}><BarChart data={bilateralData} margin={{top:4,right:8,bottom:0,left:-20}}><CartesianGrid strokeDasharray="2 4" stroke={C.grid} vertical={false}/><XAxis dataKey="name" tick={{fontSize:9,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}} axisLine={false} tickLine={false}/><Tooltip contentStyle={ttStyle} formatter={v=>[`${v} in`]}/><Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,fontFamily:'monospace',color:C.text}}/><Bar dataKey="L" name="Left" fill={C.cyan} radius={[4,4,0,0]}/><Bar dataKey="R" name="Right" fill={C.lime} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:14}}>
        <ChartCard title="Body shape radar">
          <ResponsiveContainer width="100%" height={240}><RadarChart data={radarData}><PolarGrid stroke={C.grid}/><PolarAngleAxis dataKey="subject" tick={{fontSize:10,fill:C.text,fontFamily:'monospace'}}/><Radar name="Shape" dataKey="value" stroke={C.cyan} fill={C.cyan} fillOpacity={0.15} strokeWidth={2}/><Tooltip contentStyle={ttStyle}/></RadarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="All entries">
          <div style={{overflowX:'auto',maxHeight:260,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>{['Date','Weight','BF%','Waist','Chest','L Bicep','R Bicep','L Calf','R Calf'].map(h=><th key={h} style={{padding:'6px 12px',textAlign:'left',fontFamily:'monospace',fontSize:10,color:C.text,borderBottom:'1px solid #1A2A3A',background:'#080C10',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
              <tbody>{entries.map((e,i)=><tr key={e.id} style={{borderBottom:'1px solid #0D1A26'}}>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#F0F4F8',fontWeight:500}}>{e.date}</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:i===0?C.cyan:'#8A9BB0'}}>{e.overall.weight||'–'} kg</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.overall.bodyFatPct||'–'}%</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.measurements.waist||'–'}</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.measurements.chest||'–'}</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.bilateral.bicepsL||'–'}</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.bilateral.bicepsR||'–'}</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.bilateral.calvesL||'–'}</td>
                <td style={{padding:'7px 12px',fontFamily:'monospace',color:'#8A9BB0'}}>{e.bilateral.calvesR||'–'}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────
export default function App() {
  const [profile,      setProfile]      = useState<any>(null)
  const [entries,      setEntries]      = useState<any[]>([])
  const [view,         setView]         = useState('body')
  const [notif,        setNotif]        = useState<string|null>(null)
  const [hoveredId,    setHoveredId]    = useState<string|null>(null)
  const [mousePos,     setMousePos]     = useState({x:0,y:0})
  const [showMeasModal,setShowMeasModal]= useState(false)

  // Load active profile on mount
  useEffect(()=>{
    const savedId = DB.getActiveId()
    const profiles = DB.getProfiles()
    if (savedId) {
      const p = profiles.find(x=>x.id===savedId)
      if (p) { setProfile(p); return }
    }
    // If only one profile exists, auto-select it
    if (profiles.length===1) { setProfile(profiles[0]); DB.setActiveId(profiles[0].id) }
  },[])

  // Load entries whenever profile changes
  useEffect(()=>{
    if (!profile) return
    DB.setActiveId(profile.id)
    seedData(profile.id)
    setEntries(DB.getEntries(profile.id))
  },[profile])

  const showNotif  = (msg: string) => { setNotif(msg); setTimeout(()=>setNotif(null),2500) }
  const saveEntry  = useCallback((entry: any)=>{ DB.saveEntry(profile.id,entry); setEntries(DB.getEntries(profile.id)); showNotif('Entry saved!') },[profile])
  const switchProfile = ()   => { setProfile(null); DB.setActiveId(null) }

  const navBtn = (label: string, target: string) => (
    <button onClick={()=>setView(target)} style={{padding:'6px 16px',borderRadius:6,border:view===target?'1px solid rgba(0,212,255,0.3)':'1px solid transparent',background:view===target?'rgba(0,212,255,0.08)':'transparent',color:view===target?'#00D4FF':'#8A9BB0',fontSize:13,cursor:'pointer',fontFamily:'monospace'}}>
      {label}
    </button>
  )

  // Show profile picker if no profile selected
  if (!profile) return <ProfileScreen onSelect={p=>{setProfile(p)}}/>

  return (
    <>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        input[type=number]{-moz-appearance:textfield;}
        select option{background:#131920;color:#F0F4F8;}
      `}</style>

      <div style={{height:'100vh',display:'flex',flexDirection:'column',background:'#080C10',color:'#F0F4F8'}}>

        {/* NAV */}
        <nav style={{height:52,display:'flex',alignItems:'center',padding:'0 24px',gap:16,borderBottom:'1px solid #0D1A26',background:'#0D1117',flexShrink:0}}>
          <div style={{fontWeight:800,fontSize:18,letterSpacing:'0.12em',color:'#00D4FF',marginRight:16,fontFamily:'monospace'}}>
            SOMA<span style={{color:'#4A5A6A',fontWeight:400}}> /tracker</span>
          </div>
          {navBtn('Body Map','body')}
          {navBtn('Analytics','analytics')}
          {navBtn('Workouts','workouts')}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
            {/* Profile badge */}
            <button onClick={switchProfile} style={{display:'flex',alignItems:'center',gap:7,background:'#131920',border:'1px solid #1A2A3A',borderRadius:20,padding:'4px 12px 4px 8px',cursor:'pointer',color:'#F0F4F8',fontSize:12,fontFamily:'monospace'}}>
              <span style={{fontSize:16}}>{profile.avatar}</span>
              <span>{profile.name}</span>
              <span style={{color:'#4A5A6A',fontSize:10}}>▾</span>
            </button>
            <div style={{fontFamily:'monospace',fontSize:11,color:'#4A5A6A',padding:'3px 10px',background:'#131920',borderRadius:6,border:'1px solid #1A2A3A'}}>
              {entries.length} entries
            </div>
          </div>
        </nav>

        {/* BODY MAP VIEW */}
        {view==='body' && (
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            <div style={{flex:1,position:'relative'}}>
              <Canvas camera={{position:[0,1,3],fov:45}} style={{background:'radial-gradient(ellipse at 50% 30%, #0A1825 0%, #080C10 70%)'}}>
                <ambientLight intensity={0.6}/>
                <directionalLight position={[5,10,5]}  intensity={1.0}/>
                <directionalLight position={[-5,5,-3]} intensity={0.3}/>
                <Suspense fallback={<Html center><div style={{color:'#00D4FF',fontFamily:'monospace',fontSize:13}}>LOADING MODEL...</div></Html>}>
                  <HumanModel setHovered={setHoveredId} setMousePos={setMousePos}/>
                </Suspense>
                <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} minPolarAngle={0} maxPolarAngle={Math.PI} enableDamping dampingFactor={0.05}/>
              </Canvas>

              <HoverPopup part={hoveredId?PART_MAP[hoveredId]:null} entry={entries[0]??null} mouseX={mousePos.x} mouseY={mousePos.y}/>

              {/* ADD MEASUREMENTS BUTTON */}
              <div style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)'}}>
                <button onClick={()=>setShowMeasModal(true)} style={{background:'rgba(0,212,255,0.12)',border:'1px solid rgba(0,212,255,0.4)',borderRadius:30,padding:'10px 28px',color:'#00D4FF',fontFamily:'monospace',fontSize:13,fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',backdropFilter:'blur(8px)',transition:'all 0.2s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(0,212,255,0.22)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(0,212,255,0.12)'}>
                  ＋ Add Measurements
                </button>
              </div>

              <div style={{position:'absolute',bottom:72,left:16,fontFamily:'monospace',fontSize:10,color:'#2A3A4A',pointerEvents:'none'}}>
                drag to rotate · scroll to zoom · hover body parts
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {view==='analytics' && (
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            <Analytics entries={entries}/>
          </div>
        )}

        {/* WORKOUTS VIEW */}
        {view==='workouts' && (
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            <WorkoutPage profileId={profile.id}/>
          </div>
        )}

        {/* MEASUREMENT MODAL */}
        {showMeasModal && (
          <MeasurementModal entries={entries} onSave={saveEntry} onClose={()=>setShowMeasModal(false)}/>
        )}

        {/* NOTIFICATION */}
        {notif && (
          <div style={{position:'fixed',bottom:24,right:24,background:'#1A2330',border:'1px solid rgba(255,255,255,0.2)',borderLeft:'3px solid #00D4FF',borderRadius:10,padding:'12px 16px',fontSize:13,zIndex:1000,fontFamily:'monospace'}}>
            {notif}
          </div>
        )}
      </div>
    </>
  )
}
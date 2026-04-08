import { useState, useEffect, useCallback } from 'react';
import {
  Users, BookOpen, Calendar, TrendingUp, LogOut, Plus, Search,
  Home, BarChart2, Edit2, Trash2, ClipboardList, FileText,
  ChevronRight, Award, KeyRound, Eye, EyeOff, Menu, X as XIcon
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  C, AvatarCircle, StatCard, Badge, FieldInput, Btn, Modal, Spinner, Empty, gradeOf, gradeColor
} from '../components/UI';
import { studentAPI, attendanceAPI, resultAPI } from '../utils/api';

// ── Sidebar ───────────────────────────────────────────────────────────────
const TABS = [
  { id:'overview',    icon:Home,          label:'Overview'   },
  { id:'students',    icon:Users,          label:'Students'   },
  { id:'attendance',  icon:Calendar,       label:'Attendance' },
  { id:'results',     icon:ClipboardList,  label:'Results'    },
  { id:'analytics',   icon:BarChart2,      label:'Analytics'  },
];

function Sidebar({ tab, setTab, user, onLogout, isOpen, onClose, isMobile }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div onClick={onClose} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.45)",
          zIndex:199,backdropFilter:"blur(2px)"
        }}/>
      )}

      <div style={{
        width:228, background:C.sidebar, display:"flex", flexDirection:"column",
        height:"100vh", flexShrink:0,
        ...(isMobile ? {
          position:"fixed", top:0, left:0, zIndex:200,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform .25s cubic-bezier(.4,0,.2,1)",
          boxShadow: isOpen ? "4px 0 32px rgba(0,0,0,.25)" : "none",
        } : {
          position:"sticky", top:0,
        })
      }}>
        {/* Brand */}
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <BookOpen size={15} color="#F0EDE9"/>
              </div>
              <span style={{color:"#F0EDE9",fontFamily:"'Instrument Serif',serif",fontSize:17,letterSpacing:"-0.3px"}}>StudentHub</span>
            </div>
            {isMobile && (
              <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,padding:"6px",cursor:"pointer",color:"#F0EDE9",display:"flex",alignItems:"center"}}>
                <XIcon size={16}/>
              </button>
            )}
          </div>
          {/* User */}
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <AvatarCircle init={user.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'T'} src={user.avatar} size={32}/>
            <div style={{overflow:"hidden",flex:1}}>
              <div style={{color:"#F0EDE9",fontWeight:500,fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
              <div style={{color:"rgba(240,237,233,.45)",fontSize:10,letterSpacing:"0.3px"}}>Teacher · Google</div>
            </div>
          </div>
        </div>

        <nav style={{flex:1,padding:"16px 10px",overflow:"auto"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if(isMobile) onClose(); }}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:10,border:"none",cursor:"pointer",
                background:tab===t.id?"rgba(255,255,255,.12)":"transparent",
                color:tab===t.id?"#F0EDE9":"rgba(240,237,233,.5)",fontWeight:tab===t.id?600:400,fontSize:14,
                marginBottom:2,textAlign:"left",transition:"all .15s"}}>
              <t.icon size={16}/>
              {t.label}
              {tab===t.id && <ChevronRight size={12} style={{marginLeft:"auto",color:"rgba(240,237,233,.4)"}}/>}
            </button>
          ))}
        </nav>

        <div style={{padding:"16px 10px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <button onClick={onLogout}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:10,border:"none",
              cursor:"pointer",background:"transparent",color:"rgba(240,237,233,.5)",fontSize:14,fontWeight:500}}>
            <LogOut size={16}/>Logout
          </button>
        </div>
      </div>
    </>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ showNotif }) {
  const [stats,   setStats]   = useState(null);
  const [attStats,setAttStats] = useState(null);
  const [perfStats,setPerfStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now  = new Date();
    const year = now.getFullYear();
    const from = `${year}-01-01`;
    const to   = now.toISOString().slice(0, 10); // today
    Promise.all([
      studentAPI.getStats(),
      attendanceAPI.getClassStats({ from, to }),
      resultAPI.getStats(),
    ]).then(([s, a, p]) => {
      setStats(s.data.stats);
      setAttStats(a.data.stats);
      setPerfStats(p.data);
    }).catch(() => showNotif('Failed to load overview', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner/>;

  const gradeData = (perfStats?.gradeDistribution || []).map(g => ({ name:g._id, v:g.count }));
  const GRADE_COLORS = { 'A+':C.accent,'A':C.accentL,'B+':C.info,'B':C.purple,'C+':C.warning,'C':C.danger };

  // ── Attendance breakdown card ────────────────────────────────────────────
  const attTotal   = (attStats?.present||0) + (attStats?.absent||0) + (attStats?.late||0);
  const attPct     = attStats?.percentage || 0;
  const presentPct = attTotal ? Math.round((attStats?.present||0) / attTotal * 100) : 0;
  const absentPct  = attTotal ? Math.round((attStats?.absent||0)  / attTotal * 100) : 0;
  const latePct    = attTotal ? Math.round((attStats?.late||0)    / attTotal * 100) : 0;

  // SVG donut ring helper
  const DONUT_R = 38, DONUT_C = 50, STROKE = 9;
  const circ = 2 * Math.PI * DONUT_R;
  const donutSlices = [
    { pct: presentPct, color: "#1a7a4a", offset: 0 },
    { pct: latePct,    color: "#b7770d", offset: presentPct },
    { pct: absentPct,  color: "#c0392b", offset: presentPct + latePct },
  ].map(s => ({
    ...s,
    dash:   (s.pct / 100) * circ,
    rotate: (s.offset / 100) * 360 - 90,
  }));

  const AttCard = () => {
    const [hov, setHov] = useState(false);
    return (
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.card, border:`1px solid ${hov ? C.accent+'55' : C.border}`,
          borderRadius:14, padding:22,
          boxShadow: hov ? "0 6px 24px rgba(0,0,0,.10)" : "0 1px 4px rgba(0,0,0,.05)",
          transition:"all .22s cubic-bezier(.4,0,.2,1)",
          transform: hov ? "translateY(-2px)" : "translateY(0)",
        }}>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <span style={{ fontSize:11, color:C.text4, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.9px" }}>Attendance Rate</span>
          <div style={{ background: hov ? `${C.accent}15` : C.card2, border:`1px solid ${C.border}`, borderRadius:9, padding:8, transition:"background .2s" }}>
            <Calendar size={15} color={hov ? C.accent : C.text3}/>
          </div>
        </div>

        {/* donut + centre % */}
        <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:16 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <svg width={100} height={100} viewBox="0 0 100 100">
              {/* track */}
              <circle cx={DONUT_C} cy={DONUT_C} r={DONUT_R} fill="none" stroke={C.card2} strokeWidth={STROKE}/>
              {/* slices */}
              {attTotal === 0 ? (
                <circle cx={DONUT_C} cy={DONUT_C} r={DONUT_R} fill="none" stroke={C.border} strokeWidth={STROKE}
                  strokeDasharray={`${circ} ${circ}`} strokeLinecap="round"/>
              ) : donutSlices.map((s, i) => (
                <circle key={i} cx={DONUT_C} cy={DONUT_C} r={DONUT_R} fill="none"
                  stroke={s.color} strokeWidth={STROKE}
                  strokeDasharray={`${s.dash} ${circ - s.dash}`}
                  strokeDashoffset={0}
                  style={{ transform:`rotate(${s.rotate}deg)`, transformOrigin:"50% 50%", transition:"stroke-dasharray .7s ease" }}
                  strokeLinecap="butt"
                />
              ))}
            </svg>
            {/* centre label */}
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:20, fontWeight:700, color:C.text, fontFamily:"'Instrument Serif',serif", lineHeight:1 }}>{attPct}%</span>
              <span style={{ fontSize:9, color:C.text4, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>Rate</span>
            </div>
          </div>

          {/* right side stats */}
          <div style={{ flex:1 }}>
            {[
              { label:"Present", count: attStats?.present||0, pct: presentPct, color:"#1a7a4a", track:"#e6f7f0" },
              { label:"Absent",  count: attStats?.absent||0,  pct: absentPct,  color:"#c0392b", track:"#fdecea" },
              { label:"Late",    count: attStats?.late||0,    pct: latePct,    color:"#b7770d", track:"#fef6e4" },
            ].map(({ label, count, pct, color, track }) => (
              <div key={label} style={{ marginBottom:9 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:C.text3 }}>{label}</span>
                  <span style={{ fontSize:11, fontWeight:700, color }}>{count} <span style={{ color:C.text4, fontWeight:400 }}>({pct}%)</span></span>
                </div>
                <div style={{ height:4, background:track, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width .7s ease" }}/>
                </div>
              </div>
            ))}
            <div style={{ fontSize:10, color:C.text4, marginTop:4 }}>{attTotal} total records · {new Date().getFullYear()}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text,marginBottom:20}}>Dashboard Overview</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:24}}>
        <StatCard icon={Users}     label="Total Students"  value={stats?.total||0}  sub={`${stats?.active||0} active`} color={C.accent}/>
        <AttCard/>
        <StatCard icon={TrendingUp} label="Avg Performance" value={`${(perfStats?.subjectAverages?.reduce((a,s)=>a+s.avg,0)/Math.max(perfStats?.subjectAverages?.length||1,1)).toFixed(1)||0}%`} sub="All subjects" color={C.purple}/>
        <StatCard icon={Award}     label="Top Grade (A+)"  value={gradeData.find(g=>g.name==='A+')?.v||0} sub="Students" color={C.warning}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}} className="two-col">
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fill:C.text4,fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.text4,fontSize:12}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12}}/>
              <Bar dataKey="v" name="Students" radius={[6,6,0,0]}>
                {gradeData.map((g,i) => <Cell key={i} fill={GRADE_COLORS[g.name]||C.accent}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>Subject Averages</h3>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(perfStats?.subjectAverages||[]).slice(0,5).map(s => (
              <div key={s.subject}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.text2,fontSize:13}}>{s.subject}</span>
                  <span style={{color:C.accent,fontWeight:600,fontSize:13}}>{s.avg}%</span>
                </div>
                <div style={{height:6,background:C.card2,borderRadius:3}}>
                  <div style={{width:`${s.avg}%`,height:"100%",background:C.accent,borderRadius:3,transition:"width .5s"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top students */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:16}}>🏆 Top Performers</h3>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(perfStats?.topStudents||[]).map((s,i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C.card2,borderRadius:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:[`${C.warning}22`,`${C.text3}22`,`${C.warning}22`][i]||`${C.accent}18`,
                display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:[C.warning,C.text3,C.warning][i]||C.accent}}>
                {i+1}
              </div>
              <AvatarCircle init={s.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'S'} size={34}/>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontWeight:600,fontSize:13}}>{s.name}</div>
                <div style={{color:C.text4,fontSize:12}}>{s.roll}</div>
              </div>
              <div style={{background:`${C.accent}18`,borderRadius:8,padding:"4px 12px",color:C.accent,fontWeight:700,fontSize:14}}>
                {s.avgPct}%
              </div>
            </div>
          ))}
          {!perfStats?.topStudents?.length && <Empty icon={Award} message="No result data yet"/>}
        </div>
      </div>
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────────────────
function StudentsTab({ showNotif }) {
  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [cls,         setCls]         = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [form,        setForm]        = useState({ name:'',roll:'',email:'',class:'',phone:'',username:'',password:'' });
  const [saving,      setSaving]      = useState(false);
  const [showPw,      setShowPw]      = useState(false);

  // Reset password modal state
  const [resetTarget, setResetTarget]   = useState(null);   // student object
  const [newPw,       setNewPw]         = useState('');
  const [showNewPw,   setShowNewPw]     = useState(false);
  const [resetting,   setResetting]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    studentAPI.getAll({ search, cls, limit:50 })
      .then(r => setStudents(r.data.students))
      .catch(() => showNotif('Failed to load students','error'))
      .finally(() => setLoading(false));
  }, [search, cls]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name:'',roll:'',email:'',class:'',phone:'',username:'',password:'' });
    setShowPw(false);
    setShowModal(true);
  };
  const openEdit = s => {
    setEditing(s);
    setForm({ name:s.name, roll:s.roll, email:s.email, class:s.class, phone:s.phone||'', username:'', password:'' });
    setShowModal(true);
  };
  const openReset = s => { setResetTarget(s); setNewPw(''); setShowNewPw(false); };

  const handleSave = async () => {
    if (!form.name||!form.roll||!form.email||!form.class) return showNotif('Fill all required fields','error');
    if (!editing && !form.username) return showNotif('Username is required','error');
    if (!editing && form.username.trim().length < 3) return showNotif('Username must be at least 3 characters','error');
    if (!editing && !form.password) return showNotif('Password is required for new student','error');
    if (!editing && form.password.length < 6) return showNotif('Password must be at least 6 characters','error');
    setSaving(true);
    try {
      if (editing) {
        const fd = new FormData();
        ['name','class','phone'].forEach(k => fd.append(k, form[k]));
        await studentAPI.update(editing._id, fd);
        showNotif('Student updated','success');
      } else {
        await studentAPI.create({ name:form.name, roll:form.roll, email:form.email, class:form.class, phone:form.phone, username:form.username, password:form.password });
        showNotif(`Student added. They can log in with: ${form.email}`);
      }
      setShowModal(false); load();
    } catch (err) { showNotif(err.response?.data?.message||'Save failed','error'); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!newPw || newPw.length < 6) return showNotif('New password must be at least 6 characters','error');
    setResetting(true);
    try {
      await studentAPI.resetPassword(resetTarget._id, { newPassword: newPw });
      showNotif(`Student added. They can log in with: ${form.email}`);
      setResetTarget(null);
    } catch (err) { showNotif(err.response?.data?.message||'Reset failed','error'); }
    finally { setResetting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student and all their records?')) return;
    try { await studentAPI.delete(id); showNotif('Deleted','success'); load(); }
    catch { showNotif('Delete failed','error'); }
  };

  const pwField = (label, val, set, show, setShow) => (
    <div style={{marginBottom:16}}>
      <label style={{display:'block',marginBottom:6,fontSize:13,color:C.text3,fontWeight:500}}>{label}</label>
      <div style={{position:'relative'}}>
        <input type={show?'text':'password'} value={val} onChange={e=>set(e.target.value)}
          placeholder="Min 6 characters"
          style={{width:'100%',boxSizing:'border-box',background:C.card2,border:`1px solid ${C.border2}`,
            borderRadius:10,padding:'11px 44px 11px 14px',color:C.text,fontSize:14,outline:'none'}}/>
        <button type="button" onClick={()=>setShow(p=>!p)}
          style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:C.text3}}>
          {show ? <EyeOff size={15}/> : <Eye size={15}/>}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text}}>Students</h2>
        <Btn onClick={openCreate} style={{display:"flex",alignItems:"center",gap:6}}><Plus size={15}/>Add Student</Btn>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:20}}>
        <div style={{flex:1,position:"relative"}}>
          <Search size={15} style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:C.text4}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, roll, email…"
            style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px 10px 38px",color:C.text,fontSize:14,outline:"none"}}/>
        </div>
        <select value={cls} onChange={e=>setCls(e.target.value)}
          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",color:C.text3,fontSize:14,outline:"none",cursor:"pointer"}}>
          <option value="">All Classes</option>
          {['10-A','10-B','11-A','11-B','12-A','12-B'].map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? <Spinner/> : (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%",minWidth:640,borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                {['Student','Roll No','Username','Class','Status','Actions'].map(h => (
                  <th key={h} style={{padding:"14px 16px",textAlign:"left",color:C.text4,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.8px"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id} style={{borderBottom:`1px solid ${C.border}`,transition:"background .15s",cursor:"default"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.card2}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <AvatarCircle init={s.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'S'} src={s.avatar} size={34}/>
                      <div>
                        <div style={{color:C.text,fontWeight:600,fontSize:13}}>{s.name}</div>
                        <div style={{color:C.text4,fontSize:12}}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"14px 16px",color:C.text2,fontSize:13}}>{s.roll}</td>
                  <td style={{padding:"14px 16px"}}>
                    <span style={{background:`${C.accent}15`,color:C.accent,borderRadius:6,padding:'3px 9px',fontSize:12,fontFamily:'monospace',fontWeight:600}}>@{s._username||s.roll}</span>
                  </td>
                  <td style={{padding:"14px 16px",color:C.text2,fontSize:13}}>{s.class}</td>
                  <td style={{padding:"14px 16px"}}><Badge status={s.status}/></td>
                  <td style={{padding:"14px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEdit(s)} title="Edit student"
                        style={{background:`${C.info}18`,border:"none",color:C.info,borderRadius:7,padding:"6px 10px",cursor:"pointer",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.info;e.currentTarget.style.color="#fff";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 10px ${C.info}44`}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${C.info}18`;e.currentTarget.style.color=C.info;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
                      ><Edit2 size={13}/></button>
                      <button onClick={()=>openReset(s)} title="Reset password"
                        style={{background:`${C.warning}18`,border:"none",color:C.warning,borderRadius:7,padding:"6px 10px",cursor:"pointer",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.warning;e.currentTarget.style.color="#fff";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 10px ${C.warning}44`}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${C.warning}18`;e.currentTarget.style.color=C.warning;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
                      ><KeyRound size={13}/></button>
                      <button onClick={()=>handleDelete(s._id)} title="Delete student"
                        style={{background:`${C.danger}18`,border:"none",color:C.danger,borderRadius:7,padding:"6px 10px",cursor:"pointer",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.danger;e.currentTarget.style.color="#fff";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 10px ${C.danger}44`}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${C.danger}18`;e.currentTarget.style.color=C.danger;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
                      ><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {!students.length && <Empty icon={Users} message="No students found"/>}
        </div>
      )}

      {/* ── Add / Edit Student Modal ── */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?"Edit Student":"Add Student & Create Login"}>
        <FieldInput label="Full Name *"   value={form.name}  onChange={v=>setForm(f=>({...f,name:v}))}  placeholder="Arjun Mehra"/>
        {!editing && <FieldInput label="Roll Number *" value={form.roll}  onChange={v=>setForm(f=>({...f,roll:v}))}  placeholder="CS2024001"/>}
        {!editing && <FieldInput label="Email *"       value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email" placeholder="arjun@school.edu"/>}
        {!editing && (
          <div style={{marginBottom:16}}>
            <label style={{display:'block',marginBottom:6,fontSize:13,color:C.text3,fontWeight:500}}>Username * <span style={{color:C.text4,fontWeight:400,fontSize:11}}>(student uses this to log in)</span></label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:C.text4,fontSize:13,pointerEvents:'none'}}>@</span>
              <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value.toLowerCase().replace(/\s+/g,'.')}))}
                placeholder="arjun.sharma"
                style={{width:'100%',boxSizing:'border-box',background:C.card2,border:`1px solid ${C.border2}`,borderRadius:10,padding:'11px 14px 11px 30px',color:C.text,fontSize:14,outline:'none'}}/>
            </div>
            <p style={{fontSize:11,color:C.text4,marginTop:4}}>Spaces become dots automatically. e.g. arjun sharma → arjun.sharma</p>
          </div>
        )}
        <div style={{marginBottom:16}}>
          <label style={{display:"block",marginBottom:6,fontSize:13,color:C.text3,fontWeight:500}}>Class *</label>
          <select value={form.class} onChange={e=>setForm(f=>({...f,class:e.target.value}))}
            style={{width:"100%",background:C.card2,border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:14,outline:"none"}}>
            <option value="">Select class</option>
            {['10-A','10-B','11-A','11-B','12-A','12-B'].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <FieldInput label="Phone" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="+91 98765 43210"/>
        {!editing && (
          <>
            <div style={{margin:"4px 0 14px",padding:10,background:`${C.accent}0d`,borderRadius:9,border:`1px solid ${C.accent}22`,fontSize:12,color:C.text3}}>
              🔑 Set the initial login password for this student. Share it with them directly.
            </div>
            {pwField("Login Password *", form.password, v=>setForm(f=>({...f,password:v})), showPw, setShowPw)}
          </>
        )}
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn variant="ghost" onClick={()=>setShowModal(false)} style={{flex:1}}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} style={{flex:1}}>{saving?"Saving…":editing?"Update Student":"Add Student"}</Btn>
        </div>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal open={!!resetTarget} onClose={()=>setResetTarget(null)} title="Reset Student Password">
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{width:52,height:52,borderRadius:14,background:`${C.warning}18`,border:`1px solid ${C.warning}33`,
            display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
            <KeyRound size={22} color={C.warning}/>
          </div>
          <p style={{color:C.text2,fontSize:14}}>Resetting password for</p>
          <p style={{color:C.text,fontWeight:700,fontSize:16}}>{resetTarget?.name}</p>
          <p style={{color:C.text4,fontSize:12,marginTop:2}}>{resetTarget?.email}</p>
        </div>
        <div style={{marginBottom:16,padding:10,background:`${C.warning}0d`,borderRadius:9,border:`1px solid ${C.warning}22`,fontSize:12,color:C.text3}}>
          ⚠️ The student will need to use this new password to log in. Share it with them securely.
        </div>
        {pwField("New Password", newPw, setNewPw, showNewPw, setShowNewPw)}
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn variant="ghost" onClick={()=>setResetTarget(null)} style={{flex:1}}>Cancel</Btn>
          <Btn onClick={handleResetPassword} disabled={resetting} style={{flex:1,background:C.warning,color:"#000"}}>
            {resetting?"Resetting…":"Reset Password"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── Attendance Tab ────────────────────────────────────────────────────────
function AttendanceTab({ showNotif }) {
  const today = new Date().toISOString().split('T')[0];
  const [date,     setDate]     = useState(today);
  const [cls,      setCls]      = useState('10-A');
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [map,      setMap]      = useState({});

  const load = () => {
    setLoading(true);
    attendanceAPI.getByDate({ date, cls })
      .then(r => {
        setRecords(r.data.attendance);
        const m = {};
        r.data.attendance.forEach(a => { m[a._id] = a.status || 'present'; });
        setMap(m);
      })
      .catch(() => showNotif('Failed to load attendance','error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date, cls]);

  const toggle = (id, status) => setMap(m => ({ ...m, [id]: status }));

  const markAll = (status) => {
    const m = {};
    records.forEach(r => { m[r._id] = status; });
    setMap(m);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recs = records.map(r => ({ studentId: r._id, status: map[r._id] || 'present' }));
      await attendanceAPI.mark({ date, records: recs });
      showNotif('Attendance saved!', 'success');
    } catch { showNotif('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const present = Object.values(map).filter(v=>v==='present').length;
  const absent  = Object.values(map).filter(v=>v==='absent').length;
  const late    = Object.values(map).filter(v=>v==='late').length;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text}}>Attendance</h2>
        <Btn onClick={handleSave} disabled={saving||!records.length}>
          {saving ? 'Saving…' : '💾 Save Attendance'}
        </Btn>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,outline:"none"}}/>
        <select value={cls} onChange={e=>setCls(e.target.value)}
          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",color:C.text,fontSize:14,outline:"none",cursor:"pointer"}}>
          {['10-A','10-B','11-A','11-B','12-A','12-B'].map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{display:"flex",gap:8}}>
          {['present','absent','late'].map(s => (
            <button key={s} onClick={()=>markAll(s)}
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 14px",color:C.text3,fontSize:12,cursor:"pointer",fontWeight:500,textTransform:"capitalize"}}>
              All {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {records.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}} className="three-col">
          {[{l:"Present",v:present,c:C.accent},{l:"Absent",v:absent,c:C.danger},{l:"Late",v:late,c:C.warning}].map(s=>(
            <div key={s.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:800,color:s.c,fontFamily:"'Syne',sans-serif"}}>{s.v}</div>
              <div style={{color:C.text4,fontSize:12,marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <Spinner/> : (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          {records.map((s,i) => (
            <div key={s._id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",
              borderBottom:i<records.length-1?`1px solid ${C.border2}`:"none",
              background:map[s._id]==='absent'?`${C.danger}05`:map[s._id]==='late'?`${C.warning}05`:"transparent"}}>
              <AvatarCircle init={s.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'S'} src={s.avatar} size={36}
                color={map[s._id]==='present'?C.accent:map[s._id]==='absent'?C.danger:C.warning}/>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontWeight:600,fontSize:14}}>{s.name}</div>
                <div style={{color:C.text4,fontSize:12}}>{s.roll}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {['present','late','absent'].map(status => {
                  const colors = { present:C.accent, late:C.warning, absent:C.danger };
                  const active = map[s._id] === status;
                  return (
                    <button key={status} onClick={()=>toggle(s._id,status)}
                      style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${active?colors[status]:C.border2}`,
                        background:active?`${colors[status]}22`:"transparent",
                        color:active?colors[status]:C.text4,fontSize:12,cursor:"pointer",
                        fontWeight:active?600:400,textTransform:"capitalize",transition:"all .18s"}}
                      onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background=`${colors[status]}12`; e.currentTarget.style.borderColor=colors[status]; e.currentTarget.style.color=colors[status]; }}}
                      onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=C.border2; e.currentTarget.style.color=C.text4; }}}>
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!records.length && <Empty icon={Calendar} message="No students for this class/date"/>}
        </div>
      )}
    </div>
  );
}

// ── Results Tab ───────────────────────────────────────────────────────────
function ResultsTab({ showNotif }) {
  const [results,  setResults]  = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ studentId:'',subject:'',marks:'',maxMarks:'100',examType:'Mid-term',examDate:'',remarks:'' });
  const [filterCls,setFilterCls] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      resultAPI.getAll({ cls: filterCls, limit:50 }),
      studentAPI.getAll({ limit:100 }),
    ]).then(([r,s]) => { setResults(r.data.results); setStudents(s.data.students); })
      .catch(() => showNotif('Failed to load results','error'))
      .finally(() => setLoading(false));
  },[filterCls]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.studentId||!form.subject||!form.marks||!form.examDate) return showNotif('Fill required fields','error');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      await resultAPI.add(fd);
      showNotif('Result added','success'); setShowModal(false); load();
    } catch(err) { showNotif(err.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this result?')) return;
    try { await resultAPI.delete(id); showNotif('Deleted','success'); load(); }
    catch { showNotif('Delete failed','error'); }
  };

  const SUBJECTS = ['Mathematics','Science','English','Computer Science','History','Physics','Chemistry','Biology'];
  const EXAM_TYPES = ['Mid-term','Final','Unit-test','Quiz','Assignment'];

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text}}>Results</h2>
        <Btn onClick={()=>{ setForm({studentId:'',subject:'',marks:'',maxMarks:'100',examType:'Mid-term',examDate:'',remarks:''}); setShowModal(true); }}
          style={{display:"flex",alignItems:"center",gap:6}}><Plus size={15}/>Add Result</Btn>
      </div>

      <select value={filterCls} onChange={e=>setFilterCls(e.target.value)}
        style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",color:C.text3,fontSize:14,outline:"none",cursor:"pointer",marginBottom:16}}>
        <option value="">All Classes</option>
        {['10-A','10-B','11-A','11-B'].map(c=><option key={c} value={c}>{c}</option>)}
      </select>

      {loading ? <Spinner/> : (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%",minWidth:640,borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                {['Student','Subject','Exam','Marks','Grade','Date','Action'].map(h=>(
                  <th key={h} style={{padding:"13px 16px",textAlign:"left",color:C.text4,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.8px"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const g = gradeOf((r.marks/r.maxMarks)*100);
                return (
                  <tr key={r._id} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"13px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <AvatarCircle init={r.student?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'S'} src={r.student?.avatar} size={30}/>
                        <div>
                          <div style={{color:C.text,fontWeight:500,fontSize:13}}>{r.student?.name}</div>
                          <div style={{color:C.text4,fontSize:11}}>{r.student?.class}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"13px 16px",color:C.text2,fontSize:13}}>{r.subject}</td>
                    <td style={{padding:"13px 16px",color:C.text2,fontSize:13}}>{r.examType}</td>
                    <td style={{padding:"13px 16px",color:C.text,fontWeight:600,fontSize:13}}>{r.marks}/{r.maxMarks}</td>
                    <td style={{padding:"13px 16px"}}>
                      <span style={{color:gradeColor(g),fontWeight:700,fontSize:14}}>{g}</span>
                    </td>
                    <td style={{padding:"13px 16px",color:C.text4,fontSize:12}}>{r.examDate?.slice(0,10)}</td>
                    <td style={{padding:"13px 16px"}}>
                      <button onClick={()=>handleDelete(r._id)} style={{background:`${C.danger}18`,border:"none",color:C.danger,borderRadius:7,padding:"6px 10px",cursor:"pointer",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.danger;e.currentTarget.style.color="#fff";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 10px ${C.danger}44`}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${C.danger}18`;e.currentTarget.style.color=C.danger;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
                      ><Trash2 size={13}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {!results.length && <Empty icon={FileText} message="No results found"/>}
        </div>
      )}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Add Result">
        <div style={{marginBottom:16}}>
          <label style={{display:"block",marginBottom:6,fontSize:13,color:C.text3,fontWeight:500}}>Student *</label>
          <select value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))}
            style={{width:"100%",background:C.card2,border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:14,outline:"none"}}>
            <option value="">Select student</option>
            {students.map(s=><option key={s._id} value={s._id}>{s.name} – {s.roll}</option>)}
          </select>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",marginBottom:6,fontSize:13,color:C.text3,fontWeight:500}}>Subject *</label>
          <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
            style={{width:"100%",background:C.card2,border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:14,outline:"none"}}>
            <option value="">Select subject</option>
            {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FieldInput label="Marks *"    value={form.marks}    onChange={v=>setForm(f=>({...f,marks:v}))}    type="number" placeholder="85"/>
          <FieldInput label="Max Marks"  value={form.maxMarks} onChange={v=>setForm(f=>({...f,maxMarks:v}))} type="number" placeholder="100"/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",marginBottom:6,fontSize:13,color:C.text3,fontWeight:500}}>Exam Type *</label>
          <select value={form.examType} onChange={e=>setForm(f=>({...f,examType:e.target.value}))}
            style={{width:"100%",background:C.card2,border:`1px solid ${C.border2}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:14,outline:"none"}}>
            {EXAM_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <FieldInput label="Exam Date *" value={form.examDate} onChange={v=>setForm(f=>({...f,examDate:v}))} type="date"/>
        <FieldInput label="Remarks"     value={form.remarks}  onChange={v=>setForm(f=>({...f,remarks:v}))}  placeholder="Optional remarks"/>
        <div style={{display:"flex",gap:10,marginTop:4}}>
          <Btn variant="ghost" onClick={()=>setShowModal(false)} style={{flex:1}}>Cancel</Btn>
          <Btn onClick={handleSave} disabled={saving} style={{flex:1}}>{saving?"Saving…":"Add Result"}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────
function AnalyticsTab({ showNotif }) {
  const [stats, setStats] = useState(null);
  const [attStats, setAttStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      resultAPI.getStats(),
      attendanceAPI.getClassStats(),
    ]).then(([p,a]) => { setStats(p.data); setAttStats(a.data); })
      .catch(() => showNotif('Failed to load analytics','error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner/>;

  const GRADE_COLORS = { 'A+':C.accent,'A':C.accentL,'B+':C.info,'B':C.purple,'C+':C.warning,'C':C.danger };

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text,marginBottom:20}}>Analytics</h2>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}} className="two-col">
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={(stats?.gradeDistribution||[]).map(g=>({name:g._id,value:g.count}))}
                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                {(stats?.gradeDistribution||[]).map((g,i) => <Cell key={i} fill={GRADE_COLORS[g._id]||C.accent}/>)}
              </Pie>
              <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {(stats?.gradeDistribution||[]).map(g=>(
              <div key={g._id} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.text3}}>
                <div style={{width:8,height:8,borderRadius:2,background:GRADE_COLORS[g._id]||C.accent}}/>
                {g._id}: {g.count}
              </div>
            ))}
          </div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>Subject Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.subjectAverages||[]} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
              <XAxis type="number" domain={[0,100]} tick={{fill:C.text4,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="subject" tick={{fill:C.text3,fontSize:11}} axisLine={false} tickLine={false} width={90}/>
              <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12}}/>
              <Bar dataKey="avg" fill={C.accent} radius={[0,5,5,0]} name="Avg %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:16}}>Attendance Summary</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}} className="four-col">
          {[
            {l:"Present",v:attStats?.stats?.present||0,c:C.accent},
            {l:"Absent", v:attStats?.stats?.absent||0, c:C.danger},
            {l:"Late",   v:attStats?.stats?.late||0,   c:C.warning},
            {l:"Rate",   v:`${attStats?.stats?.percentage||0}%`,c:C.info},
          ].map(s=>(
            <div key={s.l} style={{background:C.card2,borderRadius:10,padding:16,textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"'Syne',sans-serif"}}>{s.v}</div>
              <div style={{color:C.text4,fontSize:12,marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Teacher Dashboard ────────────────────────────────────────────────
export default function TeacherDashboard({ user, onLogout, showNotif }) {
  const [tab, setTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // close sidebar when switching to desktop
  useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg}}>
      <Sidebar
        tab={tab} setTab={setTab} user={user} onLogout={onLogout}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile}
      />
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            position:"sticky",top:0,zIndex:100,
            display:"flex",alignItems:"center",gap:12,
            padding:"12px 16px",
            background:C.sidebar,
            borderBottom:"1px solid rgba(255,255,255,.08)"
          }}>
            <button onClick={() => setSidebarOpen(true)}
              style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:9,padding:"8px",cursor:"pointer",color:"#F0EDE9",display:"flex",alignItems:"center"}}>
              <Menu size={18}/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:24,height:24,borderRadius:6,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <BookOpen size={13} color="#F0EDE9"/>
              </div>
              <span style={{color:"#F0EDE9",fontFamily:"'Instrument Serif',serif",fontSize:16,letterSpacing:"-0.3px"}}>StudentHub</span>
            </div>
            <div style={{marginLeft:"auto"}}>
              <AvatarCircle init={user.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'T'} src={user.avatar} size={28}/>
            </div>
          </div>
        )}
        <main style={{flex:1,padding:isMobile?16:32,overflow:"auto",maxHeight:isMobile?"none":"100vh",background:C.bg}}>
          {tab==='overview'   && <OverviewTab   showNotif={showNotif}/>}
          {tab==='students'   && <StudentsTab   showNotif={showNotif}/>}
          {tab==='attendance' && <AttendanceTab showNotif={showNotif}/>}
          {tab==='results'    && <ResultsTab    showNotif={showNotif}/>}
          {tab==='analytics'  && <AnalyticsTab  showNotif={showNotif}/>}
        </main>
      </div>
    </div>
  );
}

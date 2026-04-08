import { useState, useEffect } from 'react';
import {
  Home, Calendar, ClipboardList, TrendingUp, LogOut, ChevronRight,
  Award, BookOpen, Clock, Star, Menu, X as XIcon
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { C, AvatarCircle, StatCard, Badge, Spinner, Empty, gradeOf, gradeColor } from '../components/UI';
import { attendanceAPI, resultAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id:'overview',   icon:Home,         label:'Overview'    },
  { id:'attendance', icon:Calendar,     label:'Attendance'  },
  { id:'results',    icon:ClipboardList,label:'My Results'  },
  { id:'performance',icon:TrendingUp,   label:'Performance' },
];

function Sidebar({ tab, setTab, user, onLogout, isOpen, onClose, isMobile }) {
  return (
    <>
      {isMobile && isOpen && (
        <div onClick={onClose} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.45)",
          zIndex:199,backdropFilter:"blur(2px)"
        }}/>
      )}
      <div style={{
        width:220, background:C.sidebar, display:"flex", flexDirection:"column",
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
        <div style={{padding:"24px 20px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <AvatarCircle init={user.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'S'} src={user.avatar} size={38}/>
              <div style={{overflow:"hidden"}}>
                <div style={{color:C.text,fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
                <div style={{color:C.info,fontSize:11,fontWeight:500}}>Student</div>
              </div>
            </div>
            {isMobile && (
              <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,padding:"6px",cursor:"pointer",color:"#F0EDE9",display:"flex",alignItems:"center",marginLeft:8}}>
                <XIcon size={16}/>
              </button>
            )}
          </div>
          {user.rollNo && <div style={{marginTop:10,background:C.card2,borderRadius:8,padding:"6px 10px",fontSize:12,color:C.text3}}>{user.rollNo} · {user.class}</div>}
        </div>
        <nav style={{flex:1,padding:"16px 10px",overflow:"auto"}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if(isMobile) onClose(); }}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:10,border:"none",cursor:"pointer",
                background:tab===t.id?`${C.info}18`:"transparent",
                color:tab===t.id?C.info:C.text3,fontWeight:tab===t.id?600:400,fontSize:14,
                marginBottom:2,textAlign:"left",transition:"all .15s"}}>
              <t.icon size={16}/>{t.label}
              {tab===t.id && <ChevronRight size={12} style={{marginLeft:"auto"}}/>}
            </button>
          ))}
        </nav>
        <div style={{padding:"16px 10px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <button onClick={onLogout}
            style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:10,border:"none",cursor:"pointer",background:"transparent",color:"rgba(240,237,233,.5)",fontSize:14,fontWeight:500}}>
            <LogOut size={16}/>Logout
          </button>
        </div>
      </div>
    </>
  );
}

// ── Student Overview ──────────────────────────────────────────────────────
function StudentOverview({ studentId, showNotif }) {
  const [attSum, setAttSum]  = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      attendanceAPI.getForStudent(studentId),
      resultAPI.getForStudent(studentId),
    ]).then(([a,r]) => {
      setAttSum(a.data.summary);
      setResults(r.data.results);
    }).catch(() => showNotif('Failed to load data','error'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Spinner/>;

  const recent = results.slice(0,5);
  const avgScore = results.length
    ? (results.reduce((a,r)=>(a + r.marks/r.maxMarks*100), 0) / results.length).toFixed(1)
    : 0;

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text,marginBottom:20}}>My Dashboard</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:24}}>
        <StatCard icon={Calendar}  label="Attendance"    value={`${attSum?.percentage||0}%`} sub={`${attSum?.present||0} present / ${attSum?.absent||0} absent`} color={C.info} trend={attSum?.percentage>=75?"up":"down"}/>
        <StatCard icon={TrendingUp} label="Avg Score"    value={`${avgScore}%`} sub={`${results.length} exams`} color={C.accent}/>
        <StatCard icon={Award}     label="Best Grade"    value={results.length?gradeOf(Math.max(...results.map(r=>r.marks/r.maxMarks*100))):'—'} sub="Overall" color={C.warning}/>
        <StatCard icon={BookOpen}  label="Total Exams"   value={results.length} sub="Completed" color={C.purple}/>
      </div>

      {/* Recent results */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:16}}>Recent Results</h3>
        {recent.length ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {recent.map(r => {
              const pct = Math.round(r.marks/r.maxMarks*100);
              const g   = gradeOf(pct);
              return (
                <div key={r._id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:C.card2,borderRadius:10}}>
                  <div style={{width:42,height:42,borderRadius:10,background:`${gradeColor(g)}18`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,color:gradeColor(g),fontFamily:"'Syne',sans-serif"}}>{g}</div>
                  <div style={{flex:1}}>
                    <div style={{color:C.text,fontWeight:600,fontSize:14}}>{r.subject}</div>
                    <div style={{color:C.text4,fontSize:12}}>{r.examType} · {r.examDate?.slice(0,10)}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"#F0EDE9",fontWeight:700,fontSize:15}}>{r.marks}/{r.maxMarks}</div>
                    <div style={{color:C.text4,fontSize:12}}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <Empty icon={ClipboardList} message="No results yet"/>}
      </div>
    </div>
  );
}

// ── Attendance View ───────────────────────────────────────────────────────
function AttendanceView({ studentId, showNotif }) {
  const [data, setData]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    attendanceAPI.getForStudent(studentId)
      .then(r => setData(r.data))
      .catch(() => showNotif('Failed to load','error'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Spinner/>;
  const { summary, records } = data || { summary:{}, records:[] };

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text,marginBottom:20}}>My Attendance</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}} className="four-col">
        {[
          {l:"Total Days",v:summary.total||0,c:C.text3},
          {l:"Present",   v:summary.present||0,c:C.accent},
          {l:"Late",      v:summary.late||0,   c:C.warning},
          {l:"Absent",    v:summary.absent||0, c:C.danger},
        ].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:s.c,fontFamily:"'Syne',sans-serif"}}>{s.v}</div>
            <div style={{color:C.text4,fontSize:12,marginTop:4}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Attendance rate bar */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{color:C.text,fontWeight:600}}>Overall Attendance Rate</span>
          <span style={{color:summary.percentage>=75?C.accent:C.danger,fontWeight:700,fontSize:18,fontFamily:"'Syne',sans-serif"}}>{summary.percentage||0}%</span>
        </div>
        <div style={{height:10,background:C.card2,borderRadius:5}}>
          <div style={{width:`${summary.percentage||0}%`,height:"100%",background:summary.percentage>=75?C.accent:C.danger,borderRadius:5,transition:"width .6s"}}/>
        </div>
        <div style={{marginTop:8,fontSize:12,color:summary.percentage>=75?C.accent:C.danger}}>
          {summary.percentage>=75 ? '✅ Good attendance' : '⚠️ Attendance below 75% threshold'}
        </div>
      </div>

      {/* Records list */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <span style={{color:C.text3,fontSize:13,fontWeight:600}}>Attendance Log</span>
        </div>
        {records.slice(0,30).map((r,i) => (
          <div key={r._id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,.08)",
            background:r.status==='absent'?`${C.danger}04`:r.status==='late'?`${C.warning}04`:"transparent"}}>
            <div style={{color:C.text2,fontSize:14}}>{r.date}</div>
            <Badge status={r.status}/>
          </div>
        ))}
        {!records.length && <Empty icon={Calendar} message="No attendance records yet"/>}
      </div>
    </div>
  );
}

// ── Results View ──────────────────────────────────────────────────────────
function ResultsView({ studentId, showNotif }) {
  const [data, setData]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    resultAPI.getForStudent(studentId)
      .then(r => setData(r.data))
      .catch(() => showNotif('Failed','error'))
      .finally(() => setLoading(false));
  },[studentId]);

  if (loading) return <Spinner/>;
  const { results=[], subjectAverages=[] } = data || {};

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text,marginBottom:20}}>My Results</h2>

      {/* Subject averages */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        {subjectAverages.map(s => {
          const g = gradeOf(s.average); const gc = gradeColor(g);
          return (
            <div key={s.subject} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,textAlign:"center"}}>
              <div style={{fontSize:11,color:C.text4,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}}>{s.subject.length>8?s.subject.slice(0,8)+'…':s.subject}</div>
              <div style={{fontSize:24,fontWeight:800,color:gc,fontFamily:"'Syne',sans-serif"}}>{g}</div>
              <div style={{fontSize:12,color:C.text3,marginTop:4}}>{s.average}%</div>
              <div style={{marginTop:8,height:4,background:C.card2,borderRadius:2}}>
                <div style={{width:`${s.average}%`,height:"100%",background:gc,borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",minWidth:480,borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid rgba(255,255,255,.08)"}}>
              {['Subject','Exam','Marks','Grade','Date'].map(h=>(
                <th key={h} style={{padding:"13px 16px",textAlign:"left",color:C.text4,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.6px"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(r => {
              const pct = Math.round(r.marks/r.maxMarks*100);
              const g   = gradeOf(pct);
              return (
                <tr key={r._id} style={{borderBottom:"1px solid rgba(255,255,255,.08)"}}>
                  <td style={{padding:"13px 16px",color:C.text,fontWeight:500,fontSize:13}}>{r.subject}</td>
                  <td style={{padding:"13px 16px",color:C.text2,fontSize:13}}>{r.examType}</td>
                  <td style={{padding:"13px 16px",fontWeight:600,fontSize:13,color:C.text}}>{r.marks}/{r.maxMarks}</td>
                  <td style={{padding:"13px 16px"}}><span style={{color:gradeColor(g),fontWeight:700,fontSize:14}}>{g}</span></td>
                  <td style={{padding:"13px 16px",color:C.text4,fontSize:12}}>{r.examDate?.slice(0,10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {!results.length && <Empty icon={ClipboardList} message="No results yet"/>}
      </div>
    </div>
  );
}

// ── Performance / Analytics View ──────────────────────────────────────────
function PerformanceView({ studentId, showNotif }) {
  const [data, setData]     = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    resultAPI.getForStudent(studentId)
      .then(r => setData(r.data))
      .catch(() => showNotif('Failed','error'))
      .finally(() => setLoading(false));
  },[studentId]);

  if (loading) return <Spinner/>;

  const { results=[], subjectAverages=[] } = data || {};

  // Build trend per subject over exam dates
  const subjects = [...new Set(results.map(r=>r.subject))];
  const COLORS = [C.accent,C.info,C.purple,C.warning,C.danger,'#EC4899'];

  const trendData = [...new Set(results.map(r=>r.examDate?.slice(0,10)))]
    .sort()
    .map(date => {
      const row = { date: date?.slice(5) };
      results.filter(r=>r.examDate?.slice(0,10)===date)
        .forEach(r => { row[r.subject] = Math.round(r.marks/r.maxMarks*100); });
      return row;
    });

  const radarData = subjectAverages.map(s => ({ sub: s.subject.slice(0,6), score: s.average }));

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:C.text,marginBottom:20}}>Live Performance</h2>

      {/* Score trend */}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24,marginBottom:20}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>📈 Score Trend by Subject</h3>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,marginBottom:16}}>
          {subjects.map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.text3}}>
              <div style={{width:10,height:10,borderRadius:3,background:COLORS[i%COLORS.length]}}/>
              {s}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="date" tick={{fill:C.text4,fontSize:12}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.text4,fontSize:12}} axisLine={false} tickLine={false} domain={[0,100]}/>
            <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12}}/>
            {subjects.map((s,i) => (
              <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i%COLORS.length]} strokeWidth={2.5} dot={{r:3}} name={s}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="two-col">
        {/* Radar */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>Subject Proficiency</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border}/>
              <PolarAngleAxis dataKey="sub" tick={{fill:C.text3,fontSize:12}}/>
              <Radar name="Score" dataKey="score" stroke={C.accent} fill={C.accent} fillOpacity={0.25} strokeWidth={2}/>
              <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12}}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject bar */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text,marginBottom:20}}>Average by Subject</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={subjectAverages} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="subject" tick={{fill:C.text4,fontSize:10}} axisLine={false} tickLine={false}
                tickFormatter={v=>v.slice(0,5)+'…'}/>
              <YAxis tick={{fill:C.text4,fontSize:12}} axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip contentStyle={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:8,color:C.text,fontSize:12}}/>
              <Bar dataKey="average" name="Average %" radius={[6,6,0,0]}>
                {subjectAverages.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Main Student Dashboard ────────────────────────────────────────────────
export default function StudentDashboard({ user, onLogout, showNotif }) {
  const [tab, setTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const studentId = user?.studentRef || user?._id;

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
              <AvatarCircle init={user.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'S'} src={user.avatar} size={28}/>
            </div>
          </div>
        )}
        <main style={{flex:1,padding:isMobile?16:32,overflow:"auto",maxHeight:isMobile?"none":"100vh"}}>
          {tab==='overview'    && <StudentOverview studentId={studentId} showNotif={showNotif}/>}
          {tab==='attendance'  && <AttendanceView  studentId={studentId} showNotif={showNotif}/>}
          {tab==='results'     && <ResultsView     studentId={studentId} showNotif={showNotif}/>}
          {tab==='performance' && <PerformanceView studentId={studentId} showNotif={showNotif}/>}
        </main>
      </div>
    </div>
  );
}

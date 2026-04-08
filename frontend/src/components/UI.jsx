import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';

// ── Color Palette — Warm Minimal Light Theme ──────────────────────────────
export const C = {
  bg:      "#EFECEA",   // warm beige page background
  card:    "#FFFFFF",   // pure white cards
  card2:   "#F7F5F2",   // slightly off-white input / inner bg
  card3:   "#F0EDE9",   // hover states

  // Sidebar / navbar — dark charcoal olive
  sidebar: "#2C2C27",
  sidebarHover: "#3A3A34",
  sidebarActive: "#4A4A42",

  accent:  "#5A6B47",   // muted olive green
  accentL: "#7A8F63",
  accentD: "#3E4C31",

  border:  "#E2DDD8",   // subtle warm border
  border2: "#D5CFC9",

  text:    "#1C1A16",   // near-black warm
  text2:   "#3D3A34",
  text3:   "#706C64",
  text4:   "#A09891",

  danger:  "#C0392B",
  warning: "#B7860B",
  info:    "#2563A0",
  purple:  "#6D4C9E",

  // Badge shades
  successBg: "#EEF2EA",
  successFg: "#3E6027",
  dangerBg:  "#FAEAEA",
  dangerFg:  "#9B2020",
  warningBg: "#FDF3DC",
  warningFg: "#8A6300",
  neutralBg: "#EBEBEB",
  neutralFg: "#5A5A5A",
};

export const gradeOf = m => m>=95?"A+":m>=85?"A":m>=75?"B+":m>=65?"B":m>=55?"C+":"C";
export const gradeColor = g => ({"A+":C.accent,"A":C.accentL,"B+":C.info,"B":C.purple,"C+":C.warning,"C":C.danger})[g]||C.text3;

// ── Notification Toast ────────────────────────────────────────────────────
export const Notification = ({ notif }) => {
  if (!notif) return null;
  const cfg = {
    success: { bg: C.successBg, color: C.successFg, border: "#C5D9B0" },
    error:   { bg: C.dangerBg,  color: C.dangerFg,  border: "#F0C4C4" },
    info:    { bg: "#EAF0FB",   color: C.info,       border: "#B8CFF0" },
  }[notif.type] || { bg: C.card, color: C.text, border: C.border };
  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius:12, padding:"13px 18px", fontSize:14, fontWeight:500,
      display:"flex", alignItems:"center", gap:10,
      animation:"slideIn .3s ease", maxWidth:360,
      boxShadow:"0 4px 24px rgba(0,0,0,.10)"
    }}>
      {notif.type==="success" ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
      {notif.msg}
    </div>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────
export const AvatarCircle = ({ init, size=36, color=C.accent, src }) => {
  if (src) return (
    <img src={src} alt="avatar"
      style={{width:size, height:size, borderRadius:"50%", objectFit:"cover", border:`2px solid ${C.border}`, flexShrink:0}}/>
  );
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: C.card2, border:`1.5px solid ${C.border}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      color: C.text3, fontSize:size*.33, fontWeight:700,
      flexShrink:0, fontFamily:"'Instrument Serif',serif",
      letterSpacing:"-0.5px"
    }}>{init}</div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, color=C.accent, trend }) => (
  <div style={{
    background: C.card, border:`1px solid ${C.border}`,
    borderRadius:14, padding:22,
    boxShadow:"0 1px 4px rgba(0,0,0,.05)"
  }}>
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16}}>
      <span style={{fontSize:11, color:C.text4, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.9px"}}>{label}</span>
      <div style={{background:C.card2, border:`1px solid ${C.border}`, borderRadius:9, padding:8}}>
        <Icon size={15} color={C.text3}/>
      </div>
    </div>
    <div style={{fontSize:28, fontWeight:700, color:C.text, fontFamily:"'Instrument Serif',serif", letterSpacing:"-1px", marginBottom:5}}>
      {value}
    </div>
    {sub && <div style={{fontSize:12, color: trend==="up"?C.accent : trend==="down"?C.danger : C.text4}}>{sub}</div>}
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const cfg = {
    present:  {bg: C.successBg, c: C.successFg, l:"Present"},
    absent:   {bg: C.dangerBg,  c: C.dangerFg,  l:"Absent"},
    late:     {bg: C.warningBg, c: C.warningFg, l:"Late"},
    active:   {bg: C.successBg, c: C.successFg, l:"Active"},
    inactive: {bg: C.neutralBg, c: C.neutralFg, l:"Inactive"},
  }[status] || {bg: C.neutralBg, c: C.neutralFg, l: status};
  return (
    <span style={{
      background: cfg.bg, color: cfg.c,
      borderRadius:20, padding:"3px 11px",
      fontSize:12, fontWeight:500,
    }}>
      {cfg.l}
    </span>
  );
};

// ── Field Input ───────────────────────────────────────────────────────────
export const FieldInput = ({ label, value, onChange, type="text", placeholder, icon: Icon, disabled }) => {
  const [show, setShow] = useState(false);
  const isP = type === "password";
  return (
    <div style={{marginBottom:16}}>
      {label && (
        <label style={{display:"block", marginBottom:6, fontSize:13, color:C.text3, fontWeight:500}}>
          {label}
        </label>
      )}
      <div style={{position:"relative"}}>
        {Icon && (
          <div style={{position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.text4, pointerEvents:"none"}}>
            <Icon size={14}/>
          </div>
        )}
        <input
          type={isP ? (show?"text":"password") : type}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          style={{
            width:"100%", background: disabled ? C.card2 : C.card,
            border:`1px solid ${C.border}`,
            borderRadius:10, padding:`10px 14px 10px ${Icon?"38px":"14px"}`,
            color:C.text, fontSize:14, outline:"none", boxSizing:"border-box",
            fontFamily:"'DM Sans',sans-serif",
            opacity: disabled ? 0.6 : 1,
            transition:"border-color .15s",
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
        {isP && (
          <button type="button" onClick={() => setShow(s=>!s)}
            style={{position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.text4}}>
            {show ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Button ────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant="primary", disabled, style={}, type="button" }) => {
  const [hov, setHov] = useState(false);
  const base = {
    borderRadius:9, padding:"10px 22px", fontWeight:600, fontSize:14,
    cursor: disabled ? "not-allowed" : "pointer", border:"none",
    transition:"all .18s cubic-bezier(.4,0,.2,1)",
    fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.1px",
    ...style
  };
  const variants = {
    primary: {
      background: hov && !disabled ? "#2a2825" : C.text,
      color: "#FFFFFF",
      boxShadow: hov && !disabled ? "0 4px 14px rgba(0,0,0,.22)" : "0 1px 3px rgba(0,0,0,.08)",
      transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
    },
    danger: {
      background: hov && !disabled ? "#fcd5d5" : C.dangerBg,
      color: C.dangerFg, border:`1px solid #F0C4C4`,
      transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
    },
    ghost: {
      background: hov && !disabled ? C.card2 : "transparent",
      color: C.text3, border:`1px solid ${C.border}`,
      transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
    },
    outline: {
      background: hov && !disabled ? `${C.accent}15` : "transparent",
      color: C.accent, border:`1px solid ${C.accent}`,
      transform: hov && !disabled ? "translateY(-1px)" : "translateY(0)",
    },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{...base, ...variants[variant], opacity: disabled ? .55 : 1}}>
      {children}
    </button>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, width=500 }) => {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(28,26,22,.45)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      backdropFilter:"blur(2px)"
    }} onClick={onClose}>
      <div style={{
        background: C.card, border:`1px solid ${C.border}`,
        borderRadius:18, padding:28, width:"100%", maxWidth:width,
        maxHeight:"90vh", overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,.15)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22}}>
          <h2 style={{fontFamily:"'Instrument Serif',serif", fontWeight:400, fontSize:20, color:C.text, margin:0, letterSpacing:"-0.3px"}}>
            {title}
          </h2>
          <button onClick={onClose}
            style={{background: C.card2, border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 7px", cursor:"pointer", color:C.text3, display:"flex"}}>
            <X size={15}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────
export const Spinner = ({ size=36 }) => (
  <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:48}}>
    <div style={{
      width:size, height:size, borderRadius:"50%",
      border:`2px solid ${C.border}`,
      borderTop:`2px solid ${C.text3}`,
      animation:"spin .8s linear infinite"
    }}/>
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────
export const Empty = ({ icon: Icon, message }) => (
  <div style={{textAlign:"center", padding:"52px 20px", color:C.text4}}>
    {Icon && <Icon size={36} style={{marginBottom:14, opacity:.3, display:"block", margin:"0 auto 14px"}}/>}
    <p style={{margin:0, fontSize:14, color:C.text3}}>{message}</p>
  </div>
);

// ── Global CSS ────────────────────────────────────────────────────────────
export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #EFECEA; font-family: 'DM Sans', sans-serif; color: #1C1A16; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #F0EDE9; }
    ::-webkit-scrollbar-thumb { background: #D5CFC9; border-radius: 4px; }
    input, select, textarea { font-family: 'DM Sans', sans-serif; }
    input::placeholder { color: #B0A9A1; }
    input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
    select option { background: #FFFFFF; color: #1C1A16; }
    @keyframes slideIn  { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin     { to { transform: rotate(360deg); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }

    /* ── Responsive helpers ── */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .stat-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .four-col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

    /* Responsive table wrapper */
    .table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { min-width: 560px; }

    @media (max-width: 900px) {
      .stat-grid  { grid-template-columns: repeat(2, 1fr) !important; }
      .stat-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
      .two-col    { grid-template-columns: 1fr !important; }
      .three-col  { grid-template-columns: repeat(2, 1fr) !important; }
      .four-col   { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 480px) {
      .stat-grid  { grid-template-columns: 1fr 1fr !important; }
      .stat-grid-3 { grid-template-columns: 1fr 1fr !important; }
      .three-col  { grid-template-columns: 1fr 1fr !important; }
      .four-col   { grid-template-columns: 1fr 1fr !important; }
    }
  `}</style>
);

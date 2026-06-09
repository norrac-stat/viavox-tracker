import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function dayOfWeek(y, m, d) { return new Date(y, m, d).getDay(); }
function isWeekend(y, m, d) { const w = dayOfWeek(y,m,d); return w===0||w===6; }
const DOW = ["N","P","W","Ś","C","P","S"];
const MONTHS = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
                "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
function toDateStr(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

// ── Brand colors ──────────────────────────────────────────────────────────────
const C = {
  blue:"#4A90C4", blueDark:"#2D6E9E", blueLight:"#EBF4FB", blueMid:"#D0E8F5",
  gray1:"#F5F6F8", gray2:"#ECEEF1", gray3:"#D8DCE2", gray4:"#B0B6BF",
  gray5:"#6B7280", gray6:"#374151", gray7:"#1F2937", white:"#FFFFFF",
  red:"#E05252", green:"#3DAA70", wknd:"#F9FAFB",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.gray1};font-family:'Inter',sans-serif}
::-webkit-scrollbar{height:5px;width:5px}
::-webkit-scrollbar-track{background:${C.gray2}}
::-webkit-scrollbar-thumb{background:${C.gray3};border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:${C.gray4}}
.ts-cell input{width:100%;height:100%;border:none;background:transparent;color:${C.gray6};font-family:'Inter',sans-serif;font-size:12px;text-align:center;outline:none;padding:0;}
.ts-cell input:focus{background:${C.blueLight};color:${C.blue};}
.ts-cell input::placeholder{color:${C.gray3}}
.ts-cell.wknd{background:${C.wknd}}
.ts-cell.filled{background:${C.blueLight}}
.emp-row:hover td{background:${C.blueLight} !important}
.emp-row:hover .ts-cell.wknd{background:#EDF4FB !important}
.btn{background:${C.blue};color:#fff;border:none;padding:8px 18px;border-radius:6px;font-family:'Inter',sans-serif;font-size:12px;font-weight:500;cursor:pointer;transition:background .15s,transform .1s;white-space:nowrap;}
.btn:hover{background:${C.blueDark};transform:translateY(-1px)}
.btn:active{transform:translateY(0)}
.btn:disabled{background:${C.gray3};cursor:not-allowed;transform:none}
.btn-sm{padding:6px 14px;font-size:11px}
.btn-ghost{background:transparent;color:${C.gray5};border:1px solid ${C.gray3};padding:6px 12px;border-radius:6px;font-family:'Inter',sans-serif;font-size:12px;cursor:pointer;transition:all .15s;}
.btn-ghost:hover{border-color:${C.blue};color:${C.blue};background:${C.blueLight}}
.btn-danger{background:transparent;color:${C.gray4};border:1px solid ${C.gray3};padding:5px 10px;border-radius:5px;font-family:'Inter',sans-serif;font-size:11px;cursor:pointer;transition:all .15s;}
.btn-danger:hover{color:${C.red};border-color:${C.red}}
.inp{background:${C.white};border:1px solid ${C.gray3};color:${C.gray7};font-family:'Inter',sans-serif;font-size:13px;padding:9px 12px;border-radius:6px;outline:none;width:100%;transition:border-color .2s,box-shadow .2s;}
.inp:focus{border-color:${C.blue};box-shadow:0 0 0 3px ${C.blueLight}}
select.inp option{background:${C.white};color:${C.gray7}}
.tag-s{background:#E8F8EF;color:#2A7D52;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:500;white-space:nowrap}
.tag-p{background:${C.blueLight};color:${C.blueDark};font-size:10px;padding:2px 7px;border-radius:20px;font-weight:500;white-space:nowrap}
.tag-a{background:#FFF3E0;color:#E07B20;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:500;white-space:nowrap}
.card{background:${C.white};border:1px solid ${C.gray3};border-radius:10px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.modal-bg{position:fixed;inset:0;background:rgba(31,41,55,.4);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(2px)}
.modal{background:${C.white};border:1px solid ${C.gray3};border-radius:12px;padding:28px;width:420px;display:flex;flex-direction:column;gap:16px;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.modal-wide{width:560px}
.lbl{font-size:11px;color:${C.gray5};display:block;margin-bottom:5px;font-weight:500;letter-spacing:.04em;text-transform:uppercase}
.pin-dot{width:13px;height:13px;border-radius:50%;background:${C.gray3};transition:background .15s}
.pin-dot.filled{background:${C.blue}}
.pin-key{width:68px;height:54px;background:${C.white};border:1px solid ${C.gray3};border-radius:8px;font-family:'Inter',sans-serif;font-size:20px;font-weight:300;color:${C.gray6};cursor:pointer;transition:all .1s;}
.pin-key:hover{background:${C.blueLight};border-color:${C.blue};color:${C.blue}}
.pin-key:active{transform:scale(.94)}
.proj-chip{display:inline-flex;align-items:center;gap:6px;background:${C.blueLight};border:1px solid ${C.blueMid};border-radius:20px;padding:4px 10px;font-size:11px;color:${C.blueDark};font-weight:500;}
.checkbox-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.cb-item{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${C.gray1};border:1px solid ${C.gray3};border-radius:6px;cursor:pointer;font-size:12px;color:${C.gray6};transition:all .15s}
.cb-item:hover{border-color:${C.blue};background:${C.blueLight};color:${C.blue}}
.cb-item input{accent-color:${C.blue};cursor:pointer;width:14px;height:14px}
.nav-tab{background:none;border:none;border-bottom:2px solid transparent;color:${C.gray4};font-family:'Inter',sans-serif;font-size:12px;font-weight:500;padding:12px 16px;cursor:pointer;transition:all .15s;white-space:nowrap;}
.nav-tab.active{border-bottom-color:${C.blue};color:${C.blue}}
.nav-tab:hover:not(.active){color:${C.gray6};border-bottom-color:${C.gray3}}
.spinner{width:18px;height:18px;border:2px solid ${C.blueMid};border-top-color:${C.blue};border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:24px;right:24px;background:${C.gray7};color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;z-index:999;animation:slideIn .25s ease;box-shadow:0 4px 16px rgba(0,0,0,.2)}
.toast.ok{background:#2A7D52}
.toast.err{background:${C.red}}
@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

function Logo({ size = 24 }) {
  return (
    <svg width={size*4.4} height={size} viewBox="0 0 132 30" fill="none">
      <polygon points="0,0 10,0 15,10 20,0 30,0 30,30 20,30 20,12 15,22 10,12 10,30 0,30" fill={C.blue}/>
      <text x="36" y="23" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="22" fill={C.blue}>VIA</text>
      <text x="76" y="23" fontFamily="Inter,sans-serif" fontWeight="300" fontSize="22" fill={C.gray4}>VOX</text>
    </svg>
  );
}

// ── Toast helper ──────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  function show(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }
  return { toast, show };
}

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [currentManager, setCurrentManager] = useState(null);
  const [pinInput,   setPinInput]   = useState("");
  const [selMgrId,   setSelMgrId]   = useState("");
  const [loginError, setLoginError] = useState("");
  const [managers,   setManagers]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [mgrProjects,setMgrProjects]= useState([]); // manager_projects rows
  const [hoursMap,   setHoursMap]   = useState({}); // key: projId|empId|date → hours value

  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const saveTimer = useRef({});

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [activeProj, setActiveProj] = useState(null);
  const [searchQ,    setSearchQ]    = useState("");
  const [tab,        setTab]        = useState("timesheet");
  const [modal,      setModal]      = useState(null);

  const [fFirst,    setFFirst]    = useState("");
  const [fLast,     setFLast]     = useState("");
  const [fStudent,  setFStudent]  = useState(false);
  const [fUk,       setFUk]       = useState("");
  const [fProjName, setFProjName] = useState("");
  const [fProjNum,  setFProjNum]  = useState("");
  const [fMgrName,  setFMgrName]  = useState("");
  const [fMgrPin,   setFMgrPin]   = useState("");
  const [fMgrProjs, setFMgrProjs] = useState([]);
  const [editingMgr,setEditingMgr]= useState(null);

  const { toast, show: showToast } = useToast();

  // ── Load all data ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      const [{ data: mgrs }, { data: emps }, { data: projs }, { data: mp }] = await Promise.all([
        supabase.from("managers").select("*").order("name"),
        supabase.from("employees").select("*").order("last_name"),
        supabase.from("projects").select("*").order("name"),
        supabase.from("manager_projects").select("*"),
      ]);
      setManagers(mgrs || []);
      setEmployees(emps || []);
      setProjects(projs || []);
      setMgrProjects(mp || []);
      setLoading(false);
    }
    loadAll();
  }, []);

  // ── Load hours for current month ──────────────────────────────────────────
  useEffect(() => {
    if (!currentManager) return;
    async function loadHours() {
      const from = toDateStr(year, month, 1);
      const to   = toDateStr(year, month, daysInMonth(year, month));
      const { data } = await supabase.from("hours")
        .select("*").gte("work_date", from).lte("work_date", to);
      const map = {};
      for (const row of (data || [])) {
        map[`${row.project_id}|${row.employee_id}|${row.work_date}`] = String(row.hours);
      }
      setHoursMap(map);
    }
    loadHours();
  }, [currentManager, year, month]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const myProjectIds = useMemo(() => {
    if (!currentManager) return [];
    if (currentManager.is_admin) return projects.map(p => p.id);
    return mgrProjects.filter(mp => mp.manager_id === currentManager.id).map(mp => mp.project_id);
  }, [currentManager, mgrProjects, projects]);

  const myProjects = useMemo(() =>
    projects.filter(p => myProjectIds.includes(p.id)),
    [projects, myProjectIds]
  );

  const filteredEmps = useMemo(() => {
    const q = searchQ.toLowerCase();
    return employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
    );
  }, [employees, searchQ]);

  const days = daysInMonth(year, month);
  const isAdmin = currentManager?.is_admin;

  // ── Hours helpers ─────────────────────────────────────────────────────────
  function getH(projId, empId, day) {
    const key = `${projId}|${empId}|${toDateStr(year, month, day)}`;
    return hoursMap[key] ?? "";
  }

  function setH(projId, empId, day, val) {
    const dateStr = toDateStr(year, month, day);
    const key = `${projId}|${empId}|${dateStr}`;
    setHoursMap(prev => ({ ...prev, [key]: val }));

    // debounce save
    if (saveTimer.current[key]) clearTimeout(saveTimer.current[key]);
    saveTimer.current[key] = setTimeout(async () => {
      const num = parseFloat(val);
      if (val === "" || val === null) {
        await supabase.from("hours").delete()
          .eq("project_id", projId).eq("employee_id", empId).eq("work_date", dateStr);
      } else if (!isNaN(num) && num >= 0 && num <= 24) {
        await supabase.from("hours").upsert({
          project_id: projId, employee_id: empId,
          work_date: dateStr, hours: num,
        }, { onConflict: "project_id,employee_id,work_date" });
      }
    }, 600);
  }

  function empTotal(projId, empId) {
    let s = 0;
    for (let d = 1; d <= days; d++) {
      s += parseFloat(getH(projId, empId, d)) || 0;
    }
    return s;
  }
  function dayTotal(projId, day) {
    return employees.reduce((s, e) => s + (parseFloat(getH(projId, e.id, day)) || 0), 0);
  }
  function projTotal(projId) {
    return employees.reduce((s, e) => s + empTotal(projId, e.id), 0);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  function handlePinDigit(d) {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 4) setTimeout(() => attemptLogin(next), 150);
  }
  function attemptLogin(pin) {
    const mgr = managers.find(m => m.id === selMgrId && m.pin === pin);
    if (mgr) {
      setCurrentManager(mgr);
      setLoginError("");
      setPinInput("");
      const myPIds = mgr.is_admin
        ? projects.map(p => p.id)
        : mgrProjects.filter(mp => mp.manager_id === mgr.id).map(mp => mp.project_id);
      const firstProj = projects.find(p => myPIds.includes(p.id));
      if (firstProj) setActiveProj(firstProj.id);
    } else {
      setLoginError("Błędny PIN — spróbuj ponownie.");
      setPinInput("");
    }
  }
  function logout() {
    setCurrentManager(null); setPinInput(""); setSelMgrId("");
    setLoginError(""); setTab("timesheet"); setHoursMap({});
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async function addEmployee() {
    if (!fFirst.trim() || !fLast.trim()) return;
    const { data, error } = await supabase.from("employees").insert({
      first_name: fFirst.trim(), last_name: fLast.trim(),
      is_student: fStudent, uk_number: fUk.trim(),
    }).select().single();
    if (error) { showToast("Błąd zapisu", "err"); return; }
    setEmployees(prev => [...prev, data].sort((a,b) => a.last_name.localeCompare(b.last_name)));
    setFFirst(""); setFLast(""); setFStudent(false); setFUk("");
    setModal(null); showToast("Pracownik dodany");
  }

  async function addProject() {
    if (!fProjName.trim()) return;
    const { data, error } = await supabase.from("projects").insert({
      name: fProjName.trim(), number: fProjNum.trim(),
    }).select().single();
    if (error) { showToast("Błąd zapisu", "err"); return; }
    setProjects(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
    // admin gets access automatically
    if (currentManager?.is_admin) {
      await supabase.from("manager_projects").insert({ manager_id: currentManager.id, project_id: data.id });
      setMgrProjects(prev => [...prev, { manager_id: currentManager.id, project_id: data.id }]);
    }
    setFProjName(""); setFProjNum(""); setModal(null);
    setActiveProj(data.id); showToast("Projekt dodany");
  }

  async function addManager() {
    if (!fMgrName.trim() || fMgrPin.length !== 4) return;
    const { data, error } = await supabase.from("managers").insert({
      name: fMgrName.trim(), pin: fMgrPin, is_admin: false,
    }).select().single();
    if (error) { showToast("Błąd zapisu", "err"); return; }
    if (fMgrProjs.length > 0) {
      await supabase.from("manager_projects").insert(
        fMgrProjs.map(pid => ({ manager_id: data.id, project_id: pid }))
      );
      setMgrProjects(prev => [...prev, ...fMgrProjs.map(pid => ({ manager_id: data.id, project_id: pid }))]);
    }
    setManagers(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)));
    setFMgrName(""); setFMgrPin(""); setFMgrProjs([]);
    setModal(null); showToast("Kierownik dodany");
  }

  async function saveEditMgr() {
    const updates = { name: fMgrName };
    if (fMgrPin.length === 4) updates.pin = fMgrPin;
    const { error } = await supabase.from("managers").update(updates).eq("id", editingMgr.id);
    if (error) { showToast("Błąd zapisu", "err"); return; }
    // update project assignments
    await supabase.from("manager_projects").delete().eq("manager_id", editingMgr.id);
    if (fMgrProjs.length > 0) {
      await supabase.from("manager_projects").insert(
        fMgrProjs.map(pid => ({ manager_id: editingMgr.id, project_id: pid }))
      );
    }
    setManagers(prev => prev.map(m => m.id === editingMgr.id ? { ...m, ...updates } : m));
    setMgrProjects(prev => [
      ...prev.filter(mp => mp.manager_id !== editingMgr.id),
      ...fMgrProjs.map(pid => ({ manager_id: editingMgr.id, project_id: pid })),
    ]);
    setModal(null); showToast("Zmiany zapisane");
  }

  async function deleteMgr(id) {
    await supabase.from("managers").delete().eq("id", id);
    setManagers(prev => prev.filter(m => m.id !== id));
    setMgrProjects(prev => prev.filter(mp => mp.manager_id !== id));
    showToast("Kierownik usunięty");
  }

  function openEditMgr(mgr) {
    setEditingMgr(mgr); setFMgrName(mgr.name); setFMgrPin("");
    setFMgrProjs(mgrProjects.filter(mp => mp.manager_id === mgr.id).map(mp => mp.project_id));
    setModal("editMgr");
  }

  function prevMonth() { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function nextMonth() { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.gray1, display:"flex",
                  alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <style>{CSS}</style>
      <Logo size={28} />
      <div className="spinner" style={{ width:28, height:28 }} />
      <div style={{ color:C.gray4, fontSize:13 }}>Łączenie z bazą danych…</div>
    </div>
  );

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!currentManager) return (
    <div style={{ minHeight:"100vh", background:C.gray1, display:"flex",
                  alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24, width:340 }}>
        <div style={{ textAlign:"center" }}>
          <Logo size={32} />
          <div style={{ color:C.gray4, fontSize:12, marginTop:8 }}>System rejestracji godzin projektowych</div>
        </div>
        <div style={{ width:"100%", background:C.white, border:`1px solid ${C.gray3}`,
                      borderRadius:12, padding:28, boxShadow:`0 4px 20px rgba(74,144,196,.08)`,
                      display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <label className="lbl">Kierownik</label>
            <select className="inp" value={selMgrId}
              onChange={e=>{setSelMgrId(e.target.value);setPinInput("");setLoginError("");}}>
              <option value="">— wybierz —</option>
              {managers.map(m=>(
                <option key={m.id} value={m.id}>{m.name}{m.is_admin?" (Admin)":""}</option>
              ))}
            </select>
          </div>
          {selMgrId && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:12, color:C.gray4, fontWeight:500 }}>Wprowadź PIN</div>
              <div style={{ display:"flex", gap:12 }}>
                {[0,1,2,3].map(i=>(
                  <div key={i} className={`pin-dot${i<pinInput.length?" filled":""}`} />
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,68px)", gap:8 }}>
                {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
                  <button key={i} className="pin-key"
                    style={{ visibility:k===""?"hidden":"visible" }}
                    onClick={()=>{ if(k==="⌫")setPinInput(p=>p.slice(0,-1)); else handlePinDigit(String(k)); }}>
                    {k}
                  </button>
                ))}
              </div>
              {loginError && <div style={{ color:C.red, fontSize:12, fontWeight:500 }}>{loginError}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── App ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.gray1, color:C.gray7, fontFamily:"Inter,sans-serif", fontSize:13 }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ background:C.white, borderBottom:`1px solid ${C.gray3}`,
                    padding:"0 24px", display:"flex", alignItems:"center",
                    boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
        <div style={{ marginRight:20, padding:"12px 0" }}><Logo size={22} /></div>
        <div style={{ width:1, height:30, background:C.gray3, marginRight:8 }} />
        {[
          ["timesheet","Timesheet"],
          ["employees","Pracownicy"],
          ...(isAdmin ? [["projects","Projekty"],["managers","Kierownicy"]] : []),
          ["report","Raport"],
        ].map(([key,label])=>(
          <button key={key} className={`nav-tab${tab===key?" active":""}`}
            onClick={()=>setTab(key)}>{label}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.gray6 }}>{currentManager.name}</div>
            <div style={{ fontSize:11, color:C.gray4 }}>
              {isAdmin?"Administrator":`${myProjects.length} projekt${myProjects.length===1?"":"ów"}`}
            </div>
          </div>
          <button className="btn-ghost" onClick={logout} style={{ fontSize:11 }}>Wyloguj</button>
        </div>
      </div>

      {/* ═══ TIMESHEET ═══ */}
      {tab==="timesheet" && (
        <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 53px)" }}>
          {/* toolbar */}
          <div style={{ background:C.white, borderBottom:`1px solid ${C.gray3}`,
                        padding:"8px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <button className="btn-ghost" onClick={prevMonth} style={{ padding:"5px 10px", fontSize:14, flexShrink:0 }}>‹</button>
            <div style={{ fontWeight:600, fontSize:14, color:C.gray7, width:148, textAlign:"center", flexShrink:0 }}>
              {MONTHS[month]} {year}
            </div>
            <button className="btn-ghost" onClick={nextMonth} style={{ padding:"5px 10px", fontSize:14, flexShrink:0 }}>›</button>
            <div style={{ width:1, height:24, background:C.gray3, flexShrink:0 }} />

            {myProjects.length===0
              ? <span style={{ color:C.gray4, fontSize:12 }}>Brak przypisanych projektów</span>
              : (<>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:11, color:C.gray5, fontWeight:500 }}>Projekt</span>
                    <select className="inp" value={activeProj||""} onChange={e=>setActiveProj(e.target.value)}
                      style={{ width:260, padding:"7px 10px", fontSize:13, fontWeight:500, color:C.gray7,
                               borderColor:activeProj?C.blue:C.gray3,
                               boxShadow:activeProj?`0 0 0 3px ${C.blueLight}`:"none" }}>
                      <option value="" disabled>— wybierz projekt —</option>
                      {myProjects.map(p=>(
                        <option key={p.id} value={p.id}>
                          {p.number?`[${p.number}] ${p.name}`:p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width:1, height:24, background:C.gray3, flexShrink:0 }} />
                  <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
                    <span style={{ fontSize:11, color:C.gray5, fontWeight:500, whiteSpace:"nowrap" }}>Szukaj</span>
                    <input className="inp" placeholder="imię lub nazwisko…" value={searchQ}
                      onChange={e=>setSearchQ(e.target.value)}
                      style={{ flex:1, minWidth:0, padding:"7px 11px", fontSize:13 }} />
                  </div>
                </>)
            }
            {isAdmin && (
              <button className="btn btn-sm" style={{ flexShrink:0 }} onClick={()=>setModal("addEmp")}>+ Pracownik</button>
            )}
          </div>

          {/* grid */}
          {!activeProj
            ? <div style={{ padding:40, color:C.gray4 }}>Wybierz projekt powyżej.</div>
            : (
            <div style={{ flex:1, overflow:"auto" }}>
              <table style={{ borderCollapse:"collapse", minWidth:"100%", fontSize:12 }}>
                <thead style={{ position:"sticky", top:0, zIndex:10 }}>
                  <tr style={{ background:C.gray2 }}>
                    <th style={{ ...TH, width:210, position:"sticky", left:0, zIndex:11,
                                 background:C.gray2, textAlign:"left", padding:"10px 16px",
                                 borderRight:`1px solid ${C.gray3}`, color:C.gray5 }}>PRACOWNIK</th>
                    {Array.from({length:days},(_,i)=>i+1).map(d=>(
                      <th key={d} style={{ ...TH, width:36, minWidth:36,
                        background:isWeekend(year,month,d)?C.wknd:C.gray2,
                        borderBottom:`1px solid ${C.gray3}` }}>
                        <div style={{ color:isWeekend(year,month,d)?C.gray3:C.blue, fontSize:13, fontWeight:600 }}>{d}</div>
                        <div style={{ fontSize:9, marginTop:1, color:isWeekend(year,month,d)?C.gray3:C.gray4, fontWeight:500 }}>
                          {DOW[dayOfWeek(year,month,d)]}
                        </div>
                      </th>
                    ))}
                    <th style={{ ...TH, width:64, position:"sticky", right:0,
                                 background:C.gray2, borderLeft:`1px solid ${C.gray3}`, color:C.gray5 }}>SUMA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmps.length===0 && (
                    <tr><td colSpan={days+2} style={{ padding:32, color:C.gray4, textAlign:"center" }}>
                      Brak pracowników
                    </td></tr>
                  )}
                  {filteredEmps.map((emp,ri)=>{
                    const total=empTotal(activeProj,emp.id);
                    const rowBg=ri%2===0?C.white:"#F8FAFC";
                    return (
                      <tr key={emp.id} className="emp-row"
                        style={{ background:rowBg, borderBottom:`1px solid ${C.gray2}` }}>
                        <td style={{ position:"sticky", left:0, zIndex:2, background:rowBg,
                                     borderRight:`1px solid ${C.gray2}`, padding:"6px 14px", whiteSpace:"nowrap" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", background:C.blueLight,
                                          color:C.blue, display:"flex", alignItems:"center", justifyContent:"center",
                                          fontSize:11, fontWeight:600, flexShrink:0 }}>
                              {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight:500, color:C.gray7, fontSize:12 }}>
                                {emp.first_name} {emp.last_name}
                              </div>
                              {emp.uk_number && <div style={{ fontSize:10, color:C.gray4 }}>{emp.uk_number}</div>}
                            </div>
                            {emp.is_student?<span className="tag-s">STU</span>:<span className="tag-p">PR</span>}
                          </div>
                        </td>
                        {Array.from({length:days},(_,i)=>i+1).map(d=>{
                          const val=getH(activeProj,emp.id,d);
                          return (
                            <td key={d}
                              className={`ts-cell${isWeekend(year,month,d)?" wknd":""}${val?" filled":""}`}
                              style={{ height:36, padding:0, borderRight:`1px solid ${C.gray2}` }}>
                              <input type="number" min="0" max="24" step="0.5"
                                placeholder="·" value={val}
                                onChange={e=>setH(activeProj,emp.id,d,e.target.value)} />
                            </td>
                          );
                        })}
                        <td style={{ position:"sticky", right:0, zIndex:2, background:rowBg,
                                     borderLeft:`1px solid ${C.gray2}`, padding:"0 12px",
                                     textAlign:"center", fontWeight:600, whiteSpace:"nowrap",
                                     color:total>0?C.blue:C.gray3, fontSize:12 }}>
                          {total>0?`${total}h`:"—"}
                        </td>
                      </tr>
                    );
                  })}
                  {/* day totals */}
                  <tr style={{ background:C.gray2, borderTop:`2px solid ${C.gray3}`,
                               position:"sticky", bottom:0, zIndex:5 }}>
                    <td style={{ position:"sticky", left:0, background:C.gray2,
                                 borderRight:`1px solid ${C.gray3}`, padding:"7px 14px",
                                 color:C.gray5, fontSize:10, fontWeight:500 }}>SUMA DNIA</td>
                    {Array.from({length:days},(_,i)=>i+1).map(d=>{
                      const t=dayTotal(activeProj,d);
                      return (
                        <td key={d} style={{ textAlign:"center", padding:"6px 0",
                                             borderRight:`1px solid ${C.gray2}`,
                                             color:t>0?C.gray6:C.gray3, fontSize:11, fontWeight:t>0?500:400 }}>
                          {t>0?t:""}
                        </td>
                      );
                    })}
                    <td style={{ position:"sticky", right:0, background:C.gray2,
                                 borderLeft:`1px solid ${C.gray3}`, textAlign:"center",
                                 color:projTotal(activeProj)>0?C.blue:C.gray4,
                                 fontWeight:700, fontSize:13, padding:"0 12px" }}>
                      {projTotal(activeProj)>0?`${projTotal(activeProj)}h`:"—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ EMPLOYEES ═══ */}
      {tab==="employees" && (
        <div style={{ padding:"24px 28px", maxWidth:860 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:20, color:C.gray7 }}>Pracownicy</div>
            <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
              <input className="inp" placeholder="Szukaj…" value={searchQ}
                onChange={e=>setSearchQ(e.target.value)} style={{ width:200, fontSize:12 }} />
              {isAdmin&&<button className="btn btn-sm" onClick={()=>setModal("addEmp")}>+ Dodaj pracownika</button>}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 160px 80px",
                           gap:12, padding:"8px 16px", color:C.gray4, fontSize:11, fontWeight:500 }}>
              <span>PRACOWNIK</span><span>TYP</span><span>NR UK</span><span style={{textAlign:"right"}}>GODZ.</span>
            </div>
            {filteredEmps.map(emp=>(
              <div key={emp.id} style={{ display:"grid", gridTemplateColumns:"1fr 110px 160px 80px",
                                         gap:12, padding:"12px 16px", background:C.white,
                                         border:`1px solid ${C.gray3}`, borderRadius:8, alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:C.blueLight,
                                color:C.blue, display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:12, fontWeight:600 }}>
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:500, color:C.gray7 }}>{emp.first_name} {emp.last_name}</div>
                    <div style={{ fontSize:10, color:C.gray4 }}>{emp.uk_number||"brak UK"}</div>
                  </div>
                </div>
                <span>{emp.is_student?<span className="tag-s">STUDENT</span>:<span className="tag-p">PRACOWNIK</span>}</span>
                <span style={{ color:emp.uk_number?C.gray6:C.gray3, fontSize:12 }}>{emp.uk_number||"—"}</span>
                <span style={{ color:C.blue, textAlign:"right", fontSize:12, fontWeight:600 }}>
                  {(()=>{ const h=myProjects.reduce((s,p)=>s+empTotal(p.id,emp.id),0); return h>0?`${h}h`:"—"; })()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PROJECTS ═══ */}
      {tab==="projects"&&isAdmin&&(
        <div style={{ padding:"24px 28px", maxWidth:640 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:20, color:C.gray7 }}>Projekty</div>
            <button className="btn btn-sm" style={{ marginLeft:"auto" }} onClick={()=>setModal("addProj")}>+ Dodaj projekt</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {projects.map(p=>{
              const total=projTotal(p.id);
              const empCount=employees.filter(e=>empTotal(p.id,e.id)>0).length;
              const mgrs=managers.filter(m=>mgrProjects.some(mp=>mp.manager_id===m.id&&mp.project_id===p.id)&&!m.is_admin);
              return (
                <div key={p.id} onClick={()=>{setActiveProj(p.id);setTab("timesheet");}}
                  style={{ padding:"16px 18px", background:C.white, border:`1px solid ${C.gray3}`,
                           borderRadius:10, cursor:"pointer", transition:"border-color .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray3}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                      <div style={{ fontWeight:600, fontSize:15, color:C.gray7 }}>{p.name}</div>
                      {p.number&&<div style={{ fontSize:12, color:C.gray4 }}>nr {p.number}</div>}
                    </div>
                    <div style={{ color:C.blue, fontWeight:700 }}>{total>0?`${total}h`:"—"}</div>
                  </div>
                  <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:11, color:C.gray4 }}>{empCount} aktywnych pracowników</span>
                    {mgrs.map(m=><span key={m.id} className="proj-chip" style={{ fontSize:10 }}>{m.name}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MANAGERS ═══ */}
      {tab==="managers"&&isAdmin&&(
        <div style={{ padding:"24px 28px", maxWidth:700 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:20, color:C.gray7 }}>Kierownicy</div>
            <button className="btn btn-sm" style={{ marginLeft:"auto" }}
              onClick={()=>{setFMgrName("");setFMgrPin("");setFMgrProjs([]);setModal("addMgr");}}>
              + Dodaj kierownika
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {managers.map(mgr=>{
              const mgrProjIds=mgrProjects.filter(mp=>mp.manager_id===mgr.id).map(mp=>mp.project_id);
              return (
                <div key={mgr.id} style={{ padding:"16px 18px", background:C.white,
                                           border:`1px solid ${C.gray3}`, borderRadius:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%",
                                  background:mgr.is_admin?"#FFF3E0":C.blueLight,
                                  color:mgr.is_admin?"#E07B20":C.blue,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontSize:13, fontWeight:600, flexShrink:0 }}>
                      {mgr.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontWeight:600, fontSize:14, color:C.gray7 }}>{mgr.name}</span>
                        {mgr.is_admin&&<span className="tag-a">ADMIN</span>}
                      </div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        {mgr.is_admin
                          ? <span style={{ fontSize:11, color:C.gray4 }}>Pełny dostęp</span>
                          : mgrProjIds.length===0
                            ? <span style={{ fontSize:11, color:C.gray3 }}>Brak projektów</span>
                            : mgrProjIds.map(pid=>{
                                const p=projects.find(x=>x.id===pid);
                                return p?<span key={pid} className="proj-chip">{p.name}</span>:null;
                              })
                        }
                      </div>
                    </div>
                    {!mgr.is_admin&&(
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="btn-ghost" style={{ fontSize:11 }} onClick={()=>openEditMgr(mgr)}>Edytuj</button>
                        <button className="btn-danger" onClick={()=>deleteMgr(mgr.id)}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ REPORT ═══ */}
      {tab==="report"&&(
        <div style={{ padding:"24px 28px", maxWidth:700 }}>
          <div style={{ fontWeight:700, fontSize:20, color:C.gray7, marginBottom:16 }}>
            Raport — {MONTHS[month]} {year}
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"center" }}>
            <button className="btn-ghost" onClick={prevMonth} style={{ padding:"6px 12px" }}>‹</button>
            <span style={{ color:C.blue, fontWeight:600, fontSize:14 }}>{MONTHS[month]} {year}</span>
            <button className="btn-ghost" onClick={nextMonth} style={{ padding:"6px 12px" }}>›</button>
          </div>
          {myProjects.map(p=>{
            const total=projTotal(p.id);
            const rows=employees.map(e=>({emp:e,h:empTotal(p.id,e.id)})).filter(r=>r.h>0);
            return (
              <div key={p.id} className="card" style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:total>0?16:0 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:16, color:C.gray7 }}>{p.name}</div>
                    {p.number&&<div style={{ fontSize:11, color:C.gray4 }}>nr {p.number}</div>}
                  </div>
                  <div style={{ color:C.blue, fontWeight:700, fontSize:20 }}>{total>0?`${total}h`:"—"}</div>
                </div>
                {total===0
                  ? <div style={{ color:C.gray4, fontSize:12, marginTop:6 }}>Brak wpisów w tym miesiącu.</div>
                  : rows.map(({emp,h})=>(
                    <div key={emp.id} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:24, height:24, borderRadius:"50%", background:C.blueLight,
                                        color:C.blue, display:"flex", alignItems:"center", justifyContent:"center",
                                        fontSize:10, fontWeight:600 }}>{emp.first_name[0]}{emp.last_name[0]}</div>
                          {emp.first_name} {emp.last_name}
                          {emp.is_student&&<span className="tag-s">student</span>}
                        </span>
                        <span style={{ color:C.blue, fontWeight:600 }}>{h}h</span>
                      </div>
                      <div style={{ height:4, background:C.gray2, borderRadius:2 }}>
                        <div style={{ height:"100%", width:`${(h/total)*100}%`,
                                      background:C.blue, borderRadius:2, transition:"width .4s" }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {modal==="addEmp"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:18, color:C.gray7 }}>Nowy pracownik</div>
            <div><label className="lbl">Imię</label><input className="inp" placeholder="Anna" value={fFirst} onChange={e=>setFFirst(e.target.value)} /></div>
            <div><label className="lbl">Nazwisko</label><input className="inp" placeholder="Kowalska" value={fLast} onChange={e=>setFLast(e.target.value)} /></div>
            <div><label className="lbl">Numer UK (opcjonalnie)</label><input className="inp" placeholder="UK123456" value={fUk} onChange={e=>setFUk(e.target.value)} /></div>
            <label style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, cursor:"pointer", color:C.gray6 }}>
              <input type="checkbox" checked={fStudent} onChange={e=>setFStudent(e.target.checked)} style={{ accentColor:C.blue }} /> Student
            </label>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn" onClick={addEmployee}>Dodaj pracownika</button>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
      {modal==="addProj"&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:18, color:C.gray7 }}>Nowy projekt</div>
            <div><label className="lbl">Nazwa projektu</label><input className="inp" placeholder="np. Projekt Delta" value={fProjName} onChange={e=>setFProjName(e.target.value)} /></div>
            <div>
              <label className="lbl">Numer projektu</label>
              <input className="inp" placeholder="np. 2024-001" value={fProjNum} onChange={e=>setFProjNum(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProject()} />
              <div style={{ fontSize:11, color:C.gray4, marginTop:5 }}>Numer może się powtarzać między projektami.</div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn" onClick={addProject}>Dodaj projekt</button>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
      {(modal==="addMgr"||modal==="editMgr")&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal modal-wide" onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:18, color:C.gray7 }}>
              {modal==="addMgr"?"Nowy kierownik":"Edytuj kierownika"}
            </div>
            <div><label className="lbl">Imię i nazwisko</label><input className="inp" placeholder="Jan Kowalski" value={fMgrName} onChange={e=>setFMgrName(e.target.value)} /></div>
            <div>
              <label className="lbl">PIN — 4 cyfry{modal==="editMgr"?" (puste = bez zmiany)":""}</label>
              <input className="inp" type="password" maxLength={4} placeholder="••••"
                value={fMgrPin} onChange={e=>setFMgrPin(e.target.value.replace(/\D/g,"").slice(0,4))} />
            </div>
            <div>
              <label className="lbl">Przypisz projekty</label>
              <div className="checkbox-grid">
                {projects.map(p=>{ const checked=fMgrProjs.includes(p.id); return (
                  <label key={p.id} className="cb-item">
                    <input type="checkbox" checked={checked}
                      onChange={()=>setFMgrProjs(prev=>checked?prev.filter(x=>x!==p.id):[...prev,p.id])} />
                    {p.number?`[${p.number}] ${p.name}`:p.name}
                  </label>
                );})}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn" onClick={modal==="addMgr"?addManager:saveEditMgr}>
                {modal==="addMgr"?"Dodaj kierownika":"Zapisz zmiany"}
              </button>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

const TH = {
  padding:"7px 4px", textAlign:"center", fontSize:10, fontWeight:600,
  letterSpacing:".05em", borderRight:`1px solid #D8DCE2`,
};

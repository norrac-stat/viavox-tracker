import { useState, useMemo, useEffect, useRef } from "react";
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
  const [empProjFilter, setEmpProjFilter] = useState("all"); // "all" or project id
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
  const [importRows,  setImportRows]  = useState([]); // parsed preview rows
  const [importing,   setImporting]   = useState(false);
  const importFileRef   = useRef(null);
  const importHoursRef  = useRef(null);
  const importEmpsRef   = useRef(null);
  const [importHoursRows, setImportHoursRows] = useState([]);
  const [importEmpsRows,  setImportEmpsRows]  = useState([]);
  const [importingHours,  setImportingHours]  = useState(false);
  const [importingEmps,   setImportingEmps]   = useState(false);

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

  // ── TIMESHEET: pracownicy filtrowane po aktywnym projekcie ─────────────────
  const empsOnProject = useMemo(() => {
    if (!activeProj) return employees;
    const empIdsWithHours = new Set(
      Object.keys(hoursMap)
        .filter(k => k.startsWith(activeProj + "|"))
        .map(k => k.split("|")[1])
    );
    if (empIdsWithHours.size === 0) return employees;
    return employees.filter(e => empIdsWithHours.has(e.id));
  }, [employees, activeProj, hoursMap]);

  // filteredEmps — używane w timesheecie (searchQ + projekt)
  const filteredEmps = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    const base = q ? employees : empsOnProject;
    return base.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
    );
  }, [empsOnProject, employees, searchQ]);

  // ── PRACOWNICY: osobny filtr i wyszukiwanie ───────────────────────────────
  const [empSearch, setEmpSearch] = useState("");

  const filteredEmpsTab = useMemo(() => {
    const q = empSearch.toLowerCase().trim();
    let base = employees;
    if (empProjFilter !== "all") {
      const empIdsWithHours = new Set(
        Object.keys(hoursMap)
          .filter(k => k.startsWith(empProjFilter + "|"))
          .map(k => k.split("|")[1])
      );
      base = empIdsWithHours.size > 0
        ? employees.filter(e => empIdsWithHours.has(e.id))
        : employees;
    }
    return q ? employees.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
    ) : base;
  }, [employees, empProjFilter, hoursMap, empSearch]);

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

  // ── Import helpers ───────────────────────────────────────────────────────
  function parseCSVLine(line) {
    const result = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      // skip header row (first line)
      const rows = lines.slice(1).map(line => {
        const cols = parseCSVLine(line);
        return {
          name:    (cols[0]||"").trim(),
          number:  (cols[1]||"").trim(),
          mgr1:    (cols[2]||"").trim(),
          mgr2:    (cols[3]||"").trim(),
          mgr3:    (cols[4]||"").trim(),
        };
      }).filter(r => r.name);
      setImportRows(rows);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function runImport() {
    if (importRows.length === 0) return;
    setImporting(true);
    let projAdded = 0, mgrAdded = 0;
    for (const row of importRows) {
      // upsert project
      let projId;
      const existingProj = projects.find(p => p.name === row.name && p.number === row.number);
      if (existingProj) {
        projId = existingProj.id;
      } else {
        const { data } = await supabase.from("projects")
          .insert({ name: row.name, number: row.number })
          .select().single();
        if (data) { projId = data.id; setProjects(prev => [...prev, data]); projAdded++; }
      }
      if (!projId) continue;

      // process managers
      for (const mgrName of [row.mgr1, row.mgr2, row.mgr3].filter(Boolean)) {
        let mgr = managers.find(m => m.name === mgrName);
        if (!mgr) {
          const { data } = await supabase.from("managers")
            .insert({ name: mgrName, pin: "1234", is_admin: false })
            .select().single();
          if (data) { mgr = data; setManagers(prev => [...prev, data]); mgrAdded++; }
        }
        if (!mgr) continue;
        // assign if not already
        const alreadyAssigned = mgrProjects.some(mp => mp.manager_id === mgr.id && mp.project_id === projId);
        if (!alreadyAssigned) {
          await supabase.from("manager_projects").insert({ manager_id: mgr.id, project_id: projId });
          setMgrProjects(prev => [...prev, { manager_id: mgr.id, project_id: projId }]);
        }
      }
      // admin always gets access
      if (currentManager?.is_admin) {
        const alreadyAdmin = mgrProjects.some(mp => mp.manager_id === currentManager.id && mp.project_id === projId);
        if (!alreadyAdmin) {
          await supabase.from("manager_projects").insert({ manager_id: currentManager.id, project_id: projId });
          setMgrProjects(prev => [...prev, { manager_id: currentManager.id, project_id: projId }]);
        }
      }
    }
    setImporting(false);
    setModal(null);
    setImportRows([]);
    if (importFileRef.current) importFileRef.current.value = "";
    showToast(`Zaimportowano: ${projAdded} projektów, ${mgrAdded} nowych kierowników`);
  }

  // ── Import godzin z Excel (timesheet) ────────────────────────────────────
  function handleImportHoursFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        // dynamically import xlsx library
        const XLSX = window.XLSX;
        if (!XLSX) { showToast("Błąd: biblioteka XLSX nie załadowana", "err"); return; }
        const wb   = XLSX.read(ev.target.result, { type:"array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const raw  = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });

        // row 0 = title, row 1 = headers (days), row 2 = dow, row 3+ = data
        const headerRow = raw[1] || [];
        // find day columns: cols where header is a number 1-31
        const dayCols = [];
        for (let ci = 0; ci < headerRow.length; ci++) {
          const v = headerRow[ci];
          if (typeof v === "number" && v >= 1 && v <= 31) dayCols.push({ ci, day: v });
        }

        const rows = [];
        for (let ri = 3; ri < raw.length; ri++) {
          const row = raw[ri];
          const last    = String(row[0]||"").trim();
          const first   = String(row[1]||"").trim();
          const uk      = String(row[2]||"").trim();
          const student = String(row[3]||"").trim().toUpperCase() === "TAK";
          const projRaw = String(row[4]||"").trim();
          if (!last && !first) continue;

          // parse project name/number
          let projName = projRaw, projNum = "";
          if (projRaw.includes(" / ")) {
            const parts = projRaw.split(" / ");
            projName = parts[0].trim();
            projNum  = parts[1].trim();
          }

          const hours = {};
          for (const { ci, day } of dayCols) {
            const v = row[ci];
            const h = parseFloat(v);
            if (!isNaN(h) && h > 0) hours[day] = h;
          }
          if (Object.keys(hours).length > 0) {
            rows.push({ last, first, uk, student, projName, projNum, hours });
          }
        }
        setImportHoursRows(rows);
      } catch(err) {
        showToast("Błąd odczytu pliku: " + err.message, "err");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function runImportHours() {
    if (!importHoursRows.length) return;
    setImportingHours(true);
    let addedEmps = 0, addedProjs = 0, addedHours = 0;

    // detect month/year from activeProj context — use current year/month
    for (const row of importHoursRows) {
      // 1. upsert employee
      let emp = employees.find(e =>
        e.first_name.toLowerCase() === row.first.toLowerCase() &&
        e.last_name.toLowerCase()  === row.last.toLowerCase()
      );
      if (!emp) {
        const { data } = await supabase.from("employees").insert({
          first_name: toTitleCase(row.first),
          last_name:  toTitleCase(row.last),
          is_student: row.student,
          uk_number:  row.uk,
        }).select().single();
        if (data) { emp = data; setEmployees(prev => [...prev, data]); addedEmps++; }
      }
      if (!emp) continue;

      // 2. upsert project
      let proj = projects.find(p =>
        p.name.toLowerCase() === row.projName.toLowerCase() &&
        p.number === row.projNum
      );
      if (!proj && row.projName) {
        const { data } = await supabase.from("projects").insert({
          name: row.projName, number: row.projNum,
        }).select().single();
        if (data) { proj = data; setProjects(prev => [...prev, data]); addedProjs++; }
      }
      if (!proj) continue;

      // 3. insert hours
      for (const [day, h] of Object.entries(row.hours)) {
        const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        await supabase.from("hours").upsert({
          employee_id: emp.id, project_id: proj.id,
          work_date: dateStr, hours: h,
        }, { onConflict: "employee_id,project_id,work_date" });
        const key = `${proj.id}|${emp.id}|${dateStr}`;
        setHoursMap(prev => ({ ...prev, [key]: String(h) }));
        addedHours++;
      }
    }

    setImportingHours(false);
    setModal(null);
    setImportHoursRows([]);
    if (importHoursRef.current) importHoursRef.current.value = "";
    showToast(`Import: ${addedEmps} nowych pracowników, ${addedProjs} projektów, ${addedHours} godzin`);
  }

  // ── Import pracowników (bez godzin) ───────────────────────────────────────
  function handleImportEmpsFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) { showToast("Błąd: biblioteka XLSX nie załadowana", "err"); return; }
        const wb   = XLSX.read(ev.target.result, { type:"array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const raw  = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });

        const rows = [];
        const seen = new Set();
        for (let ri = 1; ri < raw.length; ri++) {
          const row = raw[ri];
          const last    = String(row[0]||"").trim();
          const first   = String(row[1]||"").trim();
          const uk      = String(row[2]||"").trim();
          const student = String(row[3]||"").trim().toUpperCase() === "TAK";
          if (!last || !first) continue;
          const key = `${first}|${last}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ last, first, uk, student });
        }
        setImportEmpsRows(rows);
      } catch(err) {
        showToast("Błąd odczytu pliku: " + err.message, "err");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function runImportEmps() {
    if (!importEmpsRows.length) return;
    setImportingEmps(true);
    let added = 0;
    for (const row of importEmpsRows) {
      const exists = employees.find(e =>
        e.first_name.toLowerCase() === row.first.toLowerCase() &&
        e.last_name.toLowerCase()  === row.last.toLowerCase()
      );
      if (exists) continue;
      const { data } = await supabase.from("employees").insert({
        first_name: toTitleCase(row.first),
        last_name:  toTitleCase(row.last),
        is_student: row.student,
        uk_number:  row.uk,
      }).select().single();
      if (data) { setEmployees(prev => [...prev, data]); added++; }
    }
    setImportingEmps(false);
    setModal(null);
    setImportEmpsRows([]);
    if (importEmpsRef.current) importEmpsRef.current.value = "";
    showToast(`Dodano ${added} nowych pracowników`);
  }

  function toTitleCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
                    <select className="inp" value={activeProj||""} onChange={e=>setActiveProj(e.target.value||null)}
                      style={{ width:260, padding:"7px 10px", fontSize:13, fontWeight:500, color:C.gray7,
                               borderColor:activeProj?C.blue:C.gray3,
                               boxShadow:activeProj?`0 0 0 3px ${C.blueLight}`:"none" }}>
                      <option value="">— wszyscy pracownicy —</option>
                      {[...myProjects].sort((a,b)=>(a.number||'').localeCompare(b.number||'', 'pl', {numeric:true})).map(p=>(
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
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <button className="btn-ghost btn-sm" onClick={()=>setModal("importHours")}>⬆ Importuj godziny</button>
              {isAdmin && (
                <button className="btn btn-sm" onClick={()=>setModal("addEmp")}>+ Pracownik</button>
              )}
            </div>
          </div>

          {/* grid */}
          {(
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
      {tab==="employees" && (()=>{
        // fixed months: June–December of current year
        const monthCols = [5,6,7,8,9,10,11].map(m => ({
          y: year, m,
          key: `${year}-${String(m+1).padStart(2,"0")}`
        }));
        const PL_MONTHS_SHORT = ["Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"];

        // hours for a specific month key
        function getMonthHours(empId, projId, mk) {
          let s=0;
          for(const [k,v] of Object.entries(hoursMap)) {
            const [kProj, kEmp, kDate] = k.split("|");
            if(kEmp===empId && kDate && kDate.startsWith(mk) && (projId==="all"||kProj===projId)) {
              s += parseFloat(v)||0;
            }
          }
          return s;
        }

        // filter projects for selector
        const projOptions = myProjects.sort((a,b)=>(a.number||"").localeCompare(b.number||"","pl",{numeric:true}));
        const activeFilter = empProjFilter;

        return (
        <div style={{ padding:"24px 28px", overflowX:"auto" }}>
          {/* toolbar */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
            <div style={{ fontWeight:700, fontSize:20, color:C.gray7 }}>Pracownicy</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, color:C.gray5, fontWeight:500 }}>Projekt</span>
              <select className="inp" value={activeFilter} onChange={e=>setEmpProjFilter(e.target.value)}
                style={{ width:240, padding:"6px 10px", fontSize:12 }}>
                <option value="all">Wszystkie projekty</option>
                {projOptions.map(p=>(
                  <option key={p.id} value={p.id}>{p.number?`[${p.number}] ${p.name}`:p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:11, color:C.gray5, fontWeight:500 }}>Szukaj</span>
              <input className="inp" placeholder="imię lub nazwisko…" value={empSearch}
                onChange={e=>setEmpSearch(e.target.value)} style={{ width:190, padding:"6px 10px", fontSize:12 }} />
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn-ghost btn-sm" onClick={()=>setModal("importEmps")}>⬆ Importuj pracowników</button>
              {isAdmin&&<button className="btn btn-sm" onClick={()=>setModal("addEmp")}>+ Dodaj pracownika</button>}
            </div>
          </div>

          {/* table */}
          <table style={{ borderCollapse:"collapse", fontSize:12, minWidth:"100%" }}>
            <thead>
              <tr style={{ background:C.gray2, borderBottom:`2px solid ${C.gray3}` }}>
                <th style={{ ...EmpTH, textAlign:"left", width:200, position:"sticky", left:0, background:C.gray2, zIndex:2 }}>PRACOWNIK</th>
                <th style={{ ...EmpTH, width:60 }}>TYP</th>
                <th style={{ ...EmpTH, width:110 }}>NR UK</th>
                {monthCols.map(({y,m,key})=>(
                  <th key={key} style={{ ...EmpTH, width:72,
                    background: (y===year&&m===month) ? C.blueMid : C.gray2,
                    color:      (y===year&&m===month) ? C.blueDark : C.gray5 }}>
                    <div style={{ fontSize:11, fontWeight:600 }}>{PL_MONTHS_SHORT[m]}</div>
                    <div style={{ fontSize:9, marginTop:1, fontWeight:400 }}>{y}</div>
                  </th>
                ))}
                <th style={{ ...EmpTH, width:80, background:C.blueDark, color:"#fff" }}>SUMA</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpsTab.map((emp,ri)=>{
                const rowBg = ri%2===0 ? C.white : "#F8FAFC";
                const monthTotals = monthCols.map(({key})=>getMonthHours(emp.id, activeFilter, key));
                const grandTotal  = monthTotals.reduce((s,v)=>s+v,0);
                const maxH = Math.max(...monthTotals, 1);
                return (
                  <tr key={emp.id} className="emp-row"
                    style={{ background:rowBg, borderBottom:`1px solid ${C.gray2}` }}>
                    {/* name */}
                    <td style={{ padding:"7px 12px", position:"sticky", left:0, zIndex:1,
                                 background:rowBg, borderRight:`1px solid ${C.gray2}`, whiteSpace:"nowrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%", background:C.blueLight,
                                      color:C.blue, display:"flex", alignItems:"center", justifyContent:"center",
                                      fontSize:10, fontWeight:600, flexShrink:0 }}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight:500, color:C.gray7 }}>{emp.first_name} {emp.last_name}</div>
                          {emp.uk_number&&<div style={{ fontSize:10, color:C.gray4 }}>{emp.uk_number}</div>}
                        </div>
                      </div>
                    </td>
                    {/* type */}
                    <td style={{ padding:"7px 10px", textAlign:"center" }}>
                      {emp.is_student?<span className="tag-s">STU</span>:<span className="tag-p">PR</span>}
                    </td>
                    {/* uk */}
                    <td style={{ padding:"7px 10px", color:emp.uk_number?C.gray6:C.gray3, textAlign:"center", fontSize:11 }}>
                      {emp.uk_number||"—"}
                    </td>
                    {/* month columns */}
                    {monthTotals.map((h, ci)=>{
                      const mk = monthCols[ci].key;
                      const isCurrent = monthCols[ci].y===year && monthCols[ci].m===month;
                      const pct = maxH>0 ? Math.round((h/maxH)*100) : 0;
                      return (
                        <td key={mk} style={{ padding:"5px 8px", textAlign:"center",
                                              background: isCurrent ? "#F0F7FF" : "transparent" }}>
                          {h>0 ? (
                            <div>
                              <div style={{ fontWeight:600, color:isCurrent?C.blue:C.gray6, fontSize:12 }}>{h}h</div>
                              <div style={{ height:3, background:C.gray2, borderRadius:2, marginTop:3 }}>
                                <div style={{ height:"100%", width:`${pct}%`, background:isCurrent?C.blue:C.gray4, borderRadius:2 }}/>
                              </div>
                            </div>
                          ) : <span style={{ color:C.gray3 }}>—</span>}
                        </td>
                      );
                    })}
                    {/* grand total */}
                    <td style={{ padding:"7px 10px", textAlign:"center",
                                 fontWeight:700, color:grandTotal>0?C.blue:C.gray3,
                                 background: grandTotal>0 ? C.blueLight : "transparent",
                                 fontSize:12, borderLeft:`1px solid ${C.blueMid}` }}>
                      {grandTotal>0?`${grandTotal}h`:"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        );
      })()}

      {/* ═══ PROJECTS ═══ */}
      {tab==="projects"&&isAdmin&&(
        <div style={{ padding:"24px 28px", maxWidth:1100 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:20, gap:10 }}>
            <div style={{ fontWeight:700, fontSize:20, color:C.gray7 }}>Projekty</div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
              <button className="btn-ghost btn-sm" onClick={()=>setModal("importProj")}>⬆ Importuj z Excel/CSV</button>
              <button className="btn btn-sm" onClick={()=>setModal("addProj")}>+ Dodaj projekt</button>
            </div>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:C.gray2, borderBottom:`2px solid ${C.gray3}` }}>
                <th style={{ padding:"9px 12px", textAlign:"left", fontWeight:600, color:C.gray5, fontSize:11, width:60 }}>NR</th>
                <th style={{ padding:"9px 12px", textAlign:"left", fontWeight:600, color:C.gray5, fontSize:11 }}>NAZWA PROJEKTU</th>
                <th style={{ padding:"9px 12px", textAlign:"left", fontWeight:600, color:C.gray5, fontSize:11 }}>KIEROWNICY</th>
                <th style={{ padding:"9px 12px", textAlign:"center", fontWeight:600, color:C.gray5, fontSize:11, width:80 }}>PRAC.</th>
                <th style={{ padding:"9px 12px", textAlign:"center", fontWeight:600, color:C.gray5, fontSize:11, width:80 }}>GODZ.</th>
                <th style={{ padding:"9px 12px", width:40 }}></th>
              </tr>
            </thead>
            <tbody>
              {[...projects].sort((a,b)=>(a.number||'').localeCompare(b.number||'', 'pl', {numeric:true})).map((p,ri)=>{
                const total=projTotal(p.id);
                const empCount=employees.filter(e=>empTotal(p.id,e.id)>0).length;
                const mgrs=managers.filter(m=>mgrProjects.some(mp=>mp.manager_id===m.id&&mp.project_id===p.id)&&!m.is_admin);
                const rowBg = ri%2===0 ? C.white : "#F8FAFC";
                return (
                  <tr key={p.id} style={{ background:rowBg, borderBottom:`1px solid ${C.gray2}`, cursor:"pointer" }}
                    onClick={()=>{setActiveProj(p.id);setTab("timesheet");}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.blueLight}
                    onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                    <td style={{ padding:"8px 12px", color:C.gray4, fontWeight:500, whiteSpace:"nowrap" }}>{p.number||"—"}</td>
                    <td style={{ padding:"8px 12px", fontWeight:600, color:C.gray7 }}>{p.name}</td>
                    <td style={{ padding:"8px 12px" }}>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {mgrs.length===0
                          ? <span style={{ color:C.gray3, fontSize:11 }}>—</span>
                          : mgrs.map(m=>(
                            <span key={m.id} style={{ background:C.blueLight, color:C.blueDark,
                              fontSize:10, padding:"2px 7px", borderRadius:20, fontWeight:500, whiteSpace:"nowrap" }}>
                              {m.name}
                            </span>
                          ))
                        }
                      </div>
                    </td>
                    <td style={{ padding:"8px 12px", textAlign:"center", color:empCount>0?C.gray6:C.gray3, fontSize:12 }}>{empCount||"—"}</td>
                    <td style={{ padding:"8px 12px", textAlign:"center", color:total>0?C.blue:C.gray3, fontWeight:600, fontSize:12 }}>{total>0?`${total}h`:"—"}</td>
                    <td style={{ padding:"8px 12px", textAlign:"center" }} onClick={e=>e.stopPropagation()}>
                      <button className="btn-danger" style={{ padding:"3px 8px", fontSize:11 }}
                        onClick={async()=>{ if(!window.confirm(`Usunąć projekt "${p.name}"?`)) return;
                          await supabase.from("projects").delete().eq("id",p.id);
                          setProjects(prev=>prev.filter(x=>x.id!==p.id));
                          setMgrProjects(prev=>prev.filter(mp=>mp.project_id!==p.id));
                          if(activeProj===p.id) setActiveProj(null);
                          showToast("Projekt usunięty");
                        }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      {tab==="report"&&(()=>{
        // ── obliczenia ────────────────────────────────────────────────────────
        const totalAllH   = myProjects.reduce((s,p)=>s+projTotal(p.id),0);
        const studentEmps = employees.filter(e=>e.is_student);
        const workerEmps  = employees.filter(e=>!e.is_student);

        const studentH = myProjects.reduce((s,p)=>
          s+studentEmps.reduce((s2,e)=>s2+empTotal(p.id,e.id),0),0);
        const workerH  = myProjects.reduce((s,p)=>
          s+workerEmps.reduce((s2,e)=>s2+empTotal(p.id,e.id),0),0);

        const activeEmps  = employees.filter(e=>
          myProjects.some(p=>empTotal(p.id,e.id)>0));
        const activeStudents = activeEmps.filter(e=>e.is_student).length;
        const activeWorkers  = activeEmps.filter(e=>!e.is_student).length;

        // godziny per dzień (suma wszystkich projektów)
        const dailyH = Array.from({length:daysInMonth(year,month)},(_,i)=>{
          const d=i+1;
          return { d, h: myProjects.reduce((s,p)=>s+dayTotal(p.id,d),0) };
        });
        const maxDay = Math.max(...dailyH.map(x=>x.h),1);

        // projekty posortowane po godzinach malejąco
        const projRows = [...myProjects]
          .map(p=>({ p, h:projTotal(p.id),
            sH: studentEmps.reduce((s,e)=>s+empTotal(p.id,e.id),0),
            wH: workerEmps.reduce((s,e)=>s+empTotal(p.id,e.id),0),
            empCount: employees.filter(e=>empTotal(p.id,e.id)>0).length,
            stuCount: studentEmps.filter(e=>empTotal(p.id,e.id)>0).length,
          }))
          .filter(r=>r.h>0)
          .sort((a,b)=>b.h-a.h);

        const stuPct = totalAllH>0 ? Math.round((studentH/totalAllH)*100) : 0;
        const worPct = 100 - stuPct;

        return (
        <div style={{ padding:"24px 28px", maxWidth:1050 }}>
          {/* header */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
            <div style={{ fontWeight:700, fontSize:20, color:C.gray7 }}>Raport</div>
            <button className="btn-ghost" onClick={prevMonth} style={{ padding:"5px 10px", fontSize:14 }}>‹</button>
            <span style={{ color:C.blue, fontWeight:600, fontSize:15 }}>{MONTHS[month]} {year}</span>
            <button className="btn-ghost" onClick={nextMonth} style={{ padding:"5px 10px", fontSize:14 }}>›</button>
          </div>

          {/* KPI cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            {[
              { label:"Łączne godziny",     value:`${totalAllH}h`,        sub:`${myProjects.filter(p=>projTotal(p.id)>0).length} aktywnych projektów` },
              { label:"Aktywni pracownicy", value:activeEmps.length,       sub:`${activeStudents} studentów / ${activeWorkers} pracowników` },
              { label:"Godziny studentów",  value:`${studentH}h`,          sub:`${stuPct}% całości` },
              { label:"Godziny pracowników",value:`${workerH}h`,           sub:`${worPct}% całości` },
            ].map(({label,value,sub})=>(
              <div key={label} style={{ background:C.white, border:`1px solid ${C.gray3}`,
                borderRadius:10, padding:"16px 18px", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                <div style={{ fontSize:11, color:C.gray4, fontWeight:500, marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
                <div style={{ fontSize:26, fontWeight:700, color:C.blue, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:11, color:C.gray4, marginTop:6 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* student vs pracownik bar */}
          <div style={{ background:C.white, border:`1px solid ${C.gray3}`, borderRadius:10,
                        padding:"16px 20px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.gray6, marginBottom:10 }}>
              Podział godzin: Studenci vs Pracownicy
            </div>
            <div style={{ display:"flex", height:28, borderRadius:6, overflow:"hidden", gap:2 }}>
              <div style={{ width:`${stuPct}%`, background:"#3DAA70", display:"flex", alignItems:"center",
                            justifyContent:"center", color:"#fff", fontSize:11, fontWeight:600, minWidth:stuPct>5?0:0,
                            transition:"width .4s" }}>
                {stuPct>8?`${stuPct}% STU`:""}
              </div>
              <div style={{ flex:1, background:C.blue, display:"flex", alignItems:"center",
                            justifyContent:"center", color:"#fff", fontSize:11, fontWeight:600 }}>
                {worPct>8?`${worPct}% PR`:""}
              </div>
            </div>
            <div style={{ display:"flex", gap:20, marginTop:8, fontSize:11 }}>
              <span style={{ color:"#3DAA70", fontWeight:500 }}>● Studenci: {studentH}h ({stuPct}%)</span>
              <span style={{ color:C.blue, fontWeight:500 }}>● Pracownicy: {workerH}h ({worPct}%)</span>
            </div>
          </div>

          {/* daily chart */}
          <div style={{ background:C.white, border:`1px solid ${C.gray3}`, borderRadius:10,
                        padding:"16px 20px", marginBottom:16, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.gray6, marginBottom:12 }}>
              Godziny dzienne — {MONTHS[month]} {year}
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:80 }}>
              {dailyH.map(({d,h})=>{
                const dow = new Date(year,month,d).getDay();
                const wknd = dow===0||dow===6;
                const pct = maxDay>0 ? (h/maxDay)*100 : 0;
                return (
                  <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <div style={{ width:"100%", borderRadius:"2px 2px 0 0",
                                  height:`${pct}%`, minHeight: h>0?4:0,
                                  background: wknd ? C.gray3 : C.blue,
                                  transition:"height .3s" }} title={`${d}.${month+1}: ${h}h`}/>
                    <div style={{ fontSize:8, color: wknd?C.gray3:C.gray4 }}>{d}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* project table */}
          <div style={{ background:C.white, border:`1px solid ${C.gray3}`, borderRadius:10,
                        overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.gray2}`,
                          fontSize:12, fontWeight:600, color:C.gray6 }}>
              Zestawienie projektów
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:C.gray2 }}>
                  {["Projekt","Nr","Prac.","Stu.","Godz. STU","Godz. PR","Łącznie","% STU"].map(h=>(
                    <th key={h} style={{ padding:"8px 12px", textAlign: h==="Projekt"?"left":"center",
                                         fontSize:10, fontWeight:600, color:C.gray5,
                                         borderBottom:`1px solid ${C.gray3}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projRows.map(({p,h,sH,wH,empCount,stuCount},ri)=>{
                  const pct = h>0?Math.round((sH/h)*100):0;
                  const rowBg = ri%2===0?C.white:"#F8FAFC";
                  return (
                    <tr key={p.id} style={{ background:rowBg, borderBottom:`1px solid ${C.gray2}` }}>
                      <td style={{ padding:"9px 12px", fontWeight:500, color:C.gray7 }}>{p.name}</td>
                      <td style={{ padding:"9px 12px", textAlign:"center", color:C.gray4, fontSize:11 }}>{p.number||"—"}</td>
                      <td style={{ padding:"9px 12px", textAlign:"center", color:C.gray6 }}>{empCount}</td>
                      <td style={{ padding:"9px 12px", textAlign:"center", color:"#3DAA70", fontWeight:500 }}>{stuCount}</td>
                      <td style={{ padding:"9px 12px", textAlign:"center", color:"#3DAA70", fontWeight:500 }}>{sH>0?`${sH}h`:"—"}</td>
                      <td style={{ padding:"9px 12px", textAlign:"center", color:C.blue, fontWeight:500 }}>{wH>0?`${wH}h`:"—"}</td>
                      <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:C.blue }}>{h}h</td>
                      <td style={{ padding:"9px 12px", textAlign:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ flex:1, height:6, background:C.gray2, borderRadius:3 }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:"#3DAA70",
                                          borderRadius:3, transition:"width .3s" }}/>
                          </div>
                          <span style={{ fontSize:10, color:C.gray5, minWidth:28 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {projRows.length===0&&(
                  <tr><td colSpan={8} style={{ padding:24, textAlign:"center", color:C.gray4 }}>
                    Brak danych w tym miesiącu.
                  </td></tr>
                )}
                {/* SUMA row */}
                {projRows.length>0&&(
                  <tr style={{ background:C.gray2, borderTop:`2px solid ${C.gray3}` }}>
                    <td colSpan={2} style={{ padding:"9px 12px", fontWeight:700, color:C.gray7 }}>RAZEM</td>
                    <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:C.gray6 }}>
                      {activeEmps.length}
                    </td>
                    <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:"#3DAA70" }}>
                      {activeStudents}
                    </td>
                    <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:"#3DAA70" }}>{studentH}h</td>
                    <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:C.blue }}>{workerH}h</td>
                    <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:C.blue }}>{totalAllH}h</td>
                    <td style={{ padding:"9px 12px", textAlign:"center", fontWeight:700, color:C.gray5 }}>{stuPct}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

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
                {[...projects].sort((a,b)=>(a.number||'').localeCompare(b.number||'', 'pl', {numeric:true})).map(p=>{ const checked=fMgrProjs.includes(p.id); return (
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

      {modal==="importProj"&&(
        <div className="modal-bg" onClick={()=>{setModal(null);setImportRows([]);}}>
          <div className="modal modal-wide" onClick={e=>e.stopPropagation()} style={{ maxHeight:"80vh", overflow:"auto" }}>
            <div style={{ fontWeight:700, fontSize:18, color:C.gray7 }}>Import projektów z CSV</div>
            <div style={{ background:C.blueLight, border:`1px solid ${C.blueMid}`, borderRadius:8, padding:14, fontSize:12, color:C.blueDark }}>
              <strong>Format pliku CSV:</strong> Nazwa projektu, Numer projektu, Kierownik 1, Kierownik 2, Kierownik 3<br/>
              Pierwszy wiersz to nagłówek — zostanie pominięty.<br/>
              Nowi kierownicy dostaną domyślny PIN: <strong>1234</strong> (zmień po imporcie).
            </div>
            <div>
              <label className="lbl">Wybierz plik CSV</label>
              <input ref={importFileRef} type="file" accept=".csv,.txt" className="inp"
                style={{ padding:"7px 10px", cursor:"pointer" }}
                onChange={handleImportFile} />
              <div style={{ fontSize:11, color:C.gray4, marginTop:5 }}>
                Możesz też otworzyć plik Excel i zapisać jako CSV (UTF-8) przed importem.
              </div>
            </div>
            {importRows.length>0&&(
              <div>
                <div style={{ fontSize:12, color:C.gray5, marginBottom:8, fontWeight:500 }}>
                  Podgląd — {importRows.length} wierszy do importu:
                </div>
                <div style={{ maxHeight:260, overflow:"auto", border:`1px solid ${C.gray3}`, borderRadius:8 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr style={{ background:C.gray2 }}>
                        {["Nazwa","Numer","Kierownik 1","Kierownik 2","Kierownik 3"].map(h=>(
                          <th key={h} style={{ padding:"7px 10px", textAlign:"left", fontWeight:600,
                                               color:C.gray5, borderBottom:`1px solid ${C.gray3}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r,i)=>(
                        <tr key={i} style={{ background:i%2===0?C.white:"#F8FAFC", borderBottom:`1px solid ${C.gray2}` }}>
                          <td style={{ padding:"6px 10px", fontWeight:500, color:C.gray7 }}>{r.name}</td>
                          <td style={{ padding:"6px 10px", color:C.gray5 }}>{r.number||"—"}</td>
                          <td style={{ padding:"6px 10px", color:C.blue }}>{r.mgr1||"—"}</td>
                          <td style={{ padding:"6px 10px", color:C.blue }}>{r.mgr2||"—"}</td>
                          <td style={{ padding:"6px 10px", color:C.blue }}>{r.mgr3||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button className="btn" onClick={runImport}
                disabled={importRows.length===0||importing}>
                {importing?<><span className="spinner" style={{width:14,height:14,marginRight:6}}/>Importuję…</>
                          :`Importuj ${importRows.length} projektów`}
              </button>
              <button className="btn-ghost" onClick={()=>{setModal(null);setImportRows([]);}}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Import godzin (timesheet) ═══ */}
      {modal==="importHours"&&(
        <div className="modal-bg" onClick={()=>{setModal(null);setImportHoursRows([]);}}>
          <div className="modal modal-wide" onClick={e=>e.stopPropagation()} style={{ maxHeight:"82vh", overflowY:"auto" }}>
            <div style={{ fontWeight:700, fontSize:18, color:C.gray7 }}>Import godzin z Excel</div>
            <div style={{ background:C.blueLight, border:`1px solid ${C.blueMid}`, borderRadius:8, padding:14, fontSize:12, color:C.blueDark, lineHeight:1.6 }}>
              <strong>Format pliku:</strong> użyj wzoru VIAVOX_Godziny_[Miesiąc]_[Rok].xlsx<br/>
              Kolumny: Nazwisko, Imię, Nr UK, Student (TAK/NIE), Projekt (Nazwa / Numer), dni 1–31<br/>
              Godziny zostaną wpisane dla miesiąca: <strong>{MONTHS[month]} {year}</strong>
            </div>
            <div>
              <label className="lbl">Wybierz plik Excel (.xlsx)</label>
              <input ref={importHoursRef} type="file" accept=".xlsx,.xls" className="inp"
                style={{ padding:"7px 10px", cursor:"pointer" }}
                onChange={handleImportHoursFile} />
            </div>
            {importHoursRows.length>0&&(
              <div>
                <div style={{ fontSize:12, color:C.gray5, marginBottom:8, fontWeight:500 }}>
                  Podgląd — {importHoursRows.length} wierszy ({importHoursRows.reduce((s,r)=>s+Object.keys(r.hours).length,0)} wpisów godzin):
                </div>
                <div style={{ maxHeight:240, overflowY:"auto", border:`1px solid ${C.gray3}`, borderRadius:8 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr style={{ background:C.gray2 }}>
                        {["Pracownik","Student","Projekt","Dni z godz.","Suma"].map(h=>(
                          <th key={h} style={{ padding:"7px 10px", textAlign:"left", fontWeight:600,
                                               color:C.gray5, borderBottom:`1px solid ${C.gray3}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importHoursRows.map((r,i)=>(
                        <tr key={i} style={{ background:i%2===0?C.white:"#F8FAFC", borderBottom:`1px solid ${C.gray2}` }}>
                          <td style={{ padding:"6px 10px", fontWeight:500, color:C.gray7 }}>{r.first} {r.last}</td>
                          <td style={{ padding:"6px 10px" }}>{r.student?<span className="tag-s">STU</span>:<span className="tag-p">PR</span>}</td>
                          <td style={{ padding:"6px 10px", color:C.gray5, fontSize:11 }}>{r.projName}{r.projNum?` / ${r.projNum}`:""}</td>
                          <td style={{ padding:"6px 10px", textAlign:"center", color:C.gray6 }}>{Object.keys(r.hours).length}</td>
                          <td style={{ padding:"6px 10px", textAlign:"center", color:C.blue, fontWeight:600 }}>
                            {Object.values(r.hours).reduce((s,v)=>s+v,0)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button className="btn" onClick={runImportHours}
                disabled={importHoursRows.length===0||importingHours}>
                {importingHours
                  ? <><span className="spinner" style={{width:14,height:14,marginRight:6}}/>Importuję…</>
                  : `Importuj ${importHoursRows.length} wierszy`}
              </button>
              <button className="btn-ghost" onClick={()=>{setModal(null);setImportHoursRows([]);}}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Import pracowników ═══ */}
      {modal==="importEmps"&&(
        <div className="modal-bg" onClick={()=>{setModal(null);setImportEmpsRows([]);}}>
          <div className="modal modal-wide" onClick={e=>e.stopPropagation()} style={{ maxHeight:"82vh", overflowY:"auto" }}>
            <div style={{ fontWeight:700, fontSize:18, color:C.gray7 }}>Import pracowników z Excel</div>
            <div style={{ background:C.blueLight, border:`1px solid ${C.blueMid}`, borderRadius:8, padding:14, fontSize:12, color:C.blueDark, lineHeight:1.6 }}>
              <strong>Format pliku:</strong> kolumny A–D: Nazwisko, Imię, Nr UK, Student (TAK/NIE)<br/>
              Pierwszy wiersz = nagłówek (zostanie pominięty).<br/>
              Duplikaty (to samo imię i nazwisko) zostaną pominięte.
            </div>
            <div>
              <label className="lbl">Wybierz plik Excel (.xlsx)</label>
              <input ref={importEmpsRef} type="file" accept=".xlsx,.xls" className="inp"
                style={{ padding:"7px 10px", cursor:"pointer" }}
                onChange={handleImportEmpsFile} />
            </div>
            {importEmpsRows.length>0&&(
              <div>
                <div style={{ fontSize:12, color:C.gray5, marginBottom:8, fontWeight:500 }}>
                  Podgląd — {importEmpsRows.length} pracowników do dodania:
                </div>
                <div style={{ maxHeight:260, overflowY:"auto", border:`1px solid ${C.gray3}`, borderRadius:8 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr style={{ background:C.gray2 }}>
                        {["Nazwisko","Imię","Nr UK","Typ"].map(h=>(
                          <th key={h} style={{ padding:"7px 10px", textAlign:"left", fontWeight:600,
                                               color:C.gray5, borderBottom:`1px solid ${C.gray3}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importEmpsRows.map((r,i)=>(
                        <tr key={i} style={{ background:i%2===0?C.white:"#F8FAFC", borderBottom:`1px solid ${C.gray2}` }}>
                          <td style={{ padding:"6px 10px", fontWeight:500, color:C.gray7 }}>{r.last}</td>
                          <td style={{ padding:"6px 10px", color:C.gray6 }}>{r.first}</td>
                          <td style={{ padding:"6px 10px", color:C.gray4 }}>{r.uk||"—"}</td>
                          <td style={{ padding:"6px 10px" }}>{r.student?<span className="tag-s">STUDENT</span>:<span className="tag-p">PRACOWNIK</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <button className="btn" onClick={runImportEmps}
                disabled={importEmpsRows.length===0||importingEmps}>
                {importingEmps
                  ? <><span className="spinner" style={{width:14,height:14,marginRight:6}}/>Importuję…</>
                  : `Dodaj ${importEmpsRows.length} pracowników`}
              </button>
              <button className="btn-ghost" onClick={()=>{setModal(null);setImportEmpsRows([]);}}>Anuluj</button>
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

const EmpTH = {
  padding:"9px 10px", textAlign:"center", fontSize:10, fontWeight:600,
  color:"#6B7280", letterSpacing:".04em", borderRight:`1px solid #D8DCE2`,
};

import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight, Award, BarChart3, Bike, Bolt, Check, ChevronRight, CircleHelp, Compass, Flame, Footprints, Globe2, Leaf, Lightbulb, Menu, Plus, Recycle, RotateCcw, ShieldCheck, Sparkles, Target, Trophy, TrendingDown, Truck, Utensils, X, Zap } from "lucide-react";
import styles from "./App.module.css";

type Category = "Transport" | "Electricity" | "Food" | "Waste" | "Shopping";
type ActivityEntry = { id: string; date: string; category: Category; label: string; amount: number; unit: string; co2: number; detail: string };
type Mission = { id: string; title: string; description: string; points: number; icon: string };

// Use the visitor's local calendar date (not UTC) so a new daily journal starts at local midnight.
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => localDate();
const dateOffset = (n: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return localDate(d); };
const factorNotes = "Indicative estimates only. Actual emissions vary by region, supplier, vehicle, season and individual choices.";
const initialActivities: ActivityEntry[] = [
  { id: "demo-1", date: today(), category: "Transport", label: "Bus commute", amount: 8, unit: "km", co2: 0.84, detail: "Public bus · 0.105 kg CO₂e/km" },
  { id: "demo-2", date: today(), category: "Food", label: "Mixed meal", amount: 1, unit: "meal", co2: 2.5, detail: "Mixed meal · approx. 2.5 kg CO₂e" },
  { id: "demo-3", date: today(), category: "Electricity", label: "Home electricity", amount: 3.2, unit: "kWh", co2: 2.29, detail: "Indicative India grid factor · 0.716 kg/kWh" },
  { id: "demo-4", date: dateOffset(-1), category: "Transport", label: "Walk / cycle", amount: 3, unit: "km", co2: 0, detail: "Active travel · direct operational emissions" },
  { id: "demo-5", date: dateOffset(-1), category: "Food", label: "Plant-rich meal", amount: 2, unit: "meal", co2: 1.6, detail: "Plant-rich meal · approx. 0.8 kg CO₂e each" },
  { id: "demo-6", date: dateOffset(-2), category: "Transport", label: "Car ride", amount: 6, unit: "km", co2: 1.15, detail: "Average car · 0.192 kg CO₂e/km" },
  { id: "demo-7", date: dateOffset(-2), category: "Waste", label: "Waste to landfill", amount: 1, unit: "kg", co2: 0.5, detail: "Mixed waste estimate · 0.5 kg CO₂e/kg" },
  { id: "demo-8", date: dateOffset(-3), category: "Electricity", label: "Home electricity", amount: 2.5, unit: "kWh", co2: 1.79, detail: "Indicative India grid factor · 0.716 kg/kWh" },
  { id: "demo-9", date: dateOffset(-4), category: "Food", label: "Meat-heavy meal", amount: 1, unit: "meal", co2: 5.5, detail: "Meat-heavy meal · approx. 5.5 kg CO₂e" },
  { id: "demo-10", date: dateOffset(-5), category: "Transport", label: "Train journey", amount: 12, unit: "km", co2: 0.49, detail: "Rail · 0.041 kg CO₂e/km" },
  { id: "demo-11", date: dateOffset(-6), category: "Waste", label: "Recycling", amount: 2, unit: "kg", co2: 0.16, detail: "Recycled material handling estimate · 0.08 kg/kg" },
];
const missions: Mission[] = [
  { id: "walk", title: "Move under your own power", description: "Walk or cycle for one short trip today.", points: 30, icon: "steps" },
  { id: "switch", title: "Power down for an hour", description: "Switch off lights and unused devices.", points: 20, icon: "bolt" },
  { id: "plant", title: "Choose a greener plate", description: "Make one meal plant-rich today.", points: 25, icon: "food" },
];
const categoryMeta: Record<Category, { color: string; icon: React.ReactNode; note: string }> = {
  Transport: { color: "#397c55", icon: <Truck size={16} />, note: "Car 0.192 · Bus 0.105 · Train 0.041 kg/km" },
  Electricity: { color: "#a5c957", icon: <Bolt size={16} />, note: "Indicative grid factor: 0.716 kg/kWh" },
  Food: { color: "#d5a64e", icon: <Utensils size={16} />, note: "Plant-rich 0.8 · Mixed 2.5 · Meat-heavy 5.5 kg/meal" },
  Waste: { color: "#719b88", icon: <Recycle size={16} />, note: "Landfill 0.5 · Recycled 0.08 kg/kg" },
  Shopping: { color: "#8a9d6c", icon: <Activity size={16} />, note: "General purchase placeholder: 1.5 kg/item" },
};

function estimate(category: Category, mode: string, amount: number) {
  if (category === "Transport") return ({ car: amount * .192, bus: amount * .105, train: amount * .041, flight: amount * .255, cycle: 0, walk: 0 } as Record<string, number>)[mode] ?? 0;
  if (category === "Electricity") return amount * .716;
  if (category === "Food") return ({ plant: amount * .8, mixed: amount * 2.5, meat: amount * 5.5 } as Record<string, number>)[mode] ?? 0;
  if (category === "Waste") return ({ landfill: amount * .5, recycled: amount * .08 } as Record<string, number>)[mode] ?? 0;
  return amount * 1.5;
}
const fmt = (n: number) => n.toFixed(1);

export default function HomePage() {
  const [activities, setActivities] = useState<ActivityEntry[]>(initialActivities);
  const [completed, setCompleted] = useState<string[]>([]);
  const [completedDate, setCompletedDate] = useState(today());
  const [points, setPoints] = useState(240);
  const [tab, setTab] = useState("Overview");
  const [showAdd, setShowAdd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [category, setCategory] = useState<Category>("Transport");
  const [mode, setMode] = useState("bus");
  const [amount, setAmount] = useState("5");
  const [entryDate, setEntryDate] = useState(today());
  const [label, setLabel] = useState("Bus commute");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ecoquest-v2") || localStorage.getItem("ecoquest-v1");
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.activities)) setActivities(data.activities);
        if (data.completedDate === today() && Array.isArray(data.completed)) setCompleted(data.completed);
        else { setCompleted([]); setCompletedDate(today()); }
        if (typeof data.points === "number") setPoints(data.points);
      }
    } catch { /* Start with the sample experience if local data is unavailable. */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem("ecoquest-v2", JSON.stringify({ activities, completed, completedDate, points })); } catch { /* Private browsing may block storage. */ }
  }, [activities, completed, completedDate, points]);

  const todayTotal = useMemo(() => activities.filter(a => a.date === today()).reduce((s, a) => s + a.co2, 0), [activities]);
  const weekTotal = useMemo(() => activities.filter(a => a.date >= dateOffset(-6) && a.date <= today()).reduce((s, a) => s + a.co2, 0), [activities]);
  const monthTotal = useMemo(() => activities.filter(a => a.date >= dateOffset(-29) && a.date <= today()).reduce((s, a) => s + a.co2, 0), [activities]);
  const dailyScore = Math.max(0, Math.min(100, Math.round(100 - todayTotal * 5.2)));
  const weeklyChart = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = dateOffset(i - 6);
    return { day: new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short" }), value: activities.filter(a => a.date === date).reduce((s, a) => s + a.co2, 0) };
  }), [activities]);
  const categoryChart = useMemo(() => (Object.keys(categoryMeta) as Category[]).map(name => ({ name, value: activities.filter(a => a.date === today() && a.category === name).reduce((s, a) => s + a.co2, 0), color: categoryMeta[name].color })).filter(x => x.value > 0), [activities]);
  const recent = [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const todayCompleted = completedDate === today() ? completed : [];
  const completedPoints = missions.filter(m => todayCompleted.includes(m.id)).reduce((s, m) => s + m.points, 0);
  const level = Math.floor(points / 250) + 1;
  const progress = (points % 250) / 250 * 100;

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const changeCategory = (next: Category) => {
    setCategory(next);
    const defaults: Record<Category, { mode: string; label: string }> = {
      Transport: { mode: "bus", label: "Bus commute" }, Electricity: { mode: "home", label: "Home electricity" }, Food: { mode: "plant", label: "Plant-rich meal" }, Waste: { mode: "landfill", label: "Waste to landfill" }, Shopping: { mode: "purchase", label: "Everyday purchase" },
    };
    setMode(defaults[next].mode); setLabel(defaults[next].label);
  };
  const saveActivity = () => {
    const qty = Number(amount);
    if (!label.trim() || !Number.isFinite(qty) || qty <= 0) { notify("Enter a name and an amount greater than zero."); return; }
    const unit = category === "Transport" ? "km" : category === "Electricity" ? "kWh" : category === "Food" ? "meal" : category === "Waste" ? "kg" : "item";
    const co2 = estimate(category, mode, qty);
    const details = categoryMeta[category].note;
    setActivities(old => [{ id: crypto.randomUUID(), date: entryDate, category, label: label.trim(), amount: qty, unit, co2, detail: details }, ...old]);
    setShowAdd(false); setTab("Overview"); notify(`Activity saved · ${fmt(co2)} kg CO₂e estimated`);
    setAmount("5");
  };
  const toggleMission = (id: string) => {
    const current = completedDate === today() ? completed : [];
    setCompletedDate(today());
    const mission = missions.find(m => m.id === id)!;
    if (current.includes(id)) { setCompleted(current.filter(x => x !== id)); setPoints(p => Math.max(0, p - mission.points)); }
    else { setCompleted([...current, id]); setPoints(p => p + mission.points); notify(`+${mission.points} Eco Points earned!`); }
  };
  const resetDemo = () => { setActivities(initialActivities); setCompleted([]); setCompletedDate(today()); setPoints(240); notify("Demo progress restored."); };

  const navItems = [
    { name: "Overview", icon: <Compass size={18} /> }, { name: "Log activity", icon: <Plus size={18} /> }, { name: "Missions", icon: <Target size={18} /> }, { name: "Insights", icon: <BarChart3 size={18} /> }, { name: "Leaderboard", icon: <Trophy size={18} /> },
  ];
  const go = (name: string) => { setTab(name); setMobileNav(false); if (name === "Log activity") setShowAdd(true); else setShowAdd(false); };

  return <div className={styles.appShell}>
    <aside className={`${styles.sidebar} ${mobileNav ? styles.sidebarOpen : ""}`}>
      <div className={styles.brand}><div className={styles.brandMark}><Leaf size={22} /></div><div><strong>ecoquest<span>.</span></strong><small>PLAY GREEN. LIVE CLEAN.</small></div><button className={styles.closeNav} onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18} /></button></div>
      <div className={styles.profileMini}><div className={styles.avatar}>A</div><div><strong>Eco Explorer</strong><small>Level {level} · Earth ally</small></div><span className={styles.onlineDot} /></div>
      <div className={styles.navLabel}>YOUR SPACE</div>
      <nav className={styles.navList}>{navItems.map(item => <button key={item.name} className={`${styles.navItem} ${tab === item.name ? styles.navActive : ""}`} onClick={() => go(item.name)}>{item.icon}<span>{item.name}</span>{item.name === "Missions" && <b>{missions.length - todayCompleted.length}</b>}</button>)}</nav>
      <div className={styles.sideChallenge}><div className={styles.challengeIcon}><Sparkles size={18} /></div><strong>Small steps.<br />Big impact.</strong><p>Every mindful choice moves the planet forward.</p><div className={styles.sideProgress}><span style={{ width: `${progress}%` }} /></div><small>{points} / {level * 250} XP to next level</small></div>
      <div className={styles.sidebarBottom}><div className={styles.earthBadge}><Globe2 size={17} /><span>One planet. Better choices.</span></div><button onClick={resetDemo} className={styles.resetButton}><RotateCcw size={14} /> Reset demo data</button></div>
    </aside>
    {mobileNav && <button className={styles.scrim} onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

    <main className={styles.mainArea}>
      <header className={styles.topbar}><button className={styles.mobileMenu} onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button><div className={styles.breadcrumb}>MY JOURNEY <ChevronRight size={13} /> <strong>{tab.toUpperCase()}</strong></div><div className={styles.topActions}><span className={styles.datePill}>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span><div className={styles.pointsPill}><Sparkles size={15} /><b>{points}</b><span>XP</span></div><div className={styles.topAvatar}>A</div></div></header>
      <div className={styles.pageContent}>
        {tab === "Overview" && <>
          <section className={styles.welcomeRow}><div><div className={styles.eyebrow}><span className={styles.eyebrowLine} /> YOUR DAILY FIELD NOTES</div><h1>A little greener,<br /><em>every day.</em></h1><p className={styles.welcomeText}>Your everyday choices add up. See your footprint, celebrate progress, and take one small action today.</p></div><div className={styles.heroPlant}><div className={styles.heroOrb}><Leaf size={54} strokeWidth={1.3} /></div><span className={styles.orbitDot} /><span className={styles.heroCaption}>GROW AT YOUR PACE</span></div></section>
          <section className={styles.statsGrid}>
            <article className={`${styles.statCard} ${styles.statFeature}`}><div className={styles.statTop}><span>YOUR GREEN SCORE</span><div className={styles.statIconLime}><Leaf size={17} /></div></div><div className={styles.scoreRow}><strong>{dailyScore}</strong><span>/ 100</span><div className={styles.scoreRing} style={{ "--score": `${dailyScore * 3.6}deg` } as React.CSSProperties}><div><Leaf size={19} /></div></div></div><div className={styles.scoreFoot}><span className={styles.goodDot} /> {dailyScore >= 70 ? "You're making thoughtful choices" : "Every small change counts"}</div></article>
            <article className={styles.statCard}><div className={styles.statTop}><span>TODAY'S FOOTPRINT</span><div className={styles.statIcon}><Activity size={17} /></div></div><div className={styles.statValue}>{fmt(todayTotal)} <small>kg CO₂e</small></div><div className={styles.statMeta}><span className={styles.trendDown}><TrendingDown size={14} /> Keep it moving</span><span>Daily estimate</span></div><div className={styles.miniBars}>{[30,48,38,62,44,72,55,40,67,51,76,58].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></article>
            <article className={styles.statCard}><div className={styles.statTop}><span>THIS WEEK</span><div className={styles.statIcon}><BarChart3 size={17} /></div></div><div className={styles.statValue}>{fmt(weekTotal)} <small>kg CO₂e</small></div><div className={styles.statMeta}><span className={styles.neutralTag}>7 day total</span><span>{activities.filter(a => a.date >= dateOffset(-6) && a.date <= today()).length} activities logged</span></div><div className={styles.weekDots}>{weeklyChart.map((d,i)=><div key={i} className={styles.weekDotCol}><i style={{height:`${Math.max(8,Math.min(100,d.value/Math.max(weekTotal/7,1)*42))}%`}} /><small>{d.day[0]}</small></div>)}</div></article>
            <article className={styles.statCard}><div className={styles.statTop}><span>ECO POINTS</span><div className={styles.statIconGold}><Award size={17} /></div></div><div className={styles.statValue}>{points.toLocaleString("en-IN")} <small>XP</small></div><div className={styles.statMeta}><span className={styles.levelTag}>LEVEL {level}</span><span>{Math.round(progress)}% to next level</span></div><div className={styles.xpTrack}><span style={{width:`${progress}%`}} /></div><div className={styles.xpCaption}>Earth Explorer <span>Level {level + 1}</span></div></article>
          </section>

          <section className={styles.contentGrid}><article className={`${styles.panel} ${styles.emissionsPanel}`}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>YOUR FOOTPRINT</div><h2>Emissions over time</h2><p>A snapshot of your last 7 days</p></div><span className={styles.unitPill}>KG CO₂e</span></div><div className={styles.chartWrap}><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyChart} margin={{top:12,right:8,left:-20,bottom:0}}><defs><linearGradient id="ecoFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#78a85f" stopOpacity={.28}/><stop offset="100%" stopColor="#78a85f" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--border)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:"var(--muted-foreground)",fontSize:11}} dy={9}/><YAxis axisLine={false} tickLine={false} tick={{fill:"var(--muted-foreground)",fontSize:11}}/><Tooltip contentStyle={{borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",fontSize:12}} formatter={(v)=>[`${Number(v ?? 0).toFixed(2)} kg CO₂e`,"Emissions"]}/><Area type="monotone" dataKey="value" stroke="#4e875e" strokeWidth={2.5} fill="url(#ecoFill)" activeDot={{r:5,fill:"#c6ef65",stroke:"#397c55",strokeWidth:2}}/></AreaChart></ResponsiveContainer></div><div className={styles.chartFoot}><span><i /> Daily emissions estimate</span><span>Lower is better, not a competition.</span></div></article>
            <article className={`${styles.panel} ${styles.breakdownPanel}`}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>TODAY'S MIX</div><h2>Where it comes from</h2><p>Emissions by activity type</p></div><button className={styles.moreButton} onClick={() => setTab("Insights")} aria-label="View insights"><ChevronRight size={18}/></button></div>{categoryChart.length ? <><div className={styles.donutWrap}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryChart} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="91%" paddingAngle={3} stroke="none">{categoryChart.map(entry=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip formatter={(v)=>[`${Number(v ?? 0).toFixed(2)} kg CO₂e`,"Estimated"]}/></PieChart></ResponsiveContainer><div className={styles.donutCenter}><strong>{fmt(todayTotal)}</strong><small>kg CO₂e</small></div></div><div className={styles.legendList}>{categoryChart.map(c=><div key={c.name}><span><i style={{background:c.color}}/>{c.name}</span><b>{fmt(c.value)} kg</b></div>)}</div></> : <div className={styles.emptyChart}><Leaf size={24}/><span>Add an activity to see your footprint mix.</span></div>}</article></section>

          <section className={styles.lowerGrid}><article className={`${styles.panel} ${styles.activityPanel}`}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>YOUR FIELD NOTES</div><h2>Recent activities</h2><p>Little things you've logged lately</p></div><button className={styles.textLink} onClick={() => setTab("Insights")}>View all <ChevronRight size={14}/></button></div><div className={styles.activityList}>{recent.map(a=><div className={styles.activityRow} key={a.id}><div className={styles.activityIcon}>{categoryMeta[a.category].icon}</div><div className={styles.activityName}><strong>{a.label}</strong><small>{a.category} · {a.date === today() ? "Today" : new Date(`${a.date}T12:00:00`).toLocaleDateString("en",{month:"short",day:"numeric"})}</small></div><div className={styles.activityAmount}><strong>{fmt(a.co2)}</strong><small>kg CO₂e</small></div></div>)}</div></article>
            <article className={`${styles.panel} ${styles.missionPanel}`}><div className={styles.missionTop}><div><div className={styles.panelEyebrow}>TODAY'S QUEST</div><h2>One good thing.</h2><p>Small actions make a real difference.</p></div><div className={styles.missionBadge}><Target size={20}/></div></div><div className={styles.missionProgress}><div><span>{todayCompleted.length} of {missions.length} completed</span><b>{Math.round(todayCompleted.length/missions.length*100)}%</b></div><div className={styles.missionTrack}><i style={{width:`${todayCompleted.length/missions.length*100}%`}}/></div></div><div className={styles.missionPreview}>{missions.slice(0,2).map(m=><button key={m.id} className={styles.miniMission} onClick={()=>setTab("Missions")}><span className={`${styles.miniCheck} ${todayCompleted.includes(m.id)?styles.checked:""}`}>{todayCompleted.includes(m.id)?<Check size={13}/>:<ChevronRight size={13}/>}</span><span>{m.title}</span><b>+{m.points}</b></button>)}</div><button className={styles.missionCta} onClick={()=>setTab("Missions")}>Explore all missions <ChevronRight size={15}/></button></article></section>
          <div className={styles.disclaimer}><CircleHelp size={14}/><span>Carbon values are indicative estimates, not exact measurements. Factors can vary by location, supplier and activity.</span><button onClick={()=>setTab("Insights")}>How we estimate <ChevronRight size={13}/></button></div>
        </>}

        {tab === "Log activity" && <ActivityPage onAdd={()=>setShowAdd(true)} activities={activities} />}
        {tab === "Missions" && <section className={styles.subPage}><div className={styles.eyebrow}><span className={styles.eyebrowLine}/> YOUR DAILY QUESTS</div><h1>Make good moves.<br/><em>Earn your glow.</em></h1><p className={styles.subIntro}>Pick small, doable actions. Every completed mission adds Eco Points to your journey.</p><div className={styles.missionHero}><div className={styles.missionHeroIcon}><Flame size={25}/></div><div><small>QUEST PROGRESS TODAY</small><strong>{todayCompleted.length} / {missions.length} completed</strong><span>{completedPoints} points earned from today's missions</span></div><div className={styles.missionHeroRing}>{Math.round(todayCompleted.length/missions.length*100)}<small>%</small></div></div><div className={styles.questGrid}>{missions.map((m,i)=><article className={`${styles.questCard} ${todayCompleted.includes(m.id)?styles.questDone:""}`} key={m.id}><div className={styles.questCardTop}><span className={styles.questNumber}>0{i+1}</span><span className={styles.questPoints}><Sparkles size={13}/> +{m.points} XP</span></div><div className={styles.questIcon}>{m.icon==="steps"?<Footprints/>:m.icon==="bolt"?<Lightbulb/>:<Utensils/>}</div><h3>{m.title}</h3><p>{m.description}</p><button className={styles.questButton} onClick={()=>toggleMission(m.id)}>{todayCompleted.includes(m.id)?<><Check size={15}/> Completed · Undo</>:<>Mark as complete <ChevronRight size={15}/></>}</button></article>)}</div><p className={styles.finePrint}>Be honest with yourself. Missions are a motivation tool, not a verified environmental offset.</p></section>}

        {tab === "Insights" && <section className={styles.subPage}><div className={styles.eyebrow}><span className={styles.eyebrowLine}/> YOUR IMPACT, MADE CLEAR</div><h1>Know your footprint.<br/><em>Find your next step.</em></h1><p className={styles.subIntro}>A simple look at your estimated carbon emissions and the choices that shape them.</p><div className={styles.insightStats}><div className={styles.insightStat}><small>TODAY</small><strong>{fmt(todayTotal)} <i>kg</i></strong><span>Estimated CO₂e</span></div><div className={styles.insightStat}><small>LAST 7 DAYS</small><strong>{fmt(weekTotal)} <i>kg</i></strong><span>Estimated CO₂e</span></div><div className={styles.insightStat}><small>LAST 30 DAYS</small><strong>{fmt(monthTotal)} <i>kg</i></strong><span>Estimated CO₂e</span></div></div><div className={styles.insightPanels}><article className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>SEVEN DAY TREND</div><h2>Your week at a glance</h2></div></div><div className={styles.chartWrap}><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyChart}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--border)"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="value" stroke="#4e875e" fill="#a9ca83" fillOpacity={.25}/></AreaChart></ResponsiveContainer></div></article><article className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>YOUR ACTIVITY LOG</div><h2>Recent entries</h2></div></div><div className={styles.activityList}>{recent.map(a=><div className={styles.activityRow} key={a.id}><div className={styles.activityIcon}>{categoryMeta[a.category].icon}</div><div className={styles.activityName}><strong>{a.label}</strong><small>{a.category} · {a.date}</small></div><div className={styles.activityAmount}><strong>{fmt(a.co2)}</strong><small>kg CO₂e</small></div></div>)}</div></article></div><article className={`${styles.panel} ${styles.methodPanel}`}><div className={styles.methodIcon}><Lightbulb size={21}/></div><div><div className={styles.panelEyebrow}>HOW THE ESTIMATE WORKS</div><h2>Activity × emission factor = estimated CO₂e</h2><p>We multiply the amount you enter by a simple reference factor. For example, 10 km by bus × 0.105 kg/km = about 1.05 kg CO₂e. Electricity uses an indicative India grid factor of 0.716 kg/kWh. Food, waste and shopping use broad illustrative averages.</p><div className={styles.factorChips}><span>Car · 0.192 kg/km</span><span>Bus · 0.105 kg/km</span><span>Train · 0.041 kg/km</span><span>Electricity · 0.716 kg/kWh</span></div><small>{factorNotes}</small></div></article></section>}

        {tab === "Leaderboard" && <section className={styles.subPage}><div className={styles.eyebrow}><span className={styles.eyebrowLine}/> THE KINDNESS LEAGUE</div><h1>Good energy is<br/><em>better together.</em></h1><p className={styles.subIntro}>A friendly demo leaderboard that celebrates consistent eco-actions, not who has the smallest footprint.</p><div className={styles.leaderHero}><div className={styles.leaderTrophy}><Trophy size={32}/></div><div><small>YOUR CURRENT RANK</small><strong>#4 <span>of 8 explorers</span></strong><p>Keep completing missions to climb the community board.</p></div><div className={styles.leaderXp}><Sparkles size={15}/>{points} XP</div></div><div className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>THIS WEEK'S EXPLORERS</div><h2>Community good-doers</h2></div><span className={styles.demoPill}>DEMO BOARD</span></div><div className={styles.leaderList}>{[{name:"Maya Green",xp:520,rank:1,tag:"Forest Friend"},{name:"Kabir Earth",xp:430,rank:2,tag:"Eco Champion"},{name:"Riya Bloom",xp:315,rank:3,tag:"Mindful Mover"},{name:"You · Eco Explorer",xp:points,rank:4,tag:"Growing every day",you:true},{name:"Aarav Leaf",xp:190,rank:5,tag:"Fresh Starter"},{name:"Nisha Sun",xp:145,rank:6,tag:"Green Beginner"}].sort((a,b)=>b.xp-a.xp).map((p,i)=><div key={p.name} className={`${styles.leaderRow} ${p.you?styles.youRow:""}`}><b className={styles.rankNo}>{i+1}</b><div className={styles.leaderAvatar}>{p.name.charAt(0)}</div><div className={styles.leaderName}><strong>{p.name}</strong><small>{p.tag}</small></div><div className={styles.leaderScore}>{p.xp} <small>XP</small></div></div>)}</div></div><p className={styles.finePrint}>Demo community scores are sample data. Real shared leaderboards would require accounts and a shared database.</p></section>}
      </div>
    </main>

    {showAdd && <div className={styles.modalBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setShowAdd(false);}}><section className={styles.addModal} role="dialog" aria-modal="true" aria-labelledby="add-title"><div className={styles.modalHeader}><div><div className={styles.panelEyebrow}>ADD TO YOUR FIELD NOTES</div><h2 id="add-title">Log an activity</h2><p>Tell us what you did. We'll estimate the footprint.</p></div><button onClick={()=>setShowAdd(false)} className={styles.modalClose} aria-label="Close"><X/></button></div><div className={styles.formField}><label>ACTIVITY CATEGORY</label><div className={styles.categoryChoices}>{(Object.keys(categoryMeta) as Category[]).map(c=><button key={c} className={category===c?styles.categorySelected:""} onClick={()=>changeCategory(c)}>{categoryMeta[c].icon}<span>{c}</span></button>)}</div></div><div className={styles.formField}><label htmlFor="activity-name">ACTIVITY NAME</label><input id="activity-name" value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Morning commute" /></div><div className={styles.formTwo}><div className={styles.formField}><label htmlFor="activity-mode">{category === "Transport" ? "TRAVEL MODE" : category === "Electricity" ? "ENERGY TYPE" : category === "Food" ? "MEAL TYPE" : category === "Waste" ? "WASTE TYPE" : "PURCHASE TYPE"}</label><select id="activity-mode" value={mode} onChange={e=>setMode(e.target.value)}>{(category==="Transport"?[ ["car","Car"],["bus","Bus"],["train","Train"],["flight","Flight"],["cycle","Bicycle"],["walk","Walk"] ]:category==="Electricity"?[["home","Grid electricity"]]:category==="Food"?[["plant","Plant-rich"],["mixed","Mixed"],["meat","Meat-heavy"]]:category==="Waste"?[["landfill","Landfill"],["recycled","Recycled"]]:[["purchase","General purchase"]]).map(([v,n])=><option value={v} key={v}>{n}</option>)}</select></div><div className={styles.formField}><label htmlFor="activity-amount">AMOUNT ({category==="Transport"?"KM":category==="Electricity"?"KWH":category==="Food"?"MEALS":category==="Waste"?"KG":"ITEMS"})</label><input id="activity-amount" type="number" min="0.1" step="0.1" value={amount} onChange={e=>setAmount(e.target.value)}/></div></div><div className={styles.formField}><label htmlFor="activity-date">DATE</label><input id="activity-date" type="date" value={entryDate} max={today()} onChange={e=>setEntryDate(e.target.value)}/></div><div className={styles.estimatePreview}><div><small>ESTIMATED EMISSIONS</small><strong>{fmt(estimate(category,mode,Math.max(0,Number(amount)||0)))} <i>kg CO₂e</i></strong></div><span>Approximate factor</span></div><p className={styles.formNote}>This is an indicative estimate, not an exact measurement. {categoryMeta[category].note}.</p><div className={styles.modalActions}><button className={styles.cancelButton} onClick={()=>setShowAdd(false)}>Cancel</button><button className={styles.saveButton} onClick={saveActivity}><Plus size={16}/> Save activity</button></div></section></div>}
    {toast && <div className={styles.toast}><Check size={16}/>{toast}</div>}
  </div>;
}

function ActivityPage({ onAdd, activities }: { onAdd: () => void; activities: ActivityEntry[] }) {
  return <section className={styles.subPage}><div className={styles.eyebrow}><span className={styles.eyebrowLine}/> YOUR PERSONAL ACTIVITY JOURNAL</div><div className={styles.activityPageHeading}><div><h1>Everyday actions,<br/><em>made visible.</em></h1><p className={styles.subIntro}>Each calendar day has its own activity record. Today's totals start fresh, while earlier days stay in your journal.</p></div><button className={styles.primaryButton} onClick={onAdd}><Plus size={17}/> Add activity</button></div><div className={styles.journalPanel}>{activities.length?activities.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(a=><div className={styles.journalRow} key={a.id}><div className={styles.activityIcon}>{categoryMeta[a.category].icon}</div><div className={styles.activityName}><strong>{a.label}</strong><small>{a.category} · {a.detail}</small></div><div className={styles.journalDate}>{a.date}</div><div className={styles.activityAmount}><strong>{fmt(a.co2)}</strong><small>kg CO₂e</small></div></div>):<div className={styles.emptyChart}>No activities yet. Add your first one to get started.</div>}</div><div className={styles.disclaimer}><CircleHelp size={14}/><span>Entries are saved in this browser and grouped by date. Clearing browser data or using another browser/device will not carry them over.</span></div></section>;
}
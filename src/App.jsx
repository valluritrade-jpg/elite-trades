import { useState, useEffect, useRef } from "react";

const G = {
  gold:"#4f9cf9",goldLight:"#a8d4ff",goldDim:"#4f9cf944",
  bg:"#020a18",bg2:"#041020",bg3:"#071630",bg4:"#0c1e40",
  border:"#4f9cf91a",borderMid:"#4f9cf933",borderHi:"#4f9cf966",
  text:"#e0eeff",muted:"#5a7a9a",faint:"#1a2e48",
  green:"#34d399",greenDim:"#34d39922",greenBorder:"#34d39944",
  red:"#f87171",redDim:"#f8717122",redBorder:"#f8717144",
  blue:"#22d3ee",blueDim:"#22d3ee22",
  mono:"'Courier New', monospace",serif:"'Georgia', serif",
};

const DISCLAIMER="⚠️ DISCLAIMER: Elite Trades LLC provides content for educational and informational purposes only. Nothing on this platform constitutes financial advice. Always consult a licensed financial professional before making investment decisions.";

const DEFAULT_DAILY=[
  {id:"d1",symbol:"BTC/USD",name:"Bitcoin",type:"Crypto",active:true},
  {id:"d2",symbol:"ETH/USD",name:"Ethereum",type:"Crypto",active:true},
  {id:"d3",symbol:"SPY",name:"S&P 500 ETF",type:"ETF",active:true},
  {id:"d4",symbol:"QQQ",name:"Nasdaq ETF",type:"ETF",active:true},
  {id:"d5",symbol:"AAPL",name:"Apple",type:"Stock",active:true},
  {id:"d6",symbol:"NVDA",name:"NVIDIA",type:"Stock",active:true},
  {id:"d7",symbol:"TSLA",name:"Tesla",type:"Stock",active:false},
  {id:"d8",symbol:"GOLD",name:"Gold",type:"Commodity",active:true},
  {id:"d9",symbol:"EUR/USD",name:"Euro/Dollar",type:"Forex",active:true},
  {id:"d10",symbol:"SOL/USD",name:"Solana",type:"Crypto",active:false},
];
const DEFAULT_WEEKLY=[
  {id:"w1",symbol:"BTC/USD",name:"Bitcoin",type:"Crypto",active:true},
  {id:"w2",symbol:"ETH/USD",name:"Ethereum",type:"Crypto",active:true},
  {id:"w3",symbol:"SPY",name:"S&P 500 ETF",type:"ETF",active:true},
  {id:"w4",symbol:"GOLD",name:"Gold",type:"Commodity",active:true},
  {id:"w5",symbol:"EUR/USD",name:"Euro/Dollar",type:"Forex",active:true},
];
const ASSET_TYPES=["Crypto","Stock","ETF","Forex","Commodity","Index","Other"];

// Storage — use explicit if/else to avoid async nullish coalescing transpiler issues
async function storageGet(key, shared) {
  try {
    const r = await window.storage.get(key, shared || false);
    return r ? JSON.parse(r.value) : null;
  } catch(e) { return null; }
}
async function storageSet(key, val, shared) {
  try {
    await window.storage.set(key, JSON.stringify(val), shared || false);
    return true;
  } catch(e) { return false; }
}
async function storageDel(key, shared) {
  try { await window.storage.delete(key, shared || false); } catch(e) {}
}
// Built-in default admin — always available even if storage is empty
const DEFAULT_ADMIN = {
  "admin@elitetrades.com": {
    name: "Admin",
    email: "admin@elitetrades.com",
    password: btoa("EliteTrades1!"),
    isAdmin: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  }
};

async function getUsers() {
  const r = await storageGet("et_users", false);
  const stored = r !== null ? r : {};
  // Merge so default admin always exists unless overwritten
  return Object.assign({}, DEFAULT_ADMIN, stored);
}
async function saveUsers(u) { return storageSet("et_users", u, false); }
async function getSession() { return storageGet("et_session", false); }
async function saveSession(u) {
  if (u) { return storageSet("et_session", u, false); }
  return storageDel("et_session", false);
}
async function getAssetConfig() {
  const cfg = await storageGet("et_asset_config", true);
  if (cfg !== null) { return cfg; }
  return { daily: DEFAULT_DAILY, weekly: DEFAULT_WEEKLY, lastUpdated: null, updatedBy: null };
}
async function saveAssetConfig(cfg) { return storageSet("et_asset_config", cfg, true); }

// Atoms
function Label({children,style:s={}}){return <div style={{fontFamily:G.mono,fontSize:10,color:G.gold+"99",letterSpacing:"0.15em",marginBottom:8,...s}}>{children}</div>;}

function TextInput({type="text",placeholder,value,onChange,onKeyDown,disabled,style:s={}}){
  const [focus,setFocus]=useState(false);
  return <input type={type} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} disabled={disabled}
    onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
    style={{width:"100%",background:disabled?"#020810":"#030d1e",border:`1px solid ${focus?G.gold+"88":G.borderMid}`,borderRadius:6,padding:"12px 16px",color:disabled?"#555":G.text,fontFamily:G.mono,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color 0.2s",...s}}/>;
}

function Btn({children,onClick,disabled,variant="primary",size="md",style:s={}}){
  const pad=size==="sm"?"7px 14px":size==="lg"?"15px 32px":"12px 22px";
  const fz=size==="sm"?10:size==="lg"?13:11;
  const base={borderRadius:6,cursor:disabled?"not-allowed":"pointer",fontFamily:G.mono,fontWeight:700,letterSpacing:"0.08em",fontSize:fz,padding:pad,transition:"opacity 0.2s",border:"none",...s};
  if(disabled)return <button disabled style={{...base,background:"#0a1530",color:"#444"}}>{children}</button>;
  if(variant==="primary")return <button onClick={onClick} style={{...base,background:`linear-gradient(135deg,${G.gold},${G.goldLight})`,color:G.bg}} onMouseEnter={e=>e.currentTarget.style.opacity=".85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
  if(variant==="outline")return <button onClick={onClick} style={{...base,background:"transparent",color:G.gold,border:`1px solid ${G.gold}55`}} onMouseEnter={e=>e.currentTarget.style.borderColor=G.gold} onMouseLeave={e=>e.currentTarget.style.borderColor=G.gold+"55"}>{children}</button>;
  if(variant==="danger")return <button onClick={onClick} style={{...base,background:G.redDim,color:G.red,border:`1px solid ${G.redBorder}`}}>{children}</button>;
  if(variant==="ghost")return <button onClick={onClick} style={{...base,background:"transparent",color:G.muted,border:`1px solid ${G.border}`}}>{children}</button>;
  return <button onClick={onClick} style={base}>{children}</button>;
}

function Card({children,style:s={}}){return <div style={{background:`linear-gradient(135deg,${G.bg3},#050f20)`,border:`1px solid ${G.borderMid}`,borderRadius:12,padding:28,...s}}>{children}</div>;}
function Badge({label,color=G.gold}){return <span style={{fontFamily:G.mono,fontSize:9,color,background:color+"18",border:`1px solid ${color}44`,borderRadius:100,padding:"3px 9px",letterSpacing:"0.1em"}}>{label}</span>;}
function TypeBadge({type}){const colors={Crypto:"#60a5fa",Stock:"#4ade80",ETF:"#a78bfa",Forex:"#fb923c",Commodity:"#fbbf24",Index:"#e879f9",Other:G.muted};return <Badge label={type} color={colors[type]??G.muted}/>;}

// Ticker
// ─── Live Ticker ──────────────────────────────────────────────────────────────
// Finnhub API key — set VITE_FINNHUB_API_KEY in GitHub Secrets for deployed site
// In artifact preview, enter it via the key button in the ticker bar
const VITE_FINNHUB_KEY = (typeof import.meta !== "undefined" && import.meta.env?.VITE_FINNHUB_API_KEY)
  ? import.meta.env.VITE_FINNHUB_API_KEY : null;

// Seed prices shown instantly before live data loads
const SEED = {
  "BTC/USD": { price: 97500,  prev: 96200,  dp: +1.35 },
  "ETH/USD": { price: 2680,   prev: 2640,   dp: +1.52 },
  "AAPL":    { price: 213.50, prev: 211.80, dp: +0.80 },
  "SPY":     { price: 562.00, prev: 558.40, dp: +0.64 },
  "TSLA":    { price: 248.50, prev: 244.10, dp: +1.80 },
  "NVDA":    { price: 118.20, prev: 115.60, dp: +2.25 },
  "GOLD":    { price: 3120.0, prev: 3095.0, dp: +0.81 },
  "EUR/USD": { price: 1.0835, prev: 1.0812, dp: +0.21 },
};

const SYMBOLS = ["BTC/USD","ETH/USD","AAPL","SPY","TSLA","NVDA","GOLD","EUR/USD"];

// Finnhub symbol map
const FH_MAP = {
  "AAPL":    "AAPL",
  "SPY":     "SPY",
  "TSLA":    "TSLA",
  "NVDA":    "NVDA",
  "GOLD":    "OANDA:XAU_USD",
  "EUR/USD": "OANDA:EUR_USD",
};

function fmtPrice(sym, val) {
  if (val === null || val === undefined || isNaN(val)) return "--";
  if (sym === "EUR/USD") return parseFloat(val).toFixed(4);
  if (sym === "GOLD" || val >= 1000) return parseFloat(val).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  return parseFloat(val).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function fmtPct(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return "--";
  const n = parseFloat(pct);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function seedTickers() {
  return SYMBOLS.map(sym => {
    const s = SEED[sym];
    const j = 1 + (Math.random() - 0.5) * 0.003;
    const price = s.price * j;
    const dp = ((price - s.prev) / s.prev) * 100;
    return { sym, val: fmtPrice(sym, price), chg: fmtPct(dp), dp };
  });
}

// Fetch Binance 24hr ticker for BTC + ETH (no key, great CORS)
async function fetchBinance() {
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const out = {};
    data.forEach(d => {
      const price = parseFloat(d.lastPrice);
      const dp = parseFloat(d.priceChangePercent);
      if (d.symbol === "BTCUSDT") out["BTC/USD"] = { val: fmtPrice("BTC/USD", price), chg: fmtPct(dp), dp };
      if (d.symbol === "ETHUSDT") out["ETH/USD"] = { val: fmtPrice("ETH/USD", price), chg: fmtPct(dp), dp };
    });
    return out;
  } catch(e) { return {}; }
}

// Fetch one Finnhub quote
async function fetchFinnhubQuote(sym, fhSym, apiKey) {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhSym)}&token=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.c || d.c === 0) return null;
    return { val: fmtPrice(sym, d.c), chg: fmtPct(d.dp), dp: d.dp };
  } catch(e) { return null; }
}

// Fetch all Finnhub stocks/forex/gold sequentially (stay under 60 req/min)
async function fetchFinnhub(apiKey) {
  const out = {};
  const entries = Object.entries(FH_MAP);
  for (let i = 0; i < entries.length; i++) {
    const [sym, fhSym] = entries[i];
    const result = await fetchFinnhubQuote(sym, fhSym, apiKey);
    if (result) out[sym] = result;
    if (i < entries.length - 1) await new Promise(r => setTimeout(r, 150)); // small delay between calls
  }
  return out;
}

function TickerTape() {
  const [tickers, setTickers] = useState(seedTickers);
  const [apiKey, setApiKey] = useState(VITE_FINNHUB_KEY || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [status, setStatus] = useState("seed"); // "seed" | "partial" | "live" | "error"
  const [lastTime, setLastTime] = useState(null);

  const loadAll = async (key) => {
    const effectiveKey = key || apiKey;

    // Always fetch crypto (free)
    const crypto = await fetchBinance();

    // Fetch stocks/forex/gold if we have a Finnhub key
    let stocks = {};
    if (effectiveKey) {
      stocks = await fetchFinnhub(effectiveKey);
    }

    const all = { ...crypto, ...stocks };
    const liveCount = Object.keys(all).length;

    if (liveCount === 0) {
      setStatus("seed");
      // animate seed prices slightly
      setTickers(seedTickers());
      return;
    }

    setTickers(prev => prev.map(t => all[t.sym] ? { ...t, ...all[t.sym] } : t));
    setLastTime(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}));

    if (liveCount >= 8) setStatus("live");
    else if (effectiveKey) setStatus("partial");
    else setStatus("partial"); // crypto only
  };

  useEffect(() => {
    loadAll(apiKey);
    const iv = setInterval(() => loadAll(apiKey), 15000);
    return () => clearInterval(iv);
  }, [apiKey]);

  const saveKey = () => {
    setApiKey(keyDraft.trim());
    setShowKeyInput(false);
    loadAll(keyDraft.trim());
  };

  const statusColor = status === "live" ? G.green : status === "partial" ? G.gold : G.faint;
  const statusLabel = status === "live" ? "● LIVE" : status === "partial" ? "◑ PARTIAL" : "◌ EST";

  const items = [...tickers, ...tickers];

  return (
    <div style={{position:"relative"}}>
      <div style={{background:"#030d1e",borderBottom:`1px solid ${G.gold}33`,overflow:"hidden",height:34,display:"flex",alignItems:"center"}}>
        <div style={{display:"flex",gap:48,animation:"ticker 40s linear infinite",whiteSpace:"nowrap",paddingRight:120}}>
          {items.map((t,i) => (
            <span key={i} style={{fontFamily:G.mono,fontSize:12}}>
              <span style={{color:G.gold,fontWeight:700}}>{t.sym}</span>
              <span style={{color:G.text,margin:"0 6px"}}>{t.val}</span>
              <span style={{color: t.dp >= 0 ? G.green : G.red}}>{t.chg}</span>
            </span>
          ))}
        </div>
        {/* Status + key button */}
        <div style={{position:"absolute",right:0,top:0,height:34,display:"flex",alignItems:"center",background:"linear-gradient(90deg,transparent,#030d1e 18px)",paddingLeft:24,paddingRight:8,gap:8,zIndex:10}}>
          {lastTime && <span style={{fontFamily:G.mono,fontSize:8,color:G.faint}}>{lastTime}</span>}
          <span style={{fontFamily:G.mono,fontSize:8,color:statusColor}}>{statusLabel}</span>
          <button onClick={()=>{setKeyDraft(apiKey);setShowKeyInput(v=>!v);}}
            title="Set Finnhub API Key"
            style={{background:apiKey?"#0a2a10":"#1a0a0a",border:`1px solid ${apiKey?G.green+"44":G.red+"44"}`,borderRadius:4,color:apiKey?G.green:G.red,fontFamily:G.mono,fontSize:8,padding:"2px 6px",cursor:"pointer",letterSpacing:"0.05em"}}>
            {apiKey ? "🔑 KEY SET" : "🔑 ADD KEY"}
          </button>
        </div>
      </div>

      {/* API Key input dropdown */}
      {showKeyInput && (
        <div style={{position:"absolute",top:34,right:0,zIndex:200,background:"#071630",border:`1px solid ${G.borderMid}`,borderRadius:"0 0 8px 8px",padding:"14px 16px",minWidth:340,boxShadow:"0 8px 24px #000a"}}>
          <div style={{fontFamily:G.mono,fontSize:9,color:G.gold,letterSpacing:"0.15em",marginBottom:6}}>FINNHUB API KEY</div>
          <div style={{fontFamily:G.mono,fontSize:10,color:G.muted,marginBottom:10,lineHeight:1.7}}>
            Get a free key at <span style={{color:G.goldLight}}>finnhub.io</span> → sign up → API Keys tab.<br/>
            Enables real-time prices for stocks, gold & forex.
          </div>
          <div style={{display:"flex",gap:8}}>
            <input
              value={keyDraft}
              onChange={e=>setKeyDraft(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveKey()}
              placeholder="Enter your Finnhub API key..."
              style={{flex:1,background:"#030d1e",border:`1px solid ${G.borderMid}`,borderRadius:5,padding:"8px 10px",color:G.text,fontFamily:G.mono,fontSize:11,outline:"none"}}
            />
            <button onClick={saveKey}
              style={{background:`linear-gradient(135deg,${G.gold},${G.goldLight})`,border:"none",borderRadius:5,color:G.bg,fontFamily:G.mono,fontSize:10,fontWeight:700,padding:"8px 14px",cursor:"pointer"}}>
              SAVE
            </button>
          </div>
          <div style={{fontFamily:G.mono,fontSize:9,color:G.faint,marginTop:8}}>
            For deployed site: add VITE_FINNHUB_API_KEY to GitHub Secrets
          </div>
        </div>
      )}
    </div>
  );
}

function DisclaimerBar(){
  return <div style={{background:"#010d20",borderTop:`1px solid ${G.gold}55`,padding:"10px 24px",textAlign:"center",fontFamily:G.mono,fontSize:11,color:G.gold+"99",lineHeight:1.5}}>{DISCLAIMER}</div>;
}

function Nav({page,setPage,user,onLogout}){
  return <nav style={{background:"#020a18f0",backdropFilter:"blur(12px)",borderBottom:`1px solid ${G.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:100}}>
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("home")}>
      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${G.gold},${G.goldLight})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:G.bg}}>ET</div>
      <div>
        <div style={{fontFamily:G.serif,fontSize:13,fontWeight:700,color:G.goldLight,letterSpacing:"0.05em"}}>ELITE TRADES</div>
        <div style={{fontFamily:G.mono,fontSize:8,color:G.gold+"88",letterSpacing:"0.2em"}}>AI MARKET INTELLIGENCE</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:4}}>
      {[["HOME","home"],["ANALYZER","analyzer"]].map(([label,id])=>(
        <button key={id} onClick={()=>setPage(id)} style={{background:page===id?G.gold+"18":"transparent",border:page===id?`1px solid ${G.gold}55`:"1px solid transparent",color:page===id?G.goldLight:"#667",padding:"6px 12px",borderRadius:4,cursor:"pointer",fontFamily:G.mono,fontSize:10,letterSpacing:"0.1em"}}>
          {label}{id==="analyzer"&&!user?" 🔒":""}
        </button>
      ))}
      {user?.isAdmin&&<button onClick={()=>setPage("admin")} style={{background:page==="admin"?"#0a1a40":"transparent",border:page==="admin"?`1px solid #60a5fa55`:"1px solid transparent",color:page==="admin"?"#60a5fa":"#555",padding:"6px 12px",borderRadius:4,cursor:"pointer",fontFamily:G.mono,fontSize:10}}>⚙ ADMIN</button>}
      {user?(
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:8,paddingLeft:8,borderLeft:`1px solid ${G.border}`}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:user.isAdmin?"#0a1a40":G.gold+"22",border:`1px solid ${user.isAdmin?"#60a5fa55":G.gold+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.serif,fontSize:12,color:user.isAdmin?"#60a5fa":G.gold,fontWeight:700}}>{user.name.charAt(0).toUpperCase()}</div>
          <div style={{fontFamily:G.mono,fontSize:10,color:G.goldLight}}>{user.name}{user.isAdmin&&<div style={{fontSize:8,color:"#60a5fa"}}>ADMIN</div>}</div>
          <button onClick={onLogout} style={{background:"transparent",border:`1px solid ${G.redBorder}`,borderRadius:4,color:G.red,padding:"4px 8px",cursor:"pointer",fontFamily:G.mono,fontSize:9}}>OUT</button>
        </div>
      ):(
        <div style={{display:"flex",gap:5,marginLeft:8}}>
          <button onClick={()=>setPage("login")} style={{background:"transparent",border:`1px solid ${G.gold}44`,borderRadius:4,color:G.gold,padding:"6px 12px",cursor:"pointer",fontFamily:G.mono,fontSize:10}}>LOGIN</button>
          <button onClick={()=>setPage("signup")} style={{background:`linear-gradient(135deg,${G.gold},${G.goldLight})`,border:"none",borderRadius:4,color:G.bg,padding:"6px 12px",cursor:"pointer",fontFamily:G.mono,fontSize:10,fontWeight:700}}>SIGN UP</button>
        </div>
      )}
    </div>
  </nav>;
}

function AuthShell({title,subtitle,children}){
  return <div style={{minHeight:"85vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:G.bg}}>
    <div style={{width:"100%",maxWidth:440}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{width:48,height:48,borderRadius:"50%",margin:"0 auto 12px",background:`linear-gradient(135deg,${G.gold},${G.goldLight})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:G.bg}}>ET</div>
        <h2 style={{fontFamily:G.serif,fontSize:22,color:G.goldLight,margin:"0 0 5px"}}>{title}</h2>
        <p style={{fontFamily:G.mono,fontSize:11,color:G.muted,margin:0}}>{subtitle}</p>
      </div>
      <Card>{children}</Card>
      <div style={{textAlign:"center",marginTop:12,fontFamily:G.mono,fontSize:10,color:"#2a3a4a"}}>Educational purposes only · Not financial advice</div>
    </div>
  </div>;
}

function LoginPage({setPage,onLogin}){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const handle=async()=>{
    setErr("");setLoading(true);
    if(!email||!pass){setErr("Please fill in all fields.");setLoading(false);return;}
    const users=await getUsers(); const user=users[email.toLowerCase()];
    if(!user){setErr("No account found. Please sign up first, or use admin@elitetrades.com / EliteTrades1!");setLoading(false);return;}
    if(user.password!==btoa(pass)){setErr("Incorrect password.");setLoading(false);return;}
    const s={name:user.name,email:user.email,isAdmin:!!user.isAdmin};
    await saveSession(s);onLogin(s);setLoading(false);
  };
  return <AuthShell title="Welcome Back" subtitle="Sign in to access the Strategy Analyzer">
    <div style={{marginBottom:14}}><Label>EMAIL</Label><TextInput placeholder="trader@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
    <div style={{marginBottom:20}}><Label>PASSWORD</Label><TextInput type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
    {err&&<div style={{background:G.redDim,border:`1px solid ${G.redBorder}`,borderRadius:6,padding:"10px 14px",marginBottom:14,fontFamily:G.mono,fontSize:11,color:G.red}}>⚠ {err}</div>}
    <Btn onClick={handle} disabled={loading} variant="primary" size="lg" style={{width:"100%"}}>{loading?"SIGNING IN...":"SIGN IN →"}</Btn>
    <div style={{textAlign:"center",marginTop:16,fontFamily:G.mono,fontSize:11,color:G.muted}}>No account? <span onClick={()=>setPage("signup")} style={{color:G.gold,cursor:"pointer",textDecoration:"underline"}}>Create one</span></div>
    <div style={{marginTop:18,padding:"12px 14px",background:G.gold+"08",border:`1px solid ${G.gold}22`,borderRadius:8,textAlign:"center"}}>
      <div style={{fontFamily:G.mono,fontSize:9,color:G.gold+"88",letterSpacing:"0.15em",marginBottom:6}}>DEFAULT ADMIN CREDENTIALS</div>
      <div style={{fontFamily:G.mono,fontSize:11,color:G.muted}}>Email: <span style={{color:G.goldLight}}>admin@elitetrades.com</span></div>
      <div style={{fontFamily:G.mono,fontSize:11,color:G.muted,marginTop:3}}>Password: <span style={{color:G.goldLight}}>EliteTrades1!</span></div>
      <div style={{fontFamily:G.mono,fontSize:9,color:G.faint,marginTop:8}}>Change after first login by creating a new account</div>
    </div>
  </AuthShell>;
}

function SignupPage({setPage,onLogin}){
  const [name,setName]=useState(""); const [email,setEmail]=useState("");
  const [pass,setPass]=useState(""); const [conf,setConf]=useState("");
  const [agree,setAgree]=useState(false); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const handle=async()=>{
    setErr("");setLoading(true);
    if(!name||!email||!pass||!conf){setErr("Please fill in all fields.");setLoading(false);return;}
    if(!email.includes("@")){setErr("Enter a valid email.");setLoading(false);return;}
    if(pass.length<6){setErr("Password must be at least 6 characters.");setLoading(false);return;}
    if(pass!==conf){setErr("Passwords do not match.");setLoading(false);return;}
    if(!agree){setErr("You must agree to the disclaimer.");setLoading(false);return;}
    const users=await getUsers();
    if(users[email.toLowerCase()]){setErr("Account already exists.");setLoading(false);return;}
    const isFirst=Object.keys(users).length===0;
    users[email.toLowerCase()]={name:name.trim(),email:email.toLowerCase(),password:btoa(pass),isAdmin:isFirst,createdAt:new Date().toISOString()};
    await saveUsers(users);
    const s={name:name.trim(),email:email.toLowerCase(),isAdmin:isFirst};
    await saveSession(s);onLogin(s);setLoading(false);
  };
  return <AuthShell title="Create Your Account" subtitle={<>AI trade education access · <span style={{color:G.gold}}>First account = Admin</span></>}>
    <div style={{marginBottom:12}}><Label>FULL NAME</Label><TextInput placeholder="John Trader" value={name} onChange={e=>setName(e.target.value)}/></div>
    <div style={{marginBottom:12}}><Label>EMAIL</Label><TextInput placeholder="trader@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
    <div style={{marginBottom:12}}><Label>PASSWORD</Label><TextInput type="password" placeholder="Min. 6 characters" value={pass} onChange={e=>setPass(e.target.value)}/></div>
    <div style={{marginBottom:16}}><Label>CONFIRM PASSWORD</Label><TextInput type="password" placeholder="Re-enter password" value={conf} onChange={e=>setConf(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
    <div onClick={()=>setAgree(!agree)} style={{display:"flex",gap:10,alignItems:"flex-start",cursor:"pointer",marginBottom:18,background:agree?G.gold+"0d":"#030d1e",border:`1px solid ${agree?G.gold+"44":G.border}`,borderRadius:8,padding:"11px 13px",transition:"all 0.2s"}}>
      <div style={{minWidth:16,height:16,borderRadius:3,marginTop:1,background:agree?`linear-gradient(135deg,${G.gold},${G.goldLight})`:"transparent",border:`1px solid ${agree?G.gold:"#444"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:G.bg,fontWeight:900}}>{agree?"✓":""}</div>
      <span style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.7}}>I understand Elite Trades provides <span style={{color:G.gold}}>educational content only</span>, not financial advice.</span>
    </div>
    {err&&<div style={{background:G.redDim,border:`1px solid ${G.redBorder}`,borderRadius:6,padding:"10px 14px",marginBottom:12,fontFamily:G.mono,fontSize:11,color:G.red}}>⚠ {err}</div>}
    <Btn onClick={handle} disabled={loading} variant="primary" size="lg" style={{width:"100%"}}>{loading?"CREATING...":"CREATE ACCOUNT →"}</Btn>
    <div style={{textAlign:"center",marginTop:16,fontFamily:G.mono,fontSize:11,color:G.muted}}>Have an account? <span onClick={()=>setPage("login")} style={{color:G.gold,cursor:"pointer",textDecoration:"underline"}}>Sign in</span></div>
  </AuthShell>;
}

function AccessGate({setPage}){
  return <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",padding:32,background:G.bg}}>
    <div style={{maxWidth:440,textAlign:"center"}}>
      <div style={{width:68,height:68,borderRadius:"50%",margin:"0 auto 22px",background:G.gold+"11",border:`2px solid ${G.gold}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🔒</div>
      <h2 style={{fontFamily:G.serif,fontSize:26,color:G.goldLight,margin:"0 0 10px"}}>Members Only</h2>
      <p style={{fontFamily:G.mono,fontSize:12,color:G.muted,lineHeight:1.9,marginBottom:26}}>Create a free account to unlock the AI-powered Strategy Analyzer.</p>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <Btn onClick={()=>setPage("signup")} variant="primary" size="lg">CREATE FREE ACCOUNT</Btn>
        <Btn onClick={()=>setPage("login")} variant="outline" size="lg">SIGN IN</Btn>
      </div>
    </div>
  </div>;
}

function ChartBg(){
  const pts=Array.from({length:40},(_,i)=>({x:(i/39)*100,y:50+Math.sin(i*0.4)*18+Math.sin(i*0.9)*10}));
  const d=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.12}}>
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={G.gold} stopOpacity="0.8"/><stop offset="100%" stopColor={G.gold} stopOpacity="0"/></linearGradient></defs>
    <path d={d+" L 100 100 L 0 100 Z"} fill="url(#cg)"/>
    <path d={d} fill="none" stroke={G.gold} strokeWidth="0.6"/>
  </svg>;
}

function HomePage({setPage,user}){
  return <div style={{color:G.text}}>
    {/* Hero */}
    <section style={{minHeight:"88vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"60px 24px",position:"relative",overflow:"hidden",background:"radial-gradient(ellipse at 50% 0%, #001a3a 0%, #020a18 70%)"}}>
      <ChartBg/>
      <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:`linear-gradient(${G.gold} 1px,transparent 1px),linear-gradient(90deg,${G.gold} 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>
      <div style={{position:"relative",zIndex:1,maxWidth:780}}>
        <div style={{display:"inline-block",background:G.gold+"15",border:`1px solid ${G.gold}44`,borderRadius:100,padding:"5px 16px",marginBottom:22,fontFamily:G.mono,fontSize:10,color:G.gold,letterSpacing:"0.2em"}}>◆ AI-POWERED MARKET ANALYSIS ◆</div>
        <h1 style={{fontFamily:G.serif,fontSize:"clamp(34px,7vw,72px)",fontWeight:700,lineHeight:1.1,margin:"0 0 8px",color:"#fff"}}>
          ELITE<span style={{background:`linear-gradient(135deg,${G.gold},${G.goldLight})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}> TRADES</span>
        </h1>
        <h2 style={{fontFamily:G.serif,fontSize:"clamp(13px,2.5vw,22px)",color:"#4a6a8a",fontWeight:400,margin:"0 0 22px"}}>Intelligence-Driven Market Strategy</h2>
        <p style={{fontFamily:G.mono,fontSize:12,color:"#4a6a8a",maxWidth:500,margin:"0 auto 36px",lineHeight:1.9}}>Harness AI to decode market patterns, identify trade setups, and develop data-informed strategies across all asset classes.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>user?setPage("analyzer"):setPage("signup")} variant="primary" size="lg">{user?"OPEN ANALYZER →":"GET FREE ACCESS →"}</Btn>
          {!user&&<Btn onClick={()=>setPage("login")} variant="outline" size="lg">SIGN IN</Btn>}
        </div>
        {!user&&<p style={{fontFamily:G.mono,fontSize:10,color:"#2a4a6a",marginTop:12}}>Free account required · No credit card needed</p>}
      </div>
    </section>

    {/* Stats */}
    <section style={{background:G.bg2,borderTop:`1px solid ${G.border}`,borderBottom:`1px solid ${G.border}`,padding:"28px 24px"}}>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",maxWidth:820,margin:"0 auto"}}>
        {[["50+","ASSET CLASSES"],["AI","POWERED"],["24/7","AVAILABLE"],["100%","EDUCATIONAL"]].map(([v,l])=>(
          <div key={l} style={{background:G.bg3,border:`1px solid ${G.border}`,borderRadius:8,padding:"18px 24px",textAlign:"center",flex:1,minWidth:120}}>
            <div style={{fontFamily:G.serif,fontSize:26,color:G.goldLight,fontWeight:700}}>{v}</div>
            <div style={{fontFamily:G.mono,fontSize:9,color:G.muted,marginTop:4,letterSpacing:"0.1em"}}>{l}</div>
          </div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section style={{padding:"56px 24px",background:G.bg}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontFamily:G.mono,fontSize:9,color:G.gold,letterSpacing:"0.2em",marginBottom:8}}>CAPABILITIES</div>
          <h2 style={{fontFamily:G.serif,fontSize:"clamp(20px,4vw,34px)",color:G.goldLight,margin:0}}>What Elite Trades Offers</h2>
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[
            ["🤖","AI Strategy Engine","Enter any asset and receive a structured educational trade strategy built on proven technical frameworks."],
            ["📊","Multi-Asset Coverage","Stocks, ETFs, crypto, forex, and commodities — all asset classes covered in every analysis."],
            ["🛡️","Risk-First Approach","Every strategy includes stop-loss logic, position sizing concepts, and risk/reward framing."],
            ["📚","Education-Centric","Understand the 'why' behind every setup — not just a signal, but a full learning opportunity."],
          ].map(([icon,title,desc])=>(
            <div key={title} style={{background:G.bg3,border:`1px solid ${G.border}`,borderRadius:10,padding:"24px 20px",flex:1,minWidth:200,transition:"border-color 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=G.gold+"55"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
              <div style={{fontSize:26,marginBottom:12}}>{icon}</div>
              <div style={{fontFamily:G.serif,fontSize:16,color:G.goldLight,marginBottom:8}}>{title}</div>
              <div style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.8}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    {!user&&<section style={{padding:"56px 24px",background:G.bg2,borderTop:`1px solid ${G.border}`,textAlign:"center"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{fontFamily:G.mono,fontSize:9,color:G.gold,letterSpacing:"0.2em",marginBottom:10}}>GET STARTED</div>
        <h2 style={{fontFamily:G.serif,fontSize:"clamp(18px,3.5vw,30px)",color:G.goldLight,margin:"0 0 12px"}}>Join Elite Trades Today</h2>
        <p style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.9,marginBottom:24}}>Free account. Instant access to the AI Strategy Analyzer.</p>
        <Btn onClick={()=>setPage("signup")} variant="primary" size="lg">CREATE FREE ACCOUNT →</Btn>
      </div>
    </section>}
  </div>;
}

function AnalyzerPage({user}){
  const [asset,setAsset]=useState(""); const [tf,setTf]=useState("swing");
  const [risk,setRisk]=useState("moderate"); const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null);
  const resultRef=useRef(null);

  const analyze=async()=>{
    if(!asset.trim())return;
    setLoading(true);setErr(null);setResult(null);
    const prompt=`You are an expert trading educator at Elite Trades LLC. A student wants to learn about ${asset.trim().toUpperCase()}.
Trading Style: ${tf==="scalp"?"Scalping":tf==="swing"?"Swing Trading":"Position/Long-term"}
Risk: ${risk}
Return ONLY valid JSON (no markdown):
{"asset":"NAME","assetType":"Type","overallBias":"Bullish/Bearish/Neutral","biasStrength":"Strong/Moderate/Weak","summary":"2-3 sentences","technicalAnalysis":{"trend":"desc","keyLevels":["l1","l2","l3"],"indicators":["i1","i2","i3"]},"strategySetup":{"setupType":"name","entryZoneConcept":"desc","stopLossConcept":"desc","takeProfitConcept":"desc","rrRatioConcept":"1:2"},"riskManagement":["r1","r2","r3"],"catalysts":["bull","bear","macro"],"educationalNote":"lesson"}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-5-20251001",
          max_tokens:1024,
          messages:[{role:"user",content:prompt}]
        })
      });
      const data=await res.json();
      if(data.error){throw new Error(data.error.message);}
      const text=(data.content||[]).map(function(b){return b.text||"";}).join("");
      const cleaned=text.replace(/```json/g,"").replace(/```/g,"").trim();
      setResult(JSON.parse(cleaned));
      setTimeout(function(){if(resultRef.current)resultRef.current.scrollIntoView({behavior:"smooth"});},100);
    }catch(e){setErr("Analysis failed: "+(e.message||"Unknown error"));}
    setLoading(false);
  };

  const bc=b=>!b?"#888":b.toLowerCase().includes("bull")?G.green:b.toLowerCase().includes("bear")?G.red:G.gold;

  return <div style={{color:G.text,minHeight:"90vh",background:G.bg}}>
    <div style={{background:`linear-gradient(180deg,#030d22,${G.bg})`,borderBottom:`1px solid ${G.border}`,padding:"36px 24px 28px",textAlign:"center"}}>
      <div style={{fontFamily:G.mono,fontSize:9,color:G.gold,letterSpacing:"0.2em",marginBottom:8}}>AI STRATEGY ENGINE</div>
      <h1 style={{fontFamily:G.serif,fontSize:"clamp(18px,4vw,36px)",color:G.goldLight,margin:"0 0 7px"}}>Asset Strategy Analyzer</h1>
      <p style={{fontFamily:G.mono,fontSize:11,color:G.muted,maxWidth:400,margin:"0 auto"}}>Enter any asset for an AI-generated educational trade strategy</p>
      {user&&<div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,background:G.gold+"0d",border:`1px solid ${G.gold}33`,borderRadius:100,padding:"3px 10px",fontFamily:G.mono,fontSize:9,color:G.gold+"bb"}}><span style={{color:G.gold}}>◆</span>Logged in as {user.name}</div>}
    </div>
    <div style={{maxWidth:660,margin:"28px auto",padding:"0 16px"}}>
      <Card>
        <div style={{marginBottom:14}}><Label>ASSET / TICKER</Label><TextInput placeholder="e.g. AAPL, BTC, EUR/USD, GOLD, SPY..." value={asset} onChange={e=>setAsset(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}/></div>
        <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:150}}><Label>TRADING STYLE</Label>
            <select value={tf} onChange={e=>setTf(e.target.value)} style={{width:"100%",background:"#030d1e",border:`1px solid ${G.borderMid}`,borderRadius:6,padding:"10px 12px",color:G.text,fontFamily:G.mono,fontSize:12,outline:"none"}}>
              <option value="scalp">Scalping</option><option value="swing">Swing Trading</option><option value="position">Position/Long-Term</option>
            </select></div>
          <div style={{flex:1,minWidth:150}}><Label>RISK APPETITE</Label>
            <select value={risk} onChange={e=>setRisk(e.target.value)} style={{width:"100%",background:"#030d1e",border:`1px solid ${G.borderMid}`,borderRadius:6,padding:"10px 12px",color:G.text,fontFamily:G.mono,fontSize:12,outline:"none"}}>
              <option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="aggressive">Aggressive</option>
            </select></div>
        </div>
        <Btn onClick={analyze} disabled={loading||!asset.trim()} variant="primary" style={{width:"100%",padding:"13px"}}>{loading?"◆ ANALYZING...":"◆ GENERATE STRATEGY"}</Btn>
      </Card>
      {err&&<div style={{marginTop:12,background:G.redDim,border:`1px solid ${G.redBorder}`,borderRadius:8,padding:"11px 14px",fontFamily:G.mono,fontSize:12,color:G.red}}>{err}</div>}
      {loading&&<div style={{textAlign:"center",padding:"40px 0"}}>
        <div style={{display:"inline-block",width:38,height:38,borderRadius:"50%",border:`2px solid ${G.gold}22`,borderTop:`2px solid ${G.gold}`,animation:"spin 1s linear infinite"}}/>
        <div style={{fontFamily:G.mono,fontSize:11,color:G.muted,marginTop:12}}>Analyzing markets...</div>
      </div>}
      {result&&<div ref={resultRef} style={{marginTop:22}}>
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div><div style={{fontFamily:G.mono,fontSize:9,color:G.muted,marginBottom:3}}>{result.assetType}</div><div style={{fontFamily:G.serif,fontSize:30,color:G.goldLight,fontWeight:700}}>{result.asset}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontFamily:G.mono,fontSize:9,color:G.muted,marginBottom:2}}>OVERALL BIAS</div><div style={{fontFamily:G.serif,fontSize:18,fontWeight:700,color:bc(result.overallBias)}}>{result.overallBias}</div><div style={{fontFamily:G.mono,fontSize:9,color:G.muted}}>{result.biasStrength}</div></div>
          </div>
          <p style={{fontFamily:G.mono,fontSize:12,color:G.muted,lineHeight:1.9,marginTop:14,marginBottom:0}}>{result.summary}</p>
        </Card>
        {[
          {title:"📈 Technical Analysis",body:<>
            <div style={{fontFamily:G.mono,fontSize:9,color:G.gold+"88",letterSpacing:"0.1em",marginBottom:3}}>TREND</div>
            <div style={{fontFamily:G.mono,fontSize:12,color:"#8ab",marginBottom:12,lineHeight:1.7}}>{result.technicalAnalysis?.trend}</div>
            <div style={{fontFamily:G.mono,fontSize:9,color:G.gold+"88",letterSpacing:"0.1em",marginBottom:7}}>KEY LEVELS</div>
            {result.technicalAnalysis?.keyLevels?.map((l,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:6}}><span style={{color:G.gold,fontSize:9}}>◆</span><span style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.7}}>{l}</span></div>)}
            <div style={{fontFamily:G.mono,fontSize:9,color:G.gold+"88",letterSpacing:"0.1em",margin:"10px 0 7px"}}>INDICATORS</div>
            {result.technicalAnalysis?.indicators?.map((l,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:6}}><span style={{color:G.gold,fontSize:9}}>◆</span><span style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.7}}>{l}</span></div>)}
          </>},
          {title:"⚙️ Strategy Setup",body:<>
            {[["SETUP TYPE",result.strategySetup?.setupType,true],["ENTRY ZONE",result.strategySetup?.entryZoneConcept],["STOP-LOSS",result.strategySetup?.stopLossConcept],["TAKE-PROFIT",result.strategySetup?.takeProfitConcept],["R/R RATIO",result.strategySetup?.rrRatioConcept]].map(([l,v,hl])=>(
              <div key={l} style={{marginBottom:10}}><div style={{fontFamily:G.mono,fontSize:9,color:G.gold+"88",letterSpacing:"0.1em",marginBottom:2}}>{l}</div><div style={{fontFamily:G.mono,fontSize:12,color:hl?G.goldLight:G.muted,lineHeight:1.7}}>{v}</div></div>
            ))}
          </>},
          {title:"🛡️ Risk Management",body:result.riskManagement?.map((r,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:7}}><span style={{color:G.red,fontSize:9}}>◆</span><span style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.7}}>{r}</span></div>)},
          {title:"🔍 Catalysts & Risks",body:result.catalysts?.map((c,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:7}}><span style={{color:G.gold,fontSize:9}}>◆</span><span style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.7}}>{c}</span></div>)},
        ].map(({title,body})=>(
          <Card key={title} style={{marginBottom:12}}>
            <div style={{fontFamily:G.serif,fontSize:14,color:G.goldLight,marginBottom:12}}>{title}</div>{body}
          </Card>
        ))}
        <div style={{background:"#020d20",border:`1px solid ${G.greenBorder}`,borderRadius:10,padding:"18px 22px",marginBottom:12}}>
          <div style={{fontFamily:G.mono,fontSize:9,color:G.green,letterSpacing:"0.15em",marginBottom:6}}>📚 EDUCATIONAL INSIGHT</div>
          <p style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.9,margin:0}}>{result.educationalNote}</p>
        </div>
        <div style={{background:"#010d20",border:`1px solid ${G.gold}44`,borderRadius:10,padding:"16px 20px"}}>
          <div style={{fontFamily:G.mono,fontSize:9,color:G.gold,letterSpacing:"0.15em",marginBottom:5}}>⚠️ DISCLAIMER</div>
          <p style={{fontFamily:G.mono,fontSize:11,color:G.gold+"88",lineHeight:1.9,margin:0}}>For <strong>educational purposes only</strong>. Not financial advice. Always consult a licensed advisor before making investment decisions.</p>
        </div>
      </div>}
    </div>
    <div style={{height:40}}/>
  </div>;
}

function AssetRow({asset,index,onToggle,onRemove,saving}){
  const [hover,setHover]=useState(false);
  return <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
    style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:hover?G.bg4:G.bg3,border:`1px solid ${hover?G.borderHi:G.border}`,borderRadius:8,marginBottom:7,transition:"all 0.15s",flexWrap:"wrap"}}>
    <div style={{fontFamily:G.mono,fontSize:10,color:G.faint,minWidth:18,textAlign:"center"}}>{(index+1).toString().padStart(2,"0")}</div>
    <div onClick={!saving?onToggle:undefined} style={{width:34,height:18,borderRadius:9,background:asset.active?G.green:"#2a3a4a",position:"relative",transition:"background 0.2s",cursor:saving?"not-allowed":"pointer",flexShrink:0}}>
      <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:asset.active?18:2,transition:"left 0.2s"}}/>
    </div>
    <div style={{fontFamily:G.mono,fontSize:12,color:asset.active?G.goldLight:"#3a5a7a",fontWeight:700,minWidth:80}}>{asset.symbol}</div>
    <div style={{fontFamily:G.mono,fontSize:11,color:asset.active?G.muted:"#2a4a6a",flex:1,minWidth:100}}>{asset.name}</div>
    <div style={{opacity:asset.active?1:0.4}}><TypeBadge type={asset.type}/></div>
    <div style={{fontFamily:G.mono,fontSize:9,color:asset.active?G.green:G.faint,minWidth:46,textAlign:"right"}}>{asset.active?"ACTIVE":"PAUSED"}</div>
    <button onClick={!saving?onRemove:undefined} style={{background:"transparent",border:"1px solid transparent",borderRadius:4,color:"#2a4a6a",padding:"3px 7px",cursor:saving?"not-allowed":"pointer",fontFamily:G.mono,fontSize:11,transition:"all 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.color=G.red;e.currentTarget.style.borderColor=G.redBorder;}}
      onMouseLeave={e=>{e.currentTarget.style.color="#2a4a6a";e.currentTarget.style.borderColor="transparent";}}>✕</button>
  </div>;
}

function AdminPage({user}){
  const [config,setConfig]=useState(null); const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false); const [toast,setToast]=useState(null);
  const [activeTab,setActiveTab]=useState("daily"); const [showAdd,setShowAdd]=useState(false);
  const [newAsset,setNewAsset]=useState({symbol:"",name:"",type:"Crypto",active:true}); const [addErr,setAddErr]=useState("");

  useEffect(()=>{getAssetConfig().then(cfg=>{setConfig(cfg);setLoading(false);});},[]);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};
  const save=async(cfg)=>{
    setSaving(true);
    const updated={...cfg,lastUpdated:new Date().toISOString(),updatedBy:user.email};
    const ok=await saveAssetConfig(updated);setConfig(updated);setSaving(false);
    ok?showToast("Saved & synced ✓"):showToast("Save failed","error");
  };
  const toggleActive=(list,id)=>save({...config,[list]:config[list].map(a=>a.id===id?{...a,active:!a.active}:a)});
  const removeAsset=(list,id)=>save({...config,[list]:config[list].filter(a=>a.id!==id)});
  const addAsset=()=>{
    setAddErr("");
    if(!newAsset.symbol.trim()){setAddErr("Symbol required.");return;}
    if(!newAsset.name.trim()){setAddErr("Name required.");return;}
    if(config[activeTab].some(a=>a.symbol.toLowerCase()===newAsset.symbol.trim().toLowerCase())){setAddErr("Symbol already exists.");return;}
    const entry={id:`${activeTab[0]}${Date.now()}`,symbol:newAsset.symbol.trim().toUpperCase(),name:newAsset.name.trim(),type:newAsset.type,active:newAsset.active};
    save({...config,[activeTab]:[...config[activeTab],entry]});
    setNewAsset({symbol:"",name:"",type:"Crypto",active:true});setShowAdd(false);
  };
  const exportConfig=()=>{
    const data={_note:"Commit as config/assets.json",lastUpdated:config.lastUpdated,updatedBy:config.updatedBy,
      daily:config.daily.filter(a=>a.active).map(({symbol,name,type})=>({symbol,name,type})),
      weekly:config.weekly.filter(a=>a.active).map(({symbol,name,type})=>({symbol,name,type}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="assets.json";a.click();URL.revokeObjectURL(url);
    showToast("Exported! Commit assets.json to your repo.");
  };

  if(!user?.isAdmin)return <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg}}><div style={{textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>🚫</div><h2 style={{fontFamily:G.serif,color:G.red}}>Access Denied</h2></div></div>;
  if(loading)return <div style={{minHeight:"80vh",display:"flex",alignItems:"center",justifyContent:"center",background:G.bg}}><div style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${G.gold}22`,borderTop:`2px solid ${G.gold}`,animation:"spin 1s linear infinite"}}/></div>;

  const list=config[activeTab];
  const activeCount=list.filter(a=>a.active).length;

  return <div style={{color:G.text,minHeight:"90vh",background:G.bg}}>
    {toast&&<div style={{position:"fixed",top:72,right:20,zIndex:999,background:toast.type==="error"?G.redDim:G.greenDim,border:`1px solid ${toast.type==="error"?G.redBorder:G.greenBorder}`,borderRadius:8,padding:"10px 18px",fontFamily:G.mono,fontSize:12,color:toast.type==="error"?G.red:G.green,animation:"fadeIn 0.3s ease"}}>{toast.msg}</div>}

    <div style={{background:`linear-gradient(180deg,#030d22,${G.bg})`,borderBottom:`1px solid #60a5fa22`,padding:"36px 24px 28px"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{fontFamily:G.mono,fontSize:9,color:"#60a5fa",letterSpacing:"0.2em"}}>⚙ ADMIN DASHBOARD</div>
              <Badge label="RESTRICTED" color="#60a5fa"/>
            </div>
            <h1 style={{fontFamily:G.serif,fontSize:"clamp(18px,3.5vw,30px)",color:G.goldLight,margin:"0 0 5px"}}>Asset List Manager</h1>
            <p style={{fontFamily:G.mono,fontSize:11,color:G.muted,margin:0}}>Manage assets for the automated X post scheduler</p>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn onClick={exportConfig} variant="outline" size="sm">⬇ EXPORT JSON</Btn>
            <Btn onClick={async()=>{if(!window.confirm("Reset to defaults?"))return;await save({daily:DEFAULT_DAILY,weekly:DEFAULT_WEEKLY});showToast("Reset ✓");}} variant="ghost" size="sm">↺ RESET</Btn>
          </div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:20,flexWrap:"wrap"}}>
          {[["Daily Active",config.daily.filter(a=>a.active).length+" / "+config.daily.length,G.green],["Weekly Active",config.weekly.filter(a=>a.active).length+" / "+config.weekly.length,G.blue],["Last Saved",config.lastUpdated?new Date(config.lastUpdated).toLocaleTimeString():"Never",G.gold],["By",config.updatedBy||"—",G.gold]].map(([l,v,c])=>(
            <div key={l} style={{background:G.bg3,border:`1px solid ${G.border}`,borderRadius:7,padding:"12px 18px",flex:1,minWidth:120}}>
              <div style={{fontFamily:G.mono,fontSize:9,color:G.muted,letterSpacing:"0.1em",marginBottom:4}}>{l}</div>
              <div style={{fontFamily:G.mono,fontSize:12,color:c,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{maxWidth:900,margin:"24px auto",padding:"0 20px"}}>
      <div style={{background:"#030d22",border:`1px solid #60a5fa33`,borderRadius:10,padding:"14px 18px",marginBottom:20}}>
        <div style={{fontFamily:G.mono,fontSize:9,color:"#60a5fa",letterSpacing:"0.15em",marginBottom:6}}>ℹ BOT SYNC</div>
        <p style={{fontFamily:G.mono,fontSize:11,color:G.muted,lineHeight:1.8,margin:0}}>Edit below → click <span style={{color:G.gold}}>EXPORT JSON</span> → commit <code style={{color:G.green}}>config/assets.json</code> to your repo → bot reads it automatically.</p>
      </div>

      <div style={{display:"flex",marginBottom:20,background:G.bg3,border:`1px solid ${G.borderMid}`,borderRadius:10,padding:3}}>
        {[["daily","📅 Daily Rotation"],["weekly","🧵 Weekly Thread"]].map(([tab,label])=>(
          <button key={tab} onClick={()=>{setActiveTab(tab);setShowAdd(false);setAddErr("");}} style={{flex:1,padding:"10px 14px",borderRadius:8,border:"none",cursor:"pointer",transition:"all 0.2s",background:activeTab===tab?`linear-gradient(135deg,${G.gold}22,${G.gold}11)`:"transparent",color:activeTab===tab?G.goldLight:G.muted,fontFamily:G.mono,fontSize:10,fontWeight:700,letterSpacing:"0.08em",boxShadow:activeTab===tab?`0 0 0 1px ${G.gold}44`:"none"}}>
            {label} <span style={{color:activeTab===tab?G.green:G.faint,fontSize:9}}>({config[tab].filter(a=>a.active).length} active)</span>
          </button>
        ))}
      </div>

      <div style={{fontFamily:G.mono,fontSize:11,color:G.muted,marginBottom:16,padding:"10px 14px",background:G.bg3,borderRadius:7,border:`1px solid ${G.border}`}}>
        {activeTab==="daily"?`📅 Daily posts Mon–Fri 9AM EST. One asset per day, cycling through ${activeCount} active asset${activeCount!==1?"s":""}.`:`🧵 Weekly thread every Monday 8AM EST covering all ${activeCount} active asset${activeCount!==1?"s":""}.`}
      </div>

      <div style={{marginBottom:16}}>
        {list.length===0
          ?<div style={{textAlign:"center",padding:"36px",fontFamily:G.mono,fontSize:12,color:G.muted,border:`1px dashed ${G.border}`,borderRadius:10}}>No assets yet. Add one below.</div>
          :list.map((a,i)=><AssetRow key={a.id} asset={a} index={i} onToggle={()=>toggleActive(activeTab,a.id)} onRemove={()=>removeAsset(activeTab,a.id)} saving={saving}/>)
        }
      </div>

      {!showAdd
        ?<Btn onClick={()=>setShowAdd(true)} variant="outline" size="sm">+ ADD ASSET</Btn>
        :<Card style={{border:`1px solid ${G.gold}44`}}>
          <div style={{fontFamily:G.serif,fontSize:14,color:G.goldLight,marginBottom:16}}>+ Add to {activeTab==="daily"?"Daily":"Weekly"} List</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
            <div style={{flex:1,minWidth:130}}><Label>SYMBOL *</Label><TextInput placeholder="AAPL" value={newAsset.symbol} onChange={e=>setNewAsset({...newAsset,symbol:e.target.value.toUpperCase()})}/></div>
            <div style={{flex:2,minWidth:180}}><Label>FULL NAME *</Label><TextInput placeholder="Apple Inc." value={newAsset.name} onChange={e=>setNewAsset({...newAsset,name:e.target.value})}/></div>
            <div style={{flex:1,minWidth:120}}><Label>TYPE</Label>
              <select value={newAsset.type} onChange={e=>setNewAsset({...newAsset,type:e.target.value})} style={{width:"100%",background:"#030d1e",border:`1px solid ${G.borderMid}`,borderRadius:6,padding:"10px 12px",color:G.text,fontFamily:G.mono,fontSize:12,outline:"none"}}>
                {ASSET_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select></div>
          </div>
          <div onClick={()=>setNewAsset({...newAsset,active:!newAsset.active})} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:14,width:"fit-content"}}>
            <div style={{width:32,height:18,borderRadius:9,background:newAsset.active?G.green:"#2a3a4a",position:"relative",transition:"background 0.2s"}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:newAsset.active?16:2,transition:"left 0.2s"}}/>
            </div>
            <span style={{fontFamily:G.mono,fontSize:11,color:G.muted}}>Active on creation</span>
          </div>
          {addErr&&<div style={{background:G.redDim,border:`1px solid ${G.redBorder}`,borderRadius:6,padding:"9px 12px",marginBottom:12,fontFamily:G.mono,fontSize:11,color:G.red}}>⚠ {addErr}</div>}
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={addAsset} variant="primary" disabled={saving}>ADD TO LIST</Btn>
            <Btn onClick={()=>{setShowAdd(false);setAddErr("");setNewAsset({symbol:"",name:"",type:"Crypto",active:true});}} variant="ghost">CANCEL</Btn>
          </div>
        </Card>
      }

      <div style={{marginTop:24,padding:"14px 18px",background:"#010d20",border:`1px solid ${G.gold}33`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontFamily:G.mono,fontSize:11,color:G.gold+"aa"}}>💾 Changes saved. Export & commit <code style={{color:G.goldLight}}>assets.json</code> to sync the bot.</div>
        <Btn onClick={exportConfig} variant="primary" size="sm">⬇ EXPORT JSON</Btn>
      </div>
    </div>
    <div style={{height:40}}/>
  </div>;
}

function Footer({setPage}){
  return <footer style={{background:"#010810",borderTop:`1px solid ${G.border}`,padding:"28px",textAlign:"center"}}>
    <div style={{fontFamily:G.serif,fontSize:15,color:G.goldLight,marginBottom:3}}>ELITE TRADES LLC</div>
    <div style={{fontFamily:G.mono,fontSize:8,color:"#1a2e48",letterSpacing:"0.2em",marginBottom:16}}>AI MARKET INTELLIGENCE</div>
    <div style={{display:"flex",gap:18,justifyContent:"center",marginBottom:14,flexWrap:"wrap"}}>
      {[["HOME","home"],["ANALYZER","analyzer"]].map(([l,id])=>(
        <button key={id} onClick={()=>setPage(id)} style={{background:"none",border:"none",color:"#2a4a6a",fontFamily:G.mono,fontSize:9,letterSpacing:"0.1em",cursor:"pointer"}}>{l}</button>
      ))}
    </div>
    <div style={{fontFamily:G.mono,fontSize:9,color:"#1a2e48"}}>© {new Date().getFullYear()} Elite Trades LLC · Educational only · Not financial advice</div>
  </footer>;
}

export default function App(){
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [booting,setBooting]=useState(true);

  useEffect(()=>{getSession().then(s=>{if(s)setUser(s);setBooting(false);});},[]);
  useEffect(()=>{window.scrollTo(0,0);},[page]);

  const handleLogin=(u)=>{setUser(u);setPage(u.isAdmin?"admin":"analyzer");};
  const handleLogout=async()=>{await saveSession(null);setUser(null);setPage("home");};

  if(booting)return <div style={{background:G.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{textAlign:"center"}}>
      <div style={{width:40,height:40,borderRadius:"50%",border:`2px solid ${G.gold}22`,borderTop:`2px solid ${G.gold}`,animation:"spin 1s linear infinite",margin:"0 auto 12px"}}/>
      <div style={{fontFamily:G.mono,fontSize:10,color:G.muted}}>Loading Elite Trades...</div>
    </div>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>;

  return <div style={{background:G.bg,minHeight:"100vh"}}>
    <style>{`
      @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      *{box-sizing:border-box} select option{background:#071630;color:#e0eeff} input::placeholder{color:#1a3a5a}
    `}</style>
    <TickerTape/>
    <Nav page={page} setPage={setPage} user={user} onLogout={handleLogout}/>
    {page==="login"&&<LoginPage setPage={setPage} onLogin={handleLogin}/>}
    {page==="signup"&&<SignupPage setPage={setPage} onLogin={handleLogin}/>}
    {page==="analyzer"&&(user?<AnalyzerPage user={user}/>:<AccessGate setPage={setPage}/>)}
    {page==="admin"&&<AdminPage user={user}/>}
    {page==="home"&&<HomePage setPage={setPage} user={user}/>}
    <DisclaimerBar/>
    <Footer setPage={setPage}/>
  </div>;
}

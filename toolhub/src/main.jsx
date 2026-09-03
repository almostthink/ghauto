import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight, BarChart3, Check, ChevronDown, CircleHelp, Download, Edit3, Eye,
  Gamepad2, Grid2X2, LayoutDashboard, Menu, Package, Plus, Search, Settings,
  ShieldCheck, Sparkles, Star, TrendingUp, Users, Wallet, X, Zap
} from "lucide-react";
import "./styles.css";

const API = "/api";

const fallbackProducts = [
  {id:"winoptimizer",name:"WinOptimizer 26",slug:"winoptimizer-26",category:"Windows",tag:"Optimization",description:"All-in-one Windows optimization and cleanup utility.",rating:4.8,reviews:4200,downloads:128540,version:"26.1.4",size:"38 MB",updated:"2 days ago",price:"Free",image:"https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=900&q=80",featured:true},
  {id:"synapse-x",name:"Synapse X",slug:"synapse-x",category:"Roblox",tag:"Executor",description:"Roblox scripting utility showcase entry.",rating:4.6,reviews:2100,downloads:88420,version:"3.4.2",size:"18 MB",updated:"5 days ago",price:"Premium",image:"https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=80",featured:true},
  {id:"elden-ring-trainer",name:"Elden Ring Trainer",slug:"elden-ring-trainer",category:"Game",tag:"Trainer",description:"Game utility catalog entry with rich product metadata.",rating:4.9,reviews:870,downloads:67320,version:"1.8.0",size:"12 MB",updated:"1 week ago",price:"Free",image:"https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",featured:true},
  {id:"exodus",name:"Exodus",slug:"exodus",category:"Crypto",tag:"Wallet",description:"Crypto wallet showcase entry.",rating:4.7,reviews:3100,downloads:73450,version:"25.6",size:"96 MB",updated:"3 days ago",price:"Free",image:"https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80",featured:true},
  {id:"malwarebytes",name:"Malwarebytes",slug:"malwarebytes",category:"Windows",tag:"Security",description:"Security software catalog example.",rating:4.6,reviews:2900,downloads:52110,version:"5.2",size:"86 MB",updated:"4 days ago",price:"Free",image:"https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",featured:false},
  {id:"binance",name:"Binance",slug:"binance",category:"Crypto",tag:"Trading",description:"Crypto exchange showcase entry.",rating:4.5,reviews:1900,downloads:61200,version:"4.8",size:"112 MB",updated:"1 day ago",price:"Free",image:"https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=900&q=80",featured:false}
];

async function getJSON(url, options) {
  try {
    const r = await fetch(url, options);
    if (!r.ok) throw new Error("API");
    return r.json();
  } catch { return null; }
}

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  useEffect(() => { getJSON(`${API}/products`).then(x => x && setProducts(x)); }, []);
  return <Routes>
    <Route path="/" element={<SitePage products={products}><Home products={products}/></SitePage>} />
    <Route path="/windows" element={<SitePage products={products}><Catalog title="Windows Tools" subtitle="Essential utilities and productivity tools for Windows" category="Windows" products={products}/></SitePage>} />
    <Route path="/game" element={<SitePage products={products}><Catalog title="Game Tools" subtitle="Discover utilities and tools for your favorite games" category="Game" products={products}/></SitePage>} />
    <Route path="/roblox" element={<SitePage products={products}><Catalog title="Roblox Tools" subtitle="A polished catalog layout for Roblox utilities" category="Roblox" products={products}/></SitePage>} />
    <Route path="/crypto" element={<SitePage products={products}><Catalog title="Crypto Tools" subtitle="Wallets, analytics and trading utilities" category="Crypto" products={products}/></SitePage>} />
    <Route path="/faq" element={<SitePage products={products}><FAQ/></SitePage>} />
    <Route path="/about" element={<SitePage products={products}><About/></SitePage>} />
    <Route path="/product/:id" element={<SitePage products={products}><ProductPage products={products}/></SitePage>} />
    <Route path="/admin/*" element={<Admin products={products} setProducts={setProducts}/>} />
  </Routes>;
}

function SitePage({children}) {
  return <div className="app-shell">
    <Header/>
    <main>{children}</main>
    <Footer/>
  </div>
}

function Header() {
  const [open,setOpen]=useState(false);
  return <header className="topbar">
    <div className="container nav">
      <Link className="brand" to="/"><span className="brand-mark">◆</span><span>Tool<span>Hub</span></span></Link>
      <button className="mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      <nav className={open?"nav-links open":"nav-links"}>
        {["Windows","Game","Crypto","FAQ","About"].map(x=><NavLink key={x} onClick={()=>setOpen(false)} to={"/"+x.toLowerCase()}>{x}</NavLink>)}
        <Link className="nav-admin" to="/admin"><LayoutDashboard size={15}/> Admin</Link>
      </nav>
      <div className="search-mini"><Search size={15}/><span>Search tools...</span><kbd>⌘ K</kbd></div>
    </div>
  </header>
}

function Footer() {
  return <footer><div className="container footer-grid">
    <div><div className="brand"><span className="brand-mark">◆</span><span>Tool<span>Hub</span></span></div><p>Your curated directory for useful software, utilities and tools.</p></div>
    <div><b>Categories</b><Link to="/windows">Windows Tools</Link><Link to="/game">Game Tools</Link><Link to="/roblox">Roblox</Link><Link to="/crypto">Crypto</Link></div>
    <div><b>Company</b><Link to="/about">About</Link><Link to="/faq">FAQ</Link><span>Contact</span><span>Privacy</span></div>
    <div><b>Newsletter</b><p>Get useful updates in your inbox.</p><div className="newsletter"><input placeholder="Your email"/><button><ArrowRight size={16}/></button></div></div>
  </div><div className="container copyright">© 2026 ToolHub. Demo template.</div></footer>
}

function Home({products}) {
  return <div>
    <section className="hero"><div className="container hero-inner">
      <div className="hero-copy"><span className="eyebrow"><Sparkles size={14}/> ALL-IN-ONE SOLUTION</span>
        <h1>Ultimate Tools<br/><em>Collection</em></h1>
        <p>The biggest selection of premium tools for Windows, Games, Roblox and Crypto. Verified, safe and regularly updated.</p>
        <div className="hero-actions"><Link className="btn primary" to="/windows">Browse Tools <ArrowRight size={17}/></Link><Link className="btn ghost" to="/about">Explore Categories</Link></div>
      </div>
      <div className="hero-art"><div className="orb o1"></div><div className="orb o2"></div><div className="cube"><div>▣</div><div>◈</div><div>⬢</div><div>Ξ</div></div></div>
    </div></section>
    <section className="section"><div className="container"><SectionHead title="Browse by Categories" text="Explore our wide range of tools across different categories"/>
      <div className="category-grid">{[
        ["Windows Tools","System utilities and productivity","/windows",<ShieldCheck/>,"120+"],
        ["Game Tools","Boost your gaming experience","/game",<Gamepad2/>,"320+"],
        ["Roblox Tools","Powerful tools for Roblox","/roblox",<Grid2X2/>,"80+"],
        ["Crypto Tools","Wallets, trading and analytics","/crypto",<Wallet/>,"60+"]
      ].map(([t,d,l,i,n])=><Link className="category-card" to={l} key={t}><div className="cat-icon">{i}</div><h3>{t}</h3><p>{d}</p><b>{n} Tools <ArrowRight size={14}/></b></Link>)}</div>
    </div></section>
    <section className="section alt"><div className="container"><SectionHead title="Featured Tools" text="Handpicked tools you might need" action="View All" href="/windows"/>
      <div className="product-grid">{products.filter(p=>p.featured).slice(0,4).map(p=><ProductCard p={p} key={p.id}/>)}</div></div></section>
    <StatsStrip products={products}/>
  </div>
}

function StatsStrip({products}) {
  const downloads=products.reduce((a,p)=>a+p.downloads,0);
  return <section className="stats"><div className="container stats-grid"><div><b>{products.length*80}+</b><span>Total Tools</span></div><div><b>50K+</b><span>Happy Users</span></div><div><b>{Math.round(downloads/1000)}K+</b><span>Total Downloads</span></div><div><b>4.8</b><span>Average Rating</span></div></div></section>
}

function SectionHead({title,text,action,href}) {
  return <div className="section-head"><div><h2>{title}</h2><p>{text}</p></div>{action&&<Link to={href}>{action} <ArrowRight size={15}/></Link>}</div>
}

function ProductCard({p}) {
  return <Link className="product-card" to={`/product/${p.id}`}>
    <div className="product-image"><img src={p.image}/><span className="pill">{p.tag}</span></div>
    <div className="product-body"><div className="product-title"><h3>{p.name}</h3><span>{p.price}</span></div><p>{p.description}</p>
      <div className="rating"><Star size={14} fill="currentColor"/><b>{p.rating}</b><span>({format(p.reviews)})</span><span className="downloads"><Download size={13}/>{format(p.downloads)}</span></div>
    </div>
  </Link>
}

function Catalog({title,subtitle,category,products}) {
  const [q,setQ]=useState(""); const [sort,setSort]=useState("Popular");
  const filtered=useMemo(()=>products.filter(p=>p.category===category && (`${p.name} ${p.description} ${p.tag}`).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>sort==="Rating"?b.rating-a.rating:b.downloads-a.downloads),[products,q,sort,category]);
  return <section className="section catalog"><div className="container"><div className="catalog-title"><div><span className="eyebrow">TOOL COLLECTION</span><h1>{title}</h1><p>{subtitle}</p></div><div className="catalog-icon">{category==="Crypto"?<Wallet/>:category==="Game"||category==="Roblox"?<Gamepad2/>:<ShieldCheck/>}</div></div>
    <div className="filterbar"><div className="searchbox"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search tools..."/></div><div className="chips"><button className="chip active">All</button><button className="chip">Free</button><button className="chip">Premium</button></div><select value={sort} onChange={e=>setSort(e.target.value)}><option>Popular</option><option>Rating</option></select></div>
    <div className="catalog-meta"><span>{filtered.length*40+40} tools available</span><span>Updated regularly</span></div>
    <div className="product-list">{filtered.map(p=><ProductRow p={p} key={p.id}/>)}</div>
  </div></section>
}

function ProductRow({p}) {
  return <Link className="product-row" to={`/product/${p.id}`}><img src={p.image}/><div className="row-main"><h3>{p.name}</h3><p>{p.description}</p><span className="tag">{p.tag}</span></div><div className="row-rating"><Star size={14} fill="currentColor"/><b>{p.rating}</b><span>({format(p.reviews)})</span></div><div className="row-downloads"><Download size={14}/>{format(p.downloads)}</div><span className="small-btn">Details</span></Link>
}

function ProductPage({products}) {
  const {id}=useParams(); const p=products.find(x=>x.id===id)||products[0];
  return <section className="section product-page"><div className="container">
    <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to={"/"+p.category.toLowerCase()}>{p.category}</Link><span>/</span><b>{p.name}</b></div>
    <div className="product-hero-card"><div className="product-cover"><img src={p.image}/><span className="cover-glow"></span></div><div className="product-info"><span className="eyebrow">{p.category.toUpperCase()} · {p.tag.toUpperCase()}</span><h1>{p.name}</h1><p>{p.longDescription||p.description}</p><div className="big-rating"><span><Star size={18} fill="currentColor"/>{p.rating}</span><small>Excellent · {format(p.reviews)} reviews</small></div><div className="hero-actions"><button className="btn primary"><Download size={17}/> Download</button><button className="btn ghost"><Eye size={17}/> Screenshots</button></div><div className="detail-stats"><div><b>{format(p.downloads)}</b><span>Downloads</span></div><div><b>{p.version}</b><span>Version</span></div><div><b>{p.size}</b><span>Size</span></div><div><b>{p.updated}</b><span>Updated</span></div></div></div></div>
    <div className="content-two"><div><div className="panel"><h2>About {p.name}</h2><p>{p.longDescription}</p><p>This demo detail page is intentionally content-driven, so the admin panel can later control every field without changing the layout.</p></div><div className="panel"><h2>Features</h2><div className="feature-grid">{["Clean modern interface","Regular updates","Detailed version history","Community ratings","Fast downloads","Responsive design"].map(x=><div key={x}><Check size={15}/>{x}</div>)}</div></div></div><aside className="panel side-panel"><h3>Product information</h3>{[["Category",p.category],["License",p.price],["Version",p.version],["File size",p.size],["Last update",p.updated]].map(([a,b])=><div className="info-line" key={a}><span>{a}</span><b>{b}</b></div>)}<button className="btn primary full"><Download size={16}/> Download Now</button></aside></div>
  </div></section>
}

function FAQ() {
  const qs=["Are all tools free to download?","How do I find a specific tool?","How are ratings calculated?","Can I request a tool?","How often are products updated?","Is there an admin dashboard?"];
  const [open,setOpen]=useState(0);
  return <section className="section"><div className="narrow"><div className="page-intro"><span className="eyebrow"><CircleHelp size={14}/> HELP CENTER</span><h1>Frequently Asked Questions</h1><p>Find answers to common questions about the ToolHub catalog.</p></div><div className="faq">{qs.map((q,i)=><div className={"faq-item "+(open===i?"open":"")} key={q}><button onClick={()=>setOpen(open===i?-1:i)}><span>{q}</span><ChevronDown/></button>{open===i&&<p>ToolHub is a flexible catalog template. This content can be edited later from the CMS, and the answer area can be connected to your real support documentation.</p>}</div>)}</div></div></section>
}

function About() {
  return <section className="section"><div className="container"><div className="about-hero"><div><span className="eyebrow">ABOUT TOOLHUB</span><h1>A better way to discover useful tools.</h1><p>ToolHub is a premium directory concept built around clear product information, powerful discovery and a clean dark interface.</p></div><div className="about-art">◆</div></div><div className="about-grid"><div className="panel"><h2>Our mission</h2><p>Make software discovery feel organized instead of overwhelming. Every product has a consistent card, detailed page and useful metadata.</p></div><div className="panel"><h2>Why choose us</h2>{["Curated catalog","Fast discovery","Clear product details","Responsive experience","Admin-friendly architecture"].map(x=><div className="check-line" key={x}><Check size={16}/>{x}</div>)}</div></div></div></section>
}

function Admin({products,setProducts}) {
  const [tab,setTab]=useState("Dashboard"); const [editing,setEditing]=useState(null);
  const [stats,setStats]=useState({
    totalProducts:products.length,totalUsers:50250,totalDownloads:1234567,averageRating:4.8,
    monthlyDownloads:[48,62,55,81,74,96,88,112,101,128,117,142],
    countries:[["United States",28.5],["India",15.2],["Brazil",8.7],["Germany",6.3],["United Kingdom",4.8],["France",3.9],["Canada",3.1]]
  });
  useEffect(()=>{getJSON(`${API}/stats`).then(x=>x&&setStats(x))},[]);
  const save=async (p)=>{
    const exists=products.some(x=>x.id===p.id);
    const method=exists?"PUT":"POST"; const url=exists?`${API}/products/${p.id}`:`${API}/products`;
    const result=await getJSON(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
    setProducts(prev=>exists?prev.map(x=>x.id===p.id?(result||p):x):(result?[result,...prev]:[p,...prev]));
    setEditing(null);
  };
  const navItems=[
    ["Dashboard",LayoutDashboard],["Products",Package],["Categories",Grid2X2],["Users",Users],["Reviews",Star],["Downloads",Download],
    ["Overview",BarChart3],["Charts",TrendingUp],["Countries",GlobeIcon],["General",Settings],["Pages",Eye]
  ];
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="brand" to="/"><span className="brand-mark">◆</span><span>Tool<span>Hub</span></span></Link>
      <div className="admin-profile"><div className="avatar profile-avatar">SA</div><div><b>Super Admin</b><small>Administrator</small></div><ChevronDown size={13}/></div>
      <nav>
        {navItems.map(([name,I],idx)=><React.Fragment key={name}>
          {(idx===6||idx===9)&&<span className="nav-label">{idx===6?"ANALYTICS":"SETTINGS"}</span>}
          <button className={tab===name?"sel":""} onClick={()=>setTab(name)}><I/> {name}</button>
        </React.Fragment>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="server-status"><i></i><div><b>All systems operational</b><small>Last checked just now</small></div></div>
        <Link to="/" className="back-site">← Back to website</Link>
      </div>
    </aside>
    <main className="admin-main">
      <div className="admin-top">
        <div className="admin-breadcrumb"><span>ADMIN</span><b>/</b><strong>{tab}</strong></div>
        <div className="admin-actions"><button className="icon-btn"><Search/></button><button className="icon-btn"><Settings/></button><div className="top-avatar">SA</div><Link className="btn ghost" to="/">View Site</Link></div>
      </div>
      {tab==="Dashboard"
        ? <Dashboard stats={stats} products={products}/>
        : tab==="Products"
          ? <ProductManager products={products} onEdit={setEditing} onNew={()=>setEditing({id:"",name:"New Tool",slug:"new-tool",category:"Windows",tag:"Utility",description:"",rating:5,reviews:0,downloads:0,version:"1.0.0",size:"10 MB",updated:"Today",price:"Free",image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",featured:false})}/>
          : <div className="dashboard"><div className="empty-admin"><div className="cat-icon"><Settings/></div><h1>{tab}</h1><p>This section is ready for the next CMS/analytics implementation.</p></div></div>}
    </main>
    {editing&&<ProductModal product={editing} onClose={()=>setEditing(null)} onSave={save}/>}
  </div>
}
function Dashboard({stats,products}) {
  const max=Math.max(...stats.monthlyDownloads);
  const countryTotal=stats.countries.reduce((a,[,v])=>a+v,0);
  return <div className="dashboard">
    <div className="dash-heading">
      <div><h1>Dashboard</h1><p>Overview of your catalog, users and platform activity.</p></div>
      <div className="dashboard-tools"><button className="date-btn">May 1, 2026 — May 31, 2026 <ChevronDown size={14}/></button><button className="btn export-btn">Export Report</button></div>
    </div>

    <div className="kpi-grid">
      {[["Total Tools",stats.totalProducts,"+12 this month",Package],["Total Users","50,250","+8.2% this month",Users],["Total Downloads","1,234,567","+15.3% this month",Download],["Average Rating",stats.averageRating,"+0.2 this month",Star]].map(([a,b,c,I])=>
        <div className="kpi" key={a}><div className="kpi-icon"><I/></div><span>{a}</span><strong>{b}</strong><small>{c}</small></div>
      )}
    </div>

    <div className="analytics-grid">
      <div className="admin-panel chart-panel">
        <div className="panel-head"><div><h3>Downloads Overview</h3><small>Monthly downloads</small></div><select><option>This Year</option><option>Last Year</option></select></div>
        <div className="chart-y-labels"><span>200K</span><span>150K</span><span>100K</span><span>50K</span><span>0</span></div>
        <div className="chart chart-enhanced">
          <div className="chart-gridlines"><i></i><i></i><i></i><i></i></div>
          {stats.monthlyDownloads.map((v,i)=><div className="bar-col" key={i}><div className="bar" style={{height:`${(v/max)*88}%`}}></div><small>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]}</small></div>)}
        </div>
        <div className="chart-legend"><i></i> Downloads <span>● Live data</span></div>
      </div>

      <div className="admin-panel countries-panel">
        <div className="panel-head"><div><h3>Top Countries</h3><small>Downloads by location</small></div><button className="more-btn">•••</button></div>
        {stats.countries.map(([name,v],i)=><div className="country" key={name}>
          <div><span className={"flag flag-"+i}></span><b>{name}</b><em>{v}%</em></div>
          <div className="progress"><i style={{width:`${Math.min(100,(v/28.5)*100)}%`}}></i></div>
        </div>)}
        <button className="panel-link">View all countries <ArrowRight size={12}/></button>
      </div>
    </div>

    <div className="bottom-grid admin-three">
      <div className="admin-panel">
        <div className="panel-head"><div><h3>Top Tools</h3><small>Most downloaded this month</small></div><button className="panel-link">View all</button></div>
        {products.slice(0,5).map((p,i)=><div className="mini-row" key={p.id}><span className="rank">{i+1}</span><img src={p.image}/><div><b>{p.name}</b><small>{p.category} · {p.tag}</small></div><strong>{format(p.downloads)}</strong><span className="trend-up">↗</span></div>)}
      </div>

      <div className="admin-panel">
        <div className="panel-head"><div><h3>Recent Reviews</h3><small>Latest community activity</small></div><button className="panel-link">View all</button></div>
        {["Great interface and very useful!","Amazing catalog, lots of tools.","Best directory I've found.","Reliable and fast.","Love the new design."].map((x,i)=><div className="review-row" key={x}><div className="avatar tiny">{["MK","AL","SK","JM","DL"][i]}</div><div><b>{["Mila K.","Alex L.","Sam K.","Jamie M.","David L."][i]}</b><p>{x}</p></div><div className="stars">★★★★★</div></div>)}
      </div>

      <div className="admin-panel">
        <div className="panel-head"><div><h3>Quick Actions</h3><small>Common management tasks</small></div></div>
        <div className="quick-actions">
          <Link to="/admin" className="quick-action"><span><Plus/></span><div><b>Add New Tool</b><small>Create catalog entry</small></div></Link>
          <button className="quick-action"><span><Grid2X2/></span><div><b>Manage Categories</b><small>Organize catalog</small></div></button>
          <button className="quick-action"><span><Users/></span><div><b>Manage Users</b><small>View user accounts</small></div></button>
          <button className="quick-action"><span><Settings/></span><div><b>Site Settings</b><small>Configure platform</small></div></button>
        </div>
        <div className="system-card"><div><i></i><b>System Status</b></div><span>Online</span><small>API · Database · Storage</small></div>
      </div>
    </div>

    <div className="activity-grid">
      <div className="admin-panel">
        <div className="panel-head"><div><h3>Activity Log</h3><small>Latest administrative events</small></div><button className="panel-link">View full log</button></div>
        {["New tool “Synapse X” was added","Elden Ring Trainer was updated","New user registered","Windows Tools category edited","Backup completed successfully"].map((x,i)=><div className="activity-row" key={x}><span className="activity-dot"></span><div><b>{x}</b><small>{["2 min ago","15 min ago","32 min ago","1 hour ago","2 hours ago"][i]}</small></div></div>)}
      </div>
      <div className="admin-panel system-info">
        <div className="panel-head"><div><h3>System Information</h3><small>Platform health</small></div></div>
        {[["Total Tools",stats.totalProducts],["Total Categories","24"],["Total Users","50,250"],["Database Size","2.4 GB"],["Server Status","Online"],["Last Backup","2 hours ago"]].map(([a,b])=><div className="info-line" key={a}><span>{a}</span><b className={b==="Online"?"online":""}>{b}</b></div>)}
      </div>
    </div>
  </div>
}
function ProductManager({products,onEdit,onNew}) {
  return <div className="dashboard"><div className="dash-heading"><div><h1>Products</h1><p>Manage every product field from one place.</p></div><button className="btn primary" onClick={onNew}><Plus size={16}/> Add New Tool</button></div><div className="admin-panel table-panel"><div className="table-toolbar"><div className="searchbox"><Search size={15}/><input placeholder="Search products..."/></div><select><option>All Categories</option><option>Windows</option><option>Game</option><option>Roblox</option><option>Crypto</option></select></div><table><thead><tr><th>Product</th><th>Category</th><th>Rating</th><th>Downloads</th><th>Updated</th><th></th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="table-product"><img src={p.image}/><div><b>{p.name}</b><small>{p.tag} · v{p.version}</small></div></div></td><td><span className="status-pill">{p.category}</span></td><td><span className="stars">★ {p.rating}</span></td><td>{format(p.downloads)}</td><td>{p.updated}</td><td><button className="edit-btn" onClick={()=>onEdit(p)}><Edit3 size={15}/> Edit</button></td></tr>)}</tbody></table></div></div>
}

function ProductModal({product,onClose,onSave}) {
  const [p,setP]=useState(product); const set=(k,v)=>setP({...p,[k]:v});
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><span className="eyebrow">PRODUCT CMS</span><h2>{product.id?"Edit Product":"Create Product"}</h2></div><button onClick={onClose}><X/></button></div><div className="form-grid"><label>Name<input value={p.name} onChange={e=>set("name",e.target.value)}/></label><label>Slug<input value={p.slug} onChange={e=>set("slug",e.target.value)}/></label><label>Category<select value={p.category} onChange={e=>set("category",e.target.value)}><option>Windows</option><option>Game</option><option>Roblox</option><option>Crypto</option></select></label><label>Tag<input value={p.tag} onChange={e=>set("tag",e.target.value)}/></label><label>Rating<input type="number" step=".1" value={p.rating} onChange={e=>set("rating",+e.target.value)}/></label><label>Downloads<input type="number" value={p.downloads} onChange={e=>set("downloads",+e.target.value)}/></label><label>Version<input value={p.version} onChange={e=>set("version",e.target.value)}/></label><label>Price<input value={p.price} onChange={e=>set("price",e.target.value)}/></label><label className="wide">Image URL<input value={p.image} onChange={e=>set("image",e.target.value)}/></label><label className="wide">Short description<textarea value={p.description} onChange={e=>set("description",e.target.value)}/></label><label className="wide">Long description<textarea rows="5" value={p.longDescription||""} onChange={e=>set("longDescription",e.target.value)}/></label></div><div className="modal-actions"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" onClick={()=>onSave(p)}><Check size={16}/> Save Changes</button></div></div></div>
}

function GlobeIcon(){return <span className="globe-placeholder">◎</span>}
function format(n){return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1}).format(n||0)}

createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);

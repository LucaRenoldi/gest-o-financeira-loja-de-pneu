import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, ShoppingBag, CreditCard, Package,
  DollarSign, Tag, Plus, X, Check, TrendingUp, TrendingDown,
  Truck, Eye, AlertCircle, Phone, MapPin, Calendar
} from "lucide-react";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:#0d0e12}
  ::-webkit-scrollbar-thumb{background:#f97316;border-radius:2px}
  select option{background:#111115;color:#f1f5f9}
`;

const O  = "#f97316";
const G  = "#22c55e";
const R  = "#ef4444";
const B  = "#3b82f6";
const Y  = "#eab308";
const P  = "#a855f7";
const PC = ["#f97316","#3b82f6","#22c55e","#eab308","#a855f7","#ec4899","#14b8a6","#f43f5e"];

const TIRE_SIZES = [
  "165/70R13","175/65R14","185/60R14","185/65R15","195/55R15",
  "195/60R15","195/65R15","205/55R16","205/60R16","215/55R17",
  "215/60R17","225/45R17","225/55R17","235/55R18","245/45R18",
  "255/35R18","265/60R18","265/65R17","275/55R20","285/35R19",
];
const REGIONS   = ["Salvador","Lauro de Freitas","Camaçari","Simões Filho","Dias d'Ávila","São Francisco do Conde","Feira de Santana","Outras"];
const EXP_CATS  = ["Aluguel","Energia","Água","Internet","Funcionários","Frete","Embalagem","Manutenção","Alimentação","Transporte","Saúde","Lazer","Outros"];
const SUPPLIERS = ["Bridgestone BR","Michelin Dist.","Goodyear SP","Continental MG","Pirelli RJ","JK Pneus","Pneus Mix"];
const BRANDS    = ["Bridgestone","Michelin","Goodyear","Continental","Pirelli","Firestone","Dunlop","Hankook","Yokohama","Westlake"];

const INIT_SALES = [
  {id:1,date:"2026-04-01",time:"09:30",clientName:"João Silva",clientPhone:"71999881234",region:"Salvador",items:[{size:"205/55R16",qty:4,unitPrice:380}],total:1520,paid:true},
  {id:2,date:"2026-04-02",time:"14:00",clientName:"Mariana Costa",clientPhone:"71988772345",region:"Lauro de Freitas",items:[{size:"195/65R15",qty:2,unitPrice:290}],total:580,paid:false},
  {id:3,date:"2026-04-05",time:"10:15",clientName:"Roberto Lima",clientPhone:"71977661234",region:"Camaçari",items:[{size:"215/55R17",qty:4,unitPrice:450},{size:"265/60R18",qty:2,unitPrice:680}],total:3160,paid:true},
  {id:4,date:"2026-04-07",time:"16:30",clientName:"Ana Santos",clientPhone:"71966550987",region:"Salvador",items:[{size:"185/65R15",qty:2,unitPrice:260}],total:520,paid:false},
  {id:5,date:"2026-04-08",time:"08:45",clientName:"Carlos Mendes",clientPhone:"71955443210",region:"Feira de Santana",items:[{size:"225/45R17",qty:4,unitPrice:520}],total:2080,paid:true},
  {id:6,date:"2026-04-10",time:"11:20",clientName:"Fernanda Reis",clientPhone:"71944332100",region:"Salvador",items:[{size:"175/65R14",qty:4,unitPrice:220}],total:880,paid:true},
  {id:7,date:"2026-04-12",time:"15:00",clientName:"Marcos Oliveira",clientPhone:"71933221987",region:"Simões Filho",items:[{size:"205/60R16",qty:2,unitPrice:360}],total:720,paid:false},
  {id:8,date:"2026-04-14",time:"09:00",clientName:"Lucia Ferreira",clientPhone:"71922110876",region:"Salvador",items:[{size:"245/45R18",qty:4,unitPrice:620}],total:2480,paid:true},
];
const INIT_PURCHASES = [
  {id:1,orderNumber:"PED-001",brand:"Bridgestone",items:[{size:"205/55R16",qty:20},{size:"195/65R15",qty:20}],totalQty:40,date:"2026-03-15",supplier:"Bridgestone BR",totalCost:14200},
  {id:2,orderNumber:"PED-002",brand:"Michelin",items:[{size:"215/55R17",qty:16},{size:"225/45R17",qty:12}],totalQty:28,date:"2026-03-22",supplier:"Michelin Dist.",totalCost:18600},
  {id:3,orderNumber:"PED-003",brand:"Goodyear",items:[{size:"185/65R15",qty:24},{size:"175/65R14",qty:20}],totalQty:44,date:"2026-04-02",supplier:"Goodyear SP",totalCost:11800},
  {id:4,orderNumber:"PED-004",brand:"Hankook",items:[{size:"245/45R18",qty:12},{size:"265/60R18",qty:8}],totalQty:20,date:"2026-04-08",supplier:"JK Pneus",totalCost:15400},
];
const INIT_EXPENSES = [
  {id:1,date:"2026-04-01",time:"08:00",category:"Aluguel",tag:"empresa",description:"Aluguel galpão Abril",value:2500,payee:"Imobiliária Central"},
  {id:2,date:"2026-04-02",time:"09:00",category:"Energia",tag:"empresa",description:"Conta de luz Março",value:380,payee:"Coelba"},
  {id:3,date:"2026-04-03",time:"10:00",category:"Alimentação",tag:"pessoal",description:"Supermercado semana",value:620,payee:"Atacadão"},
  {id:4,date:"2026-04-05",time:"14:00",category:"Frete",tag:"empresa",description:"Frete pedido PED-003",value:350,payee:"Trans-Pneus"},
  {id:5,date:"2026-04-08",time:"16:00",category:"Saúde",tag:"pessoal",description:"Plano de saúde Abril",value:480,payee:"Unimed"},
  {id:6,date:"2026-04-10",time:"09:30",category:"Internet",tag:"empresa",description:"Internet fibra Abril",value:150,payee:"Vivo Fibra"},
  {id:7,date:"2026-04-12",time:"11:00",category:"Transporte",tag:"pessoal",description:"Combustível semana",value:280,payee:"Posto Shell"},
  {id:8,date:"2026-04-14",time:"13:00",category:"Funcionários",tag:"empresa",description:"Pagamento assistente",value:1800,payee:"Pedro Alves"},
];

const fmt    = v => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const fmtD   = d => new Date(d+"T00:00:00").toLocaleDateString("pt-BR");
const today  = () => new Date().toISOString().split("T")[0];
const nowT   = () => new Date().toTimeString().slice(0,5);

function buildDailyChart(sales, expenses) {
  const map = {};
  for(let i=1;i<=16;i++){
    const k=`2026-04-${String(i).padStart(2,"0")}`;
    map[k]={label:`${i}/04`,fat:0,desp:0};
  }
  sales.forEach(s=>{if(map[s.date])map[s.date].fat+=s.total;});
  expenses.forEach(e=>{if(map[e.date])map[e.date].desp+=e.value;});
  return Object.values(map).map(d=>({...d,lucro:d.fat-d.desp}));
}
function buildRegion(sales){
  const m={};
  sales.forEach(s=>{m[s.region]=(m[s.region]||0)+s.total;});
  return Object.entries(m).map(([name,value])=>({name,value}));
}
function buildPie(expenses){
  const m={};
  expenses.forEach(e=>{m[e.category]=(m[e.category]||0)+e.value;});
  return Object.entries(m).map(([name,value])=>({name,value}));
}

const inp = {width:"100%",background:"#0d0e12",border:"1px solid #2d2d38",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontSize:14,outline:"none"};
const btnS = (v="primary")=>({
  background:v==="primary"?O:"transparent",
  border:v==="primary"?"none":`1px solid ${O}`,
  color:v==="primary"?"#000":O,
  borderRadius:8,padding:"10px 22px",cursor:"pointer",
  fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:14,
});

function Label({children}){
  return <div style={{color:"#64748b",fontSize:11,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>{children}</div>;
}
function Field({label,children,span}){
  return <div style={{gridColumn:span?"1/-1":"auto"}}>
    <Label>{label}</Label>
    {children}
  </div>;
}

function Modal({open,onClose,title,children}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(3px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:"#16171e",border:"1px solid #2d2d38",borderRadius:16,padding:32,width:"92%",maxWidth:620,maxHeight:"88vh",overflowY:"auto",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:26,color:O,letterSpacing:"0.06em"}}>{title}</h2>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b"}}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KPI({title,value,sub,up,icon:Icon,color}){
  return(
    <div style={{background:"#14151c",border:`1px solid ${color}28`,borderRadius:12,padding:"20px 22px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-24,right:-24,width:88,height:88,borderRadius:"50%",background:`${color}10`}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{color:"#64748b",fontSize:11,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em"}}>{title}</span>
        <div style={{background:`${color}18`,borderRadius:8,padding:"6px 8px",display:"flex"}}><Icon size={15} color={color}/></div>
      </div>
      <div style={{fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:500,color:"#f1f5f9",marginBottom:6}}>{value}</div>
      {sub&&<div style={{color:up?G:R,fontSize:12,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:4}}>
        {up?<TrendingUp size={12}/>:<TrendingDown size={12}/>}{sub}
      </div>}
    </div>
  );
}

function ChartTip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"#16171e",border:"1px solid #2d2d38",borderRadius:8,padding:"10px 14px"}}>
      <p style={{color:"#94a3b8",fontSize:11,fontFamily:"Barlow,sans-serif",marginBottom:6}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,fontSize:12,fontFamily:"IBM Plex Mono",margin:"2px 0"}}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({sales,expenses,purchases}){
  const [period,setPeriod]=useState("mensal");
  const totalFat   = useMemo(()=>sales.filter(s=>s.paid).reduce((a,s)=>a+s.total,0),[sales]);
  const totalDesp  = useMemo(()=>expenses.reduce((a,e)=>a+e.value,0),[expenses]);
  const totalLucro = totalFat-totalDesp;
  const totalRec   = useMemo(()=>sales.filter(s=>!s.paid).reduce((a,s)=>a+s.total,0),[sales]);
  const chartData  = useMemo(()=>buildDailyChart(sales,expenses),[sales,expenses]);
  const regionData = useMemo(()=>buildRegion(sales),[sales]);
  const pieData    = useMemo(()=>buildPie(expenses),[expenses]);
  const periods    = ["diário","semanal","mensal","anual"];

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {periods.map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{
            padding:"7px 20px",borderRadius:20,border:"none",cursor:"pointer",
            background:period===p?O:"#14151c",color:period===p?"#000":"#64748b",
            fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:13,
            textTransform:"capitalize",transition:"all .15s",
          }}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <KPI title="Faturamento"    value={fmt(totalFat)}   sub="+12% vs mês anterior" up icon={TrendingUp}   color={G}/>
        <KPI title="Despesas"       value={fmt(totalDesp)}  sub="-3% vs mês anterior"  up icon={DollarSign}   color={R}/>
        <KPI title="Lucro Líquido"  value={fmt(totalLucro)} sub="+18% vs mês anterior" up icon={TrendingUp}   color={O}/>
        <KPI title="A Receber"      value={fmt(totalRec)}   sub={`${sales.filter(s=>!s.paid).length} em aberto`} icon={CreditCard} color={Y}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:24}}>
          <h3 style={{fontFamily:"Bebas Neue",fontSize:18,color:"#f1f5f9",letterSpacing:"0.06em",marginBottom:20}}>Faturamento · Despesas · Lucro (Abril)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gFat"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={G} stopOpacity={.25}/><stop offset="95%" stopColor={G} stopOpacity={0}/></linearGradient>
                <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={R} stopOpacity={.25}/><stop offset="95%" stopColor={R} stopOpacity={0}/></linearGradient>
                <linearGradient id="gLuc"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor={O} stopOpacity={.25}/><stop offset="95%" stopColor={O} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28"/>
              <XAxis dataKey="label" tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend wrapperStyle={{fontSize:12,fontFamily:"Barlow,sans-serif",paddingTop:10}}/>
              <Area type="monotone" dataKey="fat"   name="Faturamento" stroke={G} fill="url(#gFat)"  strokeWidth={2}/>
              <Area type="monotone" dataKey="desp"  name="Despesas"    stroke={R} fill="url(#gDesp)" strokeWidth={2}/>
              <Area type="monotone" dataKey="lucro" name="Lucro"       stroke={O} fill="url(#gLuc)"  strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:24}}>
          <h3 style={{fontFamily:"Bebas Neue",fontSize:18,color:"#f1f5f9",letterSpacing:"0.06em",marginBottom:16}}>Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="46%" outerRadius={78} innerRadius={36} dataKey="value" paddingAngle={3}>
                {pieData.map((_,i)=><Cell key={i} fill={PC[i%PC.length]}/>)}
              </Pie>
              <Tooltip formatter={(v,n)=>[fmt(v),n]} contentStyle={{background:"#16171e",border:"1px solid #2d2d38",borderRadius:8,fontFamily:"Barlow,sans-serif",fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",marginTop:4}}>
            {pieData.map((d,i)=>(
              <span key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748b",fontFamily:"Barlow,sans-serif"}}>
                <span style={{width:7,height:7,borderRadius:1,background:PC[i%PC.length],display:"inline-block"}}/>
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:24}}>
          <h3 style={{fontFamily:"Bebas Neue",fontSize:18,color:"#f1f5f9",letterSpacing:"0.06em",marginBottom:16}}>Faturamento por Região</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={regionData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="value" name="Faturamento" radius={[4,4,0,0]}>
                {regionData.map((_,i)=><Cell key={i} fill={i===0?O:PC[i%PC.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:24}}>
          <h3 style={{fontFamily:"Bebas Neue",fontSize:18,color:"#f1f5f9",letterSpacing:"0.06em",marginBottom:20}}>Resumo do Mês</h3>
          {[
            {label:"Total de Vendas",value:sales.length,unit:"vendas",color:B},
            {label:"Vendas Pagas",value:sales.filter(s=>s.paid).length,unit:"vendas",color:G},
            {label:"Fiado em Aberto",value:sales.filter(s=>!s.paid).length,unit:"vendas",color:Y},
            {label:"Pedidos de Compra",value:purchases.length,unit:"pedidos",color:P},
            {label:"Pneus Comprados",value:purchases.reduce((a,p)=>a+p.totalQty,0),unit:"unidades",color:O},
          ].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<4?"1px solid #1e1e28":"none"}}>
              <span style={{color:"#94a3b8",fontFamily:"Barlow,sans-serif",fontSize:14}}>{r.label}</span>
              <span style={{color:r.color,fontFamily:"IBM Plex Mono",fontSize:16,fontWeight:500}}>{r.value} <span style={{fontSize:11,color:"#64748b"}}>{r.unit}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Vendas ── */
function Vendas({sales,setSales}){
  const empty = {clientName:"",clientPhone:"",region:REGIONS[0],items:[{size:TIRE_SIZES[7],qty:1,unitPrice:""}],paid:true,date:today(),time:nowT()};
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(empty);

  const addItem  = ()=>setForm(f=>({...f,items:[...f.items,{size:TIRE_SIZES[7],qty:1,unitPrice:""}]}));
  const remItem  = i=>setForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}));
  const updItem  = (i,k,v)=>setForm(f=>{const it=[...f.items];it[i]={...it[i],[k]:k==="size"?v:Number(v)};return{...f,items:it};});
  const total    = form.items.reduce((a,it)=>a+(it.qty||0)*(it.unitPrice||0),0);

  const save=()=>{
    if(!form.clientName||total===0)return;
    setSales(p=>[...p,{...form,id:Date.now(),total}]);
    setModal(false);setForm(empty);
  };

  const TH = s=><th style={{padding:"13px 16px",textAlign:"left",color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em"}}>{s}</th>;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em"}}>Vendas</h2>
          <p style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13,marginTop:3}}>{sales.length} vendas registradas</p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btnS(),display:"flex",alignItems:"center",gap:8}}>
          <Plus size={15}/> Nova Venda
        </button>
      </div>

      <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:"1px solid #2d2d38"}}>{["Data/Hora","Cliente","Região","Pneus","Total","Status"].map(h=><th key={h} style={{padding:"13px 16px",textAlign:"left",color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em"}}>{h}</th>)}</tr></thead>
          <tbody>
            {[...sales].reverse().map(s=>(
              <tr key={s.id} style={{borderBottom:"1px solid #1a1a22",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1c1d24"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"13px 16px",color:"#64748b",fontSize:12,fontFamily:"IBM Plex Mono"}}>{fmtD(s.date)}<br/><span style={{fontSize:10,color:"#374151"}}>{s.time}</span></td>
                <td style={{padding:"13px 16px"}}>
                  <div style={{color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontSize:14,fontWeight:500}}>{s.clientName}</div>
                  <div style={{color:"#4b5563",fontSize:12,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:4}}><Phone size={10}/>{s.clientPhone}</div>
                </td>
                <td style={{padding:"13px 16px"}}>
                  <span style={{background:"#1a2236",color:"#60a5fa",fontSize:11,padding:"3px 10px",borderRadius:12,fontFamily:"Barlow,sans-serif"}}>{s.region}</span>
                </td>
                <td style={{padding:"13px 16px"}}>
                  {s.items.map((it,j)=><div key={j} style={{color:"#94a3b8",fontSize:12,fontFamily:"Barlow,sans-serif"}}>{it.qty}× {it.size} · {fmt(it.unitPrice)}</div>)}
                </td>
                <td style={{padding:"13px 16px",color:O,fontFamily:"IBM Plex Mono",fontSize:15,fontWeight:500}}>{fmt(s.total)}</td>
                <td style={{padding:"13px 16px"}}>
                  <span style={{background:s.paid?"#14532d":"#422006",color:s.paid?"#4ade80":"#fb923c",fontSize:11,padding:"4px 12px",borderRadius:12,fontFamily:"Barlow,sans-serif",fontWeight:600}}>
                    {s.paid?"Pago":"Fiado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nova Venda">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <Field label="Nome do Cliente" span><input style={inp} value={form.clientName} onChange={e=>setForm(f=>({...f,clientName:e.target.value}))} placeholder="Ex: João Silva"/></Field>
          <Field label="Telefone"><input style={inp} value={form.clientPhone} onChange={e=>setForm(f=>({...f,clientPhone:e.target.value}))} placeholder="71999999999"/></Field>
          <Field label="Região">
            <select style={inp} value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))}>
              {REGIONS.map(r=><option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Pagamento">
            <select style={inp} value={form.paid?"pago":"fiado"} onChange={e=>setForm(f=>({...f,paid:e.target.value==="pago"}))}>
              <option value="pago">À Vista (Pago)</option>
              <option value="fiado">Fiado (A Receber)</option>
            </select>
          </Field>
          <Field label="Data"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Hora"><input style={inp} type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field>
        </div>

        <div style={{borderTop:"1px solid #2d2d38",paddingTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <Label>Pneus da Venda</Label>
            <button onClick={addItem} style={{...btnS("outline"),padding:"5px 12px",fontSize:12,display:"flex",alignItems:"center",gap:4}}><Plus size={12}/> Adicionar</button>
          </div>
          {form.items.map((it,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1.8fr 70px 110px 30px",gap:8,marginBottom:8,alignItems:"center"}}>
              <select style={inp} value={it.size} onChange={e=>updItem(i,"size",e.target.value)}>
                {TIRE_SIZES.map(s=><option key={s}>{s}</option>)}
              </select>
              <input style={{...inp,textAlign:"center"}} type="number" min="1" value={it.qty} onChange={e=>updItem(i,"qty",e.target.value)} placeholder="Qtd"/>
              <input style={inp} type="number" min="0" step="0.01" value={it.unitPrice||""} onChange={e=>updItem(i,"unitPrice",e.target.value)} placeholder="R$/pneu"/>
              {form.items.length>1&&<button onClick={()=>remItem(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#4b5563"}}><X size={15}/></button>}
            </div>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0d0e12",borderRadius:8,padding:"12px 16px",margin:"16px 0"}}>
          <span style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:14}}>Total da Venda</span>
          <span style={{color:O,fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:500}}>{fmt(total)}</span>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={()=>setModal(false)} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} style={btnS()}>Salvar Venda</button>
        </div>
      </Modal>
    </div>
  );
}

/* ── A Receber ── */
function AReceber({sales,setSales}){
  const fiado = sales.filter(s=>!s.paid);
  const total = fiado.reduce((a,s)=>a+s.total,0);
  const mark  = id=>setSales(p=>p.map(s=>s.id===id?{...s,paid:true}:s));

  return(
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em"}}>A Receber — Fiado</h2>
        <p style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13,marginTop:3}}>
          {fiado.length} venda(s) em aberto · Total: <span style={{color:Y,fontFamily:"IBM Plex Mono"}}>{fmt(total)}</span>
        </p>
      </div>

      {fiado.length===0&&(
        <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:48,textAlign:"center",color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:16}}>
          ✅ &nbsp;Nenhuma venda em aberto. Tudo recebido!
        </div>
      )}

      <div style={{display:"grid",gap:12}}>
        {fiado.map(s=>(
          <div key={s.id} style={{background:"#14151c",border:`1px solid ${Y}35`,borderRadius:12,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              <div>
                <div style={{color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:16}}>{s.clientName}</div>
                <div style={{color:"#4b5563",fontSize:13,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                  <Phone size={11}/>{s.clientPhone} &nbsp;·&nbsp; <MapPin size={11}/>{s.region}
                </div>
                <div style={{color:"#374151",fontSize:11,fontFamily:"IBM Plex Mono",marginTop:4}}>{fmtD(s.date)} às {s.time}</div>
              </div>
              <div>
                {s.items.map((it,j)=><div key={j} style={{color:"#94a3b8",fontSize:13,fontFamily:"Barlow,sans-serif"}}>{it.qty}× {it.size} · {fmt(it.unitPrice)}/un</div>)}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:18,flexShrink:0}}>
              <span style={{color:Y,fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:500}}>{fmt(s.total)}</span>
              <button onClick={()=>mark(s.id)} style={{...btnS(),display:"flex",alignItems:"center",gap:6,padding:"9px 18px"}}>
                <Check size={14}/> Recebido
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Estoque ── */
function Estoque({purchases,setPurchases}){
  const emptyF = {orderNumber:"",brand:BRANDS[0],date:today(),supplier:SUPPLIERS[0],totalCost:"",items:[{size:TIRE_SIZES[7],qty:4}]};
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(emptyF);

  const addItem  = ()=>setForm(f=>({...f,items:[...f.items,{size:TIRE_SIZES[7],qty:4}]}));
  const updItem  = (i,k,v)=>setForm(f=>{const it=[...f.items];it[i]={...it[i],[k]:k==="size"?v:Number(v)};return{...f,items:it};});

  const save=()=>{
    if(!form.orderNumber)return;
    const totalQty=form.items.reduce((a,it)=>a+it.qty,0);
    setPurchases(p=>[...p,{...form,id:Date.now(),totalQty,totalCost:Number(form.totalCost)}]);
    setModal(false);setForm(emptyF);
  };

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em"}}>Estoque / Compras</h2>
          <p style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13,marginTop:3}}>{purchases.length} pedidos · {purchases.reduce((a,p)=>a+p.totalQty,0)} pneus comprados</p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btnS(),display:"flex",alignItems:"center",gap:8}}>
          <Plus size={15}/> Novo Pedido
        </button>
      </div>

      <div style={{display:"grid",gap:12}}>
        {[...purchases].reverse().map(p=>(
          <div key={p.id} style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:"18px 22px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <span style={{fontFamily:"Bebas Neue",fontSize:18,color:O,letterSpacing:"0.06em"}}>#{p.orderNumber}</span>
                  <span style={{background:"#1e2a3a",color:"#60a5fa",fontSize:11,padding:"2px 10px",borderRadius:10,fontFamily:"Barlow,sans-serif"}}>{p.brand}</span>
                  <span style={{color:"#4b5563",fontSize:12,fontFamily:"IBM Plex Mono"}}>{fmtD(p.date)}</span>
                </div>
                <div style={{color:"#64748b",fontSize:13,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <Truck size={13}/> {p.supplier}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {p.items.map((it,i)=>(
                    <span key={i} style={{background:"#0d0e12",color:"#94a3b8",fontSize:12,padding:"4px 12px",borderRadius:8,fontFamily:"IBM Plex Mono",border:"1px solid #2d2d38"}}>
                      {it.qty}× {it.size}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{color:O,fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:500}}>{fmt(p.totalCost)}</div>
                <div style={{color:"#4b5563",fontSize:12,fontFamily:"Barlow,sans-serif",marginTop:4}}>{p.totalQty} pneus no total</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Novo Pedido de Compra">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <Field label="Nº do Pedido"><input style={inp} value={form.orderNumber} onChange={e=>setForm(f=>({...f,orderNumber:e.target.value}))} placeholder="PED-005"/></Field>
          <Field label="Marca">
            <select style={inp} value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}>
              {BRANDS.map(b=><option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Fornecedor">
            <select style={inp} value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))}>
              {SUPPLIERS.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Data do Pedido"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Valor Total da Compra (R$)" span>
            <input style={inp} type="number" min="0" step="0.01" value={form.totalCost||""} onChange={e=>setForm(f=>({...f,totalCost:e.target.value}))} placeholder="0,00"/>
          </Field>
        </div>

        <div style={{borderTop:"1px solid #2d2d38",paddingTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <Label>Pneus do Pedido</Label>
            <button onClick={addItem} style={{...btnS("outline"),padding:"5px 12px",fontSize:12,display:"flex",alignItems:"center",gap:4}}><Plus size={12}/> Adicionar</button>
          </div>
          {form.items.map((it,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 90px",gap:8,marginBottom:8}}>
              <select style={inp} value={it.size} onChange={e=>updItem(i,"size",e.target.value)}>
                {TIRE_SIZES.map(s=><option key={s}>{s}</option>)}
              </select>
              <input style={{...inp,textAlign:"center"}} type="number" min="1" value={it.qty} onChange={e=>updItem(i,"qty",e.target.value)} placeholder="Qtd"/>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <button onClick={()=>setModal(false)} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} style={btnS()}>Salvar Pedido</button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Financeiro ── */
function Financeiro({sales,expenses,purchases}){
  const [detail,setDetail]=useState(null);
  const totalFat    = sales.filter(s=>s.paid).reduce((a,s)=>a+s.total,0);
  const totalDesp   = expenses.reduce((a,e)=>a+e.value,0);
  const totalComp   = purchases.reduce((a,p)=>a+p.totalCost,0);
  const totalLucro  = totalFat-totalDesp-totalComp;
  const totalRec    = sales.filter(s=>!s.paid).reduce((a,s)=>a+s.total,0);

  const cards=[
    {label:"Faturamento",   value:totalFat,   color:G, items:sales.filter(s=>s.paid).map(s=>({date:s.date,time:s.time,desc:`Venda — ${s.clientName}`,cat:"Vendas",tag:"venda",value:s.total}))},
    {label:"Despesas",      value:totalDesp,  color:R, items:expenses.map(e=>({date:e.date,time:e.time,desc:e.description,cat:e.category,tag:e.tag,value:e.value}))},
    {label:"Compras/Estoque",value:totalComp, color:B, items:purchases.map(p=>({date:p.date,time:"—",desc:`${p.brand} · ${p.orderNumber}`,cat:"Estoque",tag:"empresa",value:p.totalCost}))},
    {label:"Lucro Estimado",value:totalLucro, color:O, items:[]},
    {label:"A Receber",     value:totalRec,   color:Y, items:sales.filter(s=>!s.paid).map(s=>({date:s.date,time:s.time,desc:`Fiado — ${s.clientName}`,cat:"Vendas",tag:"fiado",value:s.total}))},
  ];

  return(
    <div>
      <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em",marginBottom:24}}>Financeiro</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        {cards.map(c=>(
          <div key={c.label}
            onClick={()=>c.items.length>0&&setDetail(c)}
            style={{background:"#14151c",border:`1px solid ${c.color}28`,borderRadius:12,padding:"22px 24px",
              cursor:c.items.length>0?"pointer":"default",transition:"border-color .15s",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>{if(c.items.length>0)e.currentTarget.style.borderColor=`${c.color}60`;}}
            onMouseLeave={e=>e.currentTarget.style.borderColor=`${c.color}28`}>
            <div style={{position:"absolute",top:-28,right:-28,width:90,height:90,borderRadius:"50%",background:`${c.color}08`}}/>
            <div style={{color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>{c.label}</div>
            <div style={{color:c.color,fontFamily:"IBM Plex Mono",fontSize:24,fontWeight:500,marginBottom:8}}>{fmt(c.value)}</div>
            {c.items.length>0&&<div style={{color:"#4b5563",fontSize:12,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:4}}>
              <Eye size={12}/> Ver detalhes ({c.items.length})
            </div>}
          </div>
        ))}
      </div>

      <Modal open={!!detail} onClose={()=>setDetail(null)} title={detail?.label||""}>
        {detail&&(
          <div>
            <div style={{background:"#0d0e12",borderRadius:8,padding:"12px 18px",marginBottom:16,display:"flex",justifyContent:"space-between"}}>
              <span style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:14}}>Total</span>
              <span style={{color:detail.color,fontFamily:"IBM Plex Mono",fontSize:20}}>{fmt(detail.value)}</span>
            </div>
            <div style={{maxHeight:420,overflowY:"auto"}}>
              {detail.items.map((d,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid #1a1a22"}}>
                  <div>
                    <div style={{color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontSize:14,marginBottom:4}}>{d.desc}</div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{color:"#4b5563",fontSize:11,fontFamily:"IBM Plex Mono"}}>{fmtD(d.date)} {d.time}</span>
                      <span style={{background:"#1e2a3a",color:"#60a5fa",fontSize:11,padding:"1px 8px",borderRadius:8,fontFamily:"Barlow,sans-serif"}}>{d.cat}</span>
                      <span style={{background:d.tag==="pessoal"?"#2a1a33":"#1e2a3a",color:d.tag==="pessoal"?"#c084fc":"#60a5fa",fontSize:11,padding:"1px 8px",borderRadius:8,fontFamily:"Barlow,sans-serif"}}>{d.tag}</span>
                    </div>
                  </div>
                  <span style={{color:detail.color,fontFamily:"IBM Plex Mono",fontSize:14,flexShrink:0,marginLeft:16}}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Despesas ── */
function Despesas({expenses,setExpenses}){
  const emptyF={category:EXP_CATS[0],tag:"empresa",description:"",value:"",payee:"",date:today(),time:nowT()};
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState("todos");
  const [form,setForm]=useState(emptyF);

  const filtered = filter==="todos"?expenses:expenses.filter(e=>e.tag===filter);
  const totalE   = expenses.filter(e=>e.tag==="empresa").reduce((a,e)=>a+e.value,0);
  const totalP   = expenses.filter(e=>e.tag==="pessoal").reduce((a,e)=>a+e.value,0);

  const save=()=>{
    if(!form.description||!form.value)return;
    setExpenses(p=>[...p,{...form,id:Date.now(),value:Number(form.value)}]);
    setModal(false);setForm(emptyF);
  };

  const tabs=[
    {k:"todos", label:"Todos",   bg:O,  active:filter==="todos"},
    {k:"empresa",label:"Empresa",bg:R,  active:filter==="empresa"},
    {k:"pessoal",label:"Pessoal",bg:P,  active:filter==="pessoal"},
  ];

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em"}}>Despesas</h2>
          <p style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13,marginTop:3}}>
            Empresa: <span style={{color:R,fontFamily:"IBM Plex Mono"}}>{fmt(totalE)}</span>
            &nbsp;·&nbsp; Pessoal: <span style={{color:P,fontFamily:"IBM Plex Mono"}}>{fmt(totalP)}</span>
          </p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btnS(),display:"flex",alignItems:"center",gap:8}}>
          <Plus size={15}/> Nova Despesa
        </button>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setFilter(t.k)} style={{
            padding:"7px 18px",borderRadius:20,border:"none",cursor:"pointer",
            background:t.active?t.bg:"#14151c",color:t.active?"#fff":"#64748b",
            fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:13,transition:"all .15s",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #2d2d38"}}>
              {["Data/Hora","Categoria","Descrição","Onde/Fornecedor","Tag","Valor"].map(h=>(
                <th key={h} style={{padding:"13px 16px",textAlign:"left",color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filtered].reverse().map(e=>(
              <tr key={e.id} style={{borderBottom:"1px solid #1a1a22"}}
                onMouseEnter={ev=>ev.currentTarget.style.background="#1c1d24"}
                onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                <td style={{padding:"13px 16px",color:"#4b5563",fontSize:11,fontFamily:"IBM Plex Mono"}}>{fmtD(e.date)}<br/>{e.time}</td>
                <td style={{padding:"13px 16px"}}>
                  <span style={{background:"#1e2a3a",color:"#60a5fa",fontSize:11,padding:"3px 10px",borderRadius:10,fontFamily:"Barlow,sans-serif"}}>{e.category}</span>
                </td>
                <td style={{padding:"13px 16px",color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontSize:14}}>{e.description}</td>
                <td style={{padding:"13px 16px",color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13}}>{e.payee}</td>
                <td style={{padding:"13px 16px"}}>
                  <span style={{
                    background:e.tag==="pessoal"?"#2a1a33":"#1e2a3a",
                    color:e.tag==="pessoal"?P:B,
                    fontSize:11,padding:"3px 10px",borderRadius:10,fontFamily:"Barlow,sans-serif",fontWeight:600,
                  }}>{e.tag}</span>
                </td>
                <td style={{padding:"13px 16px",color:R,fontFamily:"IBM Plex Mono",fontSize:14,fontWeight:500}}>-{fmt(e.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nova Despesa">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Categoria">
            <select style={inp} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {EXP_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Tag">
            <select style={inp} value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}>
              <option value="empresa">Empresa</option>
              <option value="pessoal">Pessoal</option>
            </select>
          </Field>
          <Field label="Descrição" span>
            <input style={inp} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Ex: Conta de luz Abril"/>
          </Field>
          <Field label="Onde / Fornecedor">
            <input style={inp} value={form.payee} onChange={e=>setForm(f=>({...f,payee:e.target.value}))} placeholder="Ex: Coelba"/>
          </Field>
          <Field label="Valor (R$)">
            <input style={inp} type="number" min="0" step="0.01" value={form.value||""} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder="0,00"/>
          </Field>
          <Field label="Data">
            <input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
          </Field>
          <Field label="Hora">
            <input style={inp} type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/>
          </Field>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
          <button onClick={()=>setModal(false)} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} style={btnS()}>Salvar Despesa</button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Nav Config ── */
const NAV=[
  {id:"dashboard", label:"Dashboard",  icon:LayoutDashboard},
  {id:"vendas",    label:"Vendas",      icon:ShoppingBag},
  {id:"receber",   label:"A Receber",   icon:CreditCard},
  {id:"estoque",   label:"Estoque",     icon:Package},
  {id:"financeiro",label:"Financeiro",  icon:DollarSign},
  {id:"despesas",  label:"Despesas",    icon:Tag},
];

/* ── App ── */
export default function App(){
  const [page,setPage]           = useState("dashboard");
  const [sales,setSales]         = useState(INIT_SALES);
  const [purchases,setPurchases] = useState(INIT_PURCHASES);
  const [expenses,setExpenses]   = useState(INIT_EXPENSES);

  const fiadoN = sales.filter(s=>!s.paid).length;
  const pageMeta = NAV.find(n=>n.id===page);

  return(
    <div style={{display:"flex",height:"100vh",background:"#0d0e12",fontFamily:"Barlow,sans-serif",overflow:"hidden"}}>
      <style>{FONTS}</style>

      {/* ── Sidebar ── */}
      <aside style={{width:215,background:"#0f1015",borderRight:"1px solid #1c1c26",display:"flex",flexDirection:"column",padding:"24px 14px",flexShrink:0}}>
        <div style={{paddingLeft:8,marginBottom:36}}>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:O,letterSpacing:"0.1em",lineHeight:1}}>PNEU</div>
          <div style={{fontFamily:"Bebas Neue",fontSize:28,color:"#f1f5f9",letterSpacing:"0.1em",lineHeight:1}}>CONTROL</div>
          <div style={{width:28,height:2,background:O,marginTop:6}}/>
        </div>

        <nav style={{flex:1}}>
          {NAV.map(({id,label,icon:Icon})=>{
            const active=page===id;
            const badge=id==="receber"&&fiadoN>0?fiadoN:null;
            return(
              <button key={id} onClick={()=>setPage(id)} style={{
                display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",
                background:active?`${O}18`:"transparent",
                color:active?O:"#4b5563",
                fontFamily:"Barlow,sans-serif",fontWeight:active?600:400,fontSize:14,
                marginBottom:3,transition:"all .12s",position:"relative",
              }}>
                {active&&<div style={{position:"absolute",left:0,top:"22%",bottom:"22%",width:3,borderRadius:2,background:O}}/>}
                <Icon size={15}/>
                {label}
                {badge&&<span style={{marginLeft:"auto",background:O,color:"#000",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{badge}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{borderTop:"1px solid #1c1c26",paddingTop:14,color:"#374151",fontSize:11,fontFamily:"Barlow,sans-serif"}}>
          © 2026 PneuControl
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <div>
            <h1 style={{fontFamily:"Bebas Neue",fontSize:34,color:"#f1f5f9",letterSpacing:"0.05em"}}>{pageMeta?.label}</h1>
            <p style={{color:"#374151",fontSize:12,fontFamily:"Barlow,sans-serif",marginTop:3}}>
              {new Date().toLocaleDateString("pt-BR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </p>
          </div>
        </div>

        {page==="dashboard"  && <Dashboard  sales={sales}  expenses={expenses}   purchases={purchases}/>}
        {page==="vendas"     && <Vendas      sales={sales}  setSales={setSales}/>}
        {page==="receber"    && <AReceber    sales={sales}  setSales={setSales}/>}
        {page==="estoque"    && <Estoque     purchases={purchases} setPurchases={setPurchases}/>}
        {page==="financeiro" && <Financeiro  sales={sales}  expenses={expenses}   purchases={purchases}/>}
        {page==="despesas"   && <Despesas    expenses={expenses}   setExpenses={setExpenses}/>}
      </main>
    </div>
  );
}
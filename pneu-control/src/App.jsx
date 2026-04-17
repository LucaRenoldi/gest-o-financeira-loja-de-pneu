import React, { useState, useMemo, useEffect, useCallback, Component} from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, ShoppingBag, CreditCard, Package,
  DollarSign, Tag, Plus, X, Check, TrendingUp, TrendingDown,
  Truck, Eye, Phone, MapPin, Loader2, WifiOff, Trash2
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ─────────────── Rede de Proteção (Error Boundary) ─────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erro capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', background: '#14151c', borderRadius: 12, border: '1px solid #ef4444', margin: 20 }}>
          <h2 style={{ color: '#ef4444', fontFamily: 'Bebas Neue', fontSize: 24 }}>Ops! Algo deu errado aqui.</h2>
          <p style={{ color: '#64748b', marginBottom: 20 }}>Ocorreu um erro nesta parte do sistema.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Recarregar Sistema
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
/* ─────────────── Estilos globais ─────────────── */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:#0d0e12}
  ::-webkit-scrollbar-thumb{background:#f97316;border-radius:2px}
  select option{background:#111115;color:#f1f5f9}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

const O="#f97316",G="#22c55e",R="#ef4444",B="#3b82f6",Y="#eab308",P="#a855f7";
const PC=["#f97316","#3b82f6","#22c55e","#eab308","#a855f7","#ec4899","#14b8a6","#f43f5e"];

const TIRE_SIZES=["165/70R13","175/65R14","185/60R14","185/65R15","195/55R15","195/60R15","195/65R15","205/55R16","205/60R16","215/55R17","215/60R17","225/45R17","225/55R17","235/55R18","245/45R18","255/35R18","265/60R18","265/65R17","275/55R20","285/35R19"];
const REGIONS=["Salvador","Lauro de Freitas","Camaçari","Simões Filho","Dias d'Ávila","São Francisco do Conde","Feira de Santana","Outras"];
const EXP_CATS=["Aluguel","Energia","Água","Internet","Funcionários","Frete","Embalagem","Manutenção","Alimentação","Transporte","Saúde","Lazer","Outros"];
const SUPPLIERS=["Bridgestone BR","Michelin Dist.","Goodyear SP","Continental MG","Pirelli RJ","JK Pneus","Pneus Mix"];
const BRANDS=["Bridgestone","Michelin","Goodyear","Continental","Pirelli","Firestone","Dunlop","Hankook","Yokohama","Westlake"];

const fmt   = v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const fmtD  = d=>new Date(d+"T00:00:00").toLocaleDateString("pt-BR");
const today = ()=>new Date().toISOString().split("T")[0];
const nowT  = ()=>new Date().toTimeString().slice(0,5);

/* ─────────────── Componentes base ─────────────── */
const inp={width:"100%",background:"#0d0e12",border:"1px solid #2d2d38",borderRadius:8,padding:"10px 14px",color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontSize:14,outline:"none"};
const btnS=(v="primary")=>({background:v==="primary"?O:"transparent",border:v==="primary"?"none":`1px solid ${O}`,color:v==="primary"?"#000":O,borderRadius:8,padding:"10px 22px",cursor:"pointer",fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:14});

function Label({children}){
  return <div style={{color:"#64748b",fontSize:11,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:6}}>{children}</div>;
}
function Field({label,children,span}){
  return <div style={{gridColumn:span?"1/-1":"auto"}}><Label>{label}</Label>{children}</div>;
}

/* ── Spinner de carregamento ── */
function Spinner({msg="Carregando..."}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:60}}>
      <Loader2 size={28} color={O} style={{animation:"spin 1s linear infinite"}}/>
      <span style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:14}}>{msg}</span>
    </div>
  );
}

/* ── Banner de erro de conexão ── */
function ErrorBanner({msg,onRetry}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#1c0a0a",border:"1px solid #7f1d1d",borderRadius:10,padding:"12px 18px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,color:"#fca5a5",fontFamily:"Barlow,sans-serif",fontSize:13}}>
        <WifiOff size={15}/> {msg}
      </div>
      <button onClick={onRetry} style={{...btnS("outline"),padding:"5px 14px",fontSize:12,borderColor:"#ef4444",color:"#ef4444"}}>Tentar novamente</button>
    </div>
  );
}

/* ── Toast de feedback ── */
function Toast({msg,type}){
  if(!msg)return null;
  const c=type==="error"?R:G;
  return(
    <div style={{position:"fixed",bottom:28,right:28,zIndex:2000,background:"#16171e",border:`1px solid ${c}`,borderRadius:10,padding:"12px 22px",color:c,fontFamily:"Barlow,sans-serif",fontSize:14,display:"flex",alignItems:"center",gap:8,animation:"fadeIn .2s ease"}}>
      {type==="error"?<X size={14}/>:<Check size={14}/>} {msg}
    </div>
  );
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

/* ─────────────── Hook Supabase ─────────────── */
function useSupabase(){
  const [sales,setSales]         = useState([]);
  const [purchases,setPurchases] = useState([]);
  const [expenses,setExpenses]   = useState([]);
  const [loading,setLoading]     = useState(true);
  const [error,setError]         = useState(null);
  const [toast,setToast]         = useState({msg:"",type:"success"});

  const showToast=(msg,type="success")=>{
    setToast({msg,type});
    setTimeout(()=>setToast({msg:"",type:"success"}),3000);
  };

  const fetchAll = useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const [s,p,e]=await Promise.all([
        supabase.from("sales").select("*").order("created_at",{ascending:false}),
        supabase.from("purchases").select("*").order("created_at",{ascending:false}),
        supabase.from("expenses").select("*").order("created_at",{ascending:false}),
      ]);
      if(s.error||p.error||e.error) throw new Error("Erro ao carregar dados");
      setSales(s.data||[]);
      setPurchases(p.data||[]);
      setExpenses(e.data||[]);
    }catch(err){
      setError("Não foi possível conectar ao banco de dados. Verifique sua conexão.");
    }finally{
      setLoading(false);
    }
  },[]);

  useEffect(()=>{fetchAll();},[fetchAll]);

  /* Realtime — sincroniza entre pc e celular automaticamente */
  useEffect(()=>{
    const ch=supabase.channel("realtime-all")
      .on("postgres_changes",{event:"*",schema:"public",table:"sales"},   ()=>fetchAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"purchases"},()=>fetchAll())
      .on("postgres_changes",{event:"*",schema:"public",table:"expenses"}, ()=>fetchAll())
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[fetchAll]);

  /* CRUD vendas */
  const addSale=async(data)=>{
    const{error:err}=await supabase.from("sales").insert([{
      date:data.date,time:data.time,
      client_name:data.clientName,client_phone:data.clientPhone,
      region:data.region,items:data.items,total:data.total,paid:data.paid,
    }]);
    if(err){showToast("Erro ao salvar venda","error");return false;}
    showToast("Venda salva com sucesso!");return true;
  };

  const markSalePaid=async(id)=>{
    const{error:err}=await supabase.from("sales").update({paid:true}).eq("id",id);
    if(err){showToast("Erro ao atualizar venda","error");return;}
    showToast("Venda marcada como recebida!");
  };

  /* CRUD compras */
  const addPurchase=async(data)=>{
    const totalQty=data.items.reduce((a,it)=>a+it.qty,0);
    const{error:err}=await supabase.from("purchases").insert([{
      order_number:data.orderNumber,brand:data.brand,
      date:data.date,supplier:data.supplier,
      items:data.items,total_qty:totalQty,total_cost:Number(data.totalCost),
    }]);
    if(err){showToast("Erro ao salvar pedido","error");return false;}
    showToast("Pedido salvo com sucesso!");return true;
  };

  /* CRUD despesas - Ajuste no value */
  const addExpense = async (data) => {
    const { error: err } = await supabase.from("expenses").insert([{
      date: data.date,
      time: data.time,
      category: data.category,
      tag: data.tag,
      description: data.description,
      value: parseFloat(data.value), // Use parseFloat aqui
      payee: data.payee,
    }]);
    if (err) { showToast("Erro ao salvar despesa", "error"); return false; }
    showToast("Despesa salva com sucesso!"); return true;
  };
  
  /* Deletar registros */
  const deleteItem = async (table, id) => {
    
    const { error: err } = await supabase.from(table).delete().eq("id", id);
    
    if (err) {
      showToast(`Erro ao excluir de ${table}`, "error");
      return false;
    }
    
    showToast("Excluído com sucesso!");
    return true;
  };

  /* Normaliza campos do banco → padrão do app */
  const normSales=useMemo(()=>sales.map(s=>({
    ...s,
    clientName:s.client_name,
    clientPhone:s.client_phone,
    paid:s.paid,
  })),[sales]);

  const normPurchases=useMemo(()=>purchases.map(p=>({
    ...p,
    orderNumber:p.order_number,
    totalQty:p.total_qty,
    totalCost:p.total_cost,
  })),[purchases]);

  return{
    sales:normSales,purchases:normPurchases,expenses,
    loading,error,toast,
    fetchAll,addSale,markSalePaid,addPurchase,addExpense,deleteItem
  };
}

/* ─────────────── Dashboard ─────────────── */
function buildDailyChart(sales,expenses){
  const days=Array.from({length:new Date().getDate()},(_,i)=>{
    const d=new Date(); d.setDate(i+1);
    return d.toISOString().split("T")[0];
  });
  const map={};
  days.forEach(k=>{const dd=k.slice(8,10)+"/"+k.slice(5,7);map[k]={label:dd,fat:0,desp:0};});
  sales.filter(s=>s.paid).forEach(s=>{if(map[s.date])map[s.date].fat+=Number(s.total);});
  expenses.forEach(e=>{if(map[e.date])map[e.date].desp+=Number(e.value);});
  return Object.values(map).map(d=>({...d,lucro:d.fat-d.desp}));
}

function Dashboard({sales,expenses,purchases}){
  const [period,setPeriod]=useState("mensal");
  const totalFat  =useMemo(()=>sales.filter(s=>s.paid).reduce((a,s)=>a+Number(s.total),0),[sales]);
  const totalDesp =useMemo(()=>expenses.reduce((a,e)=>a+Number(e.value),0),[expenses]);
  const totalRec  =useMemo(()=>sales.filter(s=>!s.paid).reduce((a,s)=>a+Number(s.total),0),[sales]);
  const chartData =useMemo(()=>buildDailyChart(sales,expenses),[sales,expenses]);

  const regionData=useMemo(()=>{
    const m={};sales.forEach(s=>{m[s.region]=(m[s.region]||0)+Number(s.total);});
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[sales]);

  const pieData=useMemo(()=>{
    const m={};expenses.forEach(e=>{m[e.category]=(m[e.category]||0)+Number(e.value);});
    return Object.entries(m).map(([name,value])=>({name,value}));
  },[expenses]);

  return(
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {["Diário","Semanal","Mensal","Anual"].map(p=>(
          <button key={p} onClick={()=>setPeriod(p.toLowerCase())} style={{
            padding:"7px 20px",borderRadius:20,border:"none",cursor:"pointer",
            background:period===p.toLowerCase()?O:"#14151c",
            color:period===p.toLowerCase()?"#000":"#64748b",
            fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:13,transition:"all .15s",
          }}>{p}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <KPI title="Faturamento"   value={fmt(totalFat)}                  sub="+12% vs anterior" up icon={TrendingUp} color={G}/>
        <KPI title="Despesas"      value={fmt(totalDesp)}                 sub="-3% vs anterior"  up icon={DollarSign} color={R}/>
        <KPI title="Lucro Líquido" value={fmt(totalFat-totalDesp)}        sub="+18% vs anterior" up icon={TrendingUp} color={O}/>
        <KPI title="A Receber"     value={fmt(totalRec)} sub={`${sales.filter(s=>!s.paid).length} em aberto`} icon={CreditCard} color={Y}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:24}}>
          <h3 style={{fontFamily:"Bebas Neue",fontSize:18,color:"#f1f5f9",letterSpacing:"0.06em",marginBottom:20}}>Faturamento · Despesas · Lucro</h3>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G} stopOpacity={.25}/><stop offset="95%" stopColor={G} stopOpacity={0}/></linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={R} stopOpacity={.25}/><stop offset="95%" stopColor={R} stopOpacity={0}/></linearGradient>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={O} stopOpacity={.25}/><stop offset="95%" stopColor={O} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28"/>
              <XAxis dataKey="label" tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#4b5563",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<ChartTip/>}/>
              <Legend wrapperStyle={{fontSize:12,fontFamily:"Barlow,sans-serif",paddingTop:10}}/>
              <Area type="monotone" dataKey="fat"   name="Faturamento" stroke={G} fill="url(#gF)" strokeWidth={2}/>
              <Area type="monotone" dataKey="desp"  name="Despesas"    stroke={R} fill="url(#gD)" strokeWidth={2}/>
              <Area type="monotone" dataKey="lucro" name="Lucro"       stroke={O} fill="url(#gL)" strokeWidth={2}/>
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
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px"}}>
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
                {regionData.map((_,i)=><Cell key={i} fill={PC[i%PC.length]}/>)}
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
            {label:"Pneus Comprados",value:purchases.reduce((a,p)=>a+(p.totalQty||0),0),unit:"unidades",color:O},
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

/* ─────────────── Vendas ─────────────── */
function Vendas({sales,addSale, deleteItem}){
  const empty={clientName:"",clientPhone:"",region:REGIONS[0],items:[{size:TIRE_SIZES[7],qty:1,unitPrice:""}],paid:true,date:today(),time:nowT()};
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(empty);
  const [saving,setSaving]=useState(false);

  const addItem =()=>setForm(f=>({...f,items:[...f.items,{size:TIRE_SIZES[7],qty:1,unitPrice:""}]}));
  const remItem =i=>setForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}));
  const updItem =(i,k,v)=>setForm(f=>{const it=[...f.items];it[i]={...it[i],[k]:k==="size"?v:Number(v)};return{...f,items:it};});
  const total   =form.items.reduce((a,it)=>a+(it.qty||0)*(it.unitPrice||0),0);

  const save = async () => {
    // Validação extra: nome, total e se há pelo menos 1 pneu com preço
    if (!form.clientName || total <= 0 || form.items.some(it => !it.unitPrice)) {
      showToast("Preencha o cliente e os valores dos pneus", "error");
      return;
    }
    setSaving(true);
    const ok = await addSale({ ...form, total });
    setSaving(false);
    if (ok) { setModal(false); setForm(empty); }
  };

  return(
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em"}}>Vendas</h2>
          <p style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13,marginTop:3}}>{sales.length} vendas registradas</p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btnS(),display:"flex",alignItems:"center",gap:8}}>
          <Plus size={15}/> Nova Venda
        </button>
      </div>

      <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:680}}>
          <thead>
            <tr style={{borderBottom:"1px solid #2d2d38"}}>
              {["Data/Hora","Cliente","Região","Pneus","Total","Status"].map(h=>(
                <th key={h} style={{padding:"13px 16px",textAlign:"left",color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map(s=>(
              <tr key={s.id} style={{borderBottom:"1px solid #1a1a22"}}
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
                  {(s.items||[]).map((it,j)=><div key={j} style={{color:"#94a3b8",fontSize:12,fontFamily:"Barlow,sans-serif"}}>{it.qty}× {it.size} · {fmt(it.unitPrice)}</div>)}
                </td>
                <td style={{padding:"13px 16px",color:O,fontFamily:"IBM Plex Mono",fontSize:15,fontWeight:500}}>{fmt(s.total)}</td>
                <td style={{padding:"13px 16px"}}>
                  <span style={{background:s.paid?"#14532d":"#422006",color:s.paid?"#4ade80":"#fb923c",fontSize:11,padding:"4px 12px",borderRadius:12,fontFamily:"Barlow,sans-serif",fontWeight:600}}>
                    {s.paid?"Pago":"Fiado"}
                  </span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <button 
                    onClick={() => deleteItem("sales", s.id, s.clientName)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                    onMouseEnter={e => e.currentTarget.style.color = R}
                    onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length===0&&<div style={{padding:48,textAlign:"center",color:"#374151",fontFamily:"Barlow,sans-serif"}}>Nenhuma venda registrada ainda.</div>}
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
              <select style={inp} value={it.size} onChange={e=>updItem(i,"size",e.target.value)}>{TIRE_SIZES.map(s=><option key={s}>{s}</option>)}</select>
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
          <button onClick={save} disabled={saving} style={{...btnS(),display:"flex",alignItems:"center",gap:8,opacity:saving?.7:1}}>
            {saving?<><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>Salvando...</>:"Salvar Venda"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────── A Receber ─────────────── */
function AReceber({sales,markSalePaid}){
  const fiado=sales.filter(s=>!s.paid);
  const total=fiado.reduce((a,s)=>a+Number(s.total),0);
  const [loading,setLoading]=useState(null);

  const mark=async(id)=>{
    setLoading(id);
    await markSalePaid(id);
    setLoading(null);
  };

  return(
    <div style={{animation:"fadeIn .3s ease"}}>
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
          <div key={s.id} style={{background:"#14151c",border:`1px solid ${Y}35`,borderRadius:12,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              <div>
                <div style={{color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:16}}>{s.clientName}</div>
                <div style={{color:"#4b5563",fontSize:13,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                  <Phone size={11}/>{s.clientPhone}&nbsp;·&nbsp;<MapPin size={11}/>{s.region}
                </div>
                <div style={{color:"#374151",fontSize:11,fontFamily:"IBM Plex Mono",marginTop:4}}>{fmtD(s.date)} às {s.time}</div>
              </div>
              <div>{(s.items||[]).map((it,j)=><div key={j} style={{color:"#94a3b8",fontSize:13,fontFamily:"Barlow,sans-serif"}}>{it.qty}× {it.size} · {fmt(it.unitPrice)}/un</div>)}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:18,flexShrink:0}}>
              <span style={{color:Y,fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:500}}>{fmt(s.total)}</span>
              <button onClick={()=>mark(s.id)} disabled={loading===s.id} style={{...btnS(),display:"flex",alignItems:"center",gap:6,padding:"9px 18px",opacity:loading===s.id?.7:1}}>
                {loading===s.id?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<Check size={14}/>} Recebido
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Estoque ─────────────── */
function Estoque({purchases,addPurchase, deleteItem}){
  const emptyF={orderNumber:"",brand:BRANDS[0],date:today(),supplier:SUPPLIERS[0],totalCost:"",items:[{size:TIRE_SIZES[7],qty:4}]};
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(emptyF);
  const [saving,setSaving]=useState(false);

  const addItem =()=>setForm(f=>({...f,items:[...f.items,{size:TIRE_SIZES[7],qty:4}]}));
  const updItem =(i,k,v)=>setForm(f=>{const it=[...f.items];it[i]={...it[i],[k]:k==="size"?v:Number(v)};return{...f,items:it};});

  const save=async()=>{
    if(!form.orderNumber)return;
    setSaving(true);
    const ok=await addPurchase(form);
    setSaving(false);
    if(ok){setModal(false);setForm(emptyF);}
  };

  return(
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em"}}>Estoque / Compras</h2>
          <p style={{color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13,marginTop:3}}>{purchases.length} pedidos · {purchases.reduce((a,p)=>a+(p.totalQty||0),0)} pneus comprados</p>
        </div>
        <button onClick={()=>setModal(true)} style={{...btnS(),display:"flex",alignItems:"center",gap:8}}>
          <Plus size={15}/> Novo Pedido
        </button>
      </div>
      <div style={{display:"grid",gap:12}}>
        {purchases.map(p=>(
          <div key={p.id} style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:"18px 22px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"Bebas Neue",fontSize:18,color:O,letterSpacing:"0.06em"}}>#{p.orderNumber}</span>
                  <span style={{background:"#1e2a3a",color:"#60a5fa",fontSize:11,padding:"2px 10px",borderRadius:10,fontFamily:"Barlow,sans-serif"}}>{p.brand}</span>
                  <span style={{color:"#4b5563",fontSize:12,fontFamily:"IBM Plex Mono"}}>{fmtD(p.date)}</span>
                </div>
                <div style={{color:"#64748b",fontSize:13,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <Truck size={13}/> {p.supplier}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {(p.items||[]).map((it,i)=>(
                    <span key={i} style={{background:"#0d0e12",color:"#94a3b8",fontSize:12,padding:"4px 12px",borderRadius:8,fontFamily:"IBM Plex Mono",border:"1px solid #2d2d38"}}>
                      {it.qty}× {it.size}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:O,fontFamily:"IBM Plex Mono",fontSize:22,fontWeight:500}}>{fmt(p.totalCost)}</div>
                <div style={{color:"#4b5563",fontSize:12,fontFamily:"Barlow,sans-serif",marginTop:4}}>{p.totalQty} pneus no total</div>
                <button 
                  onClick={() => deleteItem("purchases", p.id, `Pedido #${p.orderNumber}`)}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    color: "#374151", 
                    marginTop: 12,
                    padding: "4px",
                    transition: "color .2s" 
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={e => e.currentTarget.style.color = "#374151"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {purchases.length===0&&<div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,padding:48,textAlign:"center",color:"#374151",fontFamily:"Barlow,sans-serif"}}>Nenhum pedido registrado ainda.</div>}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Novo Pedido de Compra">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
          <Field label="Nº do Pedido"><input style={inp} value={form.orderNumber} onChange={e=>setForm(f=>({...f,orderNumber:e.target.value}))} placeholder="PED-005"/></Field>
          <Field label="Marca"><select style={inp} value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}>{BRANDS.map(b=><option key={b}>{b}</option>)}</select></Field>
          <Field label="Fornecedor"><select style={inp} value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))}>{SUPPLIERS.map(s=><option key={s}>{s}</option>)}</select></Field>
          <Field label="Data do Pedido"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Valor Total (R$)" span><input style={inp} type="number" min="0" step="0.01" value={form.totalCost||""} onChange={e=>setForm(f=>({...f,totalCost:e.target.value}))} placeholder="0,00"/></Field>
        </div>
        <div style={{borderTop:"1px solid #2d2d38",paddingTop:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <Label>Pneus do Pedido</Label>
            <button onClick={addItem} style={{...btnS("outline"),padding:"5px 12px",fontSize:12,display:"flex",alignItems:"center",gap:4}}><Plus size={12}/> Adicionar</button>
          </div>
          {form.items.map((it,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 90px",gap:8,marginBottom:8}}>
              <select style={inp} value={it.size} onChange={e=>updItem(i,"size",e.target.value)}>{TIRE_SIZES.map(s=><option key={s}>{s}</option>)}</select>
              <input style={{...inp,textAlign:"center"}} type="number" min="1" value={it.qty} onChange={e=>updItem(i,"qty",e.target.value)} placeholder="Qtd"/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <button onClick={()=>setModal(false)} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{...btnS(),display:"flex",alignItems:"center",gap:8,opacity:saving?.7:1}}>
            {saving?<><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>Salvando...</>:"Salvar Pedido"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────── Financeiro ─────────────── */
function Financeiro({sales,expenses,purchases}){
  const [detail,setDetail]=useState(null);
  const totalFat  =sales.filter(s=>s.paid).reduce((a,s)=>a+Number(s.total),0);
  const totalDesp =expenses.reduce((a,e)=>a+Number(e.value),0);
  const totalComp =purchases.reduce((a,p)=>a+Number(p.totalCost),0);
  const totalRec  =sales.filter(s=>!s.paid).reduce((a,s)=>a+Number(s.total),0);

  const cards=[
    {label:"Faturamento",    value:totalFat,           color:G, items:sales.filter(s=>s.paid).map(s=>({date:s.date,time:s.time,desc:`Venda — ${s.clientName}`,cat:"Vendas",tag:"venda",value:s.total}))},
    {label:"Despesas",       value:totalDesp,           color:R, items:expenses.map(e=>({date:e.date,time:e.time,desc:e.description,cat:e.category,tag:e.tag,value:e.value}))},
    {label:"Compras/Estoque",value:totalComp,           color:B, items:purchases.map(p=>({date:p.date,time:"—",desc:`${p.brand} · ${p.orderNumber}`,cat:"Estoque",tag:"empresa",value:p.totalCost}))},
    {label:"Lucro Estimado", value:totalFat-totalDesp-totalComp, color:O, items:[]},
    {label:"A Receber",      value:totalRec,            color:Y, items:sales.filter(s=>!s.paid).map(s=>({date:s.date,time:s.time,desc:`Fiado — ${s.clientName}`,cat:"Vendas",tag:"fiado",value:s.total}))},
    {label:"Divida Ativa",    value:totalRec,            color:R, items:sales.filter(s=>!s.paid).map(s=>({date:s.date,time:s.time,desc:`Débito — ${s.clientName}`,cat:"Vendas",tag:"atrasado",value:s.total}))},
  ];

  return(
    <div style={{animation:"fadeIn .3s ease"}}>
      <h2 style={{fontFamily:"Bebas Neue",fontSize:30,color:"#f1f5f9",letterSpacing:"0.05em",marginBottom:24}}>Financeiro</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        {cards.map(c=>(
          <div key={c.label} onClick={()=>c.items.length>0&&setDetail(c)}
            style={{background:"#14151c",border:`1px solid ${c.color}28`,borderRadius:12,padding:"22px 24px",cursor:c.items.length>0?"pointer":"default",transition:"border-color .15s",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>{if(c.items.length>0)e.currentTarget.style.borderColor=`${c.color}60`;}}
            onMouseLeave={e=>e.currentTarget.style.borderColor=`${c.color}28`}>
            <div style={{position:"absolute",top:-28,right:-28,width:90,height:90,borderRadius:"50%",background:`${c.color}08`}}/>
            <div style={{color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>{c.label}</div>
            <div style={{color:c.color,fontFamily:"IBM Plex Mono",fontSize:24,fontWeight:500,marginBottom:8}}>{fmt(c.value)}</div>
            {c.items.length>0&&<div style={{color:"#4b5563",fontSize:12,fontFamily:"Barlow,sans-serif",display:"flex",alignItems:"center",gap:4}}><Eye size={12}/> Ver detalhes ({c.items.length})</div>}
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
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{color:"#4b5563",fontSize:11,fontFamily:"IBM Plex Mono"}}>{fmtD(d.date)} {d.time}</span>
                      <span style={{background:"#1e2a3a",color:"#60a5fa",fontSize:11,padding:"1px 8px",borderRadius:8,fontFamily:"Barlow,sans-serif"}}>{d.cat}</span>
                      <span style={{background:d.tag==="pessoal"?"#2a1a33":"#1e2a3a",color:d.tag==="pessoal"?P:B,fontSize:11,padding:"1px 8px",borderRadius:8,fontFamily:"Barlow,sans-serif"}}>{d.tag}</span>
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

/* ─────────────── Despesas ─────────────── */
function Despesas({expenses,addExpense, deleteItem}){
  const emptyF={category:EXP_CATS[0],tag:"empresa",description:"",value:"",payee:"",date:today(),time:nowT()};
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState("todos");
  const [form,setForm]=useState(emptyF);
  const [saving,setSaving]=useState(false);

  const filtered=filter==="todos"?expenses:expenses.filter(e=>e.tag===filter);
  const totalE=expenses.filter(e=>e.tag==="empresa").reduce((a,e)=>a+Number(e.value),0);
  const totalP=expenses.filter(e=>e.tag==="pessoal").reduce((a,e)=>a+Number(e.value),0);

  const save=async()=>{
    if(!form.description||!form.value)return;
    setSaving(true);
    const ok=await addExpense(form);
    setSaving(false);
    if(ok){setModal(false);setForm(emptyF);}
  };

  return(
    <div style={{animation:"fadeIn .3s ease"}}>
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
        {[{k:"todos",label:"Todos",bg:O},{k:"empresa",label:"Empresa",bg:R},{k:"pessoal",label:"Pessoal",bg:P}].map(t=>(
          <button key={t.k} onClick={()=>setFilter(t.k)} style={{padding:"7px 18px",borderRadius:20,border:"none",cursor:"pointer",background:filter===t.k?t.bg:"#14151c",color:filter===t.k?"#fff":"#64748b",fontFamily:"Barlow,sans-serif",fontWeight:600,fontSize:13,transition:"all .15s"}}>{t.label}</button>
        ))}
      </div>

      <div style={{background:"#14151c",border:"1px solid #2d2d38",borderRadius:12,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
          <thead>
            <tr style={{borderBottom:"1px solid #2d2d38"}}>
              {["Data/Hora","Categoria","Descrição","Onde/Fornecedor","Tag","Valor"].map(h=>(
                <th key={h} style={{padding:"13px 16px",textAlign:"left",color:"#4b5563",fontSize:10,fontFamily:"Barlow,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.09em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} style={{borderBottom:"1px solid #1a1a22"}}
                onMouseEnter={ev=>ev.currentTarget.style.background="#1c1d24"}
                onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                <td style={{padding:"13px 16px",color:"#4b5563",fontSize:11,fontFamily:"IBM Plex Mono"}}>{fmtD(item.date)}<br/>{item.time}</td>
                <td style={{padding:"13px 16px"}}><span style={{background:"#1e2a3a",color:"#60a5fa",fontSize:11,padding:"3px 10px",borderRadius:10,fontFamily:"Barlow,sans-serif"}}>{item.category}</span></td>
                <td style={{padding:"13px 16px",color:"#f1f5f9",fontFamily:"Barlow,sans-serif",fontSize:14}}>{item.description}</td>
                <td style={{padding:"13px 16px",color:"#64748b",fontFamily:"Barlow,sans-serif",fontSize:13}}>{item.payee}</td>
                <td style={{padding:"13px 16px"}}>
                  <span style={{background:item.tag==="pessoal"?"#2a1a33":"#1e2a3a",color:item.tag==="pessoal"?P:B,fontSize:11,padding:"3px 10px",borderRadius:10,fontFamily:"Barlow,sans-serif",fontWeight:600}}>{item.tag}</span>
                </td>
                <td style={{padding:"13px 16px",color:R,fontFamily:"IBM Plex Mono",fontSize:14,fontWeight:500}}>-{fmt(item.value)}</td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}>
                  <button 
                    onClick={() => deleteItem("expenses", item.id, item.description)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0&&<div style={{padding:48,textAlign:"center",color:"#374151",fontFamily:"Barlow,sans-serif"}}>Nenhuma despesa registrada ainda.</div>}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nova Despesa">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Field label="Categoria"><select style={inp} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
          <Field label="Tag">
            <select style={inp} value={form.tag} onChange={e=>setForm(f=>({...f,tag:e.target.value}))}>
              <option value="empresa">Empresa</option>
              <option value="pessoal">Pessoal</option>
            </select>
          </Field>
          <Field label="Descrição" span><input style={inp} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Ex: Conta de luz Abril"/></Field>
          <Field label="Onde / Fornecedor"><input style={inp} value={form.payee} onChange={e=>setForm(f=>({...f,payee:e.target.value}))} placeholder="Ex: Coelba"/></Field>
          <Field label="Valor (R$)"><input style={inp} type="number" min="0" step="0.01" value={form.value||""} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder="0,00"/></Field>
          <Field label="Data"><input style={inp} type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          <Field label="Hora"><input style={inp} type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
          <button onClick={()=>setModal(false)} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{...btnS(),display:"flex",alignItems:"center",gap:8,opacity:saving?.7:1}}>
            {saving?<><Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>Salvando...</>:"Salvar Despesa"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────── Nav ─────────────── */
const NAV=[
  {id:"dashboard", label:"Dashboard",  icon:LayoutDashboard},
  {id:"vendas",    label:"Vendas",      icon:ShoppingBag},
  {id:"receber",   label:"A Receber",   icon:CreditCard},
  {id:"estoque",   label:"Estoque",     icon:Package},
  {id:"financeiro",label:"Financeiro",  icon:DollarSign},
  {id:"despesas",  label:"Despesas",    icon:Tag},
];

/* ─────────────── App Principal ─────────────── */
export default function App(){
  const [page,setPage]=useState("dashboard");
  const [confirm, setConfirm] = useState({ open: false, table: "", id: "", title: "" });

  const requestDelete = (table, id, title) => {
    setConfirm({ open: true, table, id, title });
  };

  // Função que o modal chama ao clicar em "Sim, Excluir"
  const handleConfirmDelete = async () => {
    const ok = await deleteItem(confirm.table, confirm.id);
    if (ok) setConfirm({ ...confirm, open: false });
  };

  const {
    sales,purchases,expenses,
    loading,error,toast,
    fetchAll,addSale,markSalePaid,addPurchase,addExpense,deleteItem,
  }=useSupabase();

  const fiadoN=sales.filter(s=>!s.paid).length;

  return(
    <div style={{display:"flex",height:"100vh",background:"#0d0e12",fontFamily:"Barlow,sans-serif",overflow:"hidden"}}>
      <style>{FONTS}</style>

      {/* Sidebar */}
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
                <Icon size={15}/>{label}
                {badge&&<span style={{marginLeft:"auto",background:O,color:"#000",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{borderTop:"1px solid #1c1c26",paddingTop:14,color:"#374151",fontSize:11,fontFamily:"Barlow,sans-serif"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:error?"#ef4444":"#22c55e"}}/>
            {error?"Sem conexão":"Conectado"}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <div>
            <h1 style={{fontFamily:"Bebas Neue",fontSize:34,color:"#f1f5f9",letterSpacing:"0.05em"}}>{NAV.find(n=>n.id===page)?.label}</h1>
            <p style={{color:"#374151",fontSize:12,fontFamily:"Barlow,sans-serif",marginTop:3}}>
              {new Date().toLocaleDateString("pt-BR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </p>
          </div>
        </div>

        {error&&<ErrorBanner msg={error} onRetry={fetchAll}/>}

        {loading
          ? <Spinner msg="Carregando dados do servidor..."/>
          : <ErrorBoundary>
              {page==="dashboard"  &&<Dashboard  sales={sales} expenses={expenses} purchases={purchases}/>}
              {page==="vendas"     &&<Vendas     sales={sales} addSale={addSale} deleteItem={requestDelete}/>}
              {page==="receber"    &&<AReceber   sales={sales} markSalePaid={markSalePaid}/>}
              {page==="estoque"    &&<Estoque    purchases={purchases} addPurchase={addPurchase} deleteItem={requestDelete}/>}
              {page==="financeiro" &&<Financeiro sales={sales} expenses={expenses} purchases={purchases}/>}
              {page==="despesas"   &&<Despesas   expenses={expenses} addExpense={addExpense} deleteItem={requestDelete}/>}
            </ErrorBoundary>
        }
      </main>

      <Toast msg={toast.msg} type={toast.type}/>

      <ConfirmModal 
        open={confirm.open} 
        onClose={() => setConfirm({ ...confirm, open: false })}
        onConfirm={handleConfirmDelete}
        title={confirm.title}
      />
    </div>
  );
}

/* ─────────────── Componente do Modal de Confirmação ─────────────── */
function ConfirmModal({ open, onClose, onConfirm, title }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmar Exclusão">
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ 
          background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", 
          width: 60, height: 60, borderRadius: "50%", 
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"
        }}>
          <Trash2 size={30} />
        </div>
        <p style={{ color: "#f1f5f9", fontSize: 16, marginBottom: 8, fontFamily: "Barlow, sans-serif" }}>
          Tem certeza que deseja excluir?
        </p>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          Esta ação não poderá ser desfeita: <br/>
          <strong style={{ color: "#94a3b8" }}>{title}</strong>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onClose} style={btnS("outline")}>Cancelar</button>
          <button 
            onClick={onConfirm} 
            style={{ ...btnS(), background: "#ef4444", borderColor: "#ef4444" }}
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}
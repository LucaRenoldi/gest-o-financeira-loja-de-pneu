import React, { useState, useMemo, useEffect, useCallback, Component } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList
} from "recharts";
import {
  LayoutDashboard, ShoppingBag, CreditCard, Package,
  DollarSign, Tag, Plus, X, Check, TrendingUp, TrendingDown,
  Truck, Eye, Phone, MapPin, Loader2, WifiOff, Trash2, Search, Pencil
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

const O = "#f97316", G = "#22c55e", R = "#ef4444", B = "#3b82f6", Y = "#eab308", P = "#a855f7";
const PC = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#14b8a6", "#f43f5e"];

const TIRE_SIZES = [
  // --- CARGA / CAMINHÃO (Os que você mais usa) ---
  "295/80 R22.5", "275/80 R22.5", "215/75 R17.5", "235/75 R17.5",
  "11.00 R22", "10.00 R20", "315/80 R22.5", "255/70 R22.5",

  // --- CAMINHONETE / SUV / VAN ---
  "265/70 R16", "235/75 R15", "31x10.5 R15", "205/75 R16C",
  "225/75 R16C", "215/80 R16", "245/70 R16", "265/60 R18",

  // --- PASSEIO (Populares) ---
  "175/70 R13", "175/75 R13", "175/65 R14", "175/70 R14", "175/75 R14", "185/60 R14", "185/70 R14", "185/65 R14",
  "185/60 R15", "185/65 R15", "195/50 R15", "195/55 R15",
  "195/60 R15", "195/65 R15", "205/55 R16", "205/60 R16",
  "215/50 R17", "225/45 R17", "225/50 R17", "235/45 R18"
].sort(); // O .sort() coloca em ordem alfabética/numérica automaticamente
const REGIONS = ["Salvador", "Lauro de Freitas", "Camaçari", "Simões Filho", "Dias d'Ávila", "São Francisco do Conde", "Feira de Santana", "Outras"];
const EXP_CATS = ["Aluguel", "Energia", "Água", "Internet", "Funcionários", "Frete", "Embalagem", "Manutenção", "Alimentação", "Transporte", "Saúde", "Lazer", "Outros"];
const SUPPLIERS = ["Bridgestone BR", "Michelin Dist.", "Goodyear SP", "Continental MG", "Pirelli RJ", "JK Pneus", "Pneus Mix"];
const BRANDS = ["Bridgestone", "Michelin", "Goodyear", "Continental", "Pirelli", "Firestone", "Dunlop", "Hankook", "Yokohama", "Westlake"];

const fmt = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtD = d => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
const today = () => new Date().toISOString().split("T")[0];
const nowT = () => new Date().toTimeString().slice(0, 5);

/* ─────────────── Componentes base ─────────────── */
const inp = { width: "100%", background: "#0d0e12", border: "1px solid #2d2d38", borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontFamily: "Barlow,sans-serif", fontSize: 14, outline: "none" };
const btnS = (v = "primary") => ({ background: v === "primary" ? O : "transparent", border: v === "primary" ? "none" : `1px solid ${O}`, color: v === "primary" ? "#000" : O, borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontFamily: "Barlow,sans-serif", fontWeight: 600, fontSize: 14 });

function Label({ children }) {
  return <div style={{ color: "#64748b", fontSize: 11, fontFamily: "Barlow,sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>{children}</div>;
}
function Field({ label, children, span }) {
  return <div style={{ gridColumn: span ? "1/-1" : "auto" }}><Label>{label}</Label>{children}</div>;
}

function ComboInput({ value, onChange, options, placeholder, onAddNew }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const ref = React.useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = options.some(o => o.toLowerCase() === query.toLowerCase());
  const showAdd = onAddNew && query.trim() && !exactMatch;

  const select = (opt) => { setQuery(opt); onChange(opt); setOpen(false); };

  const handleAdd = () => {
    const trimmed = query.trim();
    onAddNew(trimmed);
    onChange(trimmed);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        style={inp}
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === "Enter" && showAdd) handleAdd(); if (e.key === "Escape") setOpen(false); }}
      />
      {open && (filtered.length > 0 || showAdd) && (
        <div style={{
          position: "absolute", top: "110%", left: 0, right: 0,
          background: "#1a1b26", border: "1px solid #2d2d38", borderRadius: 8,
          zIndex: 200, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", padding: 4
        }}>
          {filtered.map((opt, i) => (
            <div key={i} onClick={() => select(opt)} style={{
              padding: "10px 12px", color: "#f1f5f9", fontSize: 13,
              cursor: "pointer", borderRadius: 6, transition: "background .15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#2d2d38"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >{opt}</div>
          ))}

          {/* Opção de adicionar novo */}
          {showAdd && (
            <>
              {filtered.length > 0 && <div style={{ borderTop: "1px solid #2d2d38", margin: "4px 0" }} />}
              <div onClick={handleAdd} style={{
                padding: "10px 12px", color: O, fontSize: 13,
                cursor: "pointer", borderRadius: 6, transition: "background .15s",
                display: "flex", alignItems: "center", gap: 8
              }}
                onMouseEnter={e => e.currentTarget.style.background = `${O}15`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Plus size={13} />
                Adicionar "<strong>{query.trim()}</strong>"
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Spinner de carregamento ── */
function Spinner({ msg = "Carregando..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 60 }}>
      <Loader2 size={28} color={O} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 14 }}>{msg}</span>
    </div>
  );
}

/* ── Banner de erro de conexão ── */
function ErrorBanner({ msg, onRetry }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fca5a5", fontFamily: "Barlow,sans-serif", fontSize: 13 }}>
        <WifiOff size={15} /> {msg}
      </div>
      <button onClick={onRetry} style={{ ...btnS("outline"), padding: "5px 14px", fontSize: 12, borderColor: "#ef4444", color: "#ef4444" }}>Tentar novamente</button>
    </div>
  );
}

/* ── Toast de feedback ── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const c = type === "error" ? R : G;
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 2000, background: "#16171e", border: `1px solid ${c}`, borderRadius: 10, padding: "12px 22px", color: c, fontFamily: "Barlow,sans-serif", fontSize: 14, display: "flex", alignItems: "center", gap: 8, animation: "fadeIn .2s ease" }}>
      {type === "error" ? <X size={14} /> : <Check size={14} />} {msg}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#16171e", border: "1px solid #2d2d38", borderRadius: 16, padding: 32, width: "92%", maxWidth: 620, maxHeight: "88vh", overflowY: "auto", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Bebas Neue", fontSize: 26, color: O, letterSpacing: "0.06em" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KPI({ title, value, sub, up, icon: Icon, color }) {
  return (
    <div style={{ background: "#14151c", border: `1px solid ${color}28`, borderRadius: 12, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -24, right: -24, width: 88, height: 88, borderRadius: "50%", background: `${color}10` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ color: "#64748b", fontSize: 11, fontFamily: "Barlow,sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em" }}>{title}</span>
        <div style={{ background: `${color}18`, borderRadius: 8, padding: "6px 8px", display: "flex" }}><Icon size={15} color={color} /></div>
      </div>
      <div style={{ fontFamily: "IBM Plex Mono", fontSize: 22, fontWeight: 500, color: "#f1f5f9", marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ color: up ? G : R, fontSize: 12, fontFamily: "Barlow,sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{sub}
      </div>}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#16171e", border: "1px solid #2d2d38", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: "#94a3b8", fontSize: 11, fontFamily: "Barlow,sans-serif", marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontSize: 12, fontFamily: "IBM Plex Mono", margin: "2px 0" }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
}

/* ─────────────── Hook Supabase ─────────────── */
function useSupabase() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [lists, setLists] = useState({ regions: [], tireSizes: [], brands: [], suppliers: [] });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, e, l] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("purchases").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("created_at", { ascending: false }),
        supabase.from("list").select("*") // Busca a nova tabela de linhas
      ]);

      if (s.error || p.error || e.error || l.error) throw new Error("Erro ao carregar dados");

      setSales(s.data || []);
      setPurchases(p.data || []);
      setExpenses(e.data || []);

      // Como agora cada item é uma linha, filtramos pelo campo 'type'
      if (l.data) {
        setLists({
          regions: l.data.filter(i => i.type === 'region').map(i => i.value).sort(),
          tireSizes: l.data.filter(i => i.type === 'tire_size').map(i => i.value).sort(),
          brands: l.data.filter(i => i.type === 'brand').map(i => i.value).sort(),
          suppliers: l.data.filter(i => i.type === 'supplier').map(i => i.value).sort(),
        });
      }
    } catch (err) {
      setError("Não foi possível conectar ao banco de dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };


  // Função para persistir novos itens (Regiões, Marcas, etc.)
  const addToList = async (value, type) => {
    const { error: err } = await supabase.from("list").insert([{ value, type }]);
    if (err) {
      console.error("Erro ao salvar:", err);
      return;
    }
    // Recarrega os dados para que a nova opção apareça imediatamente
    await fetchAll();
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Realtime — sincroniza entre pc e celular automaticamente */
  useEffect(() => {
    const ch = supabase.channel("realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => fetchAll())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchAll]);

  /* CRUD vendas */
  const addSale = async (data) => {
    const { error: err } = await supabase.from("sales").insert([{
      date: data.date, time: data.time,
      client_name: data.clientName, client_phone: data.clientPhone,
      region: data.region, items: data.items, total: data.total, paid: data.paid,
    }]);
    if (err) { showToast("Erro ao salvar venda", "error"); return false; }
    await fetchAll();
    showToast("Venda salva com sucesso!"); return true;
  };

  const markSalePaid = async (id) => {
    const { error: err } = await supabase.from("sales").update({ paid: true }).eq("id", id);
    if (err) { showToast("Erro ao atualizar venda", "error"); return; }
    showToast("Venda marcada como recebida!");
  };

  /* CRUD compras */
  const addPurchase = async (data) => {
    const totalQty = data.items.reduce((a, it) => a + it.qty, 0);
    const { error: err } = await supabase.from("purchases").insert([{
      order_number: data.orderNumber, brand: data.brand,
      date: data.date, supplier: data.supplier,
      items: data.items, total_qty: totalQty, total_cost: Number(data.totalCost),
    }]);
    if (err) { showToast("Erro ao salvar pedido", "error"); return false; }
    showToast("Pedido salvo com sucesso!"); return true;
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
  const normSales = useMemo(() => sales.map(s => ({
    ...s,
    clientName: s.client_name,
    clientPhone: s.client_phone,
    paid: s.paid,
  })), [sales]);

  const normPurchases = useMemo(() => purchases.map(p => ({
    ...p,
    orderNumber: p.order_number,
    totalQty: p.total_qty,
    totalCost: p.total_cost,
  })), [purchases]);

  const updateSale = async (id, data) => {
    const { error: err } = await supabase.from("sales").update({
      date: data.date,
      time: data.time,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      region: data.region,
      items: data.items,
      total: Number(data.total),
      paid: data.paid,
    }).eq("id", id);
    if (err) { showToast("Erro ao atualizar venda: " + err.message, "error"); return false; }
    await fetchAll(); // ← força re-fetch imediato
    showToast("Venda atualizada!"); return true;
  };

  const updatePurchase = async (id, data) => {
    const { error: err } = await supabase.from("purchases").update({
      order_number: data.orderNumber, brand: data.brand,
      date: data.date, supplier: data.supplier, items: data.items,
      total_qty: data.totalQty, total_cost: data.totalCost,
    }).eq("id", id);
    if (err) { showToast("Erro ao atualizar pedido", "error"); return false; }
    showToast("Pedido atualizado!"); return true;
  };

  const updateExpense = async (id, data) => {
    const { error: err } = await supabase.from("expenses").update({
      date: data.date, time: data.time, category: data.category,
      tag: data.tag, description: data.description,
      value: parseFloat(data.value), payee: data.payee,
    }).eq("id", id);
    if (err) { showToast("Erro ao atualizar despesa", "error"); return false; }
    showToast("Despesa atualizada!"); return true;
  };

  return {
    sales: normSales, // MUDANÇA: Agora passamos a lista já com clientName
    purchases: normPurchases, // MUDANÇA: Agora passamos com orderNumber, etc.
    expenses,
    lists,
    loading, error, toast,
    fetchAll, addSale, markSalePaid, addPurchase, addExpense, deleteItem,
    updateSale, updatePurchase, updateExpense, addToList
  };
}

/* ─────────────── Dashboard ─────────────── */
function buildDailyChart(sales, expenses) {
  const days = Array.from({ length: new Date().getDate() }, (_, i) => {
    const d = new Date(); d.setDate(i + 1);
    return d.toISOString().split("T")[0];
  });
  const map = {};
  days.forEach(k => { const dd = k.slice(8, 10) + "/" + k.slice(5, 7); map[k] = { label: dd, fat: 0, desp: 0 }; });
  sales.filter(s => s.paid).forEach(s => { if (map[s.date]) map[s.date].fat += Number(s.total); });
  expenses.forEach(e => { if (map[e.date]) map[e.date].desp += Number(e.value); });
  return Object.values(map).map(d => ({ ...d, lucro: d.fat - d.desp }));
}

function Dashboard({ sales, expenses, purchases }) {
  const [period, setPeriod] = useState("mensal");

  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ef4444', '#06b6d4'];

  // Filtro inteligente que observa o botão clicado
  const filteredData = useMemo(() => {
    const hoje = new Date();

    // TRAVA DE SEGURANÇA: Se sales ou expenses não existirem, retorna listas vazias
    const safeSales = sales || [];
    const safeExpenses = expenses || [];

    const filtrarPorData = (item) => {
      if (!item || !item.date) return false; // Evita erro se o item estiver incompleto

      const dataItemStr = item.date;
      const hojeStr = hoje.toISOString().split('T')[0];

      if (period === "diário") {
        return dataItemStr === hojeStr;
      }

      const [year, month, day] = dataItemStr.split('-').map(Number);
      const dataItem = new Date(year, month - 1, day);

      if (period === "semanal") {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(hoje.getDate() - 7);
        umaSemanaAtras.setHours(0, 0, 0, 0);
        return dataItem >= umaSemanaAtras;
      }
      if (period === "mensal") {
        return dataItem.getMonth() === hoje.getMonth() && dataItem.getFullYear() === hoje.getFullYear();
      }
      if (period === "anual") {
        return dataItem.getFullYear() === hoje.getFullYear();
      }
      return true;
    };

    return {
      // Usamos as versões "safe" (seguras) aqui
      sales: safeSales.filter(filtrarPorData),
      expenses: safeExpenses.filter(filtrarPorData)
    };
  }, [sales, expenses, period]);

  const prevFilteredData = useMemo(() => {
    const hoje = new Date();
    const safeSales = sales || [];
    const safeExpenses = expenses || [];

    const filtrarPeriodoAnterior = (item) => {
      if (!item?.date) return false;
      const [y, m, d] = item.date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);

      if (period === "diário") {
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        return dt.toDateString() === ontem.toDateString();
      }
      if (period === "semanal") {
        const ini = new Date(hoje); ini.setDate(hoje.getDate() - 14); ini.setHours(0, 0, 0, 0);
        const fim = new Date(hoje); fim.setDate(hoje.getDate() - 8); fim.setHours(23, 59, 59, 999);
        return dt >= ini && dt <= fim;
      }
      if (period === "mensal") {
        const prev = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        return dt.getMonth() === prev.getMonth() && dt.getFullYear() === prev.getFullYear();
      }
      if (period === "anual") {
        return dt.getFullYear() === hoje.getFullYear() - 1;
      }
      return false;
    };

    return {
      sales: safeSales.filter(filtrarPeriodoAnterior),
      expenses: safeExpenses.filter(filtrarPeriodoAnterior),
    };
  }, [sales, expenses, period]);

  // Cálculos usando apenas os dados filtrados
  const totalFat = useMemo(() => filteredData.sales.filter(s => s.paid).reduce((a, s) => a + Number(s.total), 0), [filteredData]);
  const totalDesp = useMemo(() => filteredData.expenses.reduce((a, e) => a + Number(e.value), 0), [filteredData]);
  const totalRec = useMemo(() => filteredData.sales.filter(s => !s.paid).reduce((a, s) => a + Number(s.total), 0), [filteredData]);

  const prevFat = useMemo(() => prevFilteredData.sales.filter(s => s.paid).reduce((a, s) => a + Number(s.total), 0), [prevFilteredData]);
  const prevDesp = useMemo(() => prevFilteredData.expenses.reduce((a, e) => a + Number(e.value), 0), [prevFilteredData]);
  const prevLucro = prevFat - prevDesp;

  const calcPct = (curr, prev) => {
    if (prev === 0) return curr > 0 ? { label: "+100% vs anterior", up: true } : { label: "Sem dados anteriores", up: true };
    const diff = ((curr - prev) / Math.abs(prev)) * 100;
    return { label: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}% vs anterior`, up: diff >= 0 };
  };

  const fatPct = calcPct(totalFat, prevFat);
  const despPct = calcPct(totalDesp, prevDesp);
  const lucroPct = calcPct(totalFat - totalDesp, prevLucro);

  // Contagens baseadas no filtro atual
  const countVendas = filteredData.sales.length;
  const countVendasPagas = filteredData.sales.filter(s => s.paid).length;
  const countFiado = filteredData.sales.filter(s => !s.paid).length;
  const countPedidos = filteredData.expenses.length; // Assumindo que pedidos são expenses
  const countPneus = filteredData.sales.reduce((a, s) => a + s.items.reduce((b, it) => b + it.qty, 0), 0);

  const tituloResumo = {
    diário: "RESUMO DO DIA",
    semanal: "RESUMO DA SEMANA",
    mensal: "RESUMO DO MÊS",
    anual: "RESUMO DO ANO"
  }[period] || "RESUMO";

  // Gráfico também respeitando o filtro
  const chartData = useMemo(() => buildDailyChart(filteredData.sales, filteredData.expenses), [filteredData]);
  const regionData = useMemo(() => {
    const counts = {};
    filteredData.sales.forEach(sale => {
      const reg = sale.region || "Outros";
      const totalPneus = sale.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      const faturamento = sale.total || 0;

      if (!counts[reg]) counts[reg] = { pneus: 0, valor: 0 };
      counts[reg].pneus += totalPneus;
      counts[reg].valor += faturamento;
    });

    return Object.keys(counts).map(reg => ({
      name: reg,
      pneus: counts[reg].pneus,
      valor: counts[reg].valor
    })).sort((a, b) => b.valor - a.valor);
  }, [filteredData.sales]);

  const pieData = useMemo(() => {
    const m = {}; expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + Number(e.value); });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {["Diário", "Semanal", "Mensal", "Anual"].map(p => (
          <button key={p} onClick={() => setPeriod(p.toLowerCase())} style={{
            padding: "7px 20px", borderRadius: 20, border: "none", cursor: "pointer",
            background: period === p.toLowerCase() ? O : "#14151c",
            color: period === p.toLowerCase() ? "#000" : "#64748b",
            fontFamily: "Barlow,sans-serif", fontWeight: 600, fontSize: 13, transition: "all .15s",
          }}>{p}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <KPI title="Faturamento" value={fmt(totalFat)} sub={fatPct.label} up={fatPct.up} icon={TrendingUp} color={G} />
        <KPI title="Despesas" value={fmt(totalDesp)} sub={despPct.label} up={!despPct.up} icon={DollarSign} color={R} />
        <KPI title="Lucro Líquido" value={fmt(totalFat - totalDesp)} sub={lucroPct.label} up={lucroPct.up} icon={TrendingUp} color={O} />
        <KPI title="A Receber" value={fmt(totalRec)} sub={`${sales.filter(s => !s.paid).length} em aberto`} icon={CreditCard} color={Y} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "#f1f5f9", letterSpacing: "0.06em", marginBottom: 20 }}>Faturamento · Despesas · Lucro</h3>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G} stopOpacity={.25} /><stop offset="95%" stopColor={G} stopOpacity={0} /></linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={R} stopOpacity={.25} /><stop offset="95%" stopColor={R} stopOpacity={0} /></linearGradient>
                <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={O} stopOpacity={.25} /><stop offset="95%" stopColor={O} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
              <XAxis dataKey="label" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Barlow,sans-serif", paddingTop: 10 }} />
              <Area type="monotone" dataKey="fat" name="Faturamento" stroke={G} fill="url(#gF)" strokeWidth={2} />
              <Area type="monotone" dataKey="desp" name="Despesas" stroke={R} fill="url(#gD)" strokeWidth={2} />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke={O} fill="url(#gL)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "#f1f5f9", letterSpacing: "0.06em", marginBottom: 16 }}>Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="46%" outerRadius={78} innerRadius={36} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={PC[i % PC.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ background: "#16171e", border: "1px solid #2d2d38", borderRadius: 8, fontFamily: "Barlow,sans-serif", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
            {pieData.map((d, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", fontFamily: "Barlow,sans-serif" }}>
                <span style={{ width: 7, height: 7, borderRadius: 1, background: PC[i % PC.length], display: "inline-block" }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "#f1f5f9", letterSpacing: "0.06em", marginBottom: 16 }}>Faturamento por Região</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData} margin={{ top: 30, right: 30, left: 40, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="#f1f5f9"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#f1f5f9' }}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
                tick={{ fill: '#64748b' }}
              />

              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                labelFormatter={() => ""}
                contentStyle={{ background: "#f1f2f6", border: "1px solid #2d2d38", borderRadius: 8 }}
                formatter={(value, name) => [
                  name === "valor" ? fmt(value) : `${value} un`,
                  name === "valor" ? "Faturamento" : "Qtd. Pneus"
                ]}
              />

              {/* Removemos o 'fill' fixo da Bar e usamos Cell abaixo */}
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={45}>
                {/* Mapeia cada barra para uma cor da nossa lista */}
                {regionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}

                <LabelList
                  dataKey="pneus"
                  position="top"
                  formatter={(v) => `${v} un`}
                  style={{ fill: "#ffffff", fontSize: 11, fontWeight: 600, fontFamily: "IBM Plex Mono" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, padding: 24 }}>
          <h3 style={{ fontFamily: "Bebas Neue", fontSize: 18, color: "#f1f5f9", letterSpacing: "0.06em", marginBottom: 20 }}>
            {period === "diário" ? "Resumo do Dia" :
              period === "semanal" ? "Resumo da Semana" :
                period === "anual" ? "Resumo do Ano" : "Resumo do Mês"}
          </h3>
          {[
            {
              label: "Total de Vendas",
              value: filteredData.sales.length,
              unit: "vendas",
              color: B
            },
            {
              label: "Vendas Pagas",
              value: filteredData.sales.filter(s => s.paid).length,
              unit: "vendas",
              color: G
            },
            {
              label: "Fiado em Aberto",
              value: filteredData.sales.filter(s => !s.paid).length,
              unit: "vendas",
              color: Y
            },
            {
              label: "Pedidos de Compra",
              value: filteredData.expenses.length,
              unit: "pedidos",
              color: P
            },
            {
              label: "Pneus Comprados",
              // Aqui usamos o filteredData para despesas também
              value: filteredData.expenses.reduce((a, p) => a + (p.totalQty || 0), 0),
              unit: "unidades",
              color: O
            },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 4 ? "1px solid #1e1e28" : "none" }}>
              <span style={{ color: "#94a3b8", fontFamily: "Barlow,sans-serif", fontSize: 14 }}>{r.label}</span>
              <span style={{ color: r.color, fontFamily: "IBM Plex Mono", fontSize: 16, fontWeight: 500 }}>
                {r.value} <span style={{ fontSize: 11, color: "#64748b" }}>{r.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Vendas ─────────────── */
function Vendas({ sales, addSale, updateSale, deleteItem, addToList, lists, TIRE_SIZES }) {
  const empty = { clientName: "", clientPhone: "", region: REGIONS[0], items: [{ size: TIRE_SIZES[7], qty: 1, unitPrice: "" }], paid: true, date: today(), time: nowT() };
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [isQuickSale, setIsQuickSale] = useState(false);
  const [editingId, setEditingId] = useState(null); // ← ID do registro em edição

  const openNew = () => { setEditingId(null); setForm(empty); setIsQuickSale(false); setModal(true); };
  const openEdit = (s) => {
    const isQS = s.clientName === "Venda Rápida";
    setEditingId(s.id);
    setIsQuickSale(isQS);  // ← mantém o estado correto
    setForm({
      clientName: s.clientName || "",
      clientPhone: s.clientPhone || "",
      region: s.region || REGIONS[0],
      items: (s.items || []).map(it => ({
        size: it.size || TIRE_SIZES[7],
        qty: Number(it.qty) || 1,
        unitPrice: it.unitPrice != null ? String(it.unitPrice) : "",
      })),
      paid: s.paid ?? true,
      date: s.date || today(),
      time: s.time || nowT(),
    });
    setModal(true);
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { size: TIRE_SIZES[7], qty: 1, unitPrice: "" }] }));
  const remItem = i => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const updItem = (i, k, v) => setForm(f => { const it = [...f.items]; it[i] = { ...it[i], [k]: k === "size" ? v : Number(v) }; return { ...f, items: it }; });
  const total = form.items.reduce((a, it) => a + (it.qty || 0) * (it.unitPrice || 0), 0);

  const handleQuickSaleToggle = () => {
    const newValue = !isQuickSale;
    setIsQuickSale(newValue);
    if (newValue) {
      setForm(f => ({ ...f, clientName: "Venda Rápida", clientPhone: "00 00000-0000", region: "Balcão", paid: true }));
    } else {
      setForm(empty);
    }
  };

  const save = async () => {
    const totalCalc = form.items.reduce((a, it) => a + (Number(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0);
    if (!form.clientName || totalCalc <= 0) return;
    setSaving(true);

    const payload = {
      clientName: form.clientName,      // ← vem do state, não do DOM
      clientPhone: form.clientPhone,
      region: form.region,
      items: form.items.map(it => ({
        size: it.size,
        qty: Number(it.qty),
        unitPrice: parseFloat(it.unitPrice),
      })),
      paid: form.paid,
      date: form.date,
      time: form.time,
      total: totalCalc,
    };

    const ok = editingId
      ? await updateSale(editingId, payload)
      : await addSale(payload);

    setSaving(false);
    if (ok) { setModal(false); setForm(empty); setEditingId(null); setIsQuickSale(false); }
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "Bebas Neue", fontSize: 30, color: "#f1f5f9", letterSpacing: "0.05em" }}>Vendas</h2>
          <p style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 13, marginTop: 3 }}>{sales.length} vendas registradas</p>
        </div>
        <button onClick={openNew} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={15} /> Nova Venda
        </button>
      </div>

      <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d2d38" }}>
              {["Data/Hora", "Cliente", "Região", "Pneus", "Total", "Status", ""].map(h => (
                <th key={h} style={{ padding: "13px 16px", textAlign: "left", color: "#4b5563", fontSize: 10, fontFamily: "Barlow,sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1a1a22" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1c1d24"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "13px 16px", color: "#64748b", fontSize: 12, fontFamily: "IBM Plex Mono" }}>{fmtD(s.date)}<br /><span style={{ fontSize: 10, color: "#374151" }}>{s.time}</span></td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ color: "#f1f5f9", fontFamily: "Barlow,sans-serif", fontSize: 14, fontWeight: 500 }}>{s.clientName}</div>
                  <div style={{ color: "#4b5563", fontSize: 12, fontFamily: "Barlow,sans-serif", display: "flex", alignItems: "center", gap: 4 }}><Phone size={10} />{s.clientPhone}</div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ background: "#1a2236", color: "#60a5fa", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontFamily: "Barlow,sans-serif" }}>{s.region}</span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  {(s.items || []).map((it, j) => <div key={j} style={{ color: "#94a3b8", fontSize: 12, fontFamily: "Barlow,sans-serif" }}>{it.qty}× {it.size} · {fmt(it.unitPrice)}</div>)}
                </td>
                <td style={{ padding: "13px 16px", color: O, fontFamily: "IBM Plex Mono", fontSize: 15, fontWeight: 500 }}>{fmt(s.total)}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ background: s.paid ? "#14532d" : "#422006", color: s.paid ? "#4ade80" : "#fb923c", fontSize: 11, padding: "4px 12px", borderRadius: 12, fontFamily: "Barlow,sans-serif", fontWeight: 600 }}>
                    {s.paid ? "Pago" : "Fiado"}
                  </span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                      onMouseEnter={e => e.currentTarget.style.color = B}
                      onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteItem("sales", s.id, s.clientName)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                      onMouseEnter={e => e.currentTarget.style.color = R}
                      onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && <div style={{ padding: 48, textAlign: "center", color: "#374151", fontFamily: "Barlow,sans-serif" }}>Nenhuma venda registrada ainda.</div>}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null); }} title={editingId ? "Editar Venda" : "Nova Venda"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          {!editingId && (
            <div onClick={handleQuickSaleToggle} style={{
              gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", background: isQuickSale ? "rgba(34,197,94,0.05)" : "#1a1b23",
              borderRadius: 8, cursor: "pointer", border: isQuickSale ? "1px solid #22c55e" : "1px solid #2d2d38", marginBottom: 6
            }}>
              <span style={{ color: isQuickSale ? "#22c55e" : "#94a3b8", fontSize: 13, fontWeight: 500, fontFamily: "Barlow,sans-serif" }}>
                {isQuickSale ? "✓ Venda Rápida Ativada" : "Ativar Venda Rápida (Consumidor Final)"}
              </span>
              <div style={{ width: 30, height: 16, background: isQuickSale ? "#22c55e" : "#4b5563", borderRadius: 20, position: "relative", transition: "0.2s" }}>
                <div style={{ width: 12, height: 12, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: isQuickSale ? 16 : 2, transition: "0.2s" }} />
              </div>
            </div>
          )}
          <Field label="Nome do Cliente" span>
            <input style={{ ...inp, opacity: isQuickSale ? 0.6 : 1 }} value={form.clientName}
              onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} disabled={isQuickSale} placeholder="Ex: João Silva" />
          </Field>
          <Field label="Telefone">
            <input style={{ ...inp, opacity: isQuickSale ? 0.6 : 1 }} value={form.clientPhone}
              onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} disabled={isQuickSale} placeholder="71999999999" />
          </Field>
          <Field label="Região">
            <ComboInput
              value={form.region} // Use form.region
              options={lists.regions}
              onChange={(v) => setForm({ ...form, region: v })} // Use setForm
              onAddNew={(v) => addToList(v, 'region')}
              placeholder="Selecione ou digite a região"
            />
          </Field>
          <Field label="Pagamento">
            <select style={inp} value={form.paid ? "pago" : "fiado"} onChange={e => setForm(f => ({ ...f, paid: e.target.value === "pago" }))}>
              <option value="pago">À Vista (Pago)</option>
              <option value="fiado">Fiado (A Receber)</option>
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Data">
              <input
                type="date"
                style={inp}
                value={form.date} // Use form.date
                onChange={e => setForm({ ...form, date: e.target.value })} // Use setForm
              />
            </Field>
            <Field label="Hora">
              <input
                type="time"
                style={inp}
                value={form.time} // Use form.time
                onChange={e => setForm({ ...form, time: e.target.value })} // Use setForm
              />
            </Field>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #2d2d38", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Label>Pneus da Venda</Label>
            <button onClick={addItem} style={{ ...btnS("outline"), padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Plus size={12} /> Adicionar</button>
          </div>
          {form.items.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 70px 110px 30px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <ComboInput
                value={it.size}
                options={TIRE_SIZES} // Agora vem do banco!
                onChange={(v) => updItem(i, "size", v)}
                placeholder="Medida"
              />
              <input
                style={{ ...inp, textAlign: "center" }}
                type="number"
                min="1"
                value={it.qty}
                onChange={e => updItem(i, "qty", e.target.value)}
                placeholder="Qtd"
              />
              <input
                style={inp}
                type="number"
                min="0"
                step="0.01"
                value={it.unitPrice || ""}
                onChange={e => updItem(i, "unitPrice", e.target.value)}
                placeholder="R$/pneu"
              />
              {form.items.length > 1 && (
                <button onClick={() => remItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}>
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0e12", borderRadius: 8, padding: "12px 16px", margin: "16px 0" }}>
          <span style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 14 }}>Total da Venda</span>
          <span style={{ color: O, fontFamily: "IBM Plex Mono", fontSize: 22, fontWeight: 500 }}>{fmt(total)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => { setModal(false); setEditingId(null); }} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 8, opacity: saving ? .7 : 1 }}>
            {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Salvando...</> : editingId ? "Salvar Alterações" : "Salvar Venda"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────── A Receber ─────────────── */
function AReceber({ sales, markSalePaid }) {
  const fiado = sales.filter(s => !s.paid);
  const total = fiado.reduce((a, s) => a + Number(s.total), 0);
  const [loading, setLoading] = useState(null);

  const mark = async (id) => {
    setLoading(id);
    await markSalePaid(id);
    setLoading(null);
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "Bebas Neue", fontSize: 30, color: "#f1f5f9", letterSpacing: "0.05em" }}>A Receber — Fiado</h2>
        <p style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 13, marginTop: 3 }}>
          {fiado.length} venda(s) em aberto · Total: <span style={{ color: Y, fontFamily: "IBM Plex Mono" }}>{fmt(total)}</span>
        </p>
      </div>
      {fiado.length === 0 && (
        <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, padding: 48, textAlign: "center", color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 16 }}>
          ✅ &nbsp;Nenhuma venda em aberto. Tudo recebido!
        </div>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        {fiado.map(s => (
          <div key={s.id} style={{ background: "#14151c", border: `1px solid ${Y}35`, borderRadius: 12, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "#f1f5f9", fontFamily: "Barlow,sans-serif", fontWeight: 600, fontSize: 16 }}>{s.clientName}</div>
                <div style={{ color: "#4b5563", fontSize: 13, fontFamily: "Barlow,sans-serif", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <Phone size={11} />{s.clientPhone}&nbsp;·&nbsp;<MapPin size={11} />{s.region}
                </div>
                <div style={{ color: "#374151", fontSize: 11, fontFamily: "IBM Plex Mono", marginTop: 4 }}>{fmtD(s.date)} às {s.time}</div>
              </div>
              <div>{(s.items || []).map((it, j) => <div key={j} style={{ color: "#94a3b8", fontSize: 13, fontFamily: "Barlow,sans-serif" }}>{it.qty}× {it.size} · {fmt(it.unitPrice)}/un</div>)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
              <span style={{ color: Y, fontFamily: "IBM Plex Mono", fontSize: 22, fontWeight: 500 }}>{fmt(s.total)}</span>
              <button onClick={() => mark(s.id)} disabled={loading === s.id} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", opacity: loading === s.id ? .7 : 1 }}>
                {loading === s.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />} Recebido
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Estoque({ purchases, addPurchase, deleteItem, BRANDS, SUPPLIERS, TIRE_SIZES, today, fmt, fmtD, btnS, inp, Field, Label, Modal, O, Loader2, Plus, Truck, Trash2, updatePurchaseDate }) {

  const [brandList, setBrandList] = useState(BRANDS || []);
  const [supplierList, setSupplierList] = useState(SUPPLIERS || []);
  const [editDate, setEditDate] = useState({ open: false, item: null });
  const [editingId, setEditingId] = useState(null);

  // Carrega as listas do Supabase ao montar
  useEffect(() => {
    const fetchLists = async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("key, values")
        .in("key", ["brands", "suppliers"]);
      if (error || !data) return;
      data.forEach(row => {
        if (row.key === "brands") setBrandList(row.values);
        if (row.key === "suppliers") setSupplierList(row.values);
      });
    };
    fetchLists();
  }, []);

  // Salva lista atualizada no Supabase
  const persistList = async (key, updated) => {
    await supabase
      .from("lists")
      .update({ values: updated, updated_at: new Date().toISOString() })
      .eq("key", key);
  };

  const addBrand = (v) => {
    const updated = [...brandList, v];
    setBrandList(updated);
    persistList("brands", updated);
  };

  const addSupplier = (v) => {
    const updated = [...supplierList, v];
    setSupplierList(updated);
    persistList("suppliers", updated);
  };

  const emptyF = {
    orderNumber: "", brand: brandList[0] || "", date: today ? today() : "",
    supplier: supplierList[0] || "", items: [{ size: TIRE_SIZES?.[7] || "", qty: 4, price: 0 }]
  };

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyF);
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  const [searchOrder, setSearchOrder] = useState("");
  const [searchSize, setSearchSize] = useState("");

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { size: TIRE_SIZES[7], qty: 4, price: 0 }] }));
  const remItem = i => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));

  const updItem = (i, k, v) => setForm(f => {
    const it = [...f.items]; it[i] = { ...it[i], [k]: k === "size" ? v : Number(v) };
    return { ...f, items: it };
  });

  const calculatedTotal = useMemo(() => {
    return form.items.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  }, [form.items]);

  const filteredPurchases = useMemo(() => {
    return (purchases || []).filter(p => {
      const matchesOrder = (p.orderNumber || "").toLowerCase().includes(searchOrder.toLowerCase()) ||
        (p.supplier || "").toLowerCase().includes(searchOrder.toLowerCase());
      const matchesSize = searchSize === "" || (p.items || []).some(it =>
        (it.size || "").toLowerCase().includes(searchSize.toLowerCase()));
      return matchesOrder && matchesSize;
    });
  }, [purchases, searchOrder, searchSize]);

  // ── Validação inline ──
  const validate = () => {
    const e = {};
    if (!form.orderNumber.trim()) e.orderNumber = "Campo obrigatório. Por favor preencher!";
    if (!form.brand.trim()) e.brand = "Campo obrigatório. Por favor preencher!";
    if (!form.supplier.trim()) e.supplier = "Campo obrigatório. Por favor preencher!";
    if (!form.date) e.date = "Campo obrigatório. Por favor preencher!";
    const itemErrors = form.items.map(it => {
      const ie = {};
      if (!it.size.trim()) ie.size = "Informe a medida!";
      if (!it.price || it.price <= 0) ie.price = "Informe o valor!";
      return ie;
    });
    if (itemErrors.some(ie => Object.keys(ie).length > 0)) e.items = itemErrors;
    setErrors(e);
    return Object.keys(e).length === 0 && !e.items;
  };

  const errStyle = { color: "#ef4444", fontSize: 11, fontFamily: "Barlow,sans-serif", marginTop: 4 };

  const openNew = () => { setEditingId(null); setForm(emptyF); setErrors({}); setModal(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      orderNumber: p.orderNumber || "",
      brand: p.brand || "",
      date: p.date || today(),
      supplier: p.supplier || "",
      items: (p.items || []).map(it => ({
        size: it.size || "",
        qty: Number(it.qty) || 1,
        price: it.price != null ? it.price : "",  // ← evita undefined
      })),
    });
    setErrors({});
    setModal(true);
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const itemsNormalized = form.items.map(it => ({ ...it, qty: Number(it.qty) || 0, price: parseFloat(it.price) || 0 }));
    const totalCost = itemsNormalized.reduce((a, it) => a + it.qty * it.price, 0);
    const totalQty = itemsNormalized.reduce((a, it) => a + it.qty, 0);
    const ok = editingId
      ? await updatePurchase(editingId, { ...form, items: itemsNormalized, totalCost, totalQty })
      : await addPurchase({ ...form, items: itemsNormalized, totalCost, totalQty });
    setSaving(false);
    if (ok) { setModal(false); setForm(emptyF); setErrors({}); setEditingId(null); }
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "Bebas Neue", fontSize: 30, color: "#f1f5f9", letterSpacing: "0.05em" }}>Estoque / Compras</h2>
          <p style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 13, marginTop: 3 }}>
            {filteredPurchases.length} pedidos encontrados · {filteredPurchases.reduce((a, p) => a + (p.totalQty || 0), 0)} pneus
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={15} /> Novo Pedido
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, background: "#14151c", padding: 16, borderRadius: 12, border: "1px solid #2d2d38" }}>
        <div style={{ flex: 2, position: "relative" }}>
          <label style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Número do Pedido</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...inp, paddingLeft: 35 }} placeholder="Buscar por # ou fornecedor..." value={searchOrder} onChange={e => setSearchOrder(e.target.value)} />
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#4b5563" }} />
          </div>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <label style={{ color: "#64748b", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Filtrar por Medida</label>
          <div style={{ position: "relative" }}>
            <input style={inp} placeholder="Digite a medida..." value={searchSize} onChange={e => setSearchSize(e.target.value)}
              onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
            {showSuggestions && (
              <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#1a1b26", border: "1px solid #2d2d38", borderRadius: 8, zIndex: 100, maxHeight: 250, overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", padding: 4 }}>
                {TIRE_SIZES.filter(s => s.toLowerCase().includes(searchSize.toLowerCase())).length > 0
                  ? TIRE_SIZES.filter(s => s.toLowerCase().includes(searchSize.toLowerCase())).map((s, idx) => (
                    <div key={idx} onClick={() => setSearchSize(s)} style={{ padding: "10px 12px", color: "#f1f5f9", fontSize: 13, cursor: "pointer", borderRadius: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#2d2d38"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{s}</div>
                  ))
                  : <div style={{ padding: "10px 12px", color: "#4b5563", fontSize: 12 }}>Nenhuma medida encontrada</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LISTAGEM */}
      <div style={{ display: "grid", gap: 12 }}>
        {filteredPurchases.map(p => (
          <div key={p.id} style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "Bebas Neue", fontSize: 18, color: O, letterSpacing: "0.06em" }}>#{p.orderNumber}</span>
                  <span style={{ background: "#1e2a3a", color: "#60a5fa", fontSize: 11, padding: "2px 10px", borderRadius: 10 }}>{p.brand}</span>
                  <span style={{ color: "#4b5563", fontSize: 12, fontFamily: "IBM Plex Mono" }}>{fmtD(p.date)}</span>
                </div>
                <div style={{ color: "#64748b", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Truck size={13} /> {p.supplier}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(p.items || []).map((it, i) => (
                    <span key={i} style={{ background: "#0d0e12", padding: "8px 12px", borderRadius: 8, border: "1px solid #2d2d38", display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600 }}>{it.qty}× {it.size}</span>
                      <span style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>Valor: {fmt(it.price)}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>Total Pedido</div>
                <div style={{ color: O, fontFamily: "IBM Plex Mono", fontSize: 22, fontWeight: 500 }}>{fmt(p.totalCost || 0)}</div>
                <div style={{ color: "#4b5563", fontSize: 12, marginTop: 4 }}>{p.totalQty || 0} pneus no total</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                  <button
                    onClick={() => openEdit(p)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                    onMouseEnter={e => e.currentTarget.style.color = B}
                    onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                    title="Ajustar data"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteItem("purchases", p.id, `Pedido #${p.orderNumber}`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#374151" }}
                    onMouseEnter={e => e.currentTarget.style.color = R}
                    onMouseLeave={e => e.currentTarget.style.color = "#374151"}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* MODAL */}
      <Modal open={modal} onClose={() => { setModal(false); setErrors({}); }} title={editingId ? "Editar Pedido" : "Novo Pedido de Compra"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>

          <Field label="Nº do Pedido">
            <input
              style={{ ...inp, borderColor: errors.orderNumber ? "#ef4444" : "#2d2d38" }}
              value={form.orderNumber}
              onChange={e => { setForm(f => ({ ...f, orderNumber: e.target.value })); setErrors(er => ({ ...er, orderNumber: "" })); }}
              placeholder="Ex: PED-100"
            />
            {errors.orderNumber && <div style={errStyle}>{errors.orderNumber}</div>}
          </Field>

          <Field label="Marca">
            <div style={{ borderRadius: 8, border: errors.brand ? "1px solid #ef4444" : "none" }}>
              <ComboInput
                value={form.brand}
                options={brandList}
                placeholder="Escolha ou digite..."
                onAddNew={addBrand}
                onChange={v => { setForm(f => ({ ...f, brand: v })); setErrors(er => ({ ...er, brand: "" })); }}
              />
            </div>
            {errors.brand && <div style={errStyle}>{errors.brand}</div>}
          </Field>

          <Field label="Fornecedor">
            <div style={{ borderRadius: 8, border: errors.supplier ? "1px solid #ef4444" : "none" }}>
              <ComboInput
                value={form.supplier}
                options={supplierList}
                placeholder="Escolha ou digite..."
                onAddNew={addSupplier}
                onChange={v => { setForm(f => ({ ...f, supplier: v })); setErrors(er => ({ ...er, supplier: "" })); }}
              />
            </div>
            {errors.supplier && <div style={errStyle}>{errors.supplier}</div>}
          </Field>

          <Field label="Data do Pedido">
            <input
              style={{ ...inp, borderColor: errors.date ? "#ef4444" : "#2d2d38" }}
              type="date" value={form.date}
              onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: "" })); }}
            />
            {errors.date && <div style={errStyle}>{errors.date}</div>}
          </Field>
        </div>

        <div style={{ borderTop: "1px solid #2d2d38", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Label>Pneus do Pedido</Label>
            <button onClick={addItem} style={{ ...btnS("outline"), padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={12} /> Adicionar
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 110px 30px", gap: 8, marginBottom: 4, padding: "0 4px" }}>
            <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>Medida</span>
            <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", textAlign: "center" }}>Qtd</span>
            <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>Valor Unit. (R$)</span>
          </div>

          {form.items.map((it, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 110px 30px", gap: 8 }}>
                <div style={{ border: errors.items?.[i]?.size ? "1px solid #ef4444" : "none", borderRadius: 8 }}>
                  <ComboInput
                    value={it.size}
                    options={TIRE_SIZES}
                    placeholder="Ex: 295/80 R22.5"
                    onChange={v => { updItem(i, "size", v); setErrors(er => { const it2 = [...(er.items || [])]; if (it2[i]) it2[i].size = ""; return { ...er, items: it2 }; }); }}
                  />
                </div>
                <input style={{ ...inp, textAlign: "center" }} type="number" min="1" value={it.qty} onChange={e => updItem(i, "qty", e.target.value)} />
                <div>
                  <input
                    style={{ ...inp, borderColor: errors.items?.[i]?.price ? "#ef4444" : "#2d2d38" }}
                    type="number" step="0.01" value={it.price || ""}
                    onChange={e => { updItem(i, "price", e.target.value); setErrors(er => { const it2 = [...(er.items || [])]; if (it2[i]) it2[i].price = ""; return { ...er, items: it2 }; }); }}
                    placeholder="0,00"
                  />
                  {errors.items?.[i]?.price && <div style={errStyle}>{errors.items[i].price}</div>}
                </div>
                {form.items.length > 1 && (
                  <button onClick={() => remItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563", alignSelf: "center" }}>
                    <X size={15} />
                  </button>
                )}
              </div>
              {errors.items?.[i]?.size && <div style={{ ...errStyle, marginTop: 2 }}>{errors.items[i].size}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button onClick={() => { setModal(false); setErrors({}); }} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 8, opacity: saving ? .7 : 1 }}>
            {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Salvando...</> : editingId ? "Salvar Alterações" : "Salvar Pedido"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────── Financeiro ─────────────── */
function Financeiro({ sales, expenses, purchases }) {
  const [detail, setDetail] = useState(null);
  const totalFat = sales.filter(s => s.paid).reduce((a, s) => a + Number(s.total), 0);
  const totalDesp = expenses.reduce((a, e) => a + Number(e.value), 0);
  const totalComp = purchases.reduce((a, p) => a + Number(p.totalCost), 0);
  const totalRec = sales.filter(s => !s.paid).reduce((a, s) => a + Number(s.total), 0);

  const cards = [
    { label: "Faturamento", value: totalFat, color: G, items: sales.filter(s => s.paid).map(s => ({ date: s.date, time: s.time, desc: `Venda — ${s.clientName}`, cat: "Vendas", tag: "venda", value: s.total })) },
    { label: "Despesas", value: totalDesp, color: R, items: expenses.map(e => ({ date: e.date, time: e.time, desc: e.description, cat: e.category, tag: e.tag, value: e.value })) },
    { label: "Compras/Estoque", value: totalComp, color: B, items: purchases.map(p => ({ date: p.date, time: "—", desc: `${p.brand} · ${p.orderNumber}`, cat: "Estoque", tag: "empresa", value: p.totalCost })) },
    { label: "Lucro Estimado", value: totalFat - totalDesp - totalComp, color: O, items: [] },
    { label: "A Receber", value: totalRec, color: Y, items: sales.filter(s => !s.paid).map(s => ({ date: s.date, time: s.time, desc: `Fiado — ${s.clientName}`, cat: "Vendas", tag: "fiado", value: s.total })) },
    { label: "Divida Ativa", value: totalRec, color: R, items: sales.filter(s => !s.paid).map(s => ({ date: s.date, time: s.time, desc: `Débito — ${s.clientName}`, cat: "Vendas", tag: "atrasado", value: s.total })) },
  ];

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <h2 style={{ fontFamily: "Bebas Neue", fontSize: 30, color: "#f1f5f9", letterSpacing: "0.05em", marginBottom: 24 }}>Financeiro</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {cards.map(c => (
          <div key={c.label} onClick={() => c.items.length > 0 && setDetail(c)}
            style={{ background: "#14151c", border: `1px solid ${c.color}28`, borderRadius: 12, padding: "22px 24px", cursor: c.items.length > 0 ? "pointer" : "default", transition: "border-color .15s", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => { if (c.items.length > 0) e.currentTarget.style.borderColor = `${c.color}60`; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${c.color}28`}>
            <div style={{ position: "absolute", top: -28, right: -28, width: 90, height: 90, borderRadius: "50%", background: `${c.color}08` }} />
            <div style={{ color: "#4b5563", fontSize: 10, fontFamily: "Barlow,sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>{c.label}</div>
            <div style={{ color: c.color, fontFamily: "IBM Plex Mono", fontSize: 24, fontWeight: 500, marginBottom: 8 }}>{fmt(c.value)}</div>
            {c.items.length > 0 && <div style={{ color: "#4b5563", fontSize: 12, fontFamily: "Barlow,sans-serif", display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> Ver detalhes ({c.items.length})</div>}
          </div>
        ))}
      </div>
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.label || ""}>
        {detail && (
          <div>
            <div style={{ background: "#0d0e12", borderRadius: 8, padding: "12px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 14 }}>Total</span>
              <span style={{ color: detail.color, fontFamily: "IBM Plex Mono", fontSize: 20 }}>{fmt(detail.value)}</span>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {detail.items.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #1a1a22" }}>
                  <div>
                    <div style={{ color: "#f1f5f9", fontFamily: "Barlow,sans-serif", fontSize: 14, marginBottom: 4 }}>{d.desc}</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: "#4b5563", fontSize: 11, fontFamily: "IBM Plex Mono" }}>{fmtD(d.date)} {d.time}</span>
                      <span style={{ background: "#1e2a3a", color: "#60a5fa", fontSize: 11, padding: "1px 8px", borderRadius: 8, fontFamily: "Barlow,sans-serif" }}>{d.cat}</span>
                      <span style={{ background: d.tag === "pessoal" ? "#2a1a33" : "#1e2a3a", color: d.tag === "pessoal" ? P : B, fontSize: 11, padding: "1px 8px", borderRadius: 8, fontFamily: "Barlow,sans-serif" }}>{d.tag}</span>
                    </div>
                  </div>
                  <span style={{ color: detail.color, fontFamily: "IBM Plex Mono", fontSize: 14, flexShrink: 0, marginLeft: 16 }}>{fmt(d.value)}</span>
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
function Despesas({ expenses, addExpense, updateExpense, deleteItem }) {
  const emptyF = { category: EXP_CATS[0], tag: "empresa", description: "", value: "", payee: "", date: today(), time: nowT() };
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("todos");
  const [form, setForm] = useState(emptyF);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const openNew = () => { setEditingId(null); setForm(emptyF); setModal(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      category: item.category || EXP_CATS[0],
      tag: item.tag || "empresa",
      description: item.description || "",
      value: item.value != null ? String(item.value) : "",  // ← converte number → string
      payee: item.payee || "",
      date: item.date || today(),
      time: item.time || nowT(),
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.description || !form.value) return;
    setSaving(true);
    const ok = editingId ? await updateExpense(editingId, form) : await addExpense(form);
    setSaving(false);
    if (ok) { setModal(false); setForm(emptyF); setEditingId(null); }
  };

  return (
    <div style={{ animation: "fadeIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "Bebas Neue", fontSize: 30, color: "#f1f5f9", letterSpacing: "0.05em" }}>Despesas</h2>
          <p style={{ color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 13, marginTop: 3 }}>
            Empresa: <span style={{ color: R, fontFamily: "IBM Plex Mono" }}>{fmt(totalE)}</span>
            &nbsp;·&nbsp; Pessoal: <span style={{ color: P, fontFamily: "IBM Plex Mono" }}>{fmt(totalP)}</span>
          </p>
        </div>
        <button onClick={() => openNew} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={15} /> Nova Despesa
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ k: "todos", label: "Todos", bg: O }, { k: "empresa", label: "Empresa", bg: R }, { k: "pessoal", label: "Pessoal", bg: P }].map(t => (
          <button key={t.k} onClick={() => setFilter(t.k)} style={{ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", background: filter === t.k ? t.bg : "#14151c", color: filter === t.k ? "#fff" : "#64748b", fontFamily: "Barlow,sans-serif", fontWeight: 600, fontSize: 13, transition: "all .15s" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: "#14151c", border: "1px solid #2d2d38", borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2d2d38" }}>
              {["Data/Hora", "Categoria", "Descrição", "Onde/Fornecedor", "Tag", "Valor"].map(h => (
                <th key={h} style={{ padding: "13px 16px", textAlign: "left", color: "#4b5563", fontSize: 10, fontFamily: "Barlow,sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.09em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #1a1a22" }}
                onMouseEnter={ev => ev.currentTarget.style.background = "#1c1d24"}
                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "13px 16px", color: "#4b5563", fontSize: 11, fontFamily: "IBM Plex Mono" }}>{fmtD(item.date)}<br />{item.time}</td>
                <td style={{ padding: "13px 16px" }}><span style={{ background: "#1e2a3a", color: "#60a5fa", fontSize: 11, padding: "3px 10px", borderRadius: 10, fontFamily: "Barlow,sans-serif" }}>{item.category}</span></td>
                <td style={{ padding: "13px 16px", color: "#f1f5f9", fontFamily: "Barlow,sans-serif", fontSize: 14 }}>{item.description}</td>
                <td style={{ padding: "13px 16px", color: "#64748b", fontFamily: "Barlow,sans-serif", fontSize: 13 }}>{item.payee}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ background: item.tag === "pessoal" ? "#2a1a33" : "#1e2a3a", color: item.tag === "pessoal" ? P : B, fontSize: 11, padding: "3px 10px", borderRadius: 10, fontFamily: "Barlow,sans-serif", fontWeight: 600 }}>{item.tag}</span>
                </td>
                <td style={{ padding: "13px 16px", color: R, fontFamily: "IBM Plex Mono", fontSize: 14, fontWeight: 500 }}>-{fmt(item.value)}</td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => openEdit(P)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                      onMouseEnter={e => e.currentTarget.style.color = B}
                      onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                      title="Ajustar data/hora"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteItem("expenses", item.id, item.description)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#4b5563" }}
                      onMouseEnter={e => e.currentTarget.style.color = R}
                      onMouseLeave={e => e.currentTarget.style.color = "#4b5563"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 48, textAlign: "center", color: "#374151", fontFamily: "Barlow,sans-serif" }}>Nenhuma despesa registrada ainda.</div>}
      </div>

      <Modal open={modal} onClick={() => { openNew }} onClose={() => setModal(false)} title="Nova Despesa">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Categoria"><select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{EXP_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Tag">
            <select style={inp} value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
              <option value="empresa">Empresa</option>
              <option value="pessoal">Pessoal</option>
            </select>
          </Field>
          <Field label="Descrição" span><input style={inp} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Conta de luz Abril" /></Field>
          <Field label="Onde / Fornecedor"><input style={inp} value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} placeholder="Ex: Coelba" /></Field>
          <Field label="Valor (R$)"><input style={inp} type="number" min="0" step="0.01" value={form.value || ""} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" /></Field>
          <Field label="Data"><input style={inp} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Hora"><input style={inp} type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={() => setModal(false)} style={btnS("outline")}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ ...btnS(), display: "flex", alignItems: "center", gap: 8, opacity: saving ? .7 : 1 }}>
            {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Salvando...</> : editingId ? "Salvar Alterações" : "Salvar Despesa"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────── Nav ─────────────── */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vendas", label: "Vendas", icon: ShoppingBag },
  { id: "receber", label: "A Receber", icon: CreditCard },
  { id: "estoque", label: "Estoque", icon: Package },
  { id: "financeiro", label: "Financeiro", icon: DollarSign },
  { id: "despesas", label: "Despesas", icon: Tag },
];

/* ─────────────── App Principal ─────────────── */
export default function App() {
  const [page, setPage] = useState("dashboard");
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
    sales, purchases, expenses,
    loading, error, toast,
    fetchAll, addSale, markSalePaid, addPurchase, addExpense, deleteItem,
    updateSale, updatePurchase, updateExpense, addToList, lists
  } = useSupabase();

  const fiadoN = sales.filter(s => !s.paid).length;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0d0e12", fontFamily: "Barlow,sans-serif", overflow: "hidden" }}>
      <style>{FONTS}</style>

      {/* Sidebar */}
      <aside style={{ width: 215, background: "#0f1015", borderRight: "1px solid #1c1c26", display: "flex", flexDirection: "column", padding: "24px 14px", flexShrink: 0 }}>
        <div style={{ paddingLeft: 8, marginBottom: 36 }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: O, letterSpacing: "0.1em", lineHeight: 1 }}>PNEU</div>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "#f1f5f9", letterSpacing: "0.1em", lineHeight: 1 }}>CONTROL</div>
          <div style={{ width: 28, height: 2, background: O, marginTop: 6 }} />
        </div>
        <nav style={{ flex: 1 }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            const badge = id === "receber" && fiadoN > 0 ? fiadoN : null;
            return (
              <button key={id} onClick={() => setPage(id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: active ? `${O}18` : "transparent",
                color: active ? O : "#4b5563",
                fontFamily: "Barlow,sans-serif", fontWeight: active ? 600 : 400, fontSize: 14,
                marginBottom: 3, transition: "all .12s", position: "relative",
              }}>
                {active && <div style={{ position: "absolute", left: 0, top: "22%", bottom: "22%", width: 3, borderRadius: 2, background: O }} />}
                <Icon size={15} />{label}
                {badge && <span style={{ marginLeft: "auto", background: O, color: "#000", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ borderTop: "1px solid #1c1c26", paddingTop: 14, color: "#374151", fontSize: 11, fontFamily: "Barlow,sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: error ? "#ef4444" : "#22c55e" }} />
            {error ? "Sem conexão" : "Conectado"}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "Bebas Neue", fontSize: 34, color: "#f1f5f9", letterSpacing: "0.05em" }}>{NAV.find(n => n.id === page)?.label}</h1>
            <p style={{ color: "#374151", fontSize: 12, fontFamily: "Barlow,sans-serif", marginTop: 3 }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {error && <ErrorBanner msg={error} onRetry={fetchAll} />}

        {loading
          ? <Spinner msg="Carregando dados do servidor..." />
          : <ErrorBoundary>
            {page === "dashboard" && <Dashboard sales={sales} expenses={expenses} purchases={purchases} />}
            {page === "vendas" && <Vendas sales={sales} addSale={addSale} updateSale={updateSale} deleteItem={requestDelete} addToList={addToList} lists={lists} TIRE_SIZES={TIRE_SIZES} />}
            {page === "receber" && <AReceber sales={sales} markSalePaid={markSalePaid} />}
            {page === "estoque" && <Estoque
              purchases={purchases}
              addPurchase={addPurchase}
              deleteItem={deleteItem}
              updatePurchase={updatePurchase}
              BRANDS={BRANDS} SUPPLIERS={SUPPLIERS} TIRE_SIZES={TIRE_SIZES}
              fmt={fmt} fmtD={fmtD} today={today} btnS={btnS} inp={inp}
              Field={Field} Label={Label} Modal={Modal}
              O={O} Loader2={Loader2} Plus={Plus} Truck={Truck} Trash2={Trash2}
            />}
            {page === "financeiro" && <Financeiro sales={sales} expenses={expenses} purchases={purchases} />}
            {page === "despesas" && <Despesas expenses={expenses} addExpense={addExpense} updateExpense={updateExpense} deleteItem={requestDelete} />}
          </ErrorBoundary>
        }
      </main>

      <Toast msg={toast.msg} type={toast.type} />

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
          Esta ação não poderá ser desfeita: <br />
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

function EditDateModal({ open, onClose, onSave, item, showTime = true }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (item) { setDate(item.date || ""); setTime(item.time || ""); }
  }, [item]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Ajustar Data e Hora">
      <div style={{ display: "grid", gridTemplateColumns: showTime ? "1fr 1fr" : "1fr", gap: 14 }}>
        <Field label="Data">
          <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        {showTime && (
          <Field label="Hora">
            <input style={inp} type="time" value={time} onChange={e => setTime(e.target.value)} />
          </Field>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={btnS("outline")}>Cancelar</button>
        <button onClick={() => onSave(date, time)} style={btnS()}>Salvar</button>
      </div>
    </Modal>
  );
}
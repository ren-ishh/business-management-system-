import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, MoreHorizontal, ArrowUpDown, LayoutGrid, CalendarRange,
  BarChart3, Users, Settings, Sparkles, X, CheckCircle2, CalendarDays,
  Plus, Loader2, AlertCircle, RefreshCw, ChevronDown, TrendingUp,
  IndianRupee, Clock, Package
} from "lucide-react";

// ─── Theme ───────────────────────────────────────────────────────────────────
const themeStyles = `
  :root {
    --bg-main: oklch(0.985 0.005 80);
    --bg-card: oklch(1 0 0);
    --text-main: oklch(0.22 0.02 25);
    --text-muted: oklch(0.52 0.018 30);
    --primary: oklch(0.38 0.10 15);
    --primary-fg: oklch(0.985 0.005 80);
    --border-color: oklch(0.91 0.008 60);
    --success-bg: oklch(0.94 0.05 155);
    --success-fg: oklch(0.38 0.10 155);
    --warning-bg: oklch(0.94 0.07 80);
    --warning-fg: oklch(0.42 0.11 60);
    --danger-bg: oklch(0.94 0.04 20);
    --danger-fg: oklch(0.45 0.15 22);
    --neutral-bg: oklch(0.95 0.01 60);
    --neutral-fg: oklch(0.3 0.02 25);
  }
  body { background-color: var(--bg-main); color: var(--text-main); font-family: "Inter", ui-sans-serif, system-ui, sans-serif; }
  .brand-primary { background-color: var(--primary); color: var(--primary-fg); }
  .brand-primary-text { color: var(--primary); }
  .brand-card { background-color: var(--bg-card); border-color: var(--border-color); }
  .brand-border { border-color: var(--border-color); }
  .brand-muted { color: var(--text-muted); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
`;

// ─── Utils ────────────────────────────────────────────────────────────────────
const cn = (...c) => c.filter(Boolean).join(" ");
const today = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = "http://127.0.0.1:8000/api";
const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(e.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
};

const api = {
  inventory: {
    list: (p = {}) => {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v != null))).toString();
      return req("GET", `/inventory${qs ? `?${qs}` : ""}`);
    },
    create: (b) => req("POST", "/inventory", b),
  },
  bookings: {
    list: (p = {}) => {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v != null))).toString();
      return req("GET", `/bookings${qs ? `?${qs}` : ""}`);
    },
    create: (b) => req("POST", "/bookings", b),
    updateStatus: (id, status) => req("PATCH", `/bookings/${id}/status?new_status=${status}`),
  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toast = null;
const toast = {
  success: (t, d) => _toast?.({ t, d, type: "success" }),
  error: (t, d) => _toast?.({ t, d, type: "error" }),
};
function ToastProvider() {
  const [cur, setCur] = useState(null);
  useEffect(() => { _toast = (x) => { setCur(x); setTimeout(() => setCur(null), 3500); }; return () => { _toast = null; }; }, []);
  if (!cur) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-xl">
      {cur.type === "success" ? <CheckCircle2 className="size-5 text-emerald-400 shrink-0" /> : <AlertCircle className="size-5 text-red-400 shrink-0" />}
      <div><p className="text-sm font-medium">{cur.t}</p>{cur.d && <p className="text-xs text-zinc-400">{cur.d}</p>}</div>
    </div>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Button = React.forwardRef(({ className, variant = "primary", size = "default", ...p }, ref) => {
  const V = { primary: "brand-primary hover:opacity-90 shadow-sm", outline: "border brand-border bg-transparent hover:bg-zinc-100 brand-muted hover:text-black", ghost: "bg-transparent hover:bg-zinc-100 brand-muted hover:text-black", danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" };
  const S = { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-8 w-8" };
  return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50", V[variant], S[size], className)} {...p} />;
});
const Input = React.forwardRef(({ className, ...p }, ref) => <input ref={ref} className={cn("flex h-10 w-full rounded-md border brand-border bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800 disabled:opacity-50", className)} {...p} />);
const Label = React.forwardRef(({ className, ...p }, ref) => <label ref={ref} className={cn("text-sm font-medium leading-none", className)} {...p} />);
const Select = ({ className, ...p }) => <select className={cn("flex h-10 w-full rounded-md border brand-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800", className)} {...p} />;

function StatusBadge({ tone, label }) {
  const S = {
    success: "border-[var(--success-bg)] bg-[var(--success-bg)] text-[var(--success-fg)]",
    warning: "border-[var(--warning-bg)] bg-[var(--warning-bg)] text-[var(--warning-fg)]",
    danger: "border-[var(--danger-bg)] bg-[var(--danger-bg)] text-[var(--danger-fg)]",
    neutral: "border-[var(--neutral-bg)] bg-[var(--neutral-bg)] text-[var(--neutral-fg)]",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border", S[tone] || S.neutral)}>{label}</span>;
}

const paymentTone = (s) => s === "settled" ? "success" : s === "partial" ? "warning" : "danger";
const rentalTone = (s) => ({ returned: "success", reserved: "warning", picked_up: "warning", overdue: "danger", cancelled: "neutral" }[s] || "neutral");

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader({ eyebrow, title, desc, action }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] brand-primary-text mb-1">{eyebrow}</div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">{title}</h1>
        {desc && <p className="text-sm brand-muted mt-1 max-w-xl">{desc}</p>}
      </div>
      {action}
    </header>
  );
}

// ─── Empty / Error states ─────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="rounded-xl border-2 border-dashed brand-border p-12 text-center">
      <Icon className="size-10 text-zinc-300 mx-auto mb-3" />
      <p className="text-sm font-medium brand-muted">{title}</p>
      {desc && <p className="text-xs brand-muted mt-1 mb-4">{desc}</p>}
      {action}
    </div>
  );
}
function ErrorState({ msg, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-red-700">Failed to load</p>
      <p className="text-xs text-red-500 mt-1 mb-3">{msg}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

// ─── Add Dress Modal ──────────────────────────────────────────────────────────
const CATS = ["Classic", "Modern", "Boho", "Princess", "Minimalist", "Other"];
function AddDressModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", sku: "", category: "", base_rental_price: "" });
  const [loading, setLoading] = useState(false);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.category || !form.base_rental_price) { toast.error("Missing fields"); return; }
    setLoading(true);
    try {
      const d = await api.inventory.create({ ...form, base_rental_price: parseFloat(form.base_rental_price), image_url: null });
      toast.success("Dress added", `${d.name} (${d.sku})`);
      onCreated(d); onClose();
      setForm({ name: "", sku: "", category: "", base_rental_price: "" });
    } catch (err) { toast.error("Failed", err.message); }
    finally { setLoading(false); }
  };
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="brand-card rounded-xl border brand-border shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b brand-border">
            <h2 className="text-lg font-semibold">Add Dress</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="size-5" /></Button>
          </div>
          <form id="add-dress" onSubmit={submit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Dress Name *</Label>
              <Input placeholder="A-Line Lace Gown" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>SKU *</Label>
                <Input placeholder="BW-006" value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onChange={e => set("category", e.target.value)} required>
                  <option value="">Select…</option>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Daily Rental Price (₹) *</Label>
              <Input type="number" min="0" step="0.01" placeholder="1500.00" value={form.base_rental_price} onChange={e => set("base_rental_price", e.target.value)} required />
            </div>
          </form>
          <div className="p-5 border-t brand-border bg-zinc-50/50">
            <Button type="submit" form="add-dress" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {loading ? "Adding…" : "Add Dress"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Booking Sheet ────────────────────────────────────────────────────────────
function BookingSheet({ dress, fromDate: initFrom, toDate: initTo, open, onClose, onBooked }) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [advance, setAdvance] = useState("");
  const [loading, setLoading] = useState(false);
  // Editable dates — local state initialized from props
  const [fromDate, setFromDate] = useState(initFrom);
  const [toDate, setToDate] = useState(initTo);

  // Sync when parent dates change (new dress selected)
  useEffect(() => {
    setFromDate(initFrom);
    setToDate(initTo);
  }, [initFrom, initTo, open]);

  if (!open || !dress) return null;

  const days = Math.max(1, Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000));
  const total = days * Number(dress.base_rental_price);
  const adv = parseFloat(advance) || 0;
  const remaining = Math.max(0, total - adv);

  const submit = async (e) => {
    e.preventDefault();
    if (!customer || !phone) { toast.error("Missing details"); return; }
    setLoading(true);
    try {
      const result = await api.bookings.create({
        dress_id: dress.id,
        customer_name: customer,
        customer_phone: phone,
        start_date: fromDate,
        end_date: toDate,
        total_amount: total,
        advance_paid: adv,
      });
      toast.success("Booking confirmed!", `${dress.name} reserved for ${customer}`);
      onBooked && onBooked(result);
      onClose();
      setCustomer(""); setPhone(""); setAdvance("");
    } catch (err) {
      toast.error("Booking failed", err.message);
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md brand-card shadow-2xl border-l brand-border flex flex-col">
        <div className="flex items-center justify-between p-5 border-b brand-border">
          <div>
            <h2 className="text-lg font-semibold">New Booking</h2>
            <p className="brand-muted text-xs uppercase tracking-wider mt-1">{dress.sku}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-5" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Dress summary */}
          <div className="rounded-lg border brand-border bg-zinc-50/50 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-black">{dress.name}</p>
                <p className="text-xs brand-muted mt-0.5">{dress.category} · {dress.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-xs brand-muted">Per day</p>
                <p className="font-semibold">{fmt(dress.base_rental_price)}</p>
              </div>
            </div>
          </div>

          <form id="booking-form" onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider brand-muted">Rental Period</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs brand-muted">From</Label>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs brand-muted">To</Label>
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
              <p className="text-xs brand-muted">{days} day{days !== 1 ? "s" : ""} · {fmt(total)} total</p>
            </div>
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider brand-muted">Customer Details</Label>
              <Input placeholder="Full Name" value={customer} onChange={e => setCustomer(e.target.value)} required />
              <Input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="pt-4 border-t brand-border space-y-3">
              <Label className="text-xs uppercase tracking-wider brand-muted block">Payment Split</Label>
              <div className="flex justify-between text-sm"><span className="brand-muted">Total</span><span className="font-semibold">{fmt(total)}</span></div>
              <div className="flex justify-between items-center text-sm">
                <span className="brand-muted">Advance</span>
                <div className="relative w-36">
                  <span className="absolute left-3 top-2 text-zinc-400 text-sm">₹</span>
                  <Input type="number" min="0" max={total} className="pl-7 text-right" placeholder="0" value={advance} onChange={e => setAdvance(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t brand-border">
                <span className="font-medium">Remaining</span>
                <span className="font-semibold text-rose-600">{fmt(remaining)}</span>
              </div>
            </div>
          </form>
        </div>
        <div className="p-5 border-t brand-border bg-zinc-50/50">
          <Button type="submit" form="booking-form" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "Saving…" : "Confirm Booking"}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { to: "/", label: "Operations", icon: LayoutGrid, group: "Daily" },
  { to: "/schedule", label: "Schedule", icon: CalendarRange, group: "Daily" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, group: "Management" },
  { to: "/customers", label: "Customers", icon: Users, group: "Management" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Management" },
];
function Sidebar({ path, setPath }) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r brand-border brand-card sticky top-0 h-screen">
      <div className="px-6 py-6 border-b brand-border">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setPath("/")}>
          <span className="grid size-9 place-items-center rounded-lg brand-primary"><Sparkles className="size-4" /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Bridal Way</span>
            <span className="text-[10px] uppercase tracking-[0.18em] brand-muted">Atelier Suite</span>
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {["Daily", "Management"].map(g => (
          <div key={g}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] brand-muted">{g}</div>
            <ul className="space-y-0.5">
              {NAV.filter(n => n.group === g).map(n => {
                const Icon = n.icon; const active = path === n.to;
                return (
                  <li key={n.to}>
                    <button onClick={() => setPath(n.to)} className={cn("w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-[var(--primary)] text-[var(--primary-fg)] font-medium" : "hover:bg-zinc-100 brand-muted hover:text-black")}>
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} /><span className="truncate">{n.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t brand-border p-4 flex items-center gap-3">
        <div className="size-9 rounded-full bg-zinc-200 grid place-items-center text-xs font-semibold">BW</div>
        <div className="min-w-0"><div className="text-sm font-medium truncate">Bridal Way</div><div className="text-[11px] brand-muted truncate">Staff Portal</div></div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function OperationsPage() {
  const [fromDate, setFromDate] = useState(today(1));
  const [toDate, setToDate] = useState(today(4));
  const [dresses, setDresses] = useState([]);
  const [dressLoading, setDressLoading] = useState(true);
  const [dressError, setDressError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [addDressOpen, setAddDressOpen] = useState(false);
  const [dressSearch, setDressSearch] = useState("");

  const fetchDresses = useCallback(async () => {
    setDressLoading(true); setDressError(null);
    try { setDresses(await api.inventory.list()); }
    catch (e) { setDressError(e.message); toast.error("Failed to load inventory", e.message); }
    finally { setDressLoading(false); }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try { setBookings(await api.bookings.list()); }
    catch (e) { toast.error("Failed to load bookings", e.message); }
    finally { setBookingsLoading(false); }
  }, []);

  useEffect(() => { fetchDresses(); fetchBookings(); }, [fetchDresses, fetchBookings]);

  const filteredDresses = useMemo(() =>
    dresses.filter(d => !dressSearch || d.name.toLowerCase().includes(dressSearch.toLowerCase()) || d.sku.toLowerCase().includes(dressSearch.toLowerCase())),
    [dresses, dressSearch]
  );

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      toast.success("Status updated");
      fetchBookings();
    } catch (e) { toast.error("Update failed", e.message); }
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <PageHeader
        eyebrow="Staff Operations"
        title="Inventory & Booking"
        desc="Search dresses, create bookings, manage the rental ledger."
        action={<Button onClick={() => setAddDressOpen(true)} className="gap-2 shrink-0"><Plus className="size-4" /> Add Dress</Button>}
      />

      {/* Date range picker */}
      <section className="rounded-xl border brand-border brand-card p-4 sm:p-5 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider brand-muted">From</Label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider brand-muted">To</Label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-11" />
          </div>
          <Button size="lg" className="h-11 gap-2" onClick={() => toast.success("Range set", `${fromDate} → ${toDate}`)}>
            <Search className="size-4" /> Check Availability
          </Button>
        </div>
      </section>

      {/* Dress table */}
      <section className="mb-10 rounded-xl border brand-border brand-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b brand-border gap-4">
          <div>
            <h2 className="text-base font-semibold">Dress Collection</h2>
            <p className="text-xs brand-muted mt-0.5">{dresses.length} pieces — click a row to book</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search name or SKU…" value={dressSearch} onChange={e => setDressSearch(e.target.value)} className="h-9 w-52 text-xs" />
            <Button variant="ghost" size="icon" onClick={fetchDresses}><RefreshCw className={cn("size-4", dressLoading && "animate-spin")} /></Button>
          </div>
        </div>
        {dressLoading ? (
          <div className="p-8 text-center"><Loader2 className="size-6 animate-spin mx-auto brand-muted" /></div>
        ) : dressError ? (
          <div className="p-6"><ErrorState msg={dressError} onRetry={fetchDresses} /></div>
        ) : filteredDresses.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="size-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm brand-muted">{dressSearch ? "No dresses match search" : "No dresses yet"}</p>
            {!dressSearch && <Button onClick={() => setAddDressOpen(true)} className="gap-2 mt-4"><Plus className="size-4" />Add First Dress</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/50 text-[10px] uppercase tracking-[0.14em] brand-muted border-b brand-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">SKU</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price / Day</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y brand-border">
                {filteredDresses.map(d => (
                  <tr key={d.id} className={cn("transition-colors", d.status === "active" ? "hover:bg-zinc-50/40 cursor-pointer" : "opacity-50")}>
                    <td className="px-5 py-3 font-mono text-xs brand-muted">{d.sku}</td>
                    <td className="px-5 py-3 font-medium text-black">{d.name}</td>
                    <td className="px-5 py-3 brand-muted">{d.category}</td>
                    <td className="px-5 py-3 tabular-nums font-semibold">{fmt(d.base_rental_price)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={d.status === "active" ? "success" : "neutral"} label={d.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {d.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => { setSelected(d); setBookingOpen(true); }} className="text-xs gap-1">
                          <Plus className="size-3" /> Book
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bookings ledger */}
      <section className="rounded-xl border brand-border brand-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b brand-border">
          <div>
            <h2 className="text-base font-semibold">Rental Ledger</h2>
            <p className="text-xs brand-muted mt-0.5">{bookings.length} total bookings</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchBookings}><RefreshCw className={cn("size-4", bookingsLoading && "animate-spin")} /></Button>
        </div>
        {bookingsLoading ? (
          <div className="p-8 text-center"><Loader2 className="size-6 animate-spin mx-auto brand-muted" /></div>
        ) : bookings.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays className="size-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm brand-muted">No bookings yet. Book a dress above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/50 text-[10px] uppercase tracking-[0.14em] brand-muted border-b brand-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Dress</th>
                  <th className="px-5 py-3 font-semibold">Period</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount</th>
                  <th className="px-5 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y brand-border">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-black">{b.customer_name}</div>
                      <div className="text-xs brand-muted">{b.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-black">{b.dress_name || "—"}</div>
                      <div className="text-xs font-mono brand-muted">{b.dress_sku}</div>
                    </td>
                    <td className="px-5 py-3 text-xs brand-muted tabular-nums">
                      {b.start_date} → {b.end_date}
                    </td>
                    <td className="px-5 py-3">
                      {b.ledger ? <StatusBadge tone={paymentTone(b.ledger.payment_status)} label={b.ledger.payment_status} /> : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={rentalTone(b.status)} label={b.status} />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {b.ledger ? (
                        <>
                          <div className="font-semibold">{fmt(b.ledger.total_amount)}</div>
                          <div className="text-[11px] brand-muted">rem {fmt(b.ledger.remaining_balance)}</div>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Select
                        className="text-xs h-8 w-28"
                        value={b.status}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                      >
                        <option value="reserved">Reserved</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="returned">Returned</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BookingSheet dress={selected} fromDate={fromDate} toDate={toDate} open={bookingOpen} onClose={() => setBookingOpen(false)} onBooked={() => { fetchBookings(); }} />
      <AddDressModal open={addDressOpen} onClose={() => setAddDressOpen(false)} onCreated={(d) => setDresses(p => [d, ...p])} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════
function SchedulePage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setBookings(await api.bookings.list()); }
      catch (e) { toast.error("Failed", e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const now = new Date();
  now.setMonth(now.getMonth() + monthOffset);
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  // Active (non-cancelled) bookings only
  const active = bookings.filter(b => b.status !== "cancelled");

  const bookingsForDay = (day) => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return active.filter(b => b.start_date <= d && b.end_date >= d);
  };

  const upcoming = active
    .filter(b => b.start_date >= today())
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 8);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <PageHeader eyebrow="Daily" title="Schedule" desc="Monthly calendar view of all active bookings." />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Calendar */}
        <div className="rounded-xl border brand-border brand-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b brand-border">
            <h2 className="font-semibold">{monthName} {year}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o - 1)}>←</Button>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(0)}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o + 1)}>→</Button>
            </div>
          </div>
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="size-6 animate-spin mx-auto brand-muted" /></div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider brand-muted py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayBookings = bookingsForDay(day);
                  const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  return (
                    <div key={day} className={cn("min-h-[72px] rounded-lg p-1.5 border", isToday ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-transparent hover:border-zinc-200 hover:bg-zinc-50/50")}>
                      <span className={cn("text-xs font-medium block mb-1", isToday ? "brand-primary-text font-bold" : "brand-muted")}>{day}</span>
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} className="text-[10px] rounded px-1 py-0.5 mb-0.5 truncate font-medium" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning-fg)" }}>
                          {b.customer_name.split(" ")[0]}
                        </div>
                      ))}
                      {dayBookings.length > 2 && <div className="text-[10px] brand-muted">+{dayBookings.length - 2}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming sidebar */}
        <div className="rounded-xl border brand-border brand-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b brand-border">
            <h2 className="font-semibold">Upcoming Pickups</h2>
            <p className="text-xs brand-muted mt-0.5">Next {upcoming.length} bookings</p>
          </div>
          {loading ? <div className="p-6 text-center"><Loader2 className="size-5 animate-spin mx-auto brand-muted" /></div>
            : upcoming.length === 0 ? <div className="p-6 text-center text-sm brand-muted">No upcoming bookings</div>
              : (
                <div className="divide-y brand-border">
                  {upcoming.map(b => (
                    <div key={b.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-black truncate">{b.customer_name}</p>
                          <p className="text-xs brand-muted truncate">{b.dress_name}</p>
                        </div>
                        <StatusBadge tone={rentalTone(b.status)} label={b.status} />
                      </div>
                      <p className="text-xs brand-muted mt-1 tabular-nums">{b.start_date} → {b.end_date}</p>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
function AnalyticsPage() {
  const [bookings, setBookings] = useState([]);
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [b, d] = await Promise.all([api.bookings.list(), api.inventory.list()]);
        setBookings(b); setDresses(d);
      } catch (e) { toast.error("Failed to load analytics", e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const active = bookings.filter(b => b.status !== "cancelled");
    const totalRevenue = active.reduce((s, b) => s + (b.ledger ? Number(b.ledger.total_amount) : 0), 0);
    const collected = active.reduce((s, b) => s + (b.ledger ? Number(b.ledger.advance_paid) : 0), 0);
    const outstanding = active.reduce((s, b) => s + (b.ledger ? Number(b.ledger.remaining_balance) : 0), 0);
    const overdue = bookings.filter(b => b.status === "overdue").length;
    const returned = bookings.filter(b => b.status === "returned").length;

    // Category breakdown
    const catMap = {};
    active.forEach(b => {
      const dress = dresses.find(d => d.id === b.dress_id);
      const cat = dress?.category || "Unknown";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });

    // Payment breakdown
    const payMap = { settled: 0, partial: 0, unpaid: 0 };
    active.forEach(b => { if (b.ledger) payMap[b.ledger.payment_status] = (payMap[b.ledger.payment_status] || 0) + 1; });

    return { totalRevenue, collected, outstanding, overdue, returned, total: active.length, catMap, payMap };
  }, [bookings, dresses]);

  const StatCard = ({ icon: Icon, label, value, sub, tone }) => (
    <div className="brand-card rounded-xl border brand-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs brand-muted uppercase tracking-wider font-semibold">{label}</p>
          <p className={cn("text-2xl font-bold mt-1 tabular-nums", tone === "danger" ? "text-rose-600" : tone === "success" ? "text-emerald-600" : "text-black")}>{value}</p>
          {sub && <p className="text-xs brand-muted mt-1">{sub}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", tone === "danger" ? "bg-red-50" : tone === "success" ? "bg-emerald-50" : "bg-zinc-100")}>
          <Icon className={cn("size-5", tone === "danger" ? "text-rose-500" : tone === "success" ? "text-emerald-500" : "brand-muted")} />
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="size-8 animate-spin brand-muted" /></div>;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <PageHeader eyebrow="Management" title="Analytics" desc="Revenue overview and booking performance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(stats.totalRevenue)} sub={`${stats.total} bookings`} />
        <StatCard icon={CheckCircle2} label="Collected" value={fmt(stats.collected)} tone="success" />
        <StatCard icon={Clock} label="Outstanding" value={fmt(stats.outstanding)} tone={stats.outstanding > 0 ? "danger" : "neutral"} />
        <StatCard icon={AlertCircle} label="Overdue" value={stats.overdue} sub={`${stats.returned} returned`} tone={stats.overdue > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="brand-card rounded-xl border brand-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b brand-border"><h2 className="font-semibold">Bookings by Category</h2></div>
          {Object.keys(stats.catMap).length === 0 ? (
            <div className="p-8 text-center text-sm brand-muted">No data yet</div>
          ) : (
            <div className="p-5 space-y-3">
              {Object.entries(stats.catMap).sort(([, a], [, b]) => b - a).map(([cat, count]) => {
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium">{cat}</span><span className="brand-muted tabular-nums">{count} ({pct}%)</span></div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="brand-card rounded-xl border brand-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b brand-border"><h2 className="font-semibold">Payment Status</h2></div>
          <div className="p-5 space-y-4">
            {[
              { key: "settled", label: "Settled", tone: "success" },
              { key: "partial", label: "Partial", tone: "warning" },
              { key: "unpaid", label: "Unpaid", tone: "danger" },
            ].map(({ key, label, tone }) => {
              const count = stats.payMap[key] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-4">
                  <StatusBadge tone={tone} label={label} />
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-400" : "bg-rose-500")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm tabular-nums brand-muted w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
          <div className="px-5 pb-5 pt-2 border-t brand-border">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-lg font-bold tabular-nums">{dresses.filter(d => d.status === "active").length}</p><p className="text-xs brand-muted">Active Dresses</p></div>
              <div><p className="text-lg font-bold tabular-nums">{stats.total}</p><p className="text-xs brand-muted">Total Bookings</p></div>
              <div><p className="text-lg font-bold tabular-nums">{stats.returned}</p><p className="text-xs brand-muted">Returned</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════
function CustomersPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setBookings(await api.bookings.list()); }
      catch (e) { toast.error("Failed", e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  // Group by phone → dedupe customers
  const customers = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const key = b.customer_phone;
      if (!map[key]) map[key] = { name: b.customer_name, phone: b.customer_phone, bookings: [], totalSpent: 0 };
      map[key].bookings.push(b);
      map[key].totalSpent += b.ledger ? Number(b.ledger.total_amount) : 0;
    });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [bookings]);

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <PageHeader eyebrow="Management" title="Customers" desc="All customers derived from booking history." />

      <div className="brand-card rounded-xl border brand-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b brand-border gap-4">
          <p className="text-sm brand-muted">{filtered.length} customers</p>
          <Input placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)} className="h-9 w-60 text-xs" />
        </div>
        {loading ? (
          <div className="p-10 text-center"><Loader2 className="size-6 animate-spin mx-auto brand-muted" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="size-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm brand-muted">{search ? "No customers match" : "No customers yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/50 text-[10px] uppercase tracking-[0.14em] brand-muted border-b brand-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">Bookings</th>
                  <th className="px-5 py-3 font-semibold">Last Rental</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y brand-border">
                {filtered.map(c => {
                  const last = c.bookings.sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
                  return (
                    <tr key={c.phone} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-black">{c.name}</td>
                      <td className="px-5 py-3 brand-muted tabular-nums">{c.phone}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1">
                          <span className="font-semibold">{c.bookings.length}</span>
                          <span className="brand-muted">rental{c.bookings.length !== 1 ? "s" : ""}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 brand-muted tabular-nums text-xs">
                        {last.dress_name} · {last.start_date}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{fmt(c.totalSpent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 5 — SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsPage() {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retiring, setRetiring] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setDresses(await api.inventory.list()); }
      catch (e) { toast.error("Failed", e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const retireDress = async (id, name) => {
    setRetiring(id);
    try {
      await req("DELETE", `/inventory/${id}`);
      setDresses(p => p.map(d => d.id === id ? { ...d, status: "retired" } : d));
      toast.success("Dress retired", name);
    } catch (e) { toast.error("Failed", e.message); }
    finally { setRetiring(null); }
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <PageHeader eyebrow="Management" title="Settings" desc="Manage inventory status and system configuration." />

      <div className="space-y-6">
        {/* Inventory management */}
        <div className="brand-card rounded-xl border brand-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b brand-border">
            <h2 className="font-semibold">Inventory Management</h2>
            <p className="text-xs brand-muted mt-0.5">Retire dresses that are no longer available for rental</p>
          </div>
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="size-6 animate-spin mx-auto brand-muted" /></div>
          ) : dresses.length === 0 ? (
            <div className="p-8 text-center text-sm brand-muted">No dresses in inventory</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50/50 text-[10px] uppercase tracking-[0.14em] brand-muted border-b brand-border">
                  <tr>
                    <th className="px-5 py-3 font-semibold">SKU</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Price/Day</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y brand-border">
                  {dresses.map(d => (
                    <tr key={d.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs brand-muted">{d.sku}</td>
                      <td className="px-5 py-3 font-medium text-black">{d.name}</td>
                      <td className="px-5 py-3 brand-muted">{d.category}</td>
                      <td className="px-5 py-3 tabular-nums">{fmt(d.base_rental_price)}</td>
                      <td className="px-5 py-3"><StatusBadge tone={d.status === "active" ? "success" : "neutral"} label={d.status} /></td>
                      <td className="px-5 py-3 text-right">
                        {d.status === "active" && (
                          <Button variant="danger" size="sm" className="text-xs" disabled={retiring === d.id} onClick={() => retireDress(d.id, d.name)}>
                            {retiring === d.id ? <Loader2 className="size-3 animate-spin" /> : "Retire"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System info */}
        <div className="brand-card rounded-xl border brand-border shadow-sm p-5">
          <h2 className="font-semibold mb-4">System Info</h2>
          <div className="space-y-3 text-sm">
            {[
              ["App", "Bridal Way Atelier Suite"],
              ["Backend", "FastAPI + PostgreSQL (Neon)"],
              ["Version", "0.1.0"],
              ["API Base", "http://127.0.0.1:8000/api"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b brand-border last:border-0">
                <span className="brand-muted">{k}</span>
                <span className="font-medium font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [path, setPath] = useState("/");
  const Page = {
    "/": OperationsPage,
    "/schedule": SchedulePage,
    "/analytics": AnalyticsPage,
    "/customers": CustomersPage,
    "/settings": SettingsPage,
  }[path] || OperationsPage;

  return (
    <>
      <style>{themeStyles}</style>
      <ToastProvider />
      <div className="flex min-h-screen bg-[var(--bg-main)]">
        <Sidebar path={path} setPath={setPath} />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          <Page />
        </main>
      </div>
    </>
  );
}
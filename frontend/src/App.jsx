import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  MoreHorizontal,
  ArrowUpDown,
  LayoutGrid,
  CalendarRange,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  X,
  CheckCircle2,
  CalendarDays,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { api } from "./api";

// --- CSS Variables & Theme ---
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
  body {
    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
  }
  .brand-primary { background-color: var(--primary); color: var(--primary-fg); }
  .brand-primary-text { color: var(--primary); }
  .brand-card { background-color: var(--bg-card); border-color: var(--border-color); }
  .brand-border { border-color: var(--border-color); }
  .brand-muted { color: var(--text-muted); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
`;

// --- Utilities ---
function cn(...classes) { return classes.filter(Boolean).join(" "); }
function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// --- Toast ---
let toastListener = null;
const toast = {
  success: (title, desc) => toastListener?.({ title, desc, type: "success" }),
  error: (title, desc) => toastListener?.({ title, desc, type: "error" }),
};

function ToastProvider() {
  const [current, setCurrent] = useState(null);
  useEffect(() => {
    toastListener = (t) => {
      setCurrent(t);
      setTimeout(() => setCurrent(null), 3500);
    };
    return () => { toastListener = null; };
  }, []);
  if (!current) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-xl">
      {current.type === "success"
        ? <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
        : <AlertCircle className="size-5 text-red-400 shrink-0" />}
      <div>
        <p className="text-sm font-medium">{current.title}</p>
        {current.desc && <p className="text-xs text-zinc-400">{current.desc}</p>}
      </div>
    </div>
  );
}

// --- UI Components ---
const Button = React.forwardRef(({ className, variant = "primary", size = "default", ...props }, ref) => {
  const variants = {
    primary: "brand-primary hover:opacity-90 shadow-sm",
    outline: "border brand-border bg-transparent hover:bg-zinc-100 brand-muted hover:text-black",
    ghost: "bg-transparent hover:bg-zinc-100 brand-muted hover:text-black",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-8 w-8",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant], sizes[size], className
      )}
      {...props}
    />
  );
});

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border brand-border bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />
));

// --- Status Badges ---
function StatusBadge({ tone, label }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border";
  const styles = {
    success: "border-[var(--success-bg)] bg-[var(--success-bg)] text-[var(--success-fg)]",
    warning: "border-[var(--warning-bg)] bg-[var(--warning-bg)] text-[var(--warning-fg)]",
    danger: "border-[var(--danger-bg)] bg-[var(--danger-bg)] text-[var(--danger-fg)]",
    neutral: "border-[var(--neutral-bg)] bg-[var(--neutral-bg)] text-[var(--neutral-fg)]",
  };
  return <span className={cn(base, styles[tone] || styles.neutral)}>{label}</span>;
}

const dressStatusTone = (s) => s === "active" ? "success" : "neutral";
const paymentTone = (s) => s === "settled" ? "success" : s === "partial" ? "warning" : "danger";
const rentalTone = (s) => {
  if (s === "returned") return "success";
  if (s === "reserved") return "warning";
  if (s === "overdue") return "danger";
  return "neutral";
};

// --- Add Dress Modal ---
function AddDressModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({
    name: "", sku: "", category: "", base_rental_price: "", image_url: ""
  });
  const [loading, setLoading] = useState(false);

  const CATEGORIES = ["Classic", "Modern", "Boho", "Princess", "Minimalist", "Other"];

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.category || !form.base_rental_price) {
      toast.error("Missing fields", "Fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const dress = await api.inventory.create({
        ...form,
        base_rental_price: parseFloat(form.base_rental_price),
        image_url: form.image_url || null,
      });
      toast.success("Dress added", `${dress.name} (${dress.sku}) added to inventory.`);
      onCreated(dress);
      onOpenChange(false);
      setForm({ name: "", sku: "", category: "", base_rental_price: "", image_url: "" });
    } catch (err) {
      toast.error("Failed to add dress", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="brand-card rounded-xl border brand-border shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b brand-border">
            <h2 className="text-lg font-semibold">Add Dress to Inventory</h2>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="size-5" />
            </Button>
          </div>
          <form id="add-dress-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Dress Name *</Label>
                <Input placeholder="A-Line Lace Gown" value={form.name} onChange={e => set("name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>SKU *</Label>
                <Input placeholder="BW-006" value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} required />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <select
                  className="flex h-10 w-full rounded-md border brand-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800"
                  value={form.category}
                  onChange={e => set("category", e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Daily Rental Price (₹) *</Label>
                <Input
                  type="number" min="0" step="0.01"
                  placeholder="1500.00"
                  value={form.base_rental_price}
                  onChange={e => set("base_rental_price", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Image URL <span className="brand-muted font-normal">(optional)</span></Label>
                <Input
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={e => set("image_url", e.target.value)}
                />
              </div>
            </div>
          </form>
          <div className="p-5 border-t brand-border bg-zinc-50/50">
            <Button type="submit" form="add-dress-form" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {loading ? "Adding…" : "Add Dress"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Booking Sheet (unchanged structure, wired in Part 2) ---
function BookingSheet({ dress, fromDate, toDate, open, onOpenChange, onBook }) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [advance, setAdvance] = useState("");

  if (!open || !dress) return null;

  const d1 = new Date(fromDate);
  const d2 = new Date(toDate);
  const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
  const totalAmount = days * Number(dress.base_rental_price);
  const advanceNum = parseFloat(advance) || 0;
  const remaining = Math.max(0, totalAmount - advanceNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer || !phone) {
      toast.error("Missing details", "Please fill in customer info.");
      return;
    }
    onBook && onBook({ customer, phone, fromDate, toDate, dress, totalAmount, advanceNum, remaining });
    onOpenChange(false);
    setCustomer(""); setPhone(""); setAdvance("");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md brand-card shadow-2xl border-l brand-border flex flex-col">
        <div className="flex items-center justify-between p-5 border-b brand-border">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">New Booking</h2>
            <p className="brand-muted text-xs uppercase tracking-wider mt-1">{dress.sku}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex gap-4 mb-8">
            <div className="w-24 h-32 rounded-md bg-zinc-100 overflow-hidden shrink-0">
              {dress.image_url
                ? <img src={dress.image_url} alt={dress.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">No image</div>}
            </div>
            <div>
              <h3 className="font-medium">{dress.name}</h3>
              <p className="text-sm brand-muted mt-1">{dress.category}</p>
              <div className="mt-3 font-mono text-sm bg-zinc-100 inline-block px-2 py-1 rounded">
                ₹{Number(dress.base_rental_price).toLocaleString()} / day
              </div>
            </div>
          </div>
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider brand-muted">Rental Period</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border brand-border bg-zinc-50/50">
                <CalendarDays className="size-4 brand-muted" />
                <div className="text-sm font-medium">
                  {fromDate} <span className="brand-muted font-normal mx-2">to</span> {toDate}
                </div>
                <div className="ml-auto text-xs brand-muted">({days} days)</div>
              </div>
            </div>
            <div className="grid gap-4">
              <Label className="text-xs uppercase tracking-wider brand-muted">Customer Details</Label>
              <Input placeholder="Full Name" value={customer} onChange={e => setCustomer(e.target.value)} required />
              <Input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="pt-4 border-t brand-border">
              <Label className="text-xs uppercase tracking-wider brand-muted mb-4 block">Payment Split</Label>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="brand-muted">Total Amount</span>
                  <span className="font-semibold tabular-nums">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="brand-muted">Advance</span>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-2 text-zinc-500">₹</span>
                    <Input type="number" min="0" max={totalAmount} className="pl-7 text-right" placeholder="0" value={advance} onChange={e => setAdvance(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t brand-border">
                  <span className="font-medium">Remaining Balance</span>
                  <span className="font-semibold text-rose-600 tabular-nums">₹{remaining.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="p-5 border-t brand-border bg-zinc-50/50">
          <p className="text-xs brand-muted mb-3 text-center">
            ⚡ Part 2 will wire this to the real bookings API
          </p>
          <Button type="submit" form="booking-form" className="w-full">
            Confirm Booking
          </Button>
        </div>
      </div>
    </>
  );
}

// --- Sidebar ---
function AppSidebar({ currentPath, setCurrentPath }) {
  const nav = [
    { to: "/", label: "Operations", icon: LayoutGrid, group: "Daily" },
    { to: "/schedule", label: "Schedule", icon: CalendarRange, group: "Daily" },
    { to: "/admin", label: "Analytics", icon: BarChart3, group: "Management" },
    { to: "/customers", label: "Customers", icon: Users, group: "Management" },
    { to: "/settings", label: "Settings", icon: Settings, group: "Management" },
  ];
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r brand-border brand-card sticky top-0 h-screen">
      <div className="px-6 py-6 border-b brand-border">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentPath("/")}>
          <span className="grid size-9 place-items-center rounded-lg brand-primary">
            <Sparkles className="size-4" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Bridal Way</span>
            <span className="text-[10px] uppercase tracking-[0.18em] brand-muted">Atelier Suite</span>
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {["Daily", "Management"].map(group => (
          <div key={group}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] brand-muted">{group}</div>
            <ul className="space-y-0.5">
              {nav.filter(n => n.group === group).map(n => {
                const active = currentPath === n.to;
                const Icon = n.icon;
                return (
                  <li key={n.to}>
                    <button
                      onClick={() => setCurrentPath(n.to)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active ? "bg-[var(--primary)] text-[var(--primary-fg)] font-medium" : "hover:bg-zinc-100 brand-muted hover:text-black"
                      )}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{n.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t brand-border p-4 flex items-center gap-3">
        <div className="size-9 rounded-full bg-zinc-200 grid place-items-center text-xs font-semibold">EM</div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Elena Moretti</div>
          <div className="text-[11px] brand-muted truncate">Senior Stylist</div>
        </div>
      </div>
    </aside>
  );
}

// --- Operations Page (real API) ---
function OperationsPage() {
  const [fromDate, setFromDate] = useState(today(2));
  const [toDate, setToDate] = useState(today(5));
  const [selected, setSelected] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [addDressOpen, setAddDressOpen] = useState(false);

  // Real data states
  const [dresses, setDresses] = useState([]);
  const [dressLoading, setDressLoading] = useState(true);
  const [dressError, setDressError] = useState(null);

  // Orders still local until Part 2
  const [orders, setOrders] = useState([]);

  const fetchDresses = useCallback(async () => {
    setDressLoading(true);
    setDressError(null);
    try {
      const data = await api.inventory.list({ status: "active" });
      setDresses(data);
    } catch (err) {
      setDressError(err.message);
      toast.error("Failed to load inventory", err.message);
    } finally {
      setDressLoading(false);
    }
  }, []);

  useEffect(() => { fetchDresses(); }, [fetchDresses]);

  const counts = useMemo(() => ({
    active: dresses.filter(d => d.status === "active").length,
    retired: dresses.filter(d => d.status === "retired").length,
  }), [dresses]);

  const handleDressCreated = (dress) => {
    setDresses(prev => [dress, ...prev]);
  };

  const handleBook = (data) => {
    // Part 2: real API call here
    const newOrder = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      customer: data.customer,
      phone: data.phone,
      dressName: data.dress.name,
      sku: data.dress.sku,
      pickup: data.fromDate,
      return: data.toDate,
      payment: data.remaining === 0 ? "settled" : "partial",
      rental: "reserved",
      total: data.totalAmount,
      paid: data.advanceNum,
    };
    setOrders(prev => [newOrder, ...prev]);
    toast.success("Booking confirmed!", `${data.dress.name} reserved for ${data.customer}.`);
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] brand-primary-text mb-1">Staff Operations</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">Inventory & Booking</h1>
          <p className="text-sm brand-muted mt-1 max-w-xl">
            Search availability, reserve gowns, and keep the daily rental ledger up to date.
          </p>
        </div>
        <Button onClick={() => setAddDressOpen(true)} className="gap-2 shrink-0">
          <Plus className="size-4" /> Add Dress
        </Button>
      </header>

      {/* Availability Search */}
      <section className="rounded-xl border brand-border brand-card p-4 sm:p-5 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="from" className="text-xs font-bold uppercase tracking-wider brand-muted">From date</Label>
            <Input id="from" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to" className="text-xs font-bold uppercase tracking-wider brand-muted">To date</Label>
            <Input id="to" type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-11" />
          </div>
          <Button size="lg" className="h-11 gap-2" onClick={() => {
            toast.success("Date range set", `Checking availability ${fromDate} → ${toDate}`);
          }}>
            <Search className="size-4" /> Check availability
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs brand-muted">
          <span className="font-medium text-black">Inventory:</span>
          <StatusBadge tone="success" label={`${counts.active} Active`} />
          <StatusBadge tone="neutral" label={`${counts.retired} Retired`} />
        </div>
      </section>

      {/* Inventory Grid */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Dress collection</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs brand-muted tabular-nums font-medium">{dresses.length} pieces</span>
            <Button variant="ghost" size="icon" onClick={fetchDresses} title="Refresh">
              <RefreshCw className={cn("size-4", dressLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Loading */}
        {dressLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border brand-border bg-zinc-100 animate-pulse aspect-[4/6]" />
            ))}
          </div>
        )}

        {/* Error */}
        {dressError && !dressLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="size-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">Could not load inventory</p>
            <p className="text-xs text-red-500 mt-1 mb-3">{dressError}</p>
            <Button variant="outline" size="sm" onClick={fetchDresses}>Retry</Button>
          </div>
        )}

        {/* Empty */}
        {!dressLoading && !dressError && dresses.length === 0 && (
          <div className="rounded-xl border-2 border-dashed brand-border p-10 text-center">
            <Sparkles className="size-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium brand-muted">No dresses in inventory yet</p>
            <p className="text-xs brand-muted mt-1 mb-4">Add your first dress to get started</p>
            <Button onClick={() => setAddDressOpen(true)} className="gap-2">
              <Plus className="size-4" /> Add First Dress
            </Button>
          </div>
        )}

        {/* Grid */}
        {!dressLoading && !dressError && dresses.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            {dresses.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => { setSelected(d); setBookingOpen(true); }}
                disabled={d.status !== "active"}
                className="group text-left rounded-xl border brand-border brand-card p-3 hover:border-[var(--primary)] hover:shadow-md transition-all disabled:opacity-50 disabled:hover:border-[var(--border-color)] disabled:hover:shadow-none disabled:cursor-not-allowed"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-zinc-100">
                  {d.image_url
                    ? <img src={d.image_url} alt={d.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    : <div className="h-full w-full flex items-center justify-center text-zinc-300">
                      <Sparkles className="size-8" />
                    </div>}
                  <div className="absolute top-2 left-2">
                    <StatusBadge tone={dressStatusTone(d.status)} label={d.status} />
                  </div>
                </div>
                <div className="pt-3 px-1 pb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wider brand-muted">{d.sku}</div>
                    <div className="text-sm font-semibold text-black truncate mt-0.5">{d.name}</div>
                    <div className="text-xs brand-muted truncate mt-0.5">{d.category}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider brand-muted">/day</div>
                    <div className="text-sm font-semibold tabular-nums mt-0.5">
                      ₹{Number(d.base_rental_price).toLocaleString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Orders Table — real data wired in Part 2 */}
      <section className="rounded-xl border brand-border brand-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b brand-border">
          <div>
            <h2 className="text-base font-semibold">Active rental ledger</h2>
            <p className="text-xs brand-muted mt-0.5">Today's operations — payment & rental status</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <ArrowUpDown className="size-3.5" /> Sort
          </Button>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarDays className="size-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm brand-muted">No bookings yet.</p>
            <p className="text-xs brand-muted mt-1">Part 2 will load real bookings from the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/50 text-[10px] uppercase tracking-[0.14em] brand-muted font-semibold border-b brand-border">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Dress</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Rental</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y brand-border">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs brand-muted">#{o.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-sm text-black">{o.customer}</div>
                      <div className="text-xs brand-muted">{o.phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-black">{o.dressName}</div>
                      <div className="text-xs brand-muted font-mono mt-0.5">{o.sku} · {o.pickup} → {o.return}</div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge tone={paymentTone(o.payment)} label={o.payment} /></td>
                    <td className="px-5 py-3"><StatusBadge tone={rentalTone(o.rental)} label={o.rental} /></td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      <div className="text-sm font-semibold">₹{o.total.toLocaleString()}</div>
                      <div className="text-[11px] brand-muted">paid ₹{o.paid.toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BookingSheet
        dress={selected}
        fromDate={fromDate}
        toDate={toDate}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onBook={handleBook}
      />
      <AddDressModal
        open={addDressOpen}
        onOpenChange={setAddDressOpen}
        onCreated={handleDressCreated}
      />
    </div>
  );
}

// --- Placeholders ---
function AdminPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="text-center">
        <BarChart3 className="size-12 mx-auto mb-4 text-zinc-300" />
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-2">Coming in Part 5.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState("/");
  return (
    <>
      <style>{themeStyles}</style>
      <ToastProvider />
      <div className="flex min-h-screen bg-[var(--bg-main)]">
        <AppSidebar currentPath={currentPath} setCurrentPath={setCurrentPath} />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto">
          {currentPath === "/" ? <OperationsPage /> : <AdminPage />}
        </main>
      </div>
    </>
  );
}
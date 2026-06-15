import React, { useState, useMemo, useEffect } from "react";
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
  CalendarDays
} from "lucide-react";

// --- CSS Variables & Theme Injection ---
// Injecting the custom Bridal Way "Elegant Utility" theme
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
  
  /* Scrollbar hidden for cleaner UI */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
`;

// --- Utility Functions ---
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// --- Mock Data ---
const dresses = [
  { id: 1, sku: 'BW-001', name: 'A-Line Lace Gown', category: 'Classic', size: 'M', dailyRate: 150, status: 'available', image: 'https://images.unsplash.com/photo-1594552072238-18e244bfa254?auto=format&fit=crop&q=80&w=640' },
  { id: 2, sku: 'BW-002', name: 'Mermaid Silk Slip', category: 'Modern', size: 'S', dailyRate: 200, status: 'reserved', image: 'https://images.unsplash.com/photo-1578342416997-7f97cb56241e?auto=format&fit=crop&q=80&w=640' },
  { id: 3, sku: 'BW-003', name: 'Ballgown Tulle', category: 'Classic', size: 'L', dailyRate: 180, status: 'rented', image: 'https://images.unsplash.com/photo-1546804784-816d99db82cc?auto=format&fit=crop&q=80&w=640' },
  { id: 4, sku: 'BW-004', name: 'Boho Chiffon Flare', category: 'Boho', size: 'M', dailyRate: 120, status: 'available', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80&w=640' },
  { id: 5, sku: 'BW-005', name: 'Satin Minimalist', category: 'Modern', size: 'XS', dailyRate: 160, status: 'available', image: 'https://images.unsplash.com/photo-1596450514735-111a2fe02935?auto=format&fit=crop&q=80&w=640' },
];

const initialOrders = [
  { id: '1042', customer: 'Sarah Jenkins', phone: '+1 555-0100', dressName: 'A-Line Lace Gown', sku: 'BW-001', pickup: '2026-06-16', return: '2026-06-19', payment: 'Partial', rental: 'Reserved', total: 450, paid: 150 },
  { id: '1041', customer: 'Emily Chen', phone: '+1 555-0201', dressName: 'Mermaid Silk Slip', sku: 'BW-002', pickup: '2026-06-14', return: '2026-06-17', payment: 'Paid', rental: 'Rented', total: 600, paid: 600 },
  { id: '1040', customer: 'Chloe Davis', phone: '+1 555-0399', dressName: 'Ballgown Tulle', sku: 'BW-003', pickup: '2026-06-10', return: '2026-06-13', payment: 'Unpaid', rental: 'Overdue', total: 540, paid: 0 },
];

// --- Simple Toast System ---
let toastListener = null;
const toast = {
  success: (title, desc) => toastListener && toastListener({ title, desc, type: 'success' }),
  error: (title, desc) => toastListener && toastListener({ title, desc, type: 'error' }),
};

function ToastProvider() {
  const [current, setCurrent] = useState(null);
  
  useEffect(() => {
    toastListener = (t) => {
      setCurrent(t);
      setTimeout(() => setCurrent(null), 3000);
    };
    return () => { toastListener = null; };
  }, []);

  if (!current) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-5">
      <CheckCircle2 className="size-5 text-emerald-400" />
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
        variants[variant],
        sizes[size],
        className
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
  <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
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

const dressStatusTone = (status) => {
  if (status === 'available') return 'success';
  if (status === 'reserved') return 'warning';
  return 'neutral';
};

const paymentTone = (status) => {
  if (status === 'Paid') return 'success';
  if (status === 'Partial') return 'warning';
  return 'danger';
};

const rentalTone = (status) => {
  if (status === 'Returned') return 'success';
  if (status === 'Reserved') return 'warning';
  if (status === 'Overdue') return 'danger';
  return 'neutral';
};

// --- Booking Sheet Component ---
function BookingSheet({ dress, fromDate, toDate, open, onOpenChange, onBook }) {
  if (!open || !dress) return null;

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [advance, setAdvance] = useState("");
  
  // Basic date math for preview purposes
  const d1 = new Date(fromDate);
  const d2 = new Date(toDate);
  const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
  const totalAmount = days * dress.dailyRate;
  const advanceNum = parseFloat(advance) || 0;
  const remaining = Math.max(0, totalAmount - advanceNum);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!customer || !phone) {
      toast.error("Missing Details", "Please fill in customer info.");
      return;
    }
    toast.success("Booking Confirmed!", `Reserved ${dress.name} for ${customer}.`);
    onBook && onBook({
       customer, phone, fromDate, toDate, dress, totalAmount, advanceNum, remaining
    });
    onOpenChange(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => onOpenChange(false)} />
      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md brand-card shadow-2xl border-l brand-border flex flex-col animate-in slide-in-from-right-full duration-300">
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
          {/* Dress Summary */}
          <div className="flex gap-4 mb-8">
            <div className="w-24 h-32 rounded-md bg-zinc-100 overflow-hidden shrink-0">
              <img src={dress.image} alt={dress.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-medium">{dress.name}</h3>
              <p className="text-sm brand-muted mt-1">{dress.category} · Size {dress.size}</p>
              <div className="mt-3 font-mono text-sm bg-zinc-100 inline-block px-2 py-1 rounded">
                ${dress.dailyRate} / day
              </div>
            </div>
          </div>

          <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Dates (Read Only) */}
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
              <div className="space-y-2">
                <Input placeholder="Full Name" value={customer} onChange={e => setCustomer(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>

            <div className="pt-4 border-t brand-border">
              <Label className="text-xs uppercase tracking-wider brand-muted mb-4 block">Split Payment Calculator</Label>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="brand-muted">Total Amount</span>
                  <span className="font-semibold tabular-nums">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="brand-muted">Advance Payment</span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-2 text-zinc-500">$</span>
                    <Input type="number" min="0" max={totalAmount} className="pl-7 text-right" placeholder="0.00" value={advance} onChange={e => setAdvance(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t brand-border">
                  <span className="font-medium">Remaining Balance</span>
                  <span className="font-semibold text-rose-600 tabular-nums">${remaining.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t brand-border bg-zinc-50/50">
          <Button type="submit" form="booking-form" className="w-full">
            Confirm Booking
          </Button>
        </div>
      </div>
    </>
  );
}

// --- Main Pages ---

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
            <span className="text-[10px] uppercase tracking-[0.18em] brand-muted">
              Atelier Suite
            </span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {(["Daily", "Management"]).map((group) => (
          <div key={group}>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] brand-muted">
              {group}
            </div>
            <ul className="space-y-0.5">
              {nav.filter((n) => n.group === group).map((n) => {
                const active = currentPath === n.to;
                const Icon = n.icon;
                return (
                  <li key={n.to}>
                    <button
                      onClick={() => setCurrentPath(n.to)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-[var(--primary)] text-[var(--primary-fg)] font-medium opacity-90"
                          : "hover:bg-zinc-100 brand-muted hover:text-black"
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
        <div className="size-9 rounded-full bg-zinc-200 grid place-items-center text-xs font-semibold">
          EM
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Elena Moretti</div>
          <div className="text-[11px] brand-muted truncate">
            Senior Stylist
          </div>
        </div>
      </div>
    </aside>
  );
}

function OperationsPage() {
  const [fromDate, setFromDate] = useState(today(2));
  const [toDate, setToDate] = useState(today(5));
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState(initialOrders);

  const counts = useMemo(
    () => ({
      available: dresses.filter((d) => d.status === "available").length,
      reserved: dresses.filter((d) => d.status === "reserved").length,
      rented: dresses.filter((d) => d.status === "rented").length,
    }),
    []
  );

  const handleBook = (data) => {
     const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000).toString(),
        customer: data.customer,
        phone: data.phone,
        dressName: data.dress.name,
        sku: data.dress.sku,
        pickup: data.fromDate,
        return: data.toDate,
        payment: data.remaining === 0 ? 'Paid' : 'Partial',
        rental: 'Reserved',
        total: data.totalAmount,
        paid: data.advanceNum
     };
     setOrders([newOrder, ...orders]);
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] brand-primary-text mb-1">
            Staff Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black">
            Inventory & Booking
          </h1>
          <p className="text-sm brand-muted mt-1 max-w-xl">
            Search availability, reserve gowns, and keep the daily rental ledger up to date.
          </p>
        </div>
      </header>

      {/* Availability Search */}
      <section className="rounded-xl border brand-border brand-card p-4 sm:p-5 shadow-sm mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Availability refreshed", `Showing dresses free between ${fromDate} and ${toDate}.`);
          }}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 sm:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="from" className="text-xs font-bold uppercase tracking-wider brand-muted">
              From date
            </Label>
            <Input id="from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to" className="text-xs font-bold uppercase tracking-wider brand-muted">
              To date
            </Label>
            <Input id="to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11" />
          </div>
          <Button type="submit" size="lg" className="h-11 gap-2">
            <Search className="size-4" />
            Check availability
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs brand-muted">
          <span className="font-medium text-black">Results:</span>
          <StatusBadge tone="success" label={`${counts.available} Available`} />
          <StatusBadge tone="warning" label={`${counts.reserved} Reserved`} />
          <StatusBadge tone="neutral" label={`${counts.rented} Out`} />
        </div>
      </section>

      {/* Inventory grid */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Available collection</h2>
          <span className="text-xs brand-muted tabular-nums font-medium">
            {dresses.length} pieces
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
          {dresses.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setSelected(d);
                setOpen(true);
              }}
              disabled={d.status !== "available"}
              className="group text-left rounded-xl border brand-border brand-card p-3 hover:border-[var(--primary)] hover:shadow-md transition-all disabled:opacity-50 disabled:hover:border-[var(--border-color)] disabled:hover:shadow-none disabled:cursor-not-allowed"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-zinc-100">
                <img
                  src={d.image}
                  alt={`${d.name} bridal gown`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute top-2 left-2">
                  <StatusBadge tone={dressStatusTone(d.status)} label={d.status} />
                </div>
              </div>
              <div className="pt-3 px-1 pb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider brand-muted">
                    {d.sku}
                  </div>
                  <div className="text-sm font-semibold text-black truncate mt-0.5">
                    {d.name}
                  </div>
                  <div className="text-xs brand-muted truncate mt-0.5">
                    {d.category} · {d.size}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-wider brand-muted">
                    /day
                  </div>
                  <div className="text-sm font-semibold tabular-nums mt-0.5">
                    ${d.dailyRate}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Orders Table */}
      <section className="rounded-xl border brand-border brand-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b brand-border">
          <div>
            <h2 className="text-base font-semibold">Active rental ledger</h2>
            <p className="text-xs brand-muted mt-0.5">
              Today's operations — payment & rental status
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <ArrowUpDown className="size-3.5" /> Sort
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 text-[10px] uppercase tracking-[0.14em] brand-muted font-semibold border-b brand-border">
              <tr>
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Dress</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Rental</th>
                <th className="px-5 py-3 font-semibold text-right">Total</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y brand-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs brand-muted">#{o.id}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-sm text-black">{o.customer}</div>
                    <div className="text-xs brand-muted">{o.phone}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-black">{o.dressName}</div>
                    <div className="text-xs brand-muted font-mono mt-0.5">
                      {o.sku} · {o.pickup} → {o.return}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge tone={paymentTone(o.payment)} label={o.payment} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge tone={rentalTone(o.rental)} label={o.rental} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <div className="text-sm font-semibold">${o.total.toLocaleString()}</div>
                    <div className="text-[11px] brand-muted">paid ${o.paid.toLocaleString()}</div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => toast.success("Action menu opened", "In full build, this opens a dropdown.")}>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <BookingSheet
        dress={selected}
        fromDate={fromDate}
        toDate={toDate}
        open={open}
        onOpenChange={setOpen}
        onBook={handleBook}
      />
    </div>
  );
}

// Admin Placeholder
function AdminPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="text-center">
        <BarChart3 className="size-12 mx-auto mb-4 text-zinc-300" />
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-2">Financial data and top performing dresses view.</p>
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

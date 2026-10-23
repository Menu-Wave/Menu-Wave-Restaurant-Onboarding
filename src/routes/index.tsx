import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChefHat,
  CircleCheck,
  Clock3,
  LayoutDashboard,
  Menu,
  QrCode,
  ScanLine,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { supabase, naira, type Plan } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Menu-Wave — Restaurant ordering, without the chaos" },
      {
        name: "description",
        content:
          "Menu-Wave connects table ordering, restaurant operations and useful business insights in one smooth flow.",
      },
    ],
  }),
  component: Landing,
});

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

const featureLabels: Record<string, string> = {
  ai_analysis: "AI-powered business analysis",
  ai_chatbot: "AI restaurant assistant",
  analytics: "Restaurant analytics",
  advanced_analytics: "Advanced analytics",
  customer_tracking: "Live customer order tracking",
  qr_ordering: "QR table ordering",
  staff_management: "Staff management",
  menu_management: "Menu management",
  kitchen_display: "Kitchen order workflow",
};

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "brand-mark-small" : ""}`} aria-hidden="true">
      <span className="brand-mark-fork">M</span>
      <span className="brand-mark-wave" />
    </span>
  );
}

function Landing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("id, code, name, description, monthly_price_kobo, features, limits, display_order")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="mw-site min-h-screen overflow-x-hidden">
      <header className="mw-nav-wrap">
        <div className="mw-nav">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Menu-Wave home">
            <BrandMark small />
            <span className="text-[17px] font-black tracking-[-0.03em] text-[#191817]">Menu-Wave</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#5d5752] md:flex">
            <a href="#how-it-works" className="mw-nav-link">How it works</a>
            <a href="#solutions" className="mw-nav-link">Solutions</a>
            <a href="#insights" className="mw-nav-link">Insights</a>
            <a href="#pricing" className="mw-nav-link">Pricing</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="mw-button mw-button-ghost">Sign in</Link>
            <Link to="/register" className="mw-button mw-button-primary">Start free <ArrowRight size={16} /></Link>
          </div>

          <button className="mw-mobile-menu md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle navigation">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="mw-mobile-panel md:hidden">
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#solutions" onClick={closeMenu}>Solutions</a>
            <a href="#insights" onClick={closeMenu}>Insights</a>
            <a href="#pricing" onClick={closeMenu}>Pricing</a>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/5 pt-4">
              <Link to="/login" className="mw-button mw-button-ghost justify-center">Sign in</Link>
              <Link to="/register" className="mw-button mw-button-primary justify-center">Start free</Link>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        <section className="mw-hero">
          <div className="mw-hero-glow mw-hero-glow-one" />
          <div className="mw-hero-glow mw-hero-glow-two" />
          <div className="mw-shell mw-hero-grid">
            <motion.div {...reveal} className="relative z-10 max-w-3xl">
              <div className="mw-eyebrow"><Sparkles size={14} /> Built for smoother restaurant service</div>
              <h1 className="mw-display mt-6">
                Stop taking restaurant orders
                <span className="mw-highlight block">the hard way.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#625c57] sm:text-lg sm:leading-8">
                Customers scan, order and track from their table. Your cashier and kitchen receive everything in one connected flow — while every order becomes useful business data.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/register" className="mw-button mw-button-primary mw-button-lg">Start free for 14 days <ArrowRight size={18} /></Link>
                <a href="#how-it-works" className="mw-button mw-button-soft mw-button-lg">See how it works</a>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[#6f6963]">
                <span className="flex items-center gap-1.5"><Check size={15} className="text-[#d94335]" /> No card required</span>
                <span className="flex items-center gap-1.5"><Check size={15} className="text-[#d94335]" /> Set up in minutes</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.15 }} className="mw-product-stage">
              <div className="mw-phone">
                <div className="mw-phone-top"><span>9:41</span><span className="h-2 w-14 rounded-full bg-black/80" /></div>
                <div className="px-4 pb-4 pt-2">
                  <div className="flex items-start justify-between">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a928b]">Kemi’s Kitchen · Table 7</p><h3 className="mt-1 text-lg font-black tracking-tight">Ready to order? 👋</h3></div>
                    <div className="rounded-full bg-[#fff1e6] p-2 text-[#d94335]"><UtensilsCrossed size={16} /></div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-[#1b1918] p-4 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/55">Popular today</p>
                    <p className="mt-1 text-base font-extrabold">Jollof & grilled chicken</p>
                    <p className="mt-1 text-xs text-white/60">Freshly prepared · ₦6,500</p>
                    <button className="mt-3 rounded-full bg-[#f2b84b] px-3 py-1.5 text-[11px] font-extrabold text-[#201a12]">Add to order</button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {["Pasta", "Grills", "Drinks", "Sides"].map((item, i) => (
                      <div key={item} className="rounded-xl border border-black/5 bg-white p-2 shadow-[0_8px_22px_rgba(40,25,10,.05)]">
                        <div className={`h-14 rounded-lg ${i % 2 ? "bg-[#f7d8a2]" : "bg-[#f1b59f]"}`} />
                        <p className="mt-2 text-[11px] font-bold">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="mw-floating-card mw-order-card">
                <div className="flex items-center justify-between"><span className="mw-mini-label">NEW ORDER</span><span className="mw-live-dot" /></div>
                <p className="mt-2 text-lg font-black">#MW-0142</p>
                <p className="mt-1 text-xs text-[#77706a]">Table 7 · ₦8,500</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#2d2926]"><ChefHat size={14} className="text-[#d94335]" /> Sent to kitchen <CircleCheck size={14} className="ml-auto text-[#19a66a]" /></div>
              </motion.div>

              <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }} className="mw-floating-card mw-insight-card">
                <div className="flex items-center gap-2 text-xs font-bold text-[#6d665f]"><TrendingUp size={14} className="text-[#d94335]" /> This week</div>
                <p className="mt-2 text-xl font-black">₦482,500</p>
                <p className="mt-1 text-[11px] font-semibold text-[#19a66a]">↑ 12.4% revenue</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="mw-proof-strip">
          <div className="mw-shell grid gap-4 py-6 sm:grid-cols-3">
            <div><strong>One smooth flow</strong><span> from table to kitchen</span></div>
            <div><strong>Live order visibility</strong><span> for customers and staff</span></div>
            <div><strong>Useful restaurant data</strong><span> from every order</span></div>
          </div>
        </section>

        <section className="mw-demo-section" aria-labelledby="demo-title">
          <div className="mw-shell">
            <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
              <span className="mw-kicker">SEE THE FLOW</span>
              <h2 id="demo-title" className="mw-section-title mx-auto">See what happens after a customer <span className="mw-highlight">scans the table.</span></h2>
              <p className="mw-section-copy mx-auto">The customer places the order once. Menu-Wave carries it through the restaurant — without paper tickets, repeated hand-offs or asking a waiter for every update.</p>
            </motion.div>

            <motion.div {...reveal} className="mw-demo-frame mt-12">
              <div className="mw-demo-video-wrap">
                <video className="mw-demo-video" autoPlay muted loop playsInline preload="metadata" aria-label="Customer scanning a restaurant QR code and ordering from a phone">
                  <source src="/menu-wave-order-demo.mp4" type="video/mp4" />
                </video>
                <div className="mw-demo-video-shade" />
                <div className="mw-demo-caption"><span className="mw-demo-pulse" /> Customer scans → browses → places order</div>
              </div>

              <div className="mw-demo-system">
                <div className="mw-demo-system-head"><span>WHAT MENU-WAVE DOES NEXT</span><strong>One order. One live status.</strong></div>
                <div className="mw-demo-route">
                  {[
                    [ShoppingBag, "Order received", "Table 7 · #MW-0142"],
                    [CircleCheck, "Cashier sees it", "No paper hand-off"],
                    [ChefHat, "Kitchen prepares", "Status: Preparing"],
                    [Clock3, "Customer tracks", "Received → Ready"],
                  ].map(([Icon, title, copy], i) => {
                    const I = Icon as typeof ShoppingBag;
                    return <div className="mw-demo-route-item" key={String(title)}><div className="mw-demo-route-icon"><I size={18} /></div><div><strong>{title as string}</strong><span>{copy as string}</span></div>{i < 3 && <ArrowRight className="mw-demo-route-arrow" size={16} />}</div>;
                  })}
                </div>
                <div className="mw-demo-result"><BarChart3 size={18} /><div><strong>And the order becomes business data.</strong><span>Revenue, best sellers, peak periods and order performance build automatically from real activity.</span></div></div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="mw-section mw-section-dark">
          <div className="mw-shell">
            <motion.div {...reveal} className="max-w-3xl">
              <span className="mw-kicker mw-kicker-dark">WHY MENU-WAVE</span>
              <h2 className="mw-section-title text-white">Replace the hand-offs with a <span className="mw-highlight">clearer flow.</span></h2>
              <p className="mw-section-copy text-white/60">Orders should not depend on a waiter carrying information from one person to another. Menu-Wave keeps the order visible from the moment a customer places it.</p>
            </motion.div>

            <motion.div {...reveal} className="mt-12 grid gap-5 lg:grid-cols-2">
              <div className="mw-process-card mw-process-old">
                <div className="flex items-center justify-between"><span className="mw-mini-label text-white/45">TRADITIONAL FLOW</span><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-white/50">More hand-offs</span></div>
                <div className="mt-8 flex flex-wrap items-center gap-2 text-sm font-bold text-white/70">
                  {["Customer", "Waiter", "Paper", "Cashier", "Kitchen", "Waiter"].map((x, i) => <span key={`${x}-${i}`} className="flex items-center gap-2"><span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{x}</span>{i < 5 && <ArrowRight size={14} className="text-white/20" />}</span>)}
                </div>
                <p className="mt-8 max-w-md text-sm leading-6 text-white/45">More opportunities for delays, missed details and customers wondering what is happening with their order.</p>
              </div>
              <div className="mw-process-card mw-process-new">
                <div className="flex items-center justify-between"><span className="mw-mini-label text-[#f7c45f]">WITH MENU-WAVE</span><span className="rounded-full bg-[#f2b84b]/10 px-3 py-1 text-xs font-bold text-[#f7c45f]">One connected flow</span></div>
                <div className="mw-flow-line mt-8">
                  {[
                    [ScanLine, "Scan"], [ShoppingBag, "Order"], [ChefHat, "Prepare"], [Clock3, "Track"],
                  ].map(([Icon, label], i) => {
                    const I = Icon as typeof ScanLine;
                    return <div key={String(label)} className="mw-flow-step"><div className="mw-flow-icon"><I size={19} /></div><span>{label as string}</span>{i < 3 && <span className="mw-flow-connector" />}</div>;
                  })}
                </div>
                <p className="mt-8 max-w-md text-sm leading-6 text-white/60">Customers order directly. Your team sees it. The kitchen prepares it. Everyone follows the same order status.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="solutions" className="mw-section bg-[#fffaf4]">
          <div className="mw-shell">
            <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
              <span className="mw-kicker">THE CUSTOMER EXPERIENCE</span>
              <h2 className="mw-section-title">Ordering that feels <span className="mw-highlight">effortless.</span></h2>
              <p className="mw-section-copy mx-auto">No app download. No waving down a waiter just to place an order. Customers scan, browse, order and follow their meal from their own phone.</p>
            </motion.div>

            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {[
                [QrCode, "01", "Scan", "A table QR opens the restaurant's live Menu-Wave menu."],
                [ShoppingBag, "02", "Choose", "Browse categories, food photos, prices and available items."],
                [CircleCheck, "03", "Order", "Send the order into the restaurant's workflow without another hand-off."],
                [Clock3, "04", "Track", "Follow the order from received to preparing and ready."],
              ].map(([Icon, n, title, copy], i) => {
                const I = Icon as typeof QrCode;
                return (
                  <motion.div {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} key={String(title)} className="mw-experience-card">
                    <div className="flex items-center justify-between"><span className="mw-number">{n as string}</span><I size={20} className="text-[#d94335]" /></div>
                    <h3>{title as string}</h3><p>{copy as string}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mw-section bg-white">
          <div className="mw-shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <motion.div {...reveal}>
              <span className="mw-kicker">RESTAURANT OPERATIONS</span>
              <h2 className="mw-section-title">Your team stays on the <span className="mw-highlight">same page.</span></h2>
              <p className="mw-section-copy">Menu-Wave gives each part of the restaurant the view it needs without exposing unnecessary controls.</p>
              <div className="mt-8 space-y-5">
                {[
                  [LayoutDashboard, "Admin", "Manage menus, staff, tables, QR codes and restaurant settings."],
                  [ShoppingBag, "Cashier", "See incoming orders and keep service moving."],
                  [ChefHat, "Kitchen", "Focus on what needs to be prepared and update order progress."],
                ].map(([Icon, title, copy]) => { const I = Icon as typeof LayoutDashboard; return <div key={String(title)} className="flex gap-4"><div className="mw-feature-icon"><I size={19} /></div><div><h3 className="font-extrabold text-[#201d1b]">{title as string}</h3><p className="mt-1 text-sm leading-6 text-[#716a64]">{copy as string}</p></div></div>; })}
              </div>
            </motion.div>

            <motion.div {...reveal} className="mw-dashboard-mockup">
              <div className="mw-dashboard-sidebar">
                <div className="flex items-center gap-2"><BrandMark small /><span className="hidden text-sm font-black sm:inline">Menu-Wave</span></div>
                <div className="mt-8 space-y-2">{[LayoutDashboard, ShoppingBag, ChefHat, Users, BarChart3].map((Icon, i) => <div key={i} className={`mw-dash-nav ${i === 1 ? "mw-dash-nav-active" : ""}`}><Icon size={16} /><span className="hidden sm:inline">{["Overview", "Orders", "Kitchen", "Staff", "Analytics"][i]}</span></div>)}</div>
              </div>
              <div className="mw-dashboard-content">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#9b938c]">Live orders</p><h3 className="mt-1 text-xl font-black">Good day, Kemi’s Kitchen</h3></div><span className="rounded-full bg-[#edf8f1] px-3 py-1.5 text-xs font-bold text-[#168454]">● Open</span></div>
                <div className="mt-5 grid grid-cols-3 gap-2">{[["12","Active"],["7","Preparing"],["5","Ready"]].map(([v,l]) => <div key={l} className="mw-stat"><strong>{v}</strong><span>{l}</span></div>)}</div>
                <div className="mt-4 space-y-2">{[["#MW-0142","Table 7","Preparing"],["#MW-0141","Table 3","Ready"],["#MW-0140","Table 11","Received"]].map(([id,table,status]) => <div key={id} className="mw-order-row"><div><strong>{id}</strong><span>{table}</span></div><span className={`mw-status mw-status-${status.toLowerCase()}`}>{status}</span></div>)}</div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="insights" className="mw-section mw-insights-section">
          <div className="mw-shell grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...reveal} className="order-2 lg:order-1">
              <div className="mw-analytics-grid">
                <div className="mw-analytics-card mw-analytics-wide"><span>Revenue this week</span><strong>₦482,500</strong><small>↑ 12.4% from last week</small><div className="mw-chart-bars">{[35,48,42,66,58,83,74].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div>
                <div className="mw-analytics-card"><span>Best seller</span><strong className="!text-xl">Jollof Rice</strong><small>86 orders</small></div>
                <div className="mw-analytics-card"><span>Busiest period</span><strong className="!text-xl">7–8 PM</strong><small>Peak demand</small></div>
              </div>
            </motion.div>
            <motion.div {...reveal} className="order-1 lg:order-2">
              <span className="mw-kicker">INSIGHTS, NOT JUST ORDERS</span>
              <h2 className="mw-section-title">Every order tells you <span className="mw-highlight">something.</span></h2>
              <p className="mw-section-copy">Menu-Wave turns everyday restaurant activity into information owners can actually use—what sells, when customers order, how revenue is moving and where operations can improve.</p>
              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#e8ded3] bg-white/70 p-4 text-sm font-semibold text-[#5e5751]"><BarChart3 size={20} className="text-[#d94335]" /> Growth and Pro plans unlock deeper analysis as your restaurant grows.</div>
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="mw-section bg-white">
          <div className="mw-shell">
            <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
              <span className="mw-kicker">SIMPLE MONTHLY PRICING</span>
              <h2 className="mw-section-title">Start simple. <span className="mw-highlight">Grow when you're ready.</span></h2>
              <p className="mw-section-copy mx-auto">Every plan starts with a 14-day free trial. Choose the level that fits your restaurant today.</p>
            </motion.div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {plans.length === 0
                ? [0, 1, 2].map((i) => <div key={i} className="h-[390px] animate-pulse rounded-[28px] bg-[#f5f0eb]" />)
                : plans.map((p, i) => {
                    const featured = p.code === "growth";
                    const enabled = Object.entries(p.features ?? {}).filter(([, value]) => Boolean(value)).slice(0, 6);
                    return (
                      <motion.div {...reveal} transition={{ ...reveal.transition, delay: i * 0.07 }} key={p.id} className={`mw-price-card ${featured ? "mw-price-card-featured" : ""}`}>
                        {featured && <span className="mw-recommended">MOST POPULAR</span>}
                        <div className="flex items-start justify-between gap-3"><div><h3>{p.name}</h3><p>{p.description}</p></div><span className="mw-plan-dot" /></div>
                        <div className="mt-7"><span className="mw-price">{naira(p.monthly_price_kobo / 100)}</span><span className="text-sm font-semibold text-[#817a73]"> / month</span></div>
                        <p className="mt-2 text-xs font-semibold text-[#8c847d]">Up to {Number(p.limits?.menu_items ?? 0)} menu items · {Number(p.limits?.tables ?? 0)} tables</p>
                        <Link to="/register" className={`mw-button mt-7 w-full justify-center ${featured ? "mw-button-primary" : "mw-button-soft"}`}>Start 14-day trial <ArrowRight size={16} /></Link>
                        <div className="mt-7 space-y-3">{enabled.map(([feature]) => <div key={feature} className="flex items-start gap-2.5 text-sm font-medium text-[#5f5954]"><span className="mt-0.5 rounded-full bg-[#fff0e9] p-0.5 text-[#d94335]"><Check size={12} /></span><span className="capitalize">{featureLabels[feature] ?? feature.replaceAll("_", " ")}</span></div>)}</div>
                      </motion.div>
                    );
                  })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mw-final-cta">
            <div className="mw-cta-wave" />
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <span className="mw-kicker mw-kicker-dark">READY WHEN YOU ARE</span>
              <h2 className="mt-5 text-4xl font-black tracking-[-.045em] text-white sm:text-5xl">Ready for a <span className="text-[#f2b84b]">smoother restaurant?</span></h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/60">Set up your restaurant, choose a plan and start your 14-day trial. No card required.</p>
              <Link to="/register" className="mw-button mw-button-gold mw-button-lg mt-8">Set up my restaurant <ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mw-footer">
        <div className="mw-shell flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5"><BrandMark small /><span className="font-black tracking-tight">Menu-Wave</span></div>
          <p className="text-sm text-[#827a74]">A smoother flow for restaurants and their customers.</p>
          <div className="flex gap-5 text-sm font-semibold text-[#6b645e]"><a href="#pricing">Pricing</a><Link to="/login">Sign in</Link></div>
        </div>
      </footer>
    </div>
  );
}

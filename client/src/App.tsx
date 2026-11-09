import {
  useEffect,
  useState,
  createContext,
  useContext,
  FormEvent,
} from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  BookmarkCheck,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  Compass,
  CreditCard,
  HandCoins,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import { api, getToken } from "./api";
import type { User, Coupon, Claim } from "./types";

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});
const useAuth = () => useContext(AuthContext);
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (getToken())
      api<{ user: User }>("/auth/me")
        .then((d) => setUser(d.user))
        .catch(() => localStorage.removeItem("dk_token"));
  }, []);
  const login = async (email: string, password: string) => {
    const d = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("dk_token", d.token);
    setUser(d.user);
  };
  const register = async (name: string, email: string, password: string) => {
    const d = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem("dk_token", d.token);
    setUser(d.user);
  };
  const logout = () => {
    localStorage.removeItem("dk_token");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
function Shell() {
  const { user, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Tag size={19} />
          </span>
          <span>
            deal<span className="brand-accent">kindred</span>
            <small>GOOD DEALS. SHARED HONESTLY.</small>
          </span>
        </Link>
        <button
          className="mobile-menu"
          onClick={() => setMobile(!mobile)}
          aria-label="Toggle menu"
        >
          {mobile ? <X /> : <Menu />}
        </button>
        <nav className={mobile ? "nav open" : "nav"}>
          <NavLink to="/" end onClick={() => setMobile(false)}>
            Explore
          </NavLink>
          <NavLink to="/affiliate" onClick={() => setMobile(false)}>
            Affiliate deals
          </NavLink>
          <NavLink to="/cards" onClick={() => setMobile(false)}>
            Card offers
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" onClick={() => setMobile(false)}>
                My dashboard
              </NavLink>
              <NavLink to="/my-claims" onClick={() => setMobile(false)}>
                My claims
              </NavLink>
            </>
          )}
        </nav>
        <div className="top-actions">
          {user ? (
            <>
              <span className="user-greeting">
                Hi, {user.name.split(" ")[0]}
              </span>
              <button className="icon-button" onClick={logout} title="Sign out">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <Link className="button button-dark button-small" to="/login">
              Sign in <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />
          <Route
            path="/my-claims"
            element={
              <Protected>
                <MyClaims />
              </Protected>
            }
          />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="*" element={<Explore />} />
        </Routes>
      </main>
      <footer>
        <div className="footer-inner">
          <div className="brand footer-brand">
            <span className="brand-mark">
              <Tag size={18} />
            </span>
            <span>
              dealkindred<small>GOOD DEALS. SHARED HONESTLY.</small>
            </span>
          </div>
          <span>Community-powered savings, with a little more trust.</span>
          <span>© {new Date().getFullYear()} DealKindred · Demo project</span>
        </div>
      </footer>
    </div>
  );
}
function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <AuthPage mode="login" />;
}
function PageIntro({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <div className={error ? "notice error" : "notice"}>
      {error ? <X size={17} /> : <CheckCircle2 size={17} />} {message}
    </div>
  );
}
function Explore() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const load = () => {
    setLoading(true);
    api<{ coupons: Coupon[] }>(`/coupons?search=${encodeURIComponent(search)}`)
      .then((d) => setCoupons(d.coupons))
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [search]);
  const claim = async (id: number) => {
    if (!user) {
      setMessage("Sign in to claim a community coupon.");
      return;
    }
    try {
      const d = await api<{ message: string; claimCode: string }>(
        `/claims/coupons/${id}/claim`,
        { method: "POST", body: "{}" },
      );
      setMessage(`${d.message} Code: ${d.claimCode}`);
      load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-pill">
            <Sparkles size={14} /> SAVINGS, WITH A HUMAN TOUCH
          </div>
          <h1>
            Good deals are
            <br />
            <em>better shared.</em>
          </h1>
          <p>
            Discover useful coupons from real people. Claim the ones you love.
            Share the savings, not the spam.
          </p>
          <div className="hero-actions">
            <a href="#discover" className="button button-dark">
              Explore community deals <ArrowRight size={16} />
            </a>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="button button-light"
            >
              <Plus size={16} /> Share a coupon
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck size={16} /> Community posted
            </span>
            <span>
              <BookmarkCheck size={16} /> Claim tracking
            </span>
            <span>
              <HandCoins size={16} /> Honest savings
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="coupon-visual">
            <div className="coupon-top">
              <span>GOOD THINGS INSIDE</span>
              <BadgePercent size={22} />
            </div>
            <strong>
              20<small>%</small>
            </strong>
            <span className="coupon-off">OFF YOUR NEXT FIND</span>
            <div className="coupon-dash"></div>
            <div className="coupon-bottom">
              <span>SHARED WITH CARE</span>
              <span>DK · 2026</span>
            </div>
          </div>
          <div className="float-note note-one">
            <CheckCircle2 size={15} /> Real people. Real deals.
          </div>
          <div className="float-note note-two">
            <Ticket size={16} /> Your next save is here
          </div>
        </div>
      </section>
      <section id="discover" className="content-section">
        <PageIntro
          eyebrow="THE COMMUNITY BOARD"
          title="Find your next little win."
          subtitle="Fresh finds shared by the community. Claim a coupon before someone else does."
        >
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, deal or category"
            />
          </div>
        </PageIntro>
        {message && (
          <Notice
            message={message}
            error={/sign in|cannot|already|sorry|failed/i.test(message)}
          />
        )}
        {loading ? (
          <div className="loading">Finding the good stuff…</div>
        ) : coupons.length ? (
          <div className="coupon-grid">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} onClaim={claim} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Ticket size={28} />
            <h3>No coupons found</h3>
            <p>Try another search, or be the first to share a deal.</p>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="button button-dark"
            >
              Share a coupon
            </Link>
          </div>
        )}
      </section>
      <section className="trust-strip">
        <div>
          <ShieldCheck />
          <strong>Shared by people</strong>
          <span>Community listings, not mystery pop-ups.</span>
        </div>
        <div>
          <Clock3 />
          <strong>Clear expiry dates</strong>
          <span>Know how long you have to claim.</span>
        </div>
        <div>
          <BookmarkCheck />
          <strong>Track your claims</strong>
          <span>Keep your coupon details in one place.</span>
        </div>
      </section>
    </>
  );
}
function CouponCard({
  coupon,
  onClaim,
}: {
  coupon: Coupon;
  onClaim: (id: number) => void;
}) {
  const expiry = new Date(coupon.expiresAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <article className="coupon-card">
      <div className="card-topline">
        <span className="category-tag">{coupon.category}</span>
        <span className="remaining">{coupon.remaining} left</span>
      </div>
      <div className="discount">{coupon.discount}</div>
      <h3>{coupon.title}</h3>
      <div className="brand-name">{coupon.brand}</div>
      <p>{coupon.description}</p>
      <div className="coupon-meta">
        <span>
          <Clock3 size={14} /> Expires {expiry}
        </span>
        <span>By {coupon.ownerName}</span>
      </div>
      <button
        className="button button-dark claim-button"
        onClick={() => onClaim(coupon.id)}
      >
        Claim this deal <ArrowRight size={15} />
      </button>
    </article>
  );
}
function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      nav("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="auth-wrap">
      <div className="auth-art">
        <div className="eyebrow">A BETTER WAY TO SAVE</div>
        <h2>
          Good finds.
          <br />
          <em>Good people.</em>
        </h2>
        <p>
          Be part of a community that shares useful deals and keeps coupon
          claims transparent.
        </p>
        <div className="auth-stat">
          <span>✳</span>
          <div>
            <b>Share what you love.</b>
            <small>Help someone else save today.</small>
          </div>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="eyebrow">
          {mode === "login" ? "WELCOME BACK" : "JOIN THE COMMUNITY"}
        </div>
        <h1>{mode === "login" ? "Sign in" : "Create your account"}</h1>
        <p>
          {mode === "login"
            ? "Your saved deals are waiting."
            : "Start sharing and discovering honest deals."}
        </p>
        {error && <Notice message={error} error />}
        {mode === "register" && (
          <label>
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              placeholder="e.g. Alex Morgan"
            />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </label>
        <button disabled={busy} className="button button-dark full">
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}{" "}
          <ArrowRight size={16} />
        </button>
        <div className="auth-switch">
          {mode === "login" ? "New to DealKindred?" : "Already a member?"}{" "}
          <Link to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </div>
        {mode === "login" && (
          <div className="demo-login">
            <b>Try the demo</b>
            <span>maya@dealkindred.demo</span>
            <span>Password: DemoPass123!</span>
          </div>
        )}
      </form>
    </section>
  );
}
function Dashboard() {
  const [mine, setMine] = useState<Coupon[]>([]);
  const [claims, setClaims] = useState<Record<number, Claim[]>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    code: "",
    description: "",
    terms: "",
    category: "Shopping",
    discount: "",
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    quantity: "10",
  });
  const load = async () => {
    const d = await api<{ coupons: Coupon[] }>("/coupons/mine");
    setMine(d.coupons);
    const pairs = await Promise.all(
      d.coupons.map(
        async (c) =>
          [
            c.id,
            (await api<{ claims: Claim[] }>(`/coupons/${c.id}/claims`)).claims,
          ] as const,
      ),
    );
    setClaims(Object.fromEntries(pairs));
  };
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api("/coupons", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          expiresAt: new Date(form.expiresAt).toISOString(),
          quantity: Number(form.quantity),
        }),
      });
      setMessage("Your coupon has been published.");
      setFormOpen(false);
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const redeem = async (id: number) => {
    try {
      await api(`/claims/${id}/redeem`, { method: "POST", body: "{}" });
      setMessage("Claim marked as redeemed.");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const total = mine.length;
  const claimed = Object.values(claims).flat().length;
  const redeemed = Object.values(claims)
    .flat()
    .filter((c) => c.status === "redeemed").length;
  return (
    <section className="content-section dashboard-section">
      <PageIntro
        eyebrow="YOUR SPACE"
        title="Your deal dashboard."
        subtitle="Publish coupons and keep an eye on every claim."
      />
      <div className="stats-grid">
        <Stat icon={<Ticket />} label="Coupons posted" value={total} />
        <Stat icon={<BookmarkCheck />} label="Total claims" value={claimed} />
        <Stat icon={<CheckCircle2 />} label="Redeemed" value={redeemed} />
      </div>
      {message && (
        <Notice message={message} error={/error|only|failed/i.test(message)} />
      )}
      <div className="section-heading">
        <div>
          <h2>Your coupons</h2>
          <p>See who has claimed your shared deals.</p>
        </div>
        <button
          className="button button-dark"
          onClick={() => setFormOpen(!formOpen)}
        >
          <Plus size={16} />
          {formOpen ? "Close form" : "Post a coupon"}
        </button>
      </div>
      {formOpen && (
        <form className="publish-form" onSubmit={submit}>
          <h3>Share a new coupon</h3>
          <div className="form-grid">
            <label>
              Deal title
              <input
                required
                minLength={4}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Weekend essentials"
              />
            </label>
            <label>
              Brand
              <input
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Brand or store"
              />
            </label>
            <label>
              Coupon code
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SAVE20"
              />
            </label>
            <label>
              Discount
              <input
                required
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="20% OFF"
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {[
                  "Shopping",
                  "Groceries",
                  "Electronics",
                  "Food",
                  "Travel",
                  "Books",
                  "Learning",
                  "Other",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Available claims
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </label>
            <label>
              Starts at
              <input
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </label>
            <label>
              Expires at
              <input
                type="datetime-local"
                required
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
            </label>
            <label className="span-two">
              Description
              <textarea
                required
                minLength={10}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </label>
            <label className="span-two">
              Terms & conditions
              <textarea
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                rows={2}
              />
            </label>
          </div>
          <button disabled={busy} className="button button-dark">
            {busy ? "Publishing…" : "Publish coupon"} <ArrowRight size={15} />
          </button>
        </form>
      )}
      {mine.length === 0 ? (
        <div className="empty-state">
          <Ticket />
          <h3>Your board is waiting</h3>
          <p>Post your first coupon and help someone save.</p>
        </div>
      ) : (
        <div className="owner-list">
          {mine.map((c) => (
            <div className="owner-card" key={c.id}>
              <div className="owner-card-head">
                <div>
                  <span className="category-tag">{c.category}</span>
                  <h3>{c.title}</h3>
                  <p>
                    {c.brand} · {c.discount} · {c.remaining} claims remaining
                  </p>
                </div>
                <span className="owner-quantity">
                  {(claims[c.id] || []).length} claims
                </span>
              </div>
              <div className="claimant-list">
                <b>People who claimed</b>
                {(claims[c.id] || []).length === 0 ? (
                  <span className="muted">No claims yet.</span>
                ) : (
                  (claims[c.id] || []).map((cl) => (
                    <div className="claimant" key={cl.id}>
                      <div className="avatar">
                        {cl.userName?.slice(0, 1) || "U"}
                      </div>
                      <div className="claimant-info">
                        <strong>{cl.userName}</strong>
                        <small>
                          {cl.userEmail} · {cl.claimCode}
                        </small>
                      </div>
                      <span
                        className={
                          cl.status === "redeemed"
                            ? "status status-done"
                            : "status"
                        }
                      >
                        {cl.status}
                      </span>
                      {cl.status === "claimed" && (
                        <button
                          className="button button-outline button-small"
                          onClick={() => redeem(cl.id)}
                        >
                          Mark redeemed
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="stat-card">
      <span>{icon}</span>
      <div>
        <b>{value}</b>
        <small>{label}</small>
      </div>
    </div>
  );
}
function MyClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ claims: Claim[] }>("/claims/mine")
      .then((d) => setClaims(d.claims))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="content-section">
      <PageIntro
        eyebrow="YOUR SAVED DEALS"
        title="My claims."
        subtitle="All your claimed coupons, together in one place."
      />
      {error && <Notice message={error} error />}
      {claims.length === 0 ? (
        <div className="empty-state">
          <BookmarkCheck />
          <h3>No claims yet</h3>
          <p>Explore the community board and claim a deal.</p>
          <Link to="/" className="button button-dark">
            Explore coupons
          </Link>
        </div>
      ) : (
        <div className="claim-grid">
          {claims.map((c) => (
            <div className="claim-saved" key={c.id}>
              <span
                className={
                  c.status === "redeemed" ? "status status-done" : "status"
                }
              >
                {c.status}
              </span>
              <h3>{c.title}</h3>
              <p>
                {c.brand} · {c.discount}
              </p>
              <div className="claim-code">
                <small>YOUR CLAIM CODE</small>
                <b>{c.claimCode}</b>
              </div>
              <small>
                Expires {new Date(c.expiresAt || "").toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
function Affiliate() {
  const [offers, setOffers] = useState<any[]>([]);
  useEffect(() => {
    api<{ offers: any[] }>("/affiliate")
      .then((d) => setOffers(d.offers))
      .catch(() => {});
  }, []);
  return (
    <section className="content-section">
      <PageIntro
        eyebrow="PARTNER PICKS"
        title="Affiliate offers."
        subtitle="A separate shelf for partner promotions. These are not community-posted coupons."
      />
      <div className="affiliate-banner">
        <Sparkles />
        <div>
          <b>Partner promotions, clearly labelled.</b>
          <span>
            Some links may be affiliate links in a production version. This demo
            uses sample destinations.
          </span>
        </div>
      </div>
      <div className="coupon-grid">
        {offers.map((o) => (
          <article className="coupon-card affiliate-card" key={o.id}>
            <span className="category-tag">PARTNER · {o.category}</span>
            <div className="discount">{o.offer}</div>
            <h3>{o.title}</h3>
            <div className="brand-name">{o.partner}</div>
            <p>{o.description}</p>
            <a
              className="button button-dark claim-button"
              href={o.url}
              target="_blank"
              rel="noreferrer"
            >
              Visit partner <ArrowRight size={15} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
function Cards() {
  const [cards, setCards] = useState<any[]>([]);
  const [category, setCategory] = useState("All");
  useEffect(() => {
    api<{ cards: any[] }>("/cards")
      .then((d) => setCards(d.cards))
      .catch(() => {});
  }, []);
  const filtered = cards.filter(
    (c) => category === "All" || c.category === category,
  );
  return (
    <section className="content-section">
      <PageIntro
        eyebrow="SMARTER PAYMENT PICKS"
        title="Card offers."
        subtitle="Sample bank and card promotions to help compare savings by merchant."
      />
      <div className="filter-row">
        <CreditCard />
        <span>Show offers for</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          {Array.from(new Set(cards.map((c) => c.category))).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="card-offer-grid">
        {filtered.map((c) => (
          <article className="bank-card" key={c.id}>
            <div className="bank-card-top">
              <span>{c.bank}</span>
              <CreditCard />
            </div>
            <h3>{c.cardName}</h3>
            <div className="bank-offer">{c.offer}</div>
            <div className="bank-card-bottom">
              <span>AT {c.merchant.toUpperCase()}</span>
              <span>{c.category}</span>
            </div>
          </article>
        ))}
      </div>
      <p className="fine-print">
        Offers shown are illustrative demo data, not verified bank promotions.
        Always check the issuer's current terms.
      </p>
    </section>
  );
}
export default App;

// ═══════════════════════════════════════════════
//  BIBLIOCOINS — Core Data Layer
//  Shared across all pages via localStorage
// ═══════════════════════════════════════════════

const DB_KEY = 'bibliocoins_v1';

// ── DEFAULT STATE ──────────────────────────────
const DEFAULT_STATE = {
  settings: {
    exchangeRate: 500,          // 1 moneda = 500 CLP
    coinName: 'Talento',
    coinSymbol: '◈',
    coinsPerPage: 2,
    rustDays: 7,                // días sin lectura antes de "oxidar"
    rustPercent: 5,             // % de saldo que se pierde
    weeklyThemeGenre: 'Historia',
    weeklyThemeBonus: 2,        // multiplicador extra
    weeklyThemeActive: false,
  },
  children: [],
  transactions: [],
  books: [],
  goals: [],
  missions: [],
  marketItems: [],
  weekCaptain: null,
  communalChest: 0,
  communalChestTarget: 1000,
  lastUpdated: null,
};

// ── STORAGE ────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) };
  } catch { return structuredClone(DEFAULT_STATE); }
}

function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

// ── IDs ────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── CHILD HELPERS ──────────────────────────────
function getChild(state, id) {
  return state.children.find(c => c.id === id);
}

function createChild(name, avatar, color) {
  return {
    id: uid(),
    name,
    avatar: avatar || name[0].toUpperCase(),
    color: color || '#2E5B3C',
    balance: 0,
    totalEarned: 0,
    totalPages: 0,
    level: 1,
    xp: 0,
    contract: 'normal',   // 'easy' | 'normal' | 'hard'
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
}

// ── TRANSACTION ────────────────────────────────
function addTransaction(state, childId, amount, type, description, ref = null) {
  const child = getChild(state, childId);
  if (!child) return;

  child.balance = Math.max(0, child.balance + amount);
  if (amount > 0) child.totalEarned += amount;

  state.transactions.unshift({
    id: uid(),
    childId,
    amount,
    type,      // 'page' | 'bonus' | 'fine' | 'goal' | 'market' | 'rust' | 'heroic' | 'cultural'
    description,
    ref,
    date: new Date().toISOString(),
    balanceAfter: child.balance,
  });
}

// ── COINS PER PAGE (contract) ──────────────────
function getCoinsPerPage(state, child) {
  const base = state.settings.coinsPerPage;
  const mul  = { easy: 0.7, normal: 1, hard: 1.6 }[child.contract] ?? 1;
  return Math.round(base * mul);
}

// ── LEVEL / XP ─────────────────────────────────
function addXP(child, xp) {
  child.xp += xp;
  const needed = child.level * 100;
  if (child.xp >= needed) {
    child.level++;
    child.xp -= needed;
    return true; // leveled up
  }
  return false;
}

// ── RUST CHECK ─────────────────────────────────
function applyRustIfNeeded(state) {
  const now = Date.now();
  state.children.forEach(child => {
    const last = new Date(child.lastActivity).getTime();
    const daysSince = (now - last) / 86400000;
    if (daysSince >= state.settings.rustDays && child.balance > 0) {
      const loss = Math.ceil(child.balance * state.settings.rustPercent / 100);
      if (loss > 0) {
        addTransaction(state, child.id, -loss, 'rust',
          `Oxidación por ${Math.floor(daysSince)} días sin actividad`);
        child.lastActivity = new Date().toISOString(); // reset timer
      }
    }
  });
}

// ── COMMUNAL CHEST ─────────────────────────────
function fillCommunalChest(state, amount) {
  state.communalChest = Math.min(state.communalChestTarget,
    state.communalChest + amount);
}

// ── CAPTAIN OF THE WEEK ────────────────────────
function electCaptain(state) {
  if (state.children.length === 0) return;
  const week = getWeekNumber();
  const tx = state.transactions.filter(t => {
    const d = new Date(t.date);
    return getWeekNumber(d) === week && t.amount > 0;
  });
  const scores = {};
  tx.forEach(t => { scores[t.childId] = (scores[t.childId] || 0) + t.amount; });
  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (winner) state.weekCaptain = winner[0];
}

function getWeekNumber(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// ── FORMAT ─────────────────────────────────────
function formatCoin(n, state) {
  const s = state?.settings?.coinSymbol || '◈';
  return `${s} ${n.toLocaleString('es-CL')}`;
}

function formatCLP(n, state) {
  const rate = state?.settings?.exchangeRate || 500;
  return `$${(n * rate).toLocaleString('es-CL')}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'ahora';
  if (m < 60)  return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

// ── TOAST ──────────────────────────────────────
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── MODAL HELPERS ──────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ── TABS ───────────────────────────────────────
function initTabs(container) {
  const btns   = container.querySelectorAll('.tab-btn');
  const panels = container.querySelectorAll('.tab-panel');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      container.querySelector(`.tab-panel[data-panel="${target}"]`)?.classList.add('active');
    });
  });
  if (btns[0]) btns[0].click();
}

// ── AVATAR COLOR ───────────────────────────────
const AVATAR_COLORS = ['#2E5B3C','#B8973A','#2471A3','#8E44AD','#C0392B','#1ABC9C','#E67E22'];
function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── EXPORT ─────────────────────────────────────
window.BC = {
  loadState, saveState, uid, createChild, getChild,
  addTransaction, getCoinsPerPage, addXP,
  applyRustIfNeeded, fillCommunalChest, electCaptain,
  formatCoin, formatCLP, formatDate, relativeTime,
  showToast, openModal, closeModal, initTabs,
  getAvatarColor, AVATAR_COLORS,
};

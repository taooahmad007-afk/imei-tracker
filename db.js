/**
 * db.js — Local database using localStorage
 * Drop-in replacement: swap these functions with Firebase/Google Sheets calls
 * 
 * Data structure:
 *   imei_db: [ { id, imei, model, owner, contact, date, city, status, submittedAt } ]
 *   imei_stats: { totalChecks, todayChecks, lastReset }
 */

const DB_KEY   = 'imei_db';
const STAT_KEY = 'imei_stats';
const AUTH_KEY = 'imei_admin_session';

// ── ADMIN CREDENTIALS (change these!) ──
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// ── SEED DATA for demo ──
const SEED_DATA = [
  {
    id: 'seed_001',
    imei: '353679100000002',
    model: 'Samsung Galaxy A54',
    owner: 'Ahmed Khan',
    contact: '03001234567',
    date: '2025-03-15',
    city: 'Muzaffarabad',
    status: 'approved',
    submittedAt: new Date('2025-03-15').toISOString()
  },
  {
    id: 'seed_002',
    imei: '490154203237518',
    model: 'iPhone 12',
    owner: 'Bilal Hussain',
    contact: '03451234567',
    date: '2025-04-01',
    city: 'Muzaffarabad',
    status: 'approved',
    submittedAt: new Date('2025-04-01').toISOString()
  },
  {
    id: 'seed_003',
    imei: '012345678901230',
    model: 'Oppo A57',
    owner: 'Tariq Mehmood',
    contact: '03121234567',
    date: '2025-04-10',
    city: 'Rawalakot',
    status: 'pending',
    submittedAt: new Date().toISOString()
  }
];

// ─────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────
function dbInit() {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
  }
  if (!localStorage.getItem(STAT_KEY)) {
    localStorage.setItem(STAT_KEY, JSON.stringify({
      totalChecks: 47,
      todayChecks: 5,
      lastReset: new Date().toDateString()
    }));
  }
  // Auto-reset today's count if new day
  const stats = dbGetStats();
  if (stats.lastReset !== new Date().toDateString()) {
    stats.todayChecks = 0;
    stats.lastReset = new Date().toDateString();
    localStorage.setItem(STAT_KEY, JSON.stringify(stats));
  }
}

// ─────────────────────────────────────────
//  RECORDS
// ─────────────────────────────────────────
function dbGetAll() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function dbSaveAll(records) {
  localStorage.setItem(DB_KEY, JSON.stringify(records));
}

function dbGetApproved() {
  return dbGetAll().filter(r => r.status === 'approved');
}

function dbGetPending() {
  return dbGetAll().filter(r => r.status === 'pending');
}

function dbCheckIMEI(imei) {
  const clean = imei.replace(/\D/g, '');
  const records = dbGetApproved();
  const match = records.find(r => r.imei.replace(/\D/g, '') === clean);
  return match || null;
}

function dbAddRecord(record) {
  const records = dbGetAll();
  const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const newRecord = { id, ...record, submittedAt: new Date().toISOString() };
  records.push(newRecord);
  dbSaveAll(records);
  return id;
}

function dbApproveRecord(id) {
  const records = dbGetAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx > -1) { records[idx].status = 'approved'; dbSaveAll(records); return true; }
  return false;
}

function dbRejectRecord(id) {
  const records = dbGetAll();
  const filtered = records.filter(r => r.id !== id);
  dbSaveAll(filtered);
  return true;
}

function dbDeleteRecord(id) {
  const records = dbGetAll().filter(r => r.id !== id);
  dbSaveAll(records);
}

function dbUpdateRecord(id, updates) {
  const records = dbGetAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx > -1) {
    records[idx] = { ...records[idx], ...updates };
    dbSaveAll(records);
    return true;
  }
  return false;
}

// ─────────────────────────────────────────
//  STATS
// ─────────────────────────────────────────
function dbGetStats() {
  return JSON.parse(localStorage.getItem(STAT_KEY) || '{"totalChecks":0,"todayChecks":0,"lastReset":""}');
}

function dbIncrementCheck() {
  const s = dbGetStats();
  s.totalChecks = (s.totalChecks || 0) + 1;
  s.todayChecks = (s.todayChecks || 0) + 1;
  localStorage.setItem(STAT_KEY, JSON.stringify(s));
}

function dbResetTodayChecks() {
  const s = dbGetStats();
  s.todayChecks = 0;
  localStorage.setItem(STAT_KEY, JSON.stringify(s));
}

// ─────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────
function dbLogin(username, password) {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function dbLogout() {
  sessionStorage.removeItem(AUTH_KEY);
}

// ─────────────────────────────────────────
//  GENERATE ID
// ─────────────────────────────────────────
function generateReportRef() {
  return 'UMZ-' + Date.now().toString(36).toUpperCase();
}

// Initialize on load
dbInit();

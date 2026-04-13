/**
 * app.js — All page logic for IMEI Tracker
 */

// ─────────────────────────────────────────
//  SHARED UTILITIES
// ─────────────────────────────────────────

function formatIMEI(input) {
  let val = input.value.replace(/\D/g, '');
  if (val.length > 15) val = val.slice(0, 15);
  input.value = val;
  // Update counter on main page
  const counter = document.getElementById('charCount');
  if (counter) counter.textContent = val.length;
}

function validateIMEI(imei) {
  const digits = imei.replace(/\D/g, '');
  return digits.length === 15;
}

// Luhn algorithm check (optional strictness)
function luhnCheck(imei) {
  let sum = 0;
  let alternate = false;
  for (let i = imei.length - 1; i >= 0; i--) {
    let n = parseInt(imei[i]);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { year:'numeric', month:'short', day:'numeric' });
}

// ─────────────────────────────────────────
//  INDEX PAGE — IMEI CHECKER
// ─────────────────────────────────────────

let lastCheckedIMEI = '';
let lastResult = null;

function checkIMEI() {
  const input = document.getElementById('imeiInput');
  if (!input) return;
  const imei = input.value.replace(/\D/g, '');

  if (!imei) {
    shakeInput(input);
    showToast('Please enter an IMEI number / IMEI نمبر درج کریں');
    return;
  }
  if (!validateIMEI(imei)) {
    shakeInput(input);
    showToast('IMEI must be 15 digits / IMEI 15 ہندسے ہونے چاہئیں');
    return;
  }

  // Animate button
  const btn = document.getElementById('checkBtn');
  btn.innerHTML = '<span class="btn-icon spin">⟳</span> Checking…';
  btn.disabled = true;

  // Simulate async (would be a real API call with Firebase/Sheets)
  setTimeout(() => {
    dbIncrementCheck();
    updateStatsBar();

    const record = dbCheckIMEI(imei);
    lastCheckedIMEI = imei;
    lastResult = record;

    btn.innerHTML = '<span class="btn-icon">🔍</span> Check IMEI';
    btn.disabled = false;

    if (record) {
      showStolenResult(record);
    } else {
      showCleanResult(imei);
    }
  }, 600);
}

function showCleanResult(imei) {
  const area   = document.getElementById('resultArea');
  const card   = document.getElementById('resultCard');
  const icon   = document.getElementById('resultIcon');
  const title  = document.getElementById('resultTitle');
  const detail = document.getElementById('resultDetails');
  const waBtn  = document.getElementById('shareWABtn');

  card.className = 'result-card clean';
  icon.textContent = '✅';
  title.textContent = 'CLEAN — Not Reported Stolen';
  title.className = 'result-title clean-title';
  detail.innerHTML = `
    <div class="detail-row"><span class="detail-label">IMEI:</span> <span class="detail-val mono">${imei}</span></div>
    <div class="detail-row clean-msg">یہ IMEI چوری شدہ فون کی فہرست میں نہیں ہے</div>
    <div class="detail-row"><span class="safe-note">✔ Safe to purchase (based on our database)</span></div>
  `;
  waBtn.style.display = 'none';
  area.classList.remove('hidden');
  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showStolenResult(record) {
  const area   = document.getElementById('resultArea');
  const card   = document.getElementById('resultCard');
  const icon   = document.getElementById('resultIcon');
  const title  = document.getElementById('resultTitle');
  const detail = document.getElementById('resultDetails');
  const waBtn  = document.getElementById('shareWABtn');

  card.className = 'result-card stolen';
  icon.textContent = '❌';
  title.textContent = 'STOLEN — DO NOT BUY!';
  title.className = 'result-title stolen-title';
  detail.innerHTML = `
    <div class="detail-row stolen-msg">🚨 یہ فون چوری شدہ ہے — ہرگز نہ خریدیں!</div>
    <div class="detail-row"><span class="detail-label">IMEI:</span> <span class="detail-val mono">${record.imei}</span></div>
    ${record.model   ? `<div class="detail-row"><span class="detail-label">Model:</span> <span class="detail-val">${record.model}</span></div>` : ''}
    ${record.date    ? `<div class="detail-row"><span class="detail-label">Stolen On:</span> <span class="detail-val">${formatDate(record.date)}</span></div>` : ''}
    ${record.city    ? `<div class="detail-row"><span class="detail-label">City:</span> <span class="detail-val">${record.city}</span></div>` : ''}
    ${record.contact ? `<div class="detail-row"><span class="detail-label">Owner Contact:</span> <span class="detail-val">${record.contact}</span></div>` : ''}
  `;
  waBtn.style.display = 'inline-flex';
  area.classList.remove('hidden');
  area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Show popup warning
  setTimeout(() => showStolenPopup(), 400);
}

function loadSample(imei) {
  const input = document.getElementById('imeiInput');
  if (input) {
    input.value = imei;
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = imei.length;
  }
  checkIMEI();
}

function updateStatsBar() {
  const stats = dbGetStats();
  const approved = dbGetApproved();
  const s = document.getElementById('statStolen');
  const c = document.getElementById('statChecks');
  if (s) s.textContent = approved.length;
  if (c) c.textContent = stats.todayChecks;
}

function shareWhatsApp() {
  if (!lastCheckedIMEI) return;
  const text = lastResult
    ? `🚨 STOLEN PHONE ALERT!\nIMEI: ${lastCheckedIMEI}\nModel: ${lastResult.model || 'N/A'}\nStolenOn: ${formatDate(lastResult.date)}\nCity: ${lastResult.city || 'Muzaffarabad'}\n\nCheck phones at: USA Mobile Zone IMEI Tracker\nچوری شدہ فون — خریدنے سے بچیں!`
    : `✅ IMEI VERIFIED CLEAN\nIMEI: ${lastCheckedIMEI}\nStatus: Not Reported Stolen\nVerified by USA Mobile Zone, Muzaffarabad`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

let qrGenerated = false;
function toggleQR() {
  const area = document.getElementById('qrCodeArea');
  area.classList.toggle('hidden');
  if (!qrGenerated && !area.classList.contains('hidden') && lastCheckedIMEI) {
    const el = document.getElementById('qrcode');
    el.innerHTML = '';
    const url = window.location.origin + window.location.pathname + '?imei=' + lastCheckedIMEI;
    try {
      new QRCode(el, { text: url, width: 160, height: 160 });
      qrGenerated = true;
    } catch(e) {
      el.innerHTML = `<div style="font-size:12px;padding:10px">IMEI: ${lastCheckedIMEI}</div>`;
    }
  }
}

function showStolenPopup() {
  const popup = document.getElementById('stolenPopup');
  if (popup) popup.classList.remove('hidden');
}

function closePopup() {
  const popup = document.getElementById('stolenPopup');
  if (popup) popup.classList.add('hidden');
}

function shakeInput(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// Allow Enter key
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('imeiInput');
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') checkIMEI(); });
    inp.addEventListener('input', () => formatIMEI(inp));
    // Check URL param
    const params = new URLSearchParams(window.location.search);
    const urlIMEI = params.get('imei');
    if (urlIMEI) { inp.value = urlIMEI; checkIMEI(); }
  }
  updateStatsBar();
});

// ─────────────────────────────────────────
//  REPORT PAGE
// ─────────────────────────────────────────

function submitReport() {
  const imei    = (document.getElementById('r_imei')    ?.value || '').replace(/\D/g,'');
  const model   = document.getElementById('r_model')   ?.value || '';
  const owner   = document.getElementById('r_owner')   ?.value || '';
  const contact = document.getElementById('r_contact') ?.value || '';
  const date    = document.getElementById('r_date')    ?.value || '';
  const city    = document.getElementById('r_city')    ?.value || 'Muzaffarabad';
  const notes   = document.getElementById('r_notes')   ?.value || '';

  if (!imei) { showToast('IMEI number is required / IMEI نمبر ضروری ہے'); return; }
  if (!validateIMEI(imei)) { showToast('IMEI must be 15 digits / IMEI 15 ہندسے ہونے چاہئیں'); return; }
  if (!date)  { showToast('Please select the date of theft / چوری کی تاریخ ضروری ہے'); return; }

  // Check if already in DB
  if (dbCheckIMEI(imei)) {
    showToast('⚠️ This IMEI is already in our system');
    return;
  }

  const id = dbAddRecord({ imei, model, owner, contact, date, city, notes, status: 'pending' });
  const ref = generateReportRef();

  document.getElementById('reportFormCard').classList.add('hidden');
  const success = document.getElementById('successState');
  success.classList.remove('hidden');
  document.getElementById('reportRef').textContent = 'Reference: ' + ref;
}

function submitAnother() {
  document.getElementById('reportFormCard').classList.remove('hidden');
  document.getElementById('successState').classList.add('hidden');
  ['r_imei','r_model','r_owner','r_contact','r_date','r_notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const city = document.getElementById('r_city');
  if (city) city.value = 'Muzaffarabad';
}

// ─────────────────────────────────────────
//  ADMIN PAGE
// ─────────────────────────────────────────

function adminLogin() {
  const user = document.getElementById('adminUser')?.value.trim();
  const pass = document.getElementById('adminPass')?.value.trim();
  if (dbLogin(user, pass)) {
    showAdminPanel();
  } else {
    const err = document.getElementById('loginError');
    if (err) err.classList.remove('hidden');
    const passInp = document.getElementById('adminPass');
    if (passInp) { passInp.classList.add('shake'); setTimeout(()=>passInp.classList.remove('shake'),500); }
  }
}

function showAdminPanel() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  renderPending();
  renderApproved();
  renderStats();
}

function adminLogout() {
  dbLogout();
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.remove('hidden');
  event.target.classList.add('active');
  if (name === 'pending')  renderPending();
  if (name === 'approved') renderApproved();
  if (name === 'stats')    renderStats();
}

function renderPending() {
  const list = document.getElementById('pendingList');
  const badge = document.getElementById('pendingBadge');
  const records = dbGetPending();
  if (badge) badge.textContent = records.length || '';
  if (!list) return;
  if (records.length === 0) {
    list.innerHTML = '<div class="empty-state">✅ No pending submissions</div>';
    return;
  }
  list.innerHTML = records.map(r => `
    <div class="record-card pending-card" id="card_${r.id}">
      <div class="record-header">
        <span class="record-imei mono">${r.imei}</span>
        <span class="record-badge pending-badge">⏳ Pending</span>
      </div>
      <div class="record-body">
        ${r.model   ? `<div class="record-row"><b>Model:</b> ${r.model}</div>` : ''}
        ${r.owner   ? `<div class="record-row"><b>Owner:</b> ${r.owner}</div>` : ''}
        ${r.contact ? `<div class="record-row"><b>Contact:</b> ${r.contact}</div>` : ''}
        ${r.date    ? `<div class="record-row"><b>Theft Date:</b> ${formatDate(r.date)}</div>` : ''}
        ${r.city    ? `<div class="record-row"><b>City:</b> ${r.city}</div>` : ''}
        ${r.notes   ? `<div class="record-row"><b>Notes:</b> ${r.notes}</div>` : ''}
        <div class="record-row small"><b>Submitted:</b> ${new Date(r.submittedAt).toLocaleString()}</div>
      </div>
      <div class="record-actions">
        <button class="approve-btn" onclick="approveRecord('${r.id}')">✅ Approve</button>
        <button class="reject-btn"  onclick="rejectRecord('${r.id}')">❌ Reject</button>
      </div>
    </div>
  `).join('');
}

function renderApproved() {
  const list = document.getElementById('approvedList');
  const searchEl = document.getElementById('approvedSearch');
  if (!list) return;
  let records = dbGetApproved();
  if (searchEl && searchEl.value.trim()) {
    const q = searchEl.value.trim().toLowerCase();
    records = records.filter(r =>
      r.imei.includes(q) ||
      (r.model   || '').toLowerCase().includes(q) ||
      (r.owner   || '').toLowerCase().includes(q) ||
      (r.city    || '').toLowerCase().includes(q)
    );
  }
  if (records.length === 0) {
    list.innerHTML = '<div class="empty-state">No records found</div>';
    return;
  }
  list.innerHTML = records.map(r => `
    <div class="record-card approved-card">
      <div class="record-header">
        <span class="record-imei mono">${r.imei}</span>
        <span class="record-badge approved-badge">✅ Approved</span>
      </div>
      <div class="record-body">
        ${r.model   ? `<div class="record-row"><b>Model:</b> ${r.model}</div>` : ''}
        ${r.owner   ? `<div class="record-row"><b>Owner:</b> ${r.owner}</div>` : ''}
        ${r.contact ? `<div class="record-row"><b>Contact:</b> ${r.contact}</div>` : ''}
        ${r.date    ? `<div class="record-row"><b>Theft Date:</b> ${formatDate(r.date)}</div>` : ''}
        ${r.city    ? `<div class="record-row"><b>City:</b> ${r.city}</div>` : ''}
      </div>
      <div class="record-actions">
        <button class="edit-btn"   onclick="openEdit('${r.id}')">✏️ Edit</button>
        <button class="reject-btn" onclick="deleteRecord('${r.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function renderStats() {
  const stats   = dbGetStats();
  const pending = dbGetPending().length;
  const approved= dbGetApproved().length;
  const s = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  s('s_approved', approved);
  s('s_pending',  pending);
  s('s_checks',   stats.totalChecks || 0);
  s('s_today',    stats.todayChecks || 0);
}

function approveRecord(id) {
  dbApproveRecord(id);
  renderPending();
  renderApproved();
  renderStats();
  showToast('✅ Record approved!');
}

function rejectRecord(id) {
  if (confirm('Reject and delete this submission?')) {
    dbRejectRecord(id);
    renderPending();
    renderStats();
    showToast('Submission removed');
  }
}

function deleteRecord(id) {
  if (confirm('Delete this approved record permanently?')) {
    dbDeleteRecord(id);
    renderApproved();
    renderStats();
    showToast('Record deleted');
  }
}

function openEdit(id) {
  const records = dbGetAll();
  const r = records.find(x => x.id === id);
  if (!r) return;
  document.getElementById('e_id').value      = r.id;
  document.getElementById('e_imei').value    = r.imei;
  document.getElementById('e_model').value   = r.model   || '';
  document.getElementById('e_owner').value   = r.owner   || '';
  document.getElementById('e_contact').value = r.contact || '';
  document.getElementById('e_date').value    = r.date    || '';
  document.getElementById('e_city').value    = r.city    || '';
  document.getElementById('editModal').classList.remove('hidden');
}

function saveEdit() {
  const id = document.getElementById('e_id').value;
  dbUpdateRecord(id, {
    imei:    document.getElementById('e_imei').value.replace(/\D/g,''),
    model:   document.getElementById('e_model').value,
    owner:   document.getElementById('e_owner').value,
    contact: document.getElementById('e_contact').value,
    date:    document.getElementById('e_date').value,
    city:    document.getElementById('e_city').value,
  });
  closeEdit();
  renderApproved();
  showToast('✅ Record updated!');
}

function closeEdit() {
  document.getElementById('editModal').classList.add('hidden');
}

function adminAddRecord() {
  const imei    = (document.getElementById('a_imei')?.value    || '').replace(/\D/g,'');
  const model   =  document.getElementById('a_model')?.value   || '';
  const owner   =  document.getElementById('a_owner')?.value   || '';
  const contact =  document.getElementById('a_contact')?.value || '';
  const date    =  document.getElementById('a_date')?.value    || '';
  const city    =  document.getElementById('a_city')?.value    || 'Muzaffarabad';
  const msg     =  document.getElementById('addMsg');

  if (!validateIMEI(imei)) { showToast('IMEI must be 15 digits'); return; }

  dbAddRecord({ imei, model, owner, contact, date, city, status: 'approved' });

  if (msg) { msg.textContent = '✅ Record added!'; msg.className = 'add-message success'; msg.classList.remove('hidden'); setTimeout(()=>msg.classList.add('hidden'), 2500); }
  ['a_imei','a_model','a_owner','a_contact','a_date'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  renderStats();
}

function resetStats() {
  if (confirm("Reset today's check count?")) { dbResetTodayChecks(); renderStats(); }
}

// ─────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(), 300); }, 2500);
}

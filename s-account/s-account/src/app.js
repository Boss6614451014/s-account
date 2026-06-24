/* ============================================================
   S ACCOUNT — app.js
   Supabase REST API client (no npm needed)
============================================================ */

// ── CONFIG ────────────────────────────────────────────────
let SUPABASE_URL = localStorage.getItem('sa_url') || '';
let SUPABASE_KEY = localStorage.getItem('sa_key') || '';

// ── SUPABASE HELPERS ──────────────────────────────────────
function sbHeaders() {
  return {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer':        'return=representation'
  };
}

async function sbSelect(table, params = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}&order=created_at.desc`, {
    headers: sbHeaders()
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbUpdate(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbDelete(table, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: sbHeaders()
  });
  if (!r.ok) throw new Error(await r.text());
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── MODAL ─────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ── NAVIGATION ────────────────────────────────────────────
function goSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById(`sec-${name}`);
  const btn = document.querySelector(`[data-section="${name}"]`);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'customer-list') loadCustomerTable();
  if (name === 'tracking')      loadTrackingTable();
  if (name === 'tax')           loadWHTTable();
  if (name === 'vat')           loadVATTable();
  if (name === 'fees')          loadFeesTable();
}

document.querySelectorAll('.nav-btn').forEach(b =>
  b.addEventListener('click', () => goSection(b.dataset.section))
);

// ── CONFIG ────────────────────────────────────────────────
document.getElementById('btnConfig').onclick = () => {
  document.getElementById('cfgUrl').value = SUPABASE_URL;
  document.getElementById('cfgKey').value = SUPABASE_KEY;
  openModal('modalConfig');
};
document.getElementById('btnAddCustomer').onclick = () => openModal('modalAddCustomer');

async function saveConfig() {
  SUPABASE_URL = document.getElementById('cfgUrl').value.trim().replace(/\/$/, '');
  SUPABASE_KEY = document.getElementById('cfgKey').value.trim();
  localStorage.setItem('sa_url', SUPABASE_URL);
  localStorage.setItem('sa_key', SUPABASE_KEY);
  closeModal('modalConfig');
  await initDashboard();
}

// ── CUSTOMERS ─────────────────────────────────────────────
let allCustomers = [];

async function loadCustomers() {
  try {
    allCustomers = await sbSelect('customers', 'select=id,customer_code,name,customer_type,tax_id&is_active=eq.true');
    return allCustomers;
  } catch { return []; }
}

function renderCustomerList(customers) {
  const el = document.getElementById('customerList');
  if (!customers.length) {
    el.innerHTML = '<div class="empty-msg">ไม่พบข้อมูลลูกค้า</div>';
    return;
  }
  el.innerHTML = customers.map(c => `
    <div class="customer-card" onclick="goSection('customer-list')">
      <span class="cust-code-badge">${c.customer_code}</span>
      <div class="cust-info">
        <div class="cust-name">${c.name}</div>
        <div class="cust-taxid">${c.tax_id || '—'}</div>
      </div>
      <span class="cust-hint">เปลี่ยนเป็นเลข 13 หลัก สามารถคลิกเลือกได้</span>
      <div class="cust-actions">
        <button class="btn-icon" onclick="event.stopPropagation(); editCustomer('${c.id}')">✏</button>
        <button class="btn-icon" onclick="event.stopPropagation(); deleteCustomer('${c.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

async function saveCustomer() {
  const body = {
    customer_code: val('cust_code'),
    tax_id:        val('cust_taxid'),
    name:          val('cust_name'),
    customer_type: val('cust_type'),
    doc_deduct:    val('cust_doc_deduct'),
    doc_30:        val('cust_doc30'),
    notes:         val('cust_notes')
  };
  if (!body.customer_code || !body.name) return showToast('กรุณากรอกรหัสและชื่อลูกค้า', 'error');
  try {
    await sbInsert('customers', body);
    closeModal('modalAddCustomer');
    showToast('เพิ่มลูกค้าสำเร็จ', 'success');
    await initDashboard();
  } catch (e) { showToast('เกิดข้อผิดพลาด: ' + e.message, 'error'); }
}

function loadCustomerTable() {
  const tbody = document.getElementById('tblCustomersBody');
  if (!allCustomers.length) return;
  tbody.innerHTML = allCustomers.map(c => `
    <tr>
      <td><span class="cust-code-badge">${c.customer_code}</span></td>
      <td style="font-family:monospace;font-size:11px">${c.tax_id || '—'}</td>
      <td>${c.name}</td>
      <td>${c.customer_type || '—'}</td>
      <td><span style="color:var(--mint)">● ใช้งาน</span></td>
      <td>
        <button class="btn-icon" onclick="editCustomer('${c.id}')">✏</button>
        <button class="btn-icon" onclick="deleteCustomer('${c.id}')">🗑</button>
      </td>
    </tr>
  `).join('');
}

async function deleteCustomer(id) {
  if (!confirm('ลบลูกค้านี้?')) return;
  try {
    await sbDelete('customers', id);
    showToast('ลบสำเร็จ', 'success');
    await initDashboard();
  } catch (e) { showToast(e.message, 'error'); }
}

function editCustomer(id) {
  const c = allCustomers.find(x => x.id === id);
  if (!c) return;
  document.getElementById('cust_code').value  = c.customer_code;
  document.getElementById('cust_taxid').value = c.tax_id || '';
  document.getElementById('cust_name').value  = c.name;
  document.getElementById('cust_type').value  = c.customer_type || 'ลูกค้า';
  openModal('modalAddCustomer');
}

// ── DOCUMENT TRACKING ─────────────────────────────────────
const TRACKING_COLS = [
  { key: 'track_13_8_68', label: '13.8' }, { key: 'track_14_8_68', label: '14.8' },
  { key: 'track_15_8_68', label: '15.8' }, { key: 'track_18_8_68', label: '18.8' },
  { key: 'track_19_8_68', label: '19.8' }, { key: 'track_16_9_68', label: '16.9' },
  { key: 'track_17_9_68', label: '17.9' }, { key: 'track_18_9_68', label: '18.9' },
  { key: 'track_22_9_68', label: '22.9' }, { key: 'track_14_10_68', label: '14/10' },
  { key: 'track_17_10_68', label: '17/10' },{ key: 'track_20_10_68', label: '20/10' },
  { key: 'track_17_11_68', label: '17.11' },{ key: 'track_9_12_68', label: '9.12' },
  { key: 'track_12_12_68', label: '12.12' },{ key: 'track_16_1_69', label: '16.1' },
  { key: 'track_20_1_69', label: '20.1' }
];

async function loadTrackingTable() {
  const tbody = document.getElementById('tblTrackingBody');
  try {
    const rows = await sbSelect('document_tracking',
      'select=*,customers(customer_code,name)'
    );
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="18" class="empty-td">ยังไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td class="sticky-col" style="background:#fff">
          <b>${r.customers?.customer_code || '—'}</b><br/>
          <span style="font-size:11px;color:var(--muted)">${r.customers?.name?.substring(0,20) || ''}</span>
        </td>
        ${TRACKING_COLS.map(c => `
          <td style="text-align:center">
            <div class="date-cell ${r[c.key] ? 'filled' : ''}"
                 title="${r[c.key] || ''}"
                 onclick="toggleTracking('${r.id}','${c.key}','${r[c.key] || ''}')">
              ${r[c.key] ? '✓' : ''}
            </div>
          </td>
        `).join('')}
        <td><button class="btn-icon" onclick="deleteRow('document_tracking','${r.id}')">🗑</button></td>
      </tr>
    `).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="18" class="empty-td">${e.message}</td></tr>`; }
}

async function toggleTracking(id, col, current) {
  const newVal = current ? null : new Date().toISOString().split('T')[0];
  try {
    await sbUpdate('document_tracking', id, { [col]: newVal });
    loadTrackingTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── WITHHOLDING TAX ───────────────────────────────────────
async function loadWHTTable() {
  const tbody = document.getElementById('tblWHTBody');
  try {
    const rows = await sbSelect('withholding_tax',
      'select=*,customers(customer_code,name)&limit=100'
    );
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-td">ยังไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.customers?.customer_code || '—'} ${r.customers?.name?.substring(0,16) || ''}</td>
        <td>${r.tax_year}/${r.tax_month}</td>
        <td>${fmt(r.pnd1_amount)}</td>
        <td>${fmt(r.pnd3_we_pay)}</td>
        <td>${fmt(r.pnd3_collect)}</td>
        <td>${fmt(r.pnd53_we_pay)}</td>
        <td>${fmt(r.pnd53_collect)}</td>
        <td>${r.filed_date || '—'}</td>
        <td><button class="btn-icon" onclick="deleteRow('withholding_tax','${r.id}')">🗑</button></td>
      </tr>
    `).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="9" class="empty-td">${e.message}</td></tr>`; }
}

async function saveWHT() {
  const body = {
    customer_id:    val('wht_customer'),
    tax_year:       +val('wht_year'),
    tax_month:      +val('wht_month'),
    pnd1_amount:    +val('wht_pnd1'),
    pnd1_date:      val('wht_pnd1_date') || null,
    pnd3_we_pay:    +val('wht_pnd3_pay'),
    pnd3_we_date:   val('wht_pnd3_pay_date') || null,
    pnd3_collect:   +val('wht_pnd3_col'),
    pnd3_col_date:  val('wht_pnd3_col_date') || null,
    pnd53_we_pay:   +val('wht_pnd53_pay'),
    pnd53_we_date:  val('wht_pnd53_pay_date') || null,
    pnd53_collect:  +val('wht_pnd53_col'),
    pnd53_col_date: val('wht_pnd53_col_date') || null,
    filed_date:     val('wht_filed_date') || null,
    filed_amount:   +val('wht_filed_amt'),
    filed_ref:      val('wht_filed_ref')
  };
  if (!body.customer_id) return showToast('กรุณาเลือกลูกค้า', 'error');
  try {
    await sbInsert('withholding_tax', body);
    closeModal('modalAddWHT');
    showToast('บันทึกสำเร็จ', 'success');
    loadWHTTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── VAT PP30 ──────────────────────────────────────────────
async function loadVATTable() {
  const tbody = document.getElementById('tblVATBody');
  try {
    const rows = await sbSelect('vat_pp30',
      'select=*,customers(customer_code,name)&limit=100'
    );
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-td">ยังไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.customers?.customer_code || '—'}</td>
        <td>${r.period_label || `${r.period_month}/${r.period_year}`}</td>
        <td>${fmt(r.sales_amount)}</td>
        <td>${fmt(r.purchase_amount)}</td>
        <td>${fmt(r.vat_output)}</td>
        <td>${fmt(r.vat_input)}</td>
        <td><b>${fmt(r.vat_payable)}</b></td>
        <td>${r.filed_date || '—'}</td>
        <td><button class="btn-icon" onclick="deleteRow('vat_pp30','${r.id}')">🗑</button></td>
      </tr>
    `).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="9" class="empty-td">${e.message}</td></tr>`; }
}

async function saveVAT() {
  const body = {
    customer_id:      val('vat_customer'),
    period_label:     val('vat_label'),
    period_month:     +val('vat_month'),
    period_year:      +val('vat_year'),
    sales_amount:     +val('vat_sales'),
    purchase_amount:  +val('vat_purchase'),
    vat_output:       +val('vat_output'),
    vat_input:        +val('vat_input'),
    vat_payable:      +val('vat_payable'),
    filed_date:       val('vat_filed') || null,
    receipt_no:       val('vat_receipt')
  };
  if (!body.customer_id) return showToast('กรุณาเลือกลูกค้า', 'error');
  try {
    await sbInsert('vat_pp30', body);
    closeModal('modalAddVAT');
    showToast('บันทึกสำเร็จ', 'success');
    loadVATTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── SERVICE FEES ──────────────────────────────────────────
async function loadFeesTable() {
  const tbody = document.getElementById('tblFeesBody');
  try {
    const rows = await sbSelect('service_fees',
      'select=*,customers(customer_code,name)&limit=100'
    );
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="12" class="empty-td">ยังไม่มีข้อมูล</td></tr>'; return; }
    tbody.innerHTML = rows.map(r => {
      const tot = r.total_fee ||
        (r.accounting_fee + r.pp30_fee + r.sps_fee + r.social_ins_fee +
         r.pack_fee + r.other_fee + r.labor_cost + r.expense_cost);
      const bal = tot - (r.paid_amount || 0);
      return `
        <tr>
          <td>${r.customers?.customer_code || '—'}</td>
          <td>${r.fee_year}/${r.fee_month}</td>
          <td>${fmt(r.accounting_fee)}</td>
          <td>${fmt(r.pp30_fee)}</td>
          <td>${fmt(r.sps_fee)}</td>
          <td>${fmt(r.social_ins_fee)}</td>
          <td>${fmt(r.labor_cost)}</td>
          <td>${fmt(r.expense_cost)}</td>
          <td><b>${fmt(tot)}</b></td>
          <td style="color:var(--mint)">${fmt(r.paid_amount)}</td>
          <td style="color:${bal > 0 ? 'var(--salmon)' : 'var(--mint)'}">${fmt(bal)}</td>
          <td><button class="btn-icon" onclick="deleteRow('service_fees','${r.id}')">🗑</button></td>
        </tr>
      `;
    }).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="12" class="empty-td">${e.message}</td></tr>`; }
}

async function saveFee() {
  const body = {
    customer_id:    val('fee_customer'),
    fee_year:       +val('fee_year'),
    fee_month:      +val('fee_month'),
    accounting_fee: +val('fee_acct'),
    pp30_fee:       +val('fee_pp30'),
    sps_fee:        +val('fee_sps'),
    social_ins_fee: +val('fee_socins'),
    pack_fee:       +val('fee_pack'),
    other_fee:      +val('fee_other'),
    labor_cost:     +val('fee_labor'),
    expense_cost:   +val('fee_expense'),
    inventory:      +val('fee_inventory'),
    paid_date:      val('fee_paid_date') || null,
    paid_amount:    +val('fee_paid_amt'),
    remark:         val('fee_remark')
  };
  body.balance = (body.accounting_fee + body.pp30_fee + body.sps_fee +
    body.social_ins_fee + body.pack_fee + body.other_fee +
    body.labor_cost + body.expense_cost) - body.paid_amount;
  if (!body.customer_id) return showToast('กรุณาเลือกลูกค้า', 'error');
  try {
    await sbInsert('service_fees', body);
    closeModal('modalAddFee');
    showToast('บันทึกสำเร็จ', 'success');
    loadFeesTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── DELETE GENERIC ─────────────────────────────────────────
async function deleteRow(table, id) {
  if (!confirm('ลบรายการนี้?')) return;
  try {
    await sbDelete(table, id);
    showToast('ลบสำเร็จ', 'success');
    // refresh whichever table is visible
    loadWHTTable(); loadVATTable(); loadFeesTable(); loadTrackingTable();
  } catch (e) { showToast(e.message, 'error'); }
}

// ── POPULATE SELECT DROPDOWNS ──────────────────────────────
function populateSelects(customers) {
  const ids = ['wht_customer','vat_customer','fee_customer',
                'trackingCustomerFilter','taxCustomerFilter',
                'vatCustomerFilter','feesCustomerFilter'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">— เลือกลูกค้า —</option>' +
      customers.map(c =>
        `<option value="${c.id}">${c.customer_code} — ${c.name.substring(0,24)}</option>`
      ).join('');
    el.value = cur;
  });
}

// ── DASHBOARD STATS ────────────────────────────────────────
async function updateStats(customers) {
  document.getElementById('statCustomers').textContent = customers.length;
  try {
    const wht = await sbSelect('withholding_tax', 'select=id');
    document.getElementById('statWHT').textContent = wht.length;
  } catch { document.getElementById('statWHT').textContent = '—'; }
  try {
    const now = new Date();
    const vat = await sbSelect('vat_pp30',
      `select=id&period_year=eq.${2567 + now.getFullYear()-2024}&period_month=eq.${now.getMonth()+1}`
    );
    document.getElementById('statVAT').textContent = vat.length;
  } catch { document.getElementById('statVAT').textContent = '—'; }
  try {
    const fees = await sbSelect('service_fees', 'select=balance&balance=gt.0');
    document.getElementById('statFees').textContent = fees.length;
  } catch { document.getElementById('statFees').textContent = '—'; }
}

// ── SEARCH ────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  const filtered = allCustomers.filter(c =>
    c.customer_code.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    (c.tax_id || '').toLowerCase().includes(q)
  );
  renderCustomerList(filtered);
});

// ── TYPE FILTER TABS ──────────────────────────────────────
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const type = this.dataset.type;
    const filtered = type
      ? allCustomers.filter(c => c.customer_type === type)
      : allCustomers;
    renderCustomerList(filtered);
  });
});

// ── INIT ──────────────────────────────────────────────────
async function initDashboard() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    document.getElementById('dbStatus').textContent = '● ไม่ได้เชื่อมต่อ';
    document.getElementById('dbStatus').className = 'db-status';
    document.getElementById('customerList').innerHTML =
      '<div class="empty-msg">กรุณากด ⚙ ตั้งค่า DB แล้วใส่ Supabase URL + Key</div>';
    return;
  }
  try {
    const customers = await loadCustomers();
    document.getElementById('dbStatus').textContent = '● เชื่อมต่อแล้ว';
    document.getElementById('dbStatus').className   = 'db-status connected';
    renderCustomerList(customers);
    populateSelects(customers);
    await updateStats(customers);
  } catch (e) {
    document.getElementById('dbStatus').textContent = '● เชื่อมต่อล้มเหลว';
    showToast('เชื่อมต่อ Supabase ล้มเหลว', 'error');
  }
}

// ── HELPERS ───────────────────────────────────────────────
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}
function fmt(n) {
  const num = parseFloat(n) || 0;
  if (num === 0) return '<span style="color:var(--muted)">—</span>';
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── START ─────────────────────────────────────────────────
initDashboard();

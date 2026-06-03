/* =====================================================================
   AW Client Report Portal
   Flow: Dashboard -> Quarterly form -> Report preview -> Print
   ===================================================================== */

const STORE_KEY = "aw_portal_clients_v1";

/* ---------- Seed data ---------- */
const SEED = [
  {
    id: "c-harrison",
    profile: {
      client1: "Robert Harrison",
      client2: "Margaret Harrison",
      age: 58,
      client1Dob: "1968-04-12",
      client1Ssn4: "4821",
      client2Age: 56,
      client2Dob: "1970-08-24",
      client2Ssn4: "9157",
      lastReport: "2026-03-31",
    },
    quarter: {
      reportDate: "2026-06-30",
      monthlyInflow: 42000,
      monthlyOutflow: 28500,
      insuranceDeductibles: 15000, // added to private reserve target
      privateReserveBalance: 195000,
      // account groups: {label, amount}
      client1Retirement: [
        { label: "401(k) — Fidelity", amount: 920000 },
        { label: "Traditional IRA", amount: 410000 },
      ],
      client2Retirement: [
        { label: "Roth IRA", amount: 285000 },
        { label: "403(b)", amount: 175000 },
      ],
      nonRetirement: [
        { label: "Schwab Brokerage", amount: 1250000 },
        { label: "Pinnacle Bank — Savings", amount: 320000 },
      ],
      trust: [
        { label: "Primary Residence (Zillow est.)", amount: 1850000 },
        { label: "Family Trust Holdings", amount: 640000 },
      ],
      liabilities: [
        { label: "Mortgage — Primary", amount: 480000, rate: 3.25 },
        { label: "HELOC", amount: 75000, rate: 6.5 },
      ],
    },
  },
  {
    id: "c-chen",
    profile: {
      client1: "Daniel Chen",
      client2: "",
      age: 46,
      client1Dob: "1980-01-18",
      client1Ssn4: "2044",
      client2Age: "",
      client2Dob: "",
      client2Ssn4: "",
      lastReport: "2026-03-15",
    },
    quarter: {
      reportDate: "2026-06-30",
      monthlyInflow: 31000,
      monthlyOutflow: 19000,
      insuranceDeductibles: 10000,
      privateReserveBalance: 120000,
      client1Retirement: [{ label: "401(k) — Vanguard", amount: 540000 }],
      client2Retirement: [],
      nonRetirement: [{ label: "Schwab Brokerage", amount: 410000 }],
      trust: [{ label: "Primary Residence", amount: 920000 }],
      liabilities: [{ label: "Mortgage", amount: 360000, rate: 4.1 }],
    },
  },
];

function normalizeClient(client) {
  const seeded = SEED.find((item) => item.id === client.id);
  const defaultProfile = {
    client1: "",
    client2: "",
    age: "",
    client1Dob: "",
    client1Ssn4: "",
    client2Age: "",
    client2Dob: "",
    client2Ssn4: "",
    lastReport: "",
  };

  return {
    ...client,
    profile: {
      ...defaultProfile,
      ...(seeded ? seeded.profile : {}),
      ...(client.profile || {}),
    },
  };
}

/* ---------- Persistence ---------- */
function loadClients() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    localStorage.setItem(STORE_KEY, JSON.stringify(SEED));
    return structuredClone(SEED);
  }
  try {
    const clients = JSON.parse(raw).map(normalizeClient);
    localStorage.setItem(STORE_KEY, JSON.stringify(clients));
    return clients;
  } catch {
    return structuredClone(SEED);
  }
}
function saveClients(clients) {
  localStorage.setItem(STORE_KEY, JSON.stringify(clients));
}
function getClient(id) {
  return loadClients().find((c) => c.id === id);
}
function upsertClient(client) {
  const clients = loadClients();
  const i = clients.findIndex((c) => c.id === client.id);
  if (i >= 0) clients[i] = client;
  else clients.push(client);
  saveClients(clients);
}

function createClient() {
  const id = "c-" + Date.now().toString(36);
  const today = new Date().toISOString().slice(0, 10);
  const client = {
    id,
    profile: {
      client1: "",
      client2: "",
      age: "",
      client1Dob: "",
      client1Ssn4: "",
      client2Age: "",
      client2Dob: "",
      client2Ssn4: "",
      lastReport: "",
    },
    quarter: {
      reportDate: today,
      monthlyInflow: 0,
      monthlyOutflow: 0,
      insuranceDeductibles: 0,
      privateReserveBalance: 0,
      client1Retirement: [{ label: "", amount: 0 }],
      client2Retirement: [],
      nonRetirement: [{ label: "", amount: 0 }],
      trust: [],
      liabilities: [],
    },
  };
  upsertClient(client);
  location.hash = "#/client/" + id;
}

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const fmt = (n) =>
  (isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const sumAmounts = (arr) => (arr || []).reduce((t, a) => t + (Number(a.amount) || 0), 0);
const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const fmtDate = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
const ssnLabel = (value) => (value ? "SSN " + escapeHtml(value) : "SSN —");

/* ---------- Core calculations ---------- */
function calc(q) {
  const inflow = Number(q.monthlyInflow) || 0;
  const outflow = Number(q.monthlyOutflow) || 0;
  const deductibles = Number(q.insuranceDeductibles) || 0;

  const sacsExcess = inflow - outflow; // monthly cashflow surplus
  const privateReserveTarget = 6 * outflow + deductibles; // 6 months expenses + deductibles

  const c1Retirement = sumAmounts(q.client1Retirement);
  const c2Retirement = sumAmounts(q.client2Retirement);
  const nonRetirement = sumAmounts(q.nonRetirement); // excludes trust by design
  const trustTotal = sumAmounts(q.trust);
  const liabilitiesTotal = sumAmounts(q.liabilities);

  // Liabilities are displayed separately and NOT subtracted from net worth.
  const grandNetWorth = c1Retirement + c2Retirement + nonRetirement + trustTotal;

  return {
    inflow,
    outflow,
    sacsExcess,
    privateReserveTarget,
    privateReserveBalance: Number(q.privateReserveBalance) || 0,
    c1Retirement,
    c2Retirement,
    nonRetirement,
    trustTotal,
    liabilitiesTotal,
    grandNetWorth,
  };
}

function countMissingFields(client) {
  const requiredSelectors = ["#p-client1", "#q-reportDate", "#q-monthlyInflow", "#q-monthlyOutflow"];
  const missingCore = requiredSelectors.filter((sel) => {
    const input = $(sel);
    return input ? input.value.trim() === "" : false;
  }).length;

  const emptyAccounts = Array.from(app.querySelectorAll(".acct-row")).filter((row) => {
    const label = row.querySelector('[data-k="label"]');
    const amount = row.querySelector('[data-k="amount"]');
    return (label && label.value.trim() === "") || (amount && amount.value.trim() === "");
  }).length;

  return missingCore + emptyAccounts;
}

function markMissingAccountFields() {
  app.querySelectorAll(".acct-row input").forEach((input) => input.classList.remove("invalid"));
  let missing = 0;
  app.querySelectorAll(".acct-row").forEach((row) => {
    const label = row.querySelector('[data-k="label"]');
    const amount = row.querySelector('[data-k="amount"]');
    if (label && label.value.trim() === "") {
      label.classList.add("invalid");
      missing += 1;
    }
    if (amount && amount.value.trim() === "") {
      amount.classList.add("invalid");
      missing += 1;
    }
  });
  return missing;
}

/* ---------- Router ---------- */
const app = $("#app");
function setNavContext(text) {
  $("#navContext").textContent = text || "";
}
function route() {
  const hash = location.hash || "#/dashboard";
  const [, view, id] = hash.split("/");
  if (view === "report" && id) renderReport(id);
  else if (view === "client" && id) renderForm(id);
  else renderDashboard();
}
window.addEventListener("hashchange", route);

/* ---------- View: Dashboard ---------- */
function renderDashboard() {
  setNavContext("");
  const clients = loadClients();
  const cards = clients
    .map((c) => {
      const k = calc(c.quarter);
      const client1 = escapeHtml(c.profile.client1 || "New client");
      const client2 = escapeHtml(c.profile.client2 || "");
      return `
      <div class="client-card">
        <div class="avatar">${escapeHtml(initials(c.profile.client1))}</div>
        <div>
          <div class="name">${client1}${client2 ? " &amp; " + client2 : ""}</div>
          <div class="meta">Age ${escapeHtml(c.profile.age || "—")} · Last report ${fmtDate(c.profile.lastReport)}</div>
        </div>
        <div class="net">TCC grand total <strong>${fmt(k.grandNetWorth)}</strong></div>
        <button class="btn btn-primary" onclick="location.hash='#/client/${c.id}'">
          Prepare Report
        </button>
      </div>`;
    })
    .join("");

  app.innerHTML = `
    <div class="page-head" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1>Client Dashboard</h1>
        <p>${clients.length} active client households · quarterly SACS &amp; TCC reporting</p>
      </div>
      <div class="dashboard-actions no-print">
        <button class="btn btn-primary" onclick="createClient()">New Client</button>
      </div>
    </div>
    <div class="client-grid">${cards}</div>
  `;
}

/* ---------- View: Quarterly form (profile + balances + live calc) ---------- */
function renderForm(id) {
  const client = getClient(id);
  if (!client) {
    location.hash = "#/dashboard";
    return;
  }
  setNavContext("› " + (client.profile.client1 || "New client"));
  const q = client.quarter;

  const acctRows = (arr, group) =>
    arr
      .map(
        (a, i) => `
      <div class="acct-row" data-group="${group}" data-i="${i}">
        <div class="field">
          <input type="text" value="${escapeHtml(a.label)}" data-k="label" placeholder="Account name" />
        </div>
        <div class="field">
          <input type="number" value="${escapeHtml(a.amount)}" data-k="amount" placeholder="0" />
        </div>
        <button class="acct-remove" title="Remove" onclick="removeRow('${group}',${i})">×</button>
      </div>`
      )
      .join("");

  const liabRows = (arr) =>
    arr
      .map(
        (a, i) => `
      <div class="acct-row liab" data-group="liabilities" data-i="${i}">
        <div class="field"><input type="text" value="${escapeHtml(a.label)}" data-k="label" placeholder="Liability" /></div>
        <div class="field"><input type="number" value="${escapeHtml(a.amount)}" data-k="amount" placeholder="Balance" /></div>
        <div class="field"><input type="number" step="0.01" value="${escapeHtml(a.rate)}" data-k="rate" placeholder="Rate %" /></div>
        <button class="acct-remove" title="Remove" onclick="removeRow('liabilities',${i})">×</button>
      </div>`
      )
      .join("");

  app.innerHTML = `
    <div class="page-head">
      <button class="btn btn-ghost no-print" onclick="location.hash='#/dashboard'">Back to dashboard</button>
      <h1 style="margin-top:14px;">Quarterly Data Entry</h1>
      <p>Review profile details, update current balances, and generate the quarterly report set.</p>
    </div>

    <div class="form-summary" id="formSummary"></div>

    <div id="formAlert"></div>

    <!-- Client profile -->
    <div class="section-card">
      <h2>Client Profile</h2>
      <p class="section-sub">Static household information.</p>
      <div class="field-grid">
        <div class="field"><label>Client 1 <span class="req">*</span></label>
          <input type="text" id="p-client1" value="${escapeHtml(client.profile.client1)}" /></div>
        <div class="field"><label>Client 1 DOB</label>
          <input type="date" id="p-client1Dob" value="${escapeHtml(client.profile.client1Dob || "")}" /></div>
        <div class="field"><label>Client 1 SSN Last 4</label>
          <input type="text" id="p-client1Ssn4" inputmode="numeric" maxlength="4" value="${escapeHtml(client.profile.client1Ssn4 || "")}" /></div>
        <div class="field"><label>Client 1 Age</label>
          <input type="number" id="p-age" value="${escapeHtml(client.profile.age || "")}" /></div>
        <div class="field"><label>Client 2 / Spouse</label>
          <input type="text" id="p-client2" value="${escapeHtml(client.profile.client2 || "")}" /></div>
        <div class="field"><label>Client 2 DOB</label>
          <input type="date" id="p-client2Dob" value="${escapeHtml(client.profile.client2Dob || "")}" /></div>
        <div class="field"><label>Client 2 SSN Last 4</label>
          <input type="text" id="p-client2Ssn4" inputmode="numeric" maxlength="4" value="${escapeHtml(client.profile.client2Ssn4 || "")}" /></div>
        <div class="field"><label>Client 2 Age</label>
          <input type="number" id="p-client2Age" value="${escapeHtml(client.profile.client2Age || "")}" /></div>
        <div class="field"><label>Report Date <span class="req">*</span></label>
          <input type="date" id="q-reportDate" value="${escapeHtml(q.reportDate)}" /></div>
      </div>
    </div>

    <!-- Cashflow / SACS inputs -->
    <div class="section-card">
      <h2>Cashflow &amp; Private Reserve (SACS)</h2>
      <p class="section-sub">Monthly inflow/outflow and reserve position.</p>
      <div class="field-grid">
        <div class="field"><label>Monthly Inflow / Salary <span class="req">*</span></label>
          <input type="number" id="q-monthlyInflow" value="${escapeHtml(q.monthlyInflow)}" /></div>
        <div class="field"><label>Monthly Outflow / Expenses <span class="req">*</span></label>
          <input type="number" id="q-monthlyOutflow" value="${escapeHtml(q.monthlyOutflow)}" /></div>
        <div class="field"><label>Insurance Deductibles (reserve add-on)</label>
          <input type="number" id="q-insuranceDeductibles" value="${escapeHtml(q.insuranceDeductibles)}" /></div>
        <div class="field"><label>Private Reserve Balance</label>
          <input type="number" id="q-privateReserveBalance" value="${escapeHtml(q.privateReserveBalance)}" /></div>
      </div>
      <div class="calc-strip" id="liveCalc"></div>
    </div>

    <!-- Accounts (TCC) -->
    <div class="section-card">
      <h2>Accounts &amp; Net Worth (TCC)</h2>
      <p class="section-sub">Grouped account balances. Liabilities are tracked separately and not subtracted from net worth.</p>

      <div class="group-label">Client 1 Retirement</div>
      <div id="g-client1Retirement">${acctRows(q.client1Retirement, "client1Retirement")}</div>
      <button class="add-row" onclick="addRow('client1Retirement')">+ Add account</button>

      <div class="group-label">Client 2 Retirement</div>
      <div id="g-client2Retirement">${acctRows(q.client2Retirement, "client2Retirement")}</div>
      <button class="add-row" onclick="addRow('client2Retirement')">+ Add account</button>

      <div class="group-label">Non-Retirement (excl. trust)</div>
      <div id="g-nonRetirement">${acctRows(q.nonRetirement, "nonRetirement")}</div>
      <button class="add-row" onclick="addRow('nonRetirement')">+ Add account</button>

      <div class="group-label">Trust / Home Value</div>
      <div id="g-trust">${acctRows(q.trust, "trust")}</div>
      <button class="add-row" onclick="addRow('trust')">+ Add holding</button>

      <div class="group-label">Liabilities (balance + interest rate)</div>
      <div id="g-liabilities">${liabRows(q.liabilities)}</div>
      <button class="add-row" onclick="addRow('liabilities')">+ Add liability</button>
    </div>

    <div class="action-bar no-print">
      <button class="btn btn-ghost" onclick="saveForm('${id}', false)">Save Draft</button>
      <button class="btn btn-green" onclick="saveForm('${id}', true)">Generate Reports</button>
    </div>
  `;

  // Live recalculation on any input change, clearing invalid state
  app.querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("input", () => {
      inp.classList.remove("invalid");
      refreshLiveCalc(id);
    });
  });
  refreshLiveCalc(id);
}

/* Read the form DOM back into a quarter object (so calc + save share one path). */
function readFormState(id) {
  const client = getClient(id);
  const q = client.quarter;

  client.profile.client1 = $("#p-client1").value.trim();
  client.profile.client2 = $("#p-client2").value.trim();
  client.profile.age = Number($("#p-age").value) || "";
  client.profile.client1Dob = $("#p-client1Dob").value;
  client.profile.client1Ssn4 = $("#p-client1Ssn4").value.trim();
  client.profile.client2Age = Number($("#p-client2Age").value) || "";
  client.profile.client2Dob = $("#p-client2Dob").value;
  client.profile.client2Ssn4 = $("#p-client2Ssn4").value.trim();
  q.reportDate = $("#q-reportDate").value;
  q.monthlyInflow = Number($("#q-monthlyInflow").value) || 0;
  q.monthlyOutflow = Number($("#q-monthlyOutflow").value) || 0;
  q.insuranceDeductibles = Number($("#q-insuranceDeductibles").value) || 0;
  q.privateReserveBalance = Number($("#q-privateReserveBalance").value) || 0;

  ["client1Retirement", "client2Retirement", "nonRetirement", "trust", "liabilities"].forEach((group) => {
    const rows = app.querySelectorAll(`.acct-row[data-group="${group}"]`);
    q[group] = Array.from(rows).map((row) => {
      const obj = { label: "", amount: 0 };
      if (group === "liabilities") obj.rate = 0;
      row.querySelectorAll("input").forEach((inp) => {
        const k = inp.dataset.k;
        obj[k] = k === "label" ? inp.value : Number(inp.value) || 0;
      });
      return obj;
    });
  });
  return client;
}

function refreshLiveCalc(id) {
  const client = readFormState(id);
  const k = calc(client.quarter);
  const reserveGap = k.privateReserveBalance - k.privateReserveTarget;
  const missingCount = countMissingFields(client);
  $("#formSummary").innerHTML = `
    <div class="summary-chip"><div class="k">Report date</div><div class="v">${fmtDate(client.quarter.reportDate)}</div></div>
    <div class="summary-chip"><div class="k">Reserve target</div><div class="v">${fmt(k.privateReserveTarget)}</div></div>
    <div class="summary-chip"><div class="k">TCC grand total</div><div class="v">${fmt(k.grandNetWorth)}</div></div>
    <div class="summary-chip ${missingCount ? "needs-attention" : "ready"}"><div class="k">Missing fields</div><div class="v">${missingCount ? missingCount : "Ready"}</div></div>
  `;
  $("#liveCalc").innerHTML = `
    <div class="calc-pill"><div class="k">SACS Excess (monthly)</div><div class="v">${fmt(k.sacsExcess)}</div></div>
    <div class="calc-pill"><div class="k">Private Reserve Target</div><div class="v">${fmt(k.privateReserveTarget)}</div></div>
    <div class="calc-pill"><div class="k">Reserve vs. Target</div><div class="v">${reserveGap >= 0 ? "+" : ""}${fmt(reserveGap)}</div></div>
    <div class="calc-pill"><div class="k">Grand Total Net Worth</div><div class="v">${fmt(k.grandNetWorth)}</div></div>
  `;
}

/* Row add/remove — persist DOM state first so edits aren't lost on re-render. */
function addRow(group) {
  const id = location.hash.split("/")[2];
  const client = readFormState(id);
  const blank = group === "liabilities" ? { label: "", amount: 0, rate: 0 } : { label: "", amount: 0 };
  client.quarter[group].push(blank);
  upsertClient(client);
  renderForm(id);
}
function removeRow(group, i) {
  const id = location.hash.split("/")[2];
  const client = readFormState(id);
  client.quarter[group].splice(i, 1);
  upsertClient(client);
  renderForm(id);
}

/* Save + optional validation gate before report generation. */
function saveForm(id, generate) {
  const client = readFormState(id);

  const inputs = {
    client1: $("#p-client1"),
    reportDate: $("#q-reportDate"),
    monthlyInflow: $("#q-monthlyInflow"),
    monthlyOutflow: $("#q-monthlyOutflow")
  };

  // Clear previous validation styling
  Object.values(inputs).forEach(inp => {
    if (inp) inp.classList.remove("invalid");
  });

  if (generate) {
    const missing = [];
    if (!client.profile.client1) {
      missing.push("Client 1 name");
      if (inputs.client1) inputs.client1.classList.add("invalid");
    }
    if (!client.quarter.reportDate) {
      missing.push("Report date");
      if (inputs.reportDate) inputs.reportDate.classList.add("invalid");
    }
    if (inputs.monthlyInflow && inputs.monthlyInflow.value.trim() === "") {
      missing.push("Monthly inflow");
      inputs.monthlyInflow.classList.add("invalid");
    }
    if (inputs.monthlyOutflow && inputs.monthlyOutflow.value.trim() === "") {
      missing.push("Monthly outflow");
      inputs.monthlyOutflow.classList.add("invalid");
    }
    const missingAccountFields = markMissingAccountFields();
    if (missingAccountFields) {
      missing.push("account labels and balances");
    }

    if (missing.length) {
      $("#formAlert").innerHTML = `<div class="alert">Please complete required fields before generating: ${missing.join(", ")}.</div>`;
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  }

  client.profile.lastReport = client.quarter.reportDate;
  upsertClient(client);
  if (generate) location.hash = "#/report/" + id;
}

/* ---------- View: Report preview (SACS + TCC) ---------- */
function renderReport(id) {
  const client = getClient(id);
  if (!client) {
    location.hash = "#/dashboard";
    return;
  }
  setNavContext("› " + (client.profile.client1 || "Client") + " — Report");
  const q = client.quarter;
  const k = calc(q);
  const names = client.profile.client1 + (client.profile.client2 ? " & " + client.profile.client2 : "");
  const displayNames = escapeHtml(names || "Client");
  const reserveGap = k.privateReserveBalance - k.privateReserveTarget;

  const count = (n) => fmt(n);

  const bubbles = (arr, liab = false) =>
    (arr.length ? arr : [{ label: "— none —", amount: 0 }])
      .map(
        (a) => `
      <div class="bubble ${liab ? "liab" : ""}">
        <div class="b-type">${escapeHtml(a.label)}</div>
        <div class="b-amt">${fmt(a.amount)}</div>
        ${liab && a.rate != null ? `<div class="b-rate">${escapeHtml(a.rate)}% interest</div>` : ""}
      </div>`
      )
      .join("");
  const clientInfoBubble = (name, age, dob, ssn4) => `
    <div class="client-info-bubble">
      <div class="info-name">${escapeHtml(name || "Client")}</div>
      <div>Age ${escapeHtml(age || "—")}</div>
      <div>DOB ${fmtDate(dob)}</div>
      <div>${ssnLabel(ssn4)}</div>
    </div>`;

  app.innerHTML = `
    <div class="report-toolbar no-print">
      <div class="left">
        <button class="btn btn-ghost" onclick="location.hash='#/client/${id}'">Edit balances</button>
        <button class="btn btn-ghost" onclick="location.hash='#/dashboard'">Dashboard</button>
      </div>
      <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <!-- ===== SACS REPORT ===== -->
    <section class="report-sheet">
      <div class="report-header">
        <div>
          <h2 class="r-title">SACS Cashflow Report</h2>
          <div class="r-client">${displayNames}</div>
        </div>
        <div class="r-date">
          <div class="r-logo">AW</div>
          <div style="margin-top:8px;">Report date<br/><strong>${fmtDate(q.reportDate)}</strong></div>
        </div>
      </div>

      <div class="cashflow cashflow-sacs">
        <div class="flow-node flow-inflow">
          <div class="label">Monthly Inflow</div>
          <div class="amt">${count(k.inflow)}</div>
        </div>
        <div class="flow-arrow transfer-arrow">
          <span>→</span>
          <small>Automated transfer</small>
        </div>
        <div class="flow-node flow-outflow">
          <div class="label">Monthly Outflow</div>
          <div class="amt">${count(k.outflow)}</div>
        </div>
        <div class="reserve-path">
          <span>↓</span>
          <small>Excess to reserve</small>
        </div>
        <div class="flow-node flow-reserve">
          <div class="label">Private Reserve</div>
          <div class="amt">${count(k.privateReserveBalance)}</div>
          <div class="sub">Target ${fmt(k.privateReserveTarget)}</div>
        </div>
      </div>

      <div class="sacs-summary">
        <div class="summary-box ${k.sacsExcess >= 0 ? "good" : "warn"}">
          <div class="k">SACS Excess (Inflow − Outflow)</div>
          <div class="v">${count(k.sacsExcess)}</div>
        </div>
        <div class="summary-box">
          <div class="k">Private Reserve Balance</div>
          <div class="v">${count(k.privateReserveBalance)}</div>
        </div>
        <div class="summary-box">
          <div class="k">Private Reserve Target</div>
          <div class="v">${count(k.privateReserveTarget)}</div>
        </div>
        <div class="summary-box ${reserveGap >= 0 ? "good" : "warn"}">
          <div class="k">Reserve vs. Target</div>
          <div class="v">${reserveGap >= 0 ? "Funded +" : "Short "}${fmt(Math.abs(reserveGap))}</div>
        </div>
      </div>
    </section>

    <!-- ===== TCC REPORT ===== -->
    <section class="report-sheet">
      <div class="report-header">
        <div>
          <h2 class="r-title">Total Client Chart (TCC)</h2>
          <div class="r-client">${displayNames}</div>
        </div>
        <div class="r-date">
          <div class="r-logo">AW</div>
          <div style="margin-top:8px;">Report date<br/><strong>${fmtDate(q.reportDate)}</strong></div>
        </div>
      </div>

      <div class="client-info-row">
        ${clientInfoBubble(client.profile.client1, client.profile.age, client.profile.client1Dob, client.profile.client1Ssn4)}
        ${client.profile.client2 ? clientInfoBubble(client.profile.client2, client.profile.client2Age, client.profile.client2Dob, client.profile.client2Ssn4) : ""}
      </div>

      <div class="tcc-group"><h3>Client 1 Retirement</h3><div class="bubble-row">${bubbles(q.client1Retirement)}</div></div>
      <div class="tcc-group"><h3>Client 2 Retirement</h3><div class="bubble-row">${bubbles(q.client2Retirement)}</div></div>
      <div class="tcc-group"><h3>Non-Retirement</h3><div class="bubble-row">${bubbles(q.nonRetirement)}</div></div>
      <div class="tcc-group"><h3>Trust / Home Value</h3><div class="bubble-row">${bubbles(q.trust)}</div></div>
      <div class="tcc-group"><h3>Liabilities</h3><div class="bubble-row">${bubbles(q.liabilities, true)}</div></div>

      <div class="tcc-totals">
        <div class="total-card"><div class="k">Client 1 Retirement</div><div class="v">${count(k.c1Retirement)}</div></div>
        <div class="total-card"><div class="k">Client 2 Retirement</div><div class="v">${count(k.c2Retirement)}</div></div>
        <div class="total-card"><div class="k">Non-Retirement</div><div class="v">${count(k.nonRetirement)}</div></div>
        <div class="total-card"><div class="k">Trust / Home</div><div class="v">${count(k.trustTotal)}</div></div>
        <div class="total-card grand"><div class="k">Grand Total Net Worth</div><div class="v">${count(k.grandNetWorth)}</div></div>
        <div class="total-card liab-total"><div class="k">Total Liabilities</div><div class="v">${count(k.liabilitiesTotal)}</div></div>
      </div>
      <div class="liab-note">Liabilities are shown separately and are not subtracted from the grand total net worth, per AW reporting methodology.</div>
    </section>

  `;
}

/* ---------- Boot ---------- */
$(".nav-btn[data-nav='dashboard']").addEventListener("click", () => (location.hash = "#/dashboard"));
loadClients(); // ensure seed exists
route();

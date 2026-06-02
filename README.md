# AW Client Report Portal — Demo

**Live Demo**: [View Live Demo Here](https://andermendz.github.io/sagan-demo/)

A small internal portal for a financial-planning team to enter client financial data and
generate polished **SACS cashflow** and **TCC net worth** quarterly reports in minutes
instead of a day of manual Canva/Word assembly.

Built as a focused **2-hour assessment demo** from PRD v1.0 — scoped to the core working
flow, not a production build.

> This demo focuses on the core V1 workflow: client profile → quarterly data entry → deterministic calculations → SACS/TCC report preview → print/export. Integrations, Canva export, auth, real database, and pixel-perfect PDF replication were intentionally left out to respect the 2-hour assessment limit.

---

## The flow it demonstrates

`Client list → quarterly balances form → automatic calculations → SACS/TCC report preview → print/PDF`

1. **Dashboard** — list of client households (2 seeded), each showing name, age, last report date, net worth, and a *Generate Quarterly Report* button.
2. **Quarterly Data Entry** — profile + cashflow + grouped account balances, all pre-populated with editable sample data. Calculations update **live** as you type. Required fields are validated before report generation.
3. **Report Preview** — two clean, print-ready report sheets:
   - **SACS**: green Inflow → red Outflow → blue Private Reserve cashflow visual, plus excess and reserve-vs-target summary boxes.
   - **TCC**: account bubbles grouped by Client 1 retirement / Client 2 retirement / non-retirement / trust / liabilities, plus summary totals and Grand Total Net Worth.
4. **Export** — *Print / Save as PDF* uses the browser's print-to-PDF; report area is print-styled (nav/notes hidden, page breaks between reports).

---

## How to run locally

No build step, no dependencies. Two options:

**Option A — just open it**
Double-click `index.html` (works directly from the file system).

**Option B — local server** (recommended, mirrors hosting)
```bash
# from the project folder
python -m http.server 8000
# then open http://localhost:8000
```
or with Node: `npx serve .`

Data is stored in **localStorage**. To reset to seed data, clear site data / run
`localStorage.clear()` in the browser console and refresh.

> Hosting note: because it's static, it deploys to Netlify/Vercel/GitHub Pages by dropping the folder in — that's the "link" deliverable.

---

## Calculations implemented

| Metric | Formula |
|---|---|
| SACS Excess | `monthly inflow − monthly outflow` |
| Private Reserve Target | `6 × monthly expenses + insurance deductibles` |
| Client 1 / Client 2 Retirement Total | sum of each client's retirement accounts |
| Non-Retirement Total | sum of non-retirement accounts (**excludes trust**) |
| Trust Total | sum of trust/home holdings |
| Grand Total Net Worth | `C1 retirement + C2 retirement + non-retirement + trust` |
| Liabilities Total | sum of liabilities — **shown separately, NOT subtracted from net worth** |

---

## What was intentionally left out (per PRD "out of scope" + 2-hour cap)

- Auth / login, real database, multi-user
- All external integrations: Schwab, Plaid, Pinnacle Bank, Zillow, RightCapital, PreciseFP, Dropbox
- Real Canva export, email sending
- AI reasoning (calculations are deterministic — no AI needed in V1)
- A heavy PDF-generation library or pixel-perfect match of the original SACS/TCC documents (used browser print-to-PDF instead)

## Tradeoffs made for the time cap

- **Vanilla HTML/CSS/JS + localStorage** over a framework — instant to run/host, nothing to break live, fastest path to a clickable end-to-end flow.
- **Print-to-PDF** over a PDF library — acceptable per PRD and avoids dependency overhead.
- Single seeded firm; numbers are illustrative HNW figures.

These are noted here for reviewers; the app UI itself stays focused on the reporting workflow.

---

## What to mention in the <2-min Loom

1. **Frame it (10s):** "Internal tool for a 3-person planning firm with ~6 quarterly clients — turns a full day of manual report assembly into minutes."
2. **Show the flow (60s):** Dashboard → open Harrison → tweak a balance and show calcs update live → Generate Report → SACS visual + TCC totals → Print/PDF.
3. **Call out product judgment (30s):**
   - Manual-entry V1 *by design* — external sources had reliability/compliance issues, so no integrations.
   - No AI — calcs are deterministic; AI would add risk, not value.
   - Liabilities shown separately, never netted against net worth (matches their methodology).
   - Picked a zero-dependency stack to ship a reliable working flow inside the time cap, not a half-built production app.
4. **Close (10s):** "Biggest value is killing manual math and the errors that come with it — and it's simple enough for a non-technical team."

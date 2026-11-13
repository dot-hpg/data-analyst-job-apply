(() => {
  "use strict";

  // ================= Config =================
  const GOAL = 500;
  const MILESTONES = [10, 25, 50, 75, 100];
  const STATUSES = [
    { key: "Shortlisted", color: "--s-shortlisted" },
    { key: "Ready to apply", color: "--s-ready" },
    { key: "Applied", color: "--s-applied" },
    { key: "Interviewing", color: "--s-interview" },
    { key: "Offer", color: "--s-offer" },
    { key: "Rejected", color: "--s-rejected" },
    { key: "Skipped", color: "--s-skipped" },
  ];
  const SENT = new Set(["Applied", "Interviewing", "Offer", "Rejected"]);
  const LOCAL_KEY = "job-tracker:jobs:v1";
  const THEME_KEY = "job-tracker:theme";
  const UI_KEY = "job-tracker:ui:v2";
  const MILESTONE_KEY = "job-tracker:milestone";

  const PORTALS = [
    ["linkedin", "LinkedIn"], ["naukri", "Naukri"], ["instahyre", "Instahyre"], ["wellfound", "Wellfound"],
    ["angel", "Wellfound"], ["built in", "Built In"], ["rocketship", "Remote Rocketship"], ["himalayas", "Himalayas"],
    ["greenhouse", "Greenhouse"], ["ashby", "Ashby"], ["lever", "Lever"], ["weekday", "Weekday"],
    ["work at a startup", "YC Startups"], ["yc ", "YC Startups"], ["foundit", "Foundit"], ["indeed", "Indeed"],
    ["cutshort", "Cutshort"], ["hirist", "Hirist"], ["iimjobs", "iimjobs"], ["glassdoor", "Glassdoor"],
    ["workday", "Workday"], ["whatsapp", "WhatsApp"], ["instinct", "Instinct"], ["email", "Email"], ["referral", "Referral"], ["careers", "Company site"], ["company", "Company site"],
  ];

  // ================= Helpers =================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
  const isoLocal = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
  const TODAY = isoLocal(new Date());
  const toDate = (s) => new Date(s + "T00:00:00");
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return isoLocal(d); };
  const dayDiff = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
  const fmtDate = (d, opts) => (d ? toDate(d).toLocaleDateString(undefined, opts || { day: "numeric", month: "short", year: "numeric" }) : "");
  const fmtShort = (d) => fmtDate(d, { day: "numeric", month: "short" });
  const rel = (d) => {
    if (!d) return "";
    const n = dayDiff(d, TODAY);
    if (n === 0) return "today";
    if (n === 1) return "yesterday";
    if (n > 1 && n < 7) return `${n} days ago`;
    if (n < 0) return fmtShort(d);
    return fmtShort(d);
  };
  const statusVar = (s) => `var(${(STATUSES.find((x) => x.key === s) || STATUSES[0]).color})`;
  const hueOf = (s) => { let h = 0; for (const c of String(s || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };
  const initials = (s) => {
    const w = String(s || "?").replace(/[^\p{L}\p{N}\s&]/gu, " ").split(/\s+/).filter((x) => x && x !== "&");
    return ((w[0] || "?")[0] + (w[1] ? w[1][0] : (w[0] || "").slice(1, 2))).toUpperCase();
  };
  const avatar = (j, cls = "") => `<span class="avatar ${cls}" style="--h:${hueOf(j.company)}" aria-hidden="true">${esc(initials(j.company))}</span>`;
  const pill = (s) => `<span class="pill" style="--c:${statusVar(s)}">${esc(s || "Shortlisted")}</span>`;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ICON = {
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z"/></svg>',
    queue: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    reply: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
    dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    brief: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
  };

  // ================= Derived fields =================
  function portalOf(j) {
    const raw = String(j.applied_via || j.source || "").trim();
    const s = raw.toLowerCase() + " ";
    for (const [needle, label] of PORTALS) if (s.includes(needle)) return label;
    return raw ? raw.replace(/\s*\(.*$/, "").slice(0, 24) : "Other";
  }
  function placeOf(j) {
    const wt = String(j.work_type || "").toLowerCase();
    const loc = String(j.location || "").toLowerCase();
    if (wt.startsWith("remote") || (/remote/.test(loc) && !/hybrid|on-?site/.test(wt))) return "Remote";
    const t = wt + " " + loc;
    if (/hyderabad|secunderabad|hitec|gachibowli/.test(t)) return "Hyderabad";
    if (/bangalore|bengaluru/.test(t)) return "Bangalore";
    if (/pune/.test(t)) return "Pune";
    if (/chennai/.test(t)) return "Chennai";
    if (/mumbai/.test(t)) return "Mumbai";
    if (/delhi|gurgaon|gurugram|noida/.test(t)) return "Delhi NCR";
    return "Other";
  }
  function workOf(j) {
    const wt = String(j.work_type || "").toLowerCase();
    if (wt.startsWith("remote")) return "Remote";
    if (wt.includes("hybrid")) return "Hybrid";
    if (/remote/.test(String(j.location || "").toLowerCase()) && !wt) return "Remote";
    return "On-site";
  }

  // ================= State =================
  let baseJobs = [];
  let jobs = [];
  let activity = [];
  let editingId = null;
  let drawerId = null;
  let showAllActivity = false;
  const ui = Object.assign({ view: "cards", sort: "applied", tsort: { key: "applied", asc: false } }, safeParse(store.get(UI_KEY)) || {});
  const filt = { status: new Set(), portal: new Set(), place: new Set(), work: new Set(), q: "" };
  function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
  function saveUi() { store.set(UI_KEY, JSON.stringify({ view: ui.view, sort: ui.sort, tsort: ui.tsort })); }

  // ================= Theme =================
  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set(THEME_KEY, next);
    requestAnimationFrame(renderCharts);
  });

  // ================= Data =================
  // Read the newest data straight from GitHub (updates the moment a change is pushed),
  // and fall back to the copy deployed with the site.
  const GH_RAW = "https://raw.githubusercontent.com/dot-hpg/data-analyst-job-apply/main/";
  let lastSync = null;
  async function getJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + url);
    return res.json();
  }
  async function fetchData(path, listKey) {
    const t = Date.now();
    const [gh, site] = await Promise.allSettled([getJson(`${GH_RAW}${path}?t=${t}`), getJson(`${path}?t=${t}`)]);
    const list = (r) => (r.status === "fulfilled" ? (Array.isArray(r.value) ? r.value : r.value[listKey]) : null);
    const a = list(gh), b = list(site);
    if (!a && !b) throw new Error("Could not load " + path);
    if (!a) return b;
    if (!b) return a;
    const score = (l) => l.filter((j) => SENT.has(j.status)).length * 100000 + l.length;
    return listKey === "jobs" ? (score(b) > score(a) ? b : a) : (b.length > a.length ? b : a);
  }

  async function load(first = true) {
    try {
      baseJobs = await fetchData("data/jobs.json", "jobs");
    } catch (e) {
      console.error(e);
      if (first) baseJobs = [];
      else { toast("Couldn't reach the latest data. Check your connection."); return false; }
    }
    baseJobs.forEach((j, i) => { j._i = i; });
    // Start from the published data, then lay this browser's own edits on top,
    // so jobs added to data/jobs.json later always show up.
    jobs = baseJobs.map((j) => ({ ...j }));
    const local = safeParse(store.get(LOCAL_KEY));
    if (Array.isArray(local)) {
      const byId = new Map(jobs.map((j) => [j.id, j]));
      const rank = (s) => (SENT.has(s) ? 1 : 0);
      for (const lj of local) {
        const bj = byId.get(lj.id);
        if (!bj) { jobs.push({ ...lj, _i: jobs.length }); continue; }
        const merged = { ...bj, ...lj, _i: bj._i };
        // Keep the published status when it has moved further along (e.g. Applied).
        if (rank(bj.status) > rank(lj.status)) { merged.status = bj.status; merged.date_applied = bj.date_applied; }
        byId.set(lj.id, merged);
      }
      jobs = jobs.map((j) => byId.get(j.id) || j);
    }
    lastSync = Date.now();
    renderAll(first);
    renderSync();
    checkMilestone();
    if (first) openFromHash();
    else if (drawerId) openDrawer(drawerId);
    return true;
  }

  async function loadActivity() {
    try {
      activity = (await fetchData("data/activity.json", "activity")).map((a, i) => ({ ...a, _i: i }));
    } catch (e) {
      console.error(e);
    }
    renderActivity();
  }

  function renderSync() {
    const el = $("#syncLabel");
    if (!el || !lastSync) return;
    const s = Math.round((Date.now() - lastSync) / 1000);
    el.textContent = s < 45 ? "Updated just now" : s < 3600 ? `Updated ${Math.round(s / 60)} min ago` : `Updated ${Math.round(s / 3600)} h ago`;
  }
  setInterval(renderSync, 30000);

  let refreshing = false;
  async function refresh(silent) {
    if (refreshing) return;
    refreshing = true;
    const btn = $("#refreshBtn");
    btn.classList.add("spin");
    btn.disabled = true;
    const before = stats().sent.length;
    const ok = await load(false);
    await loadActivity();
    btn.classList.remove("spin");
    btn.disabled = false;
    refreshing = false;
    if (!ok) return;
    const diff = stats().sent.length - before;
    if (!silent || diff > 0) toast(diff > 0 ? `${diff} new application${diff > 1 ? "s" : ""} · ${stats().sent.length} applied` : `Up to date · ${stats().sent.length} applied`);
  }
  $("#refreshBtn").addEventListener("click", () => refresh(false));
  // Pick up new applications when you come back to the tab or app.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && lastSync && Date.now() - lastSync > 60000) refresh(true);
  });

  function persist(msg) {
    store.set(LOCAL_KEY, JSON.stringify(jobs.map(({ _i, ...j }) => j)));
    renderAll(false);
    if (msg) toast(msg);
  }

  // ================= Stats =================
  function stats() {
    const sent = jobs.filter((j) => SENT.has(j.status));
    const byDay = new Map();
    for (const j of sent) if (j.date_applied) byDay.set(j.date_applied, (byDay.get(j.date_applied) || 0) + 1);
    const days = [...byDay.keys()].sort();
    const first = days[0] || TODAY;
    const span = Math.max(1, dayDiff(first, TODAY) + 1);
    const pace = sent.length / span;
    const remaining = Math.max(0, GOAL - sent.length);
    const eta = pace > 0 && remaining > 0 ? addDays(TODAY, Math.ceil(remaining / pace)) : null;
    let streak = 0;
    let d = byDay.get(TODAY) ? TODAY : addDays(TODAY, -1);
    while (byDay.get(d)) { streak++; d = addDays(d, -1); }
    let best = ["", 0];
    for (const [k, v] of byDay) if (v > best[1]) best = [k, v];
    const count = (k) => jobs.filter((j) => j.status === k).length;
    const heard = count("Interviewing") + count("Offer") + count("Rejected");
    const remote = sent.filter((j) => placeOf(j) === "Remote").length;
    const fits = sent.map((j) => j.fit_score).filter((v) => typeof v === "number" && !isNaN(v));
    return {
      sent, byDay, first, span, pace, remaining, eta, streak, best, count, heard, remote,
      today: byDay.get(TODAY) || 0,
      avgFit: fits.length ? Math.round(fits.reduce((a, b) => a + b, 0) / fits.length) : null,
      queue: count("Ready to apply") + count("Shortlisted"),
      interviews: count("Interviewing") + count("Offer"),
    };
  }

  // ================= Render: hero + KPIs =================
  function animateNum(el, to, { suffix = "", dur = 900 } = {}) {
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    if (reduceMotion || from === to) { el.textContent = to + suffix; return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderHero(S) {
    const n = S.sent.length;
    const h = new Date().getHours();
    $("#greeting").textContent = `${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"}, Hari · Day ${S.span} of the hunt`;
    animateNum($("#heroApplied"), n, { dur: 1200 });
    $("#heroGoal").textContent = GOAL;
    $$(".goal-n").forEach((e) => (e.textContent = GOAL));
    const pct = Math.min(100, Math.round((n / GOAL) * 100));
    $("#goalFill").style.width = pct + "%";
    const C = 2 * Math.PI * 84;
    $("#ringFg").style.strokeDasharray = C;
    $("#ringFg").style.strokeDashoffset = C * (1 - pct / 100);
    animateNum($("#ringPct"), pct, { suffix: "%", dur: 1200 });
    $("#goalMarks").innerHTML = [0, 25, 50, 75, 100].map((m) =>
      `<span class="${n >= m * GOAL / 100 ? "hit" : ""}" style="left:${m}%">${Math.round(m * GOAL / 100)}</span>`).join("");

    let lede;
    if (n >= GOAL) lede = `<b>Goal reached!</b> ${n} applications sent. Keep the momentum going and watch for replies.`;
    else if (!n) lede = `No applications logged yet. The first one is the hardest.`;
    else {
      lede = `<b>${S.remaining} to go.</b> At your pace of <b>${S.pace >= 10 ? Math.round(S.pace) : S.pace.toFixed(1)} a day</b>, you'll reach ${GOAL} around <b>${fmtDate(S.eta, { weekday: "short", day: "numeric", month: "short" })}</b>.`;
      const next = MILESTONES.find((m) => m > n);
      if (next && next !== GOAL) lede += ` Next milestone: <b>${next}</b> (${next - n} away).`;
    }
    $("#heroLede").innerHTML = lede;

    const chips = [
      ["🔥", `<b>${S.streak}</b>-day streak`],
      ["⚡", `<b>${S.today}</b> sent today`],
      S.best[1] ? ["🏆", `Best day <b>${S.best[1]}</b> · ${fmtShort(S.best[0])}`] : null,
      ["📬", `<b>${S.heard}</b> replies so far`],
    ].filter(Boolean);
    $("#heroChips").innerHTML = chips.map(([e, t]) => `<span class="chip"><span class="e" aria-hidden="true">${e}</span><span>${t}</span></span>`).join("");
  }

  function renderKpis(S) {
    const n = S.sent.length;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const items = [
      { l: "Applied", v: n, ico: ICON.send, c: "var(--s-applied)", f: S.today ? `<span class="up">+${S.today}</span> today` : "none yet today" },
      { l: "In the queue", v: S.queue, ico: ICON.queue, c: "var(--s-ready)", f: "shortlisted or ready" },
      { l: "Interviews", v: S.interviews, ico: ICON.chat, c: "var(--s-interview)", f: S.count("Offer") ? `${S.count("Offer")} offer${S.count("Offer") > 1 ? "s" : ""} 🎉` : "keep an eye on email" },
      { l: "Response rate", v: pct(S.heard, n), suffix: "%", ico: ICON.reply, c: "var(--s-offer)", f: `${S.heard} of ${n} heard back` },
      { l: "Remote roles", v: pct(S.remote, n), suffix: "%", ico: ICON.home, c: "var(--s-shortlisted)", f: `${S.remote} of ${n} applications` },
      { l: "Avg. fit", v: S.avgFit ?? 0, suffix: S.avgFit == null ? "" : "", ico: ICON.star, c: "var(--accent)", f: S.avgFit == null ? "no scores yet" : "match vs. your resume" },
    ];
    const box = $("#kpis");
    if (!box.children.length) {
      box.innerHTML = items.map((k, i) => `<div class="kpi" style="--c:${k.c}"><div class="k-top"><span>${k.l}</span><span class="k-ico" aria-hidden="true">${k.ico}</span></div><div class="k-n"><span data-k="${i}">0</span><small></small></div><div class="k-foot"></div></div>`).join("");
    }
    items.forEach((k, i) => {
      const card = box.children[i];
      animateNum($(`[data-k="${i}"]`, card), k.v);
      $("small", card).textContent = k.suffix || (k.l === "Avg. fit" && S.avgFit != null ? "/100" : "");
      $(".k-foot", card).innerHTML = k.f;
    });
  }

  function renderFunnel(S) {
    const total = jobs.length || 1;
    $("#funnel").innerHTML = STATUSES.map((s) => {
      const c = S.count(s.key);
      const on = filt.status.has(s.key);
      return `<button type="button" class="stage${on ? " on" : ""}${c ? "" : " zero"}" style="--c:var(${s.color})" data-stage="${esc(s.key)}" aria-pressed="${on}">
        <div class="st-name">${esc(s.key)}</div>
        <div class="st-n">${c}</div>
        <div class="st-bar"><i style="width:${(c / total) * 100}%"></i></div>
        <div class="st-pct">${Math.round((c / total) * 100)}% of ${jobs.length} tracked</div>
      </button>`;
    }).join("");
  }

  // ================= Charts =================
  const tip = $("#tip");
  function showTip(x, y, html) { tip.innerHTML = html; tip.hidden = false; const w = tip.offsetWidth / 2 + 8; tip.style.left = Math.max(w, Math.min(innerWidth - w, x)) + "px"; tip.style.top = Math.max(50, y) + "px"; }
  function hideTip() { tip.hidden = true; }

  function niceMax(v) {
    if (v <= 5) return 5;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }

  function renderRoad(S) {
    const el = $("#chartRoad");
    const W = Math.max(300, el.clientWidth);
    const H = W < 520 ? 200 : 250;
    const pad = { l: 34, r: 14, t: 16, b: 26 };
    const start = addDays(S.first, -1);
    let end = S.eta || addDays(TODAY, 7);
    if (dayDiff(start, end) > 45) end = addDays(start, 45);
    if (dayDiff(TODAY, end) < 3) end = addDays(TODAY, 3);
    const nDays = dayDiff(start, end);
    const yMax = Math.max(GOAL, S.sent.length);
    const x = (d) => pad.l + (dayDiff(start, d) / nDays) * (W - pad.l - pad.r);
    const y = (v) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);

    const pts = [];
    let cum = 0;
    for (let d = start; d <= TODAY; d = addDays(d, 1)) { cum += S.byDay.get(d) || 0; pts.push([d, cum, S.byDay.get(d) || 0]); }
    // Applications without a date still count toward the total; add them on the first day.
    const undated = S.sent.length - cum;
    if (undated > 0) pts.forEach((p, i) => { if (i > 0) p[1] += undated; });
    const last = pts[pts.length - 1];
    const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
    const area = `${line}L${x(last[0]).toFixed(1)},${y(0)}L${x(pts[0][0]).toFixed(1)},${y(0)}Z`;
    let proj = "";
    if (S.remaining > 0 && S.pace > 0) {
      const daysTo = Math.ceil(S.remaining / S.pace);
      const pe = dayDiff(TODAY, end) < daysTo ? end : addDays(TODAY, daysTo);
      const pv = Math.min(GOAL, last[1] + S.pace * dayDiff(TODAY, pe));
      proj = `<path class="proj" d="M${x(TODAY)},${y(last[1])}L${x(pe)},${y(pv)}"/>` + (pv >= GOAL ? `<circle cx="${x(pe)}" cy="${y(GOAL)}" r="5" fill="var(--surface)" stroke="var(--accent-2)" stroke-width="2"/>` : "");
    }
    const ticks = [0, 25, 50, 75, 100].map((p) => Math.round(p * yMax / 100));
    const xt = [];
    const stepX = Math.max(1, Math.ceil(nDays / (W < 520 ? 4 : 8)));
    for (let i = 0; i <= nDays; i += stepX) xt.push(addDays(start, i));
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Cumulative applications: ${last[1]} of ${GOAL}">
      <defs><linearGradient id="roadFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="gridline" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join("")}
      ${xt.map((d) => `<text class="axis-t" x="${x(d)}" y="${H - 6}" text-anchor="middle">${fmtShort(d)}</text>`).join("")}
      <line class="goal-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(GOAL)}" y2="${y(GOAL)}"/>
      <text class="goal-t" x="${W - pad.r}" y="${y(GOAL) - 6}" text-anchor="end">Goal ${GOAL}</text>
      <path class="area" d="${area}" fill="url(#roadFill)"/>
      ${proj}
      <path class="line" d="${line}"/>
      <circle class="dot" cx="${x(last[0])}" cy="${y(last[1])}" r="6"/>
      <text class="val-t" x="${x(last[0]) - 10}" y="${y(last[1]) - 10}" text-anchor="end">${last[1]} today</text>
      <line class="hover-line" id="roadHover" x1="0" x2="0" y1="${pad.t}" y2="${H - pad.b}" visibility="hidden"/>
      <rect class="hit" x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${H}" id="roadHit"/>
    </svg>
    <div class="chart-legend"><span><i></i>Applications sent</span>${proj ? `<span><i class="dash"></i>Projection at current pace</span>` : ""}<span><i class="goal"></i>Goal</span></div>`;
    $("#roadSub").textContent = S.eta ? `At this pace you hit ${GOAL} around ${fmtDate(S.eta, { day: "numeric", month: "short" })}.` : "Cumulative applications against the goal.";
    const hit = $("#roadHit", el), hl = $("#roadHover", el);
    const move = (ev) => {
      const r = hit.getBoundingClientRect();
      const fx = (ev.clientX - r.left) / r.width;
      const di = Math.round(fx * (W - pad.l - pad.r) / ((W - pad.l - pad.r) / nDays));
      const d = addDays(start, Math.max(0, Math.min(nDays, di)));
      const p = pts.find((q) => q[0] === d);
      hl.setAttribute("x1", x(d)); hl.setAttribute("x2", x(d)); hl.setAttribute("visibility", "visible");
      const sr = el.querySelector("svg").getBoundingClientRect();
      const sx = sr.left + (x(d) / W) * sr.width;
      if (p) showTip(sx, sr.top + (y(p[1]) / H) * sr.height, `${fmtDate(d, { weekday: "short", day: "numeric", month: "short" })}<small>${p[1]} total · +${p[2]} that day</small>`);
      else if (d > TODAY && S.pace > 0) { const pv = Math.min(GOAL, Math.round(last[1] + S.pace * dayDiff(TODAY, d))); showTip(sx, sr.top + (y(pv) / H) * sr.height, `${fmtDate(d, { weekday: "short", day: "numeric", month: "short" })}<small>~${pv} projected</small>`); }
      else hideTip();
    };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", () => { hideTip(); hl.setAttribute("visibility", "hidden"); });
  }

  function renderDaily(S) {
    const el = $("#chartDaily");
    const W = Math.max(280, el.clientWidth);
    const H = 210;
    const pad = { l: 28, r: 6, t: 18, b: 26 };
    const N = 14;
    const days = [];
    for (let i = N - 1; i >= 0; i--) days.push(addDays(TODAY, -i));
    const vals = days.map((d) => S.byDay.get(d) || 0);
    const vmax = niceMax(Math.max(1, ...vals));
    const bw = (W - pad.l - pad.r) / N;
    const barW = Math.max(6, Math.min(26, bw - 6));
    const y = (v) => pad.t + (1 - v / vmax) * (H - pad.t - pad.b);
    const maxV = Math.max(...vals);
    const ticks = [0, vmax / 2, vmax];
    const total = vals.reduce((a, b) => a + b, 0);
    $("#dailySub").textContent = `Last 14 days · ${total} sent`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Applications per day, last 14 days">
      ${ticks.map((t) => `<line class="gridline" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end">${Math.round(t)}</text>`).join("")}
      ${days.map((d, i) => {
        const v = vals[i];
        const cx = pad.l + bw * i + bw / 2;
        const h = Math.max(0, y(0) - y(v));
        const r = Math.min(4, barW / 2, h);
        const x0 = cx - barW / 2, y0 = y(v);
        const path = h > 0 ? `M${x0},${y(0)}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + barW - r}Q${x0 + barW},${y0} ${x0 + barW},${y0 + r}V${y(0)}Z` : "";
        const showLabel = v && (v === maxV || d === TODAY);
        const showX = i % (W < 420 ? 3 : 2) === (N - 1) % (W < 420 ? 3 : 2);
        return `${path ? `<path class="bar${d === TODAY ? " today" : ""}" d="${path}"/>` : ""}
          ${showLabel ? `<text class="val-t" x="${cx}" y="${y0 - 5}" text-anchor="middle">${v}</text>` : ""}
          ${showX ? `<text class="axis-t" x="${cx}" y="${H - 6}" text-anchor="middle">${d === TODAY ? "Today" : fmtDate(d, { day: "numeric" })}</text>` : ""}
          <rect class="hit" x="${pad.l + bw * i}" y="${pad.t}" width="${bw}" height="${H - pad.t - pad.b}" data-d="${d}" data-v="${v}"/>`;
      }).join("")}
    </svg>`;
    $$(".hit", el).forEach((r) => {
      r.addEventListener("pointerenter", () => {
        const b = r.getBoundingClientRect();
        showTip(b.left + b.width / 2, b.top + b.height * 0.35, `${fmtDate(r.dataset.d, { weekday: "short", day: "numeric", month: "short" })}<small>${r.dataset.v} application${r.dataset.v === "1" ? "" : "s"}</small>`);
      });
      r.addEventListener("pointerleave", hideTip);
    });
  }

  function hbars(el, entries, key, total) {
    const max = Math.max(1, ...entries.map((e) => e[1]));
    el.innerHTML = entries.map(([label, n]) => {
      const on = filt[key].has(label);
      return `<button type="button" class="hbar${on ? " on" : ""}" data-f="${key}" data-val="${esc(label)}" aria-pressed="${on}" title="${esc(label)}: ${n} (${Math.round((n / total) * 100)}%)">
        <span class="hb-l">${esc(label)}</span>
        <span class="hb-track"><span class="hb-fill" data-w="${(n / max) * 100}"></span></span>
        <span class="hb-n">${n}</span>
      </button>`;
    }).join("") || `<p class="sub">Nothing applied yet.</p>`;
    requestAnimationFrame(() => $$(".hb-fill", el).forEach((f) => (f.style.width = f.dataset.w + "%")));
  }

  function tally(list, fn, top = 8) {
    const m = new Map();
    for (const j of list) { const k = fn(j); m.set(k, (m.get(k) || 0) + 1); }
    let e = [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (e.length > top) {
      const rest = e.slice(top - 1).reduce((a, b) => a + b[1], 0);
      const head = e.slice(0, top - 1);
      const otherInHead = head.find((x) => x[0] === "Other");
      if (otherInHead) otherInHead[1] += rest;
      e = otherInHead ? head : [...head, ["Other", rest]];
    }
    return e;
  }

  function renderSkills(S) {
    const m = new Map();
    for (const j of S.sent) for (const s of j.skills || []) {
      const k = String(s).trim(); if (!k) continue;
      const key = k.toLowerCase();
      const cur = m.get(key) || { label: k, n: 0 };
      cur.n++; m.set(key, cur);
    }
    const top = [...m.values()].sort((a, b) => b.n - a.n).slice(0, 18);
    $("#chartSkills").innerHTML = top.map((s, i) => `<button type="button" class="skill${i < 3 ? " lvl1" : i < 8 ? " lvl2" : ""}" data-skill="${esc(s.label)}" title="Show roles asking for ${esc(s.label)}">${esc(s.label)} <b>${s.n}</b></button>`).join("") || `<p class="sub">No skills listed yet.</p>`;
  }

  let lastStats = null;
  function renderCharts() {
    if (!lastStats) return;
    renderRoad(lastStats);
    renderDaily(lastStats);
  }

  // ================= Explorer =================
  function filterChips(id, key, entries, colored) {
    $(id).innerHTML = entries.map(([label, n]) => {
      const on = filt[key].has(label);
      return `<button type="button" class="fchip${on ? " on" : ""}" data-f="${key}" data-val="${esc(label)}" aria-pressed="${on}">${colored ? `<span class="dot" style="--c:${statusVar(label)}"></span>` : ""}${esc(label)} <span class="n">${n}</span></button>`;
    }).join("");
  }

  function matches(j, skip) {
    if (skip !== "status" && filt.status.size && !filt.status.has(j.status)) return false;
    if (skip !== "portal" && filt.portal.size && !filt.portal.has(portalOf(j))) return false;
    if (skip !== "place" && filt.place.size && !filt.place.has(placeOf(j))) return false;
    if (skip !== "work" && filt.work.size && !filt.work.has(workOf(j))) return false;
    if (filt.q) {
      const hay = [j.company, j.role, j.location, j.work_type, j.notes, j.why_fit, j.source, j.applied_via, j.salary, (j.skills || []).join(" ")].join(" ").toLowerCase();
      if (!filt.q.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    return true;
  }

  const SORTS = {
    applied: (a, b) => (b.date_applied || "").localeCompare(a.date_applied || "") || (SENT.has(b.status) - SENT.has(a.status)) || b._i - a._i,
    fit: (a, b) => (b.fit_score ?? -1) - (a.fit_score ?? -1) || a._i - b._i,
    found: (a, b) => (b.date_found || "").localeCompare(a.date_found || "") || b._i - a._i,
    company: (a, b) => (a.company || "").localeCompare(b.company || ""),
  };

  function renderFilters() {
    const countBy = (key, fn, order) => {
      const m = new Map();
      for (const j of jobs) if (matches(j, key)) { const k = fn(j); m.set(k, (m.get(k) || 0) + 1); }
      for (const v of filt[key]) if (!m.has(v)) m.set(v, 0);
      let e = [...m.entries()];
      if (order) e.sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
      else e.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      return e;
    };
    filterChips("#fStatus", "status", countBy("status", (j) => j.status || "Shortlisted", STATUSES.map((s) => s.key)), true);
    filterChips("#fPortal", "portal", countBy("portal", portalOf));
    filterChips("#fLocation", "place", countBy("place", placeOf));
    filterChips("#fWork", "work", countBy("work", workOf, ["Remote", "Hybrid", "On-site"]));

    const act = [];
    for (const k of ["status", "portal", "place", "work"]) for (const v of filt[k]) act.push(`<button type="button" class="fchip on" data-f="${k}" data-val="${esc(v)}" aria-label="Remove filter ${esc(v)}">${esc(v)} ✕</button>`);
    if (filt.q) act.push(`<button type="button" class="fchip on" data-clearq="1">“${esc(filt.q)}” ✕</button>`);
    $("#activeFilters").hidden = !act.length;
    $("#activeFilters").innerHTML = act.length ? `<span>Filtered by</span>${act.join("")}<button type="button" class="link" id="clearFilters">Clear all</button>` : "";
  }

  function renderExplorer() {
    renderFilters();
    const rows = jobs.filter((j) => matches(j)).sort(SORTS[ui.sort] || SORTS.applied);
    $("#resultCount").textContent = `· ${rows.length}${rows.length !== jobs.length ? ` of ${jobs.length}` : ""}`;
    $("#empty").hidden = rows.length > 0;
    $$(".seg button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === ui.view)));
    $("#viewCards").hidden = ui.view !== "cards" || !rows.length;
    $("#viewTable").hidden = ui.view !== "table" || !rows.length;
    $("#viewBoard").hidden = ui.view !== "board";
    $("#sort").value = ui.sort;
    if (ui.view === "cards") renderCards(rows);
    else if (ui.view === "table") renderTable(rows);
    else renderBoard(rows);
    if (ui.view === "board") $("#empty").hidden = true;
  }

  function cardHtml(j, i) {
    const place = placeOf(j);
    const fit = typeof j.fit_score === "number" ? j.fit_score : null;
    const when = j.date_applied ? `Applied ${rel(j.date_applied)}` : j.date_found ? `Found ${rel(j.date_found)}` : "";
    const skills = (j.skills || []).slice(0, 3);
    const more = (j.skills || []).length - skills.length;
    return `<button type="button" class="card" data-open="${esc(j.id)}" style="animation-delay:${Math.min(i, 18) * 22}ms">
      ${j.date_applied === TODAY && SENT.has(j.status) ? `<span class="new-badge">New</span>` : ""}
      <div class="card-top">${avatar(j)}<div class="card-id"><div class="card-co">${esc(j.company)}</div><div class="card-role">${esc(j.role)}</div></div>${pill(j.status)}</div>
      <div class="meta">
        <span class="tag">${place === "Remote" ? ICON.globe : ICON.pin}${esc(place === "Remote" ? "Remote" : place === "Other" ? (j.location || "—") : place)}${workOf(j) === "Hybrid" ? " · Hybrid" : ""}</span>
        <span class="tag">${ICON.link}${esc(portalOf(j))}</span>
        ${skills.map((s) => `<span class="tag skill-t">${esc(s)}</span>`).join("")}${more > 0 ? `<span class="tag skill-t">+${more}</span>` : ""}
      </div>
      <div class="card-foot"><span>${esc(when)}</span>${fit != null ? `<span class="fit" title="Fit ${fit}/100">Fit <span class="fit-meter"><i style="width:${fit}%"></i></span><b>${fit}</b></span>` : ""}</div>
    </button>`;
  }
  function renderCards(rows) { $("#viewCards").innerHTML = rows.map(cardHtml).join(""); }

  function renderTable(rows) {
    const k = ui.tsort.key;
    const val = {
      company: (j) => (j.company || "").toLowerCase(), role: (j) => (j.role || "").toLowerCase(),
      status: (j) => STATUSES.findIndex((s) => s.key === j.status), place: placeOf, portal: portalOf,
      applied: (j) => j.date_applied || "", fit: (j) => j.fit_score ?? -1,
    }[k] || ((j) => j.date_applied || "");
    const sorted = rows.slice().sort((a, b) => {
      const va = val(a), vb = val(b);
      const c = va < vb ? -1 : va > vb ? 1 : 0;
      return (ui.tsort.asc ? c : -c) || b._i - a._i;
    });
    $$(".grid-table th").forEach((th) => { th.classList.toggle("sorted", th.dataset.sort === k); th.classList.toggle("asc", th.dataset.sort === k && ui.tsort.asc); });
    $("#tableRows").innerHTML = sorted.map((j) => `<tr data-open="${esc(j.id)}" tabindex="0">
      <td><div class="co-cell">${avatar(j)}<span>${esc(j.company)}</span></div></td>
      <td>${esc(j.role)}</td>
      <td>${pill(j.status)}</td>
      <td>${esc(placeOf(j) === "Other" ? j.location || "—" : placeOf(j))}<div class="muted" style="font-size:.76rem">${esc(workOf(j))}</div></td>
      <td>${esc(portalOf(j))}</td>
      <td class="tnum" style="white-space:nowrap">${j.date_applied ? fmtShort(j.date_applied) : `<span class="muted">—</span>`}</td>
      <td class="num">${j.fit_score ?? `<span class="muted">—</span>`}</td>
    </tr>`).join("");
  }

  function renderBoard(rows) {
    const cols = STATUSES.map((s) => {
      const list = rows.filter((j) => (j.status || "Shortlisted") === s.key);
      return `<div class="col" data-col="${esc(s.key)}" style="--c:var(${s.color})">
        <div class="col-head">${pill(s.key)}<span class="count">${list.length}</span></div>
        <div class="col-list">${list.map((j) => `<button type="button" class="mini" draggable="true" data-open="${esc(j.id)}" data-drag="${esc(j.id)}">${avatar(j)}<div><div class="m-co">${esc(j.company)}</div><div class="m-role">${esc(j.role)}</div></div></button>`).join("") || `<div class="col-empty">Drop a role here</div>`}</div>
      </div>`;
    }).join("");
    $("#viewBoard").innerHTML = cols;
    if (!$("#boardHint")) $("#viewBoard").insertAdjacentHTML("afterend", `<p class="board-hint" id="boardHint">Drag a card to another column to change its status, or tap it to open details.</p>`);
    $("#boardHint").hidden = ui.view !== "board";
  }

  // Drag & drop on the board
  let dragId = null;
  document.addEventListener("dragstart", (e) => { const t = e.target.closest && e.target.closest("[data-drag]"); if (!t) return; dragId = t.dataset.drag; t.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", dragId); } catch { /* ignore */ } });
  document.addEventListener("dragend", (e) => { const t = e.target.closest && e.target.closest("[data-drag]"); if (t) t.classList.remove("dragging"); $$(".col.drop").forEach((c) => c.classList.remove("drop")); });
  document.addEventListener("dragover", (e) => { const c = e.target.closest && e.target.closest(".col"); if (!c || !dragId) return; e.preventDefault(); $$(".col.drop").forEach((x) => x !== c && x.classList.remove("drop")); c.classList.add("drop"); });
  document.addEventListener("drop", (e) => { const c = e.target.closest && e.target.closest(".col"); if (!c || !dragId) return; e.preventDefault(); setStatus(dragId, c.dataset.col); dragId = null; });

  // ================= Drawer =================
  const drawer = $("#drawer");
  function openDrawer(id) {
    const j = jobs.find((x) => x.id === id);
    if (!j) return;
    drawerId = id;
    const url = safeUrl(j.link);
    const fact = (label, v) => (v || v === 0 ? `<div class="fact"><span>${label}</span><b>${esc(v)}</b></div>` : "");
    const rec = [j.recruiter_name, j.recruiter_email].filter(Boolean).join(" · ");
    $("#drawerBody").innerHTML = `
      <div class="d-hero" style="--h:${hueOf(j.company)}">
        <button class="btn icon d-close" type="button" data-close aria-label="Close">${ICON.close}</button>
        ${avatar(j, "lg")}
        <h2 id="dTitle">${esc(j.company)}</h2>
        <div class="d-role">${esc(j.role)}</div>
        <div class="meta">${pill(j.status)}
          <span class="tag">${placeOf(j) === "Remote" ? ICON.globe : ICON.pin}${esc(j.location || placeOf(j))}</span>
          <span class="tag">${ICON.brief}${esc(j.work_type || workOf(j))}</span>
          <span class="tag">${ICON.link}${esc(portalOf(j))}</span>
        </div>
        <div class="d-actions">
          ${url ? `<a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener">${ICON.ext} Open posting</a>` : ""}
          <select aria-label="Change status" data-status="${esc(j.id)}">${STATUSES.map((s) => `<option${s.key === j.status ? " selected" : ""}>${s.key}</option>`).join("")}</select>
          <button class="btn" type="button" data-edit="${esc(j.id)}">${ICON.edit} Edit</button>
        </div>
      </div>
      <div class="d-sec"><h3>Details</h3><div class="d-facts">
        ${fact("Applied", j.date_applied ? `${fmtDate(j.date_applied)} (${rel(j.date_applied)})` : "Not yet")}
        ${fact("Found", j.date_found ? fmtDate(j.date_found) : "")}
        ${fact("Fit score", typeof j.fit_score === "number" ? `${j.fit_score} / 100` : "")}
        ${fact("Salary", j.salary)}
        ${fact("Source", j.source)}
        ${j.applied_via && j.applied_via !== j.source ? fact("Applied via", j.applied_via) : ""}
        ${fact("Experience asked", j.experience_required)}
        ${fact("Industry", j.industry)}
        ${fact("Seniority", j.seniority)}
        ${fact("Employment", j.employment_type)}
        ${fact("Application status", j.application_status)}
      </div></div>
      ${j.why_fit ? `<div class="d-sec"><h3>Why it fits</h3><p class="d-text">${esc(j.why_fit)}</p></div>` : ""}
      ${j.notes ? `<div class="d-sec"><h3>Notes</h3><p class="d-text">${esc(j.notes)}</p></div>` : ""}
      ${rec || j.outreach ? `<div class="d-sec"><h3>Recruiter &amp; follow-up</h3><p class="d-text">${esc(rec)}${rec && j.outreach ? "\n" : ""}${esc(j.outreach || "")}</p></div>` : ""}
      ${(j.skills || []).length ? `<div class="d-sec"><h3>Skills</h3><div class="d-skills">${j.skills.map((s) => `<button type="button" class="skill" data-skill="${esc(s)}">${esc(s)}</button>`).join("")}</div></div>` : ""}
      ${j.cover_note ? `<div class="d-sec"><div class="head-row"><h3>Cover note</h3><button class="btn sm" type="button" data-copy="${esc(j.id)}">${ICON.copy} Copy</button></div><div class="d-cover">${esc(j.cover_note)}</div></div>` : ""}
    `;
    if (!drawer.open) drawer.showModal();
    drawer.scrollTop = 0;
    try { history.replaceState(null, "", "#job=" + encodeURIComponent(id)); } catch { /* ignore */ }
  }
  function closeDrawer() { if (drawer.open) drawer.close(); }
  drawer.addEventListener("close", () => { drawerId = null; try { if (location.hash.startsWith("#job=")) history.replaceState(null, "", location.pathname + location.search); } catch { /* ignore */ } });
  drawer.addEventListener("click", (e) => { if (e.target === drawer) closeDrawer(); });
  function openFromHash() { const m = location.hash.match(/^#job=(.+)$/); if (m) openDrawer(decodeURIComponent(m[1])); }

  // ================= Status changes =================
  function setStatus(id, status) {
    const before = stats().sent.length;
    let name = "";
    jobs = jobs.map((j) => {
      if (j.id !== id) return j;
      name = j.company;
      const upd = { ...j, status };
      if (SENT.has(status) && !upd.date_applied) upd.date_applied = TODAY;
      return upd;
    });
    persist(`${name} → ${status}`);
    if (drawerId === id) openDrawer(id);
    const after = stats().sent.length;
    if (after > before) checkMilestone();
    if (status === "Offer") confetti();
  }

  // ================= Editor =================
  const dlg = $("#editor");
  const form = $("#editForm");
  form.elements.status.innerHTML = STATUSES.map((s) => `<option>${s.key}</option>`).join("");

  function openEditor(job) {
    editingId = job ? job.id : null;
    $("#editTitle").textContent = job ? `Edit · ${job.company}` : "Add a job";
    $("#delBtn").hidden = !job;
    const j = job || { status: "Applied", work_type: "Remote (India)", date_found: TODAY, date_applied: TODAY };
    for (const el of form.elements) {
      if (!el.name) continue;
      const v = j[el.name];
      el.value = Array.isArray(v) ? v.join(", ") : v ?? "";
    }
    closeDrawer();
    dlg.showModal();
  }

  dlg.addEventListener("close", () => {
    const action = dlg.returnValue;
    if (action === "delete" && editingId) {
      if (confirm("Delete this job from the tracker?")) {
        jobs = jobs.filter((j) => j.id !== editingId);
        persist("Job deleted");
      }
      return;
    }
    if (action !== "save") return;
    const data = Object.fromEntries(new FormData(form).entries());
    data.skills = data.skills ? data.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
    data.fit_score = data.fit_score === "" ? null : Number(data.fit_score);
    const before = stats().sent.length;
    if (editingId) {
      jobs = jobs.map((j) => (j.id === editingId ? { ...j, ...data } : j));
      persist("Saved");
    } else {
      const slug = `${data.company}-${data.role}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      jobs.push({ id: `${slug}-${Date.now().toString(36)}`, cover_note: "", ...data, _i: jobs.length });
      persist(`Added ${data.company}`);
    }
    if (stats().sent.length > before) checkMilestone();
  });

  // ================= Activity =================
  function renderActivity() {
    const items = activity.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || b._i - a._i);
    const shown = showAllActivity ? items : items.slice(0, 14);
    let lastDay = null;
    let html = "";
    for (const a of shown) {
      if (a.date !== lastDay) {
        lastDay = a.date;
        const r = rel(a.date);
        html += `<li class="tl-day">${a.date ? (r === "today" || r === "yesterday" ? r + " · " : "") + fmtDate(a.date, { weekday: "long", day: "numeric", month: "long" }) : "Undated"}</li>`;
      }
      const applied = /^applied|submitted|log application/i.test(a.action || "");
      html += `<li class="tl"><span class="tl-dot" style="--c:${applied ? "var(--s-applied)" : "var(--accent-2)"}">${applied ? ICON.check : ICON.dot}</span><div><b>${esc(a.action)}</b>${a.company ? ` · ${esc(a.company)}` : ""}${a.detail ? `<p>${esc(a.detail)}</p>` : ""}</div></li>`;
    }
    $("#timeline").innerHTML = html || `<li class="sub">No activity logged yet.</li>`;
    $("#moreActivity").hidden = showAllActivity || items.length <= 14;
    $("#moreActivity").textContent = `Show all ${items.length} entries`;
  }

  // ================= Milestones / confetti / toast =================
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function checkMilestone() {
    const n = stats().sent.length;
    const hit = MILESTONES.filter((m) => n >= m).pop();
    const seen = Number(store.get(MILESTONE_KEY) || 0);
    if (hit && hit > seen) {
      store.set(MILESTONE_KEY, String(hit));
      setTimeout(() => { confetti(); toast(hit >= GOAL ? `🎉 ${GOAL} applications. Goal reached!` : `🎉 Milestone: ${hit} applications sent!`); }, 900);
    }
  }

  function confetti() {
    if (reduceMotion) return;
    const cv = $("#confetti");
    const ctx = cv.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#6366f1", "#a855f7", "#2a78d6", "#1baf7a", "#eda100", "#e87ba4", "#eb6834"];
    const P = Array.from({ length: 170 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4, s: 5 + Math.random() * 6,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(t) {
      const el = t - t0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of P) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - el / 2600);
        ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      }
      if (el < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(t0);
  }

  // ================= Render all =================
  function renderAll() {
    $("#localNote").hidden = !store.get(LOCAL_KEY);
    const S = stats();
    lastStats = S;
    renderHero(S);
    renderKpis(S);
    renderFunnel(S);
    renderCharts();
    hbars($("#chartPortal"), tally(S.sent, portalOf, 8), "portal", S.sent.length || 1);
    hbars($("#chartLocation"), tally(S.sent, placeOf, 7), "place", S.sent.length || 1);
    renderSkills(S);
    renderExplorer();
  }

  // ================= Events =================
  function toggleFilter(key, val, scroll) {
    if (filt[key].has(val)) filt[key].delete(val); else filt[key].add(val);
    renderFunnel(lastStats);
    hbars($("#chartPortal"), tally(lastStats.sent, portalOf, 8), "portal", lastStats.sent.length || 1);
    hbars($("#chartLocation"), tally(lastStats.sent, placeOf, 7), "place", lastStats.sent.length || 1);
    renderExplorer();
    if (scroll) $("#explore").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function clearFilters() {
    for (const k of ["status", "portal", "place", "work"]) filt[k].clear();
    filt.q = ""; $("#q").value = "";
    renderAll();
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-open], a");
    if (!t) { if (!e.target.closest(".menu")) $("#menu").hidden = true; return; }
    if (!t.closest(".menu")) { $("#menu").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); }

    if (t.dataset.close !== undefined && t.closest("#drawer")) return closeDrawer();
    if (t.dataset.copy) {
      const text = (jobs.find((j) => j.id === t.dataset.copy) || {}).cover_note || "";
      const done = () => toast("Cover note copied");
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => toast("Couldn't copy"));
      return;
    }
    if (t.dataset.edit) return openEditor(jobs.find((j) => j.id === t.dataset.edit));
    if (t.dataset.stage) return toggleFilter("status", t.dataset.stage, true);
    if (t.dataset.f) return toggleFilter(t.dataset.f, t.dataset.val, t.classList.contains("hbar"));
    if (t.dataset.clearq) { filt.q = ""; $("#q").value = ""; return renderExplorer(); }
    if (t.dataset.skill) {
      closeDrawer();
      filt.q = t.dataset.skill.toLowerCase(); $("#q").value = t.dataset.skill;
      renderExplorer();
      return $("#explore").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
    if (t.dataset.view) { ui.view = t.dataset.view; saveUi(); return renderExplorer(); }
    if (t.dataset.open && !t.dataset.dragging) return openDrawer(t.dataset.open);
    if (t.id === "clearFilters" || t.id === "clearFilters2") return clearFilters();
  });

  $("#tableRows").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.dataset.open) openDrawer(e.target.dataset.open); });
  $$(".grid-table th").forEach((th) => th.addEventListener("click", () => {
    const k = th.dataset.sort;
    ui.tsort = ui.tsort.key === k ? { key: k, asc: !ui.tsort.asc } : { key: k, asc: ["company", "role", "place", "portal", "status"].includes(k) };
    saveUi(); renderExplorer();
  }));

  document.addEventListener("change", (e) => {
    const id = e.target.dataset && e.target.dataset.status;
    if (id) setStatus(id, e.target.value);
  });

  let qT;
  $("#q").addEventListener("input", (e) => { clearTimeout(qT); qT = setTimeout(() => { filt.q = e.target.value.trim().toLowerCase(); renderExplorer(); }, 120); });
  $("#sort").addEventListener("change", (e) => { ui.sort = e.target.value; saveUi(); renderExplorer(); });
  $("#addBtn").addEventListener("click", () => openEditor(null));
  $("#menuBtn").addEventListener("click", (e) => { e.stopPropagation(); const m = $("#menu"); m.hidden = !m.hidden; $("#menuBtn").setAttribute("aria-expanded", String(!m.hidden)); });
  $("#moreActivity").addEventListener("click", () => { showAllActivity = true; renderActivity(); });
  $("#resetLocal").addEventListener("click", () => {
    if (!confirm("Discard your local edits and reload data/jobs.json?")) return;
    store.del(LOCAL_KEY);
    jobs = baseJobs.map((j) => ({ ...j }));
    renderAll();
    toast("Local edits discarded");
  });

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing && !dlg.open) { e.preventDefault(); $("#q").focus(); $("#explore").scrollIntoView({ block: "start" }); }
  });

  let rT;
  let lastW = innerWidth;
  addEventListener("resize", () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rT); rT = setTimeout(renderCharts, 150); });
  addEventListener("scroll", hideTip, { passive: true });

  // Highlight nav link for the section in view
  const navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => {
      for (const en of ents) if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["overview", "insights", "explore", "activity"].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ================= Export =================
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const exportJson = () => { download("jobs.json", JSON.stringify({ jobs: jobs.map(({ _i, ...j }) => j) }, null, 2) + "\n", "application/json"); toast("jobs.json downloaded"); };
  $("#exportJson").addEventListener("click", exportJson);
  $("#exportLocal").addEventListener("click", exportJson);
  $("#exportCsv").addEventListener("click", () => {
    const cols = ["company", "role", "location", "work_type", "link", "status", "fit_score", "date_found", "date_applied", "salary", "source", "skills", "why_fit", "notes", "recruiter_name", "recruiter_email", "outreach", "cover_note"];
    const cell = (v) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...jobs.map((j) => cols.map((c) => cell(j[c])).join(","))].join("\n");
    download("jobs.csv", csv + "\n", "text/csv");
    toast("jobs.csv downloaded");
  });

  load();
  loadActivity();
})();

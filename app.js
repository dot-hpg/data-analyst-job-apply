(() => {
  "use strict";

  const STATUSES = [
    { key: "Shortlisted", color: "--s-shortlisted" },
    { key: "Ready to apply", color: "--s-ready" },
    { key: "Applied", color: "--s-applied" },
    { key: "Interviewing", color: "--s-interview" },
    { key: "Offer", color: "--s-offer" },
    { key: "Rejected", color: "--s-rejected" },
    { key: "Skipped", color: "--s-skipped" },
  ];
  const LOCAL_KEY = "job-tracker:jobs:v1";
  const THEME_KEY = "job-tracker:theme";

  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
  };

  let baseJobs = [];
  let jobs = [];
  let editingId = null;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const statusColor = (s) => `var(${(STATUSES.find((x) => x.key === s) || STATUSES[0]).color})`;
  const fmtDate = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");

  // ---------- theme ----------
  const savedTheme = store.get(THEME_KEY);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $("#themeBtn").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme
      || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set(THEME_KEY, next);
  });

  // ---------- data ----------
  async function load() {
    try {
      const res = await fetch("data/jobs.json", { cache: "no-store" });
      const data = await res.json();
      baseJobs = Array.isArray(data) ? data : data.jobs || [];
    } catch (e) {
      baseJobs = [];
      console.error("Could not load data/jobs.json", e);
    }
    const local = store.get(LOCAL_KEY);
    if (local) {
      try { jobs = JSON.parse(local); } catch { jobs = structuredClone(baseJobs); }
    } else {
      jobs = structuredClone(baseJobs);
    }
    render();
  }

  function persist() {
    store.set(LOCAL_KEY, JSON.stringify(jobs));
    render();
  }

  // ---------- render ----------
  function render() {
    $("#localNote").hidden = !store.get(LOCAL_KEY);

    const count = (k) => jobs.filter((j) => j.status === k).length;
    const applied = jobs.filter((j) => ["Applied", "Interviewing", "Offer", "Rejected"].includes(j.status)).length;
    const remote = jobs.filter((j) => (j.work_type || "").startsWith("Remote")).length;
    $("#stats").innerHTML = [
      [jobs.length, "Jobs tracked"],
      [applied, "Applied"],
      [count("Interviewing"), "Interviewing"],
      [count("Offer"), "Offers"],
      [remote, "Remote roles"],
    ].map(([n, l]) => `<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join("");

    const total = jobs.length || 1;
    $("#pipeline").innerHTML = STATUSES.map((s) => {
      const c = count(s.key);
      return c ? `<span title="${s.key}: ${c}" style="width:${(c / total) * 100}%;background:var(${s.color})"></span>` : "";
    }).join("");
    let legend = document.querySelector(".legend");
    if (!legend) { legend = document.createElement("div"); legend.className = "legend"; $("#pipeline").after(legend); }
    legend.innerHTML = STATUSES.filter((s) => count(s.key))
      .map((s) => `<span><i style="background:var(${s.color})"></i>${s.key} ${count(s.key)}</span>`).join("");

    const q = $("#q").value.trim().toLowerCase();
    const fs = $("#fStatus").value;
    const fw = $("#fWork").value;
    const sort = $("#sort").value;
    let rows = jobs.filter((j) => {
      if (fs && j.status !== fs) return false;
      if (fw && j.work_type !== fw) return false;
      if (!q) return true;
      return [j.company, j.role, j.location, j.notes, j.why_fit, (j.skills || []).join(" ")].join(" ").toLowerCase().includes(q);
    });
    const by = {
      fit: (a, b) => (b.fit_score || 0) - (a.fit_score || 0),
      found: (a, b) => (b.date_found || "").localeCompare(a.date_found || ""),
      applied: (a, b) => (b.date_applied || "").localeCompare(a.date_applied || ""),
      company: (a, b) => (a.company || "").localeCompare(b.company || ""),
    }[sort];
    rows.sort(by);

    $("#empty").hidden = rows.length > 0;
    $("#list").innerHTML = rows.map((j) => {
      const url = safeUrl(j.link);
      return `
      <article class="card">
        <div>
          <h3>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(j.role)}</a>` : esc(j.role)}
            <span class="co">· ${esc(j.company)}</span></h3>
          <div class="meta">
            <span>📍 ${esc(j.location || "—")}</span>
            <span>${esc(j.work_type || "")}</span>
            ${j.salary ? `<span>💰 ${esc(j.salary)}</span>` : ""}
            ${j.date_found ? `<span>Found ${fmtDate(j.date_found)}</span>` : ""}
            ${j.date_applied ? `<span>Applied ${fmtDate(j.date_applied)}</span>` : ""}
            ${j.source ? `<span>via ${esc(j.source)}</span>` : ""}
          </div>
          ${j.why_fit ? `<p class="why">${esc(j.why_fit)}</p>` : ""}
          ${j.notes ? `<p class="notes">${esc(j.notes)}</p>` : ""}
          ${(j.skills || []).length ? `<div class="tags">${j.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="side">
          <span class="status" style="color:${statusColor(j.status)}">${esc(j.status || "Shortlisted")}</span>
          ${j.fit_score != null ? `<span class="fit">Fit <b>${esc(j.fit_score)}</b>/100</span>` : ""}
          <div class="row-actions">
            <select data-status="${esc(j.id)}" aria-label="Change status">${STATUSES.map((s) => `<option${s.key === j.status ? " selected" : ""}>${s.key}</option>`).join("")}</select>
            <button class="btn" data-edit="${esc(j.id)}" type="button">Edit</button>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  // ---------- editing ----------
  const dlg = $("#editor");
  const form = $("#editForm");
  const statusOpts = STATUSES.map((s) => `<option>${s.key}</option>`).join("");
  form.elements.status.innerHTML = statusOpts;
  $("#fStatus").innerHTML += statusOpts;

  function openEditor(job) {
    editingId = job ? job.id : null;
    $("#editTitle").textContent = job ? "Edit job" : "Add job";
    $("#delBtn").hidden = !job;
    const j = job || { status: "Shortlisted", work_type: "Remote (Worldwide)", date_found: new Date().toISOString().slice(0, 10) };
    for (const el of form.elements) {
      if (!el.name) continue;
      const v = j[el.name];
      el.value = Array.isArray(v) ? v.join(", ") : v ?? "";
    }
    dlg.showModal();
  }

  dlg.addEventListener("close", () => {
    const action = dlg.returnValue;
    if (action === "delete" && editingId) {
      if (confirm("Delete this job from the tracker?")) {
        jobs = jobs.filter((j) => j.id !== editingId);
        persist();
      }
      return;
    }
    if (action !== "save") return;
    const data = Object.fromEntries(new FormData(form).entries());
    data.skills = data.skills ? data.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
    data.fit_score = data.fit_score === "" ? null : Number(data.fit_score);
    if (editingId) {
      jobs = jobs.map((j) => (j.id === editingId ? { ...j, ...data } : j));
    } else {
      const slug = `${data.company}-${data.role}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      jobs.push({ id: `${slug}-${Date.now().toString(36)}`, ...data });
    }
    persist();
  });

  document.addEventListener("click", (e) => {
    const id = e.target.dataset && e.target.dataset.edit;
    if (id) openEditor(jobs.find((j) => j.id === id));
  });
  document.addEventListener("change", (e) => {
    const id = e.target.dataset && e.target.dataset.status;
    if (!id) return;
    const today = new Date().toISOString().slice(0, 10);
    jobs = jobs.map((j) => {
      if (j.id !== id) return j;
      const upd = { ...j, status: e.target.value };
      if (upd.status === "Applied" && !upd.date_applied) upd.date_applied = today;
      return upd;
    });
    persist();
  });

  $("#addBtn").addEventListener("click", () => openEditor(null));
  ["#q", "#fStatus", "#fWork", "#sort"].forEach((s) => $(s).addEventListener("input", render));
  $("#resetLocal").addEventListener("click", () => {
    if (!confirm("Discard your local edits and reload data/jobs.json?")) return;
    store.del(LOCAL_KEY);
    jobs = structuredClone(baseJobs);
    render();
  });

  // ---------- export ----------
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $("#exportJson").addEventListener("click", () => download("jobs.json", JSON.stringify({ jobs }, null, 2) + "\n", "application/json"));
  $("#exportCsv").addEventListener("click", () => {
    const cols = ["company", "role", "location", "work_type", "link", "status", "fit_score", "date_found", "date_applied", "salary", "source", "skills", "why_fit", "notes"];
    const cell = (v) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...jobs.map((j) => cols.map((c) => cell(j[c])).join(","))].join("\n");
    download("jobs.csv", csv + "\n", "text/csv");
  });

  async function loadActivity() {
    try {
      const res = await fetch("data/activity.json", { cache: "no-store" });
      const items = ((await res.json()).activity || []).slice().reverse();
      $("#activity").innerHTML = items.map((a) => `
        <li><time>${fmtDate(a.date)}</time><div><b>${esc(a.action)}</b>${a.company ? ` · ${esc(a.company)}` : ""}<p>${esc(a.detail || "")}</p></div></li>`).join("");
    } catch (e) {
      console.error("Could not load data/activity.json", e);
    }
  }

  load();
  loadActivity();
})();

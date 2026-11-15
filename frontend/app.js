const $ = (id) => document.getElementById(id);

const form = $("uploadForm");
const input = $("resumeInput");
const dropzone = $("dropzone");
const errorBox = $("errorBox");
const analyzeBtn = $("analyzeBtn");
let selectedFile = null;

$("year").textContent = new Date().getFullYear();

// ---------- File selection / drag & drop ----------
function setFile(file) {
  selectedFile = file;
  errorBox.hidden = true;
  if (file) {
    dropzone.classList.add("has-file");
    $("dropTitle").textContent = file.name;
    $("dropSub").innerHTML = `${(file.size / 1024).toFixed(0)} KB &middot; <span class="link">choose a different file</span>`;
  } else {
    dropzone.classList.remove("has-file");
    $("dropTitle").textContent = "Drag and drop your resume here";
    $("dropSub").innerHTML = 'or <span class="link">browse files</span> &middot; PDF, DOCX, TXT &middot; max 5 MB';
  }
}

input.addEventListener("change", () => setFile(input.files[0] || null));

["dragenter", "dragover"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("drag"); })
);
["dragleave", "drop"].forEach((ev) =>
  dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("drag"); })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    setFile(file);
  }
});
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

// ---------- Submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedFile) return showError("Please choose a resume file first.");
  const ext = selectedFile.name.split(".").pop().toLowerCase();
  if (!["pdf", "docx", "txt"].includes(ext)) return showError("Only PDF, DOCX or TXT files are supported.");
  if (selectedFile.size > 5 * 1024 * 1024) return showError("File is too large. Maximum size is 5 MB.");

  const data = new FormData();
  data.append("resume", selectedFile);
  data.append("level", $("level").value);
  data.append("location", $("location").value);

  analyzeBtn.disabled = true;
  analyzeBtn.querySelector(".btn-text").textContent = "Analyzing...";
  analyzeBtn.querySelector(".spinner").hidden = false;
  errorBox.hidden = true;

  try {
    const res = await fetch("/api/analyze", { method: "POST", body: data });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Analysis failed.");
    renderResults(json);
  } catch (err) {
    showError(err.message || "Could not reach the server. Please try again.");
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector(".btn-text").textContent = "Analyze Resume";
    analyzeBtn.querySelector(".spinner").hidden = true;
  }
});

// ---------- Render ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function animateNumber(el, to, ms = 1300) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / ms);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderResults(r) {
  const results = $("results");
  results.hidden = false;

  $("resultMeta").textContent = `${r.level} · Jobs for: ${r.location}`;

  // Score ring (circumference of r=70 is ~440)
  $("scoreNum").textContent = "0";
  const ring = $("ringFg");
  ring.style.strokeDashoffset = 440;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.strokeDashoffset = 440 - (440 * r.score) / 100;
  }));
  animateNumber($("scoreNum"), r.score);

  const gradeEl = $("gradeBadge");
  gradeEl.textContent = r.grade;
  gradeEl.className = "grade " + ({ Excellent: "g-excellent", Good: "g-good", Fair: "g-fair" }[r.grade] || "g-low");

  $("statWords").textContent = r.stats.wordCount;
  $("statSkills").textContent = r.stats.technicalSkills;
  $("statVerbs").textContent = r.stats.actionVerbs;

  // Breakdown bars
  $("breakdown").innerHTML = r.breakdown.map((b) => `
    <div>
      <div class="bar-top"><span>${esc(b.label)}</span><span>${b.score} / ${b.max}</span></div>
      <div class="bar"><i data-w="${(b.score / b.max) * 100}" class="${b.score / b.max < 0.5 ? "low" : b.score / b.max < 0.8 ? "mid" : ""}"></i></div>
    </div>`).join("");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll("#breakdown .bar > i").forEach((i) => (i.style.width = i.dataset.w + "%"));
  }));

  // Jobs
  const jobsEl = $("jobs");
  if (!r.jobs.length) {
    jobsEl.innerHTML = `<div class="card" style="grid-column:1/-1"><b>No strong matches yet.</b>
      <p class="muted">We could not find enough technical skills in your resume. Add a clear Skills section listing your languages, frameworks and tools, then analyze again.</p></div>`;
  } else {
    jobsEl.innerHTML = r.jobs.map((j, idx) => `
      <article class="job ${idx === 0 ? "top" : ""}">
        ${idx === 0 ? '<span class="badge-top">BEST MATCH</span>' : ""}
        <div class="job-head">
          <h4>${esc(j.title)}</h4>
          <div class="match ${j.match >= 70 ? "" : j.match >= 50 ? "mid" : "low"}">${j.match}%</div>
        </div>
        <p class="desc">${esc(j.summary)}</p>
        ${j.matchedSkills.length ? `<div class="label">Your matching skills</div>
          <div class="chips">${j.matchedSkills.map((s) => `<span class="chip ok">${esc(s)}</span>`).join("")}</div>` : ""}
        ${j.missingSkills.length ? `<div class="label">Good to add</div>
          <div class="chips">${j.missingSkills.map((s) => `<span class="chip miss">${esc(s)}</span>`).join("")}</div>` : ""}
        <div class="apply">
          <div class="apply-label">Apply on</div>
          <div class="apply-links">
            ${j.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.site)} &#8599;</a>`).join("")}
          </div>
        </div>
      </article>`).join("");
  }

  // Skills
  const skillsEl = $("skills");
  const cats = Object.entries(r.skills);
  skillsEl.innerHTML = cats.length
    ? cats.map(([cat, list]) => `
        <div class="skill-group"><h5>${esc(cat)}</h5>
          <div class="chips">${list.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div></div>`).join("")
    : '<p class="muted">No recognised skills found. Add a Skills section to your resume.</p>';

  $("gaps").innerHTML = r.skillGaps.length
    ? r.skillGaps.map((s) => `<span class="chip miss">${esc(s)}</span>`).join("")
    : '<span class="muted small">Great, no major gaps for your top matches.</span>';

  $("strengths").innerHTML = r.strengths.length
    ? r.strengths.map((s) => `<li>${esc(s)}</li>`).join("")
    : '<li>Keep going, the tips below will help you improve quickly.</li>';

  $("suggestions").innerHTML = r.suggestions.length
    ? r.suggestions.map((s) => `<li><span class="tag ${s.type}">${s.type}</span><span>${esc(s.text)}</span></li>`).join("")
    : '<li><span class="tag tip">great</span><span>Your resume looks solid. Nothing major to fix.</span></li>';

  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

$("againBtn").addEventListener("click", () => {
  setFile(null);
  input.value = "";
  $("results").hidden = true;
  document.getElementById("analyze").scrollIntoView({ behavior: "smooth" });
});

$("printBtn").addEventListener("click", () => window.print());

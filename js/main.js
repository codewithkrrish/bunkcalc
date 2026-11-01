import { analyseAll, formatPct } from "./attendance.js";
import { drawShareCard } from "./sharecard.js";

const STORAGE_KEY = "bunkcalc-v1";
const PRESETS = [60, 65, 70, 75, 80, 85, 90];
const DEFAULTS = {
  target: 75,
  subjects: [
    { name: "Mathematics", attended: 18, held: 20 },
    { name: "Physics", attended: 14, held: 20 },
    { name: "Chemistry", attended: 12, held: 16 },
  ],
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.subjects) || parsed.subjects.length === 0) return structuredClone(DEFAULTS);
    return {
      target: Number(parsed.target) || 75,
      subjects: parsed.subjects.map((s) => ({
        name: String(s.name || "Untitled subject"),
        attended: Math.max(0, Math.floor(Number(s.attended) || 0)),
        held: Math.max(0, Math.floor(Number(s.held) || 0)),
      })),
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the calculator still works in memory.
  }
}

const $ = (id) => document.getElementById(id);
const els = {
  list: $("subject-list"),
  targetInput: $("target-input"),
  presetRow: $("preset-row"),
  overallPct: $("overall-pct"),
  overallCounts: $("overall-counts"),
  overallBar: $("overall-bar"),
  overallBunk: $("overall-bunk"),
  overallMust: $("overall-must"),
  overallStatus: $("overall-status"),
  summary: $("summary"),
  shareCanvas: $("share-canvas"),
};

function statusLabel(status) {
  return { safe: "Safe", "at-risk": "At risk", below: "Below target", "no-data": "No data", invalid: "Check numbers" }[status] || "—";
}

function render() {
  const result = analyseAll(state.subjects, state.target);

  els.overallPct.textContent = formatPct(result.pct);
  els.overallCounts.textContent = `${result.totalAttended} attended out of ${result.totalHeld} held`;
  els.overallBar.style.width = result.pct === null ? "0%" : `${Math.min(100, result.pct)}%`;
  els.overallBar.className = `bar-fill ${result.status}`;
  els.overallBunk.textContent = result.bunk === null ? "No limit" : String(result.bunk);
  els.overallMust.textContent = result.must === null ? "Not possible" : String(result.must);
  els.overallStatus.textContent = statusLabel(result.status);
  els.overallStatus.className = `status ${result.status}`;
  els.summary.textContent =
    result.totalHeld === 0
      ? "Add your classes to see how many you can bunk."
      : result.must === null
        ? "Overall target is no longer reachable at 100%."
        : result.pct >= state.target
          ? `Overall: you can bunk ${result.bunk === null ? "without limit" : result.bunk + " more"} and stay at or above ${state.target}%.`
          : `Overall: attend ${result.must} in a row to reach ${state.target}%.`;

  els.list.innerHTML = "";
  result.rows.forEach((row, i) => {
    const card = document.createElement("article");
    card.className = "subject-card";
    card.draggable = true;
    card.dataset.index = String(i);
    card.innerHTML = `
      <div class="subject-head">
        <span class="drag-handle" title="Drag to reorder" aria-hidden="true">::</span>
        <input class="subject-name" type="text" value="" aria-label="Subject name" />
        <button class="icon-btn remove-btn" type="button" aria-label="Remove subject">Remove</button>
      </div>
      <div class="counts">
        <label>Attended
          <span class="stepper">
            <button type="button" data-field="attended" data-delta="-1" aria-label="One fewer attended">−</button>
            <input type="number" min="0" step="1" inputmode="numeric" aria-label="Classes attended" />
            <button type="button" data-field="attended" data-delta="1" aria-label="One more attended">+</button>
          </span>
        </label>
        <label>Held
          <span class="stepper">
            <button type="button" data-field="held" data-delta="-1" aria-label="One fewer held">−</button>
            <input type="number" min="0" step="1" inputmode="numeric" aria-label="Classes held" />
            <button type="button" data-field="held" data-delta="1" aria-label="One more held">+</button>
          </span>
        </label>
        <div class="subject-result">
          <strong>${formatPct(row.pct)}</strong>
          <span class="status ${row.status}">${statusLabel(row.status)}</span>
        </div>
      </div>
      <div class="bar" aria-hidden="true"><div class="bar-fill ${row.status}" style="width:${row.pct === null ? 0 : Math.min(100, row.pct)}%"></div></div>
      <p class="subject-message">${row.message}</p>`;

    const nameInput = card.querySelector(".subject-name");
    nameInput.value = row.name;
    nameInput.addEventListener("input", () => {
      state.subjects[i].name = nameInput.value;
      save();
    });

    const [attInput, heldInput] = card.querySelectorAll('input[type="number"]');
    attInput.value = row.attended;
    heldInput.value = row.held;
    const syncNumber = (field, input) => {
      const v = Math.max(0, Math.floor(Number(input.value) || 0));
      state.subjects[i][field] = v;
      input.value = String(v);
      save();
      render();
    };
    attInput.addEventListener("change", () => syncNumber("attended", attInput));
    heldInput.addEventListener("change", () => syncNumber("held", heldInput));

    card.querySelectorAll(".stepper button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const field = btn.dataset.field;
        const next = Math.max(0, state.subjects[i][field] + Number(btn.dataset.delta));
        if (field === "attended" && next > state.subjects[i].held) return;
        state.subjects[i][field] = next;
        save();
        render();
      });
    });

    card.querySelector(".remove-btn").addEventListener("click", () => {
      if (state.subjects.length <= 1) {
        alert("Keep at least one subject. Use Reset to start over.");
        return;
      }
      state.subjects.splice(i, 1);
      save();
      render();
    });

    card.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", String(i)));
    card.addEventListener("dragover", (e) => e.preventDefault());
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData("text/plain"));
      if (Number.isInteger(from) && from !== i) {
        const [moved] = state.subjects.splice(from, 1);
        state.subjects.splice(i, 0, moved);
        save();
        render();
      }
    });

    els.list.appendChild(card);
  });

  // Preset buttons reflect the current target.
  els.presetRow.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.target) === state.target);
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.target) === state.target));
  });
  if (els.targetInput.value !== String(state.target)) els.targetInput.value = String(state.target);

  drawShareCard(els.shareCanvas, result, state.target);
  save();
}

function init() {
  els.presetRow.innerHTML = "";
  PRESETS.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.target = String(p);
    btn.textContent = `${p}%`;
    btn.addEventListener("click", () => {
      state.target = p;
      render();
    });
    els.presetRow.appendChild(btn);
  });

  els.targetInput.addEventListener("change", () => {
    let v = Math.floor(Number(els.targetInput.value) || 75);
    v = Math.min(100, Math.max(0, v));
    state.target = v;
    render();
  });

  $("add-subject").addEventListener("click", () => {
    state.subjects.push({ name: `Subject ${state.subjects.length + 1}`, attended: 0, held: 0 });
    save();
    render();
    const last = els.list.querySelector(".subject-card:last-child .subject-name");
    if (last) last.focus();
  });

  $("reset-btn").addEventListener("click", () => {
    if (!confirm("Reset all subjects and the target to the defaults?")) return;
    state = structuredClone(DEFAULTS);
    render();
  });

  $("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bunkcalc.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.subjects) || parsed.subjects.length === 0) throw new Error("bad file");
      state = {
        target: Math.min(100, Math.max(0, Math.floor(Number(parsed.target) || 75))),
        subjects: parsed.subjects.map((s) => ({
          name: String(s.name || "Untitled subject"),
          attended: Math.max(0, Math.floor(Number(s.attended) || 0)),
          held: Math.max(0, Math.floor(Number(s.held) || 0)),
        })),
      };
      render();
    } catch {
      alert("That file is not a valid BunkCalc export.");
    }
    e.target.value = "";
  });

  $("download-card").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = els.shareCanvas.toDataURL("image/png");
    a.download = "bunkcalc-result.png";
    a.click();
  });

  $("print-btn").addEventListener("click", () => window.print());

  // Keyboard: Enter in a subject name moves focus to the next card's name.
  els.list.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("subject-name")) {
      e.preventDefault();
      const names = [...els.list.querySelectorAll(".subject-name")];
      const next = names[names.indexOf(e.target) + 1];
      if (next) next.focus();
    }
  });

  render();
}

if (typeof document !== "undefined") init();
export { init, load, state };

// Pure attendance maths for BunkCalc. No DOM, no storage, no I/O here,
// so the same functions can be tested in Node and run in the browser.

const EPS = 1e-9;

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Whole, non-negative counts only. attended > held is an error, not a
// value to silently clamp, because it usually means a typo.
export function validateSubject(subject) {
  const attended = toNumber(subject.attended);
  const held = toNumber(subject.held);
  if (!Number.isInteger(attended) || !Number.isInteger(held)) {
    return "Attended and held must be whole numbers.";
  }
  if (attended < 0 || held < 0) return "Counts cannot be negative.";
  if (attended > held) return "Attended cannot be more than held.";
  return null;
}

export function percentage(attended, held) {
  if (held <= 0) return null;
  return (attended / held) * 100;
}

// Largest n such that attended / (held + n) >= target / 100.
// Returns null when the target is 0% or lower (there is no limit to bunk),
// and 0 when the subject is already at or below the line.
export function bunkable(attended, held, target) {
  const t = toNumber(target) / 100;
  if (t <= 0) return null;
  if (held <= 0) return 0;
  const n = Math.floor(attended / t - held + EPS);
  return Math.max(0, n);
}

// Smallest n such that (attended + n) / (held + n) >= target / 100.
// Returns 0 when already at target, and null when the target can never be
// reached by attending future classes (target 100% with a missed class).
export function mustAttend(attended, held, target) {
  const t = toNumber(target) / 100;
  const pct = percentage(attended, held);
  if (pct !== null && pct + EPS >= toNumber(target)) return 0;
  if (t >= 1) return null;
  if (t <= 0) return 0;
  const n = Math.ceil((t * held - attended) / (1 - t) - EPS);
  return Math.max(0, n);
}

export function statusFor(pct, target) {
  if (pct === null) return "no-data";
  if (pct + EPS >= target) return "safe";
  if (pct >= target - 10) return "at-risk";
  return "below";
}

export function analyseSubject(subject, target) {
  const attended = toNumber(subject.attended);
  const held = toNumber(subject.held);
  const error = validateSubject(subject);
  const pct = percentage(attended, held);
  const status = error ? "invalid" : statusFor(pct, target);
  const bunk = error ? 0 : bunkable(attended, held, target);
  const must = error ? null : mustAttend(attended, held, target);

  let message;
  if (error) message = error;
  else if (held === 0) message = "No classes recorded yet.";
  else if (pct >= target && bunk !== null && bunk > 0) {
    message = `You can bunk ${bunk} more ${bunk === 1 ? "class" : "classes"} and stay at or above ${target}%.`;
  } else if (pct >= target && bunk === null) {
    message = "Target is 0% — there is no attendance limit to protect.";
  } else if (pct >= target) {
    message = "Right on the line — bunking one more class would drop you below target.";
  } else if (must === null) {
    message = "100% is no longer reachable — a class has already been missed. Pick a lower target.";
  } else {
    message = `Attend ${must} in a row to reach ${target}%.`;
  }

  return { name: String(subject.name || "Untitled subject"), attended, held, pct, bunk, must, status, message };
}

export function analyseAll(subjects, target) {
  const rows = subjects.map((s) => analyseSubject(s, target));
  const totalAttended = rows.reduce((sum, r) => sum + r.attended, 0);
  const totalHeld = rows.reduce((sum, r) => sum + r.held, 0);
  const pct = percentage(totalAttended, totalHeld);
  return {
    rows,
    totalAttended,
    totalHeld,
    pct,
    bunk: bunkable(totalAttended, totalHeld, target),
    must: mustAttend(totalAttended, totalHeld, target),
    status: statusFor(pct, target),
  };
}

export function formatPct(pct) {
  if (pct === null || pct === undefined) return "—";
  return `${pct.toFixed(1)}%`;
}

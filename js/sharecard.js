// Renders the shareable result card onto a canvas (1080px wide).
// Kept separate from main.js so the drawing code is easy to review.
import { formatPct } from "./attendance.js";

export function drawShareCard(canvas, overall, target) {
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.fillStyle = "#0B0B0F";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#E5484D";
  ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = "#121218";
  ctx.fillRect(64, 150, W - 128, 780);

  ctx.fillStyle = "#9A9AA5";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("BUNKCALC  ·  ATTENDANCE SNAPSHOT", 96, 110);

  ctx.fillStyle = "#F5F5F7";
  ctx.font = "700 64px Inter, system-ui, sans-serif";
  ctx.fillText("My attendance", 96, 240);

  ctx.fillStyle = "#F5F5F7";
  ctx.font = "700 150px Inter, system-ui, sans-serif";
  ctx.fillText(formatPct(overall.pct), 96, 420);

  ctx.fillStyle = "#9A9AA5";
  ctx.font = "400 32px Inter, system-ui, sans-serif";
  ctx.fillText(`${overall.totalAttended} attended  ·  ${overall.totalHeld} held  ·  target ${target}%`, 96, 480);

  const barY = 540;
  ctx.fillStyle = "#23232E";
  ctx.fillRect(96, barY, W - 192, 26);
  const fill = overall.pct === null ? 0 : Math.min(100, overall.pct);
  ctx.fillStyle = overall.status === "safe" ? "#3FB950" : overall.status === "at-risk" ? "#D29922" : "#E5484D";
  ctx.fillRect(96, barY, ((W - 192) * fill) / 100, 26);

  ctx.fillStyle = "#F5F5F7";
  ctx.font = "600 36px Inter, system-ui, sans-serif";
  const bunkText = overall.bunk === null ? "No bunk limit at this target" : `Can bunk ${overall.bunk} more`;
  const mustText = overall.must === null ? "Target no longer reachable" : `Must attend ${overall.must} in a row`;
  ctx.fillText(bunkText, 96, 640);
  ctx.fillText(mustText, 96, 700);

  ctx.fillStyle = "#9A9AA5";
  ctx.font = "400 28px Inter, system-ui, sans-serif";
  ctx.fillText("Calculated locally in the browser. Targets vary by institution.", 96, 860);

  ctx.fillStyle = "#9A9AA5";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("bunkcalc.vercel.app  ·  Built by krrish", 96, 1000);
  return true;
}

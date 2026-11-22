import { downloadBlob } from "./shareCodec";

export interface CardLine {
  text: string;
  size?: number;
  weight?: 400 | 700 | 800;
  color?: string;
  gap?: number;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draws a soft gradient result card with wrapped text lines and returns a PNG blob. */
export async function renderResultCard(lines: CardLine[], width = 1080): Promise<Blob> {
  const pad = 90;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Canvas is not supported in this browser.");
  const layout: { text: string; font: string; size: number; color: string; y: number }[] = [];
  let y = pad + 40;
  for (const line of lines) {
    const size = line.size ?? 40;
    const font = `${line.weight ?? 700} ${size}px Nunito, "Noto Sans Devanagari", "Noto Sans Gujarati", sans-serif`;
    measure.font = font;
    for (const part of wrap(measure, line.text, width - pad * 2)) {
      y += size * 1.25;
      layout.push({ text: part, font, size, color: line.color ?? "#34243a", y });
    }
    y += line.gap ?? 18;
  }
  const height = Math.max(Math.round(y + pad), 600);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fff0f5");
  gradient.addColorStop(0.55, "#fff9f5");
  gradient.addColorStop(1, "#efe9ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#f3c6d6";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, width - 60, height - 60);
  ctx.textAlign = "center";
  for (const item of layout) {
    ctx.font = item.font;
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, width / 2, item.y);
  }
  ctx.font = `800 28px Nunito, sans-serif`;
  ctx.fillStyle = "#ca3f6c";
  ctx.fillText("heartpop ♡", width / 2, height - 60);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png"),
  );
}

export async function downloadResultCard(lines: CardLine[], filename: string) {
  downloadBlob(await renderResultCard(lines), filename);
}

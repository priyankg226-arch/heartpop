import { I18nText } from "../i18n/react";
import { useLanguage } from "../i18n/react";
import { translate } from "../i18n/ui";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Heart, RotateCcw } from "lucide-react";
export function ConfettiEffect() {
  const reduced = useReducedMotion();
  return reduced ? null : (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${i * 4.2}%`,
            background: ["#ff6b9d", "#b8a4ff", "#ffd6ba"][i % 3],
            animationDelay: `${(i % 5) * 0.08}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}
export function AnimatedEnvelope({
  message,
  to,
  from,
}: {
  message: string;
  to: string;
  from: string;
}) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  return (
    <div className="envelope-experience">
      {open ? (
        <>
          <ConfettiEffect />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="letter"
          >
            <Heart size={28} />
            <h2>
              {" "}
              <I18nText text={"Dear"} /> {to},
            </h2>
            <p className="user-message">{message}</p>
            <p>
              {" "}
              <I18nText text={"With love"} />
              {from ? `, ${from}` : ""} ♡
            </p>
          </motion.div>
          <button className="text-button" onClick={() => setOpen(false)}>
            <RotateCcw size={16} /> <I18nText text={"Read it again"} />{" "}
          </button>
        </>
      ) : (
        <button
          className="envelope-button"
          onClick={() => setOpen(true)}
          aria-label={translate(language, "Open your envelope")}
        >
          <span className="envelope-flap" />
          <span className="seal">♥</span>
          <span className="envelope-label">
            {" "}
            <I18nText text={"For"} /> {to}
            <small>
              {" "}
              <I18nText text={"Tap to open a little happiness"} />{" "}
            </small>
          </span>
        </button>
      )}
    </div>
  );
}
export function ScratchCanvas({ message }: { message: string }) {
  const { language } = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(0);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    const gradient = ctx.createLinearGradient(0, 0, 560, 260);
    gradient.addColorStop(0, "#c7b5ed");
    gradient.addColorStop(1, "#f3b6cd");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 560, 260);
    ctx.fillStyle = "#56394f";
    const font =
      language === "hi"
        ? "Noto Sans Devanagari"
        : language === "gu"
          ? "Noto Sans Gujarati"
          : "Nunito";
    ctx.font = `bold 24px "${font}", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(
      translate(language, "A little secret, just for you"),
      280,
      120,
      510,
    );
    ctx.font = `18px "${font}", sans-serif`;
    ctx.fillText(translate(language, "Scratch here ♡"), 280, 160, 510);
  }, [round, language]);
  function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const el = event.currentTarget;
    const ctx = el.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * 560) / rect.width,
      y = ((event.clientY - rect.top) * 260) / rect.height;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 44;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(previous.current?.x ?? x, previous.current?.y ?? y);
    ctx.lineTo(x, y);
    ctx.stroke();
    previous.current = { x, y };
  }
  function measure() {
    drawing.current = false;
    previous.current = null;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, 560, 260).data;
    let erased = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 128) erased++;
    const ratio = Math.round((erased / (560 * 260)) * 100);
    setProgress(ratio);
    if (ratio >= 60) setRevealed(true);
  }
  return (
    <div>
      <div className="scratch-surface">
        <p
          className="user-message"
          tabIndex={revealed ? 0 : -1}
          aria-hidden={!revealed}
        >
          {message}
        </p>
        {!revealed && (
          <canvas
            ref={canvas}
            width={560}
            height={260}
            aria-label="Scratch card. Use the reveal button as a keyboard alternative."
            onPointerDown={(e) => {
              drawing.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              scratch(e);
            }}
            onPointerMove={scratch}
            onPointerUp={measure}
            onPointerCancel={measure}
          />
        )}
      </div>
      {revealed ? (
        <>
          <ConfettiEffect />
          <button
            className="text-button"
            onClick={() => {
              setRevealed(false);
              setProgress(0);
              setRound((n) => n + 1);
            }}
          >
            {" "}
            <I18nText text={"Play again"} />{" "}
          </button>
        </>
      ) : (
        <>
          <p className="muted" aria-live="polite">
            {progress} <I18nText text={"% scratched · reveals at 60%"} />{" "}
          </p>
          <button className="text-button" onClick={() => setRevealed(true)}>
            {" "}
            <I18nText text={"Reveal without scratching"} />{" "}
          </button>
        </>
      )}
    </div>
  );
}

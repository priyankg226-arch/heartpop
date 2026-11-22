import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Heart, RotateCcw, Sparkles } from "lucide-react";
import { I18nText, useLanguage } from "../i18n/react";
import { translate } from "../i18n/ui";
import type { Language } from "../i18n";
import { bingoLines, unlockTime } from "../lib/share";
import { AnimatedEnvelope, ConfettiEffect } from "./Interactive";
import { appLink, ShareButtons } from "./ShareButtons";

function Letter({
  to,
  from,
  message,
}: {
  to: string;
  from: string;
  message: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="letter"
    >
      <Heart size={26} />
      <h2>
        <I18nText text={"Dear"} /> {to},
      </h2>
      <p className="user-message">{message}</p>
      <p>
        <I18nText text={"With love"} />
        {from ? `, ${from}` : ""} ♡
      </p>
    </motion.div>
  );
}

export function dateLocale(language: Language) {
  return language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
}

/* ───────────── Message in the Stars ───────────── */

// Hand-placed so stars never overlap and the constellation reads nicely.
const STAR_SPOTS = [
  [16, 24],
  [38, 14],
  [62, 26],
  [84, 16],
  [74, 52],
  [50, 46],
  [26, 58],
  [12, 78],
  [88, 80],
];

export function StarSky({
  stars,
  message,
  to,
  from,
}: {
  stars: string[];
  message: string;
  to: string;
  from: string;
}) {
  const { language } = useLanguage();
  const [found, setFound] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const seen = found.filter((i) => i < stars.length);
  const done = seen.length === stars.length;
  const tap = (i: number) => {
    setCurrent(i);
    setFound((f) => (f.includes(i) ? f : [...f, i]));
  };
  return (
    <div className="star-experience">
      <div className="star-sky">
        <svg
          className="star-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points={seen.map((i) => STAR_SPOTS[i].join(",")).join(" ")}
          />
        </svg>
        {stars.map((_, i) => (
          <button
            key={i}
            type="button"
            className="star"
            style={{
              left: `${STAR_SPOTS[i][0]}%`,
              top: `${STAR_SPOTS[i][1]}%`,
              animationDelay: `${i * 0.35}s`,
            }}
            aria-pressed={seen.includes(i)}
            aria-label={translate(language, "Star {n} of {total}", {
              n: String(i + 1),
              total: String(stars.length),
            })}
            onClick={() => tap(i)}
          >
            ✦
          </button>
        ))}
        {!done && (
          <p className="star-note" aria-live="polite">
            {current === null ? (
              <I18nText text={"Tap the stars to find hidden messages."} />
            ) : (
              <motion.span
                key={current}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {stars[current]}
              </motion.span>
            )}
          </p>
        )}
      </div>
      <p className="muted" aria-live="polite">
        <I18nText
          text={"{found} of {total} stars found"}
          values={{ found: String(seen.length), total: String(stars.length) }}
        />
      </p>
      {done && (
        <>
          <ConfettiEffect />
          <ul className="star-story">
            {stars.map((s, i) => (
              <li key={i}>✦ {s}</li>
            ))}
          </ul>
          <Letter to={to} from={from} message={message} />
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setFound([]);
              setCurrent(null);
            }}
          >
            <RotateCcw size={16} /> <I18nText text={"Watch the sky again"} />
          </button>
        </>
      )}
    </div>
  );
}

/* ───────────── Catch My Heart ───────────── */

export const HEART_GOAL = 10;
const GAME_SECONDS = 20;
const BASKET_HALF = 0.11;

type Drop = { id: number; x: number; y: number; speed: number };

export function CatchHearts({
  message,
  to,
  from,
}: {
  message: string;
  to: string;
  from: string;
}) {
  const { language } = useLanguage();
  const [phase, setPhase] = useState<
    "idle" | "playing" | "won" | "lost" | "revealed"
  >("idle");
  const [, setFrame] = useState(0);
  const area = useRef<HTMLDivElement>(null);
  const game = useRef({
    basket: 0.5,
    drops: [] as Drop[],
    score: 0,
    left: GAME_SECONDS,
    nextId: 0,
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const g = game.current;
    let raf = 0;
    let last = performance.now();
    let spawnIn = 0;
    const end = last + GAME_SECONDS * 1000;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = 0.55 + Math.random() * 0.35;
        g.drops.push({
          id: g.nextId++,
          x: 0.08 + Math.random() * 0.84,
          y: -0.08,
          speed: 0.38 + Math.random() * 0.22,
        });
      }
      g.drops = g.drops.filter((d) => {
        d.y += d.speed * dt;
        if (d.y >= 0.84 && d.y <= 0.95 && Math.abs(d.x - g.basket) < BASKET_HALF) {
          g.score++;
          return false;
        }
        return d.y < 1.05;
      });
      g.left = Math.max(0, Math.ceil((end - now) / 1000));
      setFrame((f) => f + 1);
      if (now >= end) {
        setPhase(g.score >= HEART_GOAL ? "won" : "lost");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    area.current?.focus();
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const start = () => {
    game.current = {
      basket: 0.5,
      drops: [],
      score: 0,
      left: GAME_SECONDS,
      nextId: 0,
    };
    setPhase("playing");
  };
  const moveTo = (clientX: number) => {
    const rect = area.current?.getBoundingClientRect();
    if (!rect) return;
    game.current.basket = Math.min(
      1 - BASKET_HALF,
      Math.max(BASKET_HALF, (clientX - rect.left) / rect.width),
    );
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowLeft" ? -0.08 : e.key === "ArrowRight" ? 0.08 : 0;
    if (!step) return;
    e.preventDefault();
    const g = game.current;
    g.basket = Math.min(1 - BASKET_HALF, Math.max(BASKET_HALF, g.basket + step));
  };

  const g = game.current;
  if (phase === "won" || phase === "revealed")
    return (
      <div className="hearts-experience">
        <ConfettiEffect />
        {phase === "won" && (
          <p className="hearts-result" role="status">
            <I18nText
              text={"You caught {score} hearts! Your surprise is unlocked."}
              values={{ score: String(g.score) }}
            />
          </p>
        )}
        <Letter to={to} from={from} message={message} />
        <button type="button" className="text-button" onClick={start}>
          <RotateCcw size={16} /> <I18nText text={"Play again"} />
        </button>
        {phase === "won" && (
          <ShareButtons
            heading="Challenge your friends"
            url={appLink("/create/hearts")}
            text={translate(
              language,
              "I caught {score} hearts in Catch My Heart! 💗 Can you beat me? Make your own game:",
              { score: String(g.score) },
            )}
          />
        )}
      </div>
    );

  return (
    <div className="hearts-experience">
      <div className="hearts-hud" aria-live="polite">
        <span>
          ♥{" "}
          <I18nText
            text={"Hearts {score}/{goal}"}
            values={{ score: String(g.score), goal: String(HEART_GOAL) }}
          />
        </span>
        <span>
          ⏱{" "}
          <I18nText text={"{time}s left"} values={{ time: String(g.left) }} />
        </span>
      </div>
      <div
        ref={area}
        className="heart-field"
        tabIndex={phase === "playing" ? 0 : -1}
        role="group"
        aria-label={translate(language, "Heart catching game")}
        onPointerMove={(e) => phase === "playing" && moveTo(e.clientX)}
        onPointerDown={(e) => phase === "playing" && moveTo(e.clientX)}
        onKeyDown={onKey}
      >
        {phase === "playing" ? (
          <>
            {g.drops.map((d) => (
              <span
                key={d.id}
                className="falling-heart"
                style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
                aria-hidden="true"
              >
                ♥
              </span>
            ))}
            <span
              className="basket"
              style={{ left: `${g.basket * 100}%` }}
              aria-hidden="true"
            />
          </>
        ) : (
          <div className="heart-start">
            {phase === "lost" ? (
              <p role="status">
                <I18nText
                  text={"So close! You caught {score}."}
                  values={{ score: String(g.score) }}
                />
              </p>
            ) : (
              <p>
                <I18nText
                  text={"Catch {goal} hearts in 20 seconds to unlock a surprise."}
                  values={{ goal: String(HEART_GOAL) }}
                />
              </p>
            )}
            <button type="button" className="button" onClick={start}>
              <Heart size={16} />{" "}
              <I18nText text={phase === "lost" ? "Try again" : "Start game"} />
            </button>
          </div>
        )}
      </div>
      <p className="field-meta">
        <I18nText
          text={"Move the basket with your finger, mouse or arrow keys."}
        />
      </p>
      {phase !== "playing" && (
        <button
          type="button"
          className="text-button"
          onClick={() => setPhase("revealed")}
        >
          <I18nText text={"Reveal without playing"} />
        </button>
      )}
    </div>
  );
}

/* ───────────── Future Love Letter ───────────── */

export function FutureLetter({
  unlockAt,
  message,
  to,
  from,
  peek,
}: {
  unlockAt: string;
  message: string;
  to: string;
  from: string;
  peek: boolean;
}) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  const target = unlockTime(unlockAt);
  const locked = now < target;
  useEffect(() => {
    if (!locked) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [locked]);
  const date = new Intl.DateTimeFormat(dateLocale(language), {
    dateStyle: "long",
  }).format(target);

  if (!locked || peek)
    return (
      <div className="future-experience">
        {locked && (
          <p className="future-peek">
            <I18nText
              text={"Sender preview · They can open it on {date}"}
              values={{ date }}
            />
          </p>
        )}
        <AnimatedEnvelope message={message} to={to} from={from} />
      </div>
    );

  const left = Math.max(0, target - now);
  const parts = [
    [Math.floor(left / 86400000), "days"],
    [Math.floor(left / 3600000) % 24, "hours"],
    [Math.floor(left / 60000) % 60, "min"],
    [Math.floor(left / 1000) % 60, "sec"],
  ] as const;
  return (
    <div className="future-experience">
      <div className="time-capsule">
        <span className="hourglass" aria-hidden="true">
          ⏳
        </span>
        <h2>
          <I18nText text={"A letter from the future is waiting for you."} />
        </h2>
        <p>
          <I18nText text={"Opens on {date}"} values={{ date }} />
        </p>
        <div className="countdown" role="timer">
          {parts.map(([value, unit]) => (
            <span key={unit}>
              <strong>{value}</strong>
              <small>
                <I18nText text={unit} />
              </small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Couple Bingo ───────────── */

export function CoupleBingo({
  squares,
  message,
  to,
  from,
}: {
  squares: string[];
  message: string;
  to: string;
  from: string;
}) {
  const { language } = useLanguage();
  const [marked, setMarked] = useState<boolean[]>(() => squares.map(() => false));
  const lines = bingoLines(marked);
  const winning = new Set(lines.flat());
  const won = lines.length > 0;
  return (
    <div className="bingo-experience">
      <p className="muted">
        <I18nText
          text={"Tap every square where the answer is you. Three in a row wins!"}
        />
      </p>
      <div className="bingo-board">
        {squares.map((text, i) => (
          <button
            key={i}
            type="button"
            className={`bingo-cell${winning.has(i) ? " win" : ""}`}
            aria-pressed={marked[i]}
            onClick={() =>
              setMarked((m) => m.map((v, j) => (j === i ? !v : v)))
            }
          >
            <span>{text}</span>
          </button>
        ))}
      </div>
      {won && (
        <>
          <ConfettiEffect />
          <p className="bingo-shout" role="status">
            <Sparkles size={18} /> <I18nText text={"BINGO! ♡"} />
          </p>
          <Letter to={to} from={from} message={message} />
          <ShareButtons
            url={appLink("/create/bingo")}
            text={translate(
              language,
              "We got BINGO on HeartPop Couple Bingo! 🎯 Make a card for your friends:",
            )}
          />
        </>
      )}
      {marked.some(Boolean) && (
        <button
          type="button"
          className="text-button"
          onClick={() => setMarked(squares.map(() => false))}
        >
          <RotateCcw size={16} /> <I18nText text={"Clear the card"} />
        </button>
      )}
    </div>
  );
}

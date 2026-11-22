import {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, FileUp, HeartHandshake, Lock, RotateCcw, Smartphone, Users } from "lucide-react";
import type { z } from "zod";
import { ShareButtons } from "../../../components/ShareButtons";
import { ConfettiEffect } from "../../../components/Interactive";
import { gameById, type CoupleGameId, type PlayMode } from "../registry";
import {
  challengeUrl,
  decodeShare,
  downloadText,
  encodeShare,
  exportFileContent,
  InvalidShareError,
  parseImportedFile,
  readFileText,
  ShareTooLargeError,
} from "../lib/shareCodec";
import type { Players } from "../lib/progress";
import { useT, type T } from "../lib/useT";
import { GameIcon } from "./GameIcon";

export const displayName = (t: T, players: Players, who: "a" | "b") =>
  players[who].trim() || t(who === "a" ? "Partner A" : "Partner B");

/* ---------- Frame & error boundary ---------- */
export function GameFrame({
  gameId,
  children,
  wide = false,
}: {
  gameId: CoupleGameId;
  children: ReactNode;
  wide?: boolean;
}) {
  const t = useT();
  const game = gameById(gameId)!;
  return (
    <main className={`cg-page cg-game ${wide ? "wide" : ""}`} data-game={gameId}>
      <Link className="back-link cg-back" to="/couple-games">
        <ArrowLeft size={16} /> {t("All couple games")}
      </Link>
      <header className="cg-game-header">
        <GameIcon id={gameId} size={52} />
        <div>
          <span className="eyebrow">{t(categoryLabel(game.category))}</span>
          <p className="cg-game-title">
            {t(game.title)} <span aria-hidden="true">{game.emoji}</span>
          </p>
        </div>
      </header>
      <GameErrorBoundary>{children}</GameErrorBoundary>
    </main>
  );
}
const categoryLabel = (id: string) =>
  ({
    creative: "Creative Together",
    know: "Know Each Other",
    romantic: "Romantic Moments",
    funny: "Funny Challenges",
    puzzles: "Puzzles & Surprises",
  })[id] ?? id;

export class GameErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <section className="cg-card cg-center" role="alert">
        <h1>Oops, this game tripped over its shoelaces.</h1>
        <p>Your other HeartPop surprises are fine. Try starting the game again.</p>
        <button className="button" onClick={() => this.setState({ error: false })}>
          <RotateCcw size={18} /> Try again
        </button>{" "}
        <Link className="button secondary" to="/couple-games">
          Back to couple games
        </Link>
      </section>
    ) : (
      this.props.children
    );
  }
}

/* ---------- Intro: how to play, mode and names ---------- */
export interface StartOptions {
  mode: PlayMode;
  players: Players;
}
export function GameIntro({
  gameId,
  onStart,
  resume,
  children,
  startLabel = "Let’s play",
  modes,
  namesFor = "both",
  extraNote,
}: {
  gameId: CoupleGameId;
  onStart: (options: StartOptions) => void;
  resume?: { onResume: () => void; onDiscard: () => void; label?: string } | null;
  children?: ReactNode;
  startLabel?: string;
  modes?: PlayMode[];
  namesFor?: "both" | "none";
  extraNote?: ReactNode;
}) {
  const t = useT();
  const game = gameById(gameId)!;
  const available = modes ?? game.supportedModes;
  const [mode, setMode] = useState<PlayMode>(available[0]);
  const [players, setPlayers] = useState<Players>({ a: "", b: "" });
  return (
    <section className="cg-intro" aria-labelledby="cg-intro-title">
      <div className="cg-card cg-intro-hero">
        <h1 id="cg-intro-title">
          {t(game.title)} <span aria-hidden="true">{game.emoji}</span>
        </h1>
        <p className="cg-lead">{t(game.description)}</p>
        <p className="cg-meta">
          ⏱ {t("About {minutes} min", { minutes: game.estimatedMinutes })} ·{" "}
          {game.supportedModes.map((m) => t(m === "local" ? "Same device" : "Shareable link")).join(" · ")}
        </p>
        {resume && (
          <div className="cg-resume" role="status">
            <p>{t(resume.label ?? "You have a game in progress on this device.")}</p>
            <div className="cg-row">
              <button className="button small" onClick={resume.onResume}>
                {t("Continue where we left off")}
              </button>
              <button className="button secondary small" onClick={resume.onDiscard}>
                {t("Start fresh")}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="cg-card">
        <h2>{t("How to play")}</h2>
        <ol className="cg-steps">
          {game.howToPlay.map((step) => (
            <li key={step}>{t(step)}</li>
          ))}
        </ol>
        {extraNote}
      </div>
      <form
        className="cg-card cg-setup"
        onSubmit={(event) => {
          event.preventDefault();
          onStart({ mode, players: { a: players.a.trim(), b: players.b.trim() } });
        }}
      >
        {available.length > 1 && (
          <fieldset>
            <legend>{t("How do you want to play?")}</legend>
            <div className="cg-mode-grid">
              {available.map((m) => (
                <label key={m} className={`cg-mode ${mode === m ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  {m === "local" ? <Users size={22} /> : <Smartphone size={22} />}
                  <span>
                    <strong>{t(m === "local" ? "Together on this device" : "Send a challenge link")}</strong>
                    <small>
                      {t(
                        m === "local"
                          ? "Take turns and pass the phone. Secrets stay hidden until the reveal."
                          : "Create it here, send the link, and they play on their own device.",
                      )}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {namesFor === "both" && (
          <fieldset>
            <legend>
              {t("Your names")} <small>({t("optional")})</small>
            </legend>
            <div className="form-row">
              <label>
                {t("Partner A")}
                <input
                  value={players.a}
                  maxLength={30}
                  autoComplete="off"
                  onChange={(e) => setPlayers({ ...players, a: e.target.value })}
                  placeholder={t("e.g. Mira")}
                />
              </label>
              <label>
                {t("Partner B")}
                <input
                  value={players.b}
                  maxLength={30}
                  autoComplete="off"
                  onChange={(e) => setPlayers({ ...players, b: e.target.value })}
                  placeholder={t("e.g. Jay")}
                />
              </label>
            </div>
          </fieldset>
        )}
        {children}
        <button className="button cg-start" type="submit">
          <HeartHandshake size={18} /> {t(startLabel)}
        </button>
      </form>
    </section>
  );
}

/* ---------- Pass-the-device ---------- */
export function PassDevice({
  to,
  message,
  onReady,
  readyLabel = "I’m ready",
}: {
  to: string;
  message?: string;
  onReady: () => void;
  readyLabel?: string;
}) {
  const t = useT();
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <section className="cg-card cg-pass" aria-live="polite">
      <div className="cg-pass-icon" aria-hidden="true">
        <Lock size={30} />
      </div>
      <h1>{t("Pass the device to {name}", { name: to })}</h1>
      <p>{message ?? t("No peeking! Hand it over and let them tap the button when they’re ready.")}</p>
      <button ref={button} className="button" onClick={onReady}>
        {t(readyLabel)}
      </button>
    </section>
  );
}

/* ---------- Completion ---------- */
export function Celebration({ show = true }: { show?: boolean }) {
  return show ? <ConfettiEffect /> : null;
}

export function StepHeading({ step, total, children }: { step?: number; total?: number; children: ReactNode }) {
  const t = useT();
  return (
    <div className="cg-step-heading">
      {step !== undefined && total !== undefined && (
        <span className="cg-progress-label">{t("Step {step} of {total}", { step, total })}</span>
      )}
      <h1>{children}</h1>
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="cg-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

/* ---------- Sharing ---------- */
export function ShareChallenge<D>({
  gameId,
  schema,
  data,
  text,
  heading = "Send your challenge",
  filename,
}: {
  gameId: CoupleGameId;
  schema: z.ZodType<D>;
  data: D;
  text: string;
  heading?: string;
  filename: string;
}) {
  const t = useT();
  const [state, setState] = useState<{ url?: string; tooLarge?: boolean; error?: string }>({});
  const json = JSON.stringify(data);
  useEffect(() => {
    let alive = true;
    encodeShare(gameId, schema, data)
      .then((token) => alive && setState({ url: challengeUrl(gameId, token) }))
      .catch((error) =>
        alive &&
        setState(
          error instanceof ShareTooLargeError
            ? { tooLarge: true }
            : { error: "Some details are missing or too long. Please check the form." },
        ),
      );
    return () => {
      alive = false;
    };
    // Re-encode only when the content actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, json]);
  const download = () => downloadText(exportFileContent(gameId, schema, data), filename);
  return (
    <div className="cg-share">
      {state.url && <ShareButtons heading={heading} url={state.url} text={text} />}
      {state.tooLarge && (
        <p className="cg-notice" role="status">
          {t("This one is too big for a link. Download the file and send it — they can open it from this game’s page.")}
        </p>
      )}
      {state.error && (
        <p className="cg-notice error" role="alert">
          {t(state.error)}
        </p>
      )}
      <div className="cg-row">
        <button type="button" className="text-button" onClick={download}>
          <Download size={16} /> {t("Download as a file")}
        </button>
      </div>
      <p className="field-meta">
        {t("Links and files are encoded, not encrypted. Anyone who has them can read what’s inside, including answers.")}
      </p>
    </div>
  );
}

export function ImportChallenge<D>({
  gameId,
  schema,
  onImport,
  label = "Got a challenge file? Open it here",
}: {
  gameId: CoupleGameId;
  schema: z.ZodType<D>;
  onImport: (data: D) => void;
  label?: string;
}) {
  const t = useT();
  const [error, setError] = useState("");
  return (
    <div className="cg-import">
      <label className="text-button cg-file-label">
        <FileUp size={16} /> {t(label)}
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            try {
              onImport(parseImportedFile(gameId, schema, await readFileText(file)));
              setError("");
            } catch (e) {
              setError(e instanceof InvalidShareError ? e.message : "We couldn’t read that file.");
            }
          }}
        />
      </label>
      {error && (
        <p className="cg-notice error" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}

/** Decodes and validates a challenge token from the URL. */
export function useSharedChallenge<D>(gameId: CoupleGameId, schema: z.ZodType<D>, token: string | undefined) {
  const [result, setResult] = useState<{ status: "idle" | "loading" | "ok" | "error"; data?: D; error?: string }>(
    { status: token ? "loading" : "idle" },
  );
  useEffect(() => {
    if (!token) {
      setResult({ status: "idle" });
      return;
    }
    let alive = true;
    setResult({ status: "loading" });
    decodeShare(gameId, schema, token)
      .then((data) => alive && setResult({ status: "ok", data }))
      .catch((error) => alive && setResult({ status: "error", error: (error as Error).message }));
    return () => {
      alive = false;
    };
  }, [gameId, schema, token]);
  return result;
}

export function InvalidChallenge({ gameId, error }: { gameId: CoupleGameId; error?: string }) {
  const t = useT();
  return (
    <section className="cg-card cg-center" role="alert">
      <h1>{t("We couldn’t open this challenge.")}</h1>
      <p>{t(error ?? "This challenge link is invalid, incomplete or from an unsupported version.")}</p>
      <p className="field-meta">{t("Ask your partner to send the link again, or to send it as a file.")}</p>
      <div className="cg-row center">
        <Link className="button" to={`/couple-games/${gameId}`}>
          {t("Play this game anyway")}
        </Link>
        <Link className="button secondary" to="/couple-games">
          {t("All couple games")}
        </Link>
      </div>
    </section>
  );
}

export function LoadingCard() {
  const t = useT();
  return (
    <section className="cg-card cg-center" role="status">
      <p>{t("Unwrapping your challenge…")}</p>
    </section>
  );
}

/** A labelled score line, e.g. for result screens. */
export function ScoreLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="cg-score-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

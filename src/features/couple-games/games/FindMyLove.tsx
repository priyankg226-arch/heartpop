import { useEffect, useState } from "react";
import { z } from "zod";
import { motion, useReducedMotion } from "motion/react";
import { Eye, KeyRound, Lightbulb, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Celebration,
  GameIntro,
  ImportChallenge,
  InvalidChallenge,
  LoadingCard,
  PassDevice,
  ScoreLine,
  ShareChallenge,
  StepHeading,
  useSharedChallenge,
} from "../components/GameShell";
import { HUNT_THEMES, SAMPLE_CLUES } from "../data/content";
import { answerMatches, clueScore, splitAnswers } from "../lib/gameLogic";
import { newSessionId, useGameSession } from "../lib/progress";
import { nameField } from "../lib/shareCodec";
import { usePhaseUrl, useStep } from "../lib/useStep";
import { useT } from "../lib/useT";

const GAME = "find-my-love" as const;
const MIN_CLUES = 3;
const MAX_CLUES = 7;
const clueSchema = z
  .object({
    q: z.string().trim().min(3).max(140),
    answers: z.array(z.string().trim().min(1).max(60)).min(1).max(6),
    hint: z.string().trim().max(120),
  })
  .strict();
export const huntShareSchema = z
  .object({
    from: nameField,
    to: z.string().trim().min(1).max(30),
    theme: z.enum(["map", "stars", "garden"]),
    clues: z.array(clueSchema).min(MIN_CLUES).max(MAX_CLUES),
    final: z.string().trim().min(1).max(400),
  })
  .strict();
type Hunt = z.infer<typeof huntShareSchema>;

/** Editable draft: answers are kept as the raw comma-separated text. */
const draftSchema = z.object({
  from: z.string().max(30),
  to: z.string().max(30),
  theme: z.enum(["map", "stars", "garden"]),
  clues: z.array(z.object({ q: z.string().max(140), answers: z.string().max(400), hint: z.string().max(120) })).max(MAX_CLUES),
  final: z.string().max(400),
});
type Draft = z.infer<typeof draftSchema>;
const NEW_DRAFT: Draft = {
  from: "",
  to: "",
  theme: "map",
  clues: SAMPLE_CLUES.slice(0, 3).map((q) => ({ q, answers: "", hint: "" })),
  final: "",
};
export const draftToHunt = (d: Draft): Hunt => ({
  from: d.from.trim(),
  to: d.to.trim(),
  theme: d.theme,
  final: d.final.trim(),
  clues: d.clues.map((c) => ({ q: c.q.trim(), answers: splitAnswers(c.answers), hint: c.hint.trim() })),
});

type Phase = "intro" | "create" | "preview" | "share" | "pass" | "play";

export default function FindMyLove() {
  const t = useT();
  const { token, go } = useStep(GAME);
  const shared = useSharedChallenge(GAME, huntShareSchema, token);
  const session = useGameSession(GAME, draftSchema);
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<"local" | "shareable">("shareable");
  const [draft, setDraftState] = useState<Draft>(NEW_DRAFT);
  const [imported, setImported] = useState<Hunt | null>(null);
  const [meta] = useState({ id: newSessionId(), createdAt: Date.now() });
  usePhaseUrl(GAME, phase, (p) =>
    token ? null : p === "intro" ? "" : p === "play" || p === "pass" ? "play" : "create",
  );
  const setDraft = (next: Draft) => {
    setDraftState(next);
    session.save({
      id: meta.id,
      gameId: GAME,
      schemaVersion: 1,
      mode,
      players: { a: next.from, b: next.to },
      createdAt: meta.createdAt,
      updatedAt: Date.now(),
      phase: "create",
      completed: false,
      state: next,
    });
  };

  if (token) {
    if (shared.status === "loading") return <LoadingCard />;
    if (shared.status === "error") return <InvalidChallenge gameId={GAME} error={shared.error} />;
    if (shared.status === "ok") return <HuntPlayer hunt={shared.data!} onExit={() => go("")} />;
  }
  if (imported) return <HuntPlayer hunt={imported} onExit={() => setImported(null)} />;

  if (phase === "intro")
    return (
      <>
        <GameIntro
          gameId={GAME}
          namesFor="none"
          startLabel="Create a treasure hunt"
          resume={
            session.saved
              ? {
                  label: "You have an unfinished treasure hunt draft on this device.",
                  onResume: () => {
                    setDraftState(session.saved!.state);
                    setMode(session.saved!.mode);
                    setPhase("create");
                  },
                  onDiscard: () => void session.discard(),
                }
              : null
          }
          extraNote={
            <p className="field-meta">
              {t("Answers travel inside the link, so a curious partner could peek. It’s a sweet game, not a vault.")}
            </p>
          }
          onStart={({ mode: m }) => {
            setMode(m);
            setDraftState(NEW_DRAFT);
            setPhase("create");
          }}
        />
        <ImportChallenge gameId={GAME} schema={huntShareSchema} onImport={setImported} />
      </>
    );

  const hunt = draftToHunt(draft);
  const check = huntShareSchema.safeParse(hunt);
  if (phase === "preview" || phase === "play")
    return (
      <>
        {phase === "preview" && <p className="cg-notice">{t("Preview mode — this is what {name} will see.", { name: hunt.to })}</p>}
        <HuntPlayer
          hunt={hunt}
          onExit={() => {
            if (phase === "play") void session.discard();
            setPhase(phase === "preview" ? "create" : "intro");
          }}
          exitLabel={phase === "preview" ? "Back to editing" : "Done"}
        />
      </>
    );
  if (phase === "pass") return <PassDevice to={hunt.to} onReady={() => setPhase("play")} readyLabel="Start the hunt" />;
  if (phase === "share")
    return (
      <section className="cg-card">
        <StepHeading>{t("Your treasure hunt for {name} is ready 🔐", { name: hunt.to })}</StepHeading>
        <ShareChallenge
          gameId={GAME}
          schema={huntShareSchema}
          data={hunt}
          heading="Send your treasure hunt"
          text={t("{name} made you a treasure hunt 🗺️ Solve the clues to find the surprise:", { name: hunt.from || t("Someone") })}
          filename="find-my-love.json"
        />
        <button className="text-button" onClick={() => setPhase("create")}>
          {t("Edit the hunt")}
        </button>
      </section>
    );

  const updateClue = (i: number, patch: Partial<Draft["clues"][number]>) =>
    setDraft({ ...draft, clues: draft.clues.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <form
      className="cg-card cg-setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (!check.success) return;
        void session.discard();
        setPhase(mode === "local" ? "pass" : "share");
      }}
    >
      <StepHeading>{t("Create your treasure hunt")}</StepHeading>
      <div className="form-row">
        <label>
          {t("From")} <small>({t("optional")})</small>
          <input value={draft.from} maxLength={30} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </label>
        <label>
          {t("For")}
          <input required value={draft.to} maxLength={30} onChange={(e) => setDraft({ ...draft, to: e.target.value })} placeholder={t("e.g. Mira")} />
        </label>
      </div>
      <fieldset>
        <legend>{t("Theme")}</legend>
        <div className="chips">
          {HUNT_THEMES.map((h) => (
            <button type="button" key={h.id} className="chip" aria-pressed={draft.theme === h.id} onClick={() => setDraft({ ...draft, theme: h.id as Draft["theme"] })}>
              <span aria-hidden="true">{h.emoji}</span> {t(h.label)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>
          {t("Clues")} <small>({draft.clues.length}/{MAX_CLUES})</small>
        </legend>
        <ol className="cg-clue-editor">
          {draft.clues.map((clue, i) => (
            <li key={i} className="cg-card inset">
              <label>
                {t("Clue {n}", { n: i + 1 })}
                <input value={clue.q} maxLength={140} onChange={(e) => updateClue(i, { q: e.target.value })} />
              </label>
              <label>
                {t("Accepted answers")} <small>({t("separate with commas")})</small>
                <input
                  value={clue.answers}
                  maxLength={400}
                  onChange={(e) => updateClue(i, { answers: e.target.value })}
                  placeholder={t("e.g. Pizza, Margherita")}
                />
              </label>
              <label>
                {t("Hint")} <small>({t("optional")})</small>
                <input value={clue.hint} maxLength={120} onChange={(e) => updateClue(i, { hint: e.target.value })} />
              </label>
              {draft.clues.length > MIN_CLUES && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setDraft({ ...draft, clues: draft.clues.filter((_, j) => j !== i) })}
                >
                  <Trash2 size={15} /> {t("Remove clue {n}", { n: i + 1 })}
                </button>
              )}
            </li>
          ))}
        </ol>
        {draft.clues.length < MAX_CLUES && (
          <button
            type="button"
            className="button secondary small"
            onClick={() =>
              setDraft({
                ...draft,
                clues: [...draft.clues, { q: SAMPLE_CLUES[draft.clues.length % SAMPLE_CLUES.length], answers: "", hint: "" }],
              })
            }
          >
            <Plus size={16} /> {t("Add a clue")}
          </button>
        )}
      </fieldset>
      <label>
        {t("Final surprise message")}
        <textarea
          rows={4}
          maxLength={400}
          value={draft.final}
          onChange={(e) => setDraft({ ...draft, final: e.target.value })}
          placeholder={t("e.g. You found me! Dinner date on Friday — my treat ♡")}
        />
      </label>
      {!check.success && (
        <p className="field-meta">{t("Add their name, at least one answer for every clue, and a final message.")}</p>
      )}
      <div className="cg-row">
        <button type="button" className="button secondary" disabled={!check.success} onClick={() => setPhase("preview")}>
          <Eye size={18} /> {t("Preview")}
        </button>
        <button type="submit" className="button" disabled={!check.success}>
          {t(mode === "local" ? "Hand it to them now" : "Get the share link")}
        </button>
      </div>
      <p className="field-meta">{t("Your draft is saved on this device until you finish.")}</p>
    </form>
  );
}

interface ClueProgress {
  solved: boolean;
  revealed: boolean;
  hints: number;
  wrong: number;
}

export function HuntPlayer({ hunt, onExit, exitLabel = "Make my own treasure hunt" }: { hunt: Hunt; onExit: () => void; exitLabel?: string }) {
  const t = useT();
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState<ClueProgress[]>(() => hunt.clues.map(() => ({ solved: false, revealed: false, hints: 0, wrong: 0 })));
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [opened, setOpened] = useState(false);
  const current = progress.findIndex((p) => !p.solved && !p.revealed);
  const finished = current === -1;
  const clue = hunt.clues[current];
  const theme = HUNT_THEMES.find((h) => h.id === hunt.theme)!;
  const score = progress.reduce((s, p) => s + clueScore(p.solved, p.hints, p.wrong), 0);
  useEffect(() => setAnswer(""), [current]);
  const patch = (i: number, p: Partial<ClueProgress>) => setProgress(progress.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <section className={`cg-hunt theme-${hunt.theme}`} aria-labelledby="hunt-title">
      <div className="cg-card cg-center">
        <span className="eyebrow">
          {theme.emoji} {t(theme.label)}
        </span>
        <h1 id="hunt-title">
          {hunt.from ? t("{from}’s treasure hunt for {to}", { from: hunt.from, to: hunt.to }) : t("A treasure hunt for {to}", { to: hunt.to })}
        </h1>
      </div>
      <TreasureMap total={hunt.clues.length} progress={progress} current={current} />
      {!finished && clue ? (
        <form
          className="cg-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (!answer.trim()) return;
            if (answerMatches(answer, clue.answers)) {
              patch(current, { solved: true });
              setFeedback(t("Yes! Clue {n} solved. The path continues…", { n: current + 1 }));
            } else {
              patch(current, { wrong: progress[current].wrong + 1 });
              setFeedback(t("Not quite. Try again, use a hint, or reveal the answer."));
            }
          }}
        >
          <span className="cg-progress-label">{t("Clue {n} of {total}", { n: current + 1, total: hunt.clues.length })}</span>
          <h2 className="cg-question-title">{clue.q}</h2>
          {progress[current].hints > 0 && clue.hint && (
            <p className="cg-hint">
              <Lightbulb size={16} /> {clue.hint}
            </p>
          )}
          <label>
            {t("Your answer")}
            <input value={answer} maxLength={60} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" />
          </label>
          <div className="cg-row">
            <button className="button" type="submit" disabled={!answer.trim()}>
              <KeyRound size={18} /> {t("Unlock")}
            </button>
            {clue.hint && progress[current].hints === 0 && (
              <button type="button" className="button secondary" onClick={() => patch(current, { hints: 1 })}>
                <Lightbulb size={16} /> {t("Show hint")}
              </button>
            )}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                patch(current, { revealed: true });
                setFeedback(t("The answer was “{answer}”. On to the next clue!", { answer: clue.answers[0] }));
              }}
            >
              {t("Reveal answer & continue")}
            </button>
          </div>
          {progress[current].wrong > 0 && (
            <p className="field-meta">{t("Wrong tries on this clue: {n}", { n: progress[current].wrong })}</p>
          )}
        </form>
      ) : (
        <div className="cg-card cg-result">
          {!opened ? (
            <>
              <p className="cg-chest" aria-hidden="true">🧰</p>
              <h2>{t("You reached the treasure!")}</h2>
              <button className="button" onClick={() => setOpened(true)}>
                {t("Open the treasure chest")}
              </button>
            </>
          ) : (
            <motion.div initial={reduced ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Celebration />
              <p className="cg-chest" aria-hidden="true">💝</p>
              <h2>{t("Your surprise")}</h2>
              <p className="cg-big-text user-message">{hunt.final}</p>
              {hunt.from && <p>— {hunt.from} ♡</p>}
              <div className="cg-stats">
                <ScoreLine label={t("Treasure points")} value={score} />
                <ScoreLine label={t("Solved")} value={`${progress.filter((p) => p.solved).length}/${hunt.clues.length}`} />
                <ScoreLine label={t("Hints used")} value={progress.reduce((s, p) => s + p.hints, 0)} />
              </div>
              <p className="field-meta">{t("100 per solved clue − 25 per hint − 10 per wrong try. Revealed clues score 0.")}</p>
              <div className="cg-row center">
                <button className="button secondary" onClick={onExit}>
                  <RotateCcw size={16} /> {t(exitLabel)}
                </button>
                <Link className="text-button" to="/couple-games">
                  {t("More couple games")}
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {feedback}
      </p>
      {feedback && !finished && <p className="cg-notice" aria-hidden="true">{feedback}</p>}
    </section>
  );
}

function TreasureMap({ total, progress, current }: { total: number; progress: ClueProgress[]; current: number }) {
  const t = useT();
  const points = Array.from({ length: total + 1 }, (_, i) => {
    const x = 40 + (i * 520) / total;
    const y = 70 + Math.sin(i * 1.3) * 38;
    return [x, y];
  });
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <svg className="cg-map" viewBox="0 0 600 140" role="img" aria-label={t("Treasure map: {done} of {total} clues done", { done: progress.filter((p) => p.solved || p.revealed).length, total })}>
      <rect x="4" y="4" width="592" height="132" rx="20" className="cg-map-bg" />
      <path d={d} className="cg-map-path" />
      {points.map(([x, y], i) => {
        const isChest = i === total;
        const state = isChest ? (current === -1 ? "done" : "todo") : progress[i].solved ? "done" : progress[i].revealed ? "revealed" : i === current ? "current" : "todo";
        return (
          <g key={i} className={`cg-map-node ${state}`} transform={`translate(${x} ${y})`}>
            <circle r={isChest ? 22 : 16} />
            <text textAnchor="middle" dy="6" fontSize={isChest ? 20 : 15}>
              {isChest ? (current === -1 ? "💝" : "🧰") : state === "done" ? "✓" : state === "revealed" ? "•" : i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

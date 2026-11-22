import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Download, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Celebration,
  displayName,
  GameIntro,
  ImportChallenge,
  InvalidChallenge,
  LoadingCard,
  PassDevice,
  ProgressBar,
  ShareChallenge,
  useSharedChallenge,
} from "../components/GameShell";
import { DATE_STEPS } from "../data/content";
import { mergeDreamDate } from "../lib/gameLogic";
import type { Players } from "../lib/progress";
import { downloadResultCard } from "../lib/resultExport";
import { nameField } from "../lib/shareCodec";
import { usePhaseUrl, useStep } from "../lib/useStep";
import { useT, type T } from "../lib/useT";

const GAME = "our-dream-date" as const;
const picksSchema = z
  .array(z.number().int().min(-1).max(7))
  .length(DATE_STEPS.length)
  .refine((p) => p.every((v, i) => v < DATE_STEPS[i].options.length), "Unknown option");
export const dateShareSchema = z
  .object({
    a: nameField,
    b: nameField,
    picksA: picksSchema,
    msgA: z.string().trim().max(200),
    picksB: picksSchema.optional(),
    msgB: z.string().trim().max(200).optional(),
    when: z.string().max(20).regex(/^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?)?$/).optional(),
  })
  .strict();
type DateShare = z.infer<typeof dateShareSchema>;
type Phase = "intro" | "pickA" | "share" | "passB" | "pickB" | "result";
const EMPTY_PICKS = DATE_STEPS.map(() => -1);

const toRecord = (picks: number[]) =>
  Object.fromEntries(DATE_STEPS.map((s, i) => [s.id, picks[i] >= 0 ? s.options[picks[i]][0] : ""]));

export default function OurDreamDate() {
  const t = useT();
  const { token, go } = useStep(GAME);
  const shared = useSharedChallenge(GAME, dateShareSchema, token);
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<"local" | "shareable">("local");
  const [plan, setPlan] = useState<DateShare | null>(null);
  const [fromLink, setFromLink] = useState(false);
  usePhaseUrl(GAME, phase, (p) =>
    token && fromLink ? null : p === "intro" ? "" : p === "result" ? "result" : "create",
  );
  const restart = () => {
    setPlan(null);
    setFromLink(false);
    setPhase("intro");
    if (token) go("");
  };
  const open = (data: DateShare) => {
    setPlan(data);
    setFromLink(true);
    setPhase(data.picksB ? "result" : "pickB");
  };

  if (token && !fromLink) {
    if (shared.status === "loading") return <LoadingCard />;
    if (shared.status === "error") return <InvalidChallenge gameId={GAME} error={shared.error} />;
    if (shared.status === "ok") {
      const data = shared.data!;
      return (
        <section className="cg-card cg-center">
          <span className="eyebrow">{t(data.picksB ? "A DREAM DATE INVITATION" : "LET’S PLAN A DREAM DATE")}</span>
          <h1>
            {data.picksB
              ? t("{name} sent you your combined dream date 🌙", { name: data.a || data.b || t("Your partner") })
              : t("{name} planned their dream date. Now it’s your turn!", { name: data.a || t("Your partner") })}
          </h1>
          <p>{t(data.picksB ? "Open it to see the plan and invitation." : "Make your own picks without peeking, then see how your dates combine.")}</p>
          <button className="button" onClick={() => open(data)}>
            {t(data.picksB ? "Open the invitation" : "Make my picks")}
          </button>
        </section>
      );
    }
  }

  if (phase === "intro" || !plan)
    return (
      <>
        <GameIntro
          gameId={GAME}
          onStart={({ mode: m, players }) => {
            setMode(m);
            setPlan({ a: players.a, b: players.b, picksA: EMPTY_PICKS, msgA: "" });
            setPhase("pickA");
          }}
          extraNote={<p className="field-meta">{t("These are dreamy ideas, not real bookings or venue suggestions.")}</p>}
        />
        <ImportChallenge gameId={GAME} schema={dateShareSchema} onImport={open} />
      </>
    );

  const players: Players = { a: plan.a, b: plan.b };
  const nameA = displayName(t, players, "a");
  const nameB = displayName(t, players, "b");

  if (phase === "pickA" || phase === "pickB") {
    const who = phase === "pickA" ? "A" : "B";
    return (
      <DateWizard
        key={phase}
        player={who === "A" ? nameA : nameB}
        onDone={(picks, msg) => {
          if (who === "A") {
            setPlan({ ...plan, picksA: picks, msgA: msg });
            setPhase(mode === "local" ? "passB" : "share");
          } else {
            setPlan({ ...plan, picksB: picks, msgB: msg });
            setPhase("result");
          }
        }}
      />
    );
  }
  if (phase === "passB")
    return <PassDevice to={nameB} onReady={() => setPhase("pickB")} message={t("{name} made their picks. Your turn to dream — no peeking!", { name: nameA })} />;
  if (phase === "share")
    return (
      <section className="cg-card">
        <h1>{t("Send your dream date to {name}", { name: nameB })}</h1>
        <p>{t("They’ll make their own picks, then see your combined date.")}</p>
        <ShareChallenge
          gameId={GAME}
          schema={dateShareSchema}
          data={plan}
          text={t("I planned our dream date on HeartPop 🌙 Add your picks and see what we’d do together!")}
          filename="our-dream-date.json"
        />
        <button className="text-button" onClick={restart}>
          <RotateCcw size={16} /> {t("Start over")}
        </button>
      </section>
    );

  return <DateResult t={t} plan={plan} nameA={nameA} nameB={nameB} onChange={setPlan} onRestart={restart} />;
}

function DateWizard({ player, onDone }: { player: string; onDone: (picks: number[], message: string) => void }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<number[]>(EMPTY_PICKS);
  const [message, setMessage] = useState("");
  const total = DATE_STEPS.length + 1;
  const step = DATE_STEPS[index];
  return (
    <section className="cg-card cg-date" aria-labelledby="date-step">
      <span className="cg-progress-label">
        {t("{name} · step {n} of {total}", { name: player, n: index + 1, total })}
      </span>
      <ProgressBar value={index} max={total} label={t("Dream date steps")} />
      {step ? (
        <>
          <h1 id="date-step">{t(step.title)}</h1>
          <div className="cg-option-grid" role="group" aria-label={t(step.title)}>
            {step.options.map(([label, emoji], i) => (
              <button
                key={label}
                className="cg-option"
                aria-pressed={picks[index] === i}
                onClick={() => {
                  const next = [...picks];
                  next[index] = i;
                  setPicks(next);
                  setIndex(index + 1);
                }}
              >
                <span className="cg-option-emoji" aria-hidden="true">
                  {emoji}
                </span>
                {t(label)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 id="date-step">{t("Your final romantic message")}</h1>
          <label>
            {t("A line for your invitation")} <small>({t("optional")})</small>
            <textarea
              value={message}
              maxLength={200}
              rows={3}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("e.g. Can’t wait to hold your hand under the stars.")}
            />
          </label>
          <button className="button" onClick={() => onDone(picks, message.trim())}>
            {t("Save my dream date")}
          </button>
        </>
      )}
      <div className="cg-row">
        {index > 0 && (
          <button className="text-button" onClick={() => setIndex(index - 1)}>
            <ArrowLeft size={16} /> {t("Back")}
          </button>
        )}
        {step && (
          <button className="text-button" onClick={() => setIndex(index + 1)}>
            {t(picks[index] >= 0 ? "Next" : "Skip this one")} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}

function DateResult({
  t,
  plan,
  nameA,
  nameB,
  onChange,
  onRestart,
}: {
  t: T;
  plan: DateShare;
  nameA: string;
  nameB: string;
  onChange: (plan: DateShare) => void;
  onRestart: () => void;
}) {
  const merged = mergeDreamDate(
    DATE_STEPS.map((s) => s.id),
    toRecord(plan.picksA),
    toRecord(plan.picksB ?? EMPTY_PICKS),
  );
  const emojiFor = (stepIndex: number, label: string) =>
    DATE_STEPS[stepIndex].options.find(([l]) => l === label)?.[1] ?? "";
  const shared = merged.filter((m) => m.shared);
  const location = merged[0].chosen;
  const when = plan.when ? new Date(plan.when).toLocaleString(undefined, { dateStyle: "medium", ...(plan.when.includes("T") ? { timeStyle: "short" } : {}) }) : "";
  const theme = location ? t("A {place} date", { place: t(location) }) : t("Our dream date");
  const lines = merged.filter((m) => m.chosen).map((m) => `${emojiFor(DATE_STEPS.findIndex((s) => s.id === m.step), m.chosen)} ${t(m.chosen)}`);
  return (
    <section className="cg-date-result" aria-labelledby="date-result">
      <div className="cg-card cg-result">
        <Celebration />
        <span className="eyebrow">{t("YOUR COMBINED DREAM DATE")}</span>
        <h1 id="date-result">{theme} 🌙</h1>
        <p>{t("You matched on {n} of {total} choices.", { n: shared.length, total: DATE_STEPS.length })}</p>
      </div>
      <ol className="cg-compare">
        {merged.map((m, i) => (
          <li key={m.step} className={m.shared ? "match" : "differ"}>
            <p className="cg-compare-q">{t(DATE_STEPS[i].title)}</p>
            <div className="cg-compare-answers">
              <span>
                <small>{nameA}</small> {m.a ? t(m.a) : "—"}
              </span>
              <span>
                <small>{nameB}</small> {m.b ? t(m.b) : "—"}
              </span>
              <span className="cg-tag">
                {m.shared
                  ? `✓ ${t("Shared")}`
                  : m.chosen
                    ? t("Plan: {choice} ({who}’s pick)", { choice: t(m.chosen), who: m.chosenBy === "A" ? nameA : nameB })
                    : t("Skipped")}
              </span>
            </div>
          </li>
        ))}
      </ol>
      <p className="field-meta">{t("When your picks differ, you take turns deciding: {a} picks first, then {b}, and so on.", { a: nameA, b: nameB })}</p>
      <div className="cg-card cg-invite" aria-labelledby="date-invite">
        <span className="eyebrow">{t("YOU’RE INVITED")}</span>
        <h2 id="date-invite">
          {nameA} & {nameB}
        </h2>
        <p className="cg-big-text">{theme}</p>
        <ul className="cg-invite-list">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {when && <p>📅 {when}</p>}
        {plan.msgA && <p className="cg-quote">“{plan.msgA}” — {nameA}</p>}
        {plan.msgB && <p className="cg-quote">“{plan.msgB}” — {nameB}</p>}
        <label>
          {t("Pick a date and time")} <small>({t("optional")})</small>
          <input
            type="datetime-local"
            value={plan.when ?? ""}
            onChange={(e) => onChange({ ...plan, when: e.target.value.slice(0, 16) || undefined })}
          />
        </label>
      </div>
      <div className="cg-card">
        <h2>{t("Keep or share your invitation")}</h2>
        <button
          className="button secondary small"
          onClick={() =>
            void downloadResultCard(
              [
                { text: t("YOU’RE INVITED"), size: 30, color: "#a3657b" },
                { text: `${nameA} & ${nameB}`, size: 56, weight: 800 },
                { text: `${theme} 🌙`, size: 44, color: "#ca3f6c", gap: 30 },
                ...lines.map((text) => ({ text, size: 34, weight: 400 as const, gap: 4 })),
                ...(when ? [{ text: `📅 ${when}`, size: 34, gap: 24 }] : []),
                ...(plan.msgA ? [{ text: `“${plan.msgA}” — ${nameA}`, size: 30, weight: 400 as const }] : []),
                ...(plan.msgB ? [{ text: `“${plan.msgB}” — ${nameB}`, size: 30, weight: 400 as const }] : []),
              ],
              "dream-date-invitation.png",
            )
          }
        >
          <Download size={16} /> {t("Download invitation")}
        </button>
        <ShareChallenge
          gameId={GAME}
          schema={dateShareSchema}
          data={plan}
          heading="Send the invitation"
          text={t("Our dream date is planned 🌙 Open our invitation:")}
          filename="dream-date-invitation.json"
        />
      </div>
      <div className="cg-row center">
        <button className="button" onClick={onRestart}>
          <RotateCcw size={18} /> {t("Plan another date")}
        </button>
        <Link className="button secondary" to="/couple-games">
          {t("More couple games")}
        </Link>
      </div>
    </section>
  );
}

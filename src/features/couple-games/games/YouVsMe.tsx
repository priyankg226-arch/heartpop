import { useState } from "react";
import { z } from "zod";
import { Download, RotateCcw } from "lucide-react";
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
  StepHeading,
  useSharedChallenge,
} from "../components/GameShell";
import { ShareButtons, appLink } from "../../../components/ShareButtons";
import { YVM_CATEGORIES, YVM_OPTIONS } from "../data/content";
import { compareYouVsMe, shuffle, youVsMeTitle, type YvmAnswer, type YvmNormalized } from "../lib/gameLogic";
import type { Players } from "../lib/progress";
import { downloadResultCard } from "../lib/resultExport";
import { nameField } from "../lib/shareCodec";
import { usePhaseUrl, useStep } from "../lib/useStep";
import { useT, type T } from "../lib/useT";

const GAME = "you-vs-me" as const;
const COUNTS = [5, 10, 15];
const answerSchema = z.enum(["me", "partner", "both", "neither"]);
export const yvmShareSchema = z
  .object({
    a: nameField,
    b: nameField,
    category: z.enum(["everyday", "romance", "fun"]),
    q: z.array(z.number().int().min(0).max(14)).min(1).max(15),
    answers: z.array(answerSchema).min(1).max(15),
  })
  .strict()
  .refine((d) => d.q.length === d.answers.length && new Set(d.q).size === d.q.length, "Mismatched answers");
type YvmShare = z.infer<typeof yvmShareSchema>;

type Phase = "intro" | "answerA" | "share" | "passB" | "answerB" | "reveal";
interface Round {
  players: Players;
  category: keyof typeof YVM_CATEGORIES;
  q: number[];
  a: YvmAnswer[];
  b: YvmAnswer[];
  fromLink: boolean;
}

export default function YouVsMe() {
  const t = useT();
  const { token, go } = useStep(GAME);
  const shared = useSharedChallenge(GAME, yvmShareSchema, token);
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<"local" | "shareable">("local");
  const [category, setCategory] = useState<keyof typeof YVM_CATEGORIES>("everyday");
  const [count, setCount] = useState(5);
  const [round, setRound] = useState<Round | null>(null);
  const [imported, setImported] = useState<YvmShare | null>(null);
  usePhaseUrl(GAME, phase, (p) =>
    token && !imported ? null : p === "intro" ? "" : p === "reveal" ? "result" : "play",
  );

  const challenge = imported ?? (shared.status === "ok" ? shared.data! : null);
  const reset = () => {
    setRound(null);
    setImported(null);
    setPhase("intro");
    if (token) go("");
  };

  if (token && shared.status === "loading") return <LoadingCard />;
  if (token && shared.status === "error" && !imported) return <InvalidChallenge gameId={GAME} error={shared.error} />;

  // Recipient landing for a shared challenge.
  if (challenge && phase === "intro") {
    const from = challenge.a || t("Your partner");
    return (
      <section className="cg-card cg-center" aria-labelledby="yvm-challenge">
        <span className="eyebrow">{t("YOU’VE BEEN CHALLENGED")}</span>
        <h1 id="yvm-challenge">{t("{name} answered {n} You vs Me questions", { name: from, n: challenge.q.length })}</h1>
        <p>{t("Answer them yourself without peeking — then see where you agree.")}</p>
        <p className="field-meta">
          {t("Their answers are inside this link. Play fair and don’t inspect it first!")}
        </p>
        <button
          className="button"
          onClick={() => {
            setRound({
              players: { a: challenge.a, b: challenge.b },
              category: challenge.category,
              q: challenge.q,
              a: challenge.answers,
              b: [],
              fromLink: true,
            });
            setPhase("answerB");
          }}
        >
          {t("Start answering")}
        </button>
      </section>
    );
  }

  if (phase === "intro" || !round)
    return (
      <>
        <GameIntro
          gameId={GAME}
          onStart={({ mode: chosen, players }) => {
            setMode(chosen);
            const q = shuffle(YVM_CATEGORIES[category].questions.map((_, i) => i)).slice(0, count);
            setRound({ players, category, q, a: [], b: [], fromLink: false });
            setPhase("answerA");
          }}
        >
          <fieldset>
            <legend>{t("Category")}</legend>
            <div className="chips">
              {Object.entries(YVM_CATEGORIES).map(([id, c]) => (
                <button type="button" key={id} className="chip" aria-pressed={category === id} onClick={() => setCategory(id as keyof typeof YVM_CATEGORIES)}>
                  {t(c.label)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{t("Number of questions")}</legend>
            <div className="chips">
              {COUNTS.map((n) => (
                <button type="button" key={n} className="chip" aria-pressed={count === n} onClick={() => setCount(n)}>
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
        </GameIntro>
        <ImportChallenge gameId={GAME} schema={yvmShareSchema} onImport={(d) => setImported(d)} />
      </>
    );

  const questions = round.q.map((i) => YVM_CATEGORIES[round.category].questions[i]);
  const nameA = displayName(t, round.players, "a");
  const nameB = displayName(t, round.players, "b");

  if (phase === "answerA" || phase === "answerB") {
    const who = phase === "answerA" ? "a" : "b";
    return (
      <AnswerSheet
        key={phase}
        player={who === "a" ? nameA : nameB}
        partner={who === "a" ? nameB : nameA}
        questions={questions}
        onDone={(answers) => {
          const next = { ...round, [who]: answers };
          setRound(next);
          if (who === "a") setPhase(mode === "local" ? "passB" : "share");
          else setPhase("reveal");
        }}
      />
    );
  }
  if (phase === "passB")
    return <PassDevice to={nameB} onReady={() => setPhase("answerB")} message={t("{name} is done answering. Your turn — no peeking at their answers!", { name: nameA })} />;
  if (phase === "share")
    return (
      <section className="cg-card" aria-labelledby="yvm-share">
        <StepHeading>{t("Send your answers to {name}", { name: nameB })}</StepHeading>
        <p>{t("They’ll answer the same questions on their phone and see how you compare.")}</p>
        <ShareChallenge
          gameId={GAME}
          schema={yvmShareSchema}
          data={{ a: round.players.a, b: round.players.b, category: round.category, q: round.q, answers: round.a }}
          text={t("{name} challenged you to You vs Me on HeartPop ⚡ Who says sorry first?", { name: nameA })}
          filename="you-vs-me-challenge.json"
        />
        <button className="text-button" onClick={reset}>
          <RotateCcw size={16} /> {t("Start over")}
        </button>
      </section>
    );

  return <Reveal t={t} round={round} questions={questions} nameA={nameA} nameB={nameB} onReplay={reset} />;
}

function AnswerSheet({
  player,
  partner,
  questions,
  onDone,
}: {
  player: string;
  partner: string;
  questions: string[];
  onDone: (answers: YvmAnswer[]) => void;
}) {
  const t = useT();
  const [answers, setAnswers] = useState<YvmAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const question = questions[index];
  return (
    <section className="cg-card cg-yvm" aria-labelledby="yvm-q">
      <span className="cg-progress-label">
        {t("{name}, question {n} of {total}", { name: player, n: index + 1, total: questions.length })}
      </span>
      <ProgressBar value={index} max={questions.length} label={t("Questions answered")} />
      <h1 id="yvm-q" className="cg-question-title">
        {t(question)}
      </h1>
      <p className="field-meta">{t("Answer privately. “My partner” means {partner}.", { partner })}</p>
      <div className="cg-answer-grid" role="group" aria-label={t("Your answer")}>
        {YVM_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            className="cg-answer"
            aria-pressed={answers[index] === value}
            onClick={() => {
              const next = [...answers];
              next[index] = value;
              setAnswers(next);
              if (index + 1 < questions.length) setIndex(index + 1);
              else onDone(next);
            }}
          >
            {value === "me" ? `🙋 ${t(label)}` : value === "partner" ? `👉 ${t(label)}` : value === "both" ? `🤝 ${t(label)}` : `🙅 ${t(label)}`}
          </button>
        ))}
      </div>
      {index > 0 && (
        <button className="text-button" onClick={() => setIndex(index - 1)}>
          {t("Back to the previous question")}
        </button>
      )}
    </section>
  );
}

function Reveal({
  t,
  round,
  questions,
  nameA,
  nameB,
  onReplay,
}: {
  t: T;
  round: Round;
  questions: string[];
  nameA: string;
  nameB: string;
  onReplay: () => void;
}) {
  const result = compareYouVsMe(round.a, round.b);
  const [consent, setConsent] = useState({ a: false, b: false });
  const [hideNames, setHideNames] = useState(false);
  const shareA = hideNames ? t("Partner A") : nameA;
  const shareB = hideNames ? t("Partner B") : nameB;
  const who = (n: YvmNormalized, a = nameA, b = nameB) =>
    n === "A" ? a : n === "B" ? b : n === "both" ? t("Both of us") : t("Neither");
  const title = youVsMeTitle(result.agreement);
  const summary = t("{a} & {b} agreed on {pct}% of You vs Me questions: “{title}” ⚡", {
    a: shareA,
    b: shareB,
    pct: result.agreement,
    title: t(title),
  });
  const canShare = consent.a && consent.b;
  return (
    <section className="cg-yvm-result" aria-labelledby="yvm-result">
      <div className="cg-card cg-result">
        <Celebration show={result.agreement >= 50} />
        <span className="eyebrow">{t("THE BIG REVEAL")}</span>
        <h1 id="yvm-result">{t(title)}</h1>
        <p className="cg-score-big">
          {result.agreement}% <small>{t("agreement")}</small>
        </p>
        <p>
          {t("{matches} of {total} answers matched.", { matches: result.matches, total: result.rows.length })}{" "}
          {t("Just for fun — not a compatibility test!")}
        </p>
      </div>
      <ol className="cg-compare">
        {result.rows.map((row, i) => (
          <li key={i} className={row.match ? "match" : "differ"}>
            <p className="cg-compare-q">{t(questions[i])}</p>
            <div className="cg-compare-answers">
              <span>
                <small>{t("{name} said", { name: nameA })}</small> {who(row.a)}
              </span>
              <span>
                <small>{t("{name} said", { name: nameB })}</small> {who(row.b)}
              </span>
              <span className="cg-tag">{row.match ? `✓ ${t("Match")}` : `≠ ${t("Different")}`}</span>
            </div>
          </li>
        ))}
      </ol>
      {result.matches < result.rows.length && (
        <div className="cg-card">
          <h2>{t("Talk about it")}</h2>
          <p>{t("Pick one answer you disagreed on. Each of you explain your choice — the funnier, the better.")}</p>
        </div>
      )}
      <div className="cg-card">
        <h2>{t("Share your result")}</h2>
        <p className="field-meta">{t("Share only if you both agree.")}</p>
        <label className="cg-check">
          <input type="checkbox" checked={consent.a} onChange={(e) => setConsent({ ...consent, a: e.target.checked })} />
          {t("{name} is happy to share this result", { name: nameA })}
        </label>
        <label className="cg-check">
          <input type="checkbox" checked={consent.b} onChange={(e) => setConsent({ ...consent, b: e.target.checked })} />
          {t("{name} is happy to share this result", { name: nameB })}
        </label>
        <label className="cg-check">
          <input type="checkbox" checked={hideNames} onChange={(e) => setHideNames(e.target.checked)} />
          {t("Remove our names before sharing")}
        </label>
        {canShare ? (
          <>
            <ShareButtons heading="Share the result" url={appLink(`/couple-games/${GAME}`)} text={summary} />
            <button
              className="button secondary small"
              onClick={() =>
                void downloadResultCard(
                  [
                    { text: "You vs Me ⚡", size: 36, color: "#a3657b" },
                    { text: `${shareA} & ${shareB}`, size: 52, weight: 800 },
                    { text: `${result.agreement}% ${t("agreement")}`, size: 72, weight: 800, color: "#ca3f6c" },
                    { text: t(title), size: 44 },
                    { text: t("{matches} of {total} answers matched.", { matches: result.matches, total: result.rows.length }), size: 32, weight: 400 },
                  ],
                  "you-vs-me-result.png",
                )
              }
            >
              <Download size={16} /> {t("Download result card")}
            </button>
          </>
        ) : (
          <p className="cg-notice">{t("Tick both boxes to unlock sharing.")}</p>
        )}
      </div>
      <div className="cg-row center">
        <button className="button" onClick={onReplay}>
          <RotateCcw size={18} /> {t("Play again")}
        </button>
        <Link className="button secondary" to="/couple-games">
          {t("More couple games")}
        </Link>
      </div>
    </section>
  );
}

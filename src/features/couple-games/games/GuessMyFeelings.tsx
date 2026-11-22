import { useState } from "react";
import { z } from "zod";
import { RotateCcw, ShieldCheck, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Celebration,
  displayName,
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
import { AFFECTION_RESPONSES, CLUE_EMOJIS, CONVERSATION_PROMPTS, FEELING_EMOJI } from "../data/content";
import { FEELINGS, feelingScore } from "../lib/gameLogic";
import type { Players } from "../lib/progress";
import { randomIndex } from "../../../lib/share";
import { nameField } from "../lib/shareCodec";
import { usePhaseUrl, useStep } from "../lib/useStep";
import { useT } from "../lib/useT";

const GAME = "guess-my-feelings" as const;
export const feelingsShareSchema = z
  .object({
    from: nameField,
    to: nameField,
    feeling: z.string().trim().min(1).max(40),
    emojis: z.array(z.string().refine((e) => CLUE_EMOJIS.includes(e))).min(2).max(5),
    hint: z.string().trim().max(120),
  })
  .strict();
type Clue = z.infer<typeof feelingsShareSchema>;
type Phase = "intro" | "pick" | "share" | "pass" | "guess" | "reveal" | "summary";
interface RoundResult {
  feeling: string;
  guess: string;
  points: number;
  guesser: "a" | "b";
}

export default function GuessMyFeelings() {
  const t = useT();
  const { token, go } = useStep(GAME);
  const shared = useSharedChallenge(GAME, feelingsShareSchema, token);
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<"local" | "shareable">("local");
  const [players, setPlayers] = useState<Players>({ a: "", b: "" });
  const [sharer, setSharer] = useState<"a" | "b">("a");
  const [clue, setClue] = useState<Clue | null>(null);
  const [guess, setGuess] = useState("");
  const [results, setResults] = useState<RoundResult[]>([]);
  const [fromLink, setFromLink] = useState(false);
  usePhaseUrl(GAME, phase, (p) =>
    token && fromLink ? null : p === "intro" ? "" : p === "reveal" || p === "summary" ? "result" : "play",
  );

  const guesser = sharer === "a" ? "b" : "a";
  const name = (who: "a" | "b") => displayName(t, players, who);
  const openChallenge = (data: Clue) => {
    setPlayers({ a: data.from, b: data.to });
    setSharer("a");
    setClue(data);
    setFromLink(true);
    setPhase("guess");
  };
  const restart = () => {
    setResults([]);
    setClue(null);
    setFromLink(false);
    setPhase("intro");
    if (token) go("");
  };

  if (token && !fromLink) {
    if (shared.status === "loading") return <LoadingCard />;
    if (shared.status === "error") return <InvalidChallenge gameId={GAME} error={shared.error} />;
    if (shared.status === "ok")
      return (
        <section className="cg-card cg-center">
          <span className="eyebrow">{t("A FEELING WAS SENT TO YOU")}</span>
          <h1>{t("{name} wants you to guess how they feel", { name: shared.data!.from || t("Your partner") })}</h1>
          <p className="cg-emoji-row" aria-label={t("Emoji clues")}>
            {shared.data!.emojis.join(" ")}
          </p>
          <button className="button" onClick={() => openChallenge(shared.data!)}>
            {t("Make my guess")}
          </button>
        </section>
      );
  }

  if (phase === "intro")
    return (
      <>
        <GameIntro
          gameId={GAME}
          extraNote={
            <p className="cg-notice">
              <ShieldCheck size={16} /> {t("Sharing feelings is always optional. Skip anything that feels too personal. A wrong guess never means someone doesn’t care.")}
            </p>
          }
          onStart={({ mode: m, players: p }) => {
            setMode(m);
            setPlayers(p);
            setSharer("a");
            setPhase("pick");
          }}
        />
        <ImportChallenge gameId={GAME} schema={feelingsShareSchema} onImport={openChallenge} />
      </>
    );

  if (phase === "pick")
    return (
      <PickFeeling
        sharer={name(sharer)}
        onSkip={() => (results.length ? setPhase("summary") : restart())}
        onDone={(c) => {
          const data = { ...c, from: players[sharer], to: players[guesser] };
          setClue(data);
          setGuess("");
          setPhase(mode === "local" ? "pass" : "share");
        }}
      />
    );
  if (phase === "pass")
    return <PassDevice to={name(guesser)} onReady={() => setPhase("guess")} readyLabel="Show me the clues" />;
  if (phase === "share" && clue)
    return (
      <section className="cg-card">
        <StepHeading>{t("Send your feeling to {name}", { name: name(guesser) })}</StepHeading>
        <p className="cg-emoji-row">{clue.emojis.join(" ")}</p>
        <ShareChallenge
          gameId={GAME}
          schema={feelingsShareSchema}
          data={clue}
          text={t("Can you guess how I’m feeling? {emojis} 🥺", { emojis: clue.emojis.join("") })}
          filename="guess-my-feelings.json"
        />
        <button className="text-button" onClick={restart}>
          <RotateCcw size={16} /> {t("Start over")}
        </button>
      </section>
    );

  if (phase === "guess" && clue)
    return (
      <section className="cg-card cg-feelings" aria-labelledby="gmf-guess">
        <StepHeading>
          <span id="gmf-guess">{t("{name}, how is {partner} feeling?", { name: name(guesser), partner: name(sharer) })}</span>
        </StepHeading>
        <p className="cg-emoji-row big" aria-label={t("Emoji clues: {emojis}", { emojis: clue.emojis.join(" ") })}>
          {clue.emojis.join(" ")}
        </p>
        {clue.hint && (
          <p className="cg-hint">
            <strong>{t("Hint")}:</strong> {clue.hint}
          </p>
        )}
        <div className="cg-feeling-grid" role="group" aria-label={t("Choose a feeling")}>
          {FEELINGS.map((f) => (
            <button key={f} className="cg-answer" aria-pressed={guess === f} onClick={() => setGuess(f)}>
              <span aria-hidden="true">{FEELING_EMOJI[f]}</span> {t(f)}
            </button>
          ))}
        </div>
        <label>
          {t("Or type a different feeling")}
          <input
            value={FEELINGS.includes(guess as (typeof FEELINGS)[number]) ? "" : guess}
            maxLength={40}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={t("e.g. cozy")}
          />
        </label>
        <div className="cg-row">
          <button
            className="button"
            disabled={!guess.trim()}
            onClick={() => {
              const { points } = feelingScore(clue.feeling, guess);
              setResults([...results, { feeling: clue.feeling, guess: guess.trim(), points, guesser }]);
              setPhase("reveal");
            }}
          >
            {t("Reveal the feeling")}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setResults([...results, { feeling: clue.feeling, guess: "", points: 0, guesser }]);
              setPhase("reveal");
            }}
          >
            <SkipForward size={16} /> {t("Skip guessing")}
          </button>
        </div>
      </section>
    );

  if (phase === "reveal" && clue) {
    const last = results[results.length - 1];
    return (
      <Reveal
        clue={clue}
        result={last}
        sharer={name(sharer)}
        guesser={name(guesser)}
        fromLink={fromLink}
        onNext={() => {
          setSharer(guesser);
          setClue(null);
          setPhase("pick");
        }}
        onFinish={() => setPhase("summary")}
        onRestart={restart}
      />
    );
  }

  const total = (who: "a" | "b") => results.filter((r) => r.guesser === who).reduce((s, r) => s + r.points, 0);
  return (
    <section className="cg-card cg-result" aria-labelledby="gmf-summary">
      <Celebration show={results.some((r) => r.points > 0)} />
      <h1 id="gmf-summary">{t("Thank you for sharing your hearts 💗")}</h1>
      <div className="cg-stats">
        <ScoreLine label={t("Feelings shared")} value={results.length} />
        <ScoreLine label={name("a")} value={total("a")} />
        <ScoreLine label={name("b")} value={total("b")} />
      </div>
      <ul className="cg-list">
        {results.map((r, i) => (
          <li key={i}>
            {FEELING_EMOJI[r.feeling] ?? "💭"} {t(r.feeling)} — {r.guess ? t("guessed “{guess}”", { guess: t(r.guess) }) : t("skipped")} ({r.points})
          </li>
        ))}
      </ul>
      <div className="cg-row center">
        <button className="button" onClick={restart}>
          <RotateCcw size={18} /> {t("Play again")}
        </button>
        <Link className="button secondary" to="/couple-games">
          {t("More couple games")}
        </Link>
      </div>
    </section>
  );
}

function PickFeeling({
  sharer,
  onDone,
  onSkip,
}: {
  sharer: string;
  onDone: (clue: { feeling: string; emojis: string[]; hint: string }) => void;
  onSkip: () => void;
}) {
  const t = useT();
  const [feeling, setFeeling] = useState("");
  const [custom, setCustom] = useState("");
  const [emojis, setEmojis] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const chosen = custom.trim() || feeling;
  const toggleEmoji = (e: string) =>
    setEmojis(emojis.includes(e) ? emojis.filter((x) => x !== e) : emojis.length < 5 ? [...emojis, e] : emojis);
  return (
    <section className="cg-card cg-feelings" aria-labelledby="gmf-pick">
      <StepHeading step={1} total={2}>
        <span id="gmf-pick">{t("{name}, how are you feeling?", { name: sharer })}</span>
      </StepHeading>
      <p className="field-meta">{t("Only you can see this screen. Your partner will see just the emojis and hint.")}</p>
      <div className="cg-feeling-grid" role="group" aria-label={t("Choose a feeling")}>
        {FEELINGS.map((f) => (
          <button
            key={f}
            className="cg-answer"
            aria-pressed={!custom.trim() && feeling === f}
            onClick={() => {
              setFeeling(f);
              setCustom("");
            }}
          >
            <span aria-hidden="true">{FEELING_EMOJI[f]}</span> {t(f)}
          </button>
        ))}
      </div>
      <label>
        {t("Or name your own feeling")}
        <input value={custom} maxLength={40} onChange={(e) => setCustom(e.target.value)} placeholder={t("e.g. cozy")} />
      </label>
      <fieldset>
        <legend>
          {t("Pick 2–5 emoji clues")} <small>({emojis.length}/5)</small>
        </legend>
        <div className="cg-emoji-picker">
          {CLUE_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="cg-emoji"
              aria-pressed={emojis.includes(e)}
              disabled={!emojis.includes(e) && emojis.length >= 5}
              onClick={() => toggleEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
        <p className="cg-emoji-row" aria-live="polite">
          {emojis.join(" ") || t("No emojis chosen yet")}
        </p>
      </fieldset>
      <label>
        {t("A short hint")} <small>({t("optional")})</small>
        <input value={hint} maxLength={120} onChange={(e) => setHint(e.target.value)} placeholder={t("e.g. It’s about work")} />
      </label>
      <div className="cg-row">
        <button
          className="button"
          disabled={!chosen || emojis.length < 2}
          onClick={() => onDone({ feeling: chosen, emojis, hint: hint.trim() })}
        >
          {t("Lock in my feeling")}
        </button>
        <button className="button secondary" onClick={onSkip}>
          {t("Not today — skip")}
        </button>
      </div>
      {chosen && emojis.length < 2 && <p className="field-meta">{t("Choose at least 2 emojis.")}</p>}
    </section>
  );
}

function Reveal({
  clue,
  result,
  sharer,
  guesser,
  fromLink,
  onNext,
  onFinish,
  onRestart,
}: {
  clue: Clue;
  result: RoundResult;
  sharer: string;
  guesser: string;
  fromLink: boolean;
  onNext: () => void;
  onFinish: () => void;
  onRestart: () => void;
}) {
  const t = useT();
  const [prompt] = useState(() => CONVERSATION_PROMPTS[randomIndex(CONVERSATION_PROMPTS.length)]);
  const [response, setResponse] = useState("");
  const verdict = result.guess ? feelingScore(clue.feeling, result.guess).verdict : "skipped";
  return (
    <section className="cg-card cg-result" aria-labelledby="gmf-reveal" aria-live="polite">
      <Celebration show={verdict === "exact"} />
      <span className="eyebrow">{t("THE FEELING WAS")}</span>
      <h1 id="gmf-reveal">
        <span aria-hidden="true">{FEELING_EMOJI[clue.feeling] ?? "💭"}</span> {t(clue.feeling)}
      </h1>
      <p className="cg-score-big">
        +{result.points} <small>{t("points")}</small>
      </p>
      <p>
        {verdict === "exact"
          ? t("{name} read you perfectly!", { name: guesser })
          : verdict === "close"
            ? t("So close! “{guess}” is a neighbour of that feeling.", { guess: t(result.guess) })
            : verdict === "skipped"
              ? t("Skipped — and that’s completely okay.")
              : t("Feelings can be tricky to read. That’s what talking is for 💬")}
      </p>
      <div className="cg-card inset">
        <span className="eyebrow">{t("A LITTLE CONVERSATION STARTER")}</span>
        <p className="cg-big-text">{t(prompt)}</p>
      </div>
      <fieldset>
        <legend>
          {t("{name}, send {partner} a little response", { name: guesser, partner: sharer })} <small>({t("optional")})</small>
        </legend>
        <div className="chips">
          {AFFECTION_RESPONSES.map((r) => (
            <button key={r} className="chip" aria-pressed={response === r} onClick={() => setResponse(r)}>
              {t(r)}
            </button>
          ))}
        </div>
        {response && <p className="cg-big-text">{t(response)}</p>}
      </fieldset>
      <div className="cg-row center">
        {fromLink ? (
          <button className="button" onClick={onRestart}>
            {t("Send a feeling back")}
          </button>
        ) : (
          <>
            <button className="button" onClick={onNext}>
              {t("Swap — {name} shares next", { name: guesser })}
            </button>
            <button className="button secondary" onClick={onFinish}>
              {t("Finish")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

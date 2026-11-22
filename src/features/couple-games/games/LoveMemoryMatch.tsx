import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Check, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Celebration,
  displayName,
  GameIntro,
  ScoreLine,
  type StartOptions,
} from "../components/GameShell";
import { MEMORY_QUESTIONS, MEMORY_THEMES } from "../data/content";
import {
  buildDeck,
  MEMORY_PAIRS,
  memoryScore,
  shuffle,
  type MemoryCard,
  type MemoryDifficulty,
} from "../lib/gameLogic";
import { newSessionId, playersSchema, useGameSession, type Players } from "../lib/progress";
import { formatTime, useGameTimer } from "../lib/useGameTimer";
import { usePhaseUrl } from "../lib/useStep";
import { useT } from "../lib/useT";

const GAME = "love-memory-match" as const;

const stateSchema = z.object({
  phase: z.enum(["play", "result"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  theme: z.string().max(20),
  twoPlayer: z.boolean(),
  extraTurn: z.boolean(),
  deck: z.array(z.object({ id: z.number().int(), pair: z.number().int(), symbol: z.string().max(16) })).max(24),
  matchedBy: z.record(z.string(), z.enum(["a", "b"])),
  attempts: z.number().int().min(0),
  turn: z.enum(["a", "b"]),
  seconds: z.number().int().min(0),
  questions: z.array(z.string()).max(14),
  players: playersSchema,
  sessionId: z.string(),
  createdAt: z.number(),
});
type MatchState = z.infer<typeof stateSchema>;

export default function LoveMemoryMatch() {
  const t = useT();
  const session = useGameSession(GAME, stateSchema);
  const [game, setGame] = useState<MatchState | null>(null);
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>("easy");
  const [theme, setTheme] = useState("hearts");
  const [twoPlayer, setTwoPlayer] = useState(false);
  const [extraTurn, setExtraTurn] = useState(true);
  usePhaseUrl(GAME, game?.phase ?? "intro", (p) => (p === "intro" ? "" : p));

  const start = ({ players }: StartOptions) => {
    const pairs = MEMORY_PAIRS[difficulty];
    setGame({
      phase: "play",
      difficulty,
      theme,
      twoPlayer,
      extraTurn,
      deck: buildDeck(pairs, MEMORY_THEMES[theme].symbols.map(([s]) => s)),
      matchedBy: {},
      attempts: 0,
      turn: "a",
      seconds: 0,
      questions: shuffle(MEMORY_QUESTIONS).slice(0, pairs),
      players,
      sessionId: newSessionId(),
      createdAt: Date.now(),
    });
  };

  if (!game)
    return (
      <GameIntro
        gameId={GAME}
        modes={["local"]}
        onStart={start}
        resume={
          session.saved
            ? {
                onResume: () => setGame(session.saved!.state),
                onDiscard: () => void session.discard(),
              }
            : null
        }
      >
        <fieldset>
          <legend>{t("Difficulty")}</legend>
          <div className="chips">
            {(Object.keys(MEMORY_PAIRS) as MemoryDifficulty[]).map((d) => (
              <button type="button" key={d} className="chip" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
                {t(d === "easy" ? "Easy" : d === "medium" ? "Medium" : "Hard")} · {t("{n} pairs", { n: MEMORY_PAIRS[d] })}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("Card theme")}</legend>
          <div className="chips">
            {Object.entries(MEMORY_THEMES).map(([id, th]) => (
              <button type="button" key={id} className="chip" aria-pressed={theme === id} onClick={() => setTheme(id)}>
                <span aria-hidden="true">{th.symbols[0][0]}</span> {t(th.label)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("Players")}</legend>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={!twoPlayer} onClick={() => setTwoPlayer(false)}>
              {t("Play as a team")}
            </button>
            <button type="button" className="chip" aria-pressed={twoPlayer} onClick={() => setTwoPlayer(true)}>
              {t("Take turns & compare scores")}
            </button>
          </div>
          {twoPlayer && (
            <label className="cg-check">
              <input type="checkbox" checked={extraTurn} onChange={(e) => setExtraTurn(e.target.checked)} />
              {t("A match earns an extra turn")}
            </label>
          )}
        </fieldset>
      </GameIntro>
    );

  return (
    <MemoryBoard
      game={game}
      onChange={(next) => {
        setGame(next);
        session.save({
          id: next.sessionId,
          gameId: GAME,
          schemaVersion: 1,
          mode: "local",
          players: next.players,
          createdAt: next.createdAt,
          updatedAt: Date.now(),
          phase: next.phase,
          completed: next.phase === "result",
          state: next,
        });
      }}
      onRestart={() => {
        void session.discard();
        setGame(null);
      }}
    />
  );
}

function symbolName(theme: string, symbol: string) {
  return MEMORY_THEMES[theme]?.symbols.find(([s]) => s === symbol)?.[1] ?? symbol;
}

function MemoryBoard({
  game,
  onChange,
  onRestart,
}: {
  game: MatchState;
  onChange: (state: MatchState) => void;
  onRestart: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pairs = game.deck.length / 2;
  const matchedCount = Object.keys(game.matchedBy).length;
  const done = game.phase === "result";
  const [seconds] = useGameTimer(!done, game.seconds);
  const latest = useRef(game);
  latest.current = { ...game, seconds };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const name = (who: "a" | "b", players: Players = game.players) => displayName(t, players, who);
  const scoreFor = (who: "a" | "b") => Object.values(game.matchedBy).filter((w) => w === who).length;

  const flip = (index: number) => {
    const card = game.deck[index];
    if (locked || done || open.includes(index) || game.matchedBy[card.pair] !== undefined) return;
    const next = [...open, index];
    setOpen(next);
    setAnnouncement(t("Card {n}: {name}", { n: index + 1, name: t(symbolName(game.theme, card.symbol)) }));
    if (next.length < 2) return;
    const [first, second] = next.map((i) => game.deck[i]);
    const attempts = game.attempts + 1;
    if (first.pair === second.pair) {
      const matchedBy = { ...game.matchedBy, [first.pair]: game.turn };
      const finished = Object.keys(matchedBy).length === pairs;
      const switchTurn = game.twoPlayer && !game.extraTurn && !finished;
      onChange({
        ...latest.current,
        matchedBy,
        attempts,
        turn: switchTurn ? (game.turn === "a" ? "b" : "a") : game.turn,
        phase: finished ? "result" : "play",
      });
      setOpen([]);
      setQuestion(game.questions[Object.keys(matchedBy).length - 1] ?? null);
      setAnnouncement(
        finished
          ? t("Match! All pairs found.")
          : t("Match! {name} found a pair.", { name: t(symbolName(game.theme, first.symbol)) }),
      );
    } else {
      setLocked(true);
      onChange({ ...latest.current, attempts });
      setAnnouncement(t("Not a match. The cards will flip back."));
      timer.current = setTimeout(() => {
        setOpen([]);
        setLocked(false);
        if (game.twoPlayer) {
          const turn = latest.current.turn === "a" ? "b" : "a";
          onChange({ ...latest.current, turn });
          setAnnouncement(t("{name}’s turn", { name: name(turn) }));
        }
      }, 1100);
    }
  };

  const score = memoryScore(matchedCount, game.attempts);
  return (
    <section className="cg-memory" aria-labelledby="cg-memory-title">
      <div className="cg-play-head">
        <h1 id="cg-memory-title">{done ? t("You found every pair! 🎉") : t("Find the matching pairs")}</h1>
        <div className="cg-stats" aria-label={t("Game status")}>
          <ScoreLine label={t("Pairs")} value={`${matchedCount}/${pairs}`} />
          <ScoreLine label={t("Attempts")} value={game.attempts} />
          <ScoreLine label={t("Time")} value={formatTime(seconds)} />
          {game.twoPlayer ? (
            <>
              <ScoreLine label={name("a")} value={scoreFor("a")} />
              <ScoreLine label={name("b")} value={scoreFor("b")} />
            </>
          ) : (
            <ScoreLine label={t("Score")} value={score} />
          )}
        </div>
        {game.twoPlayer && !done && (
          <p className="cg-turn" aria-live="polite">
            {t("{name}’s turn", { name: name(game.turn) })}
          </p>
        )}
      </div>
      <div className={`cg-memory-grid pairs-${pairs}`} role="group" aria-label={t("Memory cards")}>
        {game.deck.map((card: MemoryCard, i) => {
          const matched = game.matchedBy[card.pair] !== undefined;
          const faceUp = matched || open.includes(i);
          const label = matched
            ? t("Card {n}, {name}, matched", { n: i + 1, name: t(symbolName(game.theme, card.symbol)) })
            : faceUp
              ? t("Card {n}, {name}", { n: i + 1, name: t(symbolName(game.theme, card.symbol)) })
              : t("Card {n}, face down", { n: i + 1 });
          return (
            <button
              key={card.id}
              type="button"
              className={`cg-memory-card ${faceUp ? "up" : ""} ${matched ? "matched" : ""}`}
              aria-label={label}
              aria-disabled={matched || locked || faceUp}
              onClick={() => flip(i)}
            >
              <span className="cg-memory-inner">
                <span className="cg-memory-back" aria-hidden="true">♡</span>
                <span className="cg-memory-front" aria-hidden="true">
                  {card.symbol}
                  {matched && (
                    <span className="cg-matched-mark">
                      <Check size={14} />
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {question && (
        <div className="cg-card cg-question" aria-live="polite">
          <span className="eyebrow">{t("YOU UNLOCKED A QUESTION")}</span>
          <p className="cg-big-text">{t(question)}</p>
          <button className="text-button" onClick={() => setQuestion(null)}>
            {t("We answered it ♡")}
          </button>
        </div>
      )}
      <p className="field-meta">
        {t("Score = 100 × pairs − 10 × each extra attempt (never below 0). Time is shown just for fun.")}
      </p>
      {done && (
        <div className="cg-card cg-result">
          <Celebration />
          <h2>
            {game.twoPlayer
              ? scoreFor("a") === scoreFor("b")
                ? t("It’s a tie — perfectly matched!")
                : t("{name} found the most pairs!", { name: name(scoreFor("a") > scoreFor("b") ? "a" : "b") })
              : t("Team score: {score}", { score })}
          </h2>
          <p>
            {t("{pairs} pairs in {attempts} attempts and {time}.", {
              pairs,
              attempts: game.attempts,
              time: formatTime(seconds),
            })}
          </p>
          <div className="cg-row center">
            <button className="button" onClick={onRestart}>
              <RotateCcw size={18} /> {t("Play again")}
            </button>
            <Link className="button secondary" to="/couple-games">
              {t("More couple games")}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

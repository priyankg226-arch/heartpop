import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Lightbulb, RotateCcw, Shuffle, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Celebration,
  GameIntro,
  InvalidChallenge,
  LoadingCard,
  ScoreLine,
  ShareChallenge,
  StepHeading,
  useSharedChallenge,
} from "../components/GameShell";
import { HEART_DESIGNS, PUZZLE_MESSAGES } from "../data/content";
import {
  puzzleAchievement,
  PUZZLE_SIZES,
  shuffle,
  slotAt,
  snapsInto,
  type PuzzleDifficulty,
} from "../lib/gameLogic";
import { newSessionId, useGameSession } from "../lib/progress";
import { nameField } from "../lib/shareCodec";
import { formatTime, useGameTimer } from "../lib/useGameTimer";
import { usePhaseUrl, useStep } from "../lib/useStep";
import { useT } from "../lib/useT";

const GAME = "fix-our-heart" as const;
const BOARD = 600;
const GAP = 28;
const HEART = "M300 540 C90 400 40 220 140 140 C210 85 280 120 300 190 C320 120 390 85 460 140 C560 220 510 400 300 540Z";
const designIds = HEART_DESIGNS.map((d) => d.id) as [string, ...string[]];

export const heartShareSchema = z
  .object({
    to: z.string().trim().min(1).max(30),
    from: nameField,
    design: z.enum(designIds),
    difficulty: z.enum(["easy", "medium", "hard"]),
    milestones: z.array(z.string().trim().max(120)).max(3),
    final: z.string().trim().max(300),
  })
  .strict();
type HeartChallenge = z.infer<typeof heartShareSchema>;

const stateSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  config: heartShareSchema,
  order: z.array(z.number().int().min(0).max(15)).max(16),
  placed: z.array(z.number().int().min(0).max(15)).max(16),
  moves: z.number().int().min(0),
  hints: z.number().int().min(0),
  seconds: z.number().int().min(0),
});
type PuzzleState = z.infer<typeof stateSchema>;

const newPuzzle = (config: HeartChallenge): PuzzleState => {
  const n = PUZZLE_SIZES[config.difficulty];
  const pieces = Array.from({ length: n * n }, (_, i) => i);
  let order = shuffle(pieces);
  // Avoid a tray that is already in solved order.
  if (order.every((p, i) => p === i) && order.length > 1) order = [...order.slice(1), order[0]];
  return { id: newSessionId(), createdAt: Date.now(), config, order, placed: [], moves: 0, hints: 0, seconds: 0 };
};

export default function FixOurHeart() {
  const t = useT();
  const { token, go } = useStep(GAME);
  const shared = useSharedChallenge(GAME, heartShareSchema, token);
  const session = useGameSession(GAME, stateSchema);
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [creating, setCreating] = useState(false);
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>("easy");
  const [design, setDesign] = useState(HEART_DESIGNS[0].id);
  const [config, setConfig] = useState<HeartChallenge>({ to: "", from: "", design: "rose", difficulty: "medium", milestones: ["", "", ""], final: "" });
  const [shareReady, setShareReady] = useState(false);
  const fromLink = Boolean(token);
  const done = puzzle && puzzle.placed.length === puzzle.order.length;
  usePhaseUrl(GAME, puzzle ? (done ? "result" : "play") : creating ? "create" : "", (p) => (fromLink ? null : p));

  useEffect(() => {
    if (shared.status === "ok" && !puzzle) setPuzzle(newPuzzle(shared.data!));
  }, [shared.status, shared.data, puzzle]);

  const update = (next: PuzzleState) => {
    setPuzzle(next);
    if (fromLink) return;
    session.save({
      id: next.id,
      gameId: GAME,
      schemaVersion: 1,
      mode: "local",
      players: { a: next.config.from, b: next.config.to },
      createdAt: next.createdAt,
      updatedAt: Date.now(),
      phase: "play",
      completed: next.placed.length === next.order.length,
      state: next,
    });
  };

  if (token && shared.status === "loading") return <LoadingCard />;
  if (token && shared.status === "error") return <InvalidChallenge gameId={GAME} error={shared.error} />;

  if (puzzle)
    return (
      <PuzzleBoard
        key={puzzle.id}
        puzzle={puzzle}
        onChange={update}
        onRestart={() => {
          void session.discard();
          if (fromLink) setPuzzle(newPuzzle(puzzle.config));
          else setPuzzle(null);
        }}
        onLeave={fromLink ? () => go("") : undefined}
      />
    );

  if (creating) {
    const cleaned = { ...config, milestones: config.milestones.map((m) => m.trim()).filter(Boolean) };
    const valid = heartShareSchema.safeParse(cleaned).success;
    return (
      <form
        className="cg-card cg-setup"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setShareReady(true);
        }}
      >
        <StepHeading>{t("Make a heart puzzle for someone")}</StepHeading>
        <div className="form-row">
          <label>
            {t("From")} <small>({t("optional")})</small>
            <input value={config.from} maxLength={30} onChange={(e) => setConfig({ ...config, from: e.target.value })} />
          </label>
          <label>
            {t("For")}
            <input required value={config.to} maxLength={30} onChange={(e) => setConfig({ ...config, to: e.target.value })} />
          </label>
        </div>
        <DesignPicker design={config.design} onDesign={(d) => setConfig({ ...config, design: d })} difficulty={config.difficulty} onDifficulty={(d) => setConfig({ ...config, difficulty: d })} />
        <fieldset>
          <legend>
            {t("Milestone messages")} <small>({t("shown at 25%, 50% and 75%")})</small>
          </legend>
          {config.milestones.map((m, i) => (
            <label key={i}>
              {t("Milestone {n}", { n: i + 1 })}
              <input
                value={m}
                maxLength={120}
                onChange={(e) => setConfig({ ...config, milestones: config.milestones.map((x, j) => (j === i ? e.target.value : x)) })}
                placeholder={t(PUZZLE_MESSAGES[i])}
              />
            </label>
          ))}
        </fieldset>
        <label>
          {t("Final message")}
          <textarea rows={3} maxLength={300} value={config.final} onChange={(e) => setConfig({ ...config, final: e.target.value })} placeholder={t("e.g. You fixed my heart the day we met.")} />
        </label>
        {!shareReady ? (
          <button className="button" type="submit" disabled={!valid}>
            <Wand2 size={18} /> {t("Create the puzzle link")}
          </button>
        ) : (
          <ShareChallenge
            gameId={GAME}
            schema={heartShareSchema}
            data={cleaned}
            heading="Send your heart puzzle"
            text={t("I made you a little heart puzzle 🧩 Put it back together:")}
            filename="fix-our-heart.json"
          />
        )}
        <button type="button" className="text-button" onClick={() => setCreating(false)}>
          {t("Back")}
        </button>
      </form>
    );
  }

  return (
    <GameIntro
      gameId={GAME}
      namesFor="none"
      startLabel="Start the puzzle"
      modes={["local", "shareable"]}
      resume={
        session.saved
          ? { onResume: () => setPuzzle(session.saved!.state), onDiscard: () => void session.discard() }
          : null
      }
      onStart={({ mode }) => {
        if (mode === "shareable") {
          setCreating(true);
          return;
        }
        setPuzzle(newPuzzle({ to: "", from: "", design, difficulty, milestones: [], final: "" }));
      }}
    >
      <DesignPicker design={design} onDesign={setDesign} difficulty={difficulty} onDifficulty={setDifficulty} />
      <p className="field-meta">{t("Choosing “Send a challenge link” lets you add your own messages first.")}</p>
    </GameIntro>
  );
}

function DesignPicker({
  design,
  onDesign,
  difficulty,
  onDifficulty,
}: {
  design: string;
  onDesign: (d: string) => void;
  difficulty: PuzzleDifficulty;
  onDifficulty: (d: PuzzleDifficulty) => void;
}) {
  const t = useT();
  return (
    <>
      <fieldset>
        <legend>{t("Difficulty")}</legend>
        <div className="chips">
          {(Object.keys(PUZZLE_SIZES) as PuzzleDifficulty[]).map((d) => (
            <button type="button" key={d} className="chip" aria-pressed={difficulty === d} onClick={() => onDifficulty(d)}>
              {t(d === "easy" ? "Easy" : d === "medium" ? "Medium" : "Hard")} · {t("{n} pieces", { n: PUZZLE_SIZES[d] ** 2 })}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("Heart design")}</legend>
        <div className="chips">
          {HEART_DESIGNS.map((d) => (
            <button type="button" key={d.id} className="chip" aria-pressed={design === d.id} onClick={() => onDesign(d.id)}>
              <span className="cg-dot" style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})` }} aria-hidden="true" /> {t(d.label)}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  );
}

/** The full 600×600 artwork every piece is cut from. */
function HeartArt({ design, uid }: { design: (typeof HEART_DESIGNS)[number]; uid: string }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: 40 + ((i * 137) % 520),
        y: 40 + ((i * 89) % 520),
        r: 6 + (i % 4) * 3,
      })),
    [],
  );
  return (
    <g>
      <rect width={BOARD} height={BOARD} fill={design.accent} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={design.dots} />
      ))}
      <path d={HEART} fill={`url(#${uid}-grad)`} />
      <path d="M170 210 C190 170 230 160 260 175" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="16" fill="none" strokeLinecap="round" />
      <text x="300" y="330" textAnchor="middle" fontSize="64" fill="#ffffff" fillOpacity="0.9" fontWeight="800">
        ♡
      </text>
      <text x="300" y="410" textAnchor="middle" fontSize="30" fill="#ffffff" fillOpacity="0.85" fontWeight="800">
        us
      </text>
    </g>
  );
}

function PuzzleBoard({
  puzzle,
  onChange,
  onRestart,
  onLeave,
}: {
  puzzle: PuzzleState;
  onChange: (p: PuzzleState) => void;
  onRestart: () => void;
  onLeave?: () => void;
}) {
  const t = useT();
  const uid = `cgh-${puzzle.id.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`;
  const svg = useRef<SVGSVGElement>(null);
  const { config } = puzzle;
  const n = PUZZLE_SIZES[config.difficulty];
  const total = n * n;
  const cell = BOARD / n;
  const cols = n === 2 ? 4 : n === 3 ? 5 : 6;
  const trayCell = BOARD / cols;
  const trayRows = Math.ceil(total / cols);
  const height = BOARD + GAP + trayRows * trayCell;
  const traySCale = (trayCell * 0.86) / cell;
  const design = HEART_DESIGNS.find((d) => d.id === config.design) ?? HEART_DESIGNS[0];
  const done = puzzle.placed.length === total;
  const [seconds] = useGameTimer(!done, puzzle.seconds);
  const [selected, setSelected] = useState<number | null>(null);
  const [hinted, setHinted] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ piece: number; id: number; x: number; y: number } | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const latest = useRef(puzzle);
  latest.current = { ...puzzle, seconds };

  const tray = puzzle.order.filter((p) => !puzzle.placed.includes(p));
  const trayCenter = (index: number) => ({
    x: (index % cols) * trayCell + trayCell / 2,
    y: BOARD + GAP + Math.floor(index / cols) * trayCell + trayCell / 2,
  });

  const messageFor = (count: number) => {
    if (count === total) return config.final || t("You fixed our heart. It’s whole again — just like me with you. ♡");
    const quarter = [Math.ceil(total / 4), Math.ceil(total / 2), Math.ceil((total * 3) / 4)].indexOf(count);
    if (quarter >= 0 && config.milestones[quarter]) return config.milestones[quarter];
    return t(PUZZLE_MESSAGES[(count - 1) % PUZZLE_MESSAGES.length]);
  };
  const attempt = (piece: number, slot: number) => {
    const current = latest.current;
    if (slot === piece) {
      const placed = [...current.placed, piece];
      onChange({ ...current, placed, moves: current.moves + 1 });
      setMessage(messageFor(placed.length));
      setStatus(t("Piece {p} placed. {left} to go.", { p: piece + 1, left: total - placed.length }));
      setSelected(null);
      setHinted(null);
    } else {
      onChange({ ...current, moves: current.moves + 1 });
      setStatus(t("Piece {p} doesn’t fit there. Try another spot.", { p: piece + 1 }));
    }
  };
  const toSvg = (clientX: number, clientY: number) => {
    const el = svg.current;
    const ctm = el?.getScreenCTM?.();
    if (!el || !ctm) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: point.x, y: point.y };
  };
  const giveHint = () => {
    const piece = selected ?? tray[0];
    if (piece === undefined) return;
    setSelected(piece);
    setHinted(piece);
    onChange({ ...latest.current, hints: latest.current.hints + 1 });
    setStatus(t("Hint: piece {p} belongs in row {r}, column {c}.", { p: piece + 1, r: Math.floor(piece / n) + 1, c: (piece % n) + 1 }));
  };
  const reshuffleTray = () => onChange({ ...latest.current, order: shuffle(latest.current.order) });

  const pieceGraphic = (piece: number) => (
    <g clipPath={`url(#${uid}-clip)`}>
      <g transform={`translate(${-(piece % n) * cell} ${-Math.floor(piece / n) * cell})`}>
        <use href={`#${uid}-art`} />
      </g>
      <rect width={cell} height={cell} fill="none" stroke="#ffffff" strokeWidth={3} />
    </g>
  );

  return (
    <section className="cg-puzzle" aria-labelledby="puzzle-title">
      <div className="cg-play-head">
        <h1 id="puzzle-title">
          {done ? t("Heart fixed! 💖") : config.to ? t("Fix the heart, {name}", { name: config.to }) : t("Fix our heart")}
        </h1>
        <div className="cg-stats">
          <ScoreLine label={t("Pieces")} value={`${puzzle.placed.length}/${total}`} />
          <ScoreLine label={t("Moves")} value={puzzle.moves} />
          <ScoreLine label={t("Hints")} value={puzzle.hints} />
          <ScoreLine label={t("Time")} value={formatTime(seconds)} />
        </div>
      </div>
      <div className="cg-puzzle-layout">
        <svg
          ref={svg}
          className="cg-puzzle-svg"
          viewBox={`0 0 ${BOARD} ${height}`}
          role="group"
          aria-label={t("Heart puzzle board and pieces")}
          onPointerMove={(e) => {
            if (!drag || drag.id !== e.pointerId) return;
            const p = toSvg(e.clientX, e.clientY);
            if (p) setDrag({ ...drag, ...p });
          }}
          onPointerUp={(e) => {
            if (!drag || drag.id !== e.pointerId) return;
            const p = toSvg(e.clientX, e.clientY) ?? drag;
            setDrag(null);
            if (slotAt(p.x, p.y, n, BOARD) === -1) return; // dropped back in the tray
            if (snapsInto(drag.piece, p.x, p.y, n, BOARD)) attempt(drag.piece, drag.piece);
            else attempt(drag.piece, slotAt(p.x, p.y, n, BOARD));
          }}
          onPointerCancel={() => setDrag(null)}
        >
          <defs>
            <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={design.from} />
              <stop offset="1" stopColor={design.to} />
            </linearGradient>
            <clipPath id={`${uid}-clip`}>
              <rect width={cell} height={cell} />
            </clipPath>
            <g id={`${uid}-art`}>
              <HeartArt design={design} uid={uid} />
            </g>
          </defs>
          <rect width={BOARD} height={BOARD} rx={18} className="cg-board-bg" />
          <path d={HEART} className="cg-board-ghost" />
          {Array.from({ length: total }, (_, slot) => {
            const placed = puzzle.placed.includes(slot);
            const x = (slot % n) * cell;
            const y = Math.floor(slot / n) * cell;
            return placed ? (
              <g key={slot} transform={`translate(${x} ${y})`} aria-hidden="true">
                {pieceGraphic(slot)}
              </g>
            ) : (
              <rect
                key={slot}
                x={x + 3}
                y={y + 3}
                width={cell - 6}
                height={cell - 6}
                rx={10}
                className={`cg-slot ${hinted === slot ? "hinted" : ""}`}
                role="button"
                tabIndex={selected !== null ? 0 : -1}
                aria-label={t("Empty spot, row {r}, column {c}", { r: Math.floor(slot / n) + 1, c: (slot % n) + 1 })}
                onClick={() => selected !== null && attempt(selected, slot)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && selected !== null) {
                    e.preventDefault();
                    attempt(selected, slot);
                  }
                }}
              />
            );
          })}
          {!done && <line x1={0} x2={BOARD} y1={BOARD + GAP / 2} y2={BOARD + GAP / 2} className="cg-tray-line" />}
          {tray.map((piece, index) => {
            const dragging = drag?.piece === piece;
            const c = dragging ? { x: drag.x, y: drag.y } : trayCenter(index);
            const scale = dragging ? 1 : traySCale;
            const size = cell * scale;
            return (
              <g
                key={piece}
                className={`cg-piece ${selected === piece ? "selected" : ""} ${dragging ? "dragging" : ""}`}
                transform={`translate(${c.x - size / 2} ${c.y - size / 2}) scale(${scale})`}
                role="button"
                tabIndex={0}
                aria-pressed={selected === piece}
                aria-label={t("Puzzle piece {p}", { p: piece + 1 })}
                onPointerDown={(e) => {
                  if (e.button !== 0 && e.pointerType === "mouse") return;
                  const p = toSvg(e.clientX, e.clientY);
                  if (!p) return;
                  svg.current?.setPointerCapture?.(e.pointerId);
                  setSelected(piece);
                  setDrag({ piece, id: e.pointerId, ...p });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(selected === piece ? null : piece);
                    setStatus(t("Piece {p} selected. Now choose its spot on the board.", { p: piece + 1 }));
                  }
                }}
              >
                {pieceGraphic(piece)}
                <rect width={cell} height={cell} className="cg-piece-outline" />
              </g>
            );
          })}
          {done && (
            <g className="cg-heart-done" aria-hidden="true">
              <path d={HEART} fill="none" stroke="#ffffff" strokeWidth="10" />
            </g>
          )}
        </svg>
        <aside className="cg-puzzle-side">
          {!done && (
            <div className="cg-card">
              <h2>{t("How to place pieces")}</h2>
              <p>{t("Drag a piece onto the board. Or select a piece (tap or Enter), then choose its spot.")}</p>
              {selected !== null && (
                <p className="cg-notice">{t("Piece {p} selected. Now choose its spot on the board.", { p: selected + 1 })}</p>
              )}
              <div className="cg-slot-buttons" role="group" aria-label={t("Board spots")}>
                {Array.from({ length: total }, (_, slot) => (
                  <button
                    key={slot}
                    type="button"
                    className="cg-slot-button"
                    disabled={selected === null || puzzle.placed.includes(slot)}
                    aria-label={t("Place in row {r}, column {c}", { r: Math.floor(slot / n) + 1, c: (slot % n) + 1 })}
                    onClick={() => selected !== null && attempt(selected, slot)}
                  >
                    {puzzle.placed.includes(slot) ? "✓" : `${Math.floor(slot / n) + 1}·${(slot % n) + 1}`}
                  </button>
                ))}
              </div>
              <div className="cg-row">
                <button type="button" className="button secondary small" onClick={giveHint}>
                  <Lightbulb size={16} /> {t("Hint")}
                </button>
                <button type="button" className="button secondary small" onClick={reshuffleTray}>
                  <Shuffle size={16} /> {t("Shuffle pieces")}
                </button>
              </div>
            </div>
          )}
          {message && (
            <div className={`cg-card cg-message ${done ? "final" : ""}`} aria-live="polite">
              <span className="eyebrow">{t(done ? "YOUR FINAL MESSAGE" : "A LITTLE MESSAGE")}</span>
              <p className="cg-big-text user-message">{message}</p>
              {done && config.from && <p>— {config.from} ♡</p>}
            </div>
          )}
          {done && (
            <div className="cg-card cg-result">
              <Celebration />
              <h2>{t(puzzleAchievement(puzzle.moves, total, puzzle.hints))}</h2>
              <p>{t("{moves} moves, {hints} hints, {time}.", { moves: puzzle.moves, hints: puzzle.hints, time: formatTime(seconds) })}</p>
              <div className="cg-row center">
                <button className="button" onClick={onRestart}>
                  <RotateCcw size={18} /> {t("Play again")}
                </button>
                {onLeave ? (
                  <button className="button secondary" onClick={onLeave}>
                    {t("Make a puzzle back")}
                  </button>
                ) : (
                  <Link className="button secondary" to="/couple-games">
                    {t("More couple games")}
                  </Link>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}

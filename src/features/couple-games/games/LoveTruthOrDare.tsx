import { useState } from "react";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { Check, Heart, Plus, RotateCcw, Shuffle, SkipForward, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Celebration, displayName, GameIntro, ProgressBar, ScoreLine } from "../components/GameShell";
import { ShareButtons, appLink } from "../../../components/ShareButtons";
import { TOD_CARDS, TOD_CATEGORIES, type TodCategory } from "../data/content";
import { randomIndex } from "../../../lib/share";
import { newSessionId, playersSchema, useGameSession } from "../lib/progress";
import { useStoredValue } from "../lib/storage";
import { usePhaseUrl } from "../lib/useStep";
import { useT } from "../lib/useT";
import { SelectMenu } from "../../../components/SelectMenu";

const GAME = "love-truth-or-dare" as const;
type CardType = "truth" | "dare";
const ROUND_OPTIONS = [5, 10, 20];
const MAX_CUSTOM = 30;

const customSchema = z.object({
  truth: z.array(z.string().max(160)).max(MAX_CUSTOM),
  dare: z.array(z.string().max(160)).max(MAX_CUSTOM),
});
const EMPTY_CUSTOM = { truth: [], dare: [] };
const favoritesSchema = z.array(z.string().max(160)).max(100);
const EMPTY_FAVS: string[] = [];

const stateSchema = z.object({
  sessionId: z.string(),
  createdAt: z.number(),
  players: playersSchema,
  categories: z.array(z.enum(["cute", "funny", "romantic", "deep", "distance", "custom"])).min(1),
  rounds: z.number().int().min(1).max(50),
  turn: z.enum(["a", "b"]),
  used: z.array(z.string().max(200)).max(400),
  current: z.object({ id: z.string(), type: z.enum(["truth", "dare"]), text: z.string().max(200) }).nullable(),
  history: z
    .array(z.object({ player: z.enum(["a", "b"]), type: z.enum(["truth", "dare"]), text: z.string().max(200), done: z.boolean() }))
    .max(100),
  finished: z.boolean(),
});
type TodState = z.infer<typeof stateSchema>;
type CategoryOrCustom = TodCategory | "custom";

/** Every card in the selected categories, with a stable id. */
export function buildPool(categories: CategoryOrCustom[], type: CardType, custom: z.infer<typeof customSchema>) {
  return categories.flatMap((category) =>
    category === "custom"
      ? custom[type].map((text, i) => ({ id: `custom:${type}:${i}:${text}`, text }))
      : TOD_CARDS[category][type].map((text, i) => ({ id: `${category}:${type}:${i}`, text })),
  );
}

export default function LoveTruthOrDare() {
  const t = useT();
  const session = useGameSession(GAME, stateSchema);
  const [custom, setCustom] = useStoredValue("tod:custom", customSchema, EMPTY_CUSTOM);
  const [favorites, setFavorites] = useStoredValue("tod:favorites", favoritesSchema, EMPTY_FAVS);
  const [game, setGameState] = useState<TodState | null>(null);
  const [categories, setCategories] = useState<CategoryOrCustom[]>(["cute", "funny", "romantic"]);
  const [rounds, setRounds] = useState(10);
  const [draft, setDraft] = useState({ type: "truth" as CardType, text: "" });
  const [notice, setNotice] = useState("");
  usePhaseUrl(GAME, game ? (game.finished ? "result" : "play") : "intro", (p) => (p === "intro" ? "" : p === "result" ? "play" : p));

  const setGame = (next: TodState | null) => {
    setGameState(next);
    if (next)
      session.save({
        id: next.sessionId,
        gameId: GAME,
        schemaVersion: 1,
        mode: "local",
        players: next.players,
        createdAt: next.createdAt,
        updatedAt: Date.now(),
        phase: next.finished ? "summary" : "play",
        completed: next.finished,
        state: next,
      });
  };
  const toggleCategory = (id: CategoryOrCustom) =>
    setCategories(categories.includes(id) ? categories.filter((c) => c !== id) : [...categories, id]);
  const hasCustom = custom.truth.length + custom.dare.length > 0;

  if (!game)
    return (
      <GameIntro
        gameId={GAME}
        modes={["local"]}
        startLabel="Start the game"
        resume={
          session.saved
            ? { onResume: () => setGameState(session.saved!.state), onDiscard: () => void session.discard() }
            : null
        }
        extraNote={
          <p className="cg-notice">
            {t("Every card is optional. Skipping is always fine and never costs points. No dare needs physical contact.")}
          </p>
        }
        onStart={({ players }) => {
          if (!categories.length) {
            setNotice("Pick at least one category.");
            return;
          }
          setGame({
            sessionId: newSessionId(),
            createdAt: Date.now(),
            players,
            categories,
            rounds,
            turn: "a",
            used: [],
            current: null,
            history: [],
            finished: false,
          });
        }}
      >
        <fieldset>
          <legend>{t("Which cards should be in the deck?")}</legend>
          <div className="chips">
            {TOD_CATEGORIES.map((c) => (
              <button type="button" key={c.id} className="chip" aria-pressed={categories.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                {t(c.label)}
              </button>
            ))}
            {hasCustom && (
              <button type="button" className="chip" aria-pressed={categories.includes("custom")} onClick={() => toggleCategory("custom")}>
                {t("Our custom cards")}
              </button>
            )}
          </div>
          <p className="field-meta">{t("Turn off anything you’d rather not play.")}</p>
        </fieldset>
        <fieldset>
          <legend>{t("Rounds")}</legend>
          <div className="chips">
            {ROUND_OPTIONS.map((r) => (
              <button type="button" key={r} className="chip" aria-pressed={rounds === r} onClick={() => setRounds(r)}>
                {r}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("Add your own cards")} <small>({t("optional, saved on this device")})</small></legend>
          <div className="cg-inline-form">
            <SelectMenu
              ariaLabel={t("Card type")}
              value={draft.type}
              options={[
                { value: "truth", label: `💬 ${t("Truth")}` },
                { value: "dare", label: `⚡ ${t("Dare")}` },
              ]}
              onChange={(type: CardType) => setDraft({ ...draft, type })}
            />
            <input
              aria-label={t("Your card text")}
              value={draft.text}
              maxLength={160}
              placeholder={t("e.g. Tell me your favourite thing about today")}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            />
            <button
              type="button"
              className="button secondary small"
              disabled={draft.text.trim().length < 3 || custom[draft.type].length >= MAX_CUSTOM}
              onClick={async () => {
                const text = draft.text.trim();
                if (custom[draft.type].includes(text)) return;
                const ok = await setCustom({ ...custom, [draft.type]: [...custom[draft.type], text] });
                setDraft({ ...draft, text: "" });
                if (!categories.includes("custom")) setCategories([...categories, "custom"]);
                setNotice(ok ? "Card added." : "Card added for this visit, but this browser couldn’t save it.");
              }}
            >
              <Plus size={16} /> {t("Add")}
            </button>
          </div>
          {hasCustom && (
            <ul className="cg-custom-list">
              {(["truth", "dare"] as CardType[]).flatMap((type) =>
                custom[type].map((text, i) => (
                  <li key={`${type}-${i}`}>
                    <span className="cg-tag">{t(type === "truth" ? "Truth" : "Dare")}</span> {text}
                    <button
                      type="button"
                      className="text-button"
                      aria-label={t("Delete card: {text}", { text })}
                      onClick={() => void setCustom({ ...custom, [type]: custom[type].filter((_, j) => j !== i) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                )),
              )}
            </ul>
          )}
          <p className="field-meta" role="status">
            {t(notice)}
          </p>
        </fieldset>
      </GameIntro>
    );

  const name = (who: "a" | "b") => displayName(t, game.players, who);
  const round = game.history.length + (game.current ? 1 : 0);

  const draw = (type: CardType) => {
    const pool = buildPool(game.categories, type, custom).filter((c) => !game.used.includes(c.id));
    if (!pool.length) {
      setNotice(type === "truth" ? "No truths left in this deck." : "No dares left in this deck.");
      return;
    }
    setNotice("");
    const card = pool[randomIndex(pool.length)];
    setGame({ ...game, used: [...game.used, card.id], current: { id: card.id, type, text: card.text } });
  };
  const resolve = (done: boolean) => {
    if (!game.current) return;
    const history = [...game.history, { player: game.turn, type: game.current.type, text: game.current.text, done }];
    setGame({
      ...game,
      history,
      current: null,
      turn: game.turn === "a" ? "b" : "a",
      finished: history.length >= game.rounds,
    });
  };
  const reshuffle = () => {
    setGame({ ...game, used: [] });
    setNotice("Deck reshuffled. Used cards are back in.");
  };
  const toggleFavorite = (text: string) =>
    void setFavorites(favorites.includes(text) ? favorites.filter((f) => f !== text) : [...favorites, text].slice(-100));
  const remaining = (type: CardType) =>
    buildPool(game.categories, type, custom).filter((c) => !game.used.includes(c.id)).length;

  if (game.finished) {
    const stats = (who: "a" | "b") => {
      const mine = game.history.filter((h) => h.player === who);
      return { done: mine.filter((h) => h.done).length, skipped: mine.filter((h) => !h.done).length };
    };
    const sessionFavs = game.history.filter((h) => favorites.includes(h.text));
    return (
      <section className="cg-card cg-result" aria-labelledby="tod-summary">
        <Celebration />
        <h1 id="tod-summary">{t("What a fun session! 💋")}</h1>
        <p>{t("{rounds} rounds played. Every skip was perfectly fine.", { rounds: game.history.length })}</p>
        <div className="cg-stats">
          {(["a", "b"] as const).map((who) => (
            <ScoreLine
              key={who}
              label={name(who)}
              value={t("{done} done · {skipped} skipped", { done: stats(who).done, skipped: stats(who).skipped })}
            />
          ))}
        </div>
        {sessionFavs.length > 0 && (
          <>
            <h2>{t("Your favourite cards")}</h2>
            <ul className="cg-list">
              {sessionFavs.map((h) => (
                <li key={h.text}>{t(h.text)}</li>
              ))}
            </ul>
          </>
        )}
        <div className="cg-row center">
          <button
            className="button"
            onClick={() => {
              void session.discard();
              setGameState(null);
            }}
          >
            <RotateCcw size={18} /> {t("Play again")}
          </button>
          <Link className="button secondary" to="/couple-games">
            {t("More couple games")}
          </Link>
        </div>
        <ShareButtons
          heading="Invite someone to play"
          url={appLink(`/couple-games/${GAME}`)}
          text={t("Play Love Truth or Dare with me on HeartPop ♡")}
        />
      </section>
    );
  }

  return (
    <section className="cg-tod" aria-labelledby="tod-turn">
      <div className="cg-play-head">
        <span className="cg-progress-label">{t("Round {n} of {total}", { n: Math.max(round, 1), total: game.rounds })}</span>
        <ProgressBar value={game.history.length} max={game.rounds} label={t("Rounds played")} />
        <h1 id="tod-turn" aria-live="polite">
          {t("{name}’s turn", { name: name(game.turn) })}
        </h1>
      </div>
      <AnimatePresence mode="wait">
        {game.current ? (
          <motion.div
            key={game.current.id}
            className={`cg-card cg-tod-card ${game.current.type}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            aria-live="polite"
          >
            <span className="cg-tag">{t(game.current.type === "truth" ? "Truth" : "Dare")}</span>
            <p className="cg-big-text">{t(game.current.text)}</p>
            <button
              type="button"
              className="cg-fav"
              aria-pressed={favorites.includes(game.current.text)}
              aria-label={t("Save this card as a favourite")}
              onClick={() => toggleFavorite(game.current!.text)}
            >
              <Heart size={20} fill={favorites.includes(game.current.text) ? "currentColor" : "none"} />
            </button>
            <div className="cg-row center">
              <button className="button" onClick={() => resolve(true)}>
                <Check size={18} /> {t("Done!")}
              </button>
              <button className="button secondary" onClick={() => resolve(false)}>
                <SkipForward size={18} /> {t("Skip — no worries")}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="choose" className="cg-card cg-tod-choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p>{t("Choose wisely…")}</p>
            <div className="cg-tod-buttons">
              <button className="cg-big-choice truth" onClick={() => draw("truth")} disabled={!remaining("truth")}>
                <span aria-hidden="true">💬</span> {t("Truth")}
                <small>{t("{n} left", { n: remaining("truth") })}</small>
              </button>
              <button className="cg-big-choice dare" onClick={() => draw("dare")} disabled={!remaining("dare")}>
                <span aria-hidden="true">⚡</span> {t("Dare")}
                <small>{t("{n} left", { n: remaining("dare") })}</small>
              </button>
            </div>
            {(!remaining("truth") || !remaining("dare")) && (
              <button className="text-button" onClick={reshuffle}>
                <Shuffle size={16} /> {t("Reshuffle the deck")}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <p className="field-meta" role="status">
        {t(notice)}
      </p>
      <div className="cg-row">
        <button className="text-button" onClick={() => setGame({ ...game, finished: true, current: null })}>
          {t("End the game now")}
        </button>
      </div>
    </section>
  );
}

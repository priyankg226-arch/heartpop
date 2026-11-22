import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Heart, Play, Search, Smartphone, Trash2, Users } from "lucide-react";
import {
  COUPLE_GAMES,
  featuredGame,
  filterGames,
  GAME_CATEGORIES,
  gameById,
  type CoupleGameDefinition,
  type GameCategory,
} from "./registry";
import { listUnfinishedSessions, useFavorites, useRecent } from "./lib/progress";
import { clearAll, subscribe } from "./lib/storage";
import { useT } from "./lib/useT";
import { GameIcon } from "./components/GameIcon";
import { ConfirmDialog } from "./components/ConfirmDialog";
import "./couple-games.css";

function HeroArt() {
  return (
    <svg className="cg-hero-art" viewBox="0 0 420 320" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cg-hero-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8fb1" />
          <stop offset="1" stopColor="#ff6b9d" />
        </linearGradient>
        <linearGradient id="cg-hero-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6c9ff" />
          <stop offset="1" stopColor="#b8a4ff" />
        </linearGradient>
      </defs>
      <circle cx="210" cy="170" r="140" fill="#fff0f5" />
      <circle cx="210" cy="170" r="104" fill="#ffe4ec" opacity="0.7" />
      <g className="cg-hero-left">
        <path d="M150 250 C80 200 70 130 112 118 C134 112 150 128 150 142 C150 128 166 112 188 118 C230 130 220 200 150 250Z" fill="url(#cg-hero-a)" />
        <circle cx="134" cy="160" r="5" fill="#34243a" />
        <circle cx="164" cy="160" r="5" fill="#34243a" />
        <path d="M138 180 C146 190 156 190 162 180" stroke="#34243a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <g className="cg-hero-right">
        <path d="M270 250 C200 200 190 130 232 118 C254 112 270 128 270 142 C270 128 286 112 308 118 C350 130 340 200 270 250Z" fill="url(#cg-hero-b)" />
        <circle cx="254" cy="160" r="5" fill="#34243a" />
        <circle cx="284" cy="160" r="5" fill="#34243a" />
        <path d="M258 180 C266 190 276 190 282 180" stroke="#34243a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <g className="cg-float-hearts" fill="#ff8fb1">
        <path d="M80 70 c-6 -7 -16 -2 -10 6 l10 10 l10 -10 c6 -8 -4 -13 -10 -6z" />
        <path d="M340 60 c-5 -6 -13 -2 -8 5 l8 8 l8 -8 c5 -7 -3 -11 -8 -5z" fill="#b8a4ff" />
        <path d="M360 230 c-4 -5 -11 -1 -7 4 l7 7 l7 -7 c4 -5 -3 -9 -7 -4z" fill="#ffb36b" />
        <path d="M60 230 c-4 -5 -11 -1 -7 4 l7 7 l7 -7 c4 -5 -3 -9 -7 -4z" />
      </g>
      <text x="196" y="96" fontSize="26" aria-hidden="true">✨</text>
    </svg>
  );
}

function GameCard({
  game,
  favorite,
  onToggleFavorite,
  badge,
}: {
  game: CoupleGameDefinition;
  favorite: boolean;
  onToggleFavorite: () => void;
  badge?: string;
}) {
  const t = useT();
  return (
    <article className={`cg-game-card ${game.color}`}>
      <div className="cg-card-top">
        <GameIcon id={game.id} />
        <button
          type="button"
          className="cg-fav"
          aria-pressed={favorite}
          aria-label={t(favorite ? "Remove {game} from favourites" : "Add {game} to favourites", { game: t(game.title) })}
          onClick={onToggleFavorite}
        >
          <Heart size={20} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      {badge && <span className="cg-badge">{t(badge)}</span>}
      <h3>
        {t(game.title)} <span aria-hidden="true">{game.emoji}</span>
      </h3>
      <p>{t(game.description)}</p>
      <div className="cg-card-meta">
        <span>
          <Clock size={14} /> {t("{minutes} min", { minutes: game.estimatedMinutes })}
        </span>
        {game.supportedModes.includes("local") && (
          <span>
            <Users size={14} /> {t("Same device")}
          </span>
        )}
        {game.supportedModes.includes("shareable") && (
          <span>
            <Smartphone size={14} /> {t("Shareable")}
          </span>
        )}
      </div>
      <Link className="button small cg-play" to={game.route} aria-label={t("Play {game}", { game: t(game.title) })}>
        <Play size={15} /> {t("Play")}
      </Link>
    </article>
  );
}

export default function CoupleGamesHub() {
  const t = useT();
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const [query, setQuery] = useState("");
  const { favorites, toggle } = useFavorites();
  const { recent } = useRecent();
  const [unfinished, setUnfinished] = useState<{ gameId: string; updatedAt: number }[]>([]);
  const [cleared, setCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => listUnfinishedSessions().then((s) => alive && setUnfinished(s));
    void load();
    const off = subscribe(() => void load());
    return () => {
      alive = false;
      off();
    };
  }, []);
  const featured = featuredGame();
  const visible = useMemo(() => filterGames(COUPLE_GAMES, category, query, t), [category, query, t]);
  const continueGames = unfinished.map((s) => gameById(s.gameId)).filter(Boolean) as CoupleGameDefinition[];
  const recentGames = recent.map((r) => gameById(r.id)).filter(Boolean).slice(0, 4) as CoupleGameDefinition[];
  const favoriteGames = COUPLE_GAMES.filter((g) => favorites.includes(g.id));
  const card = (game: CoupleGameDefinition, badge?: string) => (
    <GameCard
      key={game.id}
      game={game}
      badge={badge}
      favorite={favorites.includes(game.id)}
      onToggleFavorite={() => void toggle(game.id)}
    />
  );

  return (
    <main className="cg-page cg-hub">
      <section className="cg-hero">
        <div className="cg-hero-copy">
          <span className="pill">
            <span>✦</span> {t("COUPLE GAMES")}
          </span>
          <h1>
            {t("Two Hearts. Eight Little Adventures.")} <span aria-hidden="true">❤️</span>
          </h1>
          <p>{t("Play, laugh, discover, and make every moment together a little more special.")}</p>
          <div className="cg-row">
            <Link className="button" to={featured.route}>
              <Play size={18} /> {t("Play today’s pick: {game}", { game: t(featured.title) })}
            </Link>
            <button
              type="button"
              className="button secondary"
              onClick={() => document.getElementById("cg-all-games")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("See all games")}
            </button>
          </div>
          <p className="field-meta">
            {t("Free, no sign-up. Play together on one device, or send a challenge link.")}
          </p>
        </div>
        <HeroArt />
      </section>

      <section className="cg-featured cg-card" aria-labelledby="cg-featured-title">
        <GameIcon id={featured.id} size={84} />
        <div>
          <span className="eyebrow">{t("FEATURED TODAY")}</span>
          <h2 id="cg-featured-title">
            {t(featured.title)} <span aria-hidden="true">{featured.emoji}</span>
          </h2>
          <p>{t(featured.description)}</p>
          <ol className="cg-steps compact">
            {featured.howToPlay.slice(0, 3).map((s) => (
              <li key={s}>{t(s)}</li>
            ))}
          </ol>
        </div>
        <Link className="button" to={featured.route}>
          {t("Play now")}
        </Link>
      </section>

      {continueGames.length > 0 && (
        <section className="cg-section" aria-labelledby="cg-continue">
          <h2 id="cg-continue">{t("Continue playing")}</h2>
          <div className="cg-grid">{continueGames.map((g) => card(g, "In progress"))}</div>
        </section>
      )}
      {favoriteGames.length > 0 && (
        <section className="cg-section" aria-labelledby="cg-favs">
          <h2 id="cg-favs">{t("Your favourites")}</h2>
          <div className="cg-grid">{favoriteGames.map((g) => card(g))}</div>
        </section>
      )}
      {recentGames.length > 0 && (
        <section className="cg-section" aria-labelledby="cg-recent">
          <h2 id="cg-recent">{t("Recently played")}</h2>
          <div className="cg-grid">{recentGames.map((g) => card(g))}</div>
        </section>
      )}

      <section className="cg-section" id="cg-all-games" aria-labelledby="cg-all">
        <div className="cg-section-head">
          <h2 id="cg-all">{t("All games")}</h2>
          <label className="cg-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">{t("Search games")}</span>
            <input
              type="search"
              value={query}
              maxLength={60}
              placeholder={t("Search games…")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="chips" role="group" aria-label={t("Filter by category")}>
          <button className="chip" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
            {t("All")}
          </button>
          {GAME_CATEGORIES.map((c) => (
            <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {t(c.label)}
            </button>
          ))}
        </div>
        <p className="sr-only" role="status">
          {t("{count} games shown", { count: visible.length })}
        </p>
        {visible.length ? (
          <div className="cg-grid">{visible.map((g) => card(g))}</div>
        ) : (
          <p className="cg-empty">{t("No games match that search. Try another word?")}</p>
        )}
      </section>

      <section className="cg-section cg-card cg-about" aria-labelledby="cg-how">
        <h2 id="cg-how">{t("How couple games work")}</h2>
        <ul>
          <li>{t("Together on one device: take turns and pass the phone. Private answers stay hidden until the reveal.")}</li>
          <li>{t("Challenge links: create something, send the link, and your partner plays on their own device. Results don’t come back automatically — share them back if you like.")}</li>
          <li>{t("Links are encoded, not encrypted. Anyone with a link can read it, including answers. Keep it sweet, not secret.")}</li>
          <li>{t("Progress, favourites and drafts are saved only in this browser and may be cleared by your browser.")}</li>
          <li>{t("Scores are just for fun — they never measure a relationship.")}</li>
        </ul>
        <button
          className="button secondary small"
          onClick={() => {
            setCleared(false);
            setConfirmClear(true);
          }}
        >
          <Trash2 size={16} /> {t("Clear couple-game data on this device")}
        </button>
        <p className="field-meta" role="status">
          {cleared ? t("Couple-game data cleared from this device.") : ""}
        </p>
        <ConfirmDialog
          open={confirmClear}
          destructive
          title={t("Clear all couple-game data?")}
          confirmLabel={t("Yes, clear it")}
          cancelLabel={t("Keep my data")}
          onCancel={() => setConfirmClear(false)}
          onConfirm={async () => {
            setConfirmClear(false);
            await clearAll();
            setCleared(true);
          }}
        >
          <p>{t("This deletes your game progress, favourites, saved drafts and custom cards on this device.")}</p>
          <p className="field-meta">{t("This can’t be undone. Links you already sent are not affected.")}</p>
        </ConfirmDialog>
      </section>
    </main>
  );
}

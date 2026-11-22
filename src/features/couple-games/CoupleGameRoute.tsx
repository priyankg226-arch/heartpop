import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from "react";
import { Link, useParams } from "react-router-dom";
import { isCoupleGameId, type CoupleGameId } from "./registry";
import { markPlayed } from "./lib/progress";
import { useT } from "./lib/useT";
import { GameFrame } from "./components/GameShell";
import "./couple-games.css";

/** Each game is its own lazily-loaded chunk. */
const GAMES: Record<CoupleGameId, LazyExoticComponent<ComponentType>> = {
  "guess-my-feelings": lazy(() => import("./games/GuessMyFeelings")),
  "love-memory-match": lazy(() => import("./games/LoveMemoryMatch")),
  "you-vs-me": lazy(() => import("./games/YouVsMe")),
  "our-dream-date": lazy(() => import("./games/OurDreamDate")),
  "love-truth-or-dare": lazy(() => import("./games/LoveTruthOrDare")),
  "fix-our-heart": lazy(() => import("./games/FixOurHeart")),
  "send-me-a-hug": lazy(() => import("./games/SendMeAHug")),
  "find-my-love": lazy(() => import("./games/FindMyLove")),
};
const WIDE: CoupleGameId[] = ["fix-our-heart"];

export default function CoupleGameRoute() {
  const { gameId = "" } = useParams();
  const t = useT();
  const valid = isCoupleGameId(gameId);
  useEffect(() => {
    if (valid) void markPlayed(gameId);
  }, [gameId, valid]);
  if (!valid)
    return (
      <main className="prose">
        <h1>{t("We couldn’t find that game.")}</h1>
        <Link className="button" to="/couple-games">
          {t("All couple games")}
        </Link>
      </main>
    );
  const Game = GAMES[gameId];
  return (
    <GameFrame gameId={gameId} wide={WIDE.includes(gameId)}>
      <Suspense
        fallback={
          <p className="cg-card cg-center" role="status">
            {t("Setting up the game…")}
          </p>
        }
      >
        <Game />
      </Suspense>
    </GameFrame>
  );
}

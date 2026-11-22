import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CoupleGameId } from "../registry";

/**
 * Reads the sub-route of a game (`""`, `play`, `result`, `open/<token>` …)
 * and navigates between steps without remounting the game component.
 */
export function useStep(gameId: CoupleGameId) {
  const params = useParams();
  const navigate = useNavigate();
  const splat = params["*"] ?? "";
  const [step, token] = splat.split("/");
  const go = useCallback(
    (next: string, options: { replace?: boolean } = {}) =>
      navigate(`/couple-games/${gameId}${next ? `/${next}` : ""}`, options),
    [gameId, navigate],
  );
  return { step: step ?? "", token: step === "open" ? token : undefined, go };
}

/**
 * Mirrors the game's internal phase into the URL (`/play`, `/result` …) using
 * history replacement, so refreshing or deep-linking into a step without its
 * in-memory state safely lands back on the intro. Return `null` from `stepOf`
 * to leave the URL alone (e.g. while playing from an `open/<token>` link).
 */
export function usePhaseUrl<P>(gameId: CoupleGameId, phase: P, stepOf: (phase: P) => string | null) {
  const { step, go } = useStep(gameId);
  const target = stepOf(phase);
  useEffect(() => {
    if (target !== null && target !== step) go(target, { replace: true });
  }, [target, step, go]);
}

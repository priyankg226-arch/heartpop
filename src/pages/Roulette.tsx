import { I18nText } from "../i18n/react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Heart, RotateCcw } from "lucide-react";
import { randomIndex } from "../lib/share";
import { ConfettiEffect } from "../components/Interactive";
import { appLink, ShareButtons } from "../components/ShareButtons";
import { useLanguage } from "../i18n/react";
import { translate } from "../i18n/ui";
import { useSearchParams } from "react-router-dom";
const challenges = {
  Romantic: [
    "Give a genuine compliment",
    "Share your favorite memory",
    "Plan a surprise date",
    "Say three things you appreciate",
  ],
  Funny: [
    "Tell your funniest joke",
    "Make a silly face",
    "Invent a funny nickname",
    "Share an embarrassing but harmless story",
  ],
  Friendship: [
    "Share a favorite friendship memory",
    "Describe your friend in three words",
    "Choose your next hangout",
    "Send an appreciation message",
  ],
  "Deep conversations": [
    "What is one thing you appreciate about us?",
    "What memory always makes you smile?",
    "What is something new we should try together?",
    "When do you feel most understood?",
  ],
};
export default function Roulette() {
  const [params, setParams] = useSearchParams();
  const { language } = useLanguage();
  const linked = params.get("category");
  const [category, setCategory] = useState<keyof typeof challenges>(
    linked && linked in challenges
      ? (linked as keyof typeof challenges)
      : "Romantic",
  );
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useReducedMotion();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setDone(false);
    const selected = randomIndex(4);
    const target = (360 - (selected * 90 + 45)) % 360;
    setRotation(
      (previous) => previous + 1800 + ((target - (previous % 360) + 360) % 360),
    );
    timer.current = setTimeout(
      () => {
        setResult(selected);
        setSpinning(false);
      },
      reduced ? 30 : 4200,
    );
  }
  return (
    <main className="roulette-page">
      <span className="eyebrow">
        {" "}
        <I18nText text={"LESS SCROLLING. MORE CONNECTING."} />{" "}
      </span>
      <h1>
        {" "}
        <I18nText text={"A little spin. A new little memory."} />{" "}
      </h1>
      <p>
        {" "}
        <I18nText
          text={"For date nights, bestie catch-ups, and everything in between."}
        />{" "}
      </p>
      <div className="chips centered">
        {Object.keys(challenges).map((c) => (
          <button
            disabled={spinning}
            className={`chip ${category === c ? "selected" : ""}`}
            aria-pressed={category === c}
            key={c}
            onClick={() => {
              setCategory(c as keyof typeof challenges);
              setParams({ category: c }, { replace: true });
              setResult(null);
              setDone(false);
            }}
          >
            <I18nText text={c} />
          </button>
        ))}
      </div>
      <div className="wheel-wrap">
        <span className="wheel-pointer" />
        <div
          className="roulette-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: reduced ? "0s" : "4.2s",
          }}
        >
          {["Connect", "Laugh", "Dream", "Appreciate"].map((v, i) => (
            <span
              key={v}
              style={{
                transform: `rotate(${i * 90 + 45}deg) translateY(-104px)`,
              }}
            >
              <I18nText text={v} />
            </span>
          ))}
        </div>
        <span className="wheel-center">
          <Heart fill="currentColor" />
        </span>
      </div>
      <button className="button" disabled={spinning} onClick={spin}>
        <RotateCcw size={18} />
        <I18nText
          text={
            spinning
              ? "A little magic in motion…"
              : result !== null
                ? "Spin again"
                : "Spin the wheel"
          }
        />
      </button>
      <div className="roulette-result" aria-live="polite">
        {result !== null && (
          <>
            <span className="eyebrow">
              {" "}
              <I18nText text={"YOUR LITTLE CHALLENGE"} />{" "}
            </span>
            <h2>
              <I18nText text={challenges[category][result]} />
            </h2>
            <button
              className="button secondary"
              onClick={() => setDone(true)}
              disabled={done}
            >
              {done ? "A memory made ♡" : "Challenge complete"}
            </button>
            {done && <ConfettiEffect />}
          </>
        )}
      </div>
      <ShareButtons
        heading={
          result !== null ? "Challenge your friends" : "Invite a friend to spin"
        }
        url={appLink(`/roulette?category=${encodeURIComponent(category)}`)}
        text={
          result !== null
            ? translate(language, "My HeartPop challenge: {challenge} ♡ Spin the wheel with me:", {
                challenge: translate(language, challenges[category][result]),
              })
            : translate(language, "Spin the HeartPop Love Roulette with me! ♡")
        }
      />
      <p className="field-meta">
        {" "}
        <I18nText
          text={"Keep it kind. Skip anything you’re not comfortable with."}
        />{" "}
      </p>
    </main>
  );
}

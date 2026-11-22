import { useRef, useState } from "react";
import { z } from "zod";
import { motion, useReducedMotion } from "motion/react";
import { Eye, HeartHandshake, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Celebration,
  GameIntro,
  InvalidChallenge,
  LoadingCard,
  ShareChallenge,
  StepHeading,
  useSharedChallenge,
} from "../components/GameShell";
import { HUG_COLORS, HUG_THEMES } from "../data/content";
import { nameField } from "../lib/shareCodec";
import { usePhaseUrl, useStep } from "../lib/useStep";
import { useT } from "../lib/useT";

const GAME = "send-me-a-hug" as const;
export const hugShareSchema = z
  .object({
    from: nameField,
    to: z.string().trim().min(1).max(30),
    theme: z.enum(HUG_THEMES.map((h) => h.id) as [string, ...string[]]),
    message: z.string().trim().min(1).max(200),
    colors: z.tuple([z.number().int().min(0).max(HUG_COLORS.length - 1), z.number().int().min(0).max(HUG_COLORS.length - 1)]),
  })
  .strict();
type Hug = z.infer<typeof hugShareSchema>;

export default function SendMeAHug() {
  const t = useT();
  const { token, go } = useStep(GAME);
  const shared = useSharedChallenge(GAME, hugShareSchema, token);
  const [phase, setPhase] = useState<"intro" | "create" | "preview" | "share">("intro");
  const [hug, setHug] = useState<Hug>({ from: "", to: "", theme: "warm", message: HUG_THEMES[0].messages[0], colors: [0, 1] });
  usePhaseUrl(GAME, phase, (p) => (token ? null : p === "intro" ? "" : "create"));

  if (token) {
    if (shared.status === "loading") return <LoadingCard />;
    if (shared.status === "error") return <InvalidChallenge gameId={GAME} error={shared.error} />;
    if (shared.status === "ok")
      return (
        <>
          <HugExperience hug={shared.data!} />
          <div className="cg-row center">
            <button className="button secondary" onClick={() => go("")}>
              <HeartHandshake size={18} /> {t("Send a hug back")}
            </button>
          </div>
        </>
      );
  }

  if (phase === "intro")
    return (
      <GameIntro
        gameId={GAME}
        modes={["shareable"]}
        namesFor="none"
        startLabel="Create a hug"
        onStart={() => setPhase("create")}
      />
    );

  const theme = HUG_THEMES.find((h) => h.id === hug.theme)!;
  const valid = hugShareSchema.safeParse(hug).success;
  if (phase === "preview")
    return (
      <>
        <p className="cg-notice">{t("Preview — this is what {name} will see.", { name: hug.to })}</p>
        <HugExperience hug={hug} />
        <div className="cg-row center">
          <button className="button secondary" onClick={() => setPhase("create")}>
            {t("Edit hug")}
          </button>
          <button className="button" onClick={() => setPhase("share")}>
            {t("Looks perfect — get the link")}
          </button>
        </div>
      </>
    );
  if (phase === "share")
    return (
      <section className="cg-card">
        <StepHeading>{t("Your hug for {name} is ready 🤗", { name: hug.to })}</StepHeading>
        <ShareChallenge
          gameId={GAME}
          schema={hugShareSchema}
          data={hug}
          heading="Send your hug"
          text={t("{name} sent you a hug 🤗 Open it here:", { name: hug.from || t("Someone") })}
          filename="send-me-a-hug.json"
        />
        <button className="text-button" onClick={() => setPhase("create")}>
          {t("Edit hug")}
        </button>
      </section>
    );

  return (
    <form
      className="cg-card cg-setup"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) setPhase("preview");
      }}
    >
      <StepHeading>{t("Create your hug")}</StepHeading>
      <div className="form-row">
        <label>
          {t("From")} <small>({t("optional")})</small>
          <input value={hug.from} maxLength={30} placeholder={t("Your name")} onChange={(e) => setHug({ ...hug, from: e.target.value })} />
        </label>
        <label>
          {t("For")}
          <input required value={hug.to} maxLength={30} onChange={(e) => setHug({ ...hug, to: e.target.value })} placeholder={t("e.g. Mira")} />
        </label>
      </div>
      <fieldset>
        <legend>{t("Hug theme")}</legend>
        <div className="chips">
          {HUG_THEMES.map((h) => (
            <button
              type="button"
              key={h.id}
              className="chip"
              aria-pressed={hug.theme === h.id}
              onClick={() => setHug({ ...hug, theme: h.id, message: h.messages[0] })}
            >
              <span aria-hidden="true">{h.emoji}</span> {t(h.label)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("Message")}</legend>
        <div className="chips">
          {theme.messages.map((m) => (
            <button type="button" key={m} className="chip" aria-pressed={hug.message === t(m) || hug.message === m} onClick={() => setHug({ ...hug, message: t(m) })}>
              {t(m)}
            </button>
          ))}
        </div>
        <label>
          {t("Or write your own")}
          <textarea rows={3} maxLength={200} value={hug.message} onChange={(e) => setHug({ ...hug, message: e.target.value })} />
        </label>
        <span className="field-meta">{hug.message.length}/200</span>
      </fieldset>
      {(["0", "1"] as const).map((slot) => (
        <fieldset key={slot}>
          <legend>{t(slot === "0" ? "Your heart’s colour" : "Their heart’s colour")}</legend>
          <div className="cg-swatches" role="radiogroup" aria-label={t(slot === "0" ? "Your heart’s colour" : "Their heart’s colour")}>
            {HUG_COLORS.map(([hex, label], i) => (
              <button
                type="button"
                key={hex}
                role="radio"
                aria-checked={hug.colors[Number(slot)] === i}
                className="cg-swatch large"
                style={{ background: hex }}
                aria-label={t(label)}
                title={t(label)}
                onClick={() => {
                  const colors = [...hug.colors] as [number, number];
                  colors[Number(slot)] = i;
                  setHug({ ...hug, colors });
                }}
              />
            ))}
          </div>
        </fieldset>
      ))}
      <button className="button" type="submit" disabled={!valid}>
        <Eye size={18} /> {t("Preview the hug")}
      </button>
      {!valid && <p className="field-meta">{t("Add their name and a message to continue.")}</p>}
    </form>
  );
}

function HeartBuddy({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 110" className="cg-buddy-svg" aria-hidden="true" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M60 104 C14 74 4 40 24 22 C40 8 56 18 60 32 C64 18 80 8 96 22 C116 40 106 74 60 104Z" fill={color} />
      <path d="M30 34 C34 26 42 22 48 24" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="52" r="5" fill="#34243a" />
      <circle cx="74" cy="52" r="5" fill="#34243a" />
      <circle cx="38" cy="64" r="6" fill="#ffffff" opacity="0.35" />
      <circle cx="82" cy="64" r="6" fill="#ffffff" opacity="0.35" />
      <path d="M50 66 C56 74 64 74 70 66" stroke="#34243a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M8 60 C0 54 2 46 10 48" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M112 60 C120 54 118 46 110 48" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const START = { left: 12, right: 88 };
const HUG_DISTANCE = 26;

export function HugExperience({ hug }: { hug: Hug }) {
  const t = useT();
  const reduced = useReducedMotion();
  const [pos, setPos] = useState(START);
  const [hugged, setHugged] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ side: "left" | "right"; id: number } | null>(null);
  const theme = HUG_THEMES.find((h) => h.id === hug.theme)!;
  const [c1, c2] = hug.colors.map((i) => HUG_COLORS[i][0]);

  const update = (next: { left: number; right: number }) => {
    const clamped = {
      left: Math.max(5, Math.min(next.left, next.right - 8)),
      right: Math.min(95, Math.max(next.right, next.left + 8)),
    };
    setPos(clamped);
    if (clamped.right - clamped.left <= HUG_DISTANCE) {
      setHugged(true);
      drag.current = null;
    }
  };
  const together = () => {
    setPos({ left: 41, right: 59 });
    setHugged(true);
  };
  const replay = () => {
    setHugged(false);
    setPos(START);
  };
  const move = (side: "left" | "right", delta: number) =>
    update(side === "left" ? { ...pos, left: pos.left + delta } : { ...pos, right: pos.right + delta });

  return (
    <section className={`cg-hug theme-${hug.theme}`} aria-labelledby="hug-title">
      <div className="cg-card cg-center">
        <span className="eyebrow">
          {theme.emoji} {t(theme.label)}
        </span>
        <h1 id="hug-title">
          {hug.from ? t("{from} sent {to} a hug", { from: hug.from, to: hug.to }) : t("A hug for {to}", { to: hug.to })}
        </h1>
        {!hugged && <p>{t("Drag the two hearts together (or tap the button) to open it.")}</p>}
      </div>
      <div
        ref={area}
        className={`cg-hug-stage ${hugged ? "hugged" : ""}`}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId || !area.current) return;
          const rect = area.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          update(d.side === "left" ? { ...pos, left: x } : { ...pos, right: x });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {(["left", "right"] as const).map((side) => (
          <motion.button
            key={side}
            type="button"
            className="cg-buddy"
            style={{ left: `${pos[side]}%` }}
            animate={hugged && !reduced ? { scale: [1, 1.15, 1], rotate: side === "left" ? [0, 8, 0] : [0, -8, 0] } : {}}
            transition={{ duration: 0.8, repeat: hugged && !reduced ? 2 : 0 }}
            aria-label={t(
              side === "left"
                ? "{name}’s heart. Use the arrow keys to move it."
                : "{name}’s heart. Use the arrow keys to move it.",
              { name: side === "left" ? hug.from || t("Sender") : hug.to },
            )}
            disabled={hugged}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId);
              drag.current = { side, id: e.pointerId };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || d.id !== e.pointerId || !area.current) return;
              const rect = area.current.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              update(d.side === "left" ? { ...pos, left: x } : { ...pos, right: x });
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(side, 6);
              else if (e.key === "ArrowLeft") move(side, -6);
              else return;
              e.preventDefault();
            }}
          >
            <HeartBuddy color={side === "left" ? c1 : c2} flip={side === "right"} />
          </motion.button>
        ))}
        {hugged && <span className="cg-hug-burst" aria-hidden="true">💞</span>}
      </div>
      <div aria-live="polite">
        {hugged ? (
          <motion.div
            className="cg-card cg-result"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Celebration />
            <p className="cg-big-text user-message">{hug.message}</p>
            {hug.from && <p>— {hug.from} ♡</p>}
            <div className="cg-row center">
              <button className="button secondary" onClick={replay}>
                <RotateCcw size={16} /> {t("Hug again")}
              </button>
              <Link className="text-button" to="/couple-games">
                {t("Explore couple games")}
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="cg-row center">
            <button className="button" onClick={together}>
              <HeartHandshake size={18} /> {t("Bring them together")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

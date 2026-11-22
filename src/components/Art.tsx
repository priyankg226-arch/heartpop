import { I18nText } from "../i18n/react";
export function HeartArt({ variant = "hero" }: { variant?: string }) {
  return (
    <svg
      className={`art art-${variant}`}
      viewBox="0 0 500 390"
      role="img"
      aria-label="A smiling love letter surrounded by little hearts"
    >
      <defs>
        <linearGradient id={`paper-${variant}`} x2="0" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#fff0f4" />
        </linearGradient>
      </defs>
      <ellipse
        cx="250"
        cy="332"
        rx="173"
        ry="24"
        fill="#dac4d8"
        opacity=".22"
      />
      <g transform="rotate(-8 250 200)">
        <rect x="102" y="112" width="294" height="208" rx="22" fill="#ee9fb8" />
        <path d="m105 130 143 114 145-114" fill="#f9b7cb" />
        <rect
          x="140"
          y="65"
          width="220"
          height="221"
          rx="16"
          fill={`url(#paper-${variant})`}
          stroke="#f0d2dd"
          strokeWidth="2"
        />
        <path
          d="M250 173c-63-38-49-89-14-79 8 2 12 9 14 13 29-45 88 6 0 66"
          fill="#f16b91"
        />
        <circle cx="236" cy="130" r="4" fill="#522e42" />
        <circle cx="263" cy="130" r="4" fill="#522e42" />
        <path
          d="M242 144q8 9 16 0"
          fill="none"
          stroke="#522e42"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M190 197h120m-104 18h88"
          stroke="#e7c8d6"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M103 147 250 250 396 147v153q0 20-22 20H124q-21 0-21-20Z"
          fill="#ffc3d4"
        />
        <path d="m106 310 117-93q27-19 54 0l116 93" fill="#ffd5e1" />
        <circle cx="250" cy="265" r="25" fill="#f9f0e8" />
        <path d="M250 278c-29-18-18-39 0-23 18-16 29 5 0 23" fill="#eb7698" />
      </g>
      <g fill="#e97f9f">
        <path d="M72 122c-41-26-23-52 0-31 24-21 41 5 0 31" />
        <path d="M414 249c-36-23-20-46 0-27 21-19 37 4 0 27" />
      </g>
      <g fill="#b7a2e0">
        <path d="m398 61 5 16 17 5-17 5-5 17-5-17-17-5 17-5Z" />
        <path d="m69 248 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" />
      </g>
      <g fill="#d9b681">
        <circle cx="117" cy="49" r="5" />
        <circle cx="444" cy="145" r="5" />
        <circle cx="365" cy="347" r="4" />
      </g>
    </svg>
  );
}
export function MiniArt({ kind }: { kind: string }) {
  if (kind === "envelope") return <HeartArt variant="mini" />;
  return (
    <div className={`mini-scene ${kind}`} aria-hidden="true">
      {kind === "scratch" ? (
        <div className="scratch-art">
          <span>
            {" "}
            <I18nText text={"just for you"} />{" "}
          </span>
          <strong>♥</strong>
          <small>
            {" "}
            <I18nText text={"A little secret inside"} />{" "}
          </small>
        </div>
      ) : kind === "stars" ? (
        <div className="stars-art">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
          <b>♡</b>
        </div>
      ) : kind === "hearts" ? (
        <div className="hearts-art">
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
          <b />
        </div>
      ) : kind === "future" ? (
        <div className="future-art">
          <span>⏳</span>
          <small>
            <I18nText text={"open on"} />
            <br />
            14 · 02
          </small>
        </div>
      ) : kind === "bingo" ? (
        <div className="bingo-art">
          {["♥", "", "✓", "", "♥", "", "✓", "", "♥"].map((mark, i) => (
            <span key={i} className={mark === "♥" ? "hit" : undefined}>
              {mark}
            </span>
          ))}
          <b>
            <I18nText text={"BINGO"} />
          </b>
        </div>
      ) : kind === "roulette" ? (
        <div className="wheel-art">
          <span>♥</span>
        </div>
      ) : kind === "quiz" ? (
        <>
          <div className="quiz-art">
            {" "}
            <I18nText text={"How well"} /> <br />{" "}
            <I18nText text={"do you know me?"} />{" "}
            <span>♡ &nbsp; ✓ &nbsp; ?</span>
          </div>
          <i>?</i>
        </>
      ) : (
        <div className="message-art">
          {" "}
          <I18nText text={"You make my"} /> <br />{" "}
          <I18nText text={"heart happy."} /> <span>♡</span>
        </div>
      )}
    </div>
  );
}

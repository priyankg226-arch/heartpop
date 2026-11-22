import { I18nText } from "../i18n/react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Check, Copy, Heart, Share2, Sparkles } from "lucide-react";
import { useLanguage } from "../app";
import { categories, template, tones } from "../i18n";
import { bingoDefaults, starDefaults } from "../i18n/newExperiences";
import { translate } from "../i18n/ui";
import {
  decodePayload,
  encodePayload,
  experienceKinds,
  payloadSchema,
  scoreQuiz,
  shareUrl,
  type Payload,
  type Question,
} from "../lib/share";
import {
  AnimatedEnvelope,
  ConfettiEffect,
  ScratchCanvas,
} from "../components/Interactive";
import {
  CatchHearts,
  CoupleBingo,
  dateLocale,
  FutureLetter,
  StarSky,
} from "../components/NewExperiences";
/** YYYY-MM-DD in the viewer's local time zone. */
function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const SAVED_LETTERS = "heartpop-future-letters";
type SavedLetter = { to: string; unlockAt: string; token: string };
function readSavedLetters(): SavedLetter[] {
  try {
    const list: unknown = JSON.parse(
      localStorage.getItem(SAVED_LETTERS) ?? "[]",
    );
    return Array.isArray(list)
      ? list.filter(
          (l): l is SavedLetter =>
            typeof l?.to === "string" &&
            typeof l?.unlockAt === "string" &&
            typeof l?.token === "string",
        )
      : [];
  } catch {
    return [];
  }
}
const defaults: Question[] = [
  {
    prompt: "What is my favorite comfort food?",
    options: ["Pizza", "Pasta", "Dosa", "Chocolate"],
    answer: 0,
  },
  {
    prompt: "Where would I love to travel?",
    options: ["Mountains", "Beach", "Big city", "Quiet village"],
    answer: 0,
  },
  {
    prompt: "What makes me laugh the most?",
    options: ["Bad puns", "Funny videos", "Inside jokes", "Silly faces"],
    answer: 2,
  },
  {
    prompt: "What is my ideal weekend?",
    options: ["A cozy movie", "An adventure", "Seeing friends", "Sleeping in"],
    answer: 0,
  },
  {
    prompt: "When I’m upset, what helps?",
    options: ["A hug", "Some space", "A good laugh", "Talking it out"],
    answer: 3,
  },
];
const themes = [
  ["pink", "Pink Hearts"],
  ["lavender", "Purple Magic"],
  ["peach", "Cute Teddy"],
  ["gold", "Golden Surprise"],
  ["mint", "Friendship Fun"],
] as const;
function Preview({ data, peek = false }: { data: Payload; peek?: boolean }) {
  return (
    <div
      className={`preview-card theme-${data.theme}`}
      lang={
        data.language === "hinglish"
          ? "hi-Latn"
          : data.language === "roman-gu"
            ? "gu-Latn"
            : data.language
      }
    >
      <span className="eyebrow">
        {" "}
        <I18nText text={"A LITTLE SOMETHING FOR"} />{" "}
        {data.to || "SOMEONE SPECIAL"}
      </span>
      {data.kind === "envelope" && (
        <p className="envelope-category">
          {" "}
          <I18nText text={"Open when"} /> <I18nText text={data.category} />…
        </p>
      )}
      {data.kind === "stars" ? (
        <StarSky
          stars={data.stars ?? []}
          message={data.message}
          to={data.to || "you"}
          from={data.from}
        />
      ) : data.kind === "hearts" ? (
        <CatchHearts
          message={data.message}
          to={data.to || "you"}
          from={data.from}
        />
      ) : data.kind === "future" ? (
        <FutureLetter
          unlockAt={data.unlockAt ?? localDate(1)}
          message={data.message}
          to={data.to || "you"}
          from={data.from}
          peek={peek}
        />
      ) : data.kind === "bingo" ? (
        <CoupleBingo
          squares={data.bingo ?? []}
          message={data.message}
          to={data.to || "you"}
          from={data.from}
        />
      ) : data.kind === "envelope" ? (
        <AnimatedEnvelope
          message={data.message}
          to={data.to || "you"}
          from={data.from}
        />
      ) : data.kind === "scratch" ? (
        <ScratchCanvas message={data.message} />
      ) : data.kind === "quiz" ? (
        <>
          <span className="big-heart">?</span>
          <h2>
            <I18nText
              text="How well do you know {name}?"
              values={{ name: data.from || "me" }}
            />
          </h2>
          <p>
            {data.questions?.length}{" "}
            <I18nText
              text={"little questions. A whole lot of memories."}
            />{" "}
          </p>
        </>
      ) : (
        <div className="letter">
          <Heart />
          <h2>
            {" "}
            <I18nText text={"Hey"} /> {data.to || "you"},
          </h2>
          <p className="user-message">{data.message}</p>
          <p>
            <>
              <I18nText
                text={data.from ? "With love" : "Just a little love, for you."}
              />
              {data.from ? `, ${data.from}` : ""}
            </>
          </p>
        </div>
      )}
    </div>
  );
}
function Creator({ kind }: { kind: Payload["kind"] }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<Payload>(
    location.state?.draft ?? {
      v: 1,
      kind,
      to: "",
      from: "",
      category: categories[kind][0],
      tone: "Cute",
      theme: "pink",
      language,
      message: template(language, categories[kind][0], "Cute"),
      ...(kind === "quiz"
        ? {
            questions: defaults.map((q) => ({ ...q, options: [...q.options] })),
          }
        : {}),
      ...(kind === "stars" ? { stars: [...starDefaults[language]] } : {}),
      ...(kind === "bingo" ? { bingo: [...bingoDefaults[language]] } : {}),
      ...(kind === "future" ? { unlockAt: localDate(30) } : {}),
    },
  );
  const [savedLetters] = useState(() =>
    kind === "future" ? readSavedLetters() : [],
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setData((previous) => {
      if (previous.language === language) return previous;
      const isTemplate =
        previous.message ===
        template(previous.language, previous.category, previous.tone);
      const same = (a?: string[], b?: string[]) =>
        !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);
      return {
        ...previous,
        language,
        message: isTemplate
          ? template(language, previous.category, previous.tone)
          : previous.message,
        ...(same(previous.stars, starDefaults[previous.language])
          ? { stars: [...starDefaults[language]] }
          : {}),
        ...(same(previous.bingo, bingoDefaults[previous.language])
          ? { bingo: [...bingoDefaults[language]] }
          : {}),
      };
    });
  }, [language]);
  function update<K extends keyof Payload>(key: K, value: Payload[K]) {
    setData((d) => {
      const next = { ...d, [key]: value };
      if (
        (key === "category" || key === "tone") &&
        d.message === template(d.language, d.category, d.tone)
      )
        next.message = template(language, next.category, next.tone);
      return next;
    });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      navigate(`/preview/${encodePayload({ ...data, language })}`);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("too long")
          ? err.message
          : "Please add a recipient, a message, and complete every quiz answer. Names must be 40 characters or fewer.",
      );
    }
  }
  function changeQuestion(i: number, patch: Partial<Question>) {
    setData((d) => ({
      ...d,
      questions: d.questions?.map((q, index) =>
        index === i ? { ...q, ...patch } : q,
      ),
    }));
  }
  return (
    <main className="creator-page">
      <div className="page-intro">
        <Link className="back-link" to="/explore">
          {" "}
          <I18nText text={"All experiences"} />{" "}
        </Link>
        <span className="eyebrow">
          {" "}
          <I18nText text={"MAKE IT THEIR KIND OF SPECIAL"} />{" "}
        </span>
        <h1>
          <I18nText
            text={
              kind === "envelope"
                ? "A little letter. A lot of love."
                : kind === "scratch"
                  ? "A secret worth uncovering."
                  : kind === "quiz"
                    ? "Your story. Their answers."
                    : kind === "stars"
                      ? "Hide your words among the stars."
                      : kind === "hearts"
                        ? "A little game with a sweet prize."
                        : kind === "future"
                          ? "Words for a day that hasn’t come yet."
                          : kind === "bingo"
                            ? "Funny little truths, one square at a time."
                            : "A few words, straight from the heart."
            }
          />
        </h1>
        <p>
          {" "}
          <I18nText
            text={"Make it personal. We’ll take care of the little magic."}
          />{" "}
        </p>
      </div>
      <div className="creator-grid">
        <form className="form-card" onSubmit={submit}>
          <h2>
            {" "}
            <I18nText text={"Your little surprise"} />{" "}
          </h2>
          <div className="form-row">
            <label>
              {" "}
              <I18nText text={"For someone special"} />{" "}
              <input
                required
                maxLength={40}
                placeholder={translate(language, "Their name")}
                value={data.to}
                onChange={(e) => update("to", e.target.value)}
              />
            </label>
            <label>
              {" "}
              <I18nText text={"From you"} />{" "}
              {kind !== "quiz" && (
                <small>
                  {" "}
                  <I18nText text={"(optional)"} />{" "}
                </small>
              )}
              <input
                required={kind === "quiz"}
                maxLength={40}
                placeholder={translate(language, "Your name")}
                value={data.from}
                onChange={(e) => update("from", e.target.value)}
              />
            </label>
          </div>
          <label>
            <I18nText
              text={kind === "envelope" ? "Open when…" : "Choose a category"}
            />
            <select
              value={data.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {categories[kind].map((c) => (
                <option key={c} value={c}>
                  <I18nText text={c} />
                </option>
              ))}
            </select>
          </label>
          {kind !== "quiz" && (
            <>
              <fieldset>
                <legend>
                  {" "}
                  <I18nText text={"What’s the feeling?"} />{" "}
                </legend>
                <div className="chips">
                  {tones.map((t) => (
                    <button
                      type="button"
                      aria-pressed={data.tone === t}
                      className={data.tone === t ? "chip selected" : "chip"}
                      key={t}
                      onClick={() => update("tone", t)}
                    >
                      <I18nText text={t} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                {" "}
                <I18nText text={"Your message"} />{" "}
                <textarea
                  rows={5}
                  maxLength={700}
                  required
                  value={data.message}
                  onChange={(e) => update("message", e.target.value)}
                />
                <span className="field-meta">
                  {data.message.length}{" "}
                  <I18nText text={"/700 · A little goes a long way."} />{" "}
                </span>
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  update(
                    "message",
                    template(language, data.category, data.tone),
                  )
                }
              >
                <Sparkles size={16} /> <I18nText text={"Try a"} />{" "}
                <I18nText text={data.tone} /> <I18nText text={"message"} />{" "}
              </button>
            </>
          )}
          {kind === "quiz" && (
            <div className="quiz-editor">
              {data.questions?.map((q, i) => (
                <fieldset key={i}>
                  <legend>
                    {" "}
                    <I18nText text={"Question"} /> {i + 1}
                  </legend>
                  <label>
                    {" "}
                    <I18nText text={"Question"} />{" "}
                    <input
                      value={q.prompt}
                      maxLength={120}
                      required
                      onChange={(e) =>
                        changeQuestion(i, { prompt: e.target.value })
                      }
                    />
                  </label>
                  <p className="field-meta">
                    {" "}
                    <I18nText
                      text={"Select the circle beside the correct answer."}
                    />{" "}
                  </p>
                  {q.options.map((option, j) => (
                    <div className="answer-editor" key={j}>
                      <input
                        type="radio"
                        aria-label={`Correct answer ${j + 1} for question ${i + 1}`}
                        name={`answer-${i}`}
                        checked={q.answer === j}
                        onChange={() => changeQuestion(i, { answer: j })}
                      />
                      <label className="sr-only" htmlFor={`q${i}a${j}`}>
                        {" "}
                        <I18nText text={"Question"} /> {i + 1}, answer {j + 1}
                      </label>
                      <input
                        id={`q${i}a${j}`}
                        required
                        maxLength={60}
                        value={option}
                        onChange={(e) =>
                          changeQuestion(i, {
                            options: q.options.map((v, k) =>
                              k === j ? e.target.value : v,
                            ),
                          })
                        }
                      />
                    </div>
                  ))}
                  {i >= 5 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        update(
                          "questions",
                          data.questions?.filter((_, j) => j !== i),
                        )
                      }
                    >
                      {" "}
                      <I18nText text={"Remove question"} />{" "}
                    </button>
                  )}
                </fieldset>
              ))}
              {(data.questions?.length ?? 0) < 10 && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    update("questions", [
                      ...(data.questions ?? []),
                      {
                        prompt: "What is my favorite little thing?",
                        options: ["Coffee", "Sunsets", "Music", "Books"],
                        answer: 0,
                      },
                    ])
                  }
                >
                  {" "}
                  <I18nText text={"Add a question"} />{" "}
                </button>
              )}
            </div>
          )}
          {kind === "hearts" && (
            <p className="field-meta">
              <I18nText
                text={
                  "They’ll need to catch 10 hearts in 20 seconds to unlock this message."
                }
              />
            </p>
          )}
          {kind === "future" && (
            <>
              <label>
                <I18nText text={"Open on"} />
                <input
                  type="date"
                  required
                  min={localDate(1)}
                  value={data.unlockAt ?? ""}
                  onChange={(e) => update("unlockAt", e.target.value)}
                />
              </label>
              <p className="field-meta">
                <I18nText
                  text={
                    "The date lock works on their device. The letter travels inside the link, so it isn’t a guaranteed time-lock — that would need a server."
                  }
                />
              </p>
            </>
          )}
          {kind === "stars" && (
            <fieldset className="list-editor">
              <legend>
                <I18nText text={"Hidden star messages"} />
              </legend>
              <p className="field-meta">
                <I18nText
                  text={
                    "3 to 9 little notes. Your main message appears once every star is found."
                  }
                />
              </p>
              {data.stars?.map((note, i) => (
                <div className="list-row" key={i}>
                  <span aria-hidden="true" className="list-mark">
                    ✦
                  </span>
                  <input
                    required
                    maxLength={120}
                    aria-label={translate(language, "Star {n}", {
                      n: String(i + 1),
                    })}
                    value={note}
                    onChange={(e) =>
                      update(
                        "stars",
                        data.stars?.map((v, j) =>
                          j === i ? e.target.value : v,
                        ),
                      )
                    }
                  />
                  {(data.stars?.length ?? 0) > 3 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        update(
                          "stars",
                          data.stars?.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <I18nText text={"Remove"} />
                    </button>
                  )}
                </div>
              ))}
              {(data.stars?.length ?? 0) < 9 && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => update("stars", [...(data.stars ?? []), "✨"])}
                >
                  <I18nText text={"Add a star"} />
                </button>
              )}
            </fieldset>
          )}
          {kind === "bingo" && (
            <fieldset className="list-editor">
              <legend>
                <I18nText text={"Bingo squares"} />
              </legend>
              <p className="field-meta">
                <I18nText
                  text={
                    "Nine funny little questions. They tap every square where the answer is them."
                  }
                />
              </p>
              <div className="bingo-editor">
                {data.bingo?.map((square, i) => (
                  <input
                    key={i}
                    required
                    maxLength={60}
                    aria-label={translate(language, "Square {n}", {
                      n: String(i + 1),
                    })}
                    value={square}
                    onChange={(e) =>
                      update(
                        "bingo",
                        data.bingo?.map((v, j) =>
                          j === i ? e.target.value : v,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend>
              {" "}
              <I18nText text={"A little color"} />{" "}
            </legend>
            <div className="theme-options">
              {themes.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  aria-label={translate(language, label)}
                  aria-pressed={data.theme === value}
                  title={translate(language, label)}
                  className={`swatch theme-${value} ${data.theme === value ? "selected" : ""}`}
                  onClick={() => update("theme", value)}
                >
                  {data.theme === value && <Check size={18} />}
                </button>
              ))}
            </div>
            <p className="field-meta">
              <I18nText
                text={themes.find(([value]) => value === data.theme)?.[1] ?? ""}
              />
            </p>
          </fieldset>
          {error && (
            <p className="error" role="alert">
              <I18nText text={error} />
            </p>
          )}
          <button className="button full" type="submit">
            {" "}
            <I18nText text={"Preview my surprise"} /> <Heart size={17} />
          </button>
          <div className="draft-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                try {
                  localStorage.setItem(
                    "heartpop-draft",
                    JSON.stringify({ ...data, language }),
                  );
                  setNotice("Draft saved on this device only.");
                } catch {
                  setNotice("Your browser could not save the draft.");
                }
              }}
            >
              {" "}
              <I18nText text={"Save draft"} />{" "}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                try {
                  const draft = payloadSchema.parse(
                    JSON.parse(
                      localStorage.getItem("heartpop-draft") ?? "null",
                    ),
                  );
                  if (draft.kind !== kind) throw new Error();
                  setData(draft);
                  setNotice("Draft restored.");
                } catch {
                  setNotice("No valid draft for this experience.");
                }
              }}
            >
              {" "}
              <I18nText text={"Restore"} />{" "}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                localStorage.removeItem("heartpop-draft");
                setNotice("Saved draft deleted.");
              }}
            >
              {" "}
              <I18nText text={"Delete"} />{" "}
            </button>
          </div>
          <p className="field-meta" role="status">
            <I18nText
              text={
                notice || "Drafts stay on this device only when you save them."
              }
            />
          </p>
        </form>
        <aside className="preview-column">
          <div className="preview-title">
            <span>
              {" "}
              <I18nText text={"THEIR LITTLE MOMENT"} />{" "}
            </span>
            <span className="preview-badge">
              {" "}
              <I18nText text={"Live preview"} />{" "}
            </span>
          </div>
          <Preview key={`${kind}-${data.theme}`} data={data} peek />
          <p className="preview-footnote">
            {" "}
            <I18nText
              text={"Made by you. Delivered with a little HeartPop magic."}
            />{" "}
          </p>
          {savedLetters.length > 0 && (
            <div className="saved-letters">
              <h3>
                <I18nText text={"Letters saved on this device"} />
              </h3>
              <ul>
                {savedLetters.map((l) => (
                  <li key={l.token}>
                    <Link to={`/surprise/${l.token}`}>
                      <I18nText
                        text={"For {name} · opens {date}"}
                        values={{
                          name: l.to,
                          date: new Intl.DateTimeFormat(dateLocale(language), {
                            dateStyle: "medium",
                          }).format(new Date(`${l.unlockAt}T00:00:00`)),
                        }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="privacy-note">
            <Heart size={18} />
            <p>
              {" "}
              <I18nText
                text={
                  "No account, no stored messages. Your link holds the surprise. Please leave sensitive details out."
                }
              />{" "}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
function Share({ data }: { data: Payload }) {
  const [notice, setNotice] = useState("");
  const url = shareUrl(data);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied. Go make their day!");
    } catch {
      setNotice("Copy isn’t available. Select and copy the link below.");
    }
  }
  async function nativeShare() {
    try {
      await navigator.share({ title: "A little surprise for you ♡", url });
      setNotice("Sharing opened.");
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError"))
        setNotice("Device sharing isn’t available. Copy the link instead.");
    }
  }
  return (
    <main className="share-page">
      <div className="success-icon">
        <Check size={32} />
      </div>
      <span className="eyebrow">
        {" "}
        <I18nText text={"A LITTLE HAPPINESS, READY TO GO"} />{" "}
      </span>
      <h1>
        {" "}
        <I18nText text={"Now, make"} /> {data.to}{" "}
        <I18nText text={"smile."} />{" "}
      </h1>
      <p>
        {" "}
        <I18nText
          text={"Your surprise is wrapped up and ready for their screen."}
        />{" "}
      </p>
      <div className="share-box">
        <label>
          {" "}
          <I18nText text={"Your surprise link"} />{" "}
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <button className="button full" onClick={copyLink}>
          <Copy size={18} /> <I18nText text={"Copy surprise link"} />{" "}
        </button>
        <div className="share-actions">
          <a
            className="button secondary"
            href={`https://wa.me/?text=${encodeURIComponent(`A little surprise for you ♡ ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
          {typeof navigator.share === "function" && (
            <button className="button secondary" onClick={nativeShare}>
              <Share2 size={17} /> <I18nText text={"More options"} />{" "}
            </button>
          )}
        </div>
        {data.kind === "future" && (
          <button
            type="button"
            className="button secondary full"
            onClick={() => {
              try {
                const token = encodePayload(data);
                const list = readSavedLetters().filter(
                  (l) => l.token !== token,
                );
                localStorage.setItem(
                  SAVED_LETTERS,
                  JSON.stringify(
                    [{ to: data.to, unlockAt: data.unlockAt, token }, ...list].slice(
                      0,
                      20,
                    ),
                  ),
                );
                setNotice(
                  "Saved on this device. Find it again on the Future Love Letter page.",
                );
              } catch {
                setNotice("Your browser could not save the draft.");
              }
            }}
          >
            <I18nText text={"Save on this device"} />
          </button>
        )}
        <p role="status">
          <I18nText text={notice} />
        </p>
        <p className="field-meta">
          {" "}
          <I18nText
            text={
              "Anyone with this link can open it. It is not encrypted and cannot be revoked. Quiz answers are included in the link. Avoid sensitive content."
            }
          />{" "}
        </p>
        {url.length > 4000 && (
          <p className="error">
            {" "}
            <I18nText
              text={
                "This is a long link. Some messaging apps may truncate it. Test the copied link before sending."
              }
            />{" "}
          </p>
        )}
      </div>
      <Link className="text-link" to={`/surprise/${encodePayload(data)}`}>
        {" "}
        <I18nText text={"Open the recipient experience"} />{" "}
      </Link>
      <Link className="text-link" to="/explore">
        {" "}
        <I18nText text={"Create another little moment"} />{" "}
      </Link>
    </main>
  );
}
function QuizPlayer({ data }: { data: Payload }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const navigate = useNavigate();
  const questions = data.questions!;
  const q = questions[answers.length];
  return (
    <div className="quiz-player">
      <p>How well do you know {data.from || "me"}?</p>
      <progress max={questions.length} value={answers.length} />
      <span className="eyebrow">
        {" "}
        <I18nText text={"QUESTION"} /> {answers.length + 1}{" "}
        <I18nText text={"OF"} /> {questions.length}
      </span>
      <h2>{q.prompt}</h2>
      <div className="quiz-choices">
        {q.options.map((option, i) => (
          <button
            key={i}
            className="button secondary"
            onClick={() => {
              const next = [...answers, i];
              if (next.length === questions.length)
                navigate(`/results/${encodePayload(data)}`, {
                  state: { answers: next },
                });
              else setAnswers(next);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
export default function Experience({
  mode = "create",
}: {
  mode?: "create" | "preview" | "share" | "recipient" | "results";
}) {
  const { kind, token } = useParams();
  const { setLanguage } = useLanguage();
  useEffect(() => {
    if (!token) return;
    try {
      setLanguage(decodePayload(token).language);
    } catch {
      /* The route renders a readable invalid-link error below. */
    }
  }, [token, setLanguage]);
  const location = useLocation();
  const [reaction, setReaction] = useState("");
  if (mode === "create") {
    if (!(experienceKinds as readonly string[]).includes(kind ?? ""))
      return (
        <main className="prose">
          <h1>
            {" "}
            <I18nText text={"That experience doesn’t exist."} />{" "}
          </h1>
          <Link to="/explore">
            {" "}
            <I18nText text={"Explore experiences"} />{" "}
          </Link>
        </main>
      );
    return <Creator key={kind} kind={kind as Payload["kind"]} />;
  }
  let data: Payload;
  try {
    data = decodePayload(token ?? "");
  } catch (err) {
    return (
      <main className="prose">
        <h1>
          {" "}
          <I18nText text={"This surprise needs a little help."} />{" "}
        </h1>
        <p role="alert">{(err as Error).message}</p>
        <Link className="button" to="/explore">
          {" "}
          <I18nText text={"Create a new surprise"} />{" "}
        </Link>
      </main>
    );
  }
  if (mode === "share") return <Share data={data} />;
  if (mode === "results") {
    const answers = location.state?.answers as number[] | undefined;
    if (!answers || !data.questions || answers.length !== data.questions.length)
      return (
        <main className="share-page">
          <h1>
            {" "}
            <I18nText text={"Your next little challenge awaits."} />{" "}
          </h1>
          <Link className="button" to={`/surprise/${token}`}>
            {" "}
            <I18nText text={"Take the quiz"} />{" "}
          </Link>
        </main>
      );
    const score = scoreQuiz(data.questions, answers);
    return (
      <main className="share-page">
        <ConfettiEffect />
        <span className="big-heart">♡</span>
        <h1>
          {score === data.questions.length
            ? "You know the little things!"
            : "There’s always more to discover."}
        </h1>
        <div className="score">
          {score}
          <span> / {data.questions.length}</span>
        </div>
        <p>
          {" "}
          <I18nText
            text={"Every answer is another conversation waiting to happen."}
          />{" "}
        </p>
        <p className="field-meta">
          {" "}
          <I18nText
            text={"Just for fun — not a measure of your relationship."}
          />{" "}
        </p>
        <button
          className="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `I got ${score}/${data.questions!.length} on ${data.from}'s HeartPop quiz!`,
              );
              setReaction("Result copied!");
            } catch {
              setReaction(
                `I got ${score}/${data.questions!.length} on ${data.from}'s HeartPop quiz!`,
              );
            }
          }}
        >
          {" "}
          <I18nText text={"Copy result summary"} />{" "}
        </button>
        <p role="status">{reaction}</p>
        <Link className="text-link" to={`/surprise/${token}`}>
          {" "}
          <I18nText text={"Play again"} />{" "}
        </Link>
      </main>
    );
  }
  return (
    <main className="recipient-page">
      <span className="eyebrow">
        <I18nText
          text={
            mode === "preview"
              ? "A SNEAK PEEK OF THEIR SMILE"
              : "SOMEONE IS THINKING OF YOU"
          }
        />
      </span>
      <h1>
        {mode === "preview"
          ? "A little preview, a lot of feeling."
          : `Hey ${data.to}, this one’s for you.`}
      </h1>
      {mode === "recipient" && data.kind === "quiz" ? (
        <QuizPlayer key={token} data={data} />
      ) : (
        <Preview data={data} peek={mode === "preview"} />
      )}{" "}
      {mode === "preview" ? (
        <div>
          <Link className="button" to={`/share/${token}`}>
            {" "}
            <I18nText text={"Create & share surprise"} /> <Share2 size={17} />
          </Link>
          <br />
          <Link
            className="text-link"
            to={`/create/${data.kind}`}
            state={{ draft: data }}
          >
            {" "}
            <I18nText text={"Keep editing"} />{" "}
          </Link>
        </div>
      ) : (
        <>
          <div className="reactions">
            <p>
              {" "}
              <I18nText text={"How did that make you feel?"} />{" "}
            </p>
            {["Loved ♡", "Smiling ☺", "Big hug"].map((r) => (
              <button
                key={r}
                className="chip"
                aria-pressed={reaction === r}
                onClick={() => setReaction(r)}
              >
                <I18nText text={r}/>
              </button>
            ))}
            <p role="status" className="field-meta">
              <I18nText
                text={
                  reaction
                    ? "A little feeling, kept here on your screen. Reactions are not sent to the creator."
                    : ""
                }
              />
            </p>
          </div>
          <Link className="text-link" to="/explore">
            {" "}
            <I18nText
              text={"Pass a little happiness on · Create your own"}
            />{" "}
          </Link>
        </>
      )}
    </main>
  );
}

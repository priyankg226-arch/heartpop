import { I18nText } from "./i18n/react";
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Heart,
  House,
  ArrowUp,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Gift,
  Smile,
} from "lucide-react";
import { MotionConfig } from "motion/react";
import { copy, type Language } from "./i18n";
import { LanguageContext, useLanguage } from "./i18n/react";
import { readLanguage, translate } from "./i18n/ui";
export { useLanguage } from "./i18n/react";
import { HeartArt, MiniArt } from "./components/Art";
import { LanguageMenu } from "./components/LanguageMenu";
import { useScrollReveal } from "./lib/scrollReveal";
const Experience = lazy(() => import("./pages/Experience"));
const Roulette = lazy(() => import("./pages/Roulette"));
const CoupleGamesHub = lazy(() => import("./features/couple-games/CoupleGamesHub"));
const CoupleGameRoute = lazy(() => import("./features/couple-games/CoupleGameRoute"));
export const experiences = [
  {
    kind: "envelope",
    group: "words",
    name: "Open When…",
    description: "A little letter for the moment they need it most.",
    tag: "A HUG IN AN ENVELOPE",
    color: "pink",
    label: "Create a letter",
  },
  {
    kind: "scratch",
    group: "words",
    name: "Scratch My Heart",
    description: "Hide something sweet. Let them uncover the magic.",
    tag: "A LITTLE MYSTERY",
    color: "lavender",
    label: "Make a scratch card",
  },
  {
    kind: "roulette",
    group: "games",
    name: "Love Roulette",
    description: "Give the wheel a spin. Make a memory together.",
    tag: "LET FATE MAKE IT FUN",
    color: "peach",
    label: "Let’s play",
  },
  {
    kind: "quiz",
    group: "games",
    name: "How Well Do You Know Me?",
    description: "Inside jokes, little favorites. Put your bond to the test.",
    tag: "THE ULTIMATE FRIEND CHECK",
    color: "mint",
    label: "Create a quiz",
  },
  {
    kind: "message",
    group: "words",
    name: "Cute Message Studio",
    description: "Find the words. Add your heart. Make their day.",
    tag: "WORDS WITH A LITTLE HEART",
    color: "gold",
    label: "Write a message",
  },
  {
    kind: "stars",
    group: "words",
    name: "Message in the Stars",
    description:
      "Hide sweet notes in a night sky. Every star tells a little story.",
    tag: "A SKY FULL OF SECRETS",
    color: "lavender",
    label: "Write in the stars",
  },
  {
    kind: "hearts",
    group: "games",
    name: "Catch My Heart",
    description: "A 20-second heart-catching game with a sweet prize.",
    tag: "PLAY FOR A SURPRISE",
    color: "pink",
    label: "Make the game",
  },
  {
    kind: "future",
    group: "words",
    name: "Future Love Letter",
    description: "Write today. Let it open on a day that matters.",
    tag: "A LETTER FOR LATER",
    color: "peach",
    label: "Write a future letter",
  },
  {
    kind: "bingo",
    group: "games",
    name: "Couple Bingo",
    description: "Funny little truths about you two. Three in a row wins!",
    tag: "FOR COUPLES & BESTIES",
    color: "mint",
    label: "Make a bingo card",
  },
];
function Navbar() {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useScrollReveal(location.pathname);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  // Already on the home page? Glide back up to the main block instead.
  const goHome = () => {
    setMenu(false);
    if (location.pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
    <header className="navbar">
      <Link className="brand" to="/" aria-label="HeartPop home" onClick={goHome}>
        <span className="brand-icon">
          <Heart size={22} fill="currentColor" />
        </span>
        heartpop<span className="brand-dot">.</span>
      </Link>
      <button
        className="mobile-toggle"
        aria-label="Toggle navigation"
        aria-expanded={menu}
        onClick={() => setMenu(!menu)}
      >
        {menu ? <X /> : <Menu />}
      </button>
      <nav
        className={menu ? "nav-links open" : "nav-links"}
        aria-label="Main navigation"
      >
        <NavLink to="/" end className="nav-home" onClick={goHome}>
          <House size={16} /> <I18nText text={"Home"} />
        </NavLink>
        <NavLink to="/explore">
          {" "}
          <I18nText text={"Explore experiences"} />{" "}
        </NavLink>
        <NavLink to="/roulette">
          {" "}
          <I18nText text={"Fun & games"} />{" "}
        </NavLink>
        <NavLink to="/couple-games">
          {" "}
          <I18nText text={"Couple games"} />{" "}
        </NavLink>
        <NavLink to="/about">
          {" "}
          <I18nText text={"Our little story"} />{" "}
        </NavLink>
      </nav>
      <div className="nav-actions">
        <LanguageMenu />
        <Link className="button small" to="/explore">
          {" "}
          <I18nText text={"Create a surprise"} /> <Heart size={15} />
        </Link>
      </div>
    </header>
    <BackToTop />
    </>
  );
}
function BackToTop() {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      className={`back-to-top${show ? " visible" : ""}`}
      aria-label={translate(language, "Back to top")}
      title={translate(language, "Back to top")}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("main")?.focus({ preventScroll: true });
      }}
    >
      <ArrowUp size={20} />
    </button>
  );
}
const experienceGroups = [
  {
    id: "words",
    icon: "✉",
    title: "Letters & secrets",
    subtitle: "Words to open, uncover and keep.",
  },
  {
    id: "games",
    icon: "✦",
    title: "Games & challenges",
    subtitle: "Play together. Win a little love.",
  },
] as const;
function ExperienceGroups() {
  return (
    <div className="experience-groups">
      {experienceGroups.map((group) => {
        const items = experiences.filter((e) => e.group === group.id);
        return (
          <div className={`experience-group ${group.id}`} key={group.id}>
            <div className="group-heading">
              <span className="group-icon" aria-hidden="true">
                {group.icon}
              </span>
              <div>
                <h3>
                  <I18nText text={group.title} />
                </h3>
                <p>
                  <I18nText text={group.subtitle} />
                </p>
              </div>
              <span className="group-count">{items.length}</span>
            </div>
            <div className="experience-grid">
              {items.map((item) => (
                <ExperienceCard key={item.kind} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function ExperienceCard({ item }: { item: (typeof experiences)[number] }) {
  return (
    <Link
      to={item.kind === "roulette" ? "/roulette" : `/create/${item.kind}`}
      className={`experience-card ${item.color}`}
    >
      <div className="card-art">
        <MiniArt kind={item.kind} />
        <span className="card-corner">♡</span>
      </div>
      <div className="card-content">
        <span className="eyebrow">
          <I18nText text={item.tag} />
        </span>
        <h3>
          <I18nText text={item.name} />
        </h3>
        <p>
          <I18nText text={item.description} />
        </p>
        <span className="card-link">
          <I18nText text={item.label} /> <span>+</span>
        </span>
      </div>
    </Link>
  );
}
function Home() {
  const { language } = useLanguage();
  const t = copy[language];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="pill">
            <span>✦</span> {t.eyebrow}
          </div>
          <h1>
            {t.headline.split("\n")[0]}
            <br />
            <em>{t.headline.split("\n")[1]}</em>
            <span className="headline-heart">♡</span>
          </h1>
          <p>{t.subtitle}</p>
          <div className="hero-actions">
            <Link className="button" to="/explore">
              {t.create}
              <Gift size={18} />
            </Link>
            <Link className="button secondary" to="/roulette">
              {t.explore}
            </Link>
          </div>
          <div className="hero-notes">
            <span>
              <ShieldCheck size={15} />{" "}
              <I18nText text={"No sign-up. No fuss."} />{" "}
            </span>
            <span>
              <Heart size={15} /> <I18nText text={"Free, with love."} />{" "}
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <span className="doodle-note">
            {" "}
            <I18nText text={"a little thought."} /> <br />{" "}
            <I18nText text={"a whole lot of love."} />{" "}
          </span>
          <HeartArt />
          <span className="floating-note">
            <span>♡</span> <I18nText text={"Someone’s about to smile."} />{" "}
          </span>
          <span className="hero-spark">✧</span>
        </div>
      </section>
      <div className="occasion-strip">
        <span>
          {" "}
          <I18nText text={"FOR YOUR FAVORITE PEOPLE"} />{" "}
        </span>
        <span>
          {" "}
          <I18nText text={"♡ Your person"} />{" "}
        </span>
        <span>
          {" "}
          <I18nText text={"✦ Your bestie"} />{" "}
        </span>
        <span>
          {" "}
          <I18nText text={"☺ Your family"} />{" "}
        </span>
        <span>
          {" "}
          <I18nText text={"♡ Just because"} />{" "}
        </span>
      </div>
      <section className="section" id="experiences">
        <div className="section-heading">
          <div className="eyebrow">
            {" "}
            <I18nText text={"SMALL GESTURES. BIG FEELINGS."} />{" "}
          </div>
          <h2>
            {" "}
            <I18nText text={"There’s a little something for everyone."} />{" "}
          </h2>
          <p>
            {" "}
            <I18nText
              text={"Pick a surprise. Make it yours. Send a little happiness."}
            />{" "}
          </p>
        </div>
        <ExperienceGroups />
      </section>
      <section className="how-section">
        <div className="section-heading">
          <span className="eyebrow">
            {" "}
            <I18nText text={"FROM YOUR HEART TO THEIR SCREEN"} />{" "}
          </span>
          <h2>
            {" "}
            <I18nText text={"A smile is just three little steps away."} />{" "}
          </h2>
        </div>
        <div className="steps">
          {[
            [
              Gift,
              "Pick a little surprise",
              "A letter, a game, a secret. What feels like you?",
            ],
            [
              Sparkles,
              "Make it personal",
              "Their name, your words, a little sprinkle of love.",
            ],
            [
              Smile,
              "Send the happy",
              "Share a link and let the little moment unfold.",
            ],
          ].map(([Icon, title, desc], i) => {
            const StepIcon = Icon as typeof Gift;
            return (
              <div key={i}>
                <span className={`step-icon step-${i}`}>
                  <StepIcon size={26} />
                </span>
                <h3>
                  <I18nText text={title as string} />
                </h3>
                <p>
                  <I18nText text={desc as string} />
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="promise-section">
        <div>
          <span className="eyebrow">
            {" "}
            <I18nText text={"MADE FOR THE LITTLE MOMENTS"} />{" "}
          </span>
          <h2>
            {" "}
            <I18nText text={"No grand gesture required."} /> <br />{" "}
            <I18nText text={"Just a little heart."} />{" "}
          </h2>
          <p>
            {" "}
            <I18nText
              text={
                "A “thinking of you” on a Tuesday. A laugh across the miles. A tiny reminder that someone matters. That’s what HeartPop is for."
              }
            />{" "}
          </p>
          <Link to="/create/envelope" className="text-link">
            {" "}
            <I18nText text={"Make someone’s day ♡"} />{" "}
          </Link>
        </div>
        <div className="promise-cards">
          <article>
            <ShieldCheck />
            <h3>
              {" "}
              <I18nText text={"Your moments stay yours"} />{" "}
            </h3>
            <p>
              {" "}
              <I18nText
                text={
                  "No accounts, trackers, or stored messages on our servers."
                }
              />{" "}
            </p>
          </article>
          <article>
            <Heart />
            <h3>
              {" "}
              <I18nText text={"Made for every kind of love"} />{" "}
            </h3>
            <p>
              {" "}
              <I18nText
                text={"Partners, friends, family. There’s room for everyone."}
              />{" "}
            </p>
          </article>
        </div>
      </section>
      <section className="faq section">
        <div className="section-heading">
          <h2>
            {" "}
            <I18nText text={"A few little things you might wonder."} />{" "}
          </h2>
        </div>
        {[
          [
            "Is HeartPop really free?",
            "Yes. Every experience works without payment, subscriptions, or an account.",
          ],
          [
            "How does sharing work?",
            "Your surprise is encoded directly into its link. Copy it or share it through your favorite messaging app. Anyone with the link can read it.",
          ],
          [
            "Do I need to download an app?",
            "No. HeartPop runs in your browser. You can also install it on supported devices for offline access after your first visit.",
          ],
          [
            "Are my messages private?",
            "We do not store personal messages on a server. Links are not encrypted, so avoid sensitive information. They can remain in browser history and be forwarded.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              <I18nText text={q} />
              <span>+</span>
            </summary>
            <p>
              <I18nText text={a} />
            </p>
          </details>
        ))}
      </section>
      <section className="bottom-cta">
        <span>♡</span>
        <h2>
          {" "}
          <I18nText text={"Someone’s day could use a little you."} />{" "}
        </h2>
        <Link className="button" to="/explore">
          {" "}
          <I18nText text={"Create a surprise"} /> <Sparkles size={17} />
        </Link>
        <p>
          {" "}
          <I18nText text={"A little thought goes a long way."} />{" "}
        </p>
      </section>
    </>
  );
}
function Explore() {
  return (
    <main className="section explore">
      <div className="section-heading">
        <span className="eyebrow">
          {" "}
          <I18nText text={"A LITTLE HAPPINESS STARTS HERE"} />{" "}
        </span>
        <h1>
          {" "}
          <I18nText text={"What will you send today?"} />{" "}
        </h1>
        <p>
          {" "}
          <I18nText
            text={"Nine ways to turn “thinking of you” into something special."}
          />{" "}
        </p>
      </div>
      <ExperienceGroups />
    </main>
  );
}
function Info({ page }: { page: string }) {
  return (
    <main className="prose">
      <span className="eyebrow">HEARTPOP, WITH LOVE</span>
      <h1>
        {page === "about"
          ? "A little thought can change a day."
          : page === "privacy"
            ? "Your privacy matters."
            : "A few kind ground rules."}
      </h1>
      {page === "about" ? (
        <>
          <p>
            HeartPop is a small collection of thoughtful, playful ways to
            connect. Send a letter for a hard day, hide a compliment, or make a
            game out of your favorite memories.
          </p>
          <p>
            All five experiences are free to use. No account, paid API, or media
            upload is needed. Our illustrations are original and our templates
            work on your device.
          </p>
        </>
      ) : page === "privacy" ? (
        <>
          <p>
            HeartPop does not use analytics, tracking cookies, accounts, or a
            database for your messages. Your surprise is encoded in the URL
            fragment and decoded on the recipient’s device.
          </p>
          <h2>Links are not encrypted</h2>
          <p>
            Anyone with a link can read its content, including quiz answer keys.
            Links may remain in browser history, screenshots, clipboard history,
            and messaging apps. Do not include sensitive information. A sent
            link cannot be remotely revoked.
          </p>
          <h2>Local data and offline use</h2>
          <p>
            We cache app files for offline use. Drafts are saved on this device
            only when you choose “Save draft”. Your hosting provider may process
            ordinary network request information. WhatsApp and device sharing
            are optional external services with their own privacy policies.
          </p>
          <button
            className="button secondary"
            onClick={() => {
              localStorage.removeItem("heartpop-draft");
              window.alert("HeartPop drafts cleared from this device.");
            }}
          >
            Clear local drafts
          </button>
          <p>
            To remove cached app files, clear this site’s data in your browser
            settings.
          </p>
        </>
      ) : (
        <>
          <p>
            Use HeartPop with kindness. Do not share harassment, threats,
            illegal content, or private information without consent.
          </p>
          <p>
            Games and scores are entertainment only. They are not scientific
            assessments of relationships or compatibility.
          </p>
          <p>
            You are responsible for what you share. Experiences are supplied as
            available without a guarantee of uninterrupted availability. Hosting
            and custom domains may have costs; local development requires no
            payment.
          </p>
        </>
      )}
      <Link className="text-link" to="/explore">
        Find your next little surprise ♡
      </Link>
    </main>
  );
}
function Footer() {
  return (
    <footer>
      <div>
        <Link className="brand" to="/">
          <Heart fill="currentColor" size={23} /> heartpop.
        </Link>
        <p>
          {" "}
          <I18nText text={"Little surprises, big smiles."} />{" "}
        </p>
      </div>
      <div>
        <Link to="/about">
          {" "}
          <I18nText text={"About"} />{" "}
        </Link>
        <Link to="/privacy">
          {" "}
          <I18nText text={"Privacy"} />{" "}
        </Link>
        <Link to="/terms">
          {" "}
          <I18nText text={"Terms"} />{" "}
        </Link>
        <span>
          {" "}
          <I18nText text={"Made with a little extra love ♡"} />{" "}
        </span>
      </div>
    </footer>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="prose">
        <h1>Something went a little sideways.</h1>
        <p>Your browser may not support this feature. Reload to try again.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload HeartPop
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [language, setLanguage] = useState<Language>(readLanguage);
  useEffect(() => {
    try {
      localStorage.setItem("heartpop-language", language);
    } catch {
      /* Keep working when storage is disabled. */
    }
    document.documentElement.lang =
      language === "hinglish"
        ? "hi-Latn"
        : language === "roman-gu"
          ? "gu-Latn"
          : language;
  }, [language]);
  return (
    <ErrorBoundary>
      <LanguageContext.Provider value={{ language, setLanguage }}>
        <MotionConfig reducedMotion="user">
          <HashRouter>
            <a className="skip-link" href="#main">
              {" "}
              <I18nText text={"Skip to content"} />{" "}
            </a>
            <Navbar />
            <div id="main" tabIndex={-1}>
              <Suspense
                fallback={
                  <main className="prose" role="status">
                    Unfolding a little happiness…
                  </main>
                }
              >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/create/:kind" element={<Experience />} />
                  <Route
                    path="/preview/:token"
                    element={<Experience mode="preview" />}
                  />
                  <Route
                    path="/share/:token"
                    element={<Experience mode="share" />}
                  />
                  <Route
                    path="/surprise/:token"
                    element={<Experience mode="recipient" />}
                  />
                  <Route
                    path="/results/:token"
                    element={<Experience mode="results" />}
                  />
                  <Route path="/roulette" element={<Roulette />} />
                  <Route path="/couple-games" element={<CoupleGamesHub />} />
                  <Route path="/couple-games/:gameId/*" element={<CoupleGameRoute />} />
                  {["about", "privacy", "terms"].map((page) => (
                    <Route
                      key={page}
                      path={`/${page}`}
                      element={<Info page={page} />}
                    />
                  ))}
                  <Route
                    path="*"
                    element={
                      <main className="prose">
                        <h1>This little page wandered off.</h1>
                        <Link className="button" to="/">
                          {" "}
                          <I18nText text={"Take me home"} />{" "}
                        </Link>
                      </main>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
            <Footer />
          </HashRouter>
        </MotionConfig>
      </LanguageContext.Provider>
    </ErrorBoundary>
  );
}

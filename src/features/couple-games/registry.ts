/** Single source of truth for the couple games: hub cards, filters and routes. */
export const COUPLE_GAME_IDS = [
  "guess-my-feelings",
  "love-memory-match",
  "you-vs-me",
  "our-dream-date",
  "love-truth-or-dare",
  "fix-our-heart",
  "send-me-a-hug",
  "find-my-love",
] as const;

export type CoupleGameId = (typeof COUPLE_GAME_IDS)[number];
export type PlayMode = "local" | "shareable";
export type GameCategory =
  | "creative"
  | "know"
  | "romantic"
  | "funny"
  | "puzzles";

export interface CoupleGameDefinition {
  id: CoupleGameId;
  title: string;
  emoji: string;
  description: string;
  category: GameCategory;
  route: string;
  estimatedMinutes: number;
  supportedModes: PlayMode[];
  color: "pink" | "lavender" | "peach" | "mint" | "gold";
  howToPlay: string[];
}

export const GAME_CATEGORIES: { id: GameCategory; label: string }[] = [
  { id: "creative", label: "Creative Together" },
  { id: "know", label: "Know Each Other" },
  { id: "romantic", label: "Romantic Moments" },
  { id: "funny", label: "Funny Challenges" },
  { id: "puzzles", label: "Puzzles & Surprises" },
];

export const COUPLE_GAMES: CoupleGameDefinition[] = [
  {
    id: "guess-my-feelings",
    title: "Guess My Feelings",
    emoji: "🥺",
    description: "Share a feeling with emoji clues. Can they guess it?",
    category: "know",
    route: "/couple-games/guess-my-feelings",
    estimatedMinutes: 5,
    supportedModes: ["local", "shareable"],
    color: "peach",
    howToPlay: [
      "Privately choose how you feel right now.",
      "Pick 2–5 emojis as clues and an optional hint.",
      "Your partner guesses the feeling.",
      "Reveal it and talk with a gentle prompt.",
    ],
  },
  {
    id: "love-memory-match",
    title: "Love Memory Match",
    emoji: "🧠",
    description: "Flip cards, find pairs, unlock sweet questions.",
    category: "puzzles",
    route: "/couple-games/love-memory-match",
    estimatedMinutes: 6,
    supportedModes: ["local"],
    color: "mint",
    howToPlay: [
      "Flip two cards at a time.",
      "Matching pairs stay face up.",
      "Every match unlocks a cute question to answer.",
      "In two-player mode, take turns and compare scores.",
    ],
  },
  {
    id: "you-vs-me",
    title: "You vs Me",
    emoji: "⚡",
    description: "Who says sorry first? Answer privately, then compare.",
    category: "funny",
    route: "/couple-games/you-vs-me",
    estimatedMinutes: 8,
    supportedModes: ["local", "shareable"],
    color: "gold",
    howToPlay: [
      "Choose a category and how many questions.",
      "Partner A answers privately.",
      "Pass the device. Partner B answers.",
      "Reveal together and see where you agree.",
    ],
  },
  {
    id: "our-dream-date",
    title: "Our Dream Date",
    emoji: "🌙",
    description: "Each plan your dream date, then see it combined.",
    category: "romantic",
    route: "/couple-games/our-dream-date",
    estimatedMinutes: 7,
    supportedModes: ["local", "shareable"],
    color: "lavender",
    howToPlay: [
      "Choose a place, time, food, activity and more.",
      "Your partner makes their own picks.",
      "See what you share and where you differ.",
      "Get a combined date and a sweet invitation.",
    ],
  },
  {
    id: "love-truth-or-dare",
    title: "Love Truth or Dare",
    emoji: "💋",
    description: "Kind, funny and romantic cards. Skipping is always OK.",
    category: "funny",
    route: "/couple-games/love-truth-or-dare",
    estimatedMinutes: 15,
    supportedModes: ["local"],
    color: "pink",
    howToPlay: [
      "Choose the categories you're comfortable with.",
      "Take turns picking Truth or Dare.",
      "Do it, or skip — there's never a penalty.",
      "See your session summary at the end.",
    ],
  },
  {
    id: "fix-our-heart",
    title: "Fix Our Heart",
    emoji: "🧩",
    description: "Put a heart back together, piece by sweet piece.",
    category: "puzzles",
    route: "/couple-games/fix-our-heart",
    estimatedMinutes: 5,
    supportedModes: ["local", "shareable"],
    color: "peach",
    howToPlay: [
      "Choose a difficulty and a heart design.",
      "Drag each piece to its spot (or use the keyboard).",
      "Every correct piece reveals a little message.",
      "Finish the heart for a final surprise.",
    ],
  },
  {
    id: "send-me-a-hug",
    title: "Send Me a Hug",
    emoji: "🤗",
    description: "Make a little virtual hug they can open anywhere.",
    category: "romantic",
    route: "/couple-games/send-me-a-hug",
    estimatedMinutes: 3,
    supportedModes: ["shareable"],
    color: "gold",
    howToPlay: [
      "Add your names and choose a hug theme.",
      "Write or pick a short message.",
      "Preview it and send the link.",
      "They bring two hearts together to open your hug.",
    ],
  },
  {
    id: "find-my-love",
    title: "Find My Love",
    emoji: "🔐",
    description: "Write clues about you two. They solve them to unlock a surprise.",
    category: "puzzles",
    route: "/couple-games/find-my-love",
    estimatedMinutes: 10,
    supportedModes: ["shareable", "local"],
    color: "mint",
    howToPlay: [
      "Write 3–7 clues only your partner would know.",
      "Add accepted answers and optional hints.",
      "Write a final surprise message and share.",
      "They follow the map to open the treasure chest.",
    ],
  },
];

export const gameById = (id: string) =>
  COUPLE_GAMES.find((game) => game.id === id);

export const isCoupleGameId = (id: string): id is CoupleGameId =>
  (COUPLE_GAME_IDS as readonly string[]).includes(id);

/** Filters hub cards by category and a free-text search over title and description. */
export function filterGames(
  games: CoupleGameDefinition[],
  category: GameCategory | "all",
  query: string,
  translateText: (text: string) => string = (text) => text,
) {
  const needle = query.trim().toLocaleLowerCase();
  return games.filter(
    (game) =>
      (category === "all" || game.category === category) &&
      (!needle ||
        [game.title, game.description, translateText(game.title), translateText(game.description)]
          .join(" ")
          .toLocaleLowerCase()
          .includes(needle)),
  );
}

/** Deterministic "featured" game that changes once per local day. */
export function featuredGame(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  const day = Math.floor((date.getTime() - start) / 86400000);
  return COUPLE_GAMES[day % COUPLE_GAMES.length];
}

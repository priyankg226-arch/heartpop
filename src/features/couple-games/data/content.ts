/* Curated, original content for the couple games. All entries are plain text. */

/* ---------- Guess My Feelings ---------- */
export const FEELING_EMOJI: Record<string, string> = {
  Happy: "😊",
  Excited: "🤩",
  "Missing you": "🥺",
  Nervous: "😬",
  Tired: "😴",
  Grateful: "🙏",
  Loved: "🥰",
  Frustrated: "😤",
  Lonely: "😔",
  Playful: "😜",
  Hopeful: "🌈",
  Overwhelmed: "😵",
};
export const CLUE_EMOJIS = [
  "😊", "😂", "🥰", "😍", "🤩", "😌", "😴", "🥱", "😔", "🥺", "😢", "😭",
  "😤", "😬", "😰", "😵", "🤯", "😜", "🙃", "🤗", "🙏", "💖", "💔", "💤",
  "☀️", "🌧️", "🌈", "⚡", "🔥", "🌙", "☕", "🍫", "🎉", "🎈", "🧸", "📚",
  "💼", "🏠", "✈️", "📱", "🎵", "🌸", "🐢", "🚀", "🧩", "💞", "💌", "🤍",
];
export const CONVERSATION_PROMPTS = [
  "What would make today a little better?",
  "What’s something you want us to do together?",
  "What’s one small thing I can do for you?",
  "What’s a happy memory we can revisit?",
  "What has been on your mind lately?",
  "What’s something you’re looking forward to?",
  "When did you last feel really heard by me?",
  "What would a cosy evening together look like right now?",
];
export const AFFECTION_RESPONSES = [
  "Sending you the biggest hug 🤗",
  "I’m right here with you 💞",
  "Want to talk about it over tea? ☕",
  "You make my day brighter ☀️",
  "Let’s do something fun together soon 🎈",
  "Thank you for telling me 💌",
];

/* ---------- Love Memory Match ---------- */
export const MEMORY_THEMES: Record<string, { label: string; symbols: [string, string][] }> = {
  hearts: {
    label: "Hearts",
    symbols: [
      ["💖", "sparkling heart"], ["💘", "heart with arrow"], ["💝", "heart with ribbon"], ["💗", "growing heart"],
      ["💓", "beating heart"], ["💞", "revolving hearts"], ["💕", "two hearts"], ["❤️", "red heart"],
      ["🧡", "orange heart"], ["💛", "yellow heart"], ["💜", "purple heart"], ["🤍", "white heart"],
    ],
  },
  flowers: {
    label: "Flowers",
    symbols: [
      ["🌹", "rose"], ["🌷", "tulip"], ["🌸", "cherry blossom"], ["🌻", "sunflower"], ["🌼", "daisy"], ["💐", "bouquet"],
      ["🌺", "hibiscus"], ["🍁", "maple leaf"], ["🌿", "herb"], ["🍀", "four-leaf clover"], ["🌱", "seedling"], ["🌵", "cactus"],
    ],
  },
  date: {
    label: "Date Night",
    symbols: [
      ["🍿", "popcorn"], ["🍕", "pizza"], ["🍝", "pasta"], ["🥂", "cheers"], ["🎬", "movie clapper"], ["🎡", "ferris wheel"],
      ["🕯️", "candle"], ["🎶", "music notes"], ["🍰", "cake"], ["🍦", "ice cream"], ["🎳", "bowling"], ["🚗", "car"],
    ],
  },
  animals: {
    label: "Cute Animals",
    symbols: [
      ["🐱", "cat"], ["🐶", "puppy"], ["🐼", "panda"], ["🐨", "koala"], ["🦊", "fox"], ["🐰", "bunny"],
      ["🐧", "penguin"], ["🦦", "otter"], ["🐻", "bear"], ["🐥", "chick"], ["🦄", "unicorn"], ["🐢", "turtle"],
    ],
  },
  romantic: {
    label: "Romantic Symbols",
    symbols: [
      ["💍", "ring"], ["💌", "love letter"], ["🌙", "moon"], ["⭐", "star"], ["🎁", "gift"], ["🍫", "chocolate"],
      ["💋", "kiss"], ["🧸", "teddy bear"], ["🎈", "balloon"], ["🌅", "sunset"], ["🗝️", "key"], ["💫", "dizzy star"],
    ],
  },
};
export const MEMORY_QUESTIONS = [
  "What’s a song that reminds you of us?",
  "What was your first impression of me?",
  "What’s a tiny thing I do that you love?",
  "Where would you take me on a surprise trip?",
  "What’s our funniest memory so far?",
  "What food will always remind you of me?",
  "What’s one thing you want us to learn together?",
  "What’s your favourite photo of us, and why?",
  "When did you first realise you liked me?",
  "What’s a perfect lazy day together?",
  "What’s a small dream you have for us this year?",
  "What compliment from me do you remember most?",
  "Which movie would be about our love story?",
  "What’s something new you’d like to try together?",
];

/* ---------- You vs Me ---------- */
export const YVM_CATEGORIES: Record<string, { label: string; questions: string[] }> = {
  everyday: {
    label: "Everyday life",
    questions: [
      "Who takes longer to get ready?",
      "Who sends more messages?",
      "Who chooses the movie?",
      "Who is the better cook?",
      "Who falls asleep first?",
      "Who is always running late?",
      "Who steals the blanket?",
      "Who is the messier one?",
      "Who spends more time on their phone?",
      "Who is the morning person?",
      "Who loses their keys more often?",
      "Who does the most singing in the shower?",
      "Who gets hangry faster?",
      "Who is the better driver?",
      "Who is more likely to binge a whole series in one night?",
    ],
  },
  romance: {
    label: "Romance",
    questions: [
      "Who is more romantic?",
      "Who plans better surprises?",
      "Who said ‘I love you’ first?",
      "Who remembers tiny details?",
      "Who gives better gifts?",
      "Who is the bigger hugger?",
      "Who writes the sweetest messages?",
      "Who gets jealous more easily?",
      "Who fell first?",
      "Who is more likely to cry at a romantic movie?",
      "Who remembers anniversaries better?",
      "Who is better at comforting the other?",
      "Who initiates date nights more?",
      "Who is the bigger flirt?",
      "Who would plan the proposal?",
    ],
  },
  fun: {
    label: "Funny & silly",
    questions: [
      "Who says sorry first?",
      "Who laughs first during an argument?",
      "Who loves food more?",
      "Who is more adventurous?",
      "Who would survive longer in a zombie movie?",
      "Who is more dramatic when sick?",
      "Who tells the worst jokes?",
      "Who would win at a dance-off?",
      "Who is more likely to get lost?",
      "Who makes funnier faces in photos?",
      "Who would be a better reality-show contestant?",
      "Who is more competitive at games?",
      "Who talks to pets in a baby voice?",
      "Who is more likely to laugh at the wrong moment?",
      "Who would eat the last slice without asking?",
    ],
  },
};
export const YVM_OPTIONS = [
  ["me", "Me"],
  ["partner", "My partner"],
  ["both", "Both of us"],
  ["neither", "Neither"],
] as const;

/* ---------- Our Dream Date ---------- */
export const DATE_STEPS: { id: string; title: string; options: [string, string][] }[] = [
  {
    id: "location",
    title: "Where are we going?",
    options: [
      ["Beach", "🏖️"], ["Mountains", "🏔️"], ["Cozy Café", "☕"], ["Rooftop", "🌆"],
      ["Garden", "🌷"], ["Home Movie Night", "🍿"], ["Stargazing", "🔭"], ["Road Trip", "🚗"],
    ],
  },
  {
    id: "time",
    title: "What time of day?",
    options: [["Sunrise", "🌅"], ["Lazy brunch", "🥞"], ["Golden hour", "🌇"], ["Late night", "🌙"]],
  },
  {
    id: "food",
    title: "What are we eating?",
    options: [
      ["Pizza & pasta", "🍕"], ["Street food crawl", "🌮"], ["Home-cooked dinner", "🍲"], ["Sushi", "🍣"],
      ["Dessert only", "🍰"], ["Picnic basket", "🧺"], ["Chai & snacks", "☕"], ["Fancy tasting menu", "🍽️"],
    ],
  },
  {
    id: "activity",
    title: "What are we doing?",
    options: [
      ["Slow dancing", "💃"], ["Long walk & talk", "🚶"], ["Board games", "🎲"], ["Painting together", "🎨"],
      ["Karaoke", "🎤"], ["Watching the sunset", "🌇"], ["Cooking class", "👩‍🍳"], ["Bookshop browsing", "📚"],
    ],
  },
  {
    id: "outfit",
    title: "Outfit vibe?",
    options: [["Comfy pyjamas", "🛌"], ["Smart casual", "👕"], ["Dressed to impress", "👗"], ["Matching outfits", "👫"]],
  },
  {
    id: "music",
    title: "Music mood?",
    options: [["Soft acoustic", "🎸"], ["Old romantic classics", "🎻"], ["Dance party", "🕺"], ["Peaceful silence", "🤫"]],
  },
  {
    id: "surprise",
    title: "The surprise element?",
    options: [
      ["Handwritten letter", "💌"], ["Flowers", "💐"], ["A playlist made for you", "🎧"], ["Fairy lights", "✨"],
      ["A tiny gift", "🎁"], ["A recreated first date", "🔁"],
    ],
  },
];

/* ---------- Love Truth or Dare ---------- */
export type TodCategory = "cute" | "funny" | "romantic" | "deep" | "distance";
export const TOD_CATEGORIES: { id: TodCategory; label: string }[] = [
  { id: "cute", label: "Cute" },
  { id: "funny", label: "Funny" },
  { id: "romantic", label: "Romantic" },
  { id: "deep", label: "Deep Conversation" },
  { id: "distance", label: "Long Distance" },
];
export const TOD_CARDS: Record<TodCategory, { truth: string[]; dare: string[] }> = {
  cute: {
    truth: [
      "What tiny habit of mine makes you smile?",
      "What nickname would you secretly love me to call you?",
      "What’s the cutest thing I’ve ever done for you?",
      "Which emoji describes me best?",
      "What did you first notice about me?",
      "What’s your favourite photo of me?",
      "What’s a small thing that instantly makes your day better?",
      "Which cartoon couple are we most like?",
    ],
    dare: [
      "Invent a cute nickname for your partner.",
      "Give your partner three genuine compliments.",
      "Make a heart shape with your hands and hold it for five seconds.",
      "Describe your partner using only food words.",
      "Draw your partner in 30 seconds.",
      "Tell your partner what you’d name a star after them.",
      "Make up a two-line poem about your partner.",
      "Do your best impression of your partner waking up.",
    ],
  },
  funny: {
    truth: [
      "What’s the silliest thing we’ve ever argued about?",
      "What’s my most dramatic moment?",
      "Which of my outfits secretly makes you laugh?",
      "What’s the weirdest food combination you secretly love?",
      "What’s the funniest misunderstanding we’ve had?",
      "If I were a kitchen appliance, which would I be?",
      "What’s a song you sing completely wrong?",
      "What’s your most embarrassing (but harmless) childhood memory?",
    ],
    dare: [
      "Recreate your funniest selfie pose.",
      "Talk like a news reporter for the next minute.",
      "Do a 15-second victory dance.",
      "Tell a joke so bad it makes your partner groan.",
      "Speak only in questions until your next turn.",
      "Act out your partner’s favourite movie scene without words.",
      "Describe your day as if it were an action movie trailer.",
      "Make your partner laugh within 20 seconds — no tickling!",
    ],
  },
  romantic: {
    truth: [
      "What’s your favourite memory of us?",
      "When did you last feel especially appreciated?",
      "What is one dream you’d love us to share?",
      "What moment made you realise you really liked me?",
      "What’s your idea of a perfect date with me?",
      "What do you love most about how we are together?",
      "Which song makes you think of me?",
      "What’s a promise you’d like to make me?",
    ],
    dare: [
      "Plan a surprise date in one minute — out loud!",
      "Write a three-line love note and read it aloud.",
      "Tell your partner your favourite thing about their smile.",
      "Describe your first date from your point of view.",
      "Pick a song for our next slow dance.",
      "Look into each other’s eyes for 30 seconds without laughing.",
      "Give your partner a heartfelt thank-you for something recent.",
      "Name five things you’d like to do together this year.",
    ],
  },
  deep: {
    truth: [
      "When do you feel most understood by me?",
      "What’s something you’ve never told me but want to?",
      "What does a good day together look like to you?",
      "What’s one way I can support you better?",
      "What are you most proud of this year?",
      "What’s a fear you’d like us to face together?",
      "How do you like to be comforted when you’re sad?",
      "What does ‘home’ mean to you?",
    ],
    dare: [
      "Share one thing you’d like to work on as a couple — kindly.",
      "Tell your partner about a moment they made you proud.",
      "Describe your partner’s strengths in one minute.",
      "Share a goal for next year and how your partner can help.",
      "Tell your partner something you appreciate that you rarely say.",
      "Recall a hard time you got through together and what it taught you.",
      "Ask your partner one question you’ve always been curious about.",
      "Write down three hopes for your relationship and share them.",
    ],
  },
  distance: {
    truth: [
      "What do you miss most when we’re apart?",
      "What’s the first thing you want to do when we meet again?",
      "Which of our calls is your favourite memory?",
      "What time of day do you miss me the most?",
      "What would you put in a care package for me?",
      "What helps you feel close to me when we’re far apart?",
      "Where should we meet in the middle of the world?",
      "What’s a tradition we could start across the distance?",
    ],
    dare: [
      "Send a sweet voice-free text message right now.",
      "Show your partner the view from your window and describe it lovingly.",
      "Plan our next virtual date in one minute.",
      "Choose a movie to watch ‘together’ this week.",
      "Send your partner a photo that would make them smile.",
      "Count down out loud the days until you meet.",
      "Describe what you’re wearing as if it were a fashion show.",
      "Write a mini postcard message and read it aloud.",
    ],
  },
};

/* ---------- Send Me a Hug ---------- */
export const HUG_THEMES: { id: string; label: string; emoji: string; messages: string[] }[] = [
  { id: "warm", label: "Warm Hug", emoji: "🤗", messages: ["Here’s a big warm hug, just for you.", "Wrapping you up in the coziest hug.", "Hug delivery! No reason needed."] },
  { id: "missing", label: "Missing You", emoji: "🥺", messages: ["I miss you more than words can say.", "Counting the moments until I can hug you for real.", "This hug travelled a long way to reach you."] },
  { id: "morning", label: "Good Morning Hug", emoji: "☀️", messages: ["Good morning! Start your day with my hug.", "Rise and shine, my favourite person.", "A sunny hug to make your morning brighter."] },
  { id: "sorry", label: "Sorry Hug", emoji: "🥺", messages: ["I’m sorry. Can I make it up to you with a hug?", "I hate when we’re upset. Here’s a gentle hug.", "You matter more than being right. Sorry ♡"] },
  { id: "distance", label: "Long-Distance Hug", emoji: "✈️", messages: ["Miles apart, but this hug finds you anyway.", "Close your eyes. Feel that? That’s me hugging you.", "Distance means nothing when you mean everything."] },
  { id: "celebrate", label: "Celebration Hug", emoji: "🎉", messages: ["So proud of you! Celebration hug!", "You did it! Here’s a victory squeeze.", "Cheers to you and this happy moment!"] },
];
export const HUG_COLORS: [string, string][] = [
  ["#ff6b9d", "Pink"],
  ["#b8a4ff", "Lavender"],
  ["#ff9a5c", "Peach"],
  ["#5fb88a", "Mint"],
  ["#f5c84c", "Sunshine"],
  ["#4aa3df", "Sky"],
];

/* ---------- Fix Our Heart ---------- */
export const HEART_DESIGNS: { id: string; label: string; from: string; to: string; accent: string; dots: string }[] = [
  { id: "rose", label: "Classic Rose", from: "#ff8fb1", to: "#ca3f6c", accent: "#fff0f5", dots: "#ffd1df" },
  { id: "starry", label: "Starry Night", from: "#b8a4ff", to: "#40306b", accent: "#fff6c9", dots: "#e6dcff" },
  { id: "sunset", label: "Sunset Peach", from: "#ffd6ba", to: "#ff6b6b", accent: "#fffaf0", dots: "#ffe9d6" },
];
export const PUZZLE_MESSAGES = [
  "You make every day softer.",
  "I love the way you laugh.",
  "You’re my favourite place to be.",
  "Thank you for choosing me.",
  "With you, ordinary is magical.",
  "You’re my calm and my adventure.",
  "I’d pick you in every lifetime.",
  "You make my heart feel at home.",
  "Every memory with you is a treasure.",
  "You’re the best part of my day.",
  "My heart smiles when you’re near.",
  "You’re my sweetest hello.",
  "I’m so proud of you.",
  "You make me want to be better.",
  "Let’s keep making memories.",
  "This heart is all yours.",
];

/* ---------- Find My Love ---------- */
export const HUNT_THEMES: { id: string; label: string; emoji: string }[] = [
  { id: "map", label: "Treasure Map", emoji: "🗺️" },
  { id: "stars", label: "Starry Path", emoji: "✨" },
  { id: "garden", label: "Secret Garden", emoji: "🌷" },
];
export const SAMPLE_CLUES = [
  "What was the first movie we watched together?",
  "Which food do we always order?",
  "Where would we love to travel?",
  "What nickname do you call me?",
  "What is our favourite shared memory?",
];

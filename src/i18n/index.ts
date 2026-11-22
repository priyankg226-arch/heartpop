import { categoryMessage } from "./messages";
export const languages = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
  hinglish: "Hinglish",
  "roman-gu": "Roman Gujarati",
};
export type Language = keyof typeof languages;
export const copy: Record<
  Language,
  {
    headline: string;
    subtitle: string;
    create: string;
    explore: string;
    eyebrow: string;
    message: string;
  }
> = {
  en: {
    headline: "Make someone\nsmile today.",
    subtitle:
      "Little surprises, secret messages, and playful moments. A little you, made just for them.",
    create: "Create a surprise",
    explore: "Explore fun games",
    eyebrow: "LITTLE SURPRISES, BIG SMILES",
    message:
      "You make ordinary days feel a little more magical. Here’s a tiny reminder: you mean the world to me.",
  },
  hi: {
    headline: "आज किसी की\nमुस्कान बनें।",
    subtitle:
      "प्यारे सरप्राइज़, दिल की बातें और मस्ती भरे पल। किसी अपने के लिए, बस आपकी तरफ़ से।",
    create: "सरप्राइज़ बनाएँ",
    explore: "मज़ेदार खेल देखें",
    eyebrow: "छोटी खुशियाँ, बड़ी मुस्कान",
    message:
      "तुम्हारे साथ साधारण दिन भी खास बन जाते हैं। बस याद दिलाना था: तुम मेरे लिए बहुत मायने रखते हो।",
  },
  gu: {
    headline: "આજે કોઈના ચહેરા પર\nસ્મિત લાવો.",
    subtitle: "નાનાં સરપ્રાઇઝ, દિલની વાતો અને મજાની પળો. તમારા કોઈ ખાસ માટે.",
    create: "સરપ્રાઇઝ બનાવો",
    explore: "મજાની રમતો જુઓ",
    eyebrow: "નાની ખુશીઓ, મોટું સ્મિત",
    message:
      "તારી સાથે સામાન્ય દિવસ પણ ખાસ બની જાય છે. બસ એટલું યાદ અપાવવું હતું કે તું મારા માટે ખૂબ ખાસ છે.",
  },
  hinglish: {
    headline: "Aaj kisi ki\nsmile ban jao.",
    subtitle:
      "Chhote surprises, dil ki baatein aur thodi si masti. Apne special insaan ke liye.",
    create: "Surprise banao",
    explore: "Fun games dekho",
    eyebrow: "CHHOTE SURPRISES, BADI SMILES",
    message:
      "Tumhare saath normal din bhi special lagta hai. Bas yaad dilana tha: tum mere liye bahut special ho.",
  },
  "roman-gu": {
    headline: "Aaje koina chehra par\nsmit laavo.",
    subtitle:
      "Nana surprises, dil ni vaato ane maja ni palo. Tamara koi khaas mate.",
    create: "Surprise banavo",
    explore: "Ramat juo",
    eyebrow: "NANI KHUSHIO, MOTU SMIT",
    message:
      "Tari sathe saamanya divas pan khaas bani jay chhe. Bas etlu yaad apavvu hatu ke tu mara mate khub khaas chhe.",
  },
};
export const categories = {
  envelope: [
    "You miss me",
    "You need a smile",
    "You're feeling sad",
    "You're angry",
    "You feel lonely",
    "You need motivation",
    "It's your birthday",
    "You think of me",
  ],
  scratch: [
    "Secret message",
    "Funny confession",
    "Cute compliment",
    "Friendship message",
    "Surprise challenge",
    "Personal reward",
  ],
  message: [
    "Just Because",
    "Sorry",
    "I Miss You",
    "Love You",
    "Thank You",
    "Best Friend",
    "Birthday",
    "Anniversary",
  ],
  quiz: [
    "Couple Quiz",
    "Best Friend Quiz",
    "Funny Quiz",
    "Romantic Quiz",
    "Friendship Challenge",
  ],
  stars: ["Love You", "Just Because", "Birthday", "Best Friend"],
  hearts: ["Love You", "I Miss You", "Best Friend", "Just Because"],
  future: ["Birthday", "Anniversary", "Love You", "You need motivation"],
  bingo: ["Love You", "Best Friend", "Just Because"],
};
export const tones = [
  "Cute",
  "Funny",
  "Romantic",
  "Emotional",
  "Playful",
  "Heartfelt",
];
const accents: Record<Language, string[]> = {
  en: [
    "Sending you a pocket-sized hug.",
    "You’re my favorite notification.",
    "My favorite place is anywhere with you.",
    "Some feelings are bigger than words.",
    "Redeem this for one very silly dance!",
    "Thank you for being exactly who you are.",
  ],
  hi: [
    "एक छोटी सी झप्पी तुम्हारे नाम।",
    "तुम्हारा मैसेज आते ही मुस्कान आ जाती है।",
    "तुम साथ हो तो हर जगह घर जैसी लगती है।",
    "कुछ एहसास शब्दों से बड़े होते हैं।",
    "इस मैसेज के बदले एक मज़ेदार डांस मिलेगा!",
    "जैसे हो, वैसे ही बहुत खास हो।",
  ],
  gu: [
    "તારા માટે એક નાનકડી ઝપ્પી.",
    "તારો મેસેજ જોઈને સ્મિત આવી જાય છે.",
    "તું સાથે હોય ત્યાં જ મારું ઘર છે.",
    "કેટલીક લાગણીઓ શબ્દોથી મોટી હોય છે.",
    "આ મેસેજના બદલામાં એક મજાનો ડાન્સ!",
    "તું જેવો છે એવો જ ખૂબ ખાસ છે.",
  ],
  hinglish: [
    "Ek chhoti si jhappi tumhare naam.",
    "Tumhara message mera favorite notification hai.",
    "Tum saath ho toh har jagah ghar lagti hai.",
    "Kuch feelings words se badi hoti hain.",
    "Is message ke badle ek silly dance milega!",
    "Jaise ho, waise hi bahut special ho.",
  ],
  "roman-gu": [
    "Tara mate ek nanakdi jhappi.",
    "Taro message joine smit aavi jay chhe.",
    "Tu sathe hoy tya j maru ghar chhe.",
    "Ketlik laganiyo shabdo thi moti hoy chhe.",
    "Aa message na badlama ek majano dance!",
    "Tu jevo chhe evo j khub khaas chhe.",
  ],
};
export function template(lang: Language, category: string, tone: string) {
  return `${categoryMessage(lang, category)} ${accents[lang][Math.max(0, tones.indexOf(tone))]}`;
}

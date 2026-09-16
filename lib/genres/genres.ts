export interface GenrePack {
  id: string;
  name: string;
  description: string;
  toneDefault: "dark" | "neutral" | "uplifting";
  visualStyleKeywords: string[];
  voiceStyleNotes: string;
}

export const genres: GenrePack[] = [
  // ── Original 14 ──────────────────────────────────────────────────────────
  {
    id: "fantasy",
    name: "Fantasy",
    description:
      "Epic worlds of magic, ancient prophecy, and heroes forged by fate.",
    toneDefault: "neutral",
    visualStyleKeywords: ["ethereal", "epic", "golden light", "mystical", "vast landscapes"],
    voiceStyleNotes:
      "Measured, resonant, slightly archaic cadence. Narrate like an ancient chronicler.",
  },
  {
    id: "sci-fi",
    name: "Sci-Fi",
    description:
      "Near-future or distant worlds shaped by technology, exploration, and existential discovery.",
    toneDefault: "neutral",
    visualStyleKeywords: ["neon", "sterile", "deep space", "holographic", "chrome"],
    voiceStyleNotes:
      "Clinical yet wondrous. Precise language, occasional technical texture.",
  },
  {
    id: "mystery",
    name: "Mystery",
    description:
      "A puzzle at the center of everything — clues buried in details, truth hidden in plain sight.",
    toneDefault: "neutral",
    visualStyleKeywords: ["shadowy", "moody", "close-up details", "desaturated", "rain-slicked"],
    voiceStyleNotes:
      "Deliberate, curious, withholding. Every line feels like it's hiding one more secret.",
  },
  {
    id: "thriller",
    name: "Thriller",
    description:
      "High-stakes tension where the wrong move means everything falls apart.",
    toneDefault: "dark",
    visualStyleKeywords: ["stark contrast", "motion blur", "urban night", "tight angles", "tension"],
    voiceStyleNotes:
      "Urgent, propulsive, short punchy sentences. Heart rate climbing with each beat.",
  },
  {
    id: "romance",
    name: "Romance",
    description:
      "The collision of two people — longing, connection, and the risk of the heart.",
    toneDefault: "uplifting",
    visualStyleKeywords: ["warm bokeh", "golden hour", "soft focus", "intimate", "tender"],
    voiceStyleNotes:
      "Warm, emotionally open, lyrical. Let the silences between words breathe.",
  },
  {
    id: "adventure",
    name: "Adventure",
    description:
      "A quest, a journey, a world beyond the horizon — obstacles tested by courage.",
    toneDefault: "uplifting",
    visualStyleKeywords: ["sweeping vistas", "motion", "bold colors", "wilderness", "horizon"],
    voiceStyleNotes:
      "Energetic and forward-moving. Every beat feels like it's propelling us forward.",
  },
  {
    id: "drama",
    name: "Drama",
    description:
      "Human relationships under pressure — truth, consequence, and the cost of choices.",
    toneDefault: "neutral",
    visualStyleKeywords: ["naturalistic", "close faces", "interior light", "raw", "honest"],
    voiceStyleNotes:
      "Restrained, grounded, observational. Let the weight of moments land without over-dramatizing.",
  },
  {
    id: "comedy",
    name: "Comedy",
    description:
      "Absurdity, timing, and the relief of laughing at the chaos of being human.",
    toneDefault: "uplifting",
    visualStyleKeywords: ["bright", "expressive", "comic timing", "exaggerated", "vibrant"],
    voiceStyleNotes:
      "Playful, quick, deadpan or exuberant. Timing is everything — the pause before the punchline.",
  },
  {
    id: "western",
    name: "Western",
    description:
      "Frontier justice, hard men in harder landscapes, codes of honor and survival.",
    toneDefault: "neutral",
    visualStyleKeywords: ["dust", "wide open plains", "harsh sun", "weathered", "golden dusk"],
    voiceStyleNotes:
      "Laconic, gravelly, unhurried. Every word costs something. Silence is power.",
  },
  {
    id: "literary-fiction",
    name: "Literary Fiction",
    description:
      "Language as the medium — interior lives, ambiguity, and meaning made from ordinary moments.",
    toneDefault: "neutral",
    visualStyleKeywords: ["painterly", "still life", "texture", "contemplative", "muted palette"],
    voiceStyleNotes:
      "Precise and lyrical. Every word chosen with intention. Slows time rather than accelerating it.",
  },
  {
    id: "young-adult",
    name: "Young Adult",
    description:
      "Coming-of-age intensity — identity, first love, injustice, and choosing who to become.",
    toneDefault: "neutral",
    visualStyleKeywords: ["vivid", "youthful energy", "hallways", "close friendships", "raw emotion"],
    voiceStyleNotes:
      "Direct, emotionally immediate, first-person intimacy. The stakes feel like everything because they are.",
  },
  {
    id: "historical-fiction",
    name: "Historical Fiction",
    description:
      "Real eras brought to life through invented lives — the texture of another time.",
    toneDefault: "neutral",
    visualStyleKeywords: ["period detail", "aged texture", "candlelight", "sepia tones", "costume"],
    voiceStyleNotes:
      "Period-appropriate cadence, grounded in sensory detail. Transport, don't explain.",
  },
  {
    id: "paranormal",
    name: "Paranormal",
    description:
      "Psychic gifts, ghosts, and the unseen world pressing against everyday reality.",
    toneDefault: "dark",
    visualStyleKeywords: ["spectral", "layered reality", "cold blue light", "translucent", "haunted"],
    voiceStyleNotes:
      "Quietly unsettled, as if the narrator knows something the audience doesn't yet.",
  },
  {
    id: "action",
    name: "Action",
    description:
      "Pure kinetic momentum — fight, chase, explosion, consequence.",
    toneDefault: "neutral",
    visualStyleKeywords: ["dynamic angles", "motion", "impact", "adrenaline", "high contrast"],
    voiceStyleNotes:
      "Staccato, physical, verb-heavy. No time to breathe — every word is forward movement.",
  },

  // ── New 12 ────────────────────────────────────────────────────────────────
  {
    id: "true-crime",
    name: "True Crime",
    description:
      "Real-feeling cases, investigations, and the psychology behind crimes that shock the ordinary world.",
    toneDefault: "dark",
    visualStyleKeywords: ["crime scene", "evidence", "documentary grain", "stark", "investigative"],
    voiceStyleNotes:
      "Journalistic and measured, tinged with dread. State facts with quiet menace.",
  },
  {
    id: "horror",
    name: "Horror",
    description:
      "Pure dread — creatures, atmosphere, and the primal fear of what lurks in the dark.",
    toneDefault: "dark",
    visualStyleKeywords: ["darkness", "single light source", "decay", "isolation", "visceral"],
    voiceStyleNotes:
      "Slow-build dread building to sharp panic. Whisper then scream. Never rush the fear.",
  },
  {
    id: "psychological-thriller",
    name: "Psychological Thriller",
    description:
      "Reality fractures from the inside — unreliable minds, gaslighting, and the horror of not trusting yourself.",
    toneDefault: "dark",
    visualStyleKeywords: ["fractured", "mirror reflections", "desaturated", "disorienting angles", "tight close-ups"],
    voiceStyleNotes:
      "Unreliable, circular, quietly destabilizing. The narrator may be the least trustworthy person in the room.",
  },
  {
    id: "revenge-karma",
    name: "Revenge / Karma",
    description:
      "The slow wheel turning — those who wronged others facing the exact consequence they earned.",
    toneDefault: "dark",
    visualStyleKeywords: ["cold symmetry", "before/after contrast", "shadow and light", "deliberate", "poetic justice"],
    voiceStyleNotes:
      "Controlled, inevitable, slightly satisfied. The narrator watches the universe correct itself.",
  },
  {
    id: "supernatural-folklore",
    name: "Supernatural / Folklore",
    description:
      "Urban legends, folk horror, and the creatures that live at the intersection of belief and dread.",
    toneDefault: "dark",
    visualStyleKeywords: ["folklore textures", "rural isolation", "candlelight", "ritual", "ancient symbols"],
    voiceStyleNotes:
      "Oral storytelling cadence — like a tale told around a fire. Old, warned-about, half-believed.",
  },
  {
    id: "historical-mystery",
    name: "Historical Mystery",
    description:
      "A crime or conspiracy buried in a specific era — where history and deduction collide.",
    toneDefault: "neutral",
    visualStyleKeywords: ["period detail", "archive documents", "gaslit streets", "aged paper", "shadowy figures"],
    voiceStyleNotes:
      "Meticulous, atmospheric, curious. The detective voice layered with period authenticity.",
  },
  {
    id: "urban-legend",
    name: "Urban Legend",
    description:
      "Stories that spread because they feel true — the friend-of-a-friend horror of modern myth.",
    toneDefault: "dark",
    visualStyleKeywords: ["familiar suburban dread", "night driving", "empty parking lots", "overhead fluorescent", "ordinary gone wrong"],
    voiceStyleNotes:
      "Conversational, as if recounting something that happened to someone you know. Plausible, then terrifying.",
  },
  {
    id: "survival",
    name: "Survival",
    description:
      "Stripped to essentials — one person, impossible odds, the will to live versus the world trying to stop them.",
    toneDefault: "neutral",
    visualStyleKeywords: ["raw nature", "extreme conditions", "exhaustion", "isolation", "primal"],
    voiceStyleNotes:
      "Stripped-back, physical, present-tense. Every sentence is survival itself.",
  },
  {
    id: "forbidden-romance",
    name: "Forbidden Romance",
    description:
      "Love that crosses lines — class, loyalty, war, or circumstance. The heart against the world.",
    toneDefault: "dark",
    visualStyleKeywords: ["stolen glances", "hidden spaces", "chiaroscuro", "tension in proximity", "bittersweet light"],
    voiceStyleNotes:
      "Longing restrained by duty. Every interaction carries the weight of what can't be said aloud.",
  },
  {
    id: "sci-fi-serial",
    name: "Sci-Fi Serial",
    description:
      "An unfolding saga across episodes — world-building, recurring characters, mysteries that compound.",
    toneDefault: "neutral",
    visualStyleKeywords: ["world-building detail", "recurring locations", "continuity markers", "technology evolution", "epic scale"],
    voiceStyleNotes:
      "Lore-rich, expansive, with each episode ending on a pull toward the next. Build a universe, not just a story.",
  },
  {
    id: "motivational-redemption",
    name: "Motivational / Redemption",
    description:
      "The transformation arc — rock bottom, the choice to rise, and the hard road that follows.",
    toneDefault: "uplifting",
    visualStyleKeywords: ["dawn light", "upward motion", "grit and beauty", "transformation", "earned warmth"],
    voiceStyleNotes:
      "Honest about the struggle, triumphant about the climb. Never preachy — earned, not given.",
  },
  {
    id: "dark-fairy-tale",
    name: "Dark Fairy Tale",
    description:
      "Classic fairy tale structures twisted — the forest is dangerous, the gift is cursed, the prince has a cost.",
    toneDefault: "dark",
    visualStyleKeywords: ["storybook illustration", "dark enchanted forest", "deep saturated color", "uncanny", "baroque"],
    voiceStyleNotes:
      "Once-upon-a-time cadence corrupted by dread. Beautiful language describing terrible things.",
  },
];

export function getGenre(id: string): GenrePack | undefined {
  return genres.find((g) => g.id === id);
}

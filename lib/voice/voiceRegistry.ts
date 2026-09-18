export interface VoiceEntry {
  id: string;
  label: string;
  gender: "Male" | "Female";
  referenceAudioUrl: string;
}

const BASE = "https://authorr-ai.pages.dev/";

export const VOICE_REGISTRY: VoiceEntry[] = [
  { id: "adam",         label: "Adam",         gender: "Male",   referenceAudioUrl: BASE + "Adam.mp3" },
  { id: "alexandra",    label: "Alexandra",    gender: "Female", referenceAudioUrl: BASE + "Alexandra.mp3" },
  { id: "annie",        label: "Annie",        gender: "Female", referenceAudioUrl: BASE + "Annie.mp3" },
  { id: "benjamin",     label: "Benjamin",     gender: "Male",   referenceAudioUrl: BASE + "Benjamin.mp3" },
  { id: "betty",        label: "Betty",        gender: "Female", referenceAudioUrl: BASE + "Betty.mp3" },
  { id: "bob",          label: "Bob",          gender: "Male",   referenceAudioUrl: BASE + "Bob.mp3" },
  { id: "brandy_ny",    label: "Brandy NY",    gender: "Female", referenceAudioUrl: BASE + "Brandy%20NY.mp3" },
  { id: "clark",        label: "Clark",        gender: "Male",   referenceAudioUrl: BASE + "Clark.mp3" },
  { id: "damon",        label: "Damon",        gender: "Male",   referenceAudioUrl: BASE + "Damon.mp3" },
  { id: "darren",       label: "Darren",       gender: "Male",   referenceAudioUrl: BASE + "Darren.mp3" },
  { id: "diana",        label: "Diana",        gender: "Female", referenceAudioUrl: BASE + "Diana.mp3" },
  { id: "dwight",       label: "Dwight",       gender: "Male",   referenceAudioUrl: BASE + "Dwight.mp3" },
  { id: "edward",       label: "Edward",       gender: "Male",   referenceAudioUrl: BASE + "Edward.mp3" },
  { id: "erica",        label: "Erica",        gender: "Female", referenceAudioUrl: BASE + "Erica.mp3" },
  { id: "explainer",    label: "Explainer",    gender: "Male",   referenceAudioUrl: BASE + "Explainer.mp3" },
  { id: "glen",         label: "Glen",         gender: "Male",   referenceAudioUrl: BASE + "Glen.mp3" },
  { id: "helen",        label: "Helen",        gender: "Female", referenceAudioUrl: BASE + "Helen.mp3" },
  { id: "helen2",       label: "Helen 2",      gender: "Female", referenceAudioUrl: BASE + "Helen-2.mp3" },
  { id: "jeffrey",      label: "Jeffrey",      gender: "Male",   referenceAudioUrl: BASE + "Jeffrey.mp3" },
  { id: "jenny",        label: "Jenny",        gender: "Female", referenceAudioUrl: BASE + "Jenny.mp3" },
  { id: "john_forcast", label: "John Forcast", gender: "Male",   referenceAudioUrl: BASE + "John%20Forcast.mp3" },
  { id: "kim",          label: "Kim",          gender: "Female", referenceAudioUrl: BASE + "Kim.mp3" },
  { id: "lerry",        label: "Lerry",        gender: "Male",   referenceAudioUrl: BASE + "Lerry.mp3" },
  { id: "lizz",         label: "Lizz",         gender: "Female", referenceAudioUrl: BASE + "Lizz.mp3" },
  { id: "marie",        label: "Marie",        gender: "Female", referenceAudioUrl: BASE + "Marie.mp3" },
  { id: "maxwell",      label: "Maxwell",      gender: "Male",   referenceAudioUrl: BASE + "Maxwell.mp3" },
  { id: "melissa",      label: "Melissa",      gender: "Female", referenceAudioUrl: BASE + "Melissa.mp3" },
  { id: "mia",          label: "Mia",          gender: "Female", referenceAudioUrl: BASE + "Mia.mp3" },
  { id: "mike",         label: "Mike",         gender: "Male",   referenceAudioUrl: BASE + "Mike.mp3" },
  { id: "paul",         label: "Paul",         gender: "Male",   referenceAudioUrl: BASE + "Paul.mp3" },
  { id: "sean",         label: "Sean",         gender: "Male",   referenceAudioUrl: BASE + "Sean.mp3" },
  { id: "shaundria",    label: "Shaundria",    gender: "Female", referenceAudioUrl: BASE + "Shaundria.mp3" },
  { id: "tawnya",       label: "Tawnya",       gender: "Female", referenceAudioUrl: BASE + "Tawnya.mp3" },
];

export function getVoice(id: string): VoiceEntry | undefined {
  return VOICE_REGISTRY.find((v) => v.id === id);
}

// Maps story character name (e.g. "Mara") → a VOICE_REGISTRY id (e.g. "diana").
// Populated per-session by the creator; unassigned characters fall back to Grok.
export const characterVoiceAssignments: Record<string, string> = {};

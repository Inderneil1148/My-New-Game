import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

// Initialize Gemini client with proper user-agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Cache for daily generated content to minimize latency
const cache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function getCached(key: string) {
  const item = cache[key];
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache[key] = { timestamp: Date.now(), data };
}

// Helper to extract JSON from Gemini text response
function parseGeminiJson<T>(rawText: string, fallback: T): T {
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('Failed to parse Gemini JSON directly, trying regex extraction:', err);
    try {
      const match = rawText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[0]) as T;
      }
    } catch (e2) {
      console.error('Regex extraction also failed:', e2);
    }
    return fallback;
  }
}

// Fallback high-quality curated quiz items if API key is not configured or in case of transient error
const FALLBACK_QUIZ = [
  {
    id: 'fb-1',
    category: 'Science & Space',
    headline: 'James Webb Space Telescope Captures Cosmic Neon Rings in Distant Supernova',
    question: 'Astronomers using the JWST recently observed unprecedented concentric ripples around Supernova 1987A. What causes these distinct glowing cosmic halos?',
    options: [
      'Solar wind from passing rogue planets',
      'Shockwaves slamming into previously ejected stellar gas rings',
      'Gravitational lensing by dark matter clumps',
      'Artificial megastructures constructed by ancient pulsars'
    ],
    correctIndex: 1,
    explanation: 'The bright glowing rings are illuminated as the supersonic shockwave from the exploded star expands outwards and crashes into gas shells shed tens of thousands of years before the blast.',
    learningBite: {
      takeaway: 'Supernovae act as natural particle accelerators, sculpting surrounding gas clouds over decades.',
      funFact: 'Light from SN 1987A took roughly 168,000 years to reach Earth, originating in the Large Magellanic Cloud!',
      whyItMatters: 'Studying these echoes helps physicists learn how heavy elements like iron and gold spread across galaxies.',
      topicTags: ['Astronomy', 'James Webb', 'Physics']
    },
    sourceOrContext: 'NASA / ESA Astrophysical Observations'
  },
  {
    id: 'fb-2',
    category: 'Technology & AI',
    headline: 'Next-Gen Solid-State Batteries Achieve Record 1,000-Mile Range in EV Lab Trials',
    question: 'What is the fundamental engineering breakthrough that makes solid-state batteries safer and dramatically more energy-dense than standard lithium-ion batteries?',
    options: [
      'Replacing liquid electrolytes with non-flammable solid ceramic or polymer materials',
      'Using liquid mercury instead of cobalt cathodes',
      'Cooling the battery with liquid nitrogen inside car doors',
      'Allowing electrons to teleport without chemical conductors'
    ],
    correctIndex: 0,
    explanation: 'Solid-state batteries replace volatile, flammable organic liquid electrolytes with solid ceramic, sulfide, or polymer electrolytes, eliminating dendrite short-circuits and enabling pure lithium metal anodes.',
    learningBite: {
      takeaway: 'Solid electrolytes eliminate fire risks and pack nearly double the energy into the exact same physical volume.',
      funFact: 'Commercial adoption could allow electric passenger planes and 10-minute ultra-fast recharge cycles.',
      whyItMatters: 'Energy storage density is the key bottleneck holding back carbon-neutral transport and grid storage.',
      topicTags: ['Clean Energy', 'Batteries', 'EV Tech']
    },
    sourceOrContext: 'Materials Science & Battery Innovation Reports'
  },
  {
    id: 'fb-3',
    category: 'Environment & Earth',
    headline: 'Biologists Discover Deep-Sea Corals Thriving in Pitch Black Volcanic Seamounts',
    question: 'Deep cold-water corals live thousands of meters below where sunlight cannot reach. How do they survive without photosynthetic algae (zooxanthellae)?',
    options: [
      'They feed on microscopic geothermal bacteria and drifting marine snow',
      'They absorb nuclear decay particles from submarine hydrothermal vents',
      'They hibernate for 90% of every century',
      'They survive strictly on dissolved plastic microparticles'
    ],
    correctIndex: 0,
    explanation: 'Unlike shallow tropical corals that depend on sun-loving algae, cold-water coral polyps capture drifting organic debris called "marine snow" and trap food particles carried by deep oceanic currents.',
    learningBite: {
      takeaway: 'Oceans have vast cold-water reefs that can live for over 4,000 years, older than the Egyptian pyramids!',
      funFact: 'Some black corals in the deep Pacific are among the oldest continuous living animals on planet Earth.',
      whyItMatters: 'These ecosystems act as critical biodiversity nurseries and carbon sequestration reservoirs.',
      topicTags: ['Marine Biology', 'Oceanography', 'Deep Sea']
    },
    sourceOrContext: 'Deep Ocean Exploration Consortium'
  },
  {
    id: 'fb-4',
    category: 'Curious Oddities',
    headline: 'Engineers Crack Ancient Roman "Self-Healing" Concrete Recipe',
    question: 'Why have 2,000-year-old Roman aqueducts and the Pantheon dome outlasted modern concrete? What secret ingredient healed cracks over centuries?',
    options: [
      'Volcanic ash combined with quicklime creating reactive "lime clasts"',
      'Crushed olive pits mixed with honey resin',
      'Ground marble dust tempered in goat milk',
      'Lead piping that oxidized into an impervious crust'
    ],
    correctIndex: 0,
    explanation: 'Romans used "hot mixing" with quicklime, leaving behind tiny white mineral deposits called lime clasts. When cracks formed and rainwater entered, the lime dissolved and recrystallized into calcite, actively sealing the fissures!',
    learningBite: {
      takeaway: 'Ancient Roman concrete was an active smart material that healed itself whenever rainwater seeped in.',
      funFact: 'Modern builders are already adopting Roman-style hot-mixing to make bridges and seawalls last decades longer.',
      whyItMatters: 'Self-healing concrete could cut global cement emissions, which currently account for ~8% of all global CO2.',
      topicTags: ['Archaeology', 'Materials', 'History']
    },
    sourceOrContext: 'MIT Department of Civil and Environmental Engineering'
  },
  {
    id: 'fb-5',
    category: 'World & Culture',
    headline: 'Global Svalbard Global Seed Vault Receives Historic New Deposits From Island Nations',
    question: 'Located deep inside an Arctic permafrost mountain on the Norwegian archipelago of Svalbard, what is the primary purpose of the "Doomsday Seed Vault"?',
    options: [
      'To safeguard duplicate crop seed varieties against war, natural disaster, and climate extinction',
      'To breed genetically modified hyper-resistant crops for Mars colonization',
      'To freeze alien flora specimens collected from Antarctica',
      'To store luxury spices for high-end international culinary competitions'
    ],
    correctIndex: 0,
    explanation: 'The Svalbard Global Seed Vault acts as the ultimate backup repository for gene banks worldwide, preserving over 1.2 million seed samples in case local seed banks suffer destruction.',
    learningBite: {
      takeaway: 'It serves as an insurance policy for human agricultural biodiversity, buried 120 meters inside permafrost.',
      funFact: 'Even if all power failed, the Arctic permafrost would keep the seeds naturally frozen for decades.',
      whyItMatters: 'As weather extremes rise, crop diversity is vital for breeding climate-resilient staple foods.',
      topicTags: ['Agriculture', 'Global Security', 'Biodiversity']
    },
    sourceOrContext: 'Crop Trust & Nordic Genetic Resource Center'
  }
];

const FALLBACK_FACT_OR_FICTION = [
  {
    id: 'fof-1',
    headline: 'Scientists Taught Spinach Plants How to Send Email Alerts When Detecting Explosive Chemicals in Groundwater',
    isReal: true,
    source: 'MIT Engineering Research',
    story: 'Researchers embedded carbon nanotubes into spinach leaves. When the plants draw up nitroaromatics from groundwater, the tubes emit fluorescent light picked up by an infrared camera, which triggers an automated email to scientists!',
    learningNugget: 'Plant nanobionics allows ordinary plants to be turned into self-powered environmental biochemical sensors.'
  },
  {
    id: 'fof-2',
    headline: 'A Swedish Tech Firm Invented a Wi-Fi Router Powered Entirely by Household Dust Mites',
    isReal: false,
    source: 'AI-Generated News Satire',
    story: 'Dust mites cannot produce electrical current in quantities capable of powering electronic transmitters. Modern Wi-Fi routers require between 6 and 20 watts of steady electrical power.',
    learningNugget: 'Biological energy harvesting is real for tiny sensors (e.g., glucose in tears), but micro-insects cannot power consumer electronics.'
  },
  {
    id: 'fof-3',
    headline: 'Tokyo Installed Public Restrooms With Transparent Smart Glass Walls That Turn Opaque Only When Locked',
    isReal: true,
    source: 'Tokyo Toilet Project / Shigeru Ban Architects',
    story: 'Designed by Pritzker Prize architect Shigeru Ban, the smart electrochromic glass allows people to verify cleanliness and safety from the outside before entering. Turning the lock runs electric current to make walls instantly frosted!',
    learningNugget: 'Smart glass uses Polymer Dispersed Liquid Crystal (PDLC) technology that alters light transmission with electrical voltage.'
  },
  {
    id: 'fof-4',
    headline: 'A Team in Switzerland Has Developed Solar Panels Capable of Generating Electricity at Midnight from Earth\'s Radiative Heat',
    isReal: true,
    source: 'ACS Photonics & Stanford Engineering',
    story: 'Known as "reverse solar cells" or thermoradiative photovoltaic cells, they tap into the heat escaping from the Earth back into the cold vacuum of deep space during darkness.',
    learningNugget: 'Thermoradiative diodes generate electricity in reverse by radiating heat to outer space, providing 24/7 continuous micro-power.'
  },
  {
    id: 'fof-5',
    headline: 'NASA Announced That the Moon is Gradually Turning Green Due to Cosmic Ray Oxidation of Subsurface Copper',
    isReal: false,
    source: 'Scientific Myth Debunk',
    story: 'The Moon has virtually no atmospheric oxygen or copper crust to turn green like the Statue of Liberty. However, lunar hematite (rust) was discovered in tiny amounts due to Earth\'s magnetotail transporting oxygen!',
    learningNugget: 'Earth\'s upper atmosphere actually leaks oxygen ions that travel 384,000 km to lightly rust parts of the lunar surface!'
  }
];

const FALLBACK_DETECTIVES = [
  {
    id: 'det-1',
    redactedHeadline: 'Engineers Unveil World’s First Super-Hydrophobic Metal That Can Never [REDACTED], Even When Punctured',
    secretWord: 'Sink',
    clues: [
      'It involves density and surface tension interaction with water.',
      'Think of how certain insects walk on the surface of ponds.',
      'Even if you drill dozens of holes through this metal disc, it will stubbornly refuse to submerge.'
    ],
    options: ['Rust', 'Sink', 'Melt', 'Conduct'],
    correctIndex: 1,
    fullStory: 'University of Rochester researchers etched micro- and nanoscale patterns on aluminum that trap air bubbles. Even when pierced or submerged for months, the trapped air pockets keep it floating permanently!',
    knowledgeLesson: 'Nature inspired this breakthrough: water spiders and fire ants use microscopic hairs to trap air cushions, enabling them to survive underwater.'
  },
  {
    id: 'det-2',
    redactedHeadline: 'Neuroscientists Discover That Sleeping With Mild [REDACTED] Diffused Through the Room Boosts Memory Recall by 226%',
    secretWord: 'Scents',
    clues: [
      'It relates to the only sense directly wired to the brain’s emotional and memory centers.',
      'Think of lavender, rose, peppermint, or orange zest.',
      'Our olfactory bulb connects straight to the hippocampus and amygdala without passing through the thalamus.'
    ],
    options: ['Music', 'Scents', 'Lighting', 'Magnets'],
    correctIndex: 1,
    fullStory: 'Researchers at UC Irvine found that diffusing pleasant fragrances (like rose or rosemary) for two hours each night across six months produced a 226% leap in cognitive and verbal learning scores among older adults.',
    knowledgeLesson: 'Olfaction is uniquely privileged in human neuroanatomy: smell is the direct expressway to deep episodic memory retention.'
  }
];

// Endpoint 1: Get Daily News Quiz
app.post('/api/news-quiz/daily', async (req, res) => {
  try {
    const { topic, difficulty = 'balanced' } = req.body || {};
    const cacheKey = `daily_quiz_${topic || 'general'}_${difficulty}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const prompt = `
You are the game master for "NewsCade", an addictive, playful daily news and general knowledge learning game.
Today's date is: ${todayDate}.
Topic focus: ${topic || 'Fascinating recent global news, breakthrough science, smart technology, nature, space, culture, and surprising world events'}.

Generate 5 high-engagement, fun, educational multiple-choice quiz questions based on real, exciting news and recent scientific/world discoveries.
Each question MUST teach the player something genuinely fascinating that makes them say "Wow, I didn't know that!"

Format strictly as JSON with this schema:
[
  {
    "id": "q1",
    "category": "Technology" | "Science & Space" | "World Affairs" | "Culture & Arts" | "Environment" | "Curious Oddities",
    "headline": "Punchy news headline summary",
    "question": "Engaging trivia question testing understanding of the event or underlying phenomenon",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0, // 0 to 3
    "explanation": "Clear 2-sentence explanation why this answer is correct",
    "learningBite": {
      "takeaway": "The core mind-expanding principle or lesson to remember",
      "funFact": "A quirky or mind-blowing related bonus fact",
      "whyItMatters": "Why this news or concept changes the future",
      "topicTags": ["Tag1", "Tag2"]
    },
    "sourceOrContext": "Publication or research institute name"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an award-winning science and news quiz designer. Output ONLY valid JSON array with no conversational markdown wrapper.',
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      },
    });

    const parsed = parseGeminiJson(response.text || '', FALLBACK_QUIZ);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      setCache(cacheKey, parsed);
      return res.json({ success: true, data: parsed });
    } else {
      return res.json({ success: true, data: FALLBACK_QUIZ, fallback: true });
    }
  } catch (error: any) {
    console.error('Error generating daily news quiz:', error);
    // Return high quality fallback so user gameplay is never blocked
    return res.json({ success: true, data: FALLBACK_QUIZ, fallback: true });
  }
});

// Endpoint 2: Fact or Fiction (Real News vs AI Fiction)
app.post('/api/news-quiz/fact-or-fiction', async (req, res) => {
  try {
    const { count = 5 } = req.body || {};
    const cacheKey = `fof_mode_${count}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const prompt = `
Generate ${count} "Real vs Fake News" challenge cards for a fast-paced trivia game.
Mix real bizarre, mind-blowing true news headlines from the recent news cycle with clever, plausible-sounding AI-invented fictional headlines.
Include exactly 2-3 REAL and 2-3 FAKE items.

Format strictly as JSON array:
[
  {
    "id": "fof-1",
    "headline": "Compelling headline",
    "isReal": true, // or false
    "source": "Name of real institution/outlet or 'AI Invention'",
    "story": "The true background story or why this fake was scientifically/logically debunked",
    "learningNugget": "A cool educational insight about the real science or world fact"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Output valid JSON array only. Blend real astonishing news with witty plausible fake news.',
        temperature: 0.8,
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = parseGeminiJson(response.text || '', FALLBACK_FACT_OR_FICTION);
    setCache(cacheKey, parsed);
    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Error generating Fact or Fiction:', err);
    return res.json({ success: true, data: FALLBACK_FACT_OR_FICTION, fallback: true });
  }
});

// Endpoint 3: Headline Detective (Word Redaction & Mystery Clues)
app.post('/api/news-quiz/headline-detective', async (req, res) => {
  try {
    const prompt = `
Generate 3 "Headline Detective" mystery puzzles based on real surprising news stories.
A key surprising word or concept in the headline is redacted as [REDACTED].
Provide 3 progressive detective clues (from cryptic to clear) and 4 multiple-choice suspects.

Format strictly as JSON array:
[
  {
    "id": "det-1",
    "redactedHeadline": "Headline with [REDACTED]",
    "secretWord": "The word",
    "clues": ["Clue 1", "Clue 2", "Clue 3"],
    "options": ["Suspect 1", "Suspect 2", "Suspect 3", "Suspect 4"],
    "correctIndex": 0,
    "fullStory": "The complete real story",
    "knowledgeLesson": "What you learn about the world/science from this"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Output strictly a JSON array. High curiosity, engaging and witty.',
        temperature: 0.7,
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = parseGeminiJson(response.text || '', FALLBACK_DETECTIVES);
    return res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Error generating Headline Detective:', err);
    return res.json({ success: true, data: FALLBACK_DETECTIVES, fallback: true });
  }
});

// Endpoint 4: Deep Dive / Ask Gemini ("Explain This News To Me")
app.post('/api/news-quiz/deep-dive', async (req, res) => {
  try {
    const { headline, userQuestion, topic } = req.body || {};
    if (!headline) {
      return res.status(400).json({ error: 'Headline is required' });
    }

    const prompt = `
You are an engaging, brilliant science and news tutor in the game "NewsCade".
The user wants to learn more about this news topic:
Headline: "${headline}"
Context / Topic: "${topic || 'General News'}"
User's Question: "${userQuestion || 'Can you explain the backstory, how it works, and why this matters to an everyday person?'}"

Provide a concise, exciting, easy-to-digest breakdown in 3 sections:
1. 🔍 **The Deep Story (In Simple Terms)**: 2-3 engaging paragraphs explaining what actually happened and the underlying mechanics.
2. 💡 **Historical Connection or Parallels**: How this relates to past discoveries or cultural history.
3. 🚀 **Future Impact / The Big Takeaway**: What this means for human society, technology, or our planet in the next 5-10 years.
Plus include 2 quick follow-up curiosity questions the user might wonder about.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an enthusiastic polymath educator like Carl Sagan meets a friendly game mentor. Keep formatting crisp and visually appealing with emojis and bold headers.',
        temperature: 0.7,
      }
    });

    return res.json({ success: true, explanation: response.text || 'No response generated.' });
  } catch (err: any) {
    console.error('Error generating deep dive:', err);
    return res.status(500).json({
      error: 'Failed to generate deep dive',
      explanation: 'This topic represents an emerging milestone. Scientists and journalists continue exploring its wider implications for society and future technologies.'
    });
  }
});

// Endpoint 5: Quick Hint / Lifeline ("Ask Gemini Lifeline")
app.post('/api/news-quiz/hint', async (req, res) => {
  try {
    const { question, options, headline } = req.body || {};
    const prompt = `
You are a witty, helpful game show AI lifeline.
The player is stuck on this question:
Headline: "${headline}"
Question: "${question}"
Options: ${JSON.stringify(options)}

Give a playful 1-sentence or 2-sentence clever hint that guides the player's intuition towards the correct concept WITHOUT explicitly naming the exact answer or spoiling the choice index directly.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Be witty, friendly, and subtle. Maximum 2 sentences.',
        temperature: 0.7,
      }
    });

    return res.json({ success: true, hint: response.text?.trim() || 'Focus on the fundamental physical or biological principle at play!' });
  } catch (err) {
    return res.json({
      success: true,
      hint: 'Think about which choice represents a natural, sustainable physical mechanism rather than an extreme synthetic one!'
    });
  }
});

// Vite middleware or static serving
if (!isProduction) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NewsCade server running on port ${PORT}`);
});

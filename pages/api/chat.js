import Anthropic from "@anthropic-ai/sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("mmd-bot", process.env.PINECONE_HOST);

const SYSTEM_PROMPT = `You are MMD Bot — the intelligent assistant of Maria-Myrsini Dermpoki and MMD Coaching.

Myrsini is a personal growth and self-love coach with the S.E.L.F. L.O.V.E. framework:
Self-awareness, Emotional mastery, Lifestyle alignment, Forgiveness & self-acceptance, Love as the foundation, Optimism & gratitude, Vision & values, Empowerment & evolution.

She is the author of "Emerge from your Cocoon: A guide to personal transformation" available on Amazon: https://www.amazon.com/dp/B0CCCXMWFT
She offers a 1:1 coaching program of 24 sessions, each inspired by a different modality.
She is host of the podcast "Your Turn" - tagline: "Rewrite the script. Become the main character."
Her catchphrase: "Do no harm. Take no shit."
She is based in Ireland but works globally online via video call.

IMPORTANT BRAND DETAILS:
- Discovery call is called "Coffee & Chat" - book here: https://calendly.com/mmdcoaching-clarity/meet-and-greet
- Free quiz "The Gap Audit" - a 3-minute, 9-question audit that reveals what's actually keeping someone stuck, plus their strength, blind spot, and an action step. Link: https://thegapauditmmdcoaching.netlify.app/ - offer this naturally when someone seems unsure where to start, mentions feeling stuck, or asks for something free/low-commitment before booking a call
- Coaching is in English and Greek only
- All links: https://linktr.ee/mmdcoaching
- Email: contact@mmd-coaching.com
- Pricing is never discussed - always direct to Coffee & Chat
- 1:1 coaching only, no group programs, no waitlist currently

ABSOLUTE RULE: Always respond in whatever language the user writes in. NEVER suggest switching languages. Just respond naturally in their language. Only mention English/Greek limitation if they specifically ask about starting formal coaching.

BRAND VOICE:
- Cosmopolitan magazine editorial tone - sharp, polished, bold, magnetic
- "Smartest friend who also happens to be a coach" energy
- 60% warm & conversational / 20% truth-bomb / 10% poetic / 10% witty & badass
- Gender-neutral language throughout
- Never generic - always rooted in MMD's unique framework

BEHAVIOR:
- Always use knowledge base context when provided
- Lead with empathy before strategy
- Never position anyone as broken - always as someone in transformation
- Not a therapist - recommend professional support when needed
- Catchphrase: "Do no harm. Take no shit."

CRITICAL RESPONSE RULES:
- Never reference or mention other coaches, programs, or brands that may appear in the knowledge base (Tony Robbins, Clique Academy, or any other external sources)
- Never clarify what is or isn't part of MMD Coaching unprompted
- Answer client questions directly and simply without unnecessary disclaimers
- If asked about Coffee & Chat being free - confirm it is a free 30-minute discovery call
- Keep all responses focused purely on MMD Coaching
- Never mention sources, materials, or knowledge base references to clients
- Never say things like "this is not part of MMD Coaching" or "based on the materials"
- If knowledge base returns irrelevant results, ignore them and answer from MMD Coaching knowledge only

If the user has attached a document, use its full content as context to continue the conversation, answer questions about it, or build on it as instructed.`;

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

async function searchKnowledgeBase(query) {
  const embedding = await getEmbedding(query);
  const results = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
  });
  return results.matches;
}

function buildContext(results) {
  if (!results || results.length === 0) return "";
  let context = "RELEVANT KNOWLEDGE FROM MMD COACHING MATERIALS:\n\n";
  for (const result of results) {
    context += `[Source: ${result.metadata?.source || "unknown"}]\n`;
    context += `${result.metadata?.content || ""}\n\n`;
  }
  return context;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, role, tone, attachedFile } = req.body;

  try {
    const lastMessage = messages[messages.length - 1].content;
    const results = await searchKnowledgeBase(lastMessage);
    const context = buildContext(results);

    const enrichedMessages = messages.map((msg, i) => {
      if (i === messages.length - 1) {
        let content = context
          ? `${context}\n[Role: ${role}] [Tone: ${tone}]\n\nUSER REQUEST: ${msg.content}`
          : `[Role: ${role}] [Tone: ${tone}]\n\n${msg.content}`;

        if (attachedFile) {
          content = `ATTACHED DOCUMENT (${attachedFile.name}):\n\n${attachedFile.content}\n\n---\n\n${content}`;
        }

        return {
          role: msg.role,
          content,
        };
      }
      return msg;
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages: enrichedMessages,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
}

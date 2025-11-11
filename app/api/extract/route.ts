import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ENTITY_SCHEMA = `
Return strict JSON with keys:
- "entities": [{ "id": "E1", "name": "...", "type": "org|person|country|infrastructure|platform|operation|concept" }]
- "relations": [{ "src": "E1", "dst": "E2", "label": "uses|targets|finances|influences|sanctions|impacts|reports|linked_to", "evidence_url": "..." }]
- "key_findings": ["...","..."]
`;

export async function POST(req: NextRequest) {
  try {
    const { topic, keywords, rows, userEdits } = await req.json();
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }
    const corpus = (rows || []).slice(0, 30).map((r: any) =>
      `- ${r.title} | ${r.publisher || ''} | ${r.date || ''} | ${r.url}\n${r.snippet || ''}`
    ).join('\n');

    const extractionPrompt = `Topic: ${topic}
Keywords: ${keywords}
Sources:
${corpus}

Task: Identify salient entities and relationships relevant to the topic.
${ENTITY_SCHEMA}
Return ONLY JSON.`;

    const extResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You extract entities and relationships with sources. Output strict JSON."},
        { role: "user", content: extractionPrompt }
      ]
    });
    let payload = extResp.choices[0]?.message?.content || "{}";
    let parsed: any;
    try { parsed = JSON.parse(payload); } catch { parsed = { entities: [], relations: [], key_findings: [] }; }

    const cites = (rows || []).map((r: any, i: number) => `- [${r.title}](${r.url}) — ${r.publisher || ''} (${r.date || ''})`).join("\n");
    const reportPrompt = `You are writing an executive intel brief.

Topic: ${topic}
Keywords: ${keywords}

Key findings to emphasize:
${JSON.stringify(parsed.key_findings || [])}

Citations (use as sources with inline references [#]):
${cites}

Constraints:
- Concise, structured: Overview, Recent Developments (last 30–60 days), Tactics/Techniques (if relevant), Geo-economic impact, Risk Outlook (30–90 days), Indicators to Watch, Methodology & Sources.
- Use footnote-style numeric references [1], [2], etc. that map to the citations list below the brief.
- If user provided edits, incorporate them.

User edit instructions:
${userEdits || "None"}

Now produce the brief.
`;

    const repResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a senior intelligence analyst. Be concise, factual, sourced."},
        { role: "user", content: reportPrompt }
      ]
    });

    const report = repResp.choices[0]?.message?.content || "";
    return NextResponse.json({ graph: parsed, report });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

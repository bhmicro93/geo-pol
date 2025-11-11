import { NextRequest, NextResponse } from 'next/server';
import { fetchGdelt, fetchNvd, fetchCisaKev, fetchOpenAlex, SourceRow } from '@/lib/sources';

const TOPICS = [
  "Cyber attacks",
  "Cyberwar during elections",
  "Social media effects in elections",
  "Geopolitical relations",
  "Geopolitical effect on sea trades",
  "Geopolitical effects on aviation and forces",
  "Influence of AI in geopolitics",
];

export async function POST(req: NextRequest) {
  try {
    const { topic, keywords, maxItems = 60 } = await req.json();
    if (!topic || !TOPICS.includes(topic)) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }
    const q = `${topic} ${keywords || ''}`.trim();
    const tasks: Promise<SourceRow[]>[] = [ fetchGdelt(q, 30) ];

    if (/Cyber/i.test(topic) || /cyber/i.test(keywords || '')) {
      tasks.push(fetchNvd(keywords || '', 20));
      tasks.push(fetchCisaKev());
    }
    if (/social media|election|AI|geopolit/i.test(topic) || /election|social|AI/i.test(keywords || '')) {
      tasks.push(fetchOpenAlex(q, 12));
    }

    const results = (await Promise.all(tasks)).flat();
    const seen = new Set<string>();
    const uniq = results.filter(r => {
      const k = (r.url || '').slice(0, 200);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, maxItems);

    return NextResponse.json({ rows: uniq });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

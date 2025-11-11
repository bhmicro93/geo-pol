import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export async function POST(req: NextRequest) {
  try {
    const { topic, keywords, report, rows } = await req.json();
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: `${topic} — Intelligence Brief`, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: `Generated: ${new Date().toISOString()}` }),
          new Paragraph({ text: `Keywords: ${keywords}` }),
          ...String(report || '').split('\n').map((line: string) => new Paragraph({ children: [ new TextRun(line) ] })),
          new Paragraph({ text: 'Sources', heading: HeadingLevel.HEADING_2 }),
          ...(rows || []).map((r: any, i: number) => new Paragraph({ children: [
            new TextRun(`[${i+1}] ${r.title} — ${r.publisher || ''} (${r.date || ''}) ${r.url}`)
          ] }))
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${(topic || 'brief').replace(/\s+/g,'_')}.docx"`
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

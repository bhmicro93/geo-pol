'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Network } from 'vis-network/standalone';

const TOPICS = [
  "Cyber attacks",
  "Cyberwar during elections",
  "Social media effects in elections",
  "Geopolitical relations",
  "Geopolitical effect on sea trades",
  "Geopolitical effects on aviation and forces",
  "Influence of AI in geopolitics",
];

type Row = {
  source: string;
  title: string;
  url: string;
  publisher?: string;
  date?: string | number;
  lang?: string;
  snippet?: string;
  topic_hint?: string;
  cvss?: number;
  vendorProject?: string;
  product?: string;
};

export default function Home() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [keywords, setKeywords] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [userEdits, setUserEdits] = useState('');
  const [report, setReport] = useState('');
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const visRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);

  async function onSearch() {
    setLoading(true);
    setReport('');
    try {
      const r = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keywords, maxItems: 60 })
      });
      const js = await r.json();
      if (js.error) throw new Error(js.error);
      setRows(js.rows || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onExtract() {
    if (!rows.length) { alert('Run search first.'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keywords, rows, userEdits })
      });
      const js = await r.json();
      if (js.error) throw new Error(js.error);
      setGraph(js.graph);
      setReport(js.report);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!visRef.current || !graph) return;
    const nodes = (graph.entities || []).map((e: any) => ({
      id: e.id,
      label: e.name,
      shape: ({
        org:'ellipse', person:'dot', country:'hexagon', infrastructure:'triangle',
        platform:'square', operation:'diamond', concept:'star'
      } as any)[e.type] || 'dot'
    }));
    const edges = (graph.relations || []).map((r: any) => ({
      from: r.src, to: r.dst, label: r.label || 'linked_to', title: r.evidence_url || '', arrows: 'to'
    }));
    const data = { nodes, edges };
    const options = {
      physics: { enabled: true },
      edges: { smooth: true },
      nodes: { font: { size: 12 } },
      interaction: { hover: true, dragNodes: true, zoomView: true }
    };
    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(visRef.current, data, options);
  }, [graph]);

  async function downloadDocx() {
    const r = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, keywords, report, rows })
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g,'_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadXlsx() {
    const r = await fetch('/api/export/xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sources.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-4">Geo/Cyber Intelligence Agent (Vercel)</h1>

      <div className="grid md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm mb-1">Topic</label>
          <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full border rounded p-2">
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Keywords</label>
          <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g., Finland DDoS 2025 election disinformation NATO ports" className="w-full border rounded p-2" />
        </div>
        <div className="md:col-span-3 flex gap-2">
          <button onClick={onSearch} className="px-3 py-2 bg-black text-white rounded disabled:opacity-60" disabled={loading}>
            {loading ? 'Working...' : 'Search & Build'}
          </button>
          <button onClick={onExtract} className="px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-60" disabled={loading}>
            {loading ? 'Working...' : 'Generate Report + Graph'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm mb-1">Edit/Update Instructions</label>
        <textarea value={userEdits} onChange={e => setUserEdits(e.target.value)} className="w-full border rounded p-2 h-28" placeholder="E.g., emphasize Baltic ports, add 30–90d risk outlook, prioritize EU sources" />
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Sources</h2>
          <div className="border rounded p-2 h-[360px] overflow-auto bg-white">
            {!rows.length && <div className="text-sm text-gray-500">No sources yet.</div>}
            {rows.map((r, i) => (
              <div key={i} className="py-2 border-b last:border-b-0">
                <a href={r.url} target="_blank" className="font-medium underline">{r.title}</a>
                <div className="text-xs text-gray-600">{r.publisher} • {String(r.date || '')}</div>
                <div className="text-sm">{r.snippet}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Knowledge Graph</h2>
          <div ref={visRef} className="border rounded bg-white h-[360px]" />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Report Preview</h2>
        <div className="border rounded p-4 bg-white whitespace-pre-wrap">{report || '—'}</div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={downloadDocx} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60" disabled={!report}>Download Word (.docx)</button>
        <button onClick={downloadXlsx} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60" disabled={!rows.length}>Download Excel (.xlsx)</button>
      </div>

      <p className="text-xs text-gray-500 mt-6">Data: GDELT, NVD, CISA KEV, OpenAlex. LLM: OpenAI (server-side).</p>
    </main>
  );
}

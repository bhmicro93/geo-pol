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
      <div className="h1">Geo/Cyber Intelligence Agent (Minimal)</div>

      <div className="row row-3">
        <div>
          <label className="label">Topic</label>
          <select value={topic} onChange={e => setTopic(e.target.value)} className="select">
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Keywords</label>
          <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g., Finland DDoS 2025 election disinformation NATO ports" className="input" />
        </div>
        <div style={{display:'flex', gap:8, alignItems:'end'}}>
          <button onClick={onSearch} className="button" disabled={loading}>
            {loading ? 'Working...' : 'Search & Build'}
          </button>
          <button onClick={onExtract} className="button secondary" disabled={loading}>
            {loading ? 'Working...' : 'Generate Report + Graph'}
          </button>
        </div>
      </div>

      <div className="section" style={{display:'grid', gap:12, gridTemplateColumns:'1fr',  }}>
        <div style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr'}}>
          <div>
            <div className="label" style={{fontWeight:600}}>Sources</div>
            <div className="card list">
              {!rows.length && <div style={{color:'#666', fontSize:13}}>No sources yet.</div>}
              {rows.map((r, i) => (
                <div key={i} style={{padding:'8px 0', borderBottom:'1px solid #eee'}}>
                  <a href={r.url} target="_blank" style={{fontWeight:600, textDecoration:'underline'}}>{r.title}</a>
                  <div style={{fontSize:12, color:'#666'}}>{r.publisher} • {String(r.date || '')}</div>
                  <div style={{fontSize:14}}>{r.snippet}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="label" style={{fontWeight:600}}>Knowledge Graph</div>
            <div id="vis" ref={visRef} className="card" style={{height:360}} />
          </div>
        </div>
      </div>

      <div className="section">
        <label className="label">Edit/Update Instructions</label>
        <textarea value={userEdits} onChange={e => setUserEdits(e.target.value)} className="textarea" placeholder="E.g., emphasize Baltic ports, add 30–90d risk outlook, prioritize EU sources" />
      </div>

      <div className="section">
        <div className="label" style={{fontWeight:600}}>Report Preview</div>
        <div className="card mono">{report || '—'}</div>
      </div>

      <div className="section" style={{display:'flex', gap:8}}>
        <button onClick={downloadDocx} className="button" disabled={!report}>Download Word (.docx)</button>
        <button onClick={downloadXlsx} className="button" disabled={!rows.length}>Download Excel (.xlsx)</button>
      </div>

      <div className="footer">Data: GDELT, NVD, CISA KEV, OpenAlex. LLM: OpenAI.</div>
    </main>
  );
}

export type SourceRow = {
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

function cleanText(x?: string, maxlen=5000) {
  if (!x) return '';
  const t = x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > maxlen ? t.slice(0, maxlen) + '...' : t;
}

export async function fetchGdelt(query: string, maxItems=30): Promise<SourceRow[]> {
  const base = 'https://api.gdeltproject.org/api/v2/doc/doc';
  const params = new URLSearchParams({
    query,
    maxrecords: String(maxItems),
    format: 'JSON',
    timespan: '31d',
    sort: 'datedesc'
  });
  const r = await fetch(`${base}?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('GDELT error');
  const js = await r.json();
  const rows = (js.articles || []).map((a: any) => ({
    source: 'GDELT',
    title: a.title,
    url: a.url,
    publisher: a.domain,
    date: a.seendate,
    lang: a.language,
    snippet: cleanText(a.title),
    topic_hint: 'news',
  }));
  return rows;
}

export async function fetchNvd(keyword: string, maxItems=20): Promise<SourceRow[]> {
  const base = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
  const params = new URLSearchParams({
    keywordSearch: keyword,
    startIndex: '0',
    resultsPerPage: String(maxItems)
  });
  const r = await fetch(`${base}?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) return [];
  const js = await r.json();
  const out: SourceRow[] = [];
  for (const v of (js.vulnerabilities || [])) {
    const c = v.cve || {};
    const metrics = c.metrics || {};
    let cvss: number | undefined;
    for (const k of ['cvssMetricV31','cvssMetricV30','cvssMetricV2']) {
      if (metrics[k]) { cvss = metrics[k][0]?.cvssData?.baseScore; break; }
    }
    out.push({
      source: 'NVD',
      title: c.id,
      url: `https://nvd.nist.gov/vuln/detail/${c.id}`,
      publisher: 'NVD',
      date: c.published,
      lang: 'en',
      snippet: cleanText((c.descriptions?.[0]?.value) || ''),
      topic_hint: 'cve',
      cvss
    });
  }
  return out;
}

export async function fetchCisaKev(): Promise<SourceRow[]> {
  const url = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return [];
  const js = await r.json();
  return (js.vulnerabilities || []).map((it: any) => ({
    source: 'CISA-KEV',
    title: it.cveID,
    url: it.notes || `https://nvd.nist.gov/vuln/detail/${it.cveID}`,
    publisher: 'CISA',
    date: it.dateAdded,
    lang: 'en',
    snippet: cleanText(it.shortDescription || ''),
    topic_hint: 'kev',
    vendorProject: it.vendorProject,
    product: it.product
  }));
}

export async function fetchOpenAlex(query: string, maxItems=12): Promise<SourceRow[]> {
  const base = 'https://api.openalex.org/works';
  const params = new URLSearchParams({
    search: query,
    per_page: String(maxItems),
    sort: 'cited_by_count:desc'
  });
  const r = await fetch(`${base}?${params.toString()}`, { cache: 'no-store' });
  if (!r.ok) return [];
  const js = await r.json();
  return (js.results || []).map((w: any) => ({
    source: 'OpenAlex',
    title: w.title,
    url: w.id,
    publisher: w.host_venue?.publisher,
    date: w.publication_year,
    lang: 'en',
    snippet: '',
    topic_hint: 'scholarly'
  }));
}

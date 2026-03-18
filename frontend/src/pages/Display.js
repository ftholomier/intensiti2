import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getMediaUrl } from '../lib/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

/* Countdown */
function CountdownWidget({ targetDate, label }) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setT({ d: Math.floor(diff / 864e5), h: Math.floor((diff % 864e5) / 36e5), m: Math.floor((diff % 36e5) / 6e4), s: Math.floor((diff % 6e4) / 1e3) });
    };
    calc(); const i = setInterval(calc, 1000); return () => clearInterval(i);
  }, [targetDate]);
  return (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <p className="text-xl md:text-3xl font-extralight mb-6 tracking-wide opacity-80">{label || 'Compte a rebours'}</p>
      <div className="flex gap-4 md:gap-8">
        {[{ v: t.d, l: 'J' }, { v: t.h, l: 'H' }, { v: t.m, l: 'M' }, { v: t.s, l: 'S' }].map(x => (
          <div key={x.l} className="text-center">
            <div className="display-countdown-digit">{String(x.v ?? 0).padStart(2, '0')}</div>
            <div className="text-[10px] md:text-xs opacity-40 mt-1 uppercase tracking-[0.2em]">{x.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* RSS Slide */
function RssSlideContent({ rssUrl }) {
  const [items, setItems] = useState([]);
  const [ci, setCi] = useState(0);
  useEffect(() => {
    if (!rssUrl) return;
    fetch(`${BACKEND_URL}/api/rss?url=${encodeURIComponent(rssUrl)}`)
      .then(r => r.json()).then(d => { if (d.items) setItems(d.items); }).catch(() => {});
  }, [rssUrl]);
  useEffect(() => {
    if (items.length <= 1) return;
    const i = setInterval(() => setCi(p => (p + 1) % items.length), 6000);
    return () => clearInterval(i);
  }, [items.length]);
  if (items.length === 0) return <div className="flex items-center justify-center h-full text-white/30">Chargement du flux RSS...</div>;
  return (
    <div className="flex flex-col items-center justify-center h-full px-12 text-white">
      <div className="text-center max-w-4xl">
        <div className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-300 rounded-full text-xs uppercase tracking-widest font-medium mb-8">Flux RSS</div>
        <p className="text-3xl md:text-5xl font-bold leading-tight animate-fade-in-display" key={ci}>{items[ci]}</p>
      </div>
    </div>
  );
}

/* PDF Slide */
function PdfSlideContent({ url, pageDuration, onAllPagesShown }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages: np }) => {
    setNumPages(np);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!numPages || numPages <= 0) return;
    const dur = (pageDuration || 8) * 1000;
    timerRef.current = setTimeout(() => {
      if (currentPage < numPages) {
        setCurrentPage(p => p + 1);
      } else if (onAllPagesShown) {
        onAllPagesShown();
      }
    }, dur);
    return () => clearTimeout(timerRef.current);
  }, [currentPage, numPages, pageDuration, onAllPagesShown]);

  const pdfUrl = url ? getMediaUrl(url) : null;

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center h-full w-full bg-white relative overflow-hidden">
      {pdfUrl && (
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-slate-400 text-lg">Chargement du PDF...</div>}
          error={<div className="text-red-400 text-lg">Erreur de chargement PDF</div>}>
          <Page pageNumber={currentPage} height={containerSize.height - 40}
            renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      )}
      {numPages && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 px-4 py-1.5 rounded-full">
          <span className="text-white text-xs font-medium">{currentPage} / {numPages}</span>
        </div>
      )}
    </div>
  );
}

/* Single Content */
function SingleContent({ type, content, fitMode, onDone }) {
  const c = content || {};
  const fit = fitMode === 'fill' ? 'cover' : 'contain';
  if (type === 'media' && c.type === 'image') return <img src={getMediaUrl(c.url)} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />;
  if (type === 'media' && c.type === 'video') return <video src={getMediaUrl(c.url)} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />;
  if (type === 'media' && c.type === 'pdf') return <PdfSlideContent url={c.url} pageDuration={c.page_duration} onAllPagesShown={onDone} />;
  if (type === 'youtube') { const ytId = extractYouTubeId(c.url); return ytId ? <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0`} className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay" allowFullScreen title="YT" /> : null; }
  if (type === 'qrcode') return <div className="flex flex-col items-center justify-center h-full"><div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl shadow-white/10"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(c.url || 'https://example.com')}`} alt="QR" className="w-48 h-48 md:w-64 md:h-64" /></div></div>;
  if (type === 'countdown') return <CountdownWidget targetDate={c.target_date} label={c.label} />;
  if (type === 'text') return <div className="flex items-center justify-center h-full px-8 md:px-20"><div className="display-text-content" dangerouslySetInnerHTML={{ __html: c.html || c.text || '' }} /></div>;
  if (type === 'rss') return <RssSlideContent rssUrl={c.rss_url} />;
  if (type === 'pdf') return <PdfSlideContent url={c.url} pageDuration={c.page_duration} onAllPagesShown={onDone} />;
  return null;
}

/* Slide Content */
function SlideContent({ slide, onDone }) {
  if (!slide) return null;
  if (slide.layout === 'split' || slide.layout === 'split-immersion') {
    return (
      <div className="flex w-full h-full">
        <div className="w-1/2 h-full relative overflow-hidden border-r border-white/5">
          <SingleContent type={slide.split_left_type || slide.type} content={slide.split_left_content || slide.content} fitMode={slide.fit_mode} />
        </div>
        <div className="w-1/2 h-full relative overflow-hidden">
          <SingleContent type={slide.split_right_type || slide.type} content={slide.split_right_content || {}} fitMode={slide.fit_mode} />
        </div>
      </div>
    );
  }
  return <SingleContent type={slide.type} content={slide.content} fitMode={slide.fit_mode} onDone={onDone} />;
}

const DAYS_FR = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim' };

export default function Display() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [ci, setCi] = useState(0);
  const [pi, setPi] = useState(-1);
  const [trans, setTrans] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [rssItems, setRssItems] = useState([]);
  const [time, setTime] = useState(new Date());
  const [err, setErr] = useState(null);
  const stRef = useRef(null);
  const ttRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/display/${code}`);
      if (!r.ok) throw new Error('Ecran non trouve');
      const d = await r.json();
      // Handle force_refresh: if flag is set, clear it and force full page reload
      if (d.screen?.force_refresh) {
        // Clear the flag via heartbeat
        fetch(`${BACKEND_URL}/api/screens/${d.screen.id}/heartbeat`, { method: 'POST' }).catch(() => {});
        // Force reload entire page
        window.location.reload();
        return;
      }
      setData(d);
      setErr(null);
    } catch (e) { setErr(e.message); }
  }, [code]);

  const fetchWeather = useCallback(async () => {
    const city = data?.screen?.weather_city;
    if (!city) return;
    try {
      const [wr, fr] = await Promise.all([
        fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(city)}`),
        fetch(`${BACKEND_URL}/api/weather/forecast?city=${encodeURIComponent(city)}`)
      ]);
      const wd = await wr.json(); const fd = await fr.json();
      if (wd.temp != null) setWeather(wd);
      if (fd.forecast) setForecast(fd.forecast);
    } catch {}
  }, [data?.screen?.weather_city]);

  const fetchRss = useCallback(async () => {
    const s = data?.settings || {};
    if (s.ticker_rss_enabled === false) { setRssItems([]); return; }
    const urls = [];
    if (s.footer_rss_url) urls.push(s.footer_rss_url);
    (s.rss_items || []).filter(i => i.is_active).forEach(i => { if (i.url) urls.push(i.url); });
    if (urls.length === 0) { setRssItems([]); return; }
    try {
      if (urls.length === 1) {
        const r = await fetch(`${BACKEND_URL}/api/rss?url=${encodeURIComponent(urls[0])}`);
        const d = await r.json(); if (d.items) setRssItems(d.items);
      } else {
        const r = await fetch(`${BACKEND_URL}/api/rss/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls }) });
        const d = await r.json(); if (d.items) setRssItems(d.items);
      }
    } catch {}
  }, [data?.settings]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);
  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  useEffect(() => { const i = setInterval(fetchWeather, 900000); return () => clearInterval(i); }, [fetchWeather]);
  useEffect(() => { fetchRss(); }, [fetchRss]);
  useEffect(() => { const i = setInterval(fetchRss, 600000); return () => clearInterval(i); }, [fetchRss]);
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);

  // CRITICAL: useMemo to stabilize slides reference so useEffect timer works
  const slides = useMemo(() => {
    return (data?.playlist?.slides || []).filter(s => {
      if (!s.is_active) return false;
      const now = new Date();
      if (s.schedule_start && new Date(s.schedule_start) > now) return false;
      if (s.schedule_end && new Date(s.schedule_end) < now) return false;
      return true;
    });
  }, [data?.playlist?.slides]);

  // Slide advancement
  useEffect(() => {
    if (slides.length <= 1) return;
    const cur = slides[ci];
    if (!cur) return;

    // PDF slides manage their own advancement
    const isPdf = cur.type === 'pdf' || cur.content?.type === 'pdf';
    if (isPdf) return;

    const dur = (cur.duration || 10) * 1000;
    stRef.current = setTimeout(() => {
      const ni = (ci + 1) % slides.length;
      setPi(ci);
      setCi(ni);
      setTrans(true);
      ttRef.current = setTimeout(() => { setTrans(false); setPi(-1); }, 1000);
    }, dur);

    return () => { clearTimeout(stRef.current); clearTimeout(ttRef.current); };
  }, [ci, slides]);

  const handlePdfDone = useCallback(() => {
    if (slides.length <= 1) return;
    const ni = (ci + 1) % slides.length;
    setPi(ci);
    setCi(ni);
    setTrans(true);
    setTimeout(() => { setTrans(false); setPi(-1); }, 1000);
  }, [ci, slides.length]);

  const getTransClass = (slide, entering) => {
    const s = data?.settings || {};
    let t = slide?.transition || s.default_transition || 'fade';
    if (t === 'random') t = Math.random() > 0.5 ? 'fade' : 'slide';
    if (t === 'none') return '';
    return entering
      ? (t === 'slide' ? 'animate-slide-in-display' : 'animate-fade-in-display')
      : (t === 'slide' ? 'animate-slide-out-display' : 'animate-fade-out-display');
  };

  const s = data?.settings || {};
  const scr = data?.screen || {};
  const flash = data?.flash_alert;
  const cur = slides[ci];
  const immersion = scr.settings?.immersion || cur?.layout === 'immersion' || cur?.layout === 'split-immersion';

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const secStr = time.toLocaleTimeString('fr-FR', { second: '2-digit' }).split(':').pop();
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const footerTexts = (s.ticker_text_enabled !== false) ? (s.footer_items || []).filter(i => i.is_active).map(i => i.text) : [];
  const rssTexts = (s.ticker_rss_enabled !== false) ? rssItems : [];
  const allTickerTexts = [...footerTexts, ...rssTexts];
  const tickerText = allTickerTexts.length > 0 ? allTickerTexts.join('   \u2022   ') : (s.footer_text || 'Bienvenue');
  const tickerSpeed = s.ticker_speed || 30;

  const blockStyle = {
    background: s.block_bg || 'rgba(255,255,255,0.06)',
    padding: `${s.block_padding_v || 6}px ${s.block_padding_h || 14}px`,
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
    color: s.block_text_color || s.text_color || '#fff',
    display: 'flex', alignItems: 'center', gap: '6px',
    height: `${Math.max((s.header_height || 72) - 24, 32)}px`,
  };

  if (err) return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center"><p className="text-7xl font-mono font-bold text-indigo-400 tracking-[0.3em] mb-4">{code}</p><p className="text-lg text-white/40">{err}</p>
        <button onClick={fetchData} className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white/60 transition" data-testid="retry-btn">Reessayer</button></div></div>
  );
  if (!data) return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /></div>
  );

  // Build WYSIWYG font size CSS
  const fontSizeCSS = `
    .display-text-content font[size="1"] { font-size: ${s.wysiwyg_size_small || 12}px !important; }
    .display-text-content font[size="2"] { font-size: ${s.wysiwyg_size_normal || 16}px !important; }
    .display-text-content font[size="3"] { font-size: ${s.wysiwyg_size_medium || 20}px !important; }
    .display-text-content font[size="4"] { font-size: ${s.wysiwyg_size_large || 28}px !important; }
    .display-text-content font[size="5"] { font-size: ${s.wysiwyg_size_xlarge || 40}px !important; }
    .display-text-content font[size="6"], .display-text-content font[size="7"] { font-size: ${s.wysiwyg_size_huge || 56}px !important; }
  `;

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none cursor-none" data-testid="display-view">
      {/* Custom CSS + font size injection */}
      <style dangerouslySetInnerHTML={{ __html: fontSizeCSS + (s.custom_css || '') }} />
      {flash?.is_active && (
        <div className="absolute inset-0 z-50 flex items-center justify-center animate-pulse-slow" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}>
          <div className="text-center px-12">
            <div className="inline-block px-6 py-2 bg-white/10 rounded-full text-sm uppercase tracking-[0.3em] font-medium mb-8">Alerte Flash</div>
            <p className="text-4xl md:text-6xl font-bold leading-tight">{flash.message}</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full z-20 transition-all duration-700 ease-out"
        style={{ height: immersion ? 0 : `${s.header_height || 72}px`, opacity: immersion ? 0 : 1, overflow: 'hidden' }} data-testid="display-header">
        <div className="h-full w-full flex items-center justify-between px-5" style={{ backgroundColor: s.header_bg || '#0F172A' }}>
          <div style={blockStyle}>
            {s.logo_url ? <img src={getMediaUrl(s.logo_url)} alt="" style={{ height: `${Math.max((s.header_height || 72) - 36, 20)}px`, objectFit: 'contain' }} /> : <span className="font-bold tracking-tight" style={{ color: s.block_text_color || '#fff' }}>Intensiti</span>}
          </div>
          <div className="flex items-center gap-3">
            <div style={blockStyle}>
              <span className="font-bold font-mono tabular-nums tracking-tight" style={{ fontSize: `${s.time_font_size || 32}px` }}>{timeStr}</span>
              <span className="font-mono opacity-40" style={{ fontSize: `${Math.max((s.time_font_size || 32) * 0.4, 10)}px` }}>{secStr}</span>
            </div>
            <div style={blockStyle} className="hidden md:flex">
              <span className="font-medium capitalize" style={{ fontSize: `${s.date_font_size || 14}px`, opacity: 0.85 }}>{dateStr}</span>
            </div>
            {weather && weather.temp != null && (
              <div style={blockStyle}>
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="" className="w-9 h-9 -ml-1" />
                <div>
                  <span className="font-bold" style={{ fontSize: `${s.weather_font_size || 18}px` }}>{weather.temp}&#176;</span>
                  <p className="leading-none capitalize" style={{ fontSize: '10px', opacity: 0.5 }}>{weather.city}</p>
                </div>
                {forecast.length > 0 && (
                  <div className="flex gap-2 ml-2 pl-2 border-l border-white/10">
                    {forecast.map((f, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[9px] opacity-50 capitalize">{DAYS_FR[f.day_name?.toLowerCase()] || f.day_name?.substring(0, 3)}</p>
                        <img src={`https://openweathermap.org/img/wn/${f.icon}.png`} alt="" className="w-6 h-6 mx-auto -my-0.5" />
                        <p className="text-[10px] font-bold">{Math.round(f.temp_max)}&#176;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="absolute left-0 w-full z-10 transition-all duration-700 ease-out"
        style={{ top: immersion ? 0 : `${s.header_height || 72}px`, bottom: immersion ? 0 : `${s.footer_height || 44}px`, backgroundColor: s.content_bg || '#000' }} data-testid="display-main">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            <p className="text-7xl md:text-9xl font-mono font-bold tracking-[0.4em] bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">{scr.pairing_code}</p>
            <p className="text-base text-white/30 font-light">En attente de contenu</p>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            {trans && pi >= 0 && pi < slides.length && (
              <div className={`absolute inset-0 z-10 ${getTransClass(slides[pi], false)}`}><SlideContent slide={slides[pi]} /></div>
            )}
            <div className={`absolute inset-0 z-20 ${trans ? getTransClass(slides[ci], true) : ''}`}>
              <SlideContent slide={slides[ci]} onDone={handlePdfDone} />
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 left-0 w-full z-20 transition-all duration-700 ease-out"
        style={{ height: immersion ? 0 : `${s.footer_height || 44}px`, opacity: immersion ? 0 : 1, overflow: 'hidden' }} data-testid="display-footer">
        <div className="h-full w-full flex items-center" style={{ backgroundColor: s.footer_bg || '#0F172A' }}>
          <div className="display-ticker" style={{ '--ticker-bg': s.footer_bg || '#0F172A' }}>
            <span className="display-ticker-text" style={{
              color: s.text_color || '#fff',
              fontSize: `${s.footer_font_size || 15}px`,
              animationDuration: `${tickerSpeed}s`
            }}>
              {tickerText}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;{tickerText}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

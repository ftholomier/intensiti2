import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMediaUrl } from '../lib/api';

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

/* Slide Content */
function SlideContent({ slide }) {
  if (!slide) return null;
  const c = slide.content || {};
  const fit = slide.fit_mode === 'fill' ? 'cover' : 'contain';
  if (slide.type === 'media' && c.type === 'image') return <img src={getMediaUrl(c.url)} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />;
  if (slide.type === 'media' && c.type === 'video') return <video src={getMediaUrl(c.url)} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />;
  if (slide.type === 'youtube') { const ytId = extractYouTubeId(c.url); return ytId ? <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0`} className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay" allowFullScreen title="YT" /> : null; }
  if (slide.type === 'qrcode') return <div className="flex flex-col items-center justify-center h-full"><div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl shadow-white/10"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(c.url || 'https://example.com')}`} alt="QR" className="w-48 h-48 md:w-64 md:h-64" /></div><p className="text-white/40 text-xs mt-4 max-w-xs truncate">{c.url}</p></div>;
  if (slide.type === 'countdown') return <CountdownWidget targetDate={c.target_date} label={c.label} />;
  if (slide.type === 'text') return <div className="flex items-center justify-center h-full px-8 md:px-20"><div className="display-text-content" dangerouslySetInnerHTML={{ __html: c.html || c.text || '' }} /></div>;
  return null;
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
      setData(await r.json()); setErr(null);
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
    const url = data?.settings?.footer_rss_url;
    if (!url) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/rss?url=${encodeURIComponent(url)}`);
      const d = await r.json();
      if (d.items) setRssItems(d.items);
    } catch {}
  }, [data?.settings?.footer_rss_url]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);
  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  useEffect(() => { const i = setInterval(fetchWeather, 900000); return () => clearInterval(i); }, [fetchWeather]);
  useEffect(() => { fetchRss(); }, [fetchRss]);
  useEffect(() => { const i = setInterval(fetchRss, 600000); return () => clearInterval(i); }, [fetchRss]);
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === 'F5') { e.preventDefault(); fetchData(); fetchWeather(); fetchRss(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [fetchData, fetchWeather, fetchRss]);

  const slides = (data?.playlist?.slides || []).filter(s => {
    if (!s.is_active) return false;
    const now = new Date();
    if (s.schedule_start && new Date(s.schedule_start) > now) return false;
    if (s.schedule_end && new Date(s.schedule_end) < now) return false;
    return true;
  });

  useEffect(() => {
    if (slides.length <= 1) return;
    const dur = (slides[ci]?.duration || 10) * 1000;
    stRef.current = setTimeout(() => {
      const ni = (ci + 1) % slides.length;
      setPi(ci); setCi(ni); setTrans(true);
      ttRef.current = setTimeout(() => { setTrans(false); setPi(-1); }, 1000);
    }, dur);
    return () => { clearTimeout(stRef.current); clearTimeout(ttRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ci, slides.length]);

  const tClass = (slide, entering) => {
    let t = slide?.transition || 'fade';
    if (t === 'random') t = Math.random() > 0.5 ? 'fade' : 'slide';
    return entering
      ? (t === 'slide' ? 'animate-slide-in-display' : 'animate-fade-in-display')
      : (t === 'slide' ? 'animate-slide-out-display' : 'animate-fade-out-display');
  };

  const s = data?.settings || {};
  const scr = data?.screen || {};
  const flash = data?.flash_alert;
  const cur = slides[ci];
  const immersion = scr.settings?.immersion || cur?.layout === 'immersion';

  // 50/50 split
  const isSplit = cur?.layout === 'split';
  const leftContent = isSplit ? cur : null;
  const rightContent = isSplit ? { ...cur, content: cur.content_right, type: cur.type_right || cur.type } : null;

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const secStr = time.toLocaleTimeString('fr-FR', { second: '2-digit' }).split(':').pop();
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Build ticker text
  const footerItems = (s.footer_items || []).filter(i => i.is_active).map(i => i.text);
  const allTickerTexts = [...footerItems, ...rssItems];
  const tickerText = allTickerTexts.length > 0 ? allTickerTexts.join('   \u2022   ') : (s.footer_text || 'Bienvenue');

  // Block style helper
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

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none cursor-none" data-testid="display-view">
      {/* Flash Alert */}
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
          {/* Logo */}
          <div style={blockStyle}>
            {s.logo_url ? <img src={getMediaUrl(s.logo_url)} alt="" style={{ height: `${Math.max((s.header_height || 72) - 36, 20)}px`, objectFit: 'contain' }} /> : <span className="font-bold tracking-tight" style={{ color: s.block_text_color || '#fff' }}>Intensiti</span>}
          </div>

          <div className="flex items-center gap-3">
            {/* Time */}
            <div style={blockStyle}>
              <span className="font-bold font-mono tabular-nums tracking-tight" style={{ fontSize: `${s.time_font_size || 32}px`, color: s.block_text_color || '#fff' }}>{timeStr}</span>
              <span className="font-mono opacity-40" style={{ fontSize: `${Math.max((s.time_font_size || 32) * 0.4, 10)}px`, color: s.block_text_color || '#fff' }}>{secStr}</span>
            </div>
            {/* Date */}
            <div style={blockStyle} className="hidden md:flex">
              <span className="font-medium capitalize" style={{ fontSize: `${s.date_font_size || 14}px`, color: s.block_text_color || '#fff', opacity: 0.85 }}>{dateStr}</span>
            </div>
            {/* Weather current + forecast */}
            {weather && weather.temp != null && (
              <div style={blockStyle}>
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="" className="w-9 h-9 -ml-1" />
                <div>
                  <span className="font-bold" style={{ fontSize: `${s.weather_font_size || 18}px`, color: s.block_text_color || '#fff' }}>{weather.temp}&#176;</span>
                  <p className="leading-none capitalize" style={{ fontSize: '10px', color: s.block_text_color || '#fff', opacity: 0.5 }}>{weather.city}</p>
                </div>
                {/* 3-day mini forecast */}
                {forecast.length > 0 && (
                  <div className="flex gap-2 ml-2 pl-2 border-l border-white/10">
                    {forecast.map((f, i) => (
                      <div key={i} className="text-center" style={{ color: s.block_text_color || '#fff' }}>
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

      {/* MAIN ZONE */}
      <div className="absolute left-0 w-full z-10 transition-all duration-700 ease-out"
        style={{ top: immersion ? 0 : `${s.header_height || 72}px`, bottom: immersion ? 0 : `${s.footer_height || 44}px`, backgroundColor: s.content_bg || '#000' }} data-testid="display-main">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            <p className="text-7xl md:text-9xl font-mono font-bold tracking-[0.4em] bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">{scr.pairing_code}</p>
            <p className="text-base text-white/30 font-light">En attente de contenu</p>
            <p className="text-xs text-white/15 mt-2">{scr.name}</p>
          </div>
        ) : isSplit ? (
          <div className="flex w-full h-full">
            <div className="w-1/2 h-full relative overflow-hidden border-r border-white/5"><SlideContent slide={leftContent} /></div>
            <div className="w-1/2 h-full relative overflow-hidden"><SlideContent slide={rightContent} /></div>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            {trans && pi >= 0 && pi < slides.length && (
              <div className={`absolute inset-0 z-10 ${tClass(slides[ci], false)}`}><SlideContent slide={slides[pi]} /></div>
            )}
            <div className={`absolute inset-0 z-20 ${trans ? tClass(slides[ci], true) : ''}`}><SlideContent slide={slides[ci]} /></div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-0 left-0 w-full z-20 transition-all duration-700 ease-out"
        style={{ height: immersion ? 0 : `${s.footer_height || 44}px`, opacity: immersion ? 0 : 1, overflow: 'hidden' }} data-testid="display-footer">
        <div className="h-full w-full flex items-center" style={{ backgroundColor: s.footer_bg || '#0F172A' }}>
          <div className="display-ticker" style={{ '--ticker-bg': s.footer_bg || '#0F172A' }}>
            <span className="display-ticker-text" style={{ color: s.text_color || '#fff', fontSize: `${s.footer_font_size || 15}px` }}>
              {tickerText}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;{tickerText}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

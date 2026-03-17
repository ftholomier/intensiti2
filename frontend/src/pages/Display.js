import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMediaUrl } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

/* ── Countdown ── */
function CountdownWidget({ targetDate, label }) {
  const [t, setT] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setT({ d: Math.floor(diff / 864e5), h: Math.floor((diff % 864e5) / 36e5), m: Math.floor((diff % 36e5) / 6e4), s: Math.floor((diff % 6e4) / 1e3) });
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
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

/* ── Slide Content ── */
function SlideContent({ slide }) {
  if (!slide) return null;
  const c = slide.content || {};
  const fit = slide.fit_mode === 'fill' ? 'cover' : 'contain';

  if (slide.type === 'media' && c.type === 'image') {
    return <img src={getMediaUrl(c.url)} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />;
  }
  if (slide.type === 'media' && c.type === 'video') {
    return <video src={getMediaUrl(c.url)} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full" style={{ objectFit: fit }} />;
  }
  if (slide.type === 'youtube') {
    const ytId = extractYouTubeId(c.url);
    return ytId ? (
      <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&showinfo=0`}
        className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen title="YT" />
    ) : null;
  }
  if (slide.type === 'qrcode') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl shadow-white/10">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(c.url || 'https://example.com')}`}
            alt="QR Code" className="w-48 h-48 md:w-64 md:h-64" />
        </div>
        <p className="text-white/40 text-xs mt-4 max-w-xs truncate">{c.url}</p>
      </div>
    );
  }
  if (slide.type === 'countdown') return <CountdownWidget targetDate={c.target_date} label={c.label} />;
  if (slide.type === 'text') {
    return (
      <div className="flex items-center justify-center h-full px-8 md:px-20">
        <div className="display-text-content" dangerouslySetInnerHTML={{ __html: c.html || c.text || '' }} />
      </div>
    );
  }
  return null;
}

/* ── Main Display ── */
export default function Display() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [ci, setCi] = useState(0); // current index
  const [pi, setPi] = useState(-1); // previous index
  const [trans, setTrans] = useState(false);
  const [weather, setWeather] = useState(null);
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
    if (!data?.screen?.weather_city) return;
    try {
      const r = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(data.screen.weather_city)}`);
      const d = await r.json();
      if (d.temp != null) setWeather(d);
    } catch {}
  }, [data?.screen?.weather_city]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);
  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  useEffect(() => { const i = setInterval(fetchWeather, 900000); return () => clearInterval(i); }, [fetchWeather]);
  useEffect(() => { const i = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const h = (e) => { if (e.key === 'F5') { e.preventDefault(); fetchData(); fetchWeather(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [fetchData, fetchWeather]);

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
    if (t === 'fade') return entering ? 'animate-fade-in-display' : 'animate-fade-out-display';
    if (t === 'slide') return entering ? 'animate-slide-in-display' : 'animate-slide-out-display';
    return '';
  };

  const s = data?.settings || {};
  const scr = data?.screen || {};
  const flash = data?.flash_alert;
  const cur = slides[ci];
  const immersion = scr.settings?.immersion || cur?.layout === 'immersion';
  const isSplit = cur?.layout === 'split-left' || cur?.layout === 'split-right';
  const partner = isSplit ? slides.find((sl, i) => i !== ci && (cur.layout === 'split-left' ? sl.layout === 'split-right' : sl.layout === 'split-left') && sl.is_active) : null;
  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const secStr = time.toLocaleTimeString('fr-FR', { second: '2-digit' }).split(':').pop();
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (err) return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center"><p className="text-7xl font-mono font-bold text-indigo-400 tracking-[0.3em] mb-4">{code}</p><p className="text-lg text-white/40">{err}</p>
        <button onClick={fetchData} className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white/60 transition" data-testid="retry-btn">Reessayer</button>
      </div>
    </div>
  );
  if (!data) return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
    </div>
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

      {/* ═══ HEADER ═══ */}
      <div className="absolute top-0 left-0 w-full z-20 transition-all duration-700 ease-out"
        style={{ height: immersion ? 0 : '72px', opacity: immersion ? 0 : 1, overflow: 'hidden' }} data-testid="display-header">
        <div className="h-full w-full flex items-center justify-between px-5" style={{ backgroundColor: s.header_bg || '#0F172A' }}>
          {/* Logo */}
          <div className="display-header-block" style={{ borderColor: `${s.text_color || '#fff'}15` }}>
            {s.logo_url ? (
              <img src={getMediaUrl(s.logo_url)} alt="" className="h-8 md:h-10 object-contain" />
            ) : (
              <span className="text-base font-bold tracking-tight" style={{ color: s.text_color || '#fff' }}>Intensiti</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Time */}
            <div className="display-header-block" style={{ borderColor: `${s.text_color || '#fff'}15` }}>
              <span className="text-2xl md:text-3xl font-bold font-mono tabular-nums tracking-tight" style={{ color: s.text_color || '#fff' }}>
                {timeStr}
              </span>
              <span className="text-xs font-mono opacity-40 ml-1" style={{ color: s.text_color || '#fff' }}>{secStr}</span>
            </div>

            {/* Date */}
            <div className="display-header-block hidden md:flex" style={{ borderColor: `${s.text_color || '#fff'}15` }}>
              <span className="text-sm font-medium capitalize" style={{ color: s.text_color || '#fff', opacity: 0.85 }}>{dateStr}</span>
            </div>

            {/* Weather */}
            {weather && weather.temp != null && (
              <div className="display-header-block" style={{ borderColor: `${s.text_color || '#fff'}15` }}>
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="" className="w-9 h-9 -ml-1" />
                <div>
                  <span className="text-lg font-bold" style={{ color: s.text_color || '#fff' }}>{weather.temp}&#176;</span>
                  <p className="text-[10px] capitalize leading-none" style={{ color: s.text_color || '#fff', opacity: 0.5 }}>{weather.city}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MAIN ZONE ═══ */}
      <div className="absolute left-0 w-full z-10 bg-black transition-all duration-700 ease-out"
        style={{ top: immersion ? 0 : '72px', bottom: immersion ? 0 : '44px' }} data-testid="display-main">
        {slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
            <p className="text-7xl md:text-9xl font-mono font-bold tracking-[0.4em] bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
              {scr.pairing_code}
            </p>
            <p className="text-base text-white/30 font-light">En attente de contenu</p>
            <p className="text-xs text-white/15 mt-2">{scr.name}</p>
          </div>
        ) : isSplit && partner ? (
          <div className="flex w-full h-full">
            <div className="w-1/2 h-full relative overflow-hidden border-r border-white/5"><SlideContent slide={cur} /></div>
            <div className="w-1/2 h-full relative overflow-hidden"><SlideContent slide={partner} /></div>
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

      {/* ═══ FOOTER ═══ */}
      <div className="absolute bottom-0 left-0 w-full z-20 transition-all duration-700 ease-out"
        style={{ height: immersion ? 0 : '44px', opacity: immersion ? 0 : 1, overflow: 'hidden' }} data-testid="display-footer">
        <div className="h-full w-full flex items-center" style={{ backgroundColor: s.footer_bg || '#0F172A' }}>
          <div className="display-ticker" style={{ color: s.text_color || '#fff' }}>
            <span className="display-ticker-text">
              {s.footer_text || 'Bienvenue'}
              &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;
              {s.footer_text || 'Bienvenue'}
              &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;
              {s.footer_text || 'Bienvenue'}
              &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;
              {s.footer_text || 'Bienvenue'}
              &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

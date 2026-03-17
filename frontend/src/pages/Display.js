import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMediaUrl } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : null;
}

function CountdownDisplay({ targetDate, label }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <p className="text-2xl md:text-4xl font-light mb-8 opacity-80">{label || 'Compte a rebours'}</p>
      <div className="flex gap-6 md:gap-12">
        {[
          { val: timeLeft.days, label: 'Jours' },
          { val: timeLeft.hours, label: 'Heures' },
          { val: timeLeft.minutes, label: 'Minutes' },
          { val: timeLeft.seconds, label: 'Secondes' },
        ].map(item => (
          <div key={item.label} className="text-center">
            <div className="text-5xl md:text-8xl font-bold font-mono tabular-nums">
              {String(item.val ?? 0).padStart(2, '0')}
            </div>
            <div className="text-sm md:text-base opacity-60 mt-2 uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideContent({ slide }) {
  if (!slide) return null;
  const type = slide.type;
  const content = slide.content || {};
  const fitMode = slide.fit_mode === 'fill' ? 'cover' : 'contain';

  if (type === 'media' && content.type === 'image') {
    return (
      <img
        src={getMediaUrl(content.url)}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: fitMode }}
      />
    );
  }
  if (type === 'media' && content.type === 'video') {
    return (
      <video
        src={getMediaUrl(content.url)}
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: fitMode }}
      />
    );
  }
  if (type === 'youtube') {
    const ytId = extractYouTubeId(content.url);
    return ytId ? (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1`}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="YouTube"
      />
    ) : null;
  }
  if (type === 'qrcode') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(content.url)}&bgcolor=000000&color=ffffff`}
          alt="QR Code"
          className="w-64 h-64 md:w-80 md:h-80"
        />
        <p className="text-white/60 text-sm mt-4 max-w-md truncate">{content.url}</p>
      </div>
    );
  }
  if (type === 'countdown') {
    return <CountdownDisplay targetDate={content.target_date} label={content.label} />;
  }
  if (type === 'text') {
    return (
      <div className="flex items-center justify-center h-full p-8 md:p-16">
        <div
          className="text-2xl md:text-4xl text-center max-w-4xl leading-relaxed text-white"
          dangerouslySetInnerHTML={{ __html: content.html || content.text || '' }}
        />
      </div>
    );
  }
  return null;
}

export default function Display() {
  const { code } = useParams();
  const [displayData, setDisplayData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [transitioning, setTransitioning] = useState(false);
  const [weather, setWeather] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState(null);
  const transitionTimeout = useRef(null);
  const slideTimeout = useRef(null);

  // Fetch display data
  const fetchData = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/display/${code}`);
      if (!res.ok) throw new Error('Ecran non trouve');
      const data = await res.json();
      setDisplayData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [code]);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    if (!displayData?.screen?.weather_city) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(displayData.screen.weather_city)}`);
      const data = await res.json();
      if (data.temp !== null && data.temp !== undefined) setWeather(data);
    } catch { /* silent */ }
  }, [displayData?.screen?.weather_city]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  useEffect(() => {
    const interval = setInterval(fetchWeather, 900000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: F5 to refresh data
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        fetchData();
        fetchWeather();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fetchData, fetchWeather]);

  // Active slides
  const activeSlides = (displayData?.playlist?.slides || []).filter(s => {
    if (!s.is_active) return false;
    const now = new Date();
    if (s.schedule_start && new Date(s.schedule_start) > now) return false;
    if (s.schedule_end && new Date(s.schedule_end) < now) return false;
    return true;
  });

  // Slide cycling
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const currentSlide = activeSlides[currentIndex];
    const duration = (currentSlide?.duration || 10) * 1000;

    slideTimeout.current = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % activeSlides.length;
      setPrevIndex(currentIndex);
      setCurrentIndex(nextIndex);
      setTransitioning(true);

      transitionTimeout.current = setTimeout(() => {
        setTransitioning(false);
        setPrevIndex(-1);
      }, 1000);
    }, duration);

    return () => {
      clearTimeout(slideTimeout.current);
      clearTimeout(transitionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, activeSlides.length]);

  // Transition classes
  const getTransitionClass = (slide, entering) => {
    let type = slide?.transition || 'fade';
    if (type === 'random') type = Math.random() > 0.5 ? 'fade' : 'slide';
    if (type === 'fade') return entering ? 'animate-fade-in-display' : 'animate-fade-out-display';
    if (type === 'slide') return entering ? 'animate-slide-in-display' : 'animate-slide-out-display';
    return '';
  };

  const settings = displayData?.settings || {};
  const screen = displayData?.screen || {};
  const flashAlert = displayData?.flash_alert;
  const currentSlide = activeSlides[currentIndex];

  // Per-slide immersion: hide header/footer if current slide has immersion layout
  const isImmersion = screen.settings?.immersion || currentSlide?.layout === 'immersion';

  // Split layout: check if current slide is split-left and next is split-right
  const isSplit = currentSlide?.layout === 'split-left' || currentSlide?.layout === 'split-right';
  const splitPartner = isSplit ? findSplitPartner(activeSlides, currentIndex) : null;

  const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-6xl font-mono font-bold mb-4 text-primary">{code}</p>
          <p className="text-xl text-white/60">{error}</p>
          <button
            onClick={fetchData}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            data-testid="retry-btn"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none cursor-none" data-testid="display-view">
      {/* Flash Alert Overlay */}
      {flashAlert?.is_active && (
        <div className="absolute inset-0 z-50 bg-red-600 flex items-center justify-center animate-pulse-slow">
          <div className="text-center p-12">
            <p className="text-5xl md:text-7xl font-bold mb-4">ALERTE</p>
            <p className="text-2xl md:text-4xl font-light">{flashAlert.message}</p>
          </div>
        </div>
      )}

      {/* Header Zone */}
      <div
        className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-6 md:px-10 transition-all duration-700"
        style={{
          backgroundColor: settings.header_bg || '#1E293B',
          color: settings.text_color || '#FFFFFF',
          height: isImmersion ? '0vh' : '12vh',
          opacity: isImmersion ? 0 : 1,
          overflow: 'hidden',
        }}
        data-testid="display-header"
      >
        <div className="flex items-center gap-4">
          {settings.logo_url ? (
            <img src={getMediaUrl(settings.logo_url)} alt="Logo" className="h-10 md:h-14 object-contain drop-shadow-md" />
          ) : (
            <span className="text-xl font-bold tracking-tight opacity-80">Intensiti</span>
          )}
        </div>
        <div className="flex items-center gap-6 md:gap-10">
          <div className="text-right">
            <p className="text-3xl md:text-4xl font-bold font-mono tabular-nums tracking-tight">{timeStr}</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm md:text-base font-medium capitalize opacity-90">{dateStr}</p>
          </div>
          {weather && weather.temp !== null && (
            <div className="flex items-center gap-2">
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                className="w-10 h-10 md:w-12 md:h-12 drop-shadow-md"
              />
              <div>
                <p className="text-xl md:text-2xl font-bold">{weather.temp}&#176;C</p>
                <p className="text-xs opacity-70 capitalize">{weather.city}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Zone */}
      <div
        className="absolute left-0 w-full z-10 bg-black transition-all duration-700"
        style={{
          top: isImmersion ? 0 : '12vh',
          bottom: isImmersion ? 0 : '10vh',
        }}
        data-testid="display-main"
      >
        {activeSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-8xl font-mono font-bold text-primary/80 tracking-[0.4em] mb-6">
              {screen.pairing_code}
            </p>
            <p className="text-xl text-white/40">En attente de contenu</p>
            <p className="text-sm text-white/20 mt-2">{screen.name}</p>
          </div>
        ) : isSplit && splitPartner ? (
          /* Split 50/50 Layout */
          <div className="flex w-full h-full">
            <div className={`w-1/2 h-full relative overflow-hidden ${currentSlide?.layout === 'split-left' ? '' : 'order-2'}`}>
              <SlideContent slide={currentSlide} />
            </div>
            <div className={`w-1/2 h-full relative overflow-hidden ${splitPartner?.layout === 'split-right' ? '' : 'order-1'}`}>
              <SlideContent slide={splitPartner} />
            </div>
          </div>
        ) : (
          /* Full / Immersion Layout */
          <div className="relative w-full h-full overflow-hidden">
            {transitioning && prevIndex >= 0 && prevIndex < activeSlides.length && (
              <div className={`absolute inset-0 ${getTransitionClass(activeSlides[currentIndex], false)}`}>
                <SlideContent slide={activeSlides[prevIndex]} />
              </div>
            )}
            <div className={`absolute inset-0 ${transitioning ? getTransitionClass(activeSlides[currentIndex], true) : ''}`}>
              <SlideContent slide={activeSlides[currentIndex]} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Zone */}
      <div
        className="absolute bottom-0 left-0 w-full z-20 flex items-center overflow-hidden transition-all duration-700"
        style={{
          backgroundColor: settings.footer_bg || '#1E293B',
          color: settings.text_color || '#FFFFFF',
          height: isImmersion ? '0vh' : '10vh',
          opacity: isImmersion ? 0 : 1,
          overflow: 'hidden',
        }}
        data-testid="display-footer"
      >
        <div className="whitespace-nowrap animate-marquee text-lg md:text-xl font-medium px-4">
          {settings.footer_text || 'Bienvenue'}
          <span className="mx-16 opacity-30">|</span>
          {settings.footer_text || 'Bienvenue'}
          <span className="mx-16 opacity-30">|</span>
          {settings.footer_text || 'Bienvenue'}
          <span className="mx-16 opacity-30">|</span>
          {settings.footer_text || 'Bienvenue'}
        </div>
      </div>
    </div>
  );
}

// Find the split partner for a slide
function findSplitPartner(slides, currentIndex) {
  const current = slides[currentIndex];
  if (!current) return null;
  // Look for the next slide with complementary layout
  if (current.layout === 'split-left') {
    return slides.find((s, i) => i !== currentIndex && s.layout === 'split-right' && s.is_active);
  }
  if (current.layout === 'split-right') {
    return slides.find((s, i) => i !== currentIndex && s.layout === 'split-left' && s.is_active);
  }
  return null;
}

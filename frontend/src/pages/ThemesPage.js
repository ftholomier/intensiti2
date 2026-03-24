import { useEffect, useState, useRef } from 'react';
import API from '../lib/api';
import { THEMES, CATEGORIES } from '../lib/themes';
import ANIMATIONS from '../lib/animations';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, Palette, Sparkles, Play } from 'lucide-react';
import { toast } from 'sonner';

function AnimationPreview({ animation, isActive, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`anim-${animation.id}`}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer min-w-[110px]
        ${isActive
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className={`w-16 h-10 rounded-lg overflow-hidden relative ${animation.id === 'none' ? 'bg-slate-100' : 'bg-slate-800'}`}>
        {animation.id !== 'none' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-3 w-3 text-white/40" />
          </div>
        )}
        {animation.id === 'none' && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-[9px] font-medium">OFF</div>
        )}
      </div>
      <span className="text-[11px] font-medium text-center leading-tight">{animation.name}</span>
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </button>
  );
}

function ThemeCard({ theme, isActive, onClick, disabled }) {
  const p = theme.preview;
  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
        ${isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-slate-300'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={onClick}
      data-testid={`theme-${theme.id}`}
    >
      <CardContent className="p-0">
        <div className="aspect-video rounded-t-lg overflow-hidden relative">
          <div className="h-[14%] flex items-center justify-between px-2" style={{ background: p.header }}>
            <div className="h-1.5 w-5 rounded-sm" style={{ background: p.blockText, opacity: 0.3 }} />
            <div className="flex gap-0.5">
              <div className="h-1.5 w-6 rounded-sm" style={{ background: p.block }} />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ background: p.content, height: '76%' }}>
            <div className="text-center">
              <div className="h-1 w-12 mx-auto rounded-full mb-1" style={{ background: p.text, opacity: 0.2 }} />
              <div className="h-0.5 w-8 mx-auto rounded-full" style={{ background: p.text, opacity: 0.1 }} />
            </div>
          </div>
          <div className="h-[10%]" style={{ background: p.footer }} />
          {isActive && (
            <div className="absolute top-1.5 right-1.5">
              <Badge className="bg-primary text-white text-[8px] px-1.5 py-0.5 gap-0.5">
                <Check className="h-2 w-2" /> Actif
              </Badge>
            </div>
          )}
        </div>
        <div className="px-2.5 py-2">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-xs font-semibold truncate">{theme.name}</h3>
            <div className="flex gap-0.5 shrink-0 ml-1">
              {[p.header, p.content, p.footer].map((c, i) => (
                <div key={i} className="h-2.5 w-2.5 rounded-full border border-slate-200" style={{ background: c }} />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 truncate">{theme.desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ThemesPage() {
  const [settings, setSettings] = useState(null);
  const [activeTheme, setActiveTheme] = useState(null);
  const [activeAnim, setActiveAnim] = useState('none');
  const [activeCategory, setActiveCategory] = useState('all');
  const [applying, setApplying] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    API.get('/settings').then(async (r) => {
      const s = r.data;
      setSettings(s);
      if (s?.selected_theme_id) setActiveTheme(s.selected_theme_id);
      if (s?.selected_animation_id) setActiveAnim(s.selected_animation_id);

      // Migration: if old theme CSS is in custom_css, move to theme_css
      const css = s?.custom_css || '';
      if (css.includes('/* THEME:') && !s?.theme_css) {
        const tm = css.match(/\/\* THEME:(\S+) \*\//);
        const am = css.match(/\/\* ANIM:(\S+) \*\//);
        if (tm) setActiveTheme(tm[1]);
        if (am) setActiveAnim(am[1]);
        try {
          await API.put('/settings', { theme_css: css, custom_css: '', selected_theme_id: tm?.[1] || '', selected_animation_id: am?.[1] || 'none' });
          setSettings(prev => ({ ...prev, theme_css: css, custom_css: '' }));
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const buildAndSave = async (themeId, animId) => {
    setApplying(true);
    try {
      const theme = THEMES.find(t => t.id === themeId);
      const anim = ANIMATIONS.find(a => a.id === animId);
      if (!theme) { setApplying(false); return; }

      const combinedCss = theme.css + (anim && anim.css ? '\n' + anim.css : '');
      const update = {
        ...theme.settings,
        theme_css: combinedCss,
        selected_theme_id: themeId,
        selected_animation_id: animId || 'none',
      };
      await API.put('/settings', update);
      setSettings(prev => ({ ...prev, ...update }));
      setActiveTheme(themeId);
      setActiveAnim(animId || 'none');

      const labels = [theme.name];
      if (anim && anim.id !== 'none') labels.push(anim.name);
      toast.success(`Applique : ${labels.join(' + ')}`);
    } catch {
      toast.error('Erreur lors de l\'application');
    } finally {
      setApplying(false);
    }
  };

  const handleThemeSelect = (theme) => {
    if (applying) return;
    buildAndSave(theme.id, activeAnim);
  };

  const handleAnimSelect = (anim) => {
    if (applying) return;
    if (!activeTheme) {
      toast.info('Selectionnez d\'abord un theme');
      return;
    }
    buildAndSave(activeTheme, anim.id);
  };

  const filteredThemes = activeCategory === 'all'
    ? THEMES
    : THEMES.filter(t => t.category === activeCategory);

  if (!settings) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="themes-title">Themes</h1>
        <p className="text-slate-500 mt-1">Personnalisez l'apparence de vos ecrans d'affichage.</p>
      </div>

      {/* === ANIMATIONS SECTION === */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold" data-testid="animations-section-title">Animations de fond</h2>
          <span className="text-xs text-slate-400 ml-1">Effet subtil sur la zone centrale</span>
        </div>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-200">
          {ANIMATIONS.map(anim => (
            <AnimationPreview
              key={anim.id}
              animation={anim}
              isActive={activeAnim === anim.id}
              onClick={() => handleAnimSelect(anim)}
              disabled={applying}
            />
          ))}
        </div>
      </div>

      {/* === THEMES SECTION === */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold" data-testid="themes-section-title">Palettes de couleurs</h2>
          <span className="text-xs text-slate-400 ml-1">{THEMES.length} themes</span>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2" data-testid="theme-categories">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
              ${activeCategory === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            data-testid="cat-all"
          >
            Tous
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                ${activeCategory === cat.id ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              data-testid={`cat-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Themes grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3" data-testid="themes-grid">
          {filteredThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={activeTheme === theme.id}
              onClick={() => handleThemeSelect(theme)}
              disabled={applying}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-start gap-3">
          <Palette className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">Personnalisation avancee</p>
            <p className="text-xs text-slate-500 mt-1">
              Apres avoir applique un theme, vous pouvez ajuster les couleurs dans <strong>Parametres</strong> et modifier le CSS dans la zone <strong>CSS personnalise</strong> pour un rendu unique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

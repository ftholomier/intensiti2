// 12 background animations for the display area - VISIBLE and professional
// Each targets [data-testid="display-animation-overlay"]

const ANIMATIONS = [
  {
    id: 'none',
    name: 'Aucune',
    desc: 'Pas d\'animation de fond',
    css: '',
  },
  {
    id: 'lignes-fluides',
    name: 'Lignes fluides',
    desc: 'Lignes fines qui se deplacent lentement',
    css: `/* ANIM:lignes-fluides */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.25;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -50%;
  background: repeating-linear-gradient(
    90deg, transparent, transparent 60px,
    currentColor 60px, currentColor 61px
  );
  animation: anim-lines-move 30s linear infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; inset: -50%;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 80px,
    currentColor 80px, currentColor 81px
  );
  animation: anim-lines-move-v 40s linear infinite;
}
@keyframes anim-lines-move { 0% { transform: translateX(0); } 100% { transform: translateX(61px); } }
@keyframes anim-lines-move-v { 0% { transform: translateY(0); } 100% { transform: translateY(81px); } }`,
  },
  {
    id: 'fondu-gradient',
    name: 'Fondu gradient',
    desc: 'Degrader de couleurs qui evolue doucement',
    css: `/* ANIM:fondu-gradient */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
  background: radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.10) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.08) 0%, transparent 50%);
  animation: anim-fondu-shift 45s ease-in-out infinite alternate;
}
@keyframes anim-fondu-shift {
  0% { opacity: 0.5; filter: hue-rotate(0deg); }
  33% { opacity: 0.8; filter: hue-rotate(15deg); }
  66% { opacity: 0.6; filter: hue-rotate(-10deg); }
  100% { opacity: 0.7; filter: hue-rotate(5deg); }
}`,
  },
  {
    id: 'particules',
    name: 'Particules',
    desc: 'Points lumineux flottants',
    css: `/* ANIM:particules */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.8;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; width: 100%; height: 200%;
  background:
    radial-gradient(2px 2px at 10% 20%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 25% 55%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(3px 3px at 40% 10%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 55% 75%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(2.5px 2.5px at 70% 35%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 85% 65%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(3px 3px at 15% 85%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(2px 2px at 90% 15%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(2px 2px at 50% 45%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 35% 95%, rgba(255,255,255,0.6) 50%, transparent 50%);
  animation: anim-particules-float 60s linear infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; width: 100%; height: 200%;
  background:
    radial-gradient(2px 2px at 5% 45%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(2.5px 2.5px at 35% 30%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 60% 90%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(3px 3px at 80% 50%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 45% 5%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(2.5px 2.5px at 95% 80%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 20% 70%, rgba(255,255,255,0.4) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 75% 15%, rgba(255,255,255,0.6) 50%, transparent 50%);
  animation: anim-particules-float2 75s linear infinite;
}
@keyframes anim-particules-float { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
@keyframes anim-particules-float2 { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(-50%) translateX(3%); } }`,
  },
  {
    id: 'vagues',
    name: 'Vagues douces',
    desc: 'Ondulations lentes et apaisantes',
    css: `/* ANIM:vagues */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; bottom: -10%; left: -10%; right: -10%; height: 60%;
  background: radial-gradient(ellipse at 30% 100%, rgba(255,255,255,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 100%, rgba(255,255,255,0.10) 0%, transparent 60%);
  animation: anim-vagues 20s ease-in-out infinite alternate;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; bottom: -5%; left: -5%; right: -5%; height: 50%;
  background: radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.08) 0%, transparent 70%);
  animation: anim-vagues2 15s ease-in-out infinite alternate-reverse;
}
@keyframes anim-vagues { 0% { transform: translateX(-3%) scaleY(0.9); } 100% { transform: translateX(3%) scaleY(1.1); } }
@keyframes anim-vagues2 { 0% { transform: translateX(2%) scaleY(1); } 100% { transform: translateX(-2%) scaleY(1.15); } }`,
  },
  {
    id: 'grille',
    name: 'Grille dynamique',
    desc: 'Quadrillage subtil en mouvement',
    css: `/* ANIM:grille */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.15;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -50%; width: 200%; height: 200%;
  background-image:
    linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: anim-grille 60s linear infinite;
}
@keyframes anim-grille { 0% { transform: translate(0,0) rotate(0deg); } 100% { transform: translate(50px,50px) rotate(1deg); } }`,
  },
  {
    id: 'brume',
    name: 'Brume legere',
    desc: 'Effet de brouillard en mouvement',
    css: `/* ANIM:brume */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -20%;
  background:
    radial-gradient(ellipse at 15% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 30%, rgba(255,255,255,0.12) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.13) 0%, transparent 45%);
  filter: blur(40px);
  animation: anim-brume 50s ease-in-out infinite alternate;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; inset: -20%;
  background:
    radial-gradient(ellipse at 70% 60%, rgba(255,255,255,0.12) 0%, transparent 45%),
    radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.10) 0%, transparent 40%);
  filter: blur(50px);
  animation: anim-brume2 60s ease-in-out infinite alternate-reverse;
}
@keyframes anim-brume { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(5%,3%) scale(1.1); } }
@keyframes anim-brume2 { 0% { transform: translate(0,0) scale(1.05); } 100% { transform: translate(-4%,2%) scale(1); } }`,
  },
  {
    id: 'pulse',
    name: 'Pulse lumineux',
    desc: 'Pulsation douce de lumiere',
    css: `/* ANIM:pulse */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute;
  top: 50%; left: 50%; width: 80%; height: 80%;
  transform: translate(-50%,-50%);
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
  animation: anim-pulse 8s ease-in-out infinite;
}
@keyframes anim-pulse {
  0%, 100% { transform: translate(-50%,-50%) scale(0.8); opacity: 0.3; }
  50% { transform: translate(-50%,-50%) scale(1.2); opacity: 0.8; }
}`,
  },
  {
    id: 'diagonales',
    name: 'Diagonales',
    desc: 'Lignes diagonales glissantes',
    css: `/* ANIM:diagonales */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.15;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -100%; width: 300%; height: 300%;
  background: repeating-linear-gradient(
    45deg, transparent, transparent 40px,
    rgba(255,255,255,0.6) 40px, rgba(255,255,255,0.6) 41px
  );
  animation: anim-diag 40s linear infinite;
}
@keyframes anim-diag { 0% { transform: translate(0,0); } 100% { transform: translate(56px,56px); } }`,
  },
  {
    id: 'cercles',
    name: 'Cercles concentriques',
    desc: 'Cercles qui s\'etendent doucement',
    css: `/* ANIM:cercles */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute;
  top: 50%; left: 50%; width: 200%; height: 200%;
  transform: translate(-50%,-50%);
  background:
    radial-gradient(circle, transparent 20%, rgba(255,255,255,0.05) 20.5%, transparent 21.5%),
    radial-gradient(circle, transparent 35%, rgba(255,255,255,0.04) 35.5%, transparent 36.5%),
    radial-gradient(circle, transparent 50%, rgba(255,255,255,0.035) 50.5%, transparent 51.5%),
    radial-gradient(circle, transparent 65%, rgba(255,255,255,0.03) 65.5%, transparent 66.5%);
  animation: anim-cercles 30s linear infinite;
}
@keyframes anim-cercles { 0% { transform: translate(-50%,-50%) scale(0.5); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; } }`,
  },
  {
    id: 'eclat',
    name: 'Eclat glissant',
    desc: 'Reflet lumineux qui traverse l\'ecran',
    css: `/* ANIM:eclat */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute;
  top: -50%; width: 30%; height: 200%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 100%);
  transform: skewX(-15deg);
  animation: anim-eclat 12s ease-in-out infinite;
}
@keyframes anim-eclat {
  0% { left: -40%; } 40% { left: 110%; } 100% { left: 110%; }
}`,
  },
  {
    id: 'bokeh',
    name: 'Bokeh',
    desc: 'Halos flous et doux',
    css: `/* ANIM:bokeh */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle 80px at 15% 30%, rgba(255,255,255,0.12) 0%, transparent 100%),
    radial-gradient(circle 120px at 75% 20%, rgba(255,255,255,0.10) 0%, transparent 100%),
    radial-gradient(circle 60px at 45% 70%, rgba(255,255,255,0.11) 0%, transparent 100%),
    radial-gradient(circle 90px at 85% 75%, rgba(255,255,255,0.08) 0%, transparent 100%),
    radial-gradient(circle 70px at 25% 85%, rgba(255,255,255,0.10) 0%, transparent 100%);
  animation: anim-bokeh 40s ease-in-out infinite alternate;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle 100px at 60% 40%, rgba(255,255,255,0.10) 0%, transparent 100%),
    radial-gradient(circle 70px at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 100%),
    radial-gradient(circle 110px at 90% 45%, rgba(255,255,255,0.07) 0%, transparent 100%);
  animation: anim-bokeh2 55s ease-in-out infinite alternate-reverse;
}
@keyframes anim-bokeh { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(3%,-2%) scale(1.05); } }
@keyframes anim-bokeh2 { 0% { transform: translate(0,0) scale(1.02); } 100% { transform: translate(-2%,3%) scale(0.98); } }`,
  },
];

export default ANIMATIONS;

// Background animations for the display area
// Each targets [data-testid="display-animation-overlay"]

const ANIMATIONS = [
  {
    id: 'none',
    name: 'Aucune',
    desc: 'Pas d\'animation de fond',
    css: '',
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
    radial-gradient(2px 2px at 90% 15%, rgba(255,255,255,0.7) 50%, transparent 50%);
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
    radial-gradient(2.5px 2.5px at 95% 80%, rgba(255,255,255,0.5) 50%, transparent 50%);
  animation: anim-particules-float2 75s linear infinite;
}
@keyframes anim-particules-float { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
@keyframes anim-particules-float2 { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(-50%) translateX(3%); } }`,
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
    id: 'ruban',
    name: 'Ruban lumineux',
    desc: 'Bande de lumiere sinueuse en mouvement',
    css: `/* ANIM:ruban */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute;
  top: 0; left: -100%; width: 300%; height: 100%;
  background:
    linear-gradient(180deg, transparent 42%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 52%, transparent 58%);
  animation: anim-ruban 25s ease-in-out infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute;
  top: 0; left: -100%; width: 300%; height: 100%;
  background:
    linear-gradient(180deg, transparent 62%, rgba(255,255,255,0.04) 68%, rgba(255,255,255,0.07) 70%, rgba(255,255,255,0.04) 72%, transparent 78%);
  animation: anim-ruban2 35s ease-in-out infinite reverse;
}
@keyframes anim-ruban {
  0% { transform: translateX(0) skewY(-2deg); }
  50% { transform: translateX(20%) skewY(2deg); }
  100% { transform: translateX(0) skewY(-2deg); }
}
@keyframes anim-ruban2 {
  0% { transform: translateX(0) skewY(1deg); }
  50% { transform: translateX(-15%) skewY(-1deg); }
  100% { transform: translateX(0) skewY(1deg); }
}`,
  },
  {
    id: 'nebuleuse',
    name: 'Nebuleuse',
    desc: 'Nuages de lumiere en mouvement lent',
    css: `/* ANIM:nebuleuse */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -30%;
  background:
    radial-gradient(ellipse 300px 200px at 25% 35%, rgba(255,255,255,0.08) 0%, transparent 100%),
    radial-gradient(ellipse 250px 350px at 70% 60%, rgba(255,255,255,0.06) 0%, transparent 100%),
    radial-gradient(ellipse 200px 250px at 50% 20%, rgba(255,255,255,0.05) 0%, transparent 100%);
  filter: blur(30px);
  animation: anim-nebuleuse 60s ease-in-out infinite alternate;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; inset: -30%;
  background:
    radial-gradient(ellipse 280px 200px at 80% 25%, rgba(255,255,255,0.07) 0%, transparent 100%),
    radial-gradient(ellipse 200px 300px at 20% 70%, rgba(255,255,255,0.05) 0%, transparent 100%);
  filter: blur(40px);
  animation: anim-nebuleuse2 50s ease-in-out infinite alternate-reverse;
}
@keyframes anim-nebuleuse {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  50% { transform: translate(8%, -5%) scale(1.1) rotate(3deg); }
  100% { transform: translate(-5%, 8%) scale(0.95) rotate(-2deg); }
}
@keyframes anim-nebuleuse2 {
  0% { transform: translate(0, 0) scale(1.05) rotate(0deg); }
  50% { transform: translate(-6%, 5%) scale(0.9) rotate(-3deg); }
  100% { transform: translate(4%, -3%) scale(1.1) rotate(2deg); }
}`,
  },
  {
    id: 'flux',
    name: 'Flux parallele',
    desc: 'Lignes horizontales en mouvement fluide',
    css: `/* ANIM:flux */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.12;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; left: -100%; width: 300%; height: 100%;
  background:
    repeating-linear-gradient(
      180deg,
      transparent 0px, transparent 35px,
      rgba(255,255,255,0.5) 35px, rgba(255,255,255,0.5) 36px,
      transparent 36px, transparent 90px
    );
  animation: anim-flux 20s linear infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; left: -100%; width: 300%; height: 100%;
  background:
    repeating-linear-gradient(
      180deg,
      transparent 0px, transparent 55px,
      rgba(255,255,255,0.3) 55px, rgba(255,255,255,0.3) 56px,
      transparent 56px, transparent 120px
    );
  animation: anim-flux2 30s linear infinite reverse;
}
@keyframes anim-flux { 0% { transform: translateX(0); } 100% { transform: translateX(33%); } }
@keyframes anim-flux2 { 0% { transform: translateX(0); } 100% { transform: translateX(-33%); } }`,
  },
  {
    id: 'prisme',
    name: 'Prisme',
    desc: 'Formes geometriques translucides en mouvement',
    css: `/* ANIM:prisme */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute;
  width: 120%; height: 120%; top: -10%; left: -10%;
  background:
    linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 40%, transparent 50%),
    linear-gradient(225deg, transparent 35%, rgba(255,255,255,0.03) 45%, transparent 55%),
    linear-gradient(315deg, transparent 25%, rgba(255,255,255,0.05) 35%, transparent 45%);
  animation: anim-prisme 35s ease-in-out infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute;
  width: 120%; height: 120%; top: -10%; left: -10%;
  background:
    linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 48%, transparent 56%),
    linear-gradient(165deg, transparent 30%, rgba(255,255,255,0.04) 38%, transparent 46%);
  animation: anim-prisme2 45s ease-in-out infinite reverse;
}
@keyframes anim-prisme {
  0% { transform: rotate(0deg) scale(1); }
  33% { transform: rotate(3deg) scale(1.05); }
  66% { transform: rotate(-2deg) scale(0.98); }
  100% { transform: rotate(0deg) scale(1); }
}
@keyframes anim-prisme2 {
  0% { transform: rotate(0deg) scale(1.02); }
  50% { transform: rotate(-3deg) scale(1.08); }
  100% { transform: rotate(0deg) scale(1.02); }
}`,
  },
  {
    id: 'aurore',
    name: 'Aurore',
    desc: 'Lueurs dansantes style aurore boreale',
    css: `/* ANIM:aurore */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute;
  bottom: -20%; left: -20%; width: 140%; height: 80%;
  background:
    radial-gradient(ellipse 40% 60% at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 100%),
    radial-gradient(ellipse 30% 50% at 50% 90%, rgba(255,255,255,0.06) 0%, transparent 100%),
    radial-gradient(ellipse 35% 70% at 80% 85%, rgba(255,255,255,0.07) 0%, transparent 100%);
  filter: blur(20px);
  animation: anim-aurore 20s ease-in-out infinite alternate;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute;
  top: -20%; left: -10%; width: 120%; height: 60%;
  background:
    radial-gradient(ellipse 30% 40% at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 100%),
    radial-gradient(ellipse 25% 35% at 70% 15%, rgba(255,255,255,0.04) 0%, transparent 100%);
  filter: blur(25px);
  animation: anim-aurore2 25s ease-in-out infinite alternate-reverse;
}
@keyframes anim-aurore {
  0% { transform: translateX(0) scaleY(1); opacity: 0.6; }
  50% { transform: translateX(5%) scaleY(1.3); opacity: 1; }
  100% { transform: translateX(-3%) scaleY(0.8); opacity: 0.7; }
}
@keyframes anim-aurore2 {
  0% { transform: translateX(0) scaleY(1); opacity: 0.4; }
  50% { transform: translateX(-4%) scaleY(1.2); opacity: 0.8; }
  100% { transform: translateX(3%) scaleY(0.9); opacity: 0.5; }
}`,
  },
  {
    id: 'maille',
    name: 'Maille mouvante',
    desc: 'Reseau de formes en mouvement continu',
    css: `/* ANIM:maille */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; opacity: 0.08;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -50%; width: 200%; height: 200%;
  background:
    radial-gradient(circle 2px at 20% 20%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 40% 40%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 60% 20%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 80% 40%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 20% 60%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 40% 80%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 60% 60%, rgba(255,255,255,0.8), transparent 3px),
    radial-gradient(circle 2px at 80% 80%, rgba(255,255,255,0.8), transparent 3px);
  background-size: 120px 120px;
  animation: anim-maille 40s linear infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; inset: -50%; width: 200%; height: 200%;
  background:
    linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.15) 49%, rgba(255,255,255,0.15) 51%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 52%);
  background-size: 120px 120px;
  animation: anim-maille2 55s linear infinite reverse;
}
@keyframes anim-maille { 0% { transform: translate(0,0); } 100% { transform: translate(120px,120px); } }
@keyframes anim-maille2 { 0% { transform: translate(0,0); } 100% { transform: translate(-120px,120px); } }`,
  },
  {
    id: 'horizon',
    name: 'Horizon',
    desc: 'Bandes horizontales en fondu progressif',
    css: `/* ANIM:horizon */
[data-testid="display-animation-overlay"] {
  position: absolute; inset: 0; z-index: 1; pointer-events: none; overflow: hidden;
}
[data-testid="display-animation-overlay"]::before {
  content: ''; position: absolute; inset: -100% -50%;
  width: 200%; height: 300%;
  background:
    linear-gradient(180deg,
      transparent 0%, rgba(255,255,255,0.03) 10%, transparent 20%,
      transparent 30%, rgba(255,255,255,0.05) 40%, transparent 50%,
      transparent 60%, rgba(255,255,255,0.04) 70%, transparent 80%,
      transparent 90%, rgba(255,255,255,0.03) 100%
    );
  animation: anim-horizon 30s linear infinite;
}
[data-testid="display-animation-overlay"]::after {
  content: ''; position: absolute; inset: -100% -50%;
  width: 200%; height: 300%;
  background:
    linear-gradient(180deg,
      transparent 5%, rgba(255,255,255,0.02) 15%, transparent 25%,
      transparent 45%, rgba(255,255,255,0.03) 55%, transparent 65%,
      transparent 85%, rgba(255,255,255,0.02) 95%
    );
  animation: anim-horizon2 22s linear infinite reverse;
}
@keyframes anim-horizon { 0% { transform: translateY(0); } 100% { transform: translateY(33%); } }
@keyframes anim-horizon2 { 0% { transform: translateY(0); } 100% { transform: translateY(-33%); } }`,
  },
];

export default ANIMATIONS;

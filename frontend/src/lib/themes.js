// 48 professional themes organized by category
// Each theme defines colors for the display page

function makeTheme(id, name, category, desc, colors) {
  const { header, footer, content, text, block, blockText, primary } = colors;
  return {
    id, name, category, desc,
    preview: { header, footer, content, text, block: block || 'rgba(0,0,0,0.06)', blockText: blockText || text },
    settings: {
      header_bg: header, footer_bg: footer, content_bg: content,
      text_color: text, block_bg: block || 'rgba(0,0,0,0.06)', block_text_color: blockText || text,
      primary_color: primary,
    },
    css: `/* THEME:${id} */
.display-text-content { color: ${text}; }
[data-testid="display-header"] > div { background: ${header} !important; }
[data-testid="display-footer"] > div { background: ${footer} !important; }
[data-testid="display-main"] { background: linear-gradient(160deg, ${content} 0%, ${header} 100%) !important; }`,
  };
}

const CATEGORIES = [
  { id: 'light', name: 'Clair', icon: 'Sun' },
  { id: 'blue', name: 'Bleu', icon: 'Droplets' },
  { id: 'green', name: 'Vert', icon: 'Leaf' },
  { id: 'warm', name: 'Chaud', icon: 'Flame' },
  { id: 'purple', name: 'Violet & Rose', icon: 'Sparkles' },
  { id: 'dark', name: 'Sombre', icon: 'Moon' },
  { id: 'earth', name: 'Terre', icon: 'Mountain' },
  { id: 'special', name: 'Special', icon: 'Star' },
];

const THEMES = [
  // === CLAIR (6) ===
  makeTheme('lumiere-pure', 'Lumiere Pure', 'light', 'Blanc pur, accents bleu doux',
    { header: '#F8FAFC', footer: '#F1F5F9', content: '#FFFFFF', text: '#1E293B', block: 'rgba(30,41,59,0.06)', blockText: '#334155', primary: '#3B82F6' }),
  makeTheme('porcelaine', 'Porcelaine', 'light', 'Blanc creme, touches dorees',
    { header: '#FEFCE8', footer: '#FEF9C3', content: '#FFFEF5', text: '#422006', block: 'rgba(66,32,6,0.06)', blockText: '#713F12', primary: '#CA8A04' }),
  makeTheme('brume-matinale', 'Brume Matinale', 'light', 'Gris argente, elegance douce',
    { header: '#F1F5F9', footer: '#E2E8F0', content: '#F8FAFC', text: '#334155', block: 'rgba(51,65,85,0.06)', blockText: '#475569', primary: '#64748B' }),
  makeTheme('lavande-douce', 'Lavande Douce', 'light', 'Violet pastel, serenite',
    { header: '#F5F3FF', footer: '#EDE9FE', content: '#FAF5FF', text: '#3B0764', block: 'rgba(59,7,100,0.06)', blockText: '#581C87', primary: '#8B5CF6' }),
  makeTheme('menthe-fraiche', 'Menthe Fraiche', 'light', 'Vert menthe, fraicheur',
    { header: '#ECFDF5', footer: '#D1FAE5', content: '#F0FDF4', text: '#14532D', block: 'rgba(20,83,45,0.06)', blockText: '#166534', primary: '#10B981' }),
  makeTheme('peche-rosee', 'Peche Rosee', 'light', 'Rose peche, douceur chaleureuse',
    { header: '#FFF1F2', footer: '#FFE4E6', content: '#FFF5F5', text: '#881337', block: 'rgba(136,19,55,0.06)', blockText: '#9F1239', primary: '#F43F5E' }),

  // === BLEU (6) ===
  makeTheme('ciel-clair', 'Ciel Clair', 'blue', 'Bleu pastel, serenite',
    { header: '#DBEAFE', footer: '#BFDBFE', content: '#EFF6FF', text: '#1E3A5F', block: 'rgba(30,58,95,0.08)', blockText: '#1E3A5F', primary: '#2563EB' }),
  makeTheme('arctique', 'Arctique', 'blue', 'Bleu glace, purete polaire',
    { header: '#E0F2FE', footer: '#BAE6FD', content: '#F0F9FF', text: '#0C4A6E', block: 'rgba(12,74,110,0.08)', blockText: '#075985', primary: '#0284C7' }),
  makeTheme('cobalt', 'Cobalt', 'blue', 'Bleu cobalt profond',
    { header: '#1E3A8A', footer: '#1E40AF', content: '#172554', text: '#DBEAFE', block: 'rgba(219,234,254,0.08)', blockText: '#BFDBFE', primary: '#3B82F6' }),
  makeTheme('saphir', 'Saphir', 'blue', 'Bleu saphir intense',
    { header: '#1D4ED8', footer: '#2563EB', content: '#1E3A8A', text: '#EFF6FF', block: 'rgba(239,246,255,0.08)', blockText: '#DBEAFE', primary: '#60A5FA' }),
  makeTheme('ocean-profond', 'Ocean Profond', 'blue', 'Bleu marine, vagues douces',
    { header: '#0C4A6E', footer: '#075985', content: '#082F49', text: '#E0F2FE', block: 'rgba(224,242,254,0.08)', blockText: '#E0F2FE', primary: '#0EA5E9' }),
  makeTheme('bleu-acier', 'Bleu Acier', 'blue', 'Bleu gris industriel',
    { header: '#334155', footer: '#3F4F63', content: '#1E293B', text: '#CBD5E1', block: 'rgba(203,213,225,0.08)', blockText: '#E2E8F0', primary: '#94A3B8' }),

  // === VERT (6) ===
  makeTheme('nature', 'Nature', 'green', 'Vert foret, feuillage subtil',
    { header: '#14532D', footer: '#166534', content: '#052E16', text: '#D1FAE5', block: 'rgba(209,250,229,0.08)', blockText: '#D1FAE5', primary: '#10B981' }),
  makeTheme('emeraude', 'Emeraude', 'green', 'Vert emeraude precieux',
    { header: '#065F46', footer: '#047857', content: '#064E3B', text: '#A7F3D0', block: 'rgba(167,243,208,0.08)', blockText: '#A7F3D0', primary: '#34D399' }),
  makeTheme('jade', 'Jade', 'green', 'Vert jade elegant',
    { header: '#115E59', footer: '#0F766E', content: '#134E4A', text: '#CCFBF1', block: 'rgba(204,251,241,0.08)', blockText: '#99F6E4', primary: '#2DD4BF' }),
  makeTheme('mousse', 'Mousse', 'green', 'Vert mousse naturel',
    { header: '#365314', footer: '#3F6212', content: '#1A2E05', text: '#D9F99D', block: 'rgba(217,249,157,0.08)', blockText: '#D9F99D', primary: '#84CC16' }),
  makeTheme('olive', 'Olive', 'green', 'Vert olive mediterraneen',
    { header: '#4D7C0F', footer: '#65A30D', content: '#365314', text: '#ECFCCB', block: 'rgba(236,252,203,0.08)', blockText: '#ECFCCB', primary: '#A3E635' }),
  makeTheme('menthe-noire', 'Menthe Noire', 'green', 'Vert sombre intense',
    { header: '#0D3B2E', footer: '#134E3F', content: '#042F2E', text: '#5EEAD4', block: 'rgba(94,234,212,0.06)', blockText: '#5EEAD4', primary: '#14B8A6' }),

  // === CHAUD (6) ===
  makeTheme('sable-dore', 'Sable Dore', 'warm', 'Beige chaud, reflets dores',
    { header: '#78350F', footer: '#92400E', content: '#451A03', text: '#FEF3C7', block: 'rgba(254,243,199,0.08)', blockText: '#FEF3C7', primary: '#F59E0B' }),
  makeTheme('terracotta', 'Terracotta', 'warm', 'Terre cuite chaleureuse',
    { header: '#9A3412', footer: '#C2410C', content: '#7C2D12', text: '#FFEDD5', block: 'rgba(255,237,213,0.08)', blockText: '#FED7AA', primary: '#F97316' }),
  makeTheme('ambre', 'Ambre', 'warm', 'Ambre lumineux',
    { header: '#92400E', footer: '#B45309', content: '#78350F', text: '#FEF3C7', block: 'rgba(254,243,199,0.08)', blockText: '#FDE68A', primary: '#FBBF24' }),
  makeTheme('cuivre', 'Cuivre', 'warm', 'Cuivre oxyde raffine',
    { header: '#7C2D12', footer: '#9A3412', content: '#431407', text: '#FED7AA', block: 'rgba(254,215,170,0.08)', blockText: '#FDBA74', primary: '#FB923C' }),
  makeTheme('cannelle', 'Cannelle', 'warm', 'Brun cannelle epice',
    { header: '#6B3410', footer: '#854D0E', content: '#451A03', text: '#FEF9C3', block: 'rgba(254,249,195,0.08)', blockText: '#FEF08A', primary: '#EAB308' }),
  makeTheme('miel', 'Miel', 'warm', 'Dore miel sucre',
    { header: '#854D0E', footer: '#A16207', content: '#713F12', text: '#FEF9C3', block: 'rgba(254,249,195,0.08)', blockText: '#FDE047', primary: '#FACC15' }),

  // === VIOLET & ROSE (6) ===
  makeTheme('crepuscule', 'Crepuscule', 'purple', 'Violet et rose, aurore lente',
    { header: '#4C1D95', footer: '#5B21B6', content: '#2E1065', text: '#EDE9FE', block: 'rgba(237,233,254,0.08)', blockText: '#EDE9FE', primary: '#8B5CF6' }),
  makeTheme('amethyste', 'Amethyste', 'purple', 'Violet amethyste riche',
    { header: '#6D28D9', footer: '#7C3AED', content: '#4C1D95', text: '#F5F3FF', block: 'rgba(245,243,255,0.08)', blockText: '#DDD6FE', primary: '#A78BFA' }),
  makeTheme('prune', 'Prune', 'purple', 'Prune profond et elegant',
    { header: '#701A75', footer: '#86198F', content: '#4A044E', text: '#FAE8FF', block: 'rgba(250,232,255,0.08)', blockText: '#F5D0FE', primary: '#D946EF' }),
  makeTheme('orchidee', 'Orchidee', 'purple', 'Rose orchidee delicat',
    { header: '#9D174D', footer: '#BE185D', content: '#831843', text: '#FCE7F3', block: 'rgba(252,231,243,0.08)', blockText: '#FBCFE8', primary: '#EC4899' }),
  makeTheme('magenta', 'Magenta Profond', 'purple', 'Magenta intense',
    { header: '#86198F', footer: '#A21CAF', content: '#701A75', text: '#FAE8FF', block: 'rgba(250,232,255,0.08)', blockText: '#F0ABFC', primary: '#E879F9' }),
  makeTheme('rose-ancien', 'Rose Ancien', 'purple', 'Rose vintage raffine',
    { header: '#9F1239', footer: '#BE123C', content: '#881337', text: '#FFE4E6', block: 'rgba(255,228,230,0.08)', blockText: '#FECDD3', primary: '#FB7185' }),

  // === SOMBRE (6) ===
  makeTheme('nuit-etoilee', 'Nuit Etoilee', 'dark', 'Bleu nuit profond',
    { header: '#0F172A', footer: '#1E293B', content: '#020617', text: '#E2E8F0', block: 'rgba(226,232,240,0.06)', blockText: '#E2E8F0', primary: '#6366F1' }),
  makeTheme('charbon-elegant', 'Charbon Elegant', 'dark', 'Noir anthracite raffine',
    { header: '#18181B', footer: '#27272A', content: '#09090B', text: '#FAFAFA', block: 'rgba(250,250,250,0.05)', blockText: '#FAFAFA', primary: '#A1A1AA' }),
  makeTheme('onyx', 'Onyx', 'dark', 'Noir absolu, sobre',
    { header: '#0A0A0A', footer: '#171717', content: '#000000', text: '#F5F5F5', block: 'rgba(245,245,245,0.04)', blockText: '#E5E5E5', primary: '#737373' }),
  makeTheme('graphite', 'Graphite', 'dark', 'Gris graphite mineral',
    { header: '#292524', footer: '#3B3835', content: '#1C1917', text: '#E7E5E4', block: 'rgba(231,229,228,0.06)', blockText: '#D6D3D1', primary: '#A8A29E' }),
  makeTheme('ebene', 'Ebene', 'dark', 'Noir chaleureux',
    { header: '#1A1612', footer: '#292420', content: '#0C0A08', text: '#F5F0EB', block: 'rgba(245,240,235,0.05)', blockText: '#E8E0D8', primary: '#B8A99A' }),
  makeTheme('minuit', 'Minuit', 'dark', 'Bleu minuit electrique',
    { header: '#0A1628', footer: '#0F1D35', content: '#050D1A', text: '#C8D8F0', block: 'rgba(200,216,240,0.06)', blockText: '#A0B8E0', primary: '#4F7DFF' }),

  // === TERRE (6) ===
  makeTheme('foret-automnale', 'Foret Automnale', 'earth', 'Couleurs d\'automne riches',
    { header: '#6B2F0A', footer: '#7C3A12', content: '#451A03', text: '#FDE68A', block: 'rgba(253,230,138,0.08)', blockText: '#FCD34D', primary: '#D97706' }),
  makeTheme('sequoia', 'Sequoia', 'earth', 'Brun rouge naturel',
    { header: '#6F2020', footer: '#832525', content: '#4A1414', text: '#FECACA', block: 'rgba(254,202,202,0.08)', blockText: '#FCA5A5', primary: '#EF4444' }),
  makeTheme('argile', 'Argile', 'earth', 'Brun argile naturel',
    { header: '#57534E', footer: '#6B6560', content: '#44403C', text: '#E7E5E4', block: 'rgba(231,229,228,0.06)', blockText: '#D6D3D1', primary: '#A8A29E' }),
  makeTheme('ardoise', 'Ardoise', 'earth', 'Gris bleu ardoise',
    { header: '#475569', footer: '#546278', content: '#334155', text: '#E2E8F0', block: 'rgba(226,232,240,0.06)', blockText: '#CBD5E1', primary: '#94A3B8' }),
  makeTheme('cedre', 'Bois de Cedre', 'earth', 'Brun bois noble',
    { header: '#5C3A1E', footer: '#6D4525', content: '#3B2510', text: '#F5E6D3', block: 'rgba(245,230,211,0.08)', blockText: '#E8D4BA', primary: '#C09060' }),
  makeTheme('pierre-lune', 'Pierre de Lune', 'earth', 'Gris perle irise',
    { header: '#4B5563', footer: '#6B7280', content: '#374151', text: '#F3F4F6', block: 'rgba(243,244,246,0.06)', blockText: '#E5E7EB', primary: '#9CA3AF' }),

  // === SPECIAL (6) ===
  makeTheme('neon-sombre', 'Neon Sombre', 'special', 'Noir avec eclats neon',
    { header: '#0A0A0F', footer: '#12121A', content: '#050508', text: '#00FF88', block: 'rgba(0,255,136,0.06)', blockText: '#00FF88', primary: '#00FF88' }),
  makeTheme('ocean-tropical', 'Ocean Tropical', 'special', 'Turquoise paradisiaque',
    { header: '#0E7490', footer: '#0891B2', content: '#155E75', text: '#CFFAFE', block: 'rgba(207,250,254,0.08)', blockText: '#A5F3FC', primary: '#22D3EE' }),
  makeTheme('coucher-soleil', 'Coucher de Soleil', 'special', 'Orange et rose fondus',
    { header: '#9A3412', footer: '#BE185D', content: '#7C2D12', text: '#FFF1F2', block: 'rgba(255,241,242,0.08)', blockText: '#FECDD3', primary: '#FB923C' }),
  makeTheme('glacier', 'Glacier', 'special', 'Blanc bleu arctique',
    { header: '#ECFEFF', footer: '#CFFAFE', content: '#F0FDFA', text: '#134E4A', block: 'rgba(19,78,74,0.06)', blockText: '#115E59', primary: '#14B8A6' }),
  makeTheme('volcan', 'Volcan', 'special', 'Noir et rouge magma',
    { header: '#1A0000', footer: '#2D0A0A', content: '#0F0000', text: '#FCA5A5', block: 'rgba(252,165,165,0.06)', blockText: '#FCA5A5', primary: '#EF4444' }),
  makeTheme('aurore-boreale', 'Aurore Boreale', 'special', 'Vert et bleu lumineux',
    { header: '#042F2E', footer: '#0C4A6E', content: '#022C22', text: '#A7F3D0', block: 'rgba(167,243,208,0.06)', blockText: '#6EE7B7', primary: '#34D399' }),
];

export { THEMES, CATEGORIES };

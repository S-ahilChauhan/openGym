// frontend/src/lib/warriorCards.js
//
// Each card = one possible Login screen "look".
// One random card is picked each time the Login screen loads (Mechanism A).
//
// To add more cards later: just add another object to this array.
// Nothing else in the app needs to change.

export const WARRIOR_CARDS = [
  {
    id: 'untamed',
    kind: 'image',
    title: 'THE UNTAMED',
    mantra: 'Instinct sharpened by every fall.',
    accent: '#D97706',
    glow: 'rgba(217, 119, 6, 0.35)',
    src: '/warriors/baki-bg.jpg.jpeg',
  },
  {
    id: 'sun_bearer',
    kind: 'image',
    title: 'THE SUN-BEARER',
    mantra: 'No excuse decides your ceiling but you.',
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.35)',
    src: '/warriors/sun-bearer.jpg',
  },
  {
    id: 'sovereign',
    kind: 'image',
    title: 'THE SOVEREIGN',
    mantra: 'Command your limits before they command you.',
    accent: '#E11D48',
    glow: 'rgba(225, 29, 72, 0.35)',
    src: '/warriors/sovereign.jpg',
  },
  {
    id: 'iron_back',
    kind: 'image',
    title: 'THE IRON BACK',
    mantra: 'Discipline carved this. Discipline keeps it.',
    accent: '#B91C1C',
    glow: 'rgba(185, 28, 28, 0.35)',
    src: '/warriors/iron-back.jpg',
  },
  {
    id: 'wanderer',
    kind: 'image',
    title: 'THE WANDERER',
    mantra: 'Still standing. Still walking. That\u2019s the win.',
    accent: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.35)',
    src: '/warriors/wanderer.jpg',
  },
]

/** Pick one card at random. Used on every Login screen mount. */
export function pickRandomCard() {
  const i = Math.floor(Math.random() * WARRIOR_CARDS.length)
  return WARRIOR_CARDS[i]
}
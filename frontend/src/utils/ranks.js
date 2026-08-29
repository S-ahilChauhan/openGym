export const ALL_RANK_IMAGES = [
  '/bg-lvl1-novice.jpg',
  '/bg-lvl2-ronin.jpg',
  '/katana-bg.jpg?v=2',
  '/bg-lvl4-demon.jpg',
  '/bg-lvl5-shogun.jpg',
  '/bg-lvl6-ogre.jpg'
]

export const getStreakRank = (streakWeeks = 0) => {
  if (streakWeeks >= 26) return {
    level: 6, title: 'Ogre', kanji: '地上最強', fullTitle: 'Ogre (地上最強)', image: '/bg-lvl6-ogre.jpg',
    badgeColor: '#FFD700', glowColor: 'rgba(255, 215, 0, 0.45)'
  }
  if (streakWeeks >= 16) return {
    level: 5, title: 'Shogun', kanji: '将軍', fullTitle: 'Shogun (将軍)', image: '/bg-lvl5-shogun.jpg',
    badgeColor: '#FF4500', glowColor: 'rgba(255, 69, 0, 0.45)'
  }
  if (streakWeeks >= 9) return {
    level: 4, title: 'Demon', kanji: '鬼', fullTitle: 'Demon (鬼)', image: '/bg-lvl4-demon.jpg',
    badgeColor: '#FF2A2A', glowColor: 'rgba(255, 42, 42, 0.45)'
  }
  if (streakWeeks >= 5) return {
    level: 3, title: 'Shadow Blade', kanji: '影刃', fullTitle: 'Shadow Blade (影刃)', image: '/katana-bg.jpg?v=2',
    badgeColor: '#FF85A2', glowColor: 'rgba(255, 133, 162, 0.45)'
  }
  if (streakWeeks >= 2) return {
    level: 2, title: 'Ronin', kanji: '浪人', fullTitle: 'Ronin (浪人)', image: '/bg-lvl2-ronin.jpg',
    badgeColor: '#A0AEC0', glowColor: 'rgba(160, 174, 192, 0.45)'
  }
  return {
    level: 1, title: 'Novice', kanji: '門下生', fullTitle: 'Novice (門下生)', image: '/bg-lvl1-novice.jpg',
    badgeColor: '#4ADE80', glowColor: 'rgba(74, 222, 128, 0.45)'
  }
}

// frontend/src/utils/ranks.js

export const ALL_RANK_IMAGES = [
  '/bg-lvl1-novice.jpg',
  '/bg-lvl2-ronin.jpg',
  '/katana-bg.jpg?v=2',
  '/bg-lvl4-demon.jpg',
  '/bg-lvl5-shogun.jpg',
  '/bg-lvl6-ogre.jpg'
]

// Define progression thresholds by total workout days
export const RANKS_CONFIG = [
  {
    level: 1,
    title: 'Novice',
    kanji: '門下生',
    minDays: 0,
    nextThresholdDays: 14, // 2 weeks equivalent
    image: '/bg-lvl1-novice.jpg',
    badgeColor: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.45)'
  },
  {
    level: 2,
    title: 'Ronin',
    kanji: '浪人',
    minDays: 14,
    nextThresholdDays: 35, // 5 weeks equivalent
    image: '/bg-lvl2-ronin.jpg',
    badgeColor: '#A0AEC0',
    glowColor: 'rgba(160, 174, 192, 0.45)'
  },
  {
    level: 3,
    title: 'Shadow Blade',
    kanji: '影刃',
    minDays: 35,
    nextThresholdDays: 63, // 9 weeks equivalent
    image: '/katana-bg.jpg?v=2',
    badgeColor: '#FF85A2',
    glowColor: 'rgba(255, 133, 162, 0.45)'
  },
  {
    level: 4,
    title: 'Demon',
    kanji: '鬼',
    minDays: 63,
    nextThresholdDays: 112, // 16 weeks equivalent
    image: '/bg-lvl4-demon.jpg',
    badgeColor: '#FF2A2A',
    glowColor: 'rgba(255, 42, 42, 0.45)'
  },
  {
    level: 5,
    title: 'Shogun',
    kanji: '将軍',
    minDays: 112,
    nextThresholdDays: 182, // 26 weeks equivalent
    image: '/bg-lvl5-shogun.jpg',
    badgeColor: '#FF4500',
    glowColor: 'rgba(255, 69, 0, 0.45)'
  },
  {
    level: 6,
    title: 'Ogre',
    kanji: '地上最強',
    minDays: 182,
    nextThresholdDays: null, // Max level reached
    image: '/bg-lvl6-ogre.jpg',
    badgeColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.45)'
  }
]

/**
 * Calculates current warrior rank and remaining days to next level based on streak days
 */
export const getStreakRank = (streakDays = 0) => {
  let activeTier = RANKS_CONFIG[0]
  let nextTier = RANKS_CONFIG[1]

  for (let i = RANKS_CONFIG.length - 1; i >= 0; i--) {
    if (streakDays >= RANKS_CONFIG[i].minDays) {
      activeTier = RANKS_CONFIG[i]
      nextTier = RANKS_CONFIG[i + 1] || null
      break
    }
  }

  const daysToNext = activeTier.nextThresholdDays !== null
    ? Math.max(1, activeTier.nextThresholdDays - streakDays)
    : 0

  return {
    level: activeTier.level,
    title: activeTier.title,
    kanji: activeTier.kanji,
    fullTitle: `${activeTier.title} (${activeTier.kanji})`,
    image: activeTier.image,
    badgeColor: activeTier.badgeColor,
    glowColor: activeTier.glowColor,
    daysToNext,
    nextRankTitle: nextTier ? nextTier.title : null,
    nextTarget: nextTier
      ? `${daysToNext}d to ${nextTier.title}`
      : 'Apex Master (Max Rank)'
  }
}

/**
 * Calculates total unique workout days completed
 */
export const calculateStreakDays = (workouts = []) => {
  if (!workouts || workouts.length === 0) return 0
  const uniqueDays = new Set(workouts.map(w => w.d))
  return uniqueDays.size
}
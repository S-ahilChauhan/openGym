export const getUserRank = (totalWorkouts = 0) => {
  if (totalWorkouts >= 200) {
    return { level: 6, title: 'God of Strength', image: '/bg-lvl6-ogre.jpg', color: '#FFD700' }
  }
  if (totalWorkouts >= 101) {
    return { level: 5, title: 'Shogun', image: '/bg-lvl5-shogun.jpg', color: '#FF4500' }
  }
  if (totalWorkouts >= 51) {
    return { level: 4, title: 'Demon', image: '/bg-lvl4-demon.jpg', color: '#FF2A2A' }
  }
  if (totalWorkouts >= 21) {
    return { level: 3, title: 'Shadow Blade', image: '/katana-bg.jpg?v=2', color: '#FF85A2' }
  }
  if (totalWorkouts >= 6) {
    return { level: 2, title: 'Ronin', image: '/bg-lvl2-ronin.jpg', color: '#A0A0A0' }
  }
  return { level: 1, title: 'Initiate', image: '/bg-lvl1-novice.jpg', color: '#4ADE80' }
}

export const getStreakRank = (streakWeeks = 0) => {
  if (streakWeeks >= 26) return {
    level: 6, title: 'Ogre', kanji: '地上最強', fullTitle: 'Ogre (地上最強)', image: '/bg-lvl6-ogre.jpg',
    badgeColor: '#FFD700', glowColor: 'rgba(255, 215, 0, 0.45)', nextTarget: 'Max Rank Reached'
  }
  if (streakWeeks >= 16) return {
    level: 5, title: 'Shogun', kanji: '将軍', fullTitle: 'Shogun (将軍)', image: '/bg-lvl5-shogun.jpg',
    badgeColor: '#FF4500', glowColor: 'rgba(255, 69, 0, 0.45)', nextTarget: `${26 - streakWeeks} weeks to Ogre (地上最強)`
  }
  if (streakWeeks >= 9) return {
    level: 4, title: 'Demon', kanji: '鬼', fullTitle: 'Demon (鬼)', image: '/bg-lvl4-demon.jpg',
    badgeColor: '#FF2A2A', glowColor: 'rgba(255, 42, 42, 0.45)', nextTarget: `${16 - streakWeeks} weeks to Shogun (将軍)`
  }
  if (streakWeeks >= 5) return {
    level: 3, title: 'Shadow Blade', kanji: '影刃', fullTitle: 'Shadow Blade (影刃)', image: '/katana-bg.jpg?v=2',
    badgeColor: '#FF85A2', glowColor: 'rgba(255, 133, 162, 0.45)', nextTarget: `${9 - streakWeeks} weeks to Demon (鬼)`
  }
  if (streakWeeks >= 2) return {
    level: 2, title: 'Ronin', kanji: '浪人', fullTitle: 'Ronin (浪人)', image: '/bg-lvl2-ronin.jpg',
    badgeColor: '#A0AEC0', glowColor: 'rgba(160, 174, 192, 0.45)', nextTarget: `${5 - streakWeeks} weeks to Shadow Blade (影刃)`
  }
  return {
    level: 1, title: 'Novice', kanji: '門下生', fullTitle: 'Novice (門下生)', image: '/bg-lvl1-novice.jpg',
    badgeColor: '#4ADE80', glowColor: 'rgba(74, 222, 128, 0.45)', nextTarget: `${2 - streakWeeks} weeks to Ronin (浪人)`
  }
}
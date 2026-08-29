// frontend/src/utils/planGenerator.js
import { uid } from '../lib/format.js';
import { DEFAULT_GLYPH } from '../lib/glyphs.js';

export function generatePlanFromWizard(wizardData, currentStoreState) {
  const {
    planName = 'Custom Warrior Plan',
    startDate = new Date().toISOString().split('T')[0],
    durationWeeks = 4,
    rotationType = '2week', // 'static' | '2week'
    schedule = { weekA: {}, weekB: {} },
    exerciseConfigs = {}
  } = wizardData;

  const newRoutines = [];
  const newCustomExercises = [];
  const updatedWeek = { ...(currentStoreState?.week || {}) };
  const updatedCfg = { ...(currentStoreState?.cfg || {}) };

  const daysOfWeek = [
    { key: 1, label: 'Mon' },
    { key: 2, label: 'Tue' },
    { key: 3, label: 'Wed' },
    { key: 4, label: 'Thu' },
    { key: 5, label: 'Fri' },
    { key: 6, label: 'Sat' },
    { key: 0, label: 'Sun' },
  ];

  // Helper to format date for each specific week/day
  const calculateDayDate = (startStr, weekIdx, dayKey) => {
    try {
      const base = new Date(startStr);
      // Determine day offset from Monday (dayKey: 1=Mon ... 0=Sun)
      const dayOffset = dayKey === 0 ? 6 : dayKey - 1;
      const totalDays = (weekIdx * 7) + dayOffset;
      const targetDate = new Date(base.getTime() + totalDays * 24 * 60 * 60 * 1000);
      return targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Iterate through every individual week (e.g., Week 1, Week 2, Week 3, Week 4)
  for (let w = 1; w <= durationWeeks; w++) {
    // Alternate between Week A and Week B if 2-week rotation is selected
    const isWeekB = rotationType === '2week' && w % 2 === 0;
    const currentWeekSchedule = isWeekB ? schedule.weekB : schedule.weekA;

    daysOfWeek.forEach(({ key, label }) => {
      const dayData = currentWeekSchedule[key];

      if (dayData && dayData.enabled && dayData.exercises && dayData.exercises.length > 0) {
        const routineId = uid();
        const dateStr = calculateDayDate(startDate, w - 1, key);
        const dayTitle = dayData.title || 'Workout';
        
        // Single dedicated routine name per week and day
        const routineName = `Week ${w} - ${label} (${dateStr}): ${dayTitle}`;
        const routineExIds = [];

        dayData.exercises.forEach((ex) => {
          const exId = ex.id || `custom_${(ex.n || ex.name || 'exercise').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          routineExIds.push(exId);

          const config = exerciseConfigs[exId] || {
            sets: ex.defaultSets || 3,
            reps: ex.defaultReps || 10,
            isBw: ex.eq === 'body weight'
          };

          updatedCfg[exId] = {
            sets: config.sets || 3,
            reps: config.reps || 10,
            bw: !!config.isBw
          };

          if (ex.isCustom) {
            newCustomExercises.push({
              id: exId,
              n: ex.n || ex.name,
              bp: ex.bp || 'general',
              tg: ex.tg || 'general',
              eq: config.isBw ? 'body weight' : (ex.eq || 'other'),
              custom: true
            });
          }
        });

        newRoutines.push({
          id: routineId,
          name: routineName,
          emoji: DEFAULT_GLYPH,
          ex: routineExIds,
          weekNum: w,
          dayKey: key,
          scheduledDate: calculateDayDate(startDate, w - 1, key)
        });

        // Set the active week calendar to Week 1 by default
        if (w === 1) {
          updatedWeek[key] = routineId;
        }
      } else if (w === 1) {
        updatedWeek[key] = null;
      }
    });
  }

  return {
    routines: newRoutines,
    newCustomExercises,
    updatedWeek,
    updatedCfg,
    planMetadata: {
      name: planName,
      startDate,
      durationWeeks,
      rotationType,
      createdAt: new Date().toISOString()
    }
  };
}
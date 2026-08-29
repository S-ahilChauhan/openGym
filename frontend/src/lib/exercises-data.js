// frontend/src/lib/exercises.js
//
// Exercise database + lookup helpers.
// EXDB fields: id, n (name), bp (body part), tg (target muscle), eq (equipment)

export const EXDB = [
  // --- CHEST ---
  { id: "0001", n: "Barbell Bench Press", bp: "chest", tg: "pectorals", eq: "barbell" },
  { id: "0002", n: "Incline Barbell Bench Press", bp: "chest", tg: "pectorals", eq: "barbell" },
  { id: "0003", n: "Decline Barbell Bench Press", bp: "chest", tg: "pectorals", eq: "barbell" },
  { id: "0004", n: "Flat Dumbbell Press", bp: "chest", tg: "pectorals", eq: "dumbbell" },
  { id: "0005", n: "Incline Dumbbell Press", bp: "chest", tg: "pectorals", eq: "dumbbell" },
  { id: "0006", n: "Decline Dumbbell Press", bp: "chest", tg: "pectorals", eq: "dumbbell" },
  { id: "0007", n: "Dumbbell Chest Flys", bp: "chest", tg: "pectorals", eq: "dumbbell" },
  { id: "0008", n: "Incline Dumbbell Flys", bp: "chest", tg: "pectorals", eq: "dumbbell" },
  { id: "0009", n: "Cable Chest Flys", bp: "chest", tg: "pectorals", eq: "cable" },
  { id: "0010", n: "Low-to-High Cable Flys", bp: "chest", tg: "pectorals", eq: "cable" },
  { id: "0011", n: "High-to-Low Cable Flys", bp: "chest", tg: "pectorals", eq: "cable" },
  { id: "0012", n: "Pec Dec Flys (Machine)", bp: "chest", tg: "pectorals", eq: "machine" },
  { id: "0013", n: "Chest Press Machine", bp: "chest", tg: "pectorals", eq: "machine" },
  { id: "0014", n: "Push-ups", bp: "chest", tg: "pectorals", eq: "body weight" },
  { id: "0015", n: "Decline Push-ups", bp: "chest", tg: "pectorals", eq: "body weight" },
  { id: "0016", n: "Diamond Push-ups", bp: "chest", tg: "pectorals", eq: "body weight" },
  { id: "0017", n: "Chest Dips", bp: "chest", tg: "pectorals", eq: "body weight" },
  { id: "0018", n: "Svend Press", bp: "chest", tg: "pectorals", eq: "plate" },

  // --- BACK & LATS ---
  { id: "0100", n: "Pull-ups", bp: "back", tg: "lats", eq: "body weight" },
  { id: "0101", n: "Chin-ups", bp: "back", tg: "lats", eq: "body weight" },
  { id: "0102", n: "Lat Pulldown (Wide Grip)", bp: "back", tg: "lats", eq: "cable" },
  { id: "0103", n: "Lat Pulldown (Close Grip / Neutral)", bp: "back", tg: "lats", eq: "cable" },
  { id: "0104", n: "Lat Pulldown (Underhand)", bp: "back", tg: "lats", eq: "cable" },
  { id: "0105", n: "Straight Arm Cable Pulldown", bp: "back", tg: "lats", eq: "cable" },
  { id: "0106", n: "Barbell Bent Over Row", bp: "back", tg: "upper back", eq: "barbell" },
  { id: "0107", n: "Pendlay Row", bp: "back", tg: "upper back", eq: "barbell" },
  { id: "0108", n: "T-Bar Row", bp: "back", tg: "upper back", eq: "barbell" },
  { id: "0109", n: "Single-Arm Dumbbell Row", bp: "back", tg: "upper back", eq: "dumbbell" },
  { id: "0110", n: "Chest Supported Dumbbell Row", bp: "back", tg: "upper back", eq: "dumbbell" },
  { id: "0111", n: "Seated Cable Row", bp: "back", tg: "upper back", eq: "cable" },
  { id: "0112", n: "Barbell Deadlift", bp: "back", tg: "spine", eq: "barbell" },
  { id: "0113", n: "Dumbbell Deadlift", bp: "back", tg: "spine", eq: "dumbbell" },
  { id: "0114", n: "Rack Pulls", bp: "back", tg: "spine", eq: "barbell" },
  { id: "0115", n: "Hyperextensions (Back Extensions)", bp: "back", tg: "spine", eq: "body weight" },
  { id: "0116", n: "Good Mornings", bp: "back", tg: "spine", eq: "barbell" },
  { id: "0117", n: "Barbell Shrugs", bp: "back", tg: "traps", eq: "barbell" },
  { id: "0118", n: "Dumbbell Shrugs", bp: "back", tg: "traps", eq: "dumbbell" },
  { id: "0119", n: "Trap Bar Shrugs", bp: "back", tg: "traps", eq: "barbell" },

  // --- SHOULDERS ---
  { id: "0200", n: "Overhead Barbell Press (OHP)", bp: "shoulders", tg: "delts", eq: "barbell" },
  { id: "0201", n: "Seated Dumbbell Shoulder Press", bp: "shoulders", tg: "delts", eq: "dumbbell" },
  { id: "0202", n: "Arnold Press", bp: "shoulders", tg: "delts", eq: "dumbbell" },
  { id: "0203", n: "Machine Shoulder Press", bp: "shoulders", tg: "delts", eq: "machine" },
  { id: "0204", n: "Dumbbell Lateral Raise", bp: "shoulders", tg: "delts", eq: "dumbbell" },
  { id: "0205", n: "Cable Lateral Raise", bp: "shoulders", tg: "delts", eq: "cable" },
  { id: "0206", n: "Dumbbell Front Raise", bp: "shoulders", tg: "delts", eq: "dumbbell" },
  { id: "0207", n: "Barbell Front Raise", bp: "shoulders", tg: "delts", eq: "barbell" },
  { id: "0208", n: "Cable Face Pulls", bp: "shoulders", tg: "delts", eq: "cable" },
  { id: "0209", n: "Rear Delt Dumbbell Flys", bp: "shoulders", tg: "delts", eq: "dumbbell" },
  { id: "0210", n: "Reverse Pec Dec (Machine)", bp: "shoulders", tg: "delts", eq: "machine" },
  { id: "0211", n: "Upright Barbell Rows", bp: "shoulders", tg: "delts", eq: "barbell" },
  { id: "0212", n: "Landmine Shoulder Press", bp: "shoulders", tg: "delts", eq: "barbell" },

  // --- ARMS: BICEPS ---
  { id: "0300", n: "Standing Barbell Curl", bp: "upper arms", tg: "biceps", eq: "barbell" },
  { id: "0301", n: "EZ Bar Bicep Curl", bp: "upper arms", tg: "biceps", eq: "barbell" },
  { id: "0302", n: "EZ Bar 21s (7-7-7)", bp: "upper arms", tg: "biceps", eq: "barbell" },
  { id: "0303", n: "Standing Dumbbell Bicep Curl", bp: "upper arms", tg: "biceps", eq: "dumbbell" },
  { id: "0304", n: "Incline Dumbbell Curl", bp: "upper arms", tg: "biceps", eq: "dumbbell" },
  { id: "0305", n: "Dumbbell Hammer Curls", bp: "upper arms", tg: "biceps", eq: "dumbbell" },
  { id: "0306", n: "Rope Hammer Curls (Cable)", bp: "upper arms", tg: "biceps", eq: "cable" },
  { id: "0307", n: "Preacher Curls (EZ Bar)", bp: "upper arms", tg: "biceps", eq: "barbell" },
  { id: "0308", n: "Preacher Curls (Machine)", bp: "upper arms", tg: "biceps", eq: "machine" },
  { id: "0309", n: "Concentration Curls", bp: "upper arms", tg: "biceps", eq: "dumbbell" },
  { id: "0310", n: "Spider Curls", bp: "upper arms", tg: "biceps", eq: "dumbbell" },
  { id: "0311", n: "Reverse Grip Barbell Curl", bp: "upper arms", tg: "biceps", eq: "barbell" },
  { id: "0312", n: "Cable Bicep Curls", bp: "upper arms", tg: "biceps", eq: "cable" },

  // --- ARMS: TRICEPS ---
  { id: "0350", n: "Triceps Rope Pushdown", bp: "upper arms", tg: "triceps", eq: "cable" },
  { id: "0351", n: "Triceps Straight Bar Pushdown", bp: "upper arms", tg: "triceps", eq: "cable" },
  { id: "0352", n: "Reverse Grip Triceps Pushdown", bp: "upper arms", tg: "triceps", eq: "cable" },
  { id: "0353", n: "Overhead Rope Cable Extension", bp: "upper arms", tg: "triceps", eq: "cable" },
  { id: "0354", n: "Overhead Dumbbell Extension", bp: "upper arms", tg: "triceps", eq: "dumbbell" },
  { id: "0355", n: "Skull Crushers (Lying Triceps Extension)", bp: "upper arms", tg: "triceps", eq: "barbell" },
  { id: "0356", n: "Dumbbell Skull Crushers", bp: "upper arms", tg: "triceps", eq: "dumbbell" },
  { id: "0357", n: "Close-Grip Barbell Bench Press", bp: "upper arms", tg: "triceps", eq: "barbell" },
  { id: "0358", n: "Parallel Bar Dips", bp: "upper arms", tg: "triceps", eq: "body weight" },
  { id: "0359", n: "Bench Dips", bp: "upper arms", tg: "triceps", eq: "body weight" },
  { id: "0360", n: "Dumbbell Tricep Kickbacks", bp: "upper arms", tg: "triceps", eq: "dumbbell" },

  // --- FOREARMS ---
  { id: "0400", n: "Barbell Wrist Curls", bp: "lower arms", tg: "forearms", eq: "barbell" },
  { id: "0401", n: "Reverse Barbell Wrist Curls", bp: "lower arms", tg: "forearms", eq: "barbell" },
  { id: "0402", n: "Dumbbell Wrist Curls", bp: "lower arms", tg: "forearms", eq: "dumbbell" },
  { id: "0403", n: "Reverse Dumbbell Wrist Curls", bp: "lower arms", tg: "forearms", eq: "dumbbell" },
  { id: "0404", n: "Farmer's Walk (Grip & Forearms)", bp: "lower arms", tg: "forearms", eq: "dumbbell" },
  { id: "0405", n: "Dead Hang (Grip & Decompression)", bp: "lower arms", tg: "forearms", eq: "body weight" },

  // --- LEGS: QUADS & GLUTES ---
  { id: "0500", n: "Barbell Back Squat", bp: "upper legs", tg: "quads", eq: "barbell" },
  { id: "0501", n: "Front Squat", bp: "upper legs", tg: "quads", eq: "barbell" },
  { id: "0502", n: "Goblet Squat", bp: "upper legs", tg: "quads", eq: "dumbbell" },
  { id: "0503", n: "Leg Press (45 Degree)", bp: "upper legs", tg: "quads", eq: "machine" },
  { id: "0504", n: "Hack Squat Machine", bp: "upper legs", tg: "quads", eq: "machine" },
  { id: "0505", n: "Leg Extension Machine", bp: "upper legs", tg: "quads", eq: "machine" },
  { id: "0506", n: "Single-Leg Extension", bp: "upper legs", tg: "quads", eq: "machine" },
  { id: "0507", n: "Bulgarian Split Squats", bp: "upper legs", tg: "quads", eq: "dumbbell" },
  { id: "0508", n: "Walking Lunges", bp: "upper legs", tg: "quads", eq: "dumbbell" },
  { id: "0509", n: "Reverse Lunges", bp: "upper legs", tg: "quads", eq: "dumbbell" },
  { id: "0510", n: "Barbell Hip Thrust", bp: "upper legs", tg: "glutes", eq: "barbell" },
  { id: "0511", n: "Dumbbell Glute Bridge", bp: "upper legs", tg: "glutes", eq: "dumbbell" },
  { id: "0512", n: "Bodyweight Squats (Air Squats)", bp: "upper legs", tg: "quads", eq: "body weight" },
  { id: "0513", n: "Sissy Squats", bp: "upper legs", tg: "quads", eq: "body weight" },
  { id: "0514", n: "Step-ups", bp: "upper legs", tg: "glutes", eq: "dumbbell" },

  // --- LEGS: HAMSTRINGS & CALVES ---
  { id: "0550", n: "Lying Leg Curl Machine", bp: "upper legs", tg: "hamstrings", eq: "machine" },
  { id: "0551", n: "Seated Leg Curl Machine", bp: "upper legs", tg: "hamstrings", eq: "machine" },
  { id: "0552", n: "Romanian Deadlift (Barbell)", bp: "upper legs", tg: "hamstrings", eq: "barbell" },
  { id: "0553", n: "Romanian Deadlift (Dumbbell)", bp: "upper legs", tg: "hamstrings", eq: "dumbbell" },
  { id: "0554", n: "Stiff Leg Deadlift", bp: "upper legs", tg: "hamstrings", eq: "barbell" },
  { id: "0555", n: "Nordic Hamstring Curl", bp: "upper legs", tg: "hamstrings", eq: "body weight" },
  { id: "0560", n: "Standing Calf Raise (Machine)", bp: "lower legs", tg: "calves", eq: "machine" },
  { id: "0561", n: "Seated Calf Raise (Machine)", bp: "lower legs", tg: "calves", eq: "machine" },
  { id: "0562", n: "Donkey Calf Raise", bp: "lower legs", tg: "calves", eq: "machine" },
  { id: "0563", n: "Single-Leg Dumbbell Calf Raise", bp: "lower legs", tg: "calves", eq: "dumbbell" },
  { id: "0564", n: "Leg Press Calf Press", bp: "lower legs", tg: "calves", eq: "machine" },

  // --- CORE & ABS ---
  { id: "0600", n: "Floor Crunches", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0601", n: "Bicycle Crunches", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0602", n: "Hanging Leg Raises", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0603", n: "Hanging Knee Raises", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0604", n: "Lying Leg Raises", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0605", n: "Standard Plank", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0606", n: "Side Plank", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0607", n: "Ab Wheel Rollout", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0608", n: "Cable Woodchoppers", bp: "waist", tg: "abs", eq: "cable" },
  { id: "0609", n: "Cable Kneeling Crunch", bp: "waist", tg: "abs", eq: "cable" },
  { id: "0610", n: "Russian Twists", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0611", n: "HIIT Abs Circuit (10 min)", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0612", n: "Mountain Climbers", bp: "waist", tg: "abs", eq: "body weight" },
  { id: "0613", n: "Decline Bench Sit-ups", bp: "waist", tg: "abs", eq: "body weight" },

  // --- CARDIO & CONDITIONING ---
  { id: "0700", n: "Stationary Bike (Cycling)", bp: "cardio", tg: "cardio", eq: "machine" },
  { id: "0701", n: "Treadmill Running / Walking", bp: "cardio", tg: "cardio", eq: "machine" },
  { id: "0702", n: "Incline Treadmill Brisk Walk", bp: "cardio", tg: "cardio", eq: "machine" },
  { id: "0703", n: "Rowing Machine (Ergometer)", bp: "cardio", tg: "cardio", eq: "machine" },
  { id: "0704", n: "Stairmaster (Stair Climber)", bp: "cardio", tg: "cardio", eq: "machine" },
  { id: "0705", n: "Jump Rope (Skipping)", bp: "cardio", tg: "cardio", eq: "rope" },
  { id: "0706", n: "Elliptical Trainer", bp: "cardio", tg: "cardio", eq: "machine" }
];

// Pre-index for O(1) lookups
const _byId = new Map(EXDB.map((ex) => [String(ex.id), ex]));

/**
 * Resolves exercise by ID with fallback support for store custom exercises
 */
export function exById(id, S = null) {
  if (id == null) return undefined;
  const strId = String(id);

  // 1. Check official catalog Map
  if (_byId.has(strId)) return _byId.get(strId);

  // 2. Check store custom exercises if S is passed
  if (S?.customEx && Array.isArray(S.customEx)) {
    const foundCustom = S.customEx.find((x) => String(x.id) === strId);
    if (foundCustom) return foundCustom;
  }

  return undefined;
}

export function findEx(id, S = null) {
  const ex = exById(id, S);
  if (!ex) {
    throw new Error(`Exercise not found for id "${id}"`);
  }
  return ex;
}

export function searchEx(query = "", opts = {}, S = null) {
  const q = query.trim().toLowerCase();
  const { bodyPart, equipment } = opts;
  const pool = S?.customEx ? [...EXDB, ...S.customEx] : EXDB;

  return pool.filter((ex) => {
    if (bodyPart && ex.bp !== bodyPart) return false;
    if (equipment && ex.eq !== equipment) return false;
    if (!q) return true;

    return (
      (ex.n && ex.n.toLowerCase().includes(q)) ||
      (ex.bp && ex.bp.toLowerCase().includes(q)) ||
      (ex.tg && ex.tg.toLowerCase().includes(q)) ||
      (ex.eq && ex.eq.toLowerCase().includes(q))
    );
  });
}

export function allBodyParts() {
  return [...new Set(EXDB.map((ex) => ex.bp))];
}

export function allEquipment() {
  return [...new Set(EXDB.map((ex) => ex.eq))];
}
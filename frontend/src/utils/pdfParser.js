// frontend/src/utils/pdfParser.js
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { uid } from '../lib/format.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      fullText += pageStrings.join('\n') + '\n';
    }

    return fullText;
  } catch (err) {
    console.error('PDF text extraction failure:', err);
    throw new Error('Failed to read PDF text.');
  }
}

/**
 * Standardizes exercise lookup: Finds existing exercise in library or creates a valid registered entry
 */
function resolveExercise(name, existingExercises = []) {
  const cleanName = name.replace(/[:\-–—\d\(\)]/g, ' ').trim();
  const normalized = cleanName.toLowerCase();

  // 1. Look for existing match in library
  const existing = existingExercises.find(
    (e) => e.name?.toLowerCase() === normalized || e.id?.toLowerCase() === normalized
  );
  if (existing) {
    return { exerciseId: existing.id, newExerciseDef: null, name: existing.name };
  }

  // 2. Create a clean new library entry if it doesn't exist
  const newId = typeof uid === 'function' ? uid() : 'ex_' + Math.random().toString(36).substring(2, 9);
  const newExerciseDef = {
    id: newId,
    name: cleanName,
    cat: 'other',
  };

  return { exerciseId: newId, newExerciseDef, name: cleanName };
}

/**
 * Parses raw text into OpenGym routine structures and creates required exercise definitions
 */
export function parseWorkoutTextToRoutines(rawText, existingExercises = []) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const routines = [];
  const newlyCreatedExercises = [];
  let currentRoutine = null;

  const headerPattern = /(?:day\s*\d+|push|pull|legs|upper|lower|chest|back|arms|shoulders|routine|split|session|workout)/i;
  const setRepPattern = /(\d+)\s*(?:x|sets?\s*x?|×)\s*(\d+)/i;

  for (const line of lines) {
    if (headerPattern.test(line) && line.length < 40 && !setRepPattern.test(line)) {
      if (currentRoutine && currentRoutine.ex.length > 0) {
        routines.push(currentRoutine);
      }
      currentRoutine = {
        id: typeof uid === 'function' ? uid() : 'rt_' + Math.random().toString(36).substring(2, 9),
        name: line.replace(/[:\-#_]/g, '').trim(),
        emoji: 'dumbbell',
        ex: [],
      };
      continue;
    }

    const match = line.match(setRepPattern);
    if (match) {
      if (!currentRoutine) {
        currentRoutine = {
          id: typeof uid === 'function' ? uid() : 'rt_' + Math.random().toString(36).substring(2, 9),
          name: 'Imported Routine',
          emoji: 'dumbbell',
          ex: [],
        };
      }

      const rawName = line.replace(setRepPattern, '').trim();
      if (rawName.length > 1) {
        const { exerciseId, newExerciseDef } = resolveExercise(rawName, [
          ...existingExercises,
          ...newlyCreatedExercises,
        ]);

        if (newExerciseDef) {
          newlyCreatedExercises.push(newExerciseDef);
        }

        currentRoutine.ex.push(exerciseId);
      }
    }
  }

  if (currentRoutine && currentRoutine.ex.length > 0) {
    routines.push(currentRoutine);
  }

  return { routines, newlyCreatedExercises };
}
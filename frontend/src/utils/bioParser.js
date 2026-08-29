// frontend/src/utils/bioParser.js
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Extracts raw text from an uploaded PDF file
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return fullText;
}

/**
 * Parses smart scale report text into structured OpenGym bio-scan schema
 */
export function parseSmartScaleReport(text = '') {
  const findNum = (pattern) => {
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : null;
  };

  const findStr = (pattern) => {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  };

  const weight = findNum(/(?:Weight|Body Weight)[\s:]*([0-9.]+)\s*(?:kg|Kg|lbs)?/i) || 75.0;
  const bodyFatPct = findNum(/(?:Body Fat Percentage|Body Fat)[\s:]*([0-9.]+)\s*%/i) || 20.0;
  const muscleMass = findNum(/(?:Muscle Mass)[\s:]*([0-9.]+)\s*(?:kg|Kg)?/i) || (weight * 0.52);
  const bmr = findNum(/(?:Basal Metabolic Rate|BMR)[\s:]*([0-9.]+)\s*(?:kcal)?/i) || 1600;
  const metabolicAge = findNum(/(?:Metabolic Age)[\s:]*([0-9]+)\s*(?:years|yrs)?/i) || 25;
  const fatMass = findNum(/(?:Fat Mass)[\s:]*([0-9.]+)\s*(?:kg|Kg)?/i) || ((weight * bodyFatPct) / 100);
  const leanMass = findNum(/(?:Lean Mass)[\s:]*([0-9.]+)\s*(?:kg|Kg)?/i) || (weight - fatMass);
  const visceralFatIndex = findNum(/(?:Visceral Fat Index|Visceral Fat)[\s:]*([0-9.]+)/i) || 6;
  const subcutaneousFatPct = findNum(/(?:Subcutaneous Fat)[\s:]*([0-9.]+)\s*%/i) || 18.0;
  const boneMass = findNum(/(?:Bone Mass)[\s:]*([0-9.]+)\s*(?:kg|Kg)?/i) || 2.8;
  const proteinPct = findNum(/(?:Protein Percentage|Protein)[\s:]*([0-9.]+)\s*%/i) || 16.0;
  const age = findNum(/(?:Age)[\s:]*([0-9]+)/i) || 25;
  const height = findStr(/(?:Height)[\s:]*([^\n\r]+)/i) || `5'8"`;
  const name = findStr(/(?:Name)[\s:]*([A-Za-z\s]+)/i) || 'Warrior';
  const overallScore = findNum(/(?:Overall Weight Score|Health Score|Score)[\s:]*([0-9]+)/i) || 75;

  return {
    reportDate: new Date().toISOString().slice(0, 10),
    name,
    age,
    height,
    weight: Math.round(weight * 100) / 100,
    bmi: Math.round((weight / (1.72 * 1.72)) * 10) / 10,
    bmr: Math.round(bmr),
    metabolicAge: Math.round(metabolicAge),
    bodyFatPct: Math.round(bodyFatPct * 10) / 10,
    subcutaneousFatPct: Math.round(subcutaneousFatPct * 10) / 10,
    visceralFatIndex: Math.round(visceralFatIndex),
    fatMass: Math.round(fatMass * 10) / 10,
    leanMass: Math.round(leanMass * 10) / 10,
    muscleMass: Math.round(muscleMass * 10) / 10,
    boneMass: Math.round(boneMass * 10) / 10,
    proteinPct: Math.round(proteinPct * 10) / 10,
    scores: {
      overall: Math.round(overallScore),
      bodyComposition: 80,
      fatAnalysis: bodyFatPct > 22 ? 60 : 85,
      metabolicIndicators: 80
    },
    targets: {
      idealWeight: Math.round(weight * 0.82),
      targetFatMass: Math.max(10, Math.round(fatMass * 0.75)),
      targetBodyFat: 18.0,
      targetMetabolicAge: Math.min(age, metabolicAge)
    }
  };
}
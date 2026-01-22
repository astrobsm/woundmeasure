/**
 * AstroWound-MEASURE Comorbidity Risk Engine
 * Clinical decision rules for risk flagging based on comorbidities
 */

import type {
  Comorbidity,
  ComorbidityEntry,
  RiskFlag,
  RiskLevel,
  AnalgesicClass,
  PainPatientInfo,
} from '@/types';
import { COMORBIDITY_INFO } from './clinicalConstants';

/**
 * Risk rule definition type
 */
interface RiskRule {
  conditions: Comorbidity[];
  conditionLogic: 'any' | 'all';
  ageCondition?: { operator: '>' | '<' | '>=' | '<='; value: number };
  level: RiskLevel;
  category: string;
  message: string;
  affectedDrugClasses: AnalgesicClass[];
  recommendation: string;
}

/**
 * Clinical risk rules database
 * These rules are based on established clinical guidelines
 */
const RISK_RULES: RiskRule[] = [
  // GI Risk - NSAIDs
  {
    conditions: ['peptic_ulcer', 'gi_bleed_history'],
    conditionLogic: 'any',
    level: 'contraindicated',
    category: 'Gastrointestinal',
    message: 'NSAIDs contraindicated due to GI risk',
    affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective'],
    recommendation: 'Avoid all NSAIDs. Consider paracetamol as first-line. If NSAID essential, use COX-2 selective with PPI cover after specialist review.'
  },

  // Renal Risk - NSAIDs
  {
    conditions: ['ckd_stage_3a', 'ckd_stage_3b', 'ckd_stage_4', 'ckd_stage_5'],
    conditionLogic: 'any',
    level: 'contraindicated',
    category: 'Renal',
    message: 'NSAIDs contraindicated in moderate-severe CKD',
    affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective'],
    recommendation: 'Avoid all NSAIDs. Use paracetamol. Opioids require dose adjustment based on eGFR.'
  },

  // Mild CKD - NSAID caution
  {
    conditions: ['ckd_stage_1', 'ckd_stage_2'],
    conditionLogic: 'any',
    level: 'caution',
    category: 'Renal',
    message: 'Use NSAIDs with caution in early CKD',
    affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective'],
    recommendation: 'Short-term use only. Monitor renal function. Ensure adequate hydration.'
  },

  // Severe CKD - Opioid adjustment
  {
    conditions: ['ckd_stage_4', 'ckd_stage_5'],
    conditionLogic: 'any',
    level: 'warning',
    category: 'Renal',
    message: 'Opioid dose adjustment required in severe CKD',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid'],
    recommendation: 'Reduce opioid doses by 50-75%. Avoid morphine (active metabolites accumulate). Prefer fentanyl or hydromorphone.'
  },

  // Liver Disease - Paracetamol
  {
    conditions: ['liver_disease_severe'],
    conditionLogic: 'any',
    level: 'warning',
    category: 'Hepatic',
    message: 'Paracetamol dose reduction required in severe liver disease',
    affectedDrugClasses: ['paracetamol'],
    recommendation: 'Maximum 2g/day paracetamol. Avoid in acute liver failure. Monitor LFTs.'
  },

  // Liver Disease - Opioids
  {
    conditions: ['liver_disease_moderate', 'liver_disease_severe'],
    conditionLogic: 'any',
    level: 'warning',
    category: 'Hepatic',
    message: 'Opioid dose adjustment required in liver disease',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid'],
    recommendation: 'Reduce opioid doses. Avoid codeine and tramadol (unpredictable metabolism). Increase dosing interval.'
  },

  // Cardiovascular - NSAIDs
  {
    conditions: ['heart_failure', 'ischemic_heart_disease'],
    conditionLogic: 'any',
    level: 'contraindicated',
    category: 'Cardiovascular',
    message: 'NSAIDs contraindicated in heart failure and IHD',
    affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective'],
    recommendation: 'Avoid all NSAIDs due to cardiovascular and fluid retention risks. Use paracetamol and opioids if needed.'
  },

  // Hypertension - NSAID caution
  {
    conditions: ['hypertension'],
    conditionLogic: 'any',
    level: 'caution',
    category: 'Cardiovascular',
    message: 'NSAIDs may worsen hypertension',
    affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective'],
    recommendation: 'Monitor blood pressure if NSAID used. Prefer short-term use. Consider paracetamol first-line.'
  },

  // Respiratory - Opioids
  {
    conditions: ['copd', 'respiratory_depression_risk'],
    conditionLogic: 'any',
    level: 'warning',
    category: 'Respiratory',
    message: 'Increased respiratory depression risk with opioids',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid', 'anxiolytic'],
    recommendation: 'Use lowest effective opioid dose. Start low, titrate slowly. Continuous monitoring recommended. Avoid benzodiazepines if possible.'
  },

  // Asthma - NSAIDs
  {
    conditions: ['asthma'],
    conditionLogic: 'any',
    level: 'caution',
    category: 'Respiratory',
    message: 'Risk of NSAID-induced bronchospasm',
    affectedDrugClasses: ['nsaid_non_selective'],
    recommendation: 'Avoid in aspirin-sensitive asthma. Use with caution otherwise. COX-2 selective may be safer alternative.'
  },

  // Pregnancy
  {
    conditions: ['pregnancy'],
    conditionLogic: 'any',
    level: 'contraindicated',
    category: 'Pregnancy',
    message: 'NSAIDs contraindicated in pregnancy (especially third trimester)',
    affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective'],
    recommendation: 'Avoid NSAIDs. Paracetamol is preferred analgesic. Opioids only under specialist supervision.'
  },

  // Pregnancy - Opioids
  {
    conditions: ['pregnancy'],
    conditionLogic: 'any',
    level: 'warning',
    category: 'Pregnancy',
    message: 'Opioid use in pregnancy requires specialist supervision',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid'],
    recommendation: 'Short-term use only. Monitor for neonatal abstinence syndrome if used near delivery. Avoid codeine.'
  },

  // Lactation
  {
    conditions: ['lactation'],
    conditionLogic: 'any',
    level: 'caution',
    category: 'Lactation',
    message: 'Analgesic choice requires consideration of breastfeeding',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid', 'nsaid_non_selective'],
    recommendation: 'Paracetamol and ibuprofen are compatible with breastfeeding. Avoid codeine. Use lowest effective dose of any analgesic.'
  },

  // Opioid Tolerance
  {
    conditions: ['opioid_tolerance'],
    conditionLogic: 'any',
    level: 'info',
    category: 'Pain History',
    message: 'Patient is opioid tolerant - higher doses may be required',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid'],
    recommendation: 'Calculate opioid requirement based on current daily dose. May need higher starting doses for acute pain. Multimodal analgesia recommended.'
  },

  // Opioid Dependence
  {
    conditions: ['opioid_dependence'],
    conditionLogic: 'any',
    level: 'warning',
    category: 'Pain History',
    message: 'History of opioid dependence - careful opioid management required',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid'],
    recommendation: 'Develop clear pain management plan. Consider addiction medicine consultation. Maximize non-opioid strategies. If opioids needed, use structured approach with defined endpoints.'
  },

  // Coagulopathy - NSAIDs
  {
    conditions: ['coagulopathy'],
    conditionLogic: 'any',
    level: 'contraindicated',
    category: 'Hematologic',
    message: 'NSAIDs contraindicated with coagulopathy',
    affectedDrugClasses: ['nsaid_non_selective'],
    recommendation: 'Avoid non-selective NSAIDs. COX-2 selective may be considered with caution. Avoid intramuscular injections.'
  },

  // Seizure Disorder - Tramadol
  {
    conditions: ['seizure_disorder'],
    conditionLogic: 'any',
    level: 'contraindicated',
    category: 'Neurological',
    message: 'Tramadol contraindicated in seizure disorder',
    affectedDrugClasses: ['weak_opioid'],
    recommendation: 'Avoid tramadol (lowers seizure threshold). Consider other opioids if needed. Gabapentinoids may be useful adjuvants.'
  },

  // Mental Health - Opioids
  {
    conditions: ['mental_health_disorder'],
    conditionLogic: 'any',
    level: 'caution',
    category: 'Psychiatric',
    message: 'Increased risk of opioid misuse in mental health disorders',
    affectedDrugClasses: ['weak_opioid', 'strong_opioid'],
    recommendation: 'Careful assessment and monitoring. Defined treatment duration. Consider non-opioid strategies. Liaise with mental health team if needed.'
  }
];

/**
 * Generate risk flags based on patient comorbidities
 */
export function generateRiskFlags(
  comorbidities: ComorbidityEntry[],
  patient: PainPatientInfo
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const patientConditions = comorbidities.map(c => c.condition);

  for (const rule of RISK_RULES) {
    // Check if any/all conditions are met
    let conditionsMet = false;

    if (rule.conditionLogic === 'any') {
      conditionsMet = rule.conditions.some(c => patientConditions.includes(c));
    } else {
      conditionsMet = rule.conditions.every(c => patientConditions.includes(c));
    }

    // Check age condition if present
    if (rule.ageCondition && conditionsMet) {
      const age = patient.age;
      switch (rule.ageCondition.operator) {
        case '>': conditionsMet = age > rule.ageCondition.value; break;
        case '<': conditionsMet = age < rule.ageCondition.value; break;
        case '>=': conditionsMet = age >= rule.ageCondition.value; break;
        case '<=': conditionsMet = age <= rule.ageCondition.value; break;
      }
    }

    if (conditionsMet) {
      flags.push({
        id: crypto.randomUUID(),
        level: rule.level,
        category: rule.category,
        message: rule.message,
        affectedDrugClasses: rule.affectedDrugClasses,
        recommendation: rule.recommendation
      });
    }
  }

  // Add age-based flags
  if (patient.category === 'elderly' || patient.age >= 65) {
    flags.push({
      id: crypto.randomUUID(),
      level: 'caution',
      category: 'Age',
      message: 'Elderly patient - consider age-related pharmacokinetic changes',
      affectedDrugClasses: ['nsaid_non_selective', 'nsaid_cox2_selective', 'weak_opioid', 'strong_opioid'],
      recommendation: 'Start low, go slow with all analgesics. Increased sensitivity to opioids. Higher NSAID GI/CV/renal risks. Consider reduced doses.'
    });
  }

  if (patient.category === 'pediatric') {
    flags.push({
      id: crypto.randomUUID(),
      level: 'info',
      category: 'Age',
      message: 'Pediatric patient - weight-based dosing required',
      affectedDrugClasses: ['paracetamol', 'nsaid_non_selective', 'weak_opioid', 'strong_opioid'],
      recommendation: 'All doses must be calculated per kilogram. Avoid codeine in children. Use age-appropriate formulations.'
    });
  }

  if (patient.category === 'neonate') {
    flags.push({
      id: crypto.randomUUID(),
      level: 'warning',
      category: 'Age',
      message: 'Neonate - specialist pain management required',
      affectedDrugClasses: ['paracetamol', 'weak_opioid', 'strong_opioid'],
      recommendation: 'Neonatal-specific dosing protocols required. Immature hepatic and renal function. Consider non-pharmacological measures (sucrose, swaddling, skin-to-skin).'
    });
  }

  return flags;
}

/**
 * Get all contraindicated drug classes based on risk flags
 */
export function getContraindicatedClasses(flags: RiskFlag[]): AnalgesicClass[] {
  const contraindicated = new Set<AnalgesicClass>();

  for (const flag of flags) {
    if (flag.level === 'contraindicated') {
      flag.affectedDrugClasses.forEach(c => contraindicated.add(c));
    }
  }

  return Array.from(contraindicated);
}

/**
 * Get classes requiring caution based on risk flags
 */
export function getCautionClasses(flags: RiskFlag[]): AnalgesicClass[] {
  const caution = new Set<AnalgesicClass>();

  for (const flag of flags) {
    if (flag.level === 'caution' || flag.level === 'warning') {
      flag.affectedDrugClasses.forEach(c => caution.add(c));
    }
  }

  return Array.from(caution);
}

/**
 * Check if a specific drug class is safe for the patient
 */
export function checkDrugClassSafety(
  drugClass: AnalgesicClass,
  flags: RiskFlag[]
): { safe: boolean; level: RiskLevel; warnings: string[] } {
  const relevantFlags = flags.filter(f => f.affectedDrugClasses.includes(drugClass));

  if (relevantFlags.length === 0) {
    return { safe: true, level: 'info', warnings: [] };
  }

  // Find the highest risk level
  const levels: RiskLevel[] = ['info', 'caution', 'warning', 'contraindicated'];
  let highestLevel: RiskLevel = 'info';

  for (const flag of relevantFlags) {
    if (levels.indexOf(flag.level) > levels.indexOf(highestLevel)) {
      highestLevel = flag.level;
    }
  }

  return {
    safe: highestLevel !== 'contraindicated',
    level: highestLevel,
    warnings: relevantFlags.map(f => f.message)
  };
}

/**
 * Group comorbidities by category for display
 */
export function groupComorbidities(comorbidities: ComorbidityEntry[]): Record<string, ComorbidityEntry[]> {
  const grouped: Record<string, ComorbidityEntry[]> = {};

  for (const entry of comorbidities) {
    const info = COMORBIDITY_INFO[entry.condition];
    const category = info.category;

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(entry);
  }

  return grouped;
}

/**
 * Get all available comorbidity options grouped by category (for UI selection)
 */
export function getComorbidityOptions(): Record<string, Comorbidity[]> {
  const grouped: Record<string, Comorbidity[]> = {};

  for (const [condition, info] of Object.entries(COMORBIDITY_INFO)) {
    if (!grouped[info.category]) {
      grouped[info.category] = [];
    }
    grouped[info.category].push(condition as Comorbidity);
  }

  return grouped;
}

/**
 * Get all available comorbidities grouped by category
 */
export function getAvailableComorbidities(): Record<string, { condition: Comorbidity; info: typeof COMORBIDITY_INFO[Comorbidity] }[]> {
  const grouped: Record<string, { condition: Comorbidity; info: typeof COMORBIDITY_INFO[Comorbidity] }[]> = {};

  for (const [condition, info] of Object.entries(COMORBIDITY_INFO)) {
    if (!grouped[info.category]) {
      grouped[info.category] = [];
    }
    grouped[info.category].push({
      condition: condition as Comorbidity,
      info
    });
  }

  return grouped;
}

/**
 * Get risk level badge styling
 */
export function getRiskLevelBadge(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'info':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
    case 'caution':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
    case 'warning':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
    case 'contraindicated':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
  }
}

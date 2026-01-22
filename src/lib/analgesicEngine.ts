/**
 * AstroWound-MEASURE Analgesic Planning Engine
 * WHO Ladder-based recommendations with procedural pain support
 */

import type {
  PainSeverity,
  DressingPainAssessment,
  AnalgesicClass,
  AnalgesicRecommendation,
  RiskFlag,
  ProceduralPainPlan,
  ProcedureType,
  PainPatientInfo,
} from '@/types';
// ANALGESIC_CLASSES is defined in clinicalConstants but used inline here
import { getContraindicatedClasses, checkDrugClassSafety } from './comorbidityEngine';

/**
 * WHO Ladder step determination
 */
export type WHOStep = 1 | 2 | 3;

export function getWHOStep(severity: PainSeverity): WHOStep {
  switch (severity) {
    case 'none':
    case 'mild':
      return 1;
    case 'moderate':
      return 2;
    case 'severe':
      return 3;
  }
}

/**
 * Get pain severity from numeric score
 */
export function getPainSeverity(score: number): PainSeverity {
  if (score === 0) return 'none';
  if (score <= 3) return 'mild';
  if (score <= 6) return 'moderate';
  return 'severe';
}

/**
 * Generate analgesic recommendations based on pain assessment and risk flags
 */
export function generateAnalgesicRecommendations(
  assessment: DressingPainAssessment,
  riskFlags: RiskFlag[],
  patient: PainPatientInfo
): {
  primaryRecommendations: AnalgesicRecommendation[];
  adjunctRecommendations: AnalgesicRecommendation[];
  contraindicatedClasses: AnalgesicClass[];
  nonPharmacological: string[];
} {
  const contraindicatedClasses = getContraindicatedClasses(riskFlags);
  const whoStep = getWHOStep(assessment.severity);

  const primaryRecommendations: AnalgesicRecommendation[] = [];
  const adjunctRecommendations: AnalgesicRecommendation[] = [];

  // Step 1: Non-opioid analgesics
  if (whoStep >= 1) {
    // Paracetamol - almost always first-line
    const paracetamolSafety = checkDrugClassSafety('paracetamol', riskFlags);
    primaryRecommendations.push({
      class: 'paracetamol',
      suitability: paracetamolSafety.safe ? 'recommended' : 'caution',
      routes: ['oral', 'intravenous', 'rectal'],
      rationale: 'First-line analgesic for all pain levels. Safe in most patients.',
      doseAdjustment: paracetamolSafety.warnings.length > 0 ? paracetamolSafety.warnings.join('. ') : undefined,
      monitoringRequired: paracetamolSafety.level !== 'info' ? ['Liver function if prolonged use'] : undefined
    });

    // NSAIDs - if not contraindicated
    if (!contraindicatedClasses.includes('nsaid_non_selective')) {
      const nsaidSafety = checkDrugClassSafety('nsaid_non_selective', riskFlags);
      if (assessment.painType === 'inflammatory' || assessment.painType === 'nociceptive') {
        primaryRecommendations.push({
          class: 'nsaid_non_selective',
          suitability: nsaidSafety.level === 'info' ? 'recommended' :
                       nsaidSafety.level === 'caution' ? 'consider' : 'caution',
          routes: ['oral', 'intravenous', 'topical'],
          rationale: 'Effective for inflammatory and nociceptive pain. Consider GI protection.',
          doseAdjustment: nsaidSafety.warnings.length > 0 ? nsaidSafety.warnings.join('. ') : undefined,
          monitoringRequired: ['Renal function', 'GI symptoms', 'Blood pressure']
        });
      }
    }
  }

  // Step 2: Weak opioids
  if (whoStep >= 2) {
    if (!contraindicatedClasses.includes('weak_opioid')) {
      const weakOpioidSafety = checkDrugClassSafety('weak_opioid', riskFlags);
      primaryRecommendations.push({
        class: 'weak_opioid',
        suitability: weakOpioidSafety.level === 'info' ? 'recommended' :
                     weakOpioidSafety.level === 'caution' ? 'consider' : 'caution',
        routes: ['oral', 'intravenous'],
        rationale: 'Step 2 WHO ladder for moderate pain not controlled by non-opioids alone.',
        doseAdjustment: weakOpioidSafety.warnings.length > 0 ? weakOpioidSafety.warnings.join('. ') : undefined,
        monitoringRequired: ['Sedation level', 'Respiratory rate', 'Constipation', 'Nausea']
      });
    }
  }

  // Step 3: Strong opioids
  if (whoStep >= 3) {
    if (!contraindicatedClasses.includes('strong_opioid')) {
      const strongOpioidSafety = checkDrugClassSafety('strong_opioid', riskFlags);
      primaryRecommendations.push({
        class: 'strong_opioid',
        suitability: strongOpioidSafety.level === 'info' ? 'recommended' :
                     strongOpioidSafety.level === 'warning' ? 'caution' : 'consider',
        routes: ['oral', 'intravenous', 'subcutaneous', 'transdermal'],
        rationale: 'Step 3 WHO ladder for severe pain. Titrate to effect.',
        doseAdjustment: strongOpioidSafety.warnings.length > 0 ? strongOpioidSafety.warnings.join('. ') : undefined,
        monitoringRequired: ['Sedation scoring', 'Respiratory rate q1-4h', 'Pain score', 'Side effects']
      });
    }
  }

  // Adjuvant therapy based on pain type
  if (assessment.painType === 'neuropathic' || assessment.painType === 'mixed') {
    // Anticonvulsants
    adjunctRecommendations.push({
      class: 'adjuvant_anticonvulsant',
      suitability: 'consider',
      routes: ['oral'],
      rationale: 'First-line adjuvant for neuropathic pain component.',
      monitoringRequired: ['Sedation', 'Dizziness', 'Peripheral edema']
    });

    // Antidepressants
    adjunctRecommendations.push({
      class: 'adjuvant_antidepressant',
      suitability: 'consider',
      routes: ['oral'],
      rationale: 'Alternative or addition for neuropathic pain.',
      monitoringRequired: ['Anticholinergic effects', 'Cardiac effects (TCAs)']
    });
  }

  // Topical options for localized pain
  if (assessment.location && (assessment.painType === 'nociceptive' || assessment.painType === 'inflammatory')) {
    adjunctRecommendations.push({
      class: 'topical_analgesic',
      suitability: 'consider',
      routes: ['topical'],
      rationale: 'Topical option for localized pain with minimal systemic effects.',
      monitoringRequired: ['Local skin reaction']
    });
  }

  // Muscle relaxants for musculoskeletal pain
  if (assessment.painType === 'nociceptive' && assessment.description.toLowerCase().includes('spasm')) {
    adjunctRecommendations.push({
      class: 'adjuvant_muscle_relaxant',
      suitability: 'consider',
      routes: ['oral'],
      rationale: 'May help if muscle spasm component present.',
      monitoringRequired: ['Sedation', 'Weakness']
    });
  }

  // Non-pharmacological recommendations
  const nonPharmacological = getApplicableNonPharmacological(assessment, patient);

  return {
    primaryRecommendations,
    adjunctRecommendations,
    contraindicatedClasses,
    nonPharmacological
  };
}

/**
 * Generate procedural pain plan
 */
export function generateProceduralPainPlan(
  procedureType: ProcedureType,
  procedureDescription: string,
  baselineAssessment: DressingPainAssessment,
  riskFlags: RiskFlag[],
  patient: PainPatientInfo
): ProceduralPainPlan {
  const contraindicatedClasses = getContraindicatedClasses(riskFlags);

  // Determine anticipated pain level based on procedure type
  let anticipatedPainLevel: PainSeverity = 'moderate';
  if (procedureType === 'burn_dressing' || procedureType === 'debridement' ||
      procedureType === 'chest_tube' || procedureType === 'bone_marrow_biopsy') {
    anticipatedPainLevel = 'severe';
  } else if (procedureType === 'drain_removal' || procedureType === 'catheter_insertion') {
    anticipatedPainLevel = 'mild';
  }

  // Pre-emptive analgesia recommendations
  const preEmptiveRecommendations: AnalgesicRecommendation[] = [];

  // Paracetamol pre-medication
  preEmptiveRecommendations.push({
    class: 'paracetamol',
    suitability: 'recommended',
    routes: ['oral', 'intravenous'],
    rationale: 'Pre-emptive non-opioid analgesia'
  });

  // Add opioid for moderate-severe anticipated pain
  if (anticipatedPainLevel === 'moderate' || anticipatedPainLevel === 'severe') {
    if (!contraindicatedClasses.includes('strong_opioid')) {
      preEmptiveRecommendations.push({
        class: anticipatedPainLevel === 'severe' ? 'strong_opioid' : 'weak_opioid',
        suitability: 'recommended',
        routes: ['oral', 'intravenous'],
        rationale: `Pre-emptive opioid for anticipated ${anticipatedPainLevel} procedural pain`
      });
    }
  }

  // Intra-procedural options
  const systemicOptions: AnalgesicRecommendation[] = [];

  if (anticipatedPainLevel === 'severe') {
    // Strong opioid for severe procedural pain
    if (!contraindicatedClasses.includes('strong_opioid')) {
      systemicOptions.push({
        class: 'strong_opioid',
        suitability: 'recommended',
        routes: ['intravenous'],
        rationale: 'IV opioid for severe procedural pain'
      });
    }

    // Ketamine option for refractory cases
    systemicOptions.push({
      class: 'ketamine',
      suitability: 'consider',
      routes: ['intravenous', 'intranasal'],
      rationale: 'Sub-dissociative ketamine for severe procedural pain'
    });

    // Nitrous oxide
    systemicOptions.push({
      class: 'nitrous_oxide',
      suitability: 'consider',
      routes: ['inhalation'],
      rationale: 'Inhaled analgesia for procedure-related anxiety and pain'
    });
  }

  // Timing based on route
  const preEmptiveTiming = '30-60 minutes pre-procedure (oral) or 15-30 minutes (IV)';

  // Topical anesthesia assessment
  const useTopical = procedureType === 'wound_dressing' ||
                     procedureType === 'burn_dressing' ||
                     procedureType === 'debridement' ||
                     procedureType === 'suturing' ||
                     procedureType === 'catheter_insertion';

  // Regional anesthesia assessment
  const considerRegional = procedureType === 'debridement' ||
                          procedureType === 'bone_marrow_biopsy' ||
                          procedureType === 'chest_tube' ||
                          procedureType === 'central_line' ||
                          procedureType === 'suturing';

  // Anxiolysis
  const anxiolysisRecommended = anticipatedPainLevel === 'severe' ||
                                procedureType === 'bone_marrow_biopsy' ||
                                procedureType === 'lumbar_puncture';

  // Monitoring during procedure
  const monitoringDuring: string[] = ['Pain score at regular intervals'];
  if (anticipatedPainLevel === 'severe' || systemicOptions.some(o => o.class === 'strong_opioid')) {
    monitoringDuring.push('Sedation level');
    monitoringDuring.push('Respiratory rate');
    monitoringDuring.push('Oxygen saturation');
  }
  if (systemicOptions.some(o => o.class === 'ketamine')) {
    monitoringDuring.push('Blood pressure');
    monitoringDuring.push('Emergence phenomena');
  }

  // Post-procedure follow-up
  const postProcedureFollow: string[] = [
    'Pain score 30 minutes post-procedure',
    'Assess for adequate analgesia',
    'Document analgesic effectiveness'
  ];
  if (anticipatedPainLevel === 'severe') {
    postProcedureFollow.push('Continue monitoring for 2-4 hours post-procedure');
    postProcedureFollow.push('PRN analgesia availability');
  }

  // Non-pharmacological measures
  const nonPharmacological = getApplicableNonPharmacological(baselineAssessment, patient);
  nonPharmacological.push('Explanation and preparation before procedure');
  nonPharmacological.push('Minimize procedure duration where possible');

  return {
    procedureType,
    procedureDescription,
    anticipatedPainLevel,
    preEmptiveAnalgesia: {
      required: true,
      timing: preEmptiveTiming,
      recommendations: preEmptiveRecommendations
    },
    intraProceduralAnalgesia: {
      topical: useTopical,
      topicalAgent: useTopical ? 'Lidocaine gel/EMLA cream applied 30-60 min before' : undefined,
      regional: considerRegional,
      regionalTechnique: considerRegional ? 'Local infiltration or regional block as appropriate' : undefined,
      systemic: anticipatedPainLevel !== 'mild',
      systemicOptions
    },
    anxiolysis: {
      recommended: anxiolysisRecommended,
      rationale: anxiolysisRecommended ? 'Procedure-related anxiety may exacerbate pain perception' : undefined
    },
    nonPharmacological,
    monitoringDuring,
    postProcedureFollow
  };
}

/**
 * Get applicable non-pharmacological interventions
 */
function getApplicableNonPharmacological(
  assessment: DressingPainAssessment,
  patient: PainPatientInfo
): string[] {
  const applicable: string[] = [];

  // Universal options
  applicable.push('Positioning and comfort measures');
  applicable.push('Relaxation and breathing exercises');

  // Age-specific
  if (patient.category === 'pediatric') {
    applicable.push('Distraction techniques');
    applicable.push('Play therapy (pediatric)');
    applicable.push('Parental presence (pediatric)');
  } else if (patient.category === 'neonate') {
    applicable.push('Sucrose solution (neonatal)');
    applicable.push('Swaddling (neonatal)');
    applicable.push('Skin-to-skin contact (neonatal)');
  } else {
    applicable.push('Distraction techniques');
    applicable.push('Music therapy');
    applicable.push('Guided imagery');
  }

  // Pain type specific
  if (assessment.painType === 'nociceptive' || assessment.painType === 'inflammatory') {
    if (assessment.painContext !== 'procedural') {
      applicable.push('Cold therapy / cryotherapy');
      applicable.push('Heat therapy');
    }
  }

  if (assessment.painType === 'neuropathic') {
    applicable.push('TENS (Transcutaneous Electrical Nerve Stimulation)');
  }

  return applicable;
}

/**
 * Get analgesic class display information
 */
export function getAnalgesicClassInfo(drugClass: AnalgesicClass) {
  const info: Record<AnalgesicClass, { displayName: string; category: string }> = {
    paracetamol: { displayName: 'Paracetamol (Acetaminophen)', category: 'Non-opioid' },
    nsaid_non_selective: { displayName: 'Non-selective NSAIDs', category: 'Non-opioid' },
    nsaid_cox2_selective: { displayName: 'COX-2 Selective NSAIDs', category: 'Non-opioid' },
    weak_opioid: { displayName: 'Weak Opioids', category: 'Opioid' },
    strong_opioid: { displayName: 'Strong Opioids', category: 'Opioid' },
    adjuvant_anticonvulsant: { displayName: 'Anticonvulsant Adjuvants', category: 'Adjuvant' },
    adjuvant_antidepressant: { displayName: 'Antidepressant Adjuvants', category: 'Adjuvant' },
    adjuvant_muscle_relaxant: { displayName: 'Muscle Relaxants', category: 'Adjuvant' },
    topical_analgesic: { displayName: 'Topical Analgesics', category: 'Topical' },
    topical_anesthetic: { displayName: 'Topical Anesthetics', category: 'Topical' },
    regional_anesthesia: { displayName: 'Regional Anesthesia', category: 'Interventional' },
    anxiolytic: { displayName: 'Anxiolytics', category: 'Adjuvant' },
    ketamine: { displayName: 'Ketamine', category: 'Dissociative' },
    nitrous_oxide: { displayName: 'Nitrous Oxide', category: 'Inhalation' }
  };
  return info[drugClass];
}

/**
 * Get suitability badge styling
 */
export function getSuitabilityBadge(suitability: AnalgesicRecommendation['suitability']): {
  bg: string;
  text: string;
  border: string;
} {
  switch (suitability) {
    case 'recommended':
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
    case 'consider':
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' };
    case 'caution':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 'avoid':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
    case 'contraindicated':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
  }
}

/**
 * Generate simple analgesia guidance based on pain score (for quick assessment)
 */
export function getSimpleAnalgesiaGuidance(painScore: number, proceduralPainAnticipated: boolean): string {
  if (painScore === 0 && !proceduralPainAnticipated) {
    return 'No analgesia required. Monitor for changes during procedure.';
  }

  if (painScore <= 3) {
    return 'Consider oral paracetamol 1g 30 minutes before dressing change if procedural pain anticipated.';
  }

  if (painScore <= 6) {
    return 'Recommend oral analgesics 30-60 minutes before procedure. Consider tramadol 50-100mg or paracetamol/codeine combination. Apply topical anesthetic if wound bed is sensitive.';
  }

  return 'Strong analgesia recommended. Consider opioid analgesics with medical supervision. May require procedural sedation for complex wounds. Consult pain management team if chronic.';
}

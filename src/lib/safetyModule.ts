/**
 * AstroWound-MEASURE Safety & Monitoring Module
 * Monitoring plans, red flags, and safety alerts
 */

import type {
  MonitoringPlan,
  RedFlag,
  DressingPainAssessment,
  AnalgesicRecommendation,
  RiskFlag,
  PainPatientInfo,
  ComorbidityEntry,
} from '@/types';

/**
 * Generate comprehensive monitoring plan based on analgesic recommendations and patient factors
 */
export function generateMonitoringPlan(
  recommendations: AnalgesicRecommendation[],
  _riskFlags: RiskFlag[],
  patient: PainPatientInfo,
  comorbidities: ComorbidityEntry[]
): MonitoringPlan {
  const hasOpioids = recommendations.some(r =>
    r.class === 'weak_opioid' || r.class === 'strong_opioid'
  );
  const hasStrongOpioids = recommendations.some(r => r.class === 'strong_opioid');
  const hasNSAIDs = recommendations.some(r =>
    r.class === 'nsaid_non_selective' || r.class === 'nsaid_cox2_selective'
  );
  const hasKetamine = recommendations.some(r => r.class === 'ketamine');
  const hasAnxiolytics = recommendations.some(r => r.class === 'anxiolytic');

  // Check for high-risk conditions
  const hasRenalRisk = comorbidities.some(c => c.condition.startsWith('ckd_'));
  const hasRespiratoryRisk = comorbidities.some(c =>
    c.condition === 'copd' || c.condition === 'respiratory_depression_risk'
  );
  const hasCardiovascularRisk = comorbidities.some(c =>
    c.condition === 'heart_failure' || c.condition === 'ischemic_heart_disease'
  );
  const hasGIRisk = comorbidities.some(c =>
    c.condition === 'peptic_ulcer' || c.condition === 'gi_bleed_history'
  );
  const isElderly = patient.category === 'elderly' || patient.age >= 65;

  // Sedation monitoring
  const sedationMonitoring = {
    required: hasOpioids || hasAnxiolytics || hasKetamine,
    frequency: hasStrongOpioids || hasKetamine ?
      'Every 1 hour for first 4 hours, then every 2-4 hours' :
      'Every 4 hours',
    scale: 'Pasero Opioid-Induced Sedation Scale (POSS) or equivalent'
  };

  // Respiratory monitoring
  const respiratoryMonitoring = {
    required: hasOpioids || hasKetamine || hasRespiratoryRisk,
    frequency: hasStrongOpioids || hasRespiratoryRisk ?
      'Every 1-2 hours initially, then every 4 hours' :
      'Every 4 hours',
    parameters: [
      'Respiratory rate',
      'Oxygen saturation (SpO2)',
      hasStrongOpioids ? 'End-tidal CO2 if available' : null
    ].filter(Boolean) as string[]
  };

  // Cardiovascular monitoring
  const cardiovascularMonitoring = {
    required: hasNSAIDs || hasCardiovascularRisk || hasKetamine,
    frequency: 'Every 4-6 hours or as per unit protocol',
    parameters: [
      'Blood pressure',
      'Heart rate',
      hasKetamine ? 'Continuous during ketamine administration' : null
    ].filter(Boolean) as string[]
  };

  // Renal monitoring
  const renalMonitoring = {
    required: hasNSAIDs || hasRenalRisk,
    frequency: hasRenalRisk ? 'Daily during acute phase' : 'Every 2-3 days if prolonged NSAID use',
    tests: [
      'Serum creatinine',
      'eGFR',
      'Urine output if indicated'
    ]
  };

  // GI protection
  const giProtection = {
    required: hasNSAIDs || hasGIRisk,
    recommendations: [] as string[]
  };

  if (hasNSAIDs) {
    giProtection.recommendations.push('Consider PPI co-prescription');
    giProtection.recommendations.push('Monitor for GI symptoms (dyspepsia, abdominal pain, bleeding)');
  }
  if (hasOpioids) {
    giProtection.recommendations.push('Prescribe laxative prophylaxis with opioids');
    giProtection.recommendations.push('Antiemetic PRN for opioid-induced nausea');
  }

  // Other monitoring
  const otherMonitoring: string[] = [];

  if (hasOpioids) {
    otherMonitoring.push('Pain score assessment at regular intervals');
    otherMonitoring.push('Assess for opioid side effects (nausea, constipation, pruritus)');
  }

  if (hasStrongOpioids && isElderly) {
    otherMonitoring.push('Increased frequency of cognitive assessment');
    otherMonitoring.push('Falls risk assessment');
  }

  if (hasKetamine) {
    otherMonitoring.push('Monitor for emergence phenomena (vivid dreams, hallucinations)');
    otherMonitoring.push('Assess for nystagmus');
  }

  if (recommendations.some(r => r.class === 'adjuvant_anticonvulsant')) {
    otherMonitoring.push('Monitor for dizziness and sedation');
    otherMonitoring.push('Assess for peripheral edema');
  }

  return {
    sedationMonitoring,
    respiratoryMonitoring,
    cardiovascularMonitoring,
    renalMonitoring,
    giProtection,
    otherMonitoring
  };
}

/**
 * Generate red flags based on clinical context
 */
export function generateRedFlags(
  assessment: DressingPainAssessment,
  recommendations: AnalgesicRecommendation[],
  riskFlags: RiskFlag[],
  patient: PainPatientInfo
): RedFlag[] {
  const redFlags: RedFlag[] = [];

  // Pain-related red flags
  if (assessment.severity === 'severe') {
    redFlags.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      title: 'Severe Pain',
      description: 'Patient has severe pain requiring prompt and effective analgesia',
      action: 'Ensure adequate analgesia is administered promptly. Reassess frequently.'
    });
  }

  // Escalating pain flag
  redFlags.push({
    id: crypto.randomUUID(),
    severity: 'critical',
    title: 'Escalating Pain Despite Treatment',
    description: 'If pain escalates despite analgesic treatment, this may indicate treatment failure or underlying pathology',
    action: 'Reassess for underlying cause. Consider dose adjustment, alternative agents, or specialist review.'
  });

  // Opioid-related red flags
  const hasOpioids = recommendations.some(r =>
    r.class === 'weak_opioid' || r.class === 'strong_opioid'
  );

  if (hasOpioids) {
    redFlags.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      title: 'Opioid Toxicity Signs',
      description: 'Monitor for respiratory depression (RR <8), excessive sedation (unable to rouse), pinpoint pupils',
      action: 'STOP opioid. Administer naloxone if respiratory depression. Call for urgent medical review.'
    });

    if (patient.category === 'elderly' || patient.age >= 65) {
      redFlags.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        title: 'Elderly Opioid Sensitivity',
        description: 'Elderly patients have increased sensitivity to opioids',
        action: 'Start with lower doses. Monitor closely for sedation and confusion.'
      });
    }
  }

  // NSAID-related red flags
  const hasNSAIDs = recommendations.some(r =>
    r.class === 'nsaid_non_selective' || r.class === 'nsaid_cox2_selective'
  );

  if (hasNSAIDs) {
    redFlags.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      title: 'NSAID Adverse Effects',
      description: 'Monitor for GI bleeding (black stools, coffee-ground vomit), AKI (reduced urine output, rising creatinine), cardiovascular events',
      action: 'Stop NSAID if adverse effects occur. Review renal function and GI symptoms regularly.'
    });
  }

  // Procedural pain red flag
  if (assessment.painContext === 'procedural') {
    redFlags.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      title: 'Inadequate Procedural Analgesia',
      description: 'Inadequate analgesia during procedures causes significant distress and may prevent procedure completion',
      action: 'Ensure pre-emptive analgesia is given with adequate lead time. Have rescue analgesia available. Consider procedure postponement if pain uncontrolled.'
    });
  }

  // High-risk comorbidity flags
  const contraindicatedFlags = riskFlags.filter(f => f.level === 'contraindicated');
  if (contraindicatedFlags.length > 0) {
    redFlags.push({
      id: crypto.randomUUID(),
      severity: 'critical',
      title: 'Contraindicated Drug Classes Identified',
      description: `Patient has contraindications to: ${contraindicatedFlags.map(f => f.message).join('; ')}`,
      action: 'Ensure contraindicated drug classes are NOT prescribed. Document contraindications clearly.'
    });
  }

  return redFlags;
}

/**
 * Sedation assessment scales
 */
export const SEDATION_SCALES = {
  POSS: {
    name: 'Pasero Opioid-Induced Sedation Scale',
    levels: [
      { score: 'S', description: 'Sleep, easy to arouse', action: 'Acceptable; no action required' },
      { score: '1', description: 'Awake and alert', action: 'Acceptable; no action required' },
      { score: '2', description: 'Slightly drowsy, easily aroused', action: 'Acceptable; may need to decrease opioid dose' },
      { score: '3', description: 'Frequently drowsy, arousable, drifts off during conversation', action: 'Unacceptable; decrease opioid dose' },
      { score: '4', description: 'Somnolent, minimal or no response to verbal/physical stimulation', action: 'Unacceptable; STOP opioid, consider naloxone' }
    ]
  },
  RASS: {
    name: 'Richmond Agitation-Sedation Scale',
    levels: [
      { score: '+4', description: 'Combative', action: 'Overtly combative, violent' },
      { score: '+3', description: 'Very agitated', action: 'Pulls or removes tubes/catheters' },
      { score: '+2', description: 'Agitated', action: 'Frequent non-purposeful movement' },
      { score: '+1', description: 'Restless', action: 'Anxious but movements not aggressive' },
      { score: '0', description: 'Alert and calm', action: 'Target for most patients' },
      { score: '-1', description: 'Drowsy', action: 'Not fully alert but sustained awakening' },
      { score: '-2', description: 'Light sedation', action: 'Briefly awakens with eye contact' },
      { score: '-3', description: 'Moderate sedation', action: 'Movement or eye opening to voice' },
      { score: '-4', description: 'Deep sedation', action: 'No response to voice, movement to physical stimulation' },
      { score: '-5', description: 'Unarousable', action: 'No response to voice or physical stimulation' }
    ]
  }
};

/**
 * Get severity badge for red flags
 */
export function getRedFlagBadge(severity: RedFlag['severity']): {
  bg: string;
  text: string;
  border: string;
} {
  switch (severity) {
    case 'warning':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 'critical':
      return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
  }
}

/**
 * Check if monitoring frequency should be increased
 */
export function shouldIncreaseMonitoring(
  assessment: DressingPainAssessment,
  riskFlags: RiskFlag[],
  patient: PainPatientInfo
): boolean {
  // Increase monitoring for severe pain
  if (assessment.severity === 'severe') return true;

  // Increase for elderly patients on opioids
  if (patient.category === 'elderly') return true;

  // Increase for patients with respiratory risk
  if (riskFlags.some(f => f.category === 'Respiratory')) return true;

  // Increase for patients with multiple high-level flags
  const highLevelFlags = riskFlags.filter(f =>
    f.level === 'warning' || f.level === 'contraindicated'
  );
  if (highLevelFlags.length >= 2) return true;

  return false;
}

/**
 * Generate wound dressing specific safety checks
 */
export function generateDressingSafetyChecks(
  woundPhase: string,
  painScore: number
): string[] {
  const checks: string[] = [
    'Verify patient identity and wound location',
    'Check for known allergies to dressing materials',
    'Assess wound for signs of infection before proceeding'
  ];

  if (painScore >= 5) {
    checks.push('Ensure adequate analgesia has been administered');
    checks.push('Allow sufficient time for analgesia to take effect');
  }

  if (woundPhase === 'extension') {
    checks.push('Consider additional infection control measures');
    checks.push('Document any concerning wound changes for review');
  }

  return checks;
}

/**
 * Generate post-dressing monitoring points
 */
export function generatePostDressingMonitoring(
  painScore: number,
  hasOpioids: boolean
): string[] {
  const monitoring: string[] = [
    'Reassess pain 30-60 minutes post-procedure',
    'Check dressing security and comfort',
    'Document procedure completion and patient response'
  ];

  if (hasOpioids) {
    monitoring.push('Monitor sedation level for 2-4 hours post-opioid');
    monitoring.push('Ensure patient is safe to mobilize/discharge');
  }

  if (painScore >= 7) {
    monitoring.push('Schedule follow-up pain assessment within 24 hours');
    monitoring.push('Provide clear escalation instructions to patient/carer');
  }

  return monitoring;
}

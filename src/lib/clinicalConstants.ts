/**
 * AstroWound-MEASURE Clinical Constants and Reference Data
 * Pain Management, Wound Dressing Protocol, and Clinical Decision Support
 */

import type {
  PainScaleType,
  Comorbidity,
  AnalgesicClass,
  ProcedureType,
  RiskLevel,
  WoundPhase,
} from '@/types';

// ============================================
// Pain Scale Definitions
// ============================================

export const PAIN_SCALES: Record<PainScaleType, {
  name: string;
  description: string;
  patientCategory: string[];
  maxScore: number;
  instructions: string;
}> = {
  NRS: {
    name: 'Numeric Rating Scale',
    description: 'Patient rates pain from 0 (no pain) to 10 (worst pain imaginable)',
    patientCategory: ['adult', 'elderly'],
    maxScore: 10,
    instructions: 'Ask the patient: "On a scale of 0 to 10, where 0 is no pain and 10 is the worst pain imaginable, what is your current pain level?"'
  },
  VAS: {
    name: 'Visual Analogue Scale',
    description: '100mm line with anchors at each end',
    patientCategory: ['adult', 'elderly'],
    maxScore: 100,
    instructions: 'Ask the patient to mark a point on the line that represents their current pain intensity.'
  },
  FLACC: {
    name: 'FLACC Scale',
    description: 'Face, Legs, Activity, Cry, Consolability - for children 2 months to 7 years',
    patientCategory: ['pediatric', 'neonate'],
    maxScore: 10,
    instructions: 'Observe the child for 1-5 minutes and score each category 0-2.'
  },
  WONG_BAKER: {
    name: 'Wong-Baker FACES Pain Scale',
    description: 'Six faces showing different levels of pain - for children 3+ years',
    patientCategory: ['pediatric'],
    maxScore: 10,
    instructions: 'Show the faces to the child and ask them to point to the face that shows how much they hurt.'
  },
  BPS: {
    name: 'Behavioral Pain Scale',
    description: 'For sedated/mechanically ventilated patients',
    patientCategory: ['adult', 'elderly'],
    maxScore: 12,
    instructions: 'Observe facial expression, upper limb movements, and compliance with ventilation.'
  },
  CPOT: {
    name: 'Critical-Care Pain Observation Tool',
    description: 'For non-communicative ICU patients',
    patientCategory: ['adult', 'elderly'],
    maxScore: 8,
    instructions: 'Assess facial expression, body movements, muscle tension, and ventilator compliance or vocalization.'
  }
};

// ============================================
// Pain Characteristics
// ============================================

export const PAIN_CHARACTERISTICS = [
  'Sharp', 'Dull', 'Burning', 'Throbbing', 'Aching',
  'Stabbing', 'Constant', 'Intermittent', 'Radiating',
  'Cramping', 'Shooting', 'Tingling', 'Numbness', 'Pressure'
];

// ============================================
// Comorbidity Definitions
// ============================================

export const COMORBIDITY_INFO: Record<Comorbidity, {
  displayName: string;
  category: string;
  description: string;
}> = {
  peptic_ulcer: {
    displayName: 'Peptic Ulcer Disease',
    category: 'Gastrointestinal',
    description: 'Active or history of gastric/duodenal ulcer'
  },
  ckd_stage_1: {
    displayName: 'CKD Stage 1',
    category: 'Renal',
    description: 'eGFR ≥90 with kidney damage'
  },
  ckd_stage_2: {
    displayName: 'CKD Stage 2',
    category: 'Renal',
    description: 'eGFR 60-89'
  },
  ckd_stage_3a: {
    displayName: 'CKD Stage 3a',
    category: 'Renal',
    description: 'eGFR 45-59'
  },
  ckd_stage_3b: {
    displayName: 'CKD Stage 3b',
    category: 'Renal',
    description: 'eGFR 30-44'
  },
  ckd_stage_4: {
    displayName: 'CKD Stage 4',
    category: 'Renal',
    description: 'eGFR 15-29'
  },
  ckd_stage_5: {
    displayName: 'CKD Stage 5',
    category: 'Renal',
    description: 'eGFR <15 or dialysis'
  },
  liver_disease_mild: {
    displayName: 'Liver Disease (Mild)',
    category: 'Hepatic',
    description: 'Child-Pugh A or mild hepatic impairment'
  },
  liver_disease_moderate: {
    displayName: 'Liver Disease (Moderate)',
    category: 'Hepatic',
    description: 'Child-Pugh B or moderate hepatic impairment'
  },
  liver_disease_severe: {
    displayName: 'Liver Disease (Severe)',
    category: 'Hepatic',
    description: 'Child-Pugh C or severe hepatic impairment'
  },
  heart_failure: {
    displayName: 'Heart Failure',
    category: 'Cardiovascular',
    description: 'Diagnosed heart failure (any class)'
  },
  ischemic_heart_disease: {
    displayName: 'Ischemic Heart Disease',
    category: 'Cardiovascular',
    description: 'Coronary artery disease, previous MI, angina'
  },
  hypertension: {
    displayName: 'Hypertension',
    category: 'Cardiovascular',
    description: 'Diagnosed hypertension'
  },
  diabetes: {
    displayName: 'Diabetes Mellitus',
    category: 'Metabolic',
    description: 'Type 1 or Type 2 diabetes'
  },
  asthma: {
    displayName: 'Asthma',
    category: 'Respiratory',
    description: 'Diagnosed asthma'
  },
  copd: {
    displayName: 'COPD',
    category: 'Respiratory',
    description: 'Chronic obstructive pulmonary disease'
  },
  pregnancy: {
    displayName: 'Pregnancy',
    category: 'Special Population',
    description: 'Currently pregnant'
  },
  lactation: {
    displayName: 'Lactation',
    category: 'Special Population',
    description: 'Currently breastfeeding'
  },
  opioid_tolerance: {
    displayName: 'Opioid Tolerance',
    category: 'Pain History',
    description: 'Currently on regular opioid therapy'
  },
  opioid_dependence: {
    displayName: 'Opioid Dependence',
    category: 'Pain History',
    description: 'History of opioid use disorder'
  },
  gi_bleed_history: {
    displayName: 'GI Bleed History',
    category: 'Gastrointestinal',
    description: 'Previous gastrointestinal bleeding'
  },
  coagulopathy: {
    displayName: 'Coagulopathy',
    category: 'Hematologic',
    description: 'Bleeding disorder or on anticoagulation'
  },
  seizure_disorder: {
    displayName: 'Seizure Disorder',
    category: 'Neurological',
    description: 'Epilepsy or seizure history'
  },
  mental_health_disorder: {
    displayName: 'Mental Health Disorder',
    category: 'Psychiatric',
    description: 'Depression, anxiety, or other mental health condition'
  },
  respiratory_depression_risk: {
    displayName: 'Respiratory Depression Risk',
    category: 'Respiratory',
    description: 'OSA, obesity hypoventilation, or neuromuscular disease'
  }
};

// ============================================
// Analgesic Class Information
// ============================================

export const ANALGESIC_CLASSES: Record<AnalgesicClass, {
  displayName: string;
  category: string;
  description: string;
  examples: string[];
  commonRoutes: string[];
}> = {
  paracetamol: {
    displayName: 'Paracetamol (Acetaminophen)',
    category: 'Non-opioid Analgesic',
    description: 'First-line analgesic for mild to moderate pain',
    examples: ['Paracetamol', 'Acetaminophen'],
    commonRoutes: ['oral', 'intravenous', 'rectal']
  },
  nsaid_non_selective: {
    displayName: 'Non-selective NSAIDs',
    category: 'Non-opioid Analgesic',
    description: 'Anti-inflammatory analgesics - non-selective COX inhibitors',
    examples: ['Ibuprofen', 'Naproxen', 'Diclofenac', 'Ketorolac'],
    commonRoutes: ['oral', 'intravenous', 'intramuscular', 'topical']
  },
  nsaid_cox2_selective: {
    displayName: 'COX-2 Selective NSAIDs',
    category: 'Non-opioid Analgesic',
    description: 'Selective COX-2 inhibitors with reduced GI risk',
    examples: ['Celecoxib', 'Etoricoxib'],
    commonRoutes: ['oral']
  },
  weak_opioid: {
    displayName: 'Weak Opioids',
    category: 'Opioid Analgesic',
    description: 'Step 2 WHO ladder opioids for moderate pain',
    examples: ['Tramadol', 'Codeine'],
    commonRoutes: ['oral', 'intravenous']
  },
  strong_opioid: {
    displayName: 'Strong Opioids',
    category: 'Opioid Analgesic',
    description: 'Step 3 WHO ladder opioids for severe pain',
    examples: ['Morphine', 'Oxycodone', 'Fentanyl', 'Hydromorphone'],
    commonRoutes: ['oral', 'intravenous', 'subcutaneous', 'transdermal']
  },
  adjuvant_anticonvulsant: {
    displayName: 'Anticonvulsant Adjuvants',
    category: 'Adjuvant Analgesic',
    description: 'For neuropathic pain',
    examples: ['Gabapentin', 'Pregabalin', 'Carbamazepine'],
    commonRoutes: ['oral']
  },
  adjuvant_antidepressant: {
    displayName: 'Antidepressant Adjuvants',
    category: 'Adjuvant Analgesic',
    description: 'TCAs and SNRIs for neuropathic pain',
    examples: ['Amitriptyline', 'Duloxetine', 'Nortriptyline'],
    commonRoutes: ['oral']
  },
  adjuvant_muscle_relaxant: {
    displayName: 'Muscle Relaxants',
    category: 'Adjuvant Analgesic',
    description: 'For musculoskeletal pain with spasm',
    examples: ['Baclofen', 'Tizanidine', 'Cyclobenzaprine'],
    commonRoutes: ['oral']
  },
  topical_analgesic: {
    displayName: 'Topical Analgesics',
    category: 'Topical',
    description: 'Local application for superficial pain',
    examples: ['Topical NSAIDs', 'Capsaicin', 'Menthol'],
    commonRoutes: ['topical']
  },
  topical_anesthetic: {
    displayName: 'Topical Anesthetics',
    category: 'Topical',
    description: 'Local anesthetic for procedural pain',
    examples: ['Lidocaine gel', 'EMLA cream', 'Lidocaine patches'],
    commonRoutes: ['topical']
  },
  regional_anesthesia: {
    displayName: 'Regional Anesthesia',
    category: 'Interventional',
    description: 'Nerve blocks and regional techniques',
    examples: ['Local infiltration', 'Nerve block', 'Epidural'],
    commonRoutes: ['regional']
  },
  anxiolytic: {
    displayName: 'Anxiolytics',
    category: 'Adjuvant',
    description: 'For procedural anxiety and muscle relaxation',
    examples: ['Midazolam', 'Lorazepam'],
    commonRoutes: ['oral', 'intravenous', 'intranasal']
  },
  ketamine: {
    displayName: 'Ketamine',
    category: 'Dissociative Analgesic',
    description: 'For procedural sedation and refractory pain',
    examples: ['Ketamine'],
    commonRoutes: ['intravenous', 'intramuscular', 'intranasal']
  },
  nitrous_oxide: {
    displayName: 'Nitrous Oxide',
    category: 'Inhalation Analgesic',
    description: 'Inhaled analgesic for procedural pain',
    examples: ['Entonox (50% N2O/50% O2)'],
    commonRoutes: ['inhalation']
  }
};

// ============================================
// Procedure Types
// ============================================

export const PROCEDURE_TYPES: Record<ProcedureType, {
  name: string;
  displayName: string;
  category: string;
  typicalPainLevel: string;
  typicalDuration: string;
}> = {
  wound_dressing: {
    name: 'Wound Dressing Change',
    displayName: 'Wound Dressing Change',
    category: 'Wound Care',
    typicalPainLevel: 'moderate',
    typicalDuration: '15-30 minutes'
  },
  burn_dressing: {
    name: 'Burn Dressing Change',
    displayName: 'Burn Dressing Change',
    category: 'Burn Care',
    typicalPainLevel: 'severe',
    typicalDuration: '30-60 minutes'
  },
  debridement: {
    name: 'Wound Debridement',
    displayName: 'Wound Debridement',
    category: 'Wound Care',
    typicalPainLevel: 'severe',
    typicalDuration: '30-90 minutes'
  },
  suturing: {
    name: 'Suturing / Wound Closure',
    displayName: 'Suturing / Wound Closure',
    category: 'Minor Procedure',
    typicalPainLevel: 'moderate',
    typicalDuration: '15-45 minutes'
  },
  drain_removal: {
    name: 'Drain Removal',
    displayName: 'Drain Removal',
    category: 'Post-operative',
    typicalPainLevel: 'mild',
    typicalDuration: '5-10 minutes'
  },
  catheter_insertion: {
    name: 'Catheter Insertion',
    displayName: 'Catheter Insertion',
    category: 'Minor Procedure',
    typicalPainLevel: 'moderate',
    typicalDuration: '5-15 minutes'
  },
  lumbar_puncture: {
    name: 'Lumbar Puncture',
    displayName: 'Lumbar Puncture',
    category: 'Invasive Procedure',
    typicalPainLevel: 'moderate',
    typicalDuration: '15-30 minutes'
  },
  bone_marrow_biopsy: {
    name: 'Bone Marrow Biopsy',
    displayName: 'Bone Marrow Biopsy',
    category: 'Invasive Procedure',
    typicalPainLevel: 'severe',
    typicalDuration: '30-45 minutes'
  },
  chest_tube: {
    name: 'Chest Tube Insertion/Removal',
    displayName: 'Chest Tube Insertion/Removal',
    category: 'Invasive Procedure',
    typicalPainLevel: 'severe',
    typicalDuration: '15-30 minutes'
  },
  central_line: {
    name: 'Central Line Insertion',
    displayName: 'Central Line Insertion',
    category: 'Invasive Procedure',
    typicalPainLevel: 'moderate',
    typicalDuration: '30-60 minutes'
  },
  other: {
    name: 'Other Procedure',
    displayName: 'Other Procedure',
    category: 'Other',
    typicalPainLevel: 'moderate',
    typicalDuration: 'Variable'
  }
};

// ============================================
// Risk Level Configuration
// ============================================

export const RISK_LEVEL_CONFIG: Record<RiskLevel, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
}> = {
  info: {
    label: 'Information',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: 'ℹ️'
  },
  caution: {
    label: 'Caution',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: '⚠️'
  },
  warning: {
    label: 'Warning',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    icon: '⚠️'
  },
  contraindicated: {
    label: 'Contraindicated',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: '❌'
  }
};

// ============================================
// Wound Phase Configuration
// ============================================

export const WOUND_PHASE_CONFIG: Record<WoundPhase, {
  name: string;
  displayName: string;
  description: string;
  characteristics: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  extension: {
    name: 'Extension Phase',
    displayName: 'Extension',
    description: 'Wound is extending or deteriorating. High exudate, necrotic tissue present.',
    characteristics: [
      'High exudate levels',
      'Necrotic tissue present',
      'Slough present',
      'Wound edges undermining',
      'Signs of infection possible'
    ],
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  transition: {
    name: 'Transition Phase',
    displayName: 'Transition',
    description: 'Wound is transitioning to healing. Mixed tissue types, moderate exudate.',
    characteristics: [
      'Moderate exudate levels',
      'Mixed tissue types',
      'Some granulation tissue appearing',
      'Wound bed cleaning',
      'Inflammation reducing'
    ],
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  repair: {
    name: 'Repair Phase',
    displayName: 'Repair',
    description: 'Wound is actively healing. Granulation tissue, epithelialization occurring.',
    characteristics: [
      'Low exudate levels',
      'Healthy granulation tissue',
      'Epithelialization at wound edges',
      'Wound contracting',
      'No signs of infection'
    ],
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
};

// ============================================
// Dressing Materials by Phase
// ============================================

export const PHASE_MATERIALS: Record<WoundPhase, {
  primary: string[];
  secondary: string[];
  absorbent: string[];
  fixation: string[];
  optional: string[];
}> = {
  extension: {
    primary: [
      'Hydrogel sheets or amorphous gel',
      'Alginate dressings',
      'Hydrofiber dressings',
      'Antimicrobial dressings (silver/iodine)'
    ],
    secondary: [
      'Foam dressings',
      'Super absorbent polymer dressings'
    ],
    absorbent: [
      'Gauze padding',
      'Combine dressings'
    ],
    fixation: [
      'Conformable bandage',
      'Tape (hypoallergenic)',
      'Tubular bandage'
    ],
    optional: [
      'Negative pressure wound therapy',
      'Enzymatic debriding agents'
    ]
  },
  transition: {
    primary: [
      'Hydrocolloid dressings',
      'Foam dressings',
      'Alginate dressings'
    ],
    secondary: [
      'Non-adherent dressings',
      'Silicone contact layers'
    ],
    absorbent: [
      'Light absorbent padding'
    ],
    fixation: [
      'Conformable bandage',
      'Retention sheets',
      'Tape'
    ],
    optional: [
      'Honey-based dressings',
      'Growth factor dressings'
    ]
  },
  repair: {
    primary: [
      'Silicone foam dressings',
      'Thin hydrocolloid',
      'Non-adherent mesh'
    ],
    secondary: [
      'Film dressings',
      'Light foam dressings'
    ],
    absorbent: [
      'Minimal absorbent layer if needed'
    ],
    fixation: [
      'Light tape',
      'Retention film',
      'Tubular bandage'
    ],
    optional: [
      'Silicone gel sheeting (for scarring)',
      'Compression therapy (for venous wounds)'
    ]
  }
};

// ============================================
// Non-Pharmacological Interventions
// ============================================

export const NON_PHARMACOLOGICAL_OPTIONS = [
  'Positioning and comfort measures',
  'Distraction techniques',
  'Relaxation and breathing exercises',
  'Music therapy',
  'Cold therapy / cryotherapy',
  'Heat therapy',
  'TENS (Transcutaneous Electrical Nerve Stimulation)',
  'Massage therapy',
  'Guided imagery',
  'Virtual reality distraction',
  'Play therapy (pediatric)',
  'Parental presence (pediatric)',
  'Sucrose solution (neonatal)',
  'Swaddling (neonatal)',
  'Skin-to-skin contact (neonatal)'
];

// ============================================
// Sterile Field Checklist Items
// ============================================

export const STERILE_FIELD_ITEMS = [
  {
    id: 'cleanWorkingSurface',
    label: 'Clean Working Surface',
    description: 'Ensure dressing trolley/surface is cleaned and decontaminated',
    required: true
  },
  {
    id: 'handHygienePerformed',
    label: 'Hand Hygiene Performed',
    description: 'Perform hand hygiene using alcohol-based hand rub or soap and water',
    required: true
  },
  {
    id: 'sterileGloves',
    label: 'Sterile Gloves Available',
    description: 'Appropriate size sterile gloves ready for use',
    required: true
  },
  {
    id: 'dressingTrolleyPrepared',
    label: 'Dressing Trolley Prepared',
    description: 'All required materials organized on trolley/surface',
    required: true
  },
  {
    id: 'wasteDisposalBagAvailable',
    label: 'Waste Disposal Available',
    description: 'Clinical waste bag positioned for easy disposal',
    required: true
  },
  {
    id: 'adequateLightingEnsured',
    label: 'Adequate Lighting',
    description: 'Ensure sufficient lighting to clearly see wound',
    required: true
  }
];

// ============================================
// Legal Disclaimer
// ============================================

export const LEGAL_DISCLAIMER = `
CLINICAL DECISION SUPPORT TOOL - DISCLAIMER

This document is generated by AstroWound-MEASURE, a clinical decision-support and planning tool.
It is NOT a prescription and does NOT replace clinical judgment.

• All analgesic recommendations are class-based suggestions only
• Final prescribing decisions must be made by qualified clinicians
• Individual patient factors may require deviation from suggestions
• This tool does not account for all possible drug interactions
• Medication doses and routes must be verified independently
• Local protocols and formulary should take precedence
• Wound phase classification should be verified by clinician

The healthcare provider is solely responsible for treatment decisions.
This document is for clinical planning and documentation purposes only.

Generated by AstroWound-MEASURE - Clinical Wound Assessment & Pain Management System
`;

// ============================================
// Infection Signs to Watch
// ============================================

export const INFECTION_SIGNS = [
  'Increased pain or tenderness',
  'Increased warmth around wound',
  'Spreading redness (cellulitis)',
  'Purulent discharge',
  'Malodorous exudate',
  'Fever or systemic symptoms',
  'Delayed healing or wound deterioration',
  'New necrotic tissue'
];

// ============================================
// Escalation Criteria
// ============================================

export const ESCALATION_CRITERIA = [
  'Wound deterioration despite appropriate care',
  'Signs of spreading infection',
  'Uncontrolled pain',
  'Excessive bleeding',
  'Exposure of underlying structures',
  'Patient non-compliance with care plan',
  'No improvement after 2-4 weeks of appropriate treatment'
];

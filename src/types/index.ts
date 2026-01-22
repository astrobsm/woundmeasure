/**
 * AstroWound-MEASURE Type Definitions
 * Clinical Wound Assessment System
 */

// ============================================
// Patient Types
// ============================================

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Wound Types
// ============================================

export type WoundType = 
  | 'pressure_ulcer'
  | 'diabetic_ulcer'
  | 'venous_ulcer'
  | 'arterial_ulcer'
  | 'surgical_wound'
  | 'traumatic_wound'
  | 'burn'
  | 'other';

export type WoundLocation =
  | 'sacrum'
  | 'heel'
  | 'ankle'
  | 'leg'
  | 'foot'
  | 'arm'
  | 'hand'
  | 'back'
  | 'abdomen'
  | 'chest'
  | 'head'
  | 'other';

export type TissueType = 
  | 'epithelial'
  | 'granulation'
  | 'slough'
  | 'necrotic'
  | 'eschar';

export interface Wound {
  id: string;
  patientId: string;
  type: WoundType;
  location: WoundLocation;
  locationDetail?: string;
  onset: Date;
  etiology?: string;
  notes?: string;
  status: 'active' | 'healing' | 'healed' | 'worsening';
  assessments: WoundAssessment[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Measurement Types
// ============================================

export interface WoundMeasurement {
  area: number;           // cm²
  length: number;         // cm (longest axis)
  width: number;          // cm (perpendicular to length)
  perimeter: number;      // cm
  depth?: number;         // cm (manual entry)
  volume?: number;        // cm³ (calculated if depth provided)
}

export interface CalibrationData {
  detected: boolean;
  pixelsPerCm: number;
  confidence: number;
  markerType: 'ruler' | 'circle' | 'qr' | 'grid';
  referencePoints: Point[];
  homographyMatrix?: number[][];
}

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentationResult {
  mask: ImageData;
  contour: Point[];
  contourPoints?: Point[]; // Alias for contour
  boundingBox: BoundingBox;
  confidence: number;
  area?: number;
  tissueBreakdown?: TissueAnalysis;
}

export interface TissueAnalysis {
  epithelial: number;     // percentage
  granulation: number;    // percentage
  slough: number;         // percentage
  necrotic: number;       // percentage
}

// ============================================
// Assessment Types
// ============================================

export interface QualityCheck {
  passed: boolean;
  blur: {
    score: number;
    passed: boolean;
  };
  lighting: {
    score: number;
    passed: boolean;
    issues: string[];
  };
  calibration: {
    detected: boolean;
    confidence: number;
  };
  perspective: {
    distortion: number;
    corrected: boolean;
  };
}

export interface WoundAssessment {
  id: string;
  woundId: string;
  capturedAt: Date;
  capturedBy: string;
  deviceInfo: DeviceInfo;
  
  // Original image
  originalImage: string;   // base64 or blob URL
  
  // Processed data
  processedImage?: string;
  segmentationResult: SegmentationResult;
  calibrationData: CalibrationData;
  measurement: WoundMeasurement;
  qualityCheck: QualityCheck;
  
  // Clinical observations
  tissueTypes?: Record<TissueType, number>;
  exudate?: {
    amount: 'none' | 'light' | 'moderate' | 'heavy';
    type: 'serous' | 'sanguineous' | 'serosanguineous' | 'purulent';
  };
  odor?: 'none' | 'mild' | 'moderate' | 'strong';
  periWoundCondition?: string[];
  pain?: number; // 0-10 scale
  
  // Clinical notes
  notes?: string;
  clinicianVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  cameraResolution?: {
    width: number;
    height: number;
  };
}

// ============================================
// Analytics Types
// ============================================

export interface HealingProgress {
  assessmentId: string;
  date: Date;
  area: number;
  areaChange: number;       // absolute change from previous
  areaChangePercent: number; // percentage change from previous
  healingRate: number;      // cm²/day
  projectedHealingDate?: Date;
}

export interface WoundAnalytics {
  woundId: string;
  initialArea: number;
  currentArea: number;
  totalReduction: number;
  totalReductionPercent: number;
  averageHealingRate: number;
  healingVelocity: number;  // cm²/week
  assessmentCount: number;
  daysSinceOnset: number;
  progressHistory: HealingProgress[];
  trend: 'improving' | 'stable' | 'worsening';
}

// ============================================
// Report Types
// ============================================

export interface ClinicalReport {
  id: string;
  patientId: string;
  woundId: string;
  generatedAt: Date;
  generatedBy: string;
  reportType: 'single_assessment' | 'progress_report' | 'discharge_summary';
  dateRange?: {
    start: Date;
    end: Date;
  };
  assessments: WoundAssessment[];
  analytics?: WoundAnalytics;
  recommendations?: string[];
  signature?: {
    name: string;
    credentials: string;
    signedAt: Date;
  };
}

// ============================================
// Model Types
// ============================================

export interface ModelConfig {
  name: string;
  version: string;
  inputSize: [number, number];
  outputChannels: number;
  backend: 'webgl' | 'wasm' | 'cpu';
  quantized: boolean;
}

export interface InferenceResult {
  segmentation: SegmentationResult;
  inferenceTime: number;
  modelVersion?: string;
  modelConfig?: ModelConfig;
}

// ============================================
// App State Types
// ============================================

export interface AppState {
  currentPatient: Patient | null;
  currentWound: Wound | null;
  isModelLoaded: boolean;
  isOnline: boolean;
  pendingSync: number;
}

export interface CaptureState {
  isCapturing: boolean;
  calibrationDetected: boolean;
  qualityPassed: boolean;
  previewImage: string | null;
  segmentationPreview: SegmentationResult | null;
}

// ============================================
// Database Types
// ============================================

export interface DBSchema {
  patients: Patient;
  wounds: Wound;
  assessments: WoundAssessment;
  reports: ClinicalReport;
  settings: AppSettings;
  syncQueue: SyncQueueItem;
}

export interface AppSettings {
  id: string;
  clinicName: string;
  clinicLogo?: string;
  defaultCalibrationMethod: CalibrationData['markerType'];
  autoSaveEnabled: boolean;
  qualityThresholds: {
    minBlurScore: number;
    minLightingScore: number;
    minCalibrationConfidence: number;
    maxPerspectiveDistortion: number;
  };
  measurementPrecision: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: keyof DBSchema;
  recordId: string;
  data: unknown;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

// ============================================
// Wound Dressing Protocol Types
// ============================================

export type WoundPhase = 'extension' | 'transition' | 'repair';

export interface WoundPhaseDetails {
  phase: WoundPhase;
  confidence: number;
  characteristics: string[];
  description: string;
  color: string;
}

export interface DressingSession {
  id: string;
  patientId: string;
  woundId?: string;
  clinicianName: string;
  facilityName?: string;
  woundAssessmentId?: string;
  painAssessmentId?: string;
  sterileFieldChecklistId?: string;
  materialsChecklistId?: string;
  dressingProtocolId?: string;
  postDressingCareId?: string;
  status: 'in-progress' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DressingWoundAssessment {
  id: string;
  patientId: string;
  sessionId: string;
  photographBase64?: string;
  photographThumbnail?: string;
  location: string;
  woundType: string;
  size: {
    length: number;
    width: number;
    depth?: number;
    unit: 'cm' | 'mm';
  };
  aiSuggestedPhase?: WoundPhase;
  aiConfidence?: number;
  confirmedPhase: WoundPhase;
  phaseOverridden: boolean;
  exudateLevel: 'none' | 'minimal' | 'moderate' | 'heavy';
  tissueType: ('necrotic' | 'slough' | 'granulating' | 'epithelializing')[];
  surroundingSkin: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SterileFieldChecklist {
  id: string;
  sessionId: string;
  cleanWorkingSurface: boolean;
  handHygienePerformed: boolean;
  sterileGloves: boolean;
  dressingTrolleyPrepared: boolean;
  wasteDisposalBagAvailable: boolean;
  adequateLightingEnsured: boolean;
  allConfirmed: boolean;
  confirmedAt?: Date;
  confirmedBy?: string;
}

export interface MaterialsChecklist {
  id: string;
  sessionId: string;
  woundPhase: WoundPhase;
  items: MaterialItem[];
  createdAt: Date;
}

export interface MaterialItem {
  name: string;
  quantity: number;
  required: boolean;
  checked: boolean;
  phaseSpecific?: WoundPhase[];
  notes?: string;
}

export interface DressingProtocol {
  id: string;
  sessionId: string;
  woundPhase: WoundPhase;
  steps: DressingStep[];
  createdAt: Date;
}

export interface DressingStep {
  stepNumber: number;
  category: 'preparation' | 'cleaning' | 'dressing' | 'fixation' | 'documentation';
  title: string;
  instructions: string[];
  products?: string[];
  warnings?: string[];
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface LayeredDressing {
  contactLayer: {
    product: string;
    application: string;
    purpose: string[];
  };
  secondaryContactLayer?: {
    product: string;
    application: string;
    purpose: string[];
    applicablePhases: WoundPhase[];
  };
  capillaryLayer: {
    product: string;
    layers: number;
    purpose: string;
  };
  absorbentLayer: {
    product: string;
    purpose: string;
  };
  fixationLayer: {
    product: string;
    alternatives: string[];
    selectionCriteria: string;
  };
}

export interface PostDressingCare {
  id: string;
  sessionId: string;
  dressingChangeFrequency: string;
  nextDressingDue: Date;
  infectionSignsToWatch: string[];
  escalationCriteria: string[];
  expectedProgress: string;
  patientInstructions: string[];
  createdAt: Date;
}

// ============================================
// Pain Management Types
// ============================================

export type PainScaleType =
  | 'NRS'      // Numeric Rating Scale (0-10) - Adults
  | 'VAS'      // Visual Analogue Scale - Adults
  | 'FLACC'    // Face, Legs, Activity, Cry, Consolability - Children
  | 'WONG_BAKER' // Wong-Baker Faces - Children
  | 'BPS'      // Behavioral Pain Scale - ICU/Non-communicative
  | 'CPOT';    // Critical-Care Pain Observation Tool - ICU

export type PainType =
  | 'nociceptive'
  | 'neuropathic'
  | 'inflammatory'
  | 'ischemic'
  | 'mixed';

export type PainDuration =
  | 'acute'      // < 3 months
  | 'subacute'   // 3-6 months
  | 'chronic';   // > 6 months

export type PainContext =
  | 'rest'
  | 'movement'
  | 'procedural';

export type PainSeverity =
  | 'none'       // 0
  | 'mild'       // 1-3
  | 'moderate'   // 4-6
  | 'severe';    // 7-10

export interface DressingPainAssessment {
  id: string;
  sessionId: string;
  patientId?: string;
  timestamp: Date;
  scaleUsed: PainScaleType;
  score: number;
  maxScore: number;
  severity: PainSeverity;
  painType: PainType;
  painDuration: PainDuration;
  painContext: PainContext;
  location: string;
  description: string;
  aggravatingFactors: string[];
  relievingFactors: string[];
  proceduralPainAnticipated: boolean;
  painCharacteristics?: string[];
  analgesiaTiming?: 'none' | 'pre-procedure' | 'during' | 'post';
  analgesiaClass?: 'mild' | 'moderate' | 'severe';
  analgesiaGuidance: string;
  createdAt: Date;
}

export type PatientCategory =
  | 'adult'
  | 'pediatric'
  | 'elderly'      // >65 years
  | 'neonate';

export interface PainPatientInfo {
  id: string;
  initials: string;
  age: number;
  ageUnit: 'years' | 'months' | 'days';
  weight?: number;
  category: PatientCategory;
  gender: 'male' | 'female' | 'other';
}

export type Comorbidity =
  | 'peptic_ulcer'
  | 'ckd_stage_1'
  | 'ckd_stage_2'
  | 'ckd_stage_3a'
  | 'ckd_stage_3b'
  | 'ckd_stage_4'
  | 'ckd_stage_5'
  | 'liver_disease_mild'
  | 'liver_disease_moderate'
  | 'liver_disease_severe'
  | 'heart_failure'
  | 'ischemic_heart_disease'
  | 'hypertension'
  | 'diabetes'
  | 'asthma'
  | 'copd'
  | 'pregnancy'
  | 'lactation'
  | 'opioid_tolerance'
  | 'opioid_dependence'
  | 'gi_bleed_history'
  | 'coagulopathy'
  | 'seizure_disorder'
  | 'mental_health_disorder'
  | 'respiratory_depression_risk';

export interface ComorbidityEntry {
  condition: Comorbidity;
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export type RiskLevel = 'info' | 'caution' | 'warning' | 'contraindicated';

export interface RiskFlag {
  id: string;
  level: RiskLevel;
  category: string;
  message: string;
  affectedDrugClasses: AnalgesicClass[];
  recommendation: string;
}

export type AnalgesicClass =
  | 'paracetamol'
  | 'nsaid_non_selective'
  | 'nsaid_cox2_selective'
  | 'weak_opioid'
  | 'strong_opioid'
  | 'adjuvant_anticonvulsant'
  | 'adjuvant_antidepressant'
  | 'adjuvant_muscle_relaxant'
  | 'topical_analgesic'
  | 'topical_anesthetic'
  | 'regional_anesthesia'
  | 'anxiolytic'
  | 'ketamine'
  | 'nitrous_oxide';

export type AnalgesicRoute =
  | 'oral'
  | 'sublingual'
  | 'intravenous'
  | 'intramuscular'
  | 'subcutaneous'
  | 'transdermal'
  | 'topical'
  | 'rectal'
  | 'intranasal'
  | 'inhalation'
  | 'regional';

export interface AnalgesicRecommendation {
  class: AnalgesicClass;
  suitability: 'recommended' | 'consider' | 'caution' | 'avoid' | 'contraindicated';
  routes: AnalgesicRoute[];
  rationale: string;
  doseAdjustment?: string;
  monitoringRequired?: string[];
}

export type ProcedureType =
  | 'wound_dressing'
  | 'burn_dressing'
  | 'debridement'
  | 'suturing'
  | 'drain_removal'
  | 'catheter_insertion'
  | 'lumbar_puncture'
  | 'bone_marrow_biopsy'
  | 'chest_tube'
  | 'central_line'
  | 'other';

export interface ProceduralPainPlan {
  procedureType: ProcedureType;
  procedureDescription: string;
  anticipatedPainLevel: PainSeverity;
  preEmptiveAnalgesia: {
    required: boolean;
    timing: string;
    recommendations: AnalgesicRecommendation[];
  };
  intraProceduralAnalgesia: {
    topical: boolean;
    topicalAgent?: string;
    regional: boolean;
    regionalTechnique?: string;
    systemic: boolean;
    systemicOptions: AnalgesicRecommendation[];
  };
  anxiolysis: {
    recommended: boolean;
    rationale?: string;
  };
  nonPharmacological: string[];
  monitoringDuring: string[];
  postProcedureFollow: string[];
}

export interface MonitoringPlan {
  sedationMonitoring: {
    required: boolean;
    frequency?: string;
    scale?: string;
  };
  respiratoryMonitoring: {
    required: boolean;
    frequency?: string;
    parameters?: string[];
  };
  cardiovascularMonitoring: {
    required: boolean;
    frequency?: string;
    parameters?: string[];
  };
  renalMonitoring: {
    required: boolean;
    frequency?: string;
    tests?: string[];
  };
  giProtection: {
    required: boolean;
    recommendations?: string[];
  };
  otherMonitoring: string[];
}

export interface RedFlag {
  id: string;
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  action: string;
}

export interface PainManagementPlan {
  id: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
  clinician: {
    name: string;
    role: string;
    signature?: string;
  };
  patient: PainPatientInfo;
  painAssessment: DressingPainAssessment;
  comorbidities: ComorbidityEntry[];
  riskFlags: RiskFlag[];
  analgesicPlan: {
    primaryRecommendations: AnalgesicRecommendation[];
    adjunctRecommendations: AnalgesicRecommendation[];
    contraindicatedClasses: AnalgesicClass[];
    nonPharmacological: string[];
  };
  proceduralPlan?: ProceduralPainPlan;
  monitoringPlan: MonitoringPlan;
  redFlags: RedFlag[];
  notes: string;
  legalDisclaimer: string;
}

export type ClinicalMode = 'standard' | 'advanced';

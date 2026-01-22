/**
 * AstroWound-MEASURE Pain Management Store
 * Zustand store for pain assessment and dressing workflow state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DressingPainAssessment,
  ComorbidityEntry,
  RiskFlag,
  AnalgesicRecommendation,
  ProceduralPainPlan,
  MonitoringPlan,
  RedFlag,
  PainPatientInfo,
  PainScaleType,
  PainType,
  DressingSession,
  SterileFieldChecklist,
  MaterialsChecklist,
  MaterialItem,
  PostDressingCare,
  LayeredDressing,
  WoundPhase,
} from '@/types';
import { generateRiskFlags } from '@/lib/comorbidityEngine';
import { generateAnalgesicRecommendations, generateProceduralPainPlan } from '@/lib/analgesicEngine';
import { generateMonitoringPlan, generateRedFlags } from '@/lib/safetyModule';

// Pain Assessment Workflow Steps
export type PainAssessmentStep =
  | 'patient_info'
  | 'pain_assessment'
  | 'comorbidities'
  | 'recommendations'
  | 'monitoring'
  | 'summary';

// Dressing Protocol Workflow Steps
export type DressingStep =
  | 'wound_assessment'
  | 'phase_identification'
  | 'materials_prep'
  | 'sterile_field'
  | 'dressing_application'
  | 'post_care'
  | 'documentation';

interface PainManagementState {
  // Current workflow state
  currentPainStep: PainAssessmentStep;
  currentDressingStep: DressingStep;

  // Patient Information
  patientInfo: PainPatientInfo | null;

  // Pain Assessment
  currentAssessment: Partial<DressingPainAssessment> | null;

  // Comorbidities
  comorbidities: ComorbidityEntry[];

  // Generated Results
  riskFlags: RiskFlag[];
  recommendations: AnalgesicRecommendation[];
  proceduralPlan: ProceduralPainPlan | null;
  monitoringPlan: MonitoringPlan | null;
  redFlags: RedFlag[];

  // Dressing Session State
  currentDressingSession: Partial<DressingSession> | null;
  sterileFieldChecklist: Partial<SterileFieldChecklist> | null;
  materialsChecklist: Partial<MaterialsChecklist> | null;
  postDressingCare: Partial<PostDressingCare> | null;
  layeredDressing: LayeredDressing[];
  selectedWoundPhase: WoundPhase | null;

  // Linked Wound Capture
  linkedCaptureId: string | null;

  // Actions - Navigation
  setPainStep: (step: PainAssessmentStep) => void;
  nextPainStep: () => void;
  prevPainStep: () => void;
  setDressingStep: (step: DressingStep) => void;
  nextDressingStep: () => void;
  prevDressingStep: () => void;

  // Actions - Patient Info
  setPatientInfo: (info: PainPatientInfo) => void;
  updatePatientInfo: (update: Partial<PainPatientInfo>) => void;

  // Actions - Pain Assessment
  setCurrentAssessment: (assessment: Partial<DressingPainAssessment>) => void;
  updateAssessment: (update: Partial<DressingPainAssessment>) => void;
  setPainScore: (score: number) => void;
  setPainScale: (scale: PainScaleType) => void;
  setPainType: (painType: PainType) => void;

  // Actions - Comorbidities
  addComorbidity: (entry: ComorbidityEntry) => void;
  removeComorbidity: (condition: string) => void;
  clearComorbidities: () => void;
  setComorbidities: (comorbidities: ComorbidityEntry[]) => void;

  // Actions - Generate Recommendations
  generateAllRecommendations: () => void;

  // Actions - Dressing Session
  setCurrentDressingSession: (session: Partial<DressingSession>) => void;
  updateDressingSession: (update: Partial<DressingSession>) => void;
  setSelectedWoundPhase: (phase: WoundPhase) => void;

  // Actions - Checklists
  setSterileFieldChecklist: (checklist: Partial<SterileFieldChecklist>) => void;
  updateSterileFieldItem: (itemId: string, checked: boolean) => void;
  setMaterialsChecklist: (checklist: Partial<MaterialsChecklist>) => void;
  updateMaterialItem: (itemId: string, checked: boolean) => void;

  // Actions - Layered Dressing
  addDressingLayer: (layer: LayeredDressing) => void;
  removeDressingLayer: (index: number) => void;
  updateDressingLayer: (index: number, update: Partial<LayeredDressing>) => void;
  clearDressingLayers: () => void;

  // Actions - Post Care
  setPostDressingCare: (care: Partial<PostDressingCare>) => void;

  // Actions - Linking
  setLinkedCaptureId: (captureId: string | null) => void;

  // Actions - Reset
  resetPainAssessment: () => void;
  resetDressingSession: () => void;
  resetAll: () => void;
}

const PAIN_STEP_ORDER: PainAssessmentStep[] = [
  'patient_info',
  'pain_assessment',
  'comorbidities',
  'recommendations',
  'monitoring',
  'summary'
];

const DRESSING_STEP_ORDER: DressingStep[] = [
  'wound_assessment',
  'phase_identification',
  'materials_prep',
  'sterile_field',
  'dressing_application',
  'post_care',
  'documentation'
];

export const usePainManagementStore = create<PainManagementState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentPainStep: 'patient_info',
      currentDressingStep: 'wound_assessment',
      patientInfo: null,
      currentAssessment: null,
      comorbidities: [],
      riskFlags: [],
      recommendations: [],
      proceduralPlan: null,
      monitoringPlan: null,
      redFlags: [],
      currentDressingSession: null,
      sterileFieldChecklist: null,
      materialsChecklist: null,
      postDressingCare: null,
      layeredDressing: [],
      selectedWoundPhase: null,
      linkedCaptureId: null,

      // Navigation Actions
      setPainStep: (step) => set({ currentPainStep: step }),

      nextPainStep: () => {
        const currentIndex = PAIN_STEP_ORDER.indexOf(get().currentPainStep);
        if (currentIndex < PAIN_STEP_ORDER.length - 1) {
          set({ currentPainStep: PAIN_STEP_ORDER[currentIndex + 1] });
        }
      },

      prevPainStep: () => {
        const currentIndex = PAIN_STEP_ORDER.indexOf(get().currentPainStep);
        if (currentIndex > 0) {
          set({ currentPainStep: PAIN_STEP_ORDER[currentIndex - 1] });
        }
      },

      setDressingStep: (step) => set({ currentDressingStep: step }),

      nextDressingStep: () => {
        const currentIndex = DRESSING_STEP_ORDER.indexOf(get().currentDressingStep);
        if (currentIndex < DRESSING_STEP_ORDER.length - 1) {
          set({ currentDressingStep: DRESSING_STEP_ORDER[currentIndex + 1] });
        }
      },

      prevDressingStep: () => {
        const currentIndex = DRESSING_STEP_ORDER.indexOf(get().currentDressingStep);
        if (currentIndex > 0) {
          set({ currentDressingStep: DRESSING_STEP_ORDER[currentIndex - 1] });
        }
      },

      // Patient Info Actions
      setPatientInfo: (info) => set({ patientInfo: info }),

      updatePatientInfo: (update) => {
        const current = get().patientInfo;
        if (current) {
          set({ patientInfo: { ...current, ...update } });
        }
      },

      // Pain Assessment Actions
      setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),

      updateAssessment: (update) => {
        const current = get().currentAssessment;
        set({ currentAssessment: { ...current, ...update } });
      },

      setPainScore: (score) => {
        const current = get().currentAssessment;
        set({ currentAssessment: { ...current, score } });
      },

      setPainScale: (scale) => {
        const current = get().currentAssessment;
        set({ currentAssessment: { ...current, scaleUsed: scale } });
      },

      setPainType: (painType) => {
        const current = get().currentAssessment;
        set({ currentAssessment: { ...current, painType } });
      },

      // Comorbidity Actions
      addComorbidity: (entry) => {
        const current = get().comorbidities;
        if (!current.find(c => c.condition === entry.condition)) {
          set({ comorbidities: [...current, entry] });
        }
      },

      removeComorbidity: (condition) => {
        set({
          comorbidities: get().comorbidities.filter(c => c.condition !== condition)
        });
      },

      clearComorbidities: () => set({ comorbidities: [] }),

      setComorbidities: (comorbidities) => set({ comorbidities }),

      // Generate All Recommendations
      generateAllRecommendations: () => {
        const { patientInfo, currentAssessment, comorbidities } = get();

        if (!patientInfo || !currentAssessment) {
          console.warn('Cannot generate recommendations: missing patient info or assessment');
          return;
        }

        // Generate risk flags
        const riskFlags = generateRiskFlags(comorbidities, patientInfo);

        // Create complete assessment for engines
        const assessment: DressingPainAssessment = {
          id: currentAssessment.id || crypto.randomUUID(),
          patientId: patientInfo.id,
          sessionId: get().currentDressingSession?.id || '',
          timestamp: currentAssessment.timestamp || new Date(),
          scaleUsed: currentAssessment.scaleUsed || 'NRS',
          score: currentAssessment.score || 0,
          maxScore: currentAssessment.maxScore || 10,
          painType: currentAssessment.painType || 'nociceptive',
          painDuration: currentAssessment.painDuration || 'acute',
          painContext: currentAssessment.painContext || 'rest',
          severity: currentAssessment.severity || 'mild',
          location: currentAssessment.location || '',
          description: currentAssessment.description || '',
          painCharacteristics: currentAssessment.painCharacteristics || [],
          aggravatingFactors: currentAssessment.aggravatingFactors || [],
          relievingFactors: currentAssessment.relievingFactors || [],
          proceduralPainAnticipated: currentAssessment.proceduralPainAnticipated || false,
          analgesiaGuidance: currentAssessment.analgesiaGuidance || '',
          createdAt: currentAssessment.createdAt || new Date(),
        };

        // Generate analgesic recommendations
        const recommendations = generateAnalgesicRecommendations(
          assessment,
          riskFlags,
          patientInfo
        );

        // Generate procedural plan if applicable
        let proceduralPlan: ProceduralPainPlan | null = null;
        if (assessment.painContext === 'procedural') {
          proceduralPlan = generateProceduralPainPlan(
            'wound_dressing',
            'Wound dressing change',
            assessment,
            riskFlags,
            patientInfo
          );
        }

        // Generate monitoring plan - extract recommendations array from result
        const recsArray = [
          ...recommendations.primaryRecommendations,
          ...recommendations.adjunctRecommendations
        ];
        const monitoringPlan = generateMonitoringPlan(
          recsArray,
          riskFlags,
          patientInfo,
          comorbidities
        );

        // Generate red flags
        const redFlags = generateRedFlags(
          assessment,
          recsArray,
          riskFlags,
          patientInfo
        );

        set({
          riskFlags,
          recommendations: recsArray,
          proceduralPlan,
          monitoringPlan,
          redFlags,
          currentAssessment: assessment
        });
      },

      // Dressing Session Actions
      setCurrentDressingSession: (session) => set({ currentDressingSession: session }),

      updateDressingSession: (update) => {
        const current = get().currentDressingSession;
        set({ currentDressingSession: { ...current, ...update } });
      },

      setSelectedWoundPhase: (phase) => set({ selectedWoundPhase: phase }),

      // Checklist Actions
      setSterileFieldChecklist: (checklist) => set({ sterileFieldChecklist: checklist }),

      updateSterileFieldItem: (itemId, checked) => {
        const current = get().sterileFieldChecklist;
        if (current) {
          // Map itemId to the corresponding field in SterileFieldChecklist
          const fieldMap: Record<string, keyof Partial<SterileFieldChecklist>> = {
            'cleanWorkingSurface': 'cleanWorkingSurface',
            'handHygienePerformed': 'handHygienePerformed',
            'sterileGloves': 'sterileGloves',
            'dressingTrolleyPrepared': 'dressingTrolleyPrepared',
            'wasteDisposalBagAvailable': 'wasteDisposalBagAvailable',
            'adequateLightingEnsured': 'adequateLightingEnsured',
          };
          const field = fieldMap[itemId];
          if (field) {
            set({ sterileFieldChecklist: { ...current, [field]: checked } });
          }
        }
      },

      setMaterialsChecklist: (checklist) => set({ materialsChecklist: checklist }),

      updateMaterialItem: (itemId, checked) => {
        const current = get().materialsChecklist;
        if (current?.items) {
          const updatedItems = current.items.map((item: MaterialItem) =>
            item.name === itemId ? { ...item, checked } : item
          );
          set({ materialsChecklist: { ...current, items: updatedItems } });
        }
      },

      // Layered Dressing Actions
      addDressingLayer: (layer) => {
        const current = get().layeredDressing;
        set({ layeredDressing: [...current, layer] });
      },

      removeDressingLayer: (index) => {
        set({
          layeredDressing: get().layeredDressing.filter((_, i) => i !== index)
        });
      },

      updateDressingLayer: (index, update) => {
        set({
          layeredDressing: get().layeredDressing.map((l, i) =>
            i === index ? { ...l, ...update } : l
          )
        });
      },

      clearDressingLayers: () => set({ layeredDressing: [] }),

      // Post Care Actions
      setPostDressingCare: (care) => set({ postDressingCare: care }),

      // Linking Actions
      setLinkedCaptureId: (captureId) => set({ linkedCaptureId: captureId }),

      // Reset Actions
      resetPainAssessment: () => set({
        currentPainStep: 'patient_info',
        currentAssessment: null,
        comorbidities: [],
        riskFlags: [],
        recommendations: [],
        proceduralPlan: null,
        monitoringPlan: null,
        redFlags: []
      }),

      resetDressingSession: () => set({
        currentDressingStep: 'wound_assessment',
        currentDressingSession: null,
        sterileFieldChecklist: null,
        materialsChecklist: null,
        postDressingCare: null,
        layeredDressing: [],
        selectedWoundPhase: null
      }),

      resetAll: () => set({
        currentPainStep: 'patient_info',
        currentDressingStep: 'wound_assessment',
        patientInfo: null,
        currentAssessment: null,
        comorbidities: [],
        riskFlags: [],
        recommendations: [],
        proceduralPlan: null,
        monitoringPlan: null,
        redFlags: [],
        currentDressingSession: null,
        sterileFieldChecklist: null,
        materialsChecklist: null,
        postDressingCare: null,
        layeredDressing: [],
        selectedWoundPhase: null,
        linkedCaptureId: null
      })
    }),
    {
      name: 'astrowound-pain-management',
      partialize: (state) => ({
        patientInfo: state.patientInfo,
        currentAssessment: state.currentAssessment,
        comorbidities: state.comorbidities,
        currentDressingSession: state.currentDressingSession,
        selectedWoundPhase: state.selectedWoundPhase,
        linkedCaptureId: state.linkedCaptureId
      })
    }
  )
);

// Selector hooks for convenience
export const usePainStep = () => usePainManagementStore(state => state.currentPainStep);
export const useDressingStep = () => usePainManagementStore(state => state.currentDressingStep);
export const usePatientInfo = () => usePainManagementStore(state => state.patientInfo);
export const useComorbidities = () => usePainManagementStore(state => state.comorbidities);
export const useRecommendations = () => usePainManagementStore(state => state.recommendations);
export const useRedFlags = () => usePainManagementStore(state => state.redFlags);

/**
 * Pain Assessment Component
 * Multi-step pain assessment workflow with WHO Ladder recommendations
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePainManagementStore, type PainAssessmentStep } from '@/store/painManagementStore';
import { useAppStore } from '@/store';
import {
  PAIN_SCALES,
  COMORBIDITY_INFO,
  ANALGESIC_CLASSES,
  LEGAL_DISCLAIMER,
} from '@/lib/clinicalConstants';
import { getComorbidityOptions } from '@/lib/comorbidityEngine';
import { getWHOStep, getSuitabilityBadge } from '@/lib/analgesicEngine';
import { getRedFlagBadge } from '@/lib/safetyModule';
import type { PainScaleType, PainType, PatientCategory, PainContext } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  AlertTriangle,
  CheckCircle2,
  Info,
  User,
  Stethoscope,
  Pill,
  Activity,
  FileText,
  X,
} from 'lucide-react';

const STEPS: { id: PainAssessmentStep; label: string; icon: React.ReactNode }[] = [
  { id: 'patient_info', label: 'Patient', icon: <User className="w-4 h-4" /> },
  { id: 'pain_assessment', label: 'Pain', icon: <Stethoscope className="w-4 h-4" /> },
  { id: 'comorbidities', label: 'History', icon: <Activity className="w-4 h-4" /> },
  { id: 'recommendations', label: 'Plan', icon: <Pill className="w-4 h-4" /> },
  { id: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
];

export default function PainAssessment() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId?: string; woundId?: string }>();
  
  const {
    currentPainStep,
    comorbidities,
    currentAssessment,
    riskFlags,
    recommendations,
    monitoringPlan,
    redFlags,
    setPainStep,
    nextPainStep,
    prevPainStep,
    setPatientInfo,
    setCurrentAssessment,
    addComorbidity,
    removeComorbidity,
    generateAllRecommendations,
    resetPainAssessment,
  } = usePainManagementStore();

  const currentPatient = useAppStore(state => state.currentPatient);

  // Local form state
  const [localAge, setLocalAge] = useState(
    currentPatient?.dateOfBirth 
      ? Math.floor((Date.now() - new Date(currentPatient.dateOfBirth).getTime()) / 31557600000)
      : 45
  );
  const [localWeight, setLocalWeight] = useState(70);
  const [localCategory, setLocalCategory] = useState<PatientCategory>('adult');
  const [localInitials, setLocalInitials] = useState(
    currentPatient 
      ? `${currentPatient.firstName[0]}${currentPatient.lastName[0]}`
      : ''
  );

  const [localPainScore, setLocalPainScore] = useState(5);
  const [localPainScale, setLocalPainScale] = useState<PainScaleType>('NRS');
  const [localPainContext, setLocalPainContext] = useState<PainContext>('rest');
  const [localPainType, setLocalPainType] = useState<PainType>('nociceptive');
  const [localPainLocation, setLocalPainLocation] = useState('');
  const [localPainDescription, _setLocalPainDescription] = useState('');

  // Update category based on age
  useEffect(() => {
    if (localAge < 1) setLocalCategory('neonate');
    else if (localAge < 18) setLocalCategory('pediatric');
    else if (localAge >= 65) setLocalCategory('elderly');
    else setLocalCategory('adult');
  }, [localAge]);

  const handleSavePatientInfo = () => {
    setPatientInfo({
      id: patientId || crypto.randomUUID(),
      initials: localInitials || 'XX',
      age: localAge,
      ageUnit: 'years',
      weight: localWeight,
      category: localCategory,
      gender: currentPatient?.gender || 'other',
    });
    nextPainStep();
  };

  const handleSavePainAssessment = () => {
    const severity = localPainScore <= 3 ? 'mild' as const
      : localPainScore <= 6 ? 'moderate' as const
      : 'severe' as const;

    setCurrentAssessment({
      id: crypto.randomUUID(),
      sessionId: '',
      patientId: patientId || '',
      timestamp: new Date(),
      scaleUsed: localPainScale,
      score: localPainScore,
      maxScore: PAIN_SCALES[localPainScale]?.maxScore || 10,
      severity,
      painType: localPainType,
      painDuration: 'acute',
      painContext: localPainContext,
      location: localPainLocation,
      description: localPainDescription,
      aggravatingFactors: [],
      relievingFactors: [],
      proceduralPainAnticipated: localPainContext === 'procedural',
      analgesiaGuidance: '',
      createdAt: new Date(),
    });
    nextPainStep();
  };

  const handleGenerateRecommendations = () => {
    generateAllRecommendations();
    nextPainStep();
  };

  const handleFinish = () => {
    navigate(-1);
  };

  const handleReset = () => {
    resetPainAssessment();
    setLocalPainScore(5);
    setLocalPainScale('NRS');
    setLocalPainContext('rest');
    setLocalPainType('nociceptive');
  };

  // Get grouped comorbidities for display
  const groupedComorbidities = getComorbidityOptions();

  const currentStepIndex = STEPS.findIndex(s => s.id === currentPainStep);

  const renderStepContent = () => {
    switch (currentPainStep) {
      case 'patient_info':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Patient Information</h4>
                  <p className="text-sm text-blue-600">
                    Enter basic patient demographics to personalize recommendations.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Initials
                </label>
                <input
                  type="text"
                  value={localInitials}
                  onChange={e => setLocalInitials(e.target.value.toUpperCase().slice(0, 3))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-astro-500 focus:border-transparent"
                  placeholder="AB"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={localAge}
                  onChange={e => setLocalAge(Number(e.target.value))}
                  min={0}
                  max={120}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-astro-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={localWeight}
                  onChange={e => setLocalWeight(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-astro-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 capitalize">
                  {localCategory}
                </div>
              </div>
            </div>

            <button
              onClick={handleSavePatientInfo}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Continue to Pain Assessment
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'pain_assessment':
        return (
          <div className="space-y-6">
            {/* Pain Scale Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain Assessment Scale
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(PAIN_SCALES) as PainScaleType[]).map(scale => {
                  const scaleInfo = PAIN_SCALES[scale];
                  const isSelected = localPainScale === scale;
                  const isApplicable = scaleInfo.patientCategory.includes(localCategory);
                  
                  return (
                    <button
                      key={scale}
                      onClick={() => isApplicable && setLocalPainScale(scale)}
                      disabled={!isApplicable}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-astro-500 bg-astro-50 ring-2 ring-astro-500'
                          : isApplicable
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-medium text-sm">{scale}</div>
                      <div className="text-xs text-gray-500 truncate">{scaleInfo.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pain Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain Score: <span className="text-astro-600 font-bold">{localPainScore}</span> / {PAIN_SCALES[localPainScale]?.maxScore || 10}
              </label>
              <input
                type="range"
                min={0}
                max={PAIN_SCALES[localPainScale]?.maxScore || 10}
                value={localPainScore}
                onChange={e => setLocalPainScore(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #22c55e 0%, 
                    #eab308 50%, 
                    #ef4444 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>No Pain</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* WHO Ladder Step Indicator */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  localPainScore <= 3 ? 'bg-green-500' :
                  localPainScore <= 6 ? 'bg-amber-500' : 'bg-red-500'
                }`}>
                  {getWHOStep(localPainScore <= 3 ? 'mild' : localPainScore <= 6 ? 'moderate' : 'severe')}
                </div>
                <div>
                  <div className="font-medium text-gray-800">
                    WHO Ladder Step {getWHOStep(localPainScore <= 3 ? 'mild' : localPainScore <= 6 ? 'moderate' : 'severe')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {localPainScore <= 3 ? 'Mild pain: Non-opioid ± adjuvant' :
                     localPainScore <= 6 ? 'Moderate pain: Weak opioid ± non-opioid ± adjuvant' :
                     'Severe pain: Strong opioid ± non-opioid ± adjuvant'}
                  </div>
                </div>
              </div>
            </div>

            {/* Pain Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain Context
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['rest', 'movement', 'procedural'] as PainContext[]).map(context => (
                  <button
                    key={context}
                    onClick={() => setLocalPainContext(context)}
                    className={`p-3 rounded-lg border capitalize transition-all ${
                      localPainContext === context
                        ? 'border-astro-500 bg-astro-50 ring-2 ring-astro-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {context === 'rest' ? 'At Rest' : context === 'movement' ? 'On Movement' : 'Procedural'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pain Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pain Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['nociceptive', 'neuropathic', 'inflammatory', 'mixed'] as PainType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setLocalPainType(type)}
                    className={`p-3 rounded-lg border capitalize transition-all ${
                      localPainType === type
                        ? 'border-astro-500 bg-astro-50 ring-2 ring-astro-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pain Location
              </label>
              <input
                type="text"
                value={localPainLocation}
                onChange={e => setLocalPainLocation(e.target.value)}
                placeholder="e.g., Right lower leg wound site"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-astro-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSavePainAssessment}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Continue to Medical History
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'comorbidities':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Important</h4>
                  <p className="text-sm text-amber-600">
                    Select any relevant comorbidities to receive personalized safety recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Comorbidities */}
            {comorbidities.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Selected Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {comorbidities.map(entry => (
                    <span
                      key={entry.condition}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
                    >
                      {COMORBIDITY_INFO[entry.condition]?.displayName || entry.condition}
                      <button
                        onClick={() => removeComorbidity(entry.condition)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comorbidity Categories */}
            <div className="space-y-4">
              {Object.entries(groupedComorbidities).map(([category, conditions]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700">
                    {category}
                  </div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {conditions.map(condition => {
                      const info = COMORBIDITY_INFO[condition];
                      const isSelected = comorbidities.some(c => c.condition === condition);
                      
                      return (
                        <button
                          key={condition}
                          onClick={() => {
                            if (isSelected) {
                              removeComorbidity(condition);
                            } else {
                              addComorbidity({ condition, severity: 'moderate' });
                            }
                          }}
                          className={`p-2 rounded-lg border text-left text-sm transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                            <span className="font-medium">{info?.displayName || condition}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGenerateRecommendations}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Generate Recommendations
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-6">
            {/* Red Flags */}
            {redFlags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Safety Alerts
                </h3>
                {redFlags.map(flag => {
                  const badge = getRedFlagBadge(flag.severity);
                  return (
                    <div
                      key={flag.id}
                      className={`p-4 rounded-lg border ${badge.bg} ${badge.border}`}
                    >
                      <div className={`font-medium ${badge.text}`}>{flag.title}</div>
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                      <p className="text-sm font-medium text-gray-700 mt-2">
                        Action: {flag.action}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Risk Flags */}
            {riskFlags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">Risk Considerations</h3>
                <div className="space-y-2">
                  {riskFlags.map(flag => (
                    <div
                      key={flag.id}
                      className={`p-3 rounded-lg border ${
                        flag.level === 'contraindicated' ? 'bg-red-50 border-red-200' :
                        flag.level === 'warning' ? 'bg-amber-50 border-amber-200' :
                        flag.level === 'caution' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                          flag.level === 'contraindicated' ? 'text-red-600' :
                          flag.level === 'warning' ? 'text-amber-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <div className="font-medium text-sm">{flag.message}</div>
                          <div className="text-xs text-gray-600 mt-1">{flag.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analgesic Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Pill className="w-5 h-5 text-astro-500" />
                Analgesic Recommendations
              </h3>
              
              {recommendations.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No recommendations generated. Please complete the previous steps.
                </p>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => {
                    const classInfo = ANALGESIC_CLASSES[rec.class];
                    const badge = getSuitabilityBadge(rec.suitability);
                    
                    return (
                      <div
                        key={idx}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-800">
                                {classInfo?.displayName || rec.class}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                {rec.suitability}
                              </span>
                            </div>
                            {classInfo && (
                              <p className="text-sm text-gray-500 mt-1">
                                Examples: {classInfo.examples.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-2">{rec.rationale}</p>
                        
                        {rec.doseAdjustment && (
                          <p className="text-sm text-amber-700 mt-2 font-medium">
                            ⚠ {rec.doseAdjustment}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.routes.map(route => (
                            <span
                              key={route}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize"
                            >
                              {route}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monitoring Plan */}
            {monitoringPlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Monitoring Requirements</h3>
                <div className="space-y-2 text-sm">
                  {monitoringPlan.sedationMonitoring.required && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span>Sedation: {monitoringPlan.sedationMonitoring.frequency}</span>
                    </div>
                  )}
                  {monitoringPlan.respiratoryMonitoring.required && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span>Respiratory: {monitoringPlan.respiratoryMonitoring.frequency}</span>
                    </div>
                  )}
                  {monitoringPlan.renalMonitoring.required && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span>Renal function: {monitoringPlan.renalMonitoring.frequency}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={nextPainStep}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              View Summary
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'monitoring':
        // Skip to summary - monitoring is shown in recommendations
        setPainStep('summary');
        return null;

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Assessment Complete</h4>
                  <p className="text-sm text-green-600">
                    Pain assessment and recommendations have been generated.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Pain Score</div>
                <div className="text-2xl font-bold text-gray-800">
                  {currentAssessment?.score || localPainScore} / {currentAssessment?.maxScore || 10}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">WHO Ladder Step</div>
                <div className="text-2xl font-bold text-gray-800">
                  {getWHOStep(currentAssessment?.severity || 'mild')}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Risk Flags</div>
                <div className="text-2xl font-bold text-gray-800">{riskFlags.length}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Recommendations</div>
                <div className="text-2xl font-bold text-gray-800">{recommendations.length}</div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
              {LEGAL_DISCLAIMER}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                New Assessment
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-5 h-5" />
                Save & Close
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pain Assessment</h1>
                <p className="text-xs text-gray-500">WHO Ladder-based recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentPainStep;
              const isCompleted = idx < currentStepIndex;
              
              return (
                <button
                  key={step.id}
                  onClick={() => isCompleted && setPainStep(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-astro-100 text-astro-700'
                      : isCompleted
                        ? 'text-astro-600 hover:bg-gray-100 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? 'bg-astro-500 text-white'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStepIndex > 0 && currentPainStep !== 'summary' && (
          <div className="mt-4">
            <button
              onClick={prevPainStep}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

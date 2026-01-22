/**
 * Dressing Protocol Component
 * Phase-based wound dressing workflow with sterile field checklist
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePainManagementStore, type DressingStep } from '@/store/painManagementStore';
import {
  WOUND_PHASE_CONFIG,
  PHASE_MATERIALS,
  STERILE_FIELD_ITEMS,
  INFECTION_SIGNS,
  ESCALATION_CRITERIA,
} from '@/lib/clinicalConstants';
import type { WoundPhase } from '@/types';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  ClipboardCheck,
  Package,
  Shield,
  Layers,
  FileText,
  Camera,
  Download,
} from 'lucide-react';

const STEPS: { id: DressingStep; label: string; icon: React.ReactNode }[] = [
  { id: 'wound_assessment', label: 'Assessment', icon: <Camera className="w-4 h-4" /> },
  { id: 'phase_identification', label: 'Phase', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'materials_prep', label: 'Materials', icon: <Package className="w-4 h-4" /> },
  { id: 'sterile_field', label: 'Sterile Field', icon: <Shield className="w-4 h-4" /> },
  { id: 'dressing_application', label: 'Application', icon: <Layers className="w-4 h-4" /> },
  { id: 'documentation', label: 'Documentation', icon: <FileText className="w-4 h-4" /> },
];

export default function DressingProtocol() {
  const navigate = useNavigate();
  const { patientId, woundId } = useParams<{ patientId?: string; woundId?: string }>();
  
  const {
    currentDressingStep,
    selectedWoundPhase,
    sterileFieldChecklist,
    materialsChecklist: _materialsChecklist,
    currentDressingSession,
    nextDressingStep,
    prevDressingStep,
    setDressingStep,
    setSelectedWoundPhase,
    setSterileFieldChecklist,
    setMaterialsChecklist: _setMaterialsChecklist,
    setCurrentDressingSession,
    resetDressingSession,
  } = usePainManagementStore();

  // Local state
  const [localWoundPhase, setLocalWoundPhase] = useState<WoundPhase | null>(selectedWoundPhase);
  const [sterileChecks, setSterileChecks] = useState<Record<string, boolean>>({});
  const [materialChecks, setMaterialChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  // Initialize session on mount
  useEffect(() => {
    if (!currentDressingSession) {
      setCurrentDressingSession({
        id: crypto.randomUUID(),
        patientId: patientId || '',
        woundId: woundId,
        clinicianName: '',
        status: 'in-progress',
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [patientId, woundId, currentDressingSession, setCurrentDressingSession]);

  // Initialize sterile field checks when step changes
  useEffect(() => {
    if (currentDressingStep === 'sterile_field' && Object.keys(sterileChecks).length === 0) {
      const initialChecks: Record<string, boolean> = {};
      STERILE_FIELD_ITEMS.forEach(item => {
        initialChecks[item.id] = false;
      });
      setSterileChecks(initialChecks);
    }
  }, [currentDressingStep, sterileChecks]);

  // Initialize material checks when phase selected
  useEffect(() => {
    if (localWoundPhase && currentDressingStep === 'materials_prep') {
      const materials = PHASE_MATERIALS[localWoundPhase];
      if (materials) {
        const allMaterials = [
          ...materials.cleaningSolution,
          ...materials.primary,
          ...materials.secondary,
          ...materials.absorbent,
          ...materials.fixation,
        ];
        const initialChecks: Record<string, boolean> = {};
        allMaterials.forEach((mat, i) => {
          initialChecks[`${i}-${mat}`] = false;
        });
        setMaterialChecks(initialChecks);
      }
    }
  }, [localWoundPhase, currentDressingStep]);

  const handlePhaseSelect = (phase: WoundPhase) => {
    setLocalWoundPhase(phase);
    setSelectedWoundPhase(phase);
  };

  const handleSterileCheck = (id: string, checked: boolean) => {
    setSterileChecks(prev => ({ ...prev, [id]: checked }));
    
    // Update store
    const updatedChecklist = {
      id: sterileFieldChecklist?.id || crypto.randomUUID(),
      sessionId: currentDressingSession?.id || '',
      cleanWorkingSurface: id === 'cleanWorkingSurface' ? checked : sterileChecks.cleanWorkingSurface || false,
      handHygienePerformed: id === 'handHygienePerformed' ? checked : sterileChecks.handHygienePerformed || false,
      sterileGloves: id === 'sterileGloves' ? checked : sterileChecks.sterileGloves || false,
      dressingTrolleyPrepared: id === 'dressingTrolleyPrepared' ? checked : sterileChecks.dressingTrolleyPrepared || false,
      wasteDisposalBagAvailable: id === 'wasteDisposalBagAvailable' ? checked : sterileChecks.wasteDisposalBagAvailable || false,
      adequateLightingEnsured: id === 'adequateLightingEnsured' ? checked : sterileChecks.adequateLightingEnsured || false,
      allConfirmed: false,
    };
    setSterileFieldChecklist(updatedChecklist);
  };

  const handleMaterialCheck = (key: string, checked: boolean) => {
    setMaterialChecks(prev => ({ ...prev, [key]: checked }));
  };

  const allSterileChecksComplete = Object.values(sterileChecks).every(v => v);

  const handleDownloadPDF = () => {
    const phaseConfig = localWoundPhase ? WOUND_PHASE_CONFIG[localWoundPhase] : null;
    const materials = localWoundPhase ? PHASE_MATERIALS[localWoundPhase] : null;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Wound Dressing Protocol - BonneSante Medicals</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      font-size: 11pt; 
      line-height: 1.5;
      color: #333;
      position: relative;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 72pt;
      color: rgba(0, 128, 128, 0.06);
      font-weight: bold;
      white-space: nowrap;
      z-index: -1;
      pointer-events: none;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #008080;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #008080;
      font-size: 18pt;
      margin-bottom: 5px;
    }
    .header .company {
      font-size: 12pt;
      color: #006666;
      font-weight: bold;
    }
    .header .date {
      font-size: 9pt;
      color: #666;
      margin-top: 5px;
    }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      background: linear-gradient(90deg, #008080, #00a0a0);
      color: white;
      padding: 8px 15px;
      font-size: 12pt;
      font-weight: bold;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .content-box {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 15px;
    }
    .phase-info {
      background: #e6f7f7;
      border-left: 4px solid #008080;
      padding: 12px;
      margin-bottom: 15px;
    }
    .phase-name {
      font-size: 14pt;
      font-weight: bold;
      color: #008080;
    }
    .phase-desc {
      font-size: 10pt;
      color: #555;
      margin-top: 5px;
    }
    .materials-group {
      margin-bottom: 15px;
    }
    .materials-group h4 {
      color: #008080;
      font-size: 11pt;
      margin-bottom: 8px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }
    .materials-list {
      list-style: none;
      padding-left: 0;
    }
    .materials-list li {
      padding: 4px 0 4px 20px;
      position: relative;
    }
    .materials-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #008080;
      font-weight: bold;
    }
    .steps-list {
      counter-reset: step;
      list-style: none;
      padding-left: 0;
    }
    .steps-list li {
      counter-increment: step;
      padding: 10px 0 10px 45px;
      position: relative;
      border-bottom: 1px dashed #ddd;
    }
    .steps-list li:last-child {
      border-bottom: none;
    }
    .steps-list li::before {
      content: counter(step);
      position: absolute;
      left: 0;
      width: 28px;
      height: 28px;
      background: #008080;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      font-weight: bold;
      font-size: 12pt;
    }
    .step-title {
      font-weight: bold;
      color: #333;
    }
    .step-desc {
      font-size: 10pt;
      color: #666;
      margin-top: 3px;
    }
    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px;
      margin-top: 15px;
    }
    .warning-title {
      color: #856404;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .warning-list {
      list-style: disc;
      padding-left: 20px;
      color: #856404;
      font-size: 10pt;
    }
    .notes-section {
      margin-top: 15px;
      padding: 12px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      min-height: 60px;
    }
    .notes-label {
      font-weight: bold;
      color: #555;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #008080;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    .footer .company-name {
      color: #008080;
      font-weight: bold;
      font-size: 10pt;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="watermark">BonneSante</div>
  
  <div class="header">
    <div class="company">BonneSante Medicals</div>
    <h1>Wound Dressing Protocol</h1>
    <div class="date">Generated: ${currentDate}</div>
  </div>

  ${phaseConfig ? `
  <div class="section">
    <div class="section-title">Wound Phase Assessment</div>
    <div class="phase-info">
      <div class="phase-name">${phaseConfig.displayName}</div>
      <div class="phase-desc">${phaseConfig.description}</div>
    </div>
  </div>
  ` : ''}

  ${materials ? `
  <div class="section">
    <div class="section-title">Required Materials</div>
    <div class="content-box">
      <div class="materials-group">
        <h4>Cleaning Solution</h4>
        <ul class="materials-list">
          ${materials.cleaningSolution.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="materials-group">
        <h4>Primary Contact Layer</h4>
        <ul class="materials-list">
          ${materials.primary.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="materials-group">
        <h4>Secondary Layer</h4>
        <ul class="materials-list">
          ${materials.secondary.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="materials-group">
        <h4>Absorbent Layer</h4>
        <ul class="materials-list">
          ${materials.absorbent.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="materials-group">
        <h4>Fixation</h4>
        <ul class="materials-list">
          ${materials.fixation.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Dressing Application Steps</div>
    <div class="content-box">
      <ol class="steps-list">
        <li>
          <div class="step-title">Clean the Wound</div>
          <div class="step-desc">Using Wound Clex Spray, gently cleanse the wound bed and surrounding skin. Allow to dry.</div>
        </li>
        <li>
          <div class="step-title">Apply Primary Contact Layer</div>
          <div class="step-desc">Apply Woundcare Honey Gauze or Hera Wound Gel directly to the wound bed. Cover with Hera Tex Dressing if needed.</div>
        </li>
        <li>
          <div class="step-title">Apply Secondary Layer</div>
          <div class="step-desc">Place sterile gauze or foam dressing over the primary layer to manage exudate.</div>
        </li>
        <li>
          <div class="step-title">Add Absorbent Layer</div>
          <div class="step-desc">For wounds with heavy exudate, apply Gamgee Pack or Cotton Wool Pack for additional absorption.</div>
        </li>
        <li>
          <div class="step-title">Secure with Fixation</div>
          <div class="step-desc">Secure the dressing using Coban Bandage, Crepe Bandage, Plaster, or Tubular Bandage as appropriate.</div>
        </li>
        <li>
          <div class="step-title">Document and Dispose</div>
          <div class="step-desc">Record the dressing change, dispose of waste properly, and schedule next dressing change.</div>
        </li>
      </ol>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Post-Care Instructions</div>
    <div class="content-box">
      <div class="warning-box">
        <div class="warning-title">⚠️ Signs of Infection - Seek Medical Attention If:</div>
        <ul class="warning-list">
          ${INFECTION_SIGNS.map(sign => `<li>${sign}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>

  ${notes ? `
  <div class="section">
    <div class="section-title">Clinical Notes</div>
    <div class="notes-section">
      ${notes}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div class="company-name">BonneSante Medicals</div>
    <div>Wound Care Excellence | Professional Medical Supplies</div>
    <div style="margin-top: 5px; font-size: 8pt;">This document is for clinical reference only. Always follow institutional protocols.</div>
  </div>
</body>
</html>`;

    // Open print dialog for PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleFinish = () => {
    // Update session as completed
    if (currentDressingSession) {
      setCurrentDressingSession({
        ...currentDressingSession,
        status: 'completed',
        completedAt: new Date(),
        notes,
      });
    }
    navigate(-1);
  };

  const handleReset = () => {
    resetDressingSession();
    setLocalWoundPhase(null);
    setSterileChecks({});
    setMaterialChecks({});
    setNotes('');
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentDressingStep);

  const renderStepContent = () => {
    switch (currentDressingStep) {
      case 'wound_assessment':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Wound Assessment</h4>
                  <p className="text-sm text-blue-600">
                    Assess the wound before selecting appropriate dressing materials.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Pre-Dressing Checks</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Patient identity verified</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Consent obtained</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Pain assessment completed</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Allergies checked</span>
                </div>
              </div>
            </div>

            <button
              onClick={nextDressingStep}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Continue to Phase Identification
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'phase_identification':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Select Wound Phase</h4>
                  <p className="text-sm text-amber-600">
                    Choose the wound healing phase that best matches your assessment.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(Object.keys(WOUND_PHASE_CONFIG) as WoundPhase[]).map(phase => {
                const config = WOUND_PHASE_CONFIG[phase];
                const isSelected = localWoundPhase === phase;
                
                return (
                  <button
                    key={phase}
                    onClick={() => handlePhaseSelect(phase)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${config.borderColor} ${config.bgColor} ring-2 ring-offset-2`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config.bgColor}`}>
                        {isSelected ? (
                          <CheckCircle2 className={`w-6 h-6 ${config.color}`} />
                        ) : (
                          <div className={`w-4 h-4 rounded-full border-2 ${config.borderColor}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${config.color}`}>{config.displayName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {config.characteristics.slice(0, 3).map((char, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={nextDressingStep}
              disabled={!localWoundPhase}
              className="w-full bg-astro-500 hover:bg-astro-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Continue to Materials Prep
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'materials_prep':
        const materials = localWoundPhase ? PHASE_MATERIALS[localWoundPhase] : null;
        
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Materials Preparation</h4>
                  <p className="text-sm text-blue-600">
                    Gather all required materials before proceeding with the dressing.
                  </p>
                </div>
              </div>
            </div>

            {materials && (
              <div className="space-y-4">
                {/* Cleaning Solution */}
                {materials.cleaningSolution && materials.cleaningSolution.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Cleaning Solution</h4>
                    <div className="space-y-2">
                      {materials.cleaningSolution.map((item, i) => {
                        const key = `cleaning-${i}-${item}`;
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={materialChecks[key] || false}
                              onChange={e => handleMaterialCheck(key, e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-astro-500 focus:ring-astro-500"
                            />
                            <span className="text-gray-700">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Primary Contact Layer */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Primary Contact Layer</h4>
                  <div className="space-y-2">
                    {materials.primary.map((item, i) => {
                      const key = `primary-${i}-${item}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={materialChecks[key] || false}
                            onChange={e => handleMaterialCheck(key, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-astro-500 focus:ring-astro-500"
                          />
                          <span className="text-gray-700">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Secondary Layer */}
                {materials.secondary.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Secondary Layer</h4>
                    <div className="space-y-2">
                      {materials.secondary.map((item, i) => {
                        const key = `secondary-${i}-${item}`;
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={materialChecks[key] || false}
                              onChange={e => handleMaterialCheck(key, e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-astro-500 focus:ring-astro-500"
                            />
                            <span className="text-gray-700">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Absorbent Layer */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Absorbent Layer</h4>
                  <div className="space-y-2">
                    {materials.absorbent.map((item, i) => {
                      const key = `absorbent-${i}-${item}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={materialChecks[key] || false}
                            onChange={e => handleMaterialCheck(key, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-astro-500 focus:ring-astro-500"
                          />
                          <span className="text-gray-700">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Fixation */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Fixation</h4>
                  <div className="space-y-2">
                    {materials.fixation.map((item, i) => {
                      const key = `fixation-${i}-${item}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={materialChecks[key] || false}
                            onChange={e => handleMaterialCheck(key, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-astro-500 focus:ring-astro-500"
                          />
                          <span className="text-gray-700">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={nextDressingStep}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Continue to Sterile Field
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'sterile_field':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Sterile Field Checklist</h4>
                  <p className="text-sm text-red-600">
                    Complete all checks before proceeding with dressing application.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {STERILE_FIELD_ITEMS.map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    sterileChecks[item.id]
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sterileChecks[item.id] || false}
                    onChange={e => handleSterileCheck(item.id, e.target.checked)}
                    className="w-6 h-6 rounded border-gray-300 text-green-500 focus:ring-green-500 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                    {item.required && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        Required
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {!allSterileChecksComplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                ⚠️ Complete all sterile field checks before proceeding
              </div>
            )}

            <button
              onClick={nextDressingStep}
              disabled={!allSterileChecksComplete}
              className="w-full bg-astro-500 hover:bg-astro-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Continue to Dressing Application
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'dressing_application':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Dressing Application</h4>
                  <p className="text-sm text-green-600">
                    Apply the dressing layers in the correct order.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Layered Dressing Technique</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Contact Layer</h4>
                    <p className="text-sm text-blue-600">Apply non-adherent dressing directly to wound bed</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-purple-800">Capillary Layer</h4>
                    <p className="text-sm text-purple-600">Apply gauze or foam to manage exudate</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-amber-800">Absorbent Layer</h4>
                    <p className="text-sm text-amber-600">Add absorbent pad if needed for heavy exudate</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">4</div>
                  <div>
                    <h4 className="font-medium text-green-800">Fixation Layer</h4>
                    <p className="text-sm text-green-600">Secure with appropriate tape or retention bandage</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={nextDressingStep}
              className="w-full bg-astro-500 hover:bg-astro-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Complete Documentation
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 'post_care':
        // Skip - not in our simplified flow
        setDressingStep('documentation');
        return null;

      case 'documentation':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Dressing Complete</h4>
                  <p className="text-sm text-green-600">
                    Document any observations and provide post-care instructions.
                  </p>
                </div>
              </div>
            </div>

            {/* Infection Signs to Watch */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Signs of Infection to Watch
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {INFECTION_SIGNS.map((sign, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {sign}
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Criteria */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-3">Escalation Criteria</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                {ESCALATION_CRITERIA.map((criteria, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-astro-500 focus:border-transparent resize-none"
                placeholder="Document wound observations, patient response, and any concerns..."
              />
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Dressing Protocol PDF
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                New Session
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
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dressing Protocol</h1>
                <p className="text-xs text-gray-500">Phase-based wound dressing workflow</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between overflow-x-auto">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentDressingStep;
              const isCompleted = idx < currentStepIndex;
              
              return (
                <button
                  key={step.id}
                  onClick={() => isCompleted && setDressingStep(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
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
                  <span className="hidden sm:block text-sm font-medium">{step.label}</span>
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
        {currentStepIndex > 0 && currentDressingStep !== 'documentation' && (
          <div className="mt-4">
            <button
              onClick={prevDressingStep}
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

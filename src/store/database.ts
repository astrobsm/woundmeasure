/**
 * AstroWound-MEASURE IndexedDB Database
 * Offline-first data persistence
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { 
  Patient, 
  Wound, 
  WoundAssessment, 
  ClinicalReport, 
  AppSettings,
  SyncQueueItem,
  DressingSession,
  DressingPainAssessment,
  SterileFieldChecklist,
  MaterialsChecklist,
  DressingProtocol,
  PostDressingCare,
  PainManagementPlan,
} from '@/types';

const DB_NAME = 'astrowound-measure';
const DB_VERSION = 2; // Upgraded for new tables

interface AstroWoundDB {
  patients: Patient;
  wounds: Wound;
  assessments: WoundAssessment;
  reports: ClinicalReport;
  settings: AppSettings;
  syncQueue: SyncQueueItem;
  images: { id: string; data: Blob; type: string };
  // New tables for wound dressing protocol
  dressingSessions: DressingSession;
  painAssessments: DressingPainAssessment;
  sterileFieldChecklists: SterileFieldChecklist;
  materialsChecklists: MaterialsChecklist;
  dressingProtocols: DressingProtocol;
  postDressingCare: PostDressingCare;
  painManagementPlans: PainManagementPlan;
}

let db: IDBPDatabase<AstroWoundDB> | null = null;

export async function initDatabase(): Promise<IDBPDatabase<AstroWoundDB>> {
  if (db) return db;

  db = await openDB<AstroWoundDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Patients store
      if (!database.objectStoreNames.contains('patients')) {
        const patientStore = database.createObjectStore('patients', { keyPath: 'id' });
        patientStore.createIndex('mrn', 'mrn', { unique: true });
        patientStore.createIndex('lastName', 'lastName');
        patientStore.createIndex('createdAt', 'createdAt');
      }

      // Wounds store
      if (!database.objectStoreNames.contains('wounds')) {
        const woundStore = database.createObjectStore('wounds', { keyPath: 'id' });
        woundStore.createIndex('patientId', 'patientId');
        woundStore.createIndex('status', 'status');
        woundStore.createIndex('createdAt', 'createdAt');
      }

      // Assessments store
      if (!database.objectStoreNames.contains('assessments')) {
        const assessmentStore = database.createObjectStore('assessments', { keyPath: 'id' });
        assessmentStore.createIndex('woundId', 'woundId');
        assessmentStore.createIndex('capturedAt', 'capturedAt');
      }

      // Reports store
      if (!database.objectStoreNames.contains('reports')) {
        const reportStore = database.createObjectStore('reports', { keyPath: 'id' });
        reportStore.createIndex('patientId', 'patientId');
        reportStore.createIndex('woundId', 'woundId');
        reportStore.createIndex('generatedAt', 'generatedAt');
      }

      // Settings store
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('createdAt', 'createdAt');
        syncStore.createIndex('type', 'type');
      }

      // Images store (for blob storage)
      if (!database.objectStoreNames.contains('images')) {
        database.createObjectStore('images', { keyPath: 'id' });
      }

      // ============================================
      // New Stores for Wound Dressing Protocol & Pain Management
      // ============================================

      // Dressing sessions store
      if (!database.objectStoreNames.contains('dressingSessions')) {
        const dressingStore = database.createObjectStore('dressingSessions', { keyPath: 'id' });
        dressingStore.createIndex('patientId', 'patientId');
        dressingStore.createIndex('woundId', 'woundId');
        dressingStore.createIndex('createdAt', 'createdAt');
        dressingStore.createIndex('status', 'status');
      }

      // Pain assessments store
      if (!database.objectStoreNames.contains('painAssessments')) {
        const painStore = database.createObjectStore('painAssessments', { keyPath: 'id' });
        painStore.createIndex('patientId', 'patientId');
        painStore.createIndex('dressingSessionId', 'dressingSessionId');
        painStore.createIndex('capturedAt', 'capturedAt');
      }

      // Sterile field checklists store
      if (!database.objectStoreNames.contains('sterileFieldChecklists')) {
        const sterileStore = database.createObjectStore('sterileFieldChecklists', { keyPath: 'id' });
        sterileStore.createIndex('sessionId', 'sessionId');
      }

      // Materials checklists store
      if (!database.objectStoreNames.contains('materialsChecklists')) {
        const materialsStore = database.createObjectStore('materialsChecklists', { keyPath: 'id' });
        materialsStore.createIndex('sessionId', 'sessionId');
      }

      // Dressing protocols store
      if (!database.objectStoreNames.contains('dressingProtocols')) {
        const protocolStore = database.createObjectStore('dressingProtocols', { keyPath: 'id' });
        protocolStore.createIndex('woundPhase', 'woundPhase');
      }

      // Post-dressing care store
      if (!database.objectStoreNames.contains('postDressingCare')) {
        const postCareStore = database.createObjectStore('postDressingCare', { keyPath: 'id' });
        postCareStore.createIndex('sessionId', 'sessionId');
      }

      // Pain management plans store
      if (!database.objectStoreNames.contains('painManagementPlans')) {
        const planStore = database.createObjectStore('painManagementPlans', { keyPath: 'id' });
        planStore.createIndex('patientId', 'patientId');
        planStore.createIndex('woundId', 'woundId');
        planStore.createIndex('createdAt', 'createdAt');
      }
    },
  });

  // Initialize default settings if not exists
  const settings = await db.get('settings', 'default');
  if (!settings) {
    await db.put('settings', {
      id: 'default',
      clinicName: 'AstroWound Clinical Center',
      defaultCalibrationMethod: 'ruler',
      autoSaveEnabled: true,
      qualityThresholds: {
        minBlurScore: 0.7,
        minLightingScore: 0.6,
        minCalibrationConfidence: 0.8,
        maxPerspectiveDistortion: 15,
      },
      measurementPrecision: 2,
    } as AppSettings);
  }

  return db;
}

export async function getDatabase(): Promise<IDBPDatabase<AstroWoundDB>> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// ============================================
// Patient Operations
// ============================================

export async function createPatient(patient: Patient): Promise<void> {
  const database = await getDatabase();
  await database.put('patients', patient);
  await addToSyncQueue('create', 'patients', patient.id, patient);
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  const database = await getDatabase();
  return database.get('patients', id);
}

export async function getPatientByMRN(mrn: string): Promise<Patient | undefined> {
  const database = await getDatabase();
  return database.getFromIndex('patients', 'mrn', mrn);
}

export async function getAllPatients(): Promise<Patient[]> {
  const database = await getDatabase();
  return database.getAll('patients');
}

export async function updatePatient(patient: Patient): Promise<void> {
  const database = await getDatabase();
  patient.updatedAt = new Date();
  await database.put('patients', patient);
  await addToSyncQueue('update', 'patients', patient.id, patient);
}

export async function deletePatient(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('patients', id);
  await addToSyncQueue('delete', 'patients', id, null);
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const patients = await getAllPatients();
  const lowerQuery = query.toLowerCase();
  return patients.filter(p => 
    p.firstName.toLowerCase().includes(lowerQuery) ||
    p.lastName.toLowerCase().includes(lowerQuery) ||
    p.mrn.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// Wound Operations
// ============================================

export async function createWound(wound: Wound): Promise<void> {
  const database = await getDatabase();
  await database.put('wounds', wound);
  await addToSyncQueue('create', 'wounds', wound.id, wound);
}

export async function getWound(id: string): Promise<Wound | undefined> {
  const database = await getDatabase();
  return database.get('wounds', id);
}

export async function getWoundsForPatient(patientId: string): Promise<Wound[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('wounds', 'patientId', patientId);
}

export async function updateWound(wound: Wound): Promise<void> {
  const database = await getDatabase();
  wound.updatedAt = new Date();
  await database.put('wounds', wound);
  await addToSyncQueue('update', 'wounds', wound.id, wound);
}

export async function deleteWound(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('wounds', id);
  await addToSyncQueue('delete', 'wounds', id, null);
}

// ============================================
// Assessment Operations
// ============================================

export async function createAssessment(assessment: WoundAssessment): Promise<void> {
  const database = await getDatabase();
  await database.put('assessments', assessment);
  await addToSyncQueue('create', 'assessments', assessment.id, assessment);
}

export async function getAssessment(id: string): Promise<WoundAssessment | undefined> {
  const database = await getDatabase();
  return database.get('assessments', id);
}

export async function getAssessmentsForWound(woundId: string): Promise<WoundAssessment[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('assessments', 'woundId', woundId);
}

export async function updateAssessment(assessment: WoundAssessment): Promise<void> {
  const database = await getDatabase();
  assessment.updatedAt = new Date();
  await database.put('assessments', assessment);
  await addToSyncQueue('update', 'assessments', assessment.id, assessment);
}

export async function deleteAssessment(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('assessments', id);
  await addToSyncQueue('delete', 'assessments', id, null);
}

// ============================================
// Report Operations
// ============================================

export async function createReport(report: ClinicalReport): Promise<void> {
  const database = await getDatabase();
  await database.put('reports', report);
  await addToSyncQueue('create', 'reports', report.id, report);
}

export async function getReport(id: string): Promise<ClinicalReport | undefined> {
  const database = await getDatabase();
  return database.get('reports', id);
}

export async function getReportsForPatient(patientId: string): Promise<ClinicalReport[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('reports', 'patientId', patientId);
}

export async function getReportsForWound(woundId: string): Promise<ClinicalReport[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('reports', 'woundId', woundId);
}

// ============================================
// Settings Operations
// ============================================

export async function getSettings(): Promise<AppSettings | undefined> {
  const database = await getDatabase();
  return database.get('settings', 'default');
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  const database = await getDatabase();
  const current = await database.get('settings', 'default');
  if (current) {
    await database.put('settings', { ...current, ...settings });
  }
}

// ============================================
// Image Operations
// ============================================

export async function saveImage(id: string, data: Blob, type: string): Promise<void> {
  const database = await getDatabase();
  await database.put('images', { id, data, type });
}

export async function getImage(id: string): Promise<Blob | undefined> {
  const database = await getDatabase();
  const result = await database.get('images', id);
  return result?.data;
}

export async function deleteImage(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('images', id);
}

// ============================================
// Sync Queue Operations
// ============================================

async function addToSyncQueue(
  type: 'create' | 'update' | 'delete',
  table: string,
  recordId: string,
  data: unknown
): Promise<void> {
  const database = await getDatabase();
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    type,
    table: table as keyof typeof db,
    recordId,
    data,
    createdAt: new Date(),
    attempts: 0,
  };
  await database.put('syncQueue', item);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = await getDatabase();
  return database.getAll('syncQueue');
}

export async function removeSyncItem(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('syncQueue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const database = await getDatabase();
  await database.clear('syncQueue');
}

// ============================================
// Export Operations
// ============================================

export async function exportAllData(): Promise<{
  patients: Patient[];
  wounds: Wound[];
  assessments: WoundAssessment[];
  reports: ClinicalReport[];
}> {
  const database = await getDatabase();
  return {
    patients: await database.getAll('patients'),
    wounds: await database.getAll('wounds'),
    assessments: await database.getAll('assessments'),
    reports: await database.getAll('reports'),
  };
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.clear('patients');
  await database.clear('wounds');
  await database.clear('assessments');
  await database.clear('reports');
  await database.clear('syncQueue');
  await database.clear('images');
  // Clear new tables
  await database.clear('dressingSessions');
  await database.clear('painAssessments');
  await database.clear('sterileFieldChecklists');
  await database.clear('materialsChecklists');
  await database.clear('dressingProtocols');
  await database.clear('postDressingCare');
  await database.clear('painManagementPlans');
}

// ============================================
// Dressing Session Operations
// ============================================

export async function createDressingSession(session: DressingSession): Promise<void> {
  const database = await getDatabase();
  await database.put('dressingSessions', session);
  await addToSyncQueue('create', 'dressingSessions', session.id, session);
}

export async function getDressingSession(id: string): Promise<DressingSession | undefined> {
  const database = await getDatabase();
  return database.get('dressingSessions', id);
}

export async function getDressingSessionsForPatient(patientId: string): Promise<DressingSession[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('dressingSessions', 'patientId', patientId);
}

export async function getDressingSessionsForWound(woundId: string): Promise<DressingSession[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('dressingSessions', 'woundId', woundId);
}

export async function updateDressingSession(session: DressingSession): Promise<void> {
  const database = await getDatabase();
  session.updatedAt = new Date();
  await database.put('dressingSessions', session);
  await addToSyncQueue('update', 'dressingSessions', session.id, session);
}

export async function deleteDressingSession(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('dressingSessions', id);
  await addToSyncQueue('delete', 'dressingSessions', id, null);
}

// ============================================
// Pain Assessment Operations
// ============================================

export async function createPainAssessment(assessment: DressingPainAssessment): Promise<void> {
  const database = await getDatabase();
  await database.put('painAssessments', assessment);
  await addToSyncQueue('create', 'painAssessments', assessment.id, assessment);
}

export async function getPainAssessment(id: string): Promise<DressingPainAssessment | undefined> {
  const database = await getDatabase();
  return database.get('painAssessments', id);
}

export async function getPainAssessmentsForPatient(patientId: string): Promise<DressingPainAssessment[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('painAssessments', 'patientId', patientId);
}

export async function updatePainAssessment(assessment: DressingPainAssessment): Promise<void> {
  const database = await getDatabase();
  await database.put('painAssessments', assessment);
  await addToSyncQueue('update', 'painAssessments', assessment.id, assessment);
}

export async function deletePainAssessment(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('painAssessments', id);
  await addToSyncQueue('delete', 'painAssessments', id, null);
}

// ============================================
// Pain Management Plan Operations
// ============================================

export async function createPainManagementPlan(plan: PainManagementPlan): Promise<void> {
  const database = await getDatabase();
  await database.put('painManagementPlans', plan);
  await addToSyncQueue('create', 'painManagementPlans', plan.id, plan);
}

export async function getPainManagementPlan(id: string): Promise<PainManagementPlan | undefined> {
  const database = await getDatabase();
  return database.get('painManagementPlans', id);
}

export async function getPainManagementPlansForPatient(patientId: string): Promise<PainManagementPlan[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('painManagementPlans', 'patientId', patientId);
}

export async function updatePainManagementPlan(plan: PainManagementPlan): Promise<void> {
  const database = await getDatabase();
  plan.updatedAt = new Date();
  await database.put('painManagementPlans', plan);
  await addToSyncQueue('update', 'painManagementPlans', plan.id, plan);
}

export async function deletePainManagementPlan(id: string): Promise<void> {
  const database = await getDatabase();
  await database.delete('painManagementPlans', id);
  await addToSyncQueue('delete', 'painManagementPlans', id, null);
}

// ============================================
// Sterile Field Checklist Operations
// ============================================

export async function createSterileFieldChecklist(checklist: SterileFieldChecklist): Promise<void> {
  const database = await getDatabase();
  await database.put('sterileFieldChecklists', checklist);
}

export async function getSterileFieldChecklist(id: string): Promise<SterileFieldChecklist | undefined> {
  const database = await getDatabase();
  return database.get('sterileFieldChecklists', id);
}

export async function getSterileFieldChecklistForSession(sessionId: string): Promise<SterileFieldChecklist | undefined> {
  const database = await getDatabase();
  const all = await database.getAllFromIndex('sterileFieldChecklists', 'sessionId', sessionId);
  return all[0];
}

// ============================================
// Materials Checklist Operations
// ============================================

export async function createMaterialsChecklist(checklist: MaterialsChecklist): Promise<void> {
  const database = await getDatabase();
  await database.put('materialsChecklists', checklist);
}

export async function getMaterialsChecklist(id: string): Promise<MaterialsChecklist | undefined> {
  const database = await getDatabase();
  return database.get('materialsChecklists', id);
}

export async function getMaterialsChecklistForSession(sessionId: string): Promise<MaterialsChecklist | undefined> {
  const database = await getDatabase();
  const all = await database.getAllFromIndex('materialsChecklists', 'sessionId', sessionId);
  return all[0];
}

// ============================================
// Post-Dressing Care Operations
// ============================================

export async function createPostDressingCare(care: PostDressingCare): Promise<void> {
  const database = await getDatabase();
  await database.put('postDressingCare', care);
}

export async function getPostDressingCare(id: string): Promise<PostDressingCare | undefined> {
  const database = await getDatabase();
  return database.get('postDressingCare', id);
}

export async function getPostDressingCareForSession(sessionId: string): Promise<PostDressingCare | undefined> {
  const database = await getDatabase();
  const all = await database.getAllFromIndex('postDressingCare', 'sessionId', sessionId);
  return all[0];
}

// ============================================
// Dressing Protocol Operations
// ============================================

export async function createDressingProtocol(protocol: DressingProtocol): Promise<void> {
  const database = await getDatabase();
  await database.put('dressingProtocols', protocol);
}

export async function getDressingProtocol(id: string): Promise<DressingProtocol | undefined> {
  const database = await getDatabase();
  return database.get('dressingProtocols', id);
}

export async function getDressingProtocolsForPhase(woundPhase: string): Promise<DressingProtocol[]> {
  const database = await getDatabase();
  return database.getAllFromIndex('dressingProtocols', 'woundPhase', woundPhase);
}

export async function getAllDressingProtocols(): Promise<DressingProtocol[]> {
  const database = await getDatabase();
  return database.getAll('dressingProtocols');
}

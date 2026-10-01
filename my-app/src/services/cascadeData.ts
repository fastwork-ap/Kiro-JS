// Data provider for the cascading dropdowns.
//
// This is the ONE place to swap when connecting to real Dataverse data.
// Each method mirrors a filtered Web API read:
//
//   getDisciplines()                       -> GET /cr123_disciplines
//   getProjectCategories(disciplineId)     -> GET /cr123_projectcategories?$filter=_cr123_disciplineid_value eq {id}
//   getBaselines(projectCategoryId)        -> GET /cr123_baselines?$filter=_cr123_projectcategoryid_value eq {id}
//
// Replace the mock implementation below with calls to the generated Dataverse
// services produced by `pac modelbuilder` / the Power Apps SDK after the data
// source is added to the code app. The CascadeDataProvider interface should not
// need to change.

import type { Baseline, Discipline, IntakeRequest, ProjectCategory } from './types';

export interface CascadeDataProvider {
  getDisciplines(): Promise<Discipline[]>;
  getProjectCategories(disciplineId: string): Promise<ProjectCategory[]>;
  getBaselines(projectCategoryId: string): Promise<Baseline[]>;
  submitIntake(request: IntakeRequest): Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Mock data — remove once wired to Dataverse.
// ---------------------------------------------------------------------------

const DISCIPLINES: Discipline[] = [
  { id: 'd-elec', name: 'Electrical' },
  { id: 'd-mech', name: 'Mechanical' },
  { id: 'd-civil', name: 'Civil / Structural' },
];

const PROJECT_CATEGORIES: ProjectCategory[] = [
  // Electrical
  { id: 'pc-e-newbuild', name: 'New Build', disciplineId: 'd-elec' },
  { id: 'pc-e-retrofit', name: 'Retrofit', disciplineId: 'd-elec' },
  { id: 'pc-e-maint', name: 'Maintenance', disciplineId: 'd-elec' },
  // Mechanical
  { id: 'pc-m-newbuild', name: 'New Build', disciplineId: 'd-mech' },
  { id: 'pc-m-upgrade', name: 'Cooling Upgrade', disciplineId: 'd-mech' },
  // Civil
  { id: 'pc-c-sitework', name: 'Site Works', disciplineId: 'd-civil' },
  { id: 'pc-c-struct', name: 'Structural', disciplineId: 'd-civil' },
];

const BASELINES: Baseline[] = [
  // Electrical / New Build
  { id: 'b-1', name: 'Baseline 2026 Q1', projectCategoryId: 'pc-e-newbuild' },
  { id: 'b-2', name: 'Baseline 2026 Q2', projectCategoryId: 'pc-e-newbuild' },
  // Electrical / Retrofit
  { id: 'b-3', name: 'Retrofit Baseline A', projectCategoryId: 'pc-e-retrofit' },
  { id: 'b-4', name: 'Retrofit Baseline B', projectCategoryId: 'pc-e-retrofit' },
  // Electrical / Maintenance
  { id: 'b-5', name: 'Annual PM Baseline', projectCategoryId: 'pc-e-maint' },
  // Mechanical / New Build
  { id: 'b-6', name: 'Mech NB Baseline 2026', projectCategoryId: 'pc-m-newbuild' },
  // Mechanical / Cooling Upgrade
  { id: 'b-7', name: 'Chiller Upgrade Baseline', projectCategoryId: 'pc-m-upgrade' },
  // Civil / Site Works
  { id: 'b-8', name: 'Sitework Baseline 2026', projectCategoryId: 'pc-c-sitework' },
  // Civil / Structural
  { id: 'b-9', name: 'Structural Baseline 2026', projectCategoryId: 'pc-c-struct' },
];

function delay<T>(value: T, ms = 250): Promise<T> {
  // Simulates async latency so loading states are exercised.
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockCascadeProvider: CascadeDataProvider = {
  getDisciplines() {
    return delay([...DISCIPLINES]);
  },
  getProjectCategories(disciplineId: string) {
    return delay(PROJECT_CATEGORIES.filter((c) => c.disciplineId === disciplineId));
  },
  getBaselines(projectCategoryId: string) {
    return delay(BASELINES.filter((b) => b.projectCategoryId === projectCategoryId));
  },
  submitIntake(request: IntakeRequest) {
    // Mock submit — logs and returns a fake id. Replace with Dataverse create.
    console.log('Submitting intake request:', request);
    return delay({ id: `mock-${Date.now()}` });
  },
};

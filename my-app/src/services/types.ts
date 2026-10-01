// Typed models that mirror the Dataverse tables described in DATAVERSE-SETUP.md.
// Field names are kept close to the Dataverse structure so that swapping the
// mock data provider for the generated Dataverse client is a small change.

/** Discipline (parent). Dataverse: cr123_discipline */
export interface Discipline {
  id: string;
  name: string;
}

/** Project Category (child of Discipline). Dataverse: cr123_projectcategory */
export interface ProjectCategory {
  id: string;
  name: string;
  /** FK -> Discipline. Web API: _cr123_disciplineid_value */
  disciplineId: string;
}

/** Baseline (child of Project Category). Dataverse: cr123_baseline */
export interface Baseline {
  id: string;
  name: string;
  /** FK -> Project Category. Web API: _cr123_projectcategoryid_value */
  projectCategoryId: string;
}

/** The record the form submits (optional Intake Request table). */
export interface IntakeRequest {
  title: string;
  disciplineId: string;
  projectCategoryId: string;
  baselineId: string;
  description?: string;
  requestStatus: RequestStatus;
}

export type RequestStatus =
  | 'Draft'
  | 'Pending L1 Approval'
  | 'Pending L2 Approval'
  | 'Approved'
  | 'Declined by L1 Approver'
  | 'Declined by L2 Approver';

export const REQUEST_STATUSES: RequestStatus[] = [
  'Draft',
  'Pending L1 Approval',
  'Pending L2 Approval',
  'Approved',
  'Declined by L1 Approver',
  'Declined by L2 Approver',
];

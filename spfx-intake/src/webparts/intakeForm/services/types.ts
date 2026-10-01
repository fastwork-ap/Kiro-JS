// Typed models for the cascade. Ids are the SharePoint list item Ids (as strings).

export interface Discipline {
  id: string;
  name: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  disciplineId: string;
}

export interface Baseline {
  id: string;
  name: string;
  projectCategoryId: string;
}

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

export interface CascadeDataProvider {
  getDisciplines(): Promise<Discipline[]>;
  getProjectCategories(disciplineId: string): Promise<ProjectCategory[]>;
  getBaselines(projectCategoryId: string): Promise<Baseline[]>;
  submitIntake(request: IntakeRequest): Promise<{ id: string }>;
}

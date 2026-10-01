// SharePoint-backed implementation of CascadeDataProvider.
//
// Reads the Discipline -> ProjectCategory -> Baseline cascade from the three
// lists on the AmazonProjectsPK site and submits selections to IntakeList.
//
// Cascade filtering uses the lookup FK Id columns via OData $filter:
//   ProjectCategory?$filter=DisciplineId eq {disciplineId}
//   Baseline?$filter=ProjectCategoryId eq {projectCategoryId}
//
// NOTE ON AUTH / HOSTING:
// Calling the SharePoint REST API from the browser requires an authenticated,
// same-origin (or properly CORS-/token-configured) context. This provider is
// written to work when the app runs in a SharePoint-authenticated context
// (e.g. hosted as an SPFx web part, or a Power App using the SharePoint
// connector where fetch carries the user's auth). Running the standalone Vite
// dev server against it directly will be blocked by SharePoint auth/CORS — use
// the mock provider for pure local UI work and switch to this provider in the
// deployed/connected context.

import type {
  Baseline,
  Discipline,
  IntakeRequest,
  ProjectCategory,
} from './types';
import type { CascadeDataProvider } from './cascadeData';
import { listApi, sharepointConfig } from './sharepointConfig';

interface SpListItem {
  Id: number;
  Title: string;
  Status?: string;
  DisciplineId?: number;
  ProjectCategoryId?: number;
}

interface SpListResponse {
  value?: SpListItem[]; // modern (OData v4-ish) shape
  d?: { results: SpListItem[] }; // classic ($metadata) shape
}

const JSON_HEADERS = {
  Accept: 'application/json;odata=nometadata',
} as const;

async function getJson(url: string): Promise<SpListResponse> {
  const res = await fetch(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    credentials: 'include', // send the SharePoint auth cookie
  });
  if (!res.ok) {
    throw new Error(`SharePoint GET failed (${res.status}): ${await safeText(res)}`);
  }
  return (await res.json()) as SpListResponse;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

function rows(resp: SpListResponse): SpListItem[] {
  return resp.value ?? resp.d?.results ?? [];
}

/** Appends the Active-status filter when configured. */
function withActiveFilter(filter?: string): string {
  const parts: string[] = [];
  if (filter) parts.push(filter);
  if (sharepointConfig.activeOnly) parts.push(`Status eq 'Active'`);
  if (parts.length === 0) return '';
  return `&$filter=${encodeURIComponent(parts.join(' and '))}`;
}

async function getRequestDigest(): Promise<string> {
  // Required by SharePoint for POST (write) operations.
  const res = await fetch(`${sharepointConfig.siteUrl}/_api/contextinfo`, {
    method: 'POST',
    headers: { Accept: 'application/json;odata=nometadata' },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to get request digest (${res.status})`);
  }
  const data = (await res.json()) as {
    FormDigestValue?: string;
    d?: { GetContextWebInformation?: { FormDigestValue?: string } };
  };
  const digest =
    data.FormDigestValue ?? data.d?.GetContextWebInformation?.FormDigestValue;
  if (!digest) throw new Error('Request digest not found in contextinfo response');
  return digest;
}

export const sharepointCascadeProvider: CascadeDataProvider = {
  async getDisciplines(): Promise<Discipline[]> {
    const url =
      `${listApi(sharepointConfig.lists.discipline)}/items` +
      `?$select=Id,Title,Status&$orderby=Title asc&$top=500` +
      withActiveFilter();
    const resp = await getJson(url);
    return rows(resp).map((r) => ({ id: String(r.Id), name: r.Title }));
  },

  async getProjectCategories(disciplineId: string): Promise<ProjectCategory[]> {
    const url =
      `${listApi(sharepointConfig.lists.projectCategory)}/items` +
      `?$select=Id,Title,Status,DisciplineId&$orderby=Title asc&$top=500` +
      withActiveFilter(`DisciplineId eq ${Number(disciplineId)}`);
    const resp = await getJson(url);
    return rows(resp).map((r) => ({
      id: String(r.Id),
      name: r.Title,
      disciplineId: String(r.DisciplineId ?? ''),
    }));
  },

  async getBaselines(projectCategoryId: string): Promise<Baseline[]> {
    const url =
      `${listApi(sharepointConfig.lists.baseline)}/items` +
      `?$select=Id,Title,Status,ProjectCategoryId&$orderby=Title asc&$top=500` +
      withActiveFilter(`ProjectCategoryId eq ${Number(projectCategoryId)}`);
    const resp = await getJson(url);
    return rows(resp).map((r) => ({
      id: String(r.Id),
      name: r.Title,
      projectCategoryId: String(r.ProjectCategoryId ?? ''),
    }));
  },

  async submitIntake(request: IntakeRequest): Promise<{ id: string }> {
    const digest = await getRequestDigest();
    const body: Record<string, unknown> = {
      Title: request.title,
      DisciplineId: Number(request.disciplineId),
      ProjectCategoryId: Number(request.projectCategoryId),
      BaselineId: Number(request.baselineId),
      RequestStatus: request.requestStatus,
    };
    if (request.description) {
      body.Description = request.description;
    }
    const res = await fetch(`${listApi(sharepointConfig.lists.intake)}/items`, {
      method: 'POST',
      headers: {
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata',
        'X-RequestDigest': digest,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(
        `IntakeList create failed (${res.status}): ${await safeText(res)}`,
      );
    }
    const created = (await res.json()) as SpListItem;
    return { id: String(created.Id ?? '') };
  },
};

import {
  SPHttpClient,
  SPHttpClientResponse,
  ISPHttpClientOptions,
} from '@microsoft/sp-http';
import type {
  Baseline,
  CascadeDataProvider,
  Discipline,
  IntakeRequest,
  ProjectCategory,
} from './types';

// List titles on the AmazonProjectsPK site.
const LISTS = {
  discipline: 'Discipline',
  projectCategory: 'ProjectCategory',
  baseline: 'Baseline',
  intake: 'IntakeList',
};

// Only show rows whose Status choice is 'Active' in the cascade dropdowns.
const ACTIVE_ONLY = true;

interface SpItem {
  Id: number;
  Title: string;
  Status?: string;
  DisciplineId?: number;
  ProjectCategoryId?: number;
}

interface SpItemsResponse {
  value: SpItem[];
}

/**
 * SharePoint-backed cascade provider for SPFx. Uses SPHttpClient so requests
 * carry the signed-in user's auth and writes get a request digest automatically.
 */
export class SharePointCascadeProvider implements CascadeDataProvider {
  public constructor(
    private readonly client: SPHttpClient,
    private readonly webUrl: string,
  ) {}

  private listApi(listTitle: string): string {
    return `${this.webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
      listTitle,
    )}')`;
  }

  private withActiveFilter(filter?: string): string {
    const parts: string[] = [];
    if (filter) parts.push(filter);
    if (ACTIVE_ONLY) parts.push(`Status eq 'Active'`);
    if (parts.length === 0) return '';
    return `&$filter=${encodeURIComponent(parts.join(' and '))}`;
  }

  private async getItems(url: string): Promise<SpItem[]> {
    const res: SPHttpClientResponse = await this.client.get(
      url,
      SPHttpClient.configurations.v1,
    );
    if (!res.ok) {
      throw new Error(`SharePoint GET failed (${res.status}): ${await res.text()}`);
    }
    const json = (await res.json()) as SpItemsResponse;
    return json.value ?? [];
  }

  public async getDisciplines(): Promise<Discipline[]> {
    const url =
      `${this.listApi(LISTS.discipline)}/items` +
      `?$select=Id,Title,Status&$orderby=Title asc&$top=500` +
      this.withActiveFilter();
    const items = await this.getItems(url);
    return items.map((r) => ({ id: String(r.Id), name: r.Title }));
  }

  public async getProjectCategories(disciplineId: string): Promise<ProjectCategory[]> {
    const url =
      `${this.listApi(LISTS.projectCategory)}/items` +
      `?$select=Id,Title,Status,DisciplineId&$orderby=Title asc&$top=500` +
      this.withActiveFilter(`DisciplineId eq ${Number(disciplineId)}`);
    const items = await this.getItems(url);
    return items.map((r) => ({
      id: String(r.Id),
      name: r.Title,
      disciplineId: String(r.DisciplineId ?? ''),
    }));
  }

  public async getBaselines(projectCategoryId: string): Promise<Baseline[]> {
    const url =
      `${this.listApi(LISTS.baseline)}/items` +
      `?$select=Id,Title,Status,ProjectCategoryId&$orderby=Title asc&$top=500` +
      this.withActiveFilter(`ProjectCategoryId eq ${Number(projectCategoryId)}`);
    const items = await this.getItems(url);
    return items.map((r) => ({
      id: String(r.Id),
      name: r.Title,
      projectCategoryId: String(r.ProjectCategoryId ?? ''),
    }));
  }

  public async submitIntake(request: IntakeRequest): Promise<{ id: string }> {
    const body: { [key: string]: unknown } = {
      Title: request.title,
      DisciplineId: Number(request.disciplineId),
      ProjectCategoryId: Number(request.projectCategoryId),
      BaselineId: Number(request.baselineId),
      RequestStatus: request.requestStatus,
    };
    if (request.description) {
      body.Description = request.description;
    }

    const options: ISPHttpClientOptions = {
      headers: {
        Accept: 'application/json;odata=nometadata',
        'Content-Type': 'application/json;odata=nometadata',
      },
      body: JSON.stringify(body),
    };

    const res: SPHttpClientResponse = await this.client.post(
      `${this.listApi(LISTS.intake)}/items`,
      SPHttpClient.configurations.v1,
      options,
    );
    if (!res.ok) {
      throw new Error(
        `IntakeList create failed (${res.status}): ${await res.text()}`,
      );
    }
    const created = (await res.json()) as SpItem;
    return { id: String(created.Id ?? '') };
  }
}

// SharePoint connection settings for the cascading intake form POC.
//
// The three cascade lists and the submission list all live on the
// AmazonProjectsPK site. Lookup columns are filtered by their FK Id field
// (e.g. DisciplineId) via the SharePoint REST API.

export const sharepointConfig = {
  /** Site that hosts the lists. */
  siteUrl: 'https://amazon.sharepoint.com/sites/AmazonProjectsPK',

  /** List (title) names. */
  lists: {
    discipline: 'Discipline',
    projectCategory: 'ProjectCategory',
    baseline: 'Baseline',
    intake: 'IntakeList',
  },

  /**
   * Only return rows whose Status choice is "Active" in the cascade dropdowns.
   * Set to false to show every row regardless of Status.
   */
  activeOnly: true,
} as const;

/** Builds the REST base: {siteUrl}/_api/web/lists/getbytitle('{list}') */
export function listApi(listTitle: string): string {
  return `${sharepointConfig.siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
    listTitle,
  )}')`;
}

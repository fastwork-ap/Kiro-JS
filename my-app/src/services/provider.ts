// Chooses which CascadeDataProvider the app uses.
//
// Set VITE_DATA_SOURCE=sharepoint (e.g. in a .env file or the deployed
// environment) to query the live SharePoint lists. Anything else — including
// the default when unset — uses the mock provider so the UI runs locally
// without SharePoint auth.
//
// When the POC later moves to Dataverse, add a 'dataverse' case here that
// returns a DataverseCascadeProvider implementing the same interface.

import type { CascadeDataProvider } from './cascadeData';
import { mockCascadeProvider } from './cascadeData';
import { sharepointCascadeProvider } from './sharepointCascade';

const source = (import.meta.env.VITE_DATA_SOURCE ?? 'mock').toLowerCase();

export const dataProvider: CascadeDataProvider =
  source === 'sharepoint' ? sharepointCascadeProvider : mockCascadeProvider;

export const dataSourceName = source === 'sharepoint' ? 'SharePoint' : 'Mock';

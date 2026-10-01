import { useEffect, useState } from 'react';
import type { CascadeDataProvider } from '../services/cascadeData';
import { dataProvider } from '../services/provider';
import type {
  Baseline,
  Discipline,
  ProjectCategory,
  RequestStatus,
} from '../services/types';
import { REQUEST_STATUSES } from '../services/types';

interface Props {
  /**
   * Data source. Defaults to the configured provider (mock or SharePoint,
   * per VITE_DATA_SOURCE). Pass explicitly to override, e.g. in tests.
   */
  provider?: CascadeDataProvider;
}

export function CascadingIntakeForm({ provider = dataProvider }: Props) {
  // --- cascade option lists ---
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);

  // --- selected values ---
  const [disciplineId, setDisciplineId] = useState('');
  const [projectCategoryId, setProjectCategoryId] = useState('');
  const [baselineId, setBaselineId] = useState('');

  // --- other form fields ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('Draft');

  // --- loading / status flags ---
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBaselines, setLoadingBaselines] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Load disciplines once on mount.
  useEffect(() => {
    let active = true;
    provider.getDisciplines().then((d) => {
      if (active) setDisciplines(d);
    });
    return () => {
      active = false;
    };
  }, [provider]);

  // When Discipline changes: load its categories, reset downstream selections.
  useEffect(() => {
    setProjectCategoryId('');
    setBaselineId('');
    setCategories([]);
    setBaselines([]);
    if (!disciplineId) return;

    let active = true;
    setLoadingCategories(true);
    provider
      .getProjectCategories(disciplineId)
      .then((c) => {
        if (active) setCategories(c);
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });
    return () => {
      active = false;
    };
  }, [disciplineId, provider]);

  // When Project Category changes: load its baselines, reset baseline selection.
  useEffect(() => {
    setBaselineId('');
    setBaselines([]);
    if (!projectCategoryId) return;

    let active = true;
    setLoadingBaselines(true);
    provider
      .getBaselines(projectCategoryId)
      .then((b) => {
        if (active) setBaselines(b);
      })
      .finally(() => {
        if (active) setLoadingBaselines(false);
      });
    return () => {
      active = false;
    };
  }, [projectCategoryId, provider]);

  const canSubmit =
    title.trim() !== '' &&
    disciplineId !== '' &&
    projectCategoryId !== '' &&
    baselineId !== '' &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { id } = await provider.submitIntake({
        title: title.trim(),
        disciplineId,
        projectCategoryId,
        baselineId,
        description: description.trim() || undefined,
        requestStatus,
      });
      setResult({ ok: true, message: `Request submitted (id: ${id}).` });
      // Reset the form after a successful submit.
      setTitle('');
      setDescription('');
      setRequestStatus('Draft');
      setDisciplineId('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setResult({ ok: false, message: `Submit failed: ${message}` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="intake-form" onSubmit={handleSubmit} noValidate>
      <h1>Project Request Intake</h1>

      <label className="field">
        <span>
          Title <em>*</em>
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short request title"
          required
        />
      </label>

      <label className="field">
        <span>
          Discipline <em>*</em>
        </span>
        <select
          value={disciplineId}
          onChange={(e) => setDisciplineId(e.target.value)}
          required
        >
          <option value="">-- Select a discipline --</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          Project Category <em>*</em>
        </span>
        <select
          value={projectCategoryId}
          onChange={(e) => setProjectCategoryId(e.target.value)}
          disabled={!disciplineId || loadingCategories}
          required
        >
          <option value="">
            {!disciplineId
              ? '-- Select a discipline first --'
              : loadingCategories
                ? 'Loading...'
                : '-- Select a category --'}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          Baseline <em>*</em>
        </span>
        <select
          value={baselineId}
          onChange={(e) => setBaselineId(e.target.value)}
          disabled={!projectCategoryId || loadingBaselines}
          required
        >
          <option value="">
            {!projectCategoryId
              ? '-- Select a category first --'
              : loadingBaselines
                ? 'Loading...'
                : '-- Select a baseline --'}
          </option>
          {baselines.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional details"
        />
      </label>

      <label className="field">
        <span>Request Status</span>
        <select
          value={requestStatus}
          onChange={(e) => setRequestStatus(e.target.value as RequestStatus)}
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={!canSubmit}>
        {submitting ? 'Submitting...' : 'Submit Request'}
      </button>

      {result && (
        <p className={result.ok ? 'form-msg ok' : 'form-msg err'} role="status">
          {result.message}
        </p>
      )}
    </form>
  );
}

import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './CascadingIntakeForm.module.scss';
import type {
  Baseline,
  CascadeDataProvider,
  Discipline,
  ProjectCategory,
  RequestStatus,
} from '../services/types';
import { REQUEST_STATUSES } from '../services/types';

export interface ICascadingIntakeFormProps {
  provider: CascadeDataProvider;
}

export const CascadingIntakeForm: React.FC<ICascadingIntakeFormProps> = ({ provider }) => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);

  const [disciplineId, setDisciplineId] = useState('');
  const [projectCategoryId, setProjectCategoryId] = useState('');
  const [baselineId, setBaselineId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('Draft');

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBaselines, setLoadingBaselines] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | undefined>(undefined);

  // Load disciplines once on mount.
  useEffect(() => {
    let active = true;
    provider
      .getDisciplines()
      .then((d) => {
        if (active) setDisciplines(d);
      })
      .catch((e) => setResult({ ok: false, message: `Failed to load disciplines: ${String(e)}` }));
    return () => {
      active = false;
    };
  }, [provider]);

  // Discipline change -> load categories, reset downstream.
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
      .catch((e) => setResult({ ok: false, message: `Failed to load categories: ${String(e)}` }))
      .then(() => {
        if (active) setLoadingCategories(false);
      });
    return () => {
      active = false;
    };
  }, [disciplineId, provider]);

  // Project category change -> load baselines, reset baseline.
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
      .catch((e) => setResult({ ok: false, message: `Failed to load baselines: ${String(e)}` }))
      .then(() => {
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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(undefined);
    try {
      const { id } = await provider.submitIntake({
        title: title.trim(),
        disciplineId,
        projectCategoryId,
        baselineId,
        description: description.trim() || undefined,
        requestStatus,
      });
      setResult({ ok: true, message: `Request submitted (item #${id}).` });
      setTitle('');
      setDescription('');
      setRequestStatus('Draft');
      setDisciplineId('');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({ ok: false, message: `Submit failed: ${message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.intakeForm} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Project Request Intake</h2>

      <label className={styles.field}>
        <span>Title <em>*</em></span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short request title"
        />
      </label>

      <label className={styles.field}>
        <span>Discipline <em>*</em></span>
        <select value={disciplineId} onChange={(e) => setDisciplineId(e.target.value)}>
          <option value="">-- Select a discipline --</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Project Category <em>*</em></span>
        <select
          value={projectCategoryId}
          onChange={(e) => setProjectCategoryId(e.target.value)}
          disabled={!disciplineId || loadingCategories}
        >
          <option value="">
            {!disciplineId
              ? '-- Select a discipline first --'
              : loadingCategories
                ? 'Loading...'
                : '-- Select a category --'}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Baseline <em>*</em></span>
        <select
          value={baselineId}
          onChange={(e) => setBaselineId(e.target.value)}
          disabled={!projectCategoryId || loadingBaselines}
        >
          <option value="">
            {!projectCategoryId
              ? '-- Select a category first --'
              : loadingBaselines
                ? 'Loading...'
                : '-- Select a baseline --'}
          </option>
          {baselines.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional details"
        />
      </label>

      <label className={styles.field}>
        <span>Request Status</span>
        <select value={requestStatus} onChange={(e) => setRequestStatus(e.target.value as RequestStatus)}>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <button type="submit" className={styles.submit} disabled={!canSubmit}>
        {submitting ? 'Submitting...' : 'Submit Request'}
      </button>

      {result && (
        <p className={result.ok ? styles.msgOk : styles.msgErr} role="status">
          {result.message}
        </p>
      )}
    </form>
  );
};

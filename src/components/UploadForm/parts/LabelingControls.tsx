import React from 'react';

type UiLabelType = 'classification' | 'bounding_box' | 'segmentation' | 'text_classification';

const LABEL_TYPE_MAP: Record<UiLabelType, string> = {
  classification: 'IMAGE_CLASSIFICATION',
  bounding_box: 'BOUNDING_BOX',
  segmentation: 'SEMANTIC_SEGMENTATION',
  text_classification: 'TEXT_CLASSIFICATION',
};

type Workteam = { arn: string; name?: string };

interface LabelingControlsProps {
  workteamArn: string | null;
  setWorkteamArn: (arn: string | null) => void;
  getToken: () => string | null;
}

const S = {
  root: { marginTop: 20, display: 'grid', gap: 16 } as React.CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } as React.CSSProperties,
  fieldset: {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
  } as React.CSSProperties,
  legend: { fontWeight: 600, padding: '0 6px' } as React.CSSProperties,
  select: { padding: '6px 8px', minWidth: 280 } as React.CSSProperties,
  input: { padding: '6px 8px', minWidth: 360 } as React.CSSProperties,
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTop: '1px solid #eef2f7',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  subtle: { color: '#6b7280', fontSize: 12 } as React.CSSProperties,
};

function nameFromArn(arn: string) {
  const last = arn.split('/').pop();
  return last || arn;
}

export const LabelingControls: React.FC<LabelingControlsProps> = ({
  workteamArn,
  setWorkteamArn,
  getToken,
}) => {
  // moved next to Start Labeling (see footer)
  const [labelType, setLabelType] = React.useState<UiLabelType>('classification');
  const [busy, setBusy] = React.useState(false);

  const [teams, setTeams] = React.useState<Workteam[]>([]);
  const [teamsBusy, setTeamsBusy] = React.useState(false);
  const [teamsError, setTeamsError] = React.useState<string | null>(null);

  const [mode, setMode] = React.useState<'existing' | 'create'>('existing');
  const [manualArn, setManualArn] = React.useState('');

  const createApiBase = process.env.REACT_APP_CREATE_WORKER_TRIGGER_API_URL;
  const labelTriggerBase = process.env.REACT_APP_LABELLING_TRIGGER_API_URL;

  const getHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    } as HeadersInit;
  };

  const normalizeTeams = (raw: any): Workteam[] => {
    const toTeam = (t: any): Workteam | null => {
      if (!t) return null;
      if (typeof t === 'string') return { arn: t, name: nameFromArn(t) };
      if (t.arn)
        return { arn: String(t.arn), name: t.name ? String(t.name) : nameFromArn(String(t.arn)) };
      return null;
    };
    if (Array.isArray(raw)) return raw.map(toTeam).filter(Boolean) as Workteam[];
    if (Array.isArray(raw?.teams)) return raw.teams.map(toTeam).filter(Boolean) as Workteam[];
    return [];
  };

  const fetchTeams = async () => {
    if (!createApiBase) {
      setTeamsError('Missing REACT_APP_CREATE_WORKER_TRIGGER_API_URL for listing teams.');
      return;
    }
    try {
      setTeamsBusy(true);
      setTeamsError(null);
      const res = await fetch(`${createApiBase}list`, { method: 'GET', headers: getHeaders() });
      if (!res.ok) throw new Error(`List teams failed (${res.status})`);
      const json = await res.json();
      const list = normalizeTeams(json);
      setTeams(list);
      if (!workteamArn && list.length > 0) setWorkteamArn(list[0].arn);
    } catch (e: any) {
      console.error(e);
      setTeamsError(e?.message || 'Failed to load teams');
    } finally {
      setTeamsBusy(false);
    }
  };

  React.useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateLabelingTeam = async () => {
    try {
      setBusy(true);
      const res = await fetch(
        createApiBase
          ? `${createApiBase}create`
          : 'https://arfuln1xie.execute-api.us-east-1.amazonaws.com/prod/trigger',
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            input: {
              user: 'john.doe@example.com',
              timestamp: new Date().toISOString(),
              workteamArn,
            },
          }),
        }
      );
      const resJson = await res.json();
      const arn = resJson?.workteamArn;
      if (!arn) {
        console.error('Missing workteam ARN in response', resJson);
        alert('❌ Failed to retrieve workteam ARN');
        return;
      }
      setWorkteamArn(arn);
      fetchTeams();
      alert('✅ Labeling team created!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to create labeling team');
    } finally {
      setBusy(false);
    }
  };

  const handleStartLabeling = async () => {
    try {
      const chosenArn = manualArn.trim() || workteamArn;
      if (!chosenArn) {
        alert('⚠️ Please select or paste a workteam ARN first.');
        return;
      }
      setBusy(true);
      const labelTypeForBackend = LABEL_TYPE_MAP[labelType];
      const res = await fetch(
        labelTriggerBase
          ? `${labelTriggerBase}trigger`
          : 'https://arfuln1xie.execute-api.us-east-1.amazonaws.com/prod/trigger',
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            input: {
              user: 'john.doe@example.com',
              timestamp: new Date().toISOString(),
              workteamArn: chosenArn,
              labelType: labelTypeForBackend,
              labelType_ui: labelType,
            },
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to start labeling job');
      const data = await res.json();
      alert(`✅ Labeling job started!\nJobId: ${data.jobId}`);
    } catch (err) {
      console.error(err);
      alert('❌ Failed to start labeling job');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.root}>
      {/* Existing team box */}
      <fieldset style={S.fieldset}>
        <legend style={S.legend}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="team-mode"
              checked={mode === 'existing'}
              onChange={() => setMode('existing')}
              disabled={busy}
            />
            Use existing team
          </label>
        </legend>

        <div style={{ display: 'grid', gap: 12, opacity: mode === 'existing' ? 1 : 0.5 }}>
          <div style={S.row}>
            <label>
              <span style={{ marginRight: 8 }}>Workteam:</span>
              <select
                value={workteamArn ?? ''}
                onChange={(e) => setWorkteamArn(e.target.value || null)}
                disabled={teamsBusy || busy || mode !== 'existing'}
                style={S.select}
                aria-label="Select workteam"
              >
                {teams.length === 0 && <option value="">— No teams found —</option>}
                {teams.map((t) => (
                  <option key={t.arn} value={t.arn}>
                    {t.name ?? nameFromArn(t.arn)}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={fetchTeams} disabled={teamsBusy || busy}>
              {teamsBusy ? 'Loading...' : 'Reload Teams'}
            </button>
          </div>

          <div style={S.row}>
            <span style={S.subtle}>or paste ARN</span>
            <input
              type="text"
              placeholder="arn:aws:sagemaker:region:acct:workteam/private-crowd/…"
              value={manualArn}
              onChange={(e) => setManualArn(e.target.value)}
              disabled={busy}
              style={S.input}
            />
          </div>

          {teamsError && (
            <div style={{ color: 'crimson', fontSize: 12 }} title={teamsError}>
              {teamsError}
            </div>
          )}
        </div>
      </fieldset>

      {/* Create team box */}
      <fieldset style={S.fieldset}>
        <legend style={S.legend}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input
              type="radio"
              name="team-mode"
              checked={mode === 'create'}
              onChange={() => setMode('create')}
              disabled={busy}
            />
            Create new team
          </label>
        </legend>

        <div style={{ opacity: mode === 'create' ? 1 : 0.5 }}>
          <div style={S.row}>
            <button onClick={handleCreateLabelingTeam} disabled={busy}>
              {busy ? 'Working...' : 'Create Labeling Team'}
            </button>
            <span style={S.subtle}>A new SageMaker private workteam will be created.</span>
          </div>
        </div>
      </fieldset>

      {/* Footer: Start labeling WITH type selector inline */}
      <div style={S.footer}>
        <span>Start labeling for:</span>
        <select
          value={labelType}
          onChange={(e) => setLabelType(e.target.value as UiLabelType)}
          disabled={busy}
          aria-label="Select label type"
          style={S.select}
        >
          <option value="classification">classification</option>
          <option value="bounding_box">bounding_box</option>
          <option value="segmentation">segmentation</option>
          <option value="text_classification">text_classification</option>
        </select>

        <button
          onClick={handleStartLabeling}
          disabled={busy}
          title={!manualArn && !workteamArn ? 'Select or paste a workteam ARN first' : ''}
        >
          {busy ? 'Working...' : 'Start Labeling'}
        </button>
      </div>
    </div>
  );
};

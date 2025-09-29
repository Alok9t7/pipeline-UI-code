import React, { useMemo, useRef, useState } from 'react';

type InferenceProbResponse = { probabilities: number[]; [k: string]: any };
type InferenceClassResponse = { classIndex: number; probability?: number; [k: string]: any };
type InferenceRawResponse = { raw: string } | Record<string, any>;
type InferenceResponse = InferenceProbResponse | InferenceClassResponse | InferenceRawResponse;

type InferencePanelProps = {
  /** Supply your auth token getter from useAuthToken */
  getToken: () => string | null;
};

const MAX_FILE_MB = Number(process.env.REACT_APP_INFERENCE_MAX_MB || 10);
const ACCEPTED_MIME = (process.env.REACT_APP_INFERENCE_ACCEPT || 'image/jpeg,image/png,image/webp')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const InferencePanel: React.FC<InferencePanelProps> = ({ getToken }) => {
  // Inference state
  const [inferenceFile, setInferenceFile] = useState<File | null>(null);
  const [inferencePreview, setInferencePreview] = useState<string | null>(null);
  const [inferring, setInferring] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [inferenceResult, setInferenceResult] = useState<InferenceResponse | null>(null);
  const [topK, setTopK] = useState<number>(5);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional: class labels via env (comma-separated)
  const classLabels = useMemo(() => {
    const raw = process.env.REACT_APP_CLASS_LABELS; // e.g., "cat,dog,bird,car,plane"
    return (raw ? raw.split(',').map((s) => s.trim()) : []) as string[];
  }, []);

  // ---------- Helpers ----------
  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const result = r.result as string;
        const base64 = result.includes(',') ? result.split(',').pop()! : result;
        resolve(base64);
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Allowed: ${ACCEPTED_MIME.join(', ')}`;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      return `File too large: ${sizeMB.toFixed(2)} MB (max ${MAX_FILE_MB} MB)`;
    }
    return null;
  };

  const handleChooseFile = (f: File | null) => {
    setInferenceError(null);
    setInferenceResult(null);
    setInferencePreview(null);
    setInferenceFile(null);
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setInferenceError(err);
      return;
    }
    setInferenceFile(f);
    const url = URL.createObjectURL(f);
    setInferencePreview(url);
  };

  const clearInference = () => {
    setInferenceFile(null);
    setInferencePreview(null);
    setInferenceResult(null);
    setInferenceError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runInference = async () => {
    setInferenceError(null);
    setInferenceResult(null);

    const apiUrl = process.env.REACT_APP_INFERENCE_API_URL; // should end with /predict
    if (!apiUrl) {
      setInferenceError('Inference API URL is not configured (REACT_APP_INFERENCE_API_URL).');
      return;
    }
    if (!inferenceFile) {
      setInferenceError('Please choose a file to run inference.');
      return;
    }

    try {
      setInferring(true);
      const b64 = await fileToBase64(inferenceFile);

      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = token;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ b64 }),
      });

      const text = await res.text();
      let parsed: InferenceResponse;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }

      if (!res.ok) {
        const errMsg =
          (parsed && (parsed as any).error) ||
          (typeof parsed === 'object' ? JSON.stringify(parsed) : text);
        throw new Error(errMsg || `Inference failed with status ${res.status}`);
      }

      setInferenceResult(parsed);
    } catch (e: any) {
      setInferenceError(e?.message || 'Inference failed');
    } finally {
      setInferring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const renderTopK = (probs: number[], k: number) => {
    const indices = probs
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p - a.p)
      .slice(0, Math.min(k, probs.length));

    return (
      <ol className="inference-topk pretty-list">
        {indices.map(({ p, i }) => {
          const label = classLabels[i] ?? `class_${i}`;
          const pctNum = isFinite(p) ? p * 100 : 0;
          const pct = isFinite(p) ? pctNum.toFixed(2) : 'NaN';
          return (
            <li key={i} className="topk-item">
              <div className="topk-row">
                <div className="topk-label" title={`Index ${i}`}>
                  {label}
                </div>
                <div className="topk-pct">{pct}%</div>
              </div>
              <div className="topk-bar" aria-label={`${label} ${pct}%`}>
                <div
                  className="topk-bar-fill"
                  style={{ width: `${Math.min(100, Math.max(0, pctNum))}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    );
  };

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave: React.DragEventHandler<HTMLDivElement> = () => setIsDragging(false);
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleChooseFile(file ?? null);
  };

  const copyJSON = async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('Copied!');
    } catch {
      alert('Copy failed');
    }
  };

  return (
    <div className="card-section inference-card">
      <style>
        {`
          /* ==== Layout ==== */
          .inference-actions {
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            gap: 20px;
            align-items: start;
          }
          .inference-results {
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            gap: 20px;
            align-items: start;
            margin-top: 16px;
          }
          @media (max-width: 980px) {
            .inference-actions,
            .inference-results { grid-template-columns: 1fr; }
          }

          /* ==== Dropzone ==== */
          .dropzone {
            border: 2px dashed #cfd6e4;
            border-radius: 12px;
            padding: 18px;
            text-align: center;
            transition: all .15s ease;
            background: #fafbff;
            min-height: 120px;
          }
          .dropzone.dragging {
            border-color: #6b8afd;
            background: #f0f4ff;
            box-shadow: 0 0 0 4px rgba(107,138,253,0.15) inset;
          }
          .dz-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
          .dz-badge {
            display:inline-flex; padding:4px 8px; background:#eef2ff; color:#334;
            border-radius:999px; font-size:12px; border:1px solid #dfe7ff;
          }

          /* ==== Controls / Buttons ==== */
          .controls-col { display: grid; gap: 12px; align-content: start; }
          .controls-row { display:flex; gap: 10px; align-items:center; flex-wrap: wrap; }
          .range-wrap { display:flex; gap:10px; align-items:center; }
          input[type="range"] { width: 180px; }
          .btn.primary { background:#2f6bff; color:#fff; border:none; }
          .btn.ghost { background: #fff; border:1px solid #dfe4ee; color:#334; }
          .btn:disabled { opacity:.65; cursor:not-allowed; }
          .spinner {
            width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent;
            border-radius: 50%; display:inline-block; animation: spin .8s linear infinite; vertical-align: -3px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          /* ==== Preview / Result ==== */
          .preview-card {
            border: 1px solid #e7ebf3;
            border-radius: 12px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 1px 2px rgba(0,0,0,.04);
          }
          .preview-meta {
            display:flex; justify-content: space-between; align-items:center;
            padding: 10px 12px; border-top:1px solid #f0f3f9; background:#fafcff; font-size: 13px;
            color:#445;
          }
          .result-card { border:1px solid #e8edf7; border-radius:12px; padding:12px; background:#fff; }
          .json-tools { display:flex; gap:8px; align-items:center; margin-bottom:8px; }

          /* ==== Top-K Bars ==== */
          .inference-topk .topk-item { margin: 8px 0 14px; }
          .topk-row { display:flex; align-items:center; justify-content:space-between; gap:12px; font-size: 14px; }
          .topk-label { font-weight: 600; color:#222; }
          .topk-pct { font-variant-numeric: tabular-nums; color:#4a5568; }
          .topk-bar { height: 10px; border-radius:999px; background:#eef2f9; overflow:hidden; margin-top:6px; }
          .topk-bar-fill { height:100%; background: linear-gradient(90deg, #7aa2ff, #3a66ff); }

          .help { color:#5a6475; margin: 6px 0 16px; }
          .error { background:#fff1f2; color:#b10c1c; border:1px solid #ffd5da; padding:10px 12px; border-radius:10px; font-size:14px; }

          /* ==== Scanning Overlay (plays while inferring) ==== */
          .preview-image-wrap { position: relative; }
          .scan-veil {
            pointer-events: none;
            position: absolute; inset: 0;
            background:
              repeating-linear-gradient(
                135deg,
                rgba(47,107,255,0.08) 0px,
                rgba(47,107,255,0.08) 8px,
                transparent 8px,
                transparent 16px
              );
            opacity: 0.6;
          }
          .scan-bar {
            pointer-events: none;
            position: absolute; left: 0; right: 0;
            height: 18%;
            top: -20%;
            background: linear-gradient(
              to bottom,
              rgba(47,107,255,0) 0%,
              rgba(47,107,255,0.28) 50%,
              rgba(47,107,255,0) 100%
            );
            filter: blur(1px);
            animation: scanY 1.6s linear infinite;
          }
          @keyframes scanY {
            from { transform: translateY(-20%); }
            to   { transform: translateY(120%); }
          }
          .scan-badge {
            position: absolute; right: 10px; bottom: 10px;
            background: rgba(17,24,39,0.7);
            color: #fff; padding: 6px 10px; border-radius: 999px;
            font-size: 12px; display: inline-flex; align-items: center; gap: 8px;
          }
          .scan-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #8ab4ff; animation: pulse 1s ease-in-out infinite;
          }
          @keyframes pulse {
            0%,100% { opacity: .4; transform: scale(.9); }
            50%     { opacity: 1;  transform: scale(1); }
          }
          .sr-only {
            position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
            overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
          }
        `}
      </style>

      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        Run Inference
        <span className="dz-badge" title={`Allowed: ${ACCEPTED_MIME.join(', ')}`}>
          Max {MAX_FILE_MB} MB • {ACCEPTED_MIME.length} types
        </span>
      </h3>
      {/* <p className="help">
        Pick or drop an image, then click <em>Run Inference</em>
      </p> */}

      {/* ROW 1 — Actions: Dropzone (L) + Controls (R) */}
      <div className="inference-actions">
        {/* Dropzone */}
        <div>
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            title="Click or drop an image"
          >
            <div className="dz-actions">
              <span className="dz-badge">JPEG / PNG / WEBP</span>
              <span className="dz-badge">Top-K up to 50</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME.join(',')}
              onChange={(e) => handleChooseFile(e.target.files?.[0] ?? null)}
              disabled={inferring}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="controls-col">
          <div className="controls-row">
            <button
              className="btn primary"
              onClick={runInference}
              disabled={!inferenceFile || inferring}
              title={!inferenceFile ? 'Choose a file first' : 'Run inference'}
            >
              {inferring ? <span className="spinner" /> : 'Run Inference'}
            </button>

            <div className="range-wrap" title="How many top predictions to show">
              <label htmlFor="topk" style={{ fontWeight: 600 }}>
                Top-K
              </label>
              <input
                id="topk"
                type="range"
                min={1}
                max={50}
                value={topK}
                onChange={(e) => setTopK(Math.max(1, Math.min(50, Number(e.target.value) || 5)))}
              />
              <input
                type="number"
                min={1}
                max={50}
                value={topK}
                onChange={(e) => setTopK(Math.max(1, Math.min(50, Number(e.target.value) || 5)))}
                style={{ width: 64 }}
              />
            </div>

            {/* <button
              className="btn ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={inferring}
            >
              Choose File
            </button> */}
          </div>

          {/* Status / Errors */}
          {inferenceError && <div className="error">❌ {inferenceError}</div>}
        </div>
      </div>

      {/* ROW 2 — Results: Preview (L) + Result (R) */}
      {(inferencePreview || inferenceResult) && (
        <div className="inference-results">
          {/* Preview card */}
          {inferencePreview ? (
            <div className="preview-card">
              <div
                className="preview-image-wrap"
                style={{
                  padding: 12,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#fff',
                }}
              >
                <img
                  src={inferencePreview}
                  alt="preview"
                  style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8 }}
                  aria-busy={inferring}
                  aria-live="polite"
                />
                {/* Scanning overlay while inferring */}
                {inferring && (
                  <>
                    <div className="scan-veil" aria-hidden="true" />
                    <div className="scan-bar" aria-hidden="true" />
                    <span className="scan-badge" aria-hidden="true">
                      <span className="scan-dot" />
                      Scanning…
                    </span>
                    <span className="sr-only">Scanning image for inference…</span>
                  </>
                )}
              </div>
              <div className="preview-meta">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{inferenceFile?.name ?? 'selected-image'}</span>
                  {inferenceFile && (
                    <span style={{ opacity: 0.7 }}>{formatBytes(inferenceFile.size)}</span>
                  )}
                </div>
                <button className="btn btn-secondary" onClick={clearInference} disabled={inferring}>
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div /> /* keep grid alignment if only results exist */
          )}

          {/* Results card */}
          {inferenceResult ? (
            <div className="result-card">
              {'probabilities' in inferenceResult &&
              Array.isArray((inferenceResult as any).probabilities) ? (
                <>
                  <h4 style={{ margin: '4px 0 8px' }}>Top predictions</h4>
                  {renderTopK((inferenceResult as InferenceProbResponse).probabilities, topK)}
                  <details style={{ marginTop: 8 }}>
                    <summary>Full probabilities JSON</summary>
                    <div className="json-tools">
                      <button
                        className="btn btn-secondary"
                        onClick={() => copyJSON(inferenceResult)}
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre>{JSON.stringify(inferenceResult, null, 2)}</pre>
                  </details>
                </>
              ) : 'classIndex' in inferenceResult ? (
                <>
                  <h4 style={{ margin: '4px 0 8px' }}>Predicted Class</h4>
                  {(() => {
                    const idx = (inferenceResult as InferenceClassResponse).classIndex;
                    const label = classLabels[idx] ?? `class_${idx}`;
                    const prob = (inferenceResult as InferenceClassResponse).probability;
                    return (
                      <div style={{ display: 'grid', gap: 8 }}>
                        <p style={{ fontSize: 16 }}>
                          <strong>{label}</strong>
                          {typeof prob === 'number' ? ` — ${(prob * 100).toFixed(2)}%` : null}
                        </p>
                        {typeof prob === 'number' && (
                          <div
                            className="topk-bar"
                            aria-label={`${label} ${(prob * 100).toFixed(2)}%`}
                          >
                            <div
                              className="topk-bar-fill"
                              style={{
                                width: `${Math.min(100, Math.max(0, prob * 100))}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <details style={{ marginTop: 8 }}>
                    <summary>Raw response</summary>
                    <div className="json-tools">
                      <button
                        className="btn btn-secondary"
                        onClick={() => copyJSON(inferenceResult)}
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre>{JSON.stringify(inferenceResult, null, 2)}</pre>
                  </details>
                </>
              ) : (
                <>
                  <h4 style={{ margin: '4px 0 8px' }}>Response</h4>
                  <div className="json-tools">
                    <button className="btn btn-secondary" onClick={() => copyJSON(inferenceResult)}>
                      Copy JSON
                    </button>
                  </div>
                  <pre>{JSON.stringify(inferenceResult, null, 2)}</pre>
                </>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );
};

export default InferencePanel;

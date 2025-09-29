import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import IGN_Logo from '../../assets/IGN_Logo.svg';
import { useAuthToken } from '../../hooks/useAuthToken';
import { listPipelines } from '../../utils/api';
import VisualPipeline from '../VisualPipeline/VisualPipeline';
import './UploadForm.scss';
import { FileUploadControls, UploadProgressMap } from './parts/FileUploadControls';
import InferencePanel from './parts/InferencePanel';
import { LabelingControls } from './parts/LabelingControls';
import { ProgressSection } from './parts/ProgressSection';
import { TrainingPipelineControls } from './parts/TrainingPipelineControls';
import useSectionSpy from './parts/hooks/useSectionSpy';

// ----- constants: keep these in sync with your LandingPage header height -----
const APP_HEADER_H = 72; // px (fixed blue app header)
const PROGRESS_H = 56; // px (the sticky step-progress header)
const HEADER_HEIGHT_PX = 72;

interface Pipeline {
  name: string;
  definition: string;
}

// SSR-safe guards for URL/hash read & write
const setHash = (hash: string) => {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.hash = hash.startsWith('#') ? hash : `#${hash}`;
    window.history.replaceState(null, '', url.toString());
  } catch {
    // no-op
  }
};

const getHash = (): string => {
  if (typeof window === 'undefined') return '';
  return (window.location.hash || '').replace(/^#/, '');
};

interface UploadFormProps {
  onUploadComplete: (message: string) => void;
  setLoggedInUser: (v: string | null) => void;
}

type PipelineStep = {
  name: string;
  definition: object;
};
const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete, setLoggedInUser }) => {
  // Existing state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressMap>({});
  const [workteamArn, setWorkteamArn] = useState<string | null>(null);
  const [pipelines, setPipelines] = useState<PipelineStep[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineStep>({
    name: '',
    definition: {},
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement | null>(null);
  const { get: getToken } = useAuthToken(() => setLoggedInUser(null));

  // Step refs (full page sections)
  const uploadRef = useRef<HTMLElement | null>(null);
  const labelingRef = useRef<HTMLElement | null>(null);
  const trainingRef = useRef<HTMLElement | null>(null);
  const trainingAWSRef = useRef<HTMLElement | null>(null);
  const inferenceRef = useRef<HTMLElement | null>(null);
  const username = localStorage.getItem('username');

  const steps = useMemo(
    () => [
      { key: 'upload', title: 'Upload', ref: uploadRef },
      { key: 'labeling', title: 'Labeling', ref: labelingRef },
      { key: 'training', title: 'Training', ref: trainingRef },
      { key: 'training-aws', title: 'Training AWS', ref: trainingAWSRef },
      { key: 'inference', title: 'Inference', ref: inferenceRef },
    ],
    []
  );

  // Observe which section is in view to update the sticky progress bar and URL hash
  const activeIndex = useSectionSpy(
    steps.map((s) => s.ref),
    {
      // make the observer treat the top of the viewport as below both headers
      rootMargin: `-${APP_HEADER_H + PROGRESS_H}px 0px 0px 0px`,
    }
  );

  const scrollToIndex = useCallback(
    (i: number) => {
      const el = steps[i]?.ref.current;
      if (!el) return;
      // thanks to CSS scroll-margin-top, this lands perfectly below headers
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const key = steps[i].key;
      setHash(key);
    },
    [steps]
  );

  const handleLogout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('username');
    setLoggedInUser(null);
  };

  const next = useCallback(
    () => scrollToIndex(Math.min(activeIndex + 1, steps.length - 1)),
    [activeIndex, steps.length, scrollToIndex]
  );
  const prev = useCallback(
    () => scrollToIndex(Math.max(activeIndex - 1, 0)),
    [activeIndex, scrollToIndex]
  );

  // Deep link on load (e.g., #inference jumps to that section)
  useEffect(() => {
    const hash = getHash();
    const idx = steps.findIndex((s) => s.key === hash);
    if (idx >= 0) {
      const id = window.setTimeout(() => scrollToIndex(idx), 0);
      return () => window.clearTimeout(id);
    }
  }, [steps, scrollToIndex]);

  // Fetch pipelines (unchanged)
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) return;
      try {
        const apiBase = process.env.REACT_APP_START_TRAINING_API_URL_ENDPOINT;
        if (!apiBase) return;
        const apiUrl = apiBase + '/list-pipeline';
        const data = await listPipelines(apiUrl, token);
        setPipelines(data.pipelines || []);
        if (data.pipelines?.length > 0) setSelectedPipeline(data.pipelines[0]);
      } catch (err) {
        console.error('Failed to fetch pipelines:', err);
      }
    })();
  }, [getToken]);

  // Upload presign (unchanged)
  const onRequestPresign = async (filename: string, contentType: string) => {
    const token = getToken();
    if (!token) {
      setLoggedInUser(null);
      throw new Error('Session expired');
    }
    const lambdaUrl = process.env.REACT_APP_UPLOAD_API_URL!;
    const res = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ filename, contentType }),
    });
    if (!res.ok) throw new Error(`Presigned URL error for ${filename}`);
    const { uploadUrl } = await res.json();
    return uploadUrl as string;
  };

  // Auto-advance after upload finishes (great for demos)
  const handleUploadFinish = () => {
    setUploading(false);
    onUploadComplete('✅ All files uploaded successfully!');
    setTimeout(() => next(), 450);
  };

  // Keyboard navigation: ← → keys to move between steps
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Render
  return (
    <div
      className="layout"
      style={
        {
          // Expose header height to CSS
          ['--header-h' as any]: `${HEADER_HEIGHT_PX}px`,
        } as React.CSSProperties
      }
    >
      <style>
        {`
          .top-nav {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: var(--header-h, 72px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            background: #5ea0e0; /* your blue header */
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .top-nav .logo { height: 36px; }

          .main-content {
            /* Push content below fixed header */
            padding-top: var(--header-h, 72px);
          }

          /* Optional: constrain page width for nice margins */
          .main-content > * {
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
          }

          /* Dropdown styles (kept simple) */
          .user-info { display: flex; align-items: center; gap: 12px; }
          .user-dropdown { position: relative; }
          .user-dropdown-trigger {
            background: #1e66ff; color: #fff; border: none;
            padding: 10px 14px; border-radius: 10px; cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.08);
          }
          .dropdown-menu {
            position: absolute; right: 0; top: calc(100% + 6px);
            background: #fff; border: 1px solid #e6ebf5; border-radius: 10px;
            box-shadow: 0 10px 28px rgba(16,24,40,0.12);
            padding: 6px; min-width: 160px; z-index: 1001;
          }
          .dropdown-item {
            width: 100%; text-align: left;
            background: transparent; border: none; cursor: pointer;
            padding: 8px 10px; border-radius: 8px;
          }
          .dropdown-item:hover { background: #f5f7fb; }
        `}
      </style>

      <header className="top-nav" role="banner" aria-label="Top navigation">
        <img src={IGN_Logo} alt="Ignitarium logo" className="logo" />
        <div className="user-info">
          <div className="user-dropdown" ref={ddRef}>
            <button
              type="button"
              className="user-dropdown-trigger"
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              👤 {username} ⌄
            </button>

            {isDropdownOpen && (
              <div role="menu" className="dropdown-menu">
                <button role="menuitem" className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content" role="main">
        <div
          className="flow-root"
          style={
            {
              ['--app-header-h' as any]: `${APP_HEADER_H}px`,
              ['--progress-h' as any]: `${PROGRESS_H}px`,
            } as React.CSSProperties
          }
        >
          {/* Local CSS to handle sticky offset & section sizing */}
          <style>
            {`
          /* Step header sits below the fixed app header */
          .step-header {
            position: sticky;
            top: var(--app-header-h, 72px);
            z-index: 500; /* below top app header but above content */
            background: #fff;
            border-bottom: 1px solid #eef2f7;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            height: var(--progress-h, 56px);
          }

          /* Ensure sections account for both headers */
          .sections .step-section {
            min-height: calc(100vh - (var(--app-header-h,72px) + var(--progress-h,56px)));
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            /* when scrolled into view, leave space for both headers */
            scroll-margin-top: calc(var(--app-header-h,72px) + var(--progress-h,56px) + 8px);
          }
        `}
          </style>

          {/* Sticky step header */}
          <header className="step-header" role="navigation" aria-label="Step progress">
            <ol className="stepper">
              {steps.map((s, i) => (
                <li
                  key={s.key}
                  className={`stepper-item ${i < activeIndex ? 'done' : i === activeIndex ? 'active' : ''}`}
                >
                  <button
                    className="stepper-dot"
                    aria-current={i === activeIndex ? 'step' : undefined}
                    onClick={() => scrollToIndex(i)}
                    title={s.title}
                  />
                  <span className="stepper-label" onClick={() => scrollToIndex(i)}>
                    {s.title}
                  </span>
                </li>
              ))}
            </ol>
            <div className="stepper-actions">
              <button
                className="btn btn-secondary"
                onClick={prev}
                disabled={activeIndex === 0}
                aria-label="Previous section"
              >
                Back
              </button>
              <button
                className="btn"
                onClick={next}
                disabled={activeIndex === steps.length - 1}
                aria-label="Next section"
              >
                Next
              </button>
            </div>
          </header>

          {/* Sections (one page each) */}
          <main className="sections">
            {/* Upload */}
            <section
              id="upload"
              ref={uploadRef}
              className="step-section"
              aria-labelledby="upload-title"
            >
              <div className="card">
                <h2 id="upload-title" className="step-title">
                  Upload
                </h2>
                <p className="help">
                  Upload images to your secure bucket. When finished, we’ll take you to Labeling.
                </p>

                <FileUploadControls
                  onRequestPresign={onRequestPresign}
                  onUploadStart={() => setUploading(true)}
                  onUploadFinish={handleUploadFinish}
                  setUploadProgress={setUploadProgress}
                />

                <ProgressSection uploading={uploading} uploadProgress={uploadProgress} />

                <div className="step-cta">
                  <button className="btn btn-secondary" onClick={next} aria-label="Go to Labeling">
                    Skip to Labeling
                  </button>
                </div>
              </div>
            </section>

            {/* Labeling */}
            <section
              id="labeling"
              ref={labelingRef}
              className="step-section"
              aria-labelledby="labeling-title"
            >
              <div className="card">
                <h2 id="labeling-title" className="step-title">
                  Labeling
                </h2>
                <p className="help">Configure your workteam and launch a labeling job.</p>

                <LabelingControls
                  workteamArn={workteamArn}
                  setWorkteamArn={setWorkteamArn}
                  getToken={getToken}
                />

                <div className="step-cta">
                  <button className="btn btn-secondary" onClick={prev}>
                    Back to Upload
                  </button>
                  <button className="btn" onClick={next}>
                    Next: Training
                  </button>
                </div>
              </div>
            </section>

            {/* Training */}
            <section
              id="training"
              ref={trainingRef}
              className="step-section"
              aria-labelledby="training-title"
            >
              <div className="card">
                <h2 id="training-title" className="step-title">
                  Training
                </h2>
                <p className="help">Pick a pipeline or create one, then kick off training.</p>

                <TrainingPipelineControls
                  getToken={getToken}
                  pipelines={pipelines}
                  selectedPipeline={selectedPipeline}
                  setSelectedPipeline={setSelectedPipeline}
                  onPipelineCreated={() => {
                    // Optionally refresh the list and auto-advance on creation
                  }}
                />

                <div className="step-cta">
                  <button className="btn btn-secondary" onClick={prev}>
                    Back to Labeling
                  </button>
                  <button className="btn" onClick={next}>
                    Next: Inference
                  </button>
                </div>
              </div>
            </section>
            {/* Training AWS */}
            <section
              id="training-aws"
              ref={trainingAWSRef}
              className="step-section"
              aria-labelledby="training-aws-title"
            >
              <VisualPipeline />
            </section>

            {/* Inference */}
            <section
              id="inference"
              ref={inferenceRef}
              className="step-section"
              aria-labelledby="inference-title"
            >
              <div className="card">
                <h2 id="inference-title" className="step-title">
                  Inference
                </h2>
                <p className="help">
                  Drop an image, run inference, and view predictions with Top-K bars.
                </p>

                <InferencePanel getToken={getToken} />

                <div className="step-cta">
                  <button className="btn btn-secondary" onClick={prev}>
                    Back to Training
                  </button>
                  <button className="btn" onClick={() => scrollToIndex(0)}>
                    Start Over
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </main>
    </div>
  );
};

export default UploadForm;

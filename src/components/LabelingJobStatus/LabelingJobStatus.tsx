import React, { useEffect, useState } from 'react';

interface LabelingJobStatusProps {
  executionArn: string;
  statusApiUrl: string;
  token?: string;
}

const LabelingJobStatus: React.FC<LabelingJobStatusProps> = ({
  executionArn,
  statusApiUrl,
  token,
}) => {
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionArn) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${statusApiUrl}?executionArn=${encodeURIComponent(executionArn)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: token } : {}),
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch status`);
        }

        const data = await res.json();
        setStatus(data.status);

        if (['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED'].includes(data.status)) {
          clearInterval(interval);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [executionArn, statusApiUrl, token]);

  return (
    <div style={{ marginTop: '20px' }}>
      <h4>Labeling Job Status</h4>
      {error ? (
        <span style={{ color: 'red' }}>Error: {error}</span>
      ) : (
        <span>
          Status: <strong>{status}</strong>
        </span>
      )}
    </div>
  );
};

export default LabelingJobStatus;

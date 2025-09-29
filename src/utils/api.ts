type PipelineStep = {
  name: string;
  definition: object;
};
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export async function startTraining(apiUrl: string, token: string, pipeline_name: string) {
  return fetchJson<{ executionArn?: string }>(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ pipeline_name }),
  });
}

export async function listPipelines(apiUrl: string, token: string) {
  return fetchJson<{ pipelines: PipelineStep[] }>(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
  });
}

export async function createPipeline(apiUrl: string, token: string, payload: unknown) {
  return fetchJson<{ pipelineArn?: string }>(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(payload),
  });
}

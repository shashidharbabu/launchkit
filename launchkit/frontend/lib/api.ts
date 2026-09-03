const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090';

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `${method} ${path} → ${res.status}`);
  }
  return res.json();
}

export const api = {
  listProjects: () => req('GET', '/projects'),
  createProject: (p: { name: string; site_url: string; repo_url?: string; app_url?: string; autorun?: boolean }) =>
    req('POST', '/projects', p) as Promise<{
      id: string; name: string; job_id: string | null;
      duplicate_of: { id: string; name: string } | null;
    }>,
  getProject: (id: string) => req('GET', `/projects/${id}`),
  runUnderstand: (id: string, feedback = '') =>
    req('POST', `/projects/${id}/run/understand`, { feedback }),
  runStage: (id: string, kind: string) => req('POST', `/projects/${id}/run/${kind}`),
  runAsset: (id: string, asset_type: string, target_id?: string, feedback = '') =>
    req('POST', `/projects/${id}/run/asset`, { asset_type, target_id, feedback }),
  job: (jobId: string) => req('GET', `/jobs/${jobId}`),
  jobs: (id: string) => req('GET', `/projects/${id}/jobs`),
  allJobs: (limit = 100) => req('GET', `/jobs?limit=${limit}`),
  editProfile: (id: string, data: unknown) => req('PUT', `/projects/${id}/profile`, { data }),
  approveProfile: (id: string) => req('POST', `/projects/${id}/profile/approve`),
  commercial: (id: string, kind: string) => req('GET', `/projects/${id}/commercial/${kind}`),
  assets: (id: string) => req('GET', `/projects/${id}/assets`),
  editAsset: (assetId: string, data: unknown) => req('PUT', `/assets/${assetId}`, { data }),
  approveAsset: (assetId: string) => req('POST', `/assets/${assetId}/approve`),
  targets: (id: string) => req('GET', `/projects/${id}/targets`),
  selectTarget: (targetId: string, selected: boolean) =>
    req('POST', `/targets/${targetId}/select?selected=${selected}`),
  signals: (id: string) => req('GET', `/projects/${id}/signals`),
  setSignalStatus: (signalId: string, status: string) =>
    req('POST', `/signals/${signalId}/status?status=${status}`),
  plan: (id: string, fmt: 'json' | 'markdown' = 'json') =>
    req('GET', `/projects/${id}/plan?fmt=${fmt}`),
  attribution: (id: string) => req('GET', `/projects/${id}/attribution`),
  simulateSignup: (appId: string, ref: string) =>
    req('POST', '/mockstore/events', { app_id: appId, ref, event: 'signup' }),
};

export async function pollJob(jobId: string, onTick?: (j: { status: string }) => void) {
  for (;;) {
    const j = await api.job(jobId);
    onTick?.(j);
    if (j.status === 'done' || j.status === 'error') return j;
    await new Promise((r) => setTimeout(r, 2500));
  }
}

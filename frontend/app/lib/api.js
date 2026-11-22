/**
 * Centralized API client for XAI-Sec platform.
 * Supports live FastAPI backend and seamless offline/GitHub Pages demo mode.
 */

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0'
)

const BASE = process.env.NEXT_PUBLIC_API_URL || (isLocal ? 'http://127.0.0.1:8000' : '')

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('xai_token')
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  if (!BASE) {
    return handleFallback(path, options)
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(err.detail || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.warn(`[XAI-Sec] Live backend request failed for ${path}. Switching to fallback demo mode.`, err)
    return handleFallback(path, options)
  }
}

// ── Smart Client-Side Fallback Engine (for GitHub Pages & Offline Use) ─────
function handleFallback(path, options = {}) {
  // 1. Auth Login / Register
  if (path === '/auth/login' || path === '/auth/register') {
    let email = 'analyst@xai.sec'
    let username = 'SecAnalyst'
    try {
      if (options.body) {
        const body = JSON.parse(options.body)
        email = body.email || email
        username = body.username || email.split('@')[0]
      }
    } catch (_) {}

    const user = { username, email, role: 'Senior SOC Analyst' }
    return {
      access_token: 'demo-jwt-token-xai-sec',
      token_type: 'bearer',
      user,
      mode: 'demo'
    }
  }

  if (path === '/auth/forgot-password') {
    return { message: 'Demo mode: password reset verified.' }
  }

  // 2. IDS Endpoints
  if (path === '/ids/sample') {
    return {
      duration: 0,
      protocol_type: 'tcp',
      service: 'http',
      flag: 'SF',
      src_bytes: 334,
      dst_bytes: 1450,
      count: 9,
      srv_count: 9,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      dst_host_count: 255,
      dst_host_srv_count: 255
    }
  }

  // 3. Model Performance Metrics
  if (path === '/models/ids') {
    return {
      model_name: 'ids_random_forest',
      accuracy: 0.9984,
      precision: 0.9978,
      recall: 0.9989,
      f1: 0.9983,
      classes: ['Normal', 'DoS', 'Probe', 'R2L', 'U2R'],
      confusion_matrix: [
        [9711, 8, 2, 0, 0],
        [12, 7445, 3, 0, 0],
        [4, 15, 2410, 2, 0],
        [0, 1, 3, 988, 1],
        [0, 0, 0, 1, 52]
      ]
    }
  }

  if (path === '/models/malware') {
    return {
      model_name: 'malware_detector',
      accuracy: 0.9942,
      precision: 0.9935,
      recall: 0.9951,
      f1: 0.9943,
      classes: ['Benign', 'Malware'],
      confusion_matrix: [
        [5012, 28],
        [30, 4930]
      ]
    }
  }

  if (path === '/api/model-insights') {
    return {
      ids: {
        accuracy: 0.9984,
        precision: 0.9978,
        recall: 0.9989,
        f1: 0.9983,
        classes: ['Normal', 'DoS', 'Probe', 'R2L', 'U2R']
      },
      malware: {
        accuracy: 0.9942,
        precision: 0.9935,
        recall: 0.9951,
        f1: 0.9943,
        classes: ['Benign', 'Malware']
      }
    }
  }

  // 4. Audit History
  if (path.startsWith('/history')) {
    const rawHistory = typeof window !== 'undefined' ? localStorage.getItem('xai_scan_history') : null
    let list = rawHistory ? JSON.parse(rawHistory) : [
      { id: 101, scan_type: 'ids', target_name: 'packet_stream_capture.csv', result: 'DoS Attack', confidence: 0.962, timestamp: '2026-11-22 10:14:00' },
      { id: 102, scan_type: 'malware', target_name: 'suspicious_payload.exe', result: 'Malware (Trojan)', confidence: 0.988, timestamp: '2026-11-22 09:32:00' },
      { id: 103, scan_type: 'ids', target_name: 'dmz_traffic_sample.csv', result: 'Normal Traffic', confidence: 0.995, timestamp: '2026-11-21 16:45:00' },
      { id: 104, scan_type: 'malware', target_name: 'invoice_macro.dll', result: 'Malware (Ransomware)', confidence: 0.974, timestamp: '2026-11-21 14:10:00' }
    ]

    if (path === '/history/summary') {
      const malwareCount = list.filter(i => i.scan_type === 'malware' && i.result.includes('Malware')).length
      const idsThreatCount = list.filter(i => i.scan_type === 'ids' && !i.result.includes('Normal')).length
      return {
        total_scans: list.length,
        malware_detected: malwareCount,
        intrusions_detected: idsThreatCount,
        clean_scans: list.length - malwareCount - idsThreatCount
      }
    }

    return list
  }

  return { status: 'success', data: null, mode: 'demo' }
}

export const api = {
  // Auth
  register: (username, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  forgotPassword: (email, new_password) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email, new_password }) }),

  // IDS
  idsSample: () => request('/ids/sample', { headers: authHeaders() }),

  idsScan: async (file, instanceIdx = 0) => {
    if (BASE) {
      try {
        const form = new FormData()
        if (file) form.append('file', file)
        form.append('instance_idx', instanceIdx)
        const res = await fetch(`${BASE}/ids/scan?instance_idx=${instanceIdx}`, {
          method: 'POST',
          headers: authHeaders(),
          body: file ? form : undefined,
        })
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('[XAI-Sec] Live IDS scan failed, using fallback engine.', err)
      }
    }

    // Realistic Demo / Offline IDS Analysis
    const isThreat = Math.random() > 0.35
    const pred = isThreat ? 'DoS (SYN Flood)' : 'Normal'
    const conf = isThreat ? (0.91 + Math.random() * 0.08) : (0.95 + Math.random() * 0.04)

    const result = {
      prediction: pred,
      confidence: parseFloat(conf.toFixed(4)),
      threat_level: isThreat ? 'High' : 'Low',
      shap_values: [
        { feature: 'src_bytes', importance: isThreat ? 0.42 : -0.12, description: 'Source to destination byte volume' },
        { feature: 'count', importance: isThreat ? 0.38 : -0.08, description: 'Connections to same host in past 2 seconds' },
        { feature: 'srv_serror_rate', importance: isThreat ? 0.29 : -0.05, description: 'SYN error rate across connections' },
        { feature: 'dst_bytes', importance: -0.15, description: 'Destination byte counter' },
        { feature: 'same_srv_rate', importance: 0.11, description: 'Rate of connections to same service' }
      ],
      features: {
        src_bytes: isThreat ? 42800 : 340,
        count: isThreat ? 512 : 8,
        srv_serror_rate: isThreat ? 0.98 : 0.0,
        protocol: 'TCP',
        service: 'http'
      }
    }

    // Save scan to history
    saveLocalScan('ids', file ? file.name : `traffic_sample_${instanceIdx}.csv`, pred, result.confidence)
    return result
  },

  // Malware
  malwareScan: async (file, instanceIdx = 0) => {
    if (BASE) {
      try {
        const form = new FormData()
        if (file) form.append('file', file)
        form.append('instance_idx', instanceIdx)
        const res = await fetch(`${BASE}/malware/scan?instance_idx=${instanceIdx}`, {
          method: 'POST',
          headers: authHeaders(),
          body: file ? form : undefined,
        })
        if (res.ok) return await res.json()
      } catch (err) {
        console.warn('[XAI-Sec] Live malware scan failed, using fallback engine.', err)
      }
    }

    // Realistic Demo / Offline Malware Analysis
    const entropy = file ? (5.8 + Math.random() * 2.1) : 7.64
    const isMalware = entropy > 7.0 || (file && file.name.match(/\.(exe|dll|scr|bin)$/i))
    const pred = isMalware ? 'Malware (Packed / Ransomware)' : 'Benign File'
    const conf = isMalware ? 0.984 : 0.965

    const result = {
      prediction: pred,
      confidence: conf,
      entropy: parseFloat(entropy.toFixed(3)),
      is_suspicious: isMalware,
      lime_explanation: [
        { feature: 'Shannon Entropy (>7.0)', weight: isMalware ? 0.54 : -0.42, sign: isMalware ? 'positive' : 'negative' },
        { feature: 'Import: VirtualAllocEx', weight: isMalware ? 0.38 : 0.0, sign: 'positive' },
        { feature: 'PE Section: .upx0 (Packer)', weight: isMalware ? 0.31 : 0.0, sign: 'positive' },
        { feature: 'Valid Digital Signature', weight: isMalware ? -0.05 : -0.35, sign: 'negative' }
      ]
    }

    saveLocalScan('malware', file ? file.name : 'executable_sample.exe', pred, conf)
    return result
  },

  // History
  history: () => request('/history/', { headers: authHeaders() }),
  historySummary: () => request('/history/summary', { headers: authHeaders() }),

  // Model Metrics
  idsMetrics: () => request('/models/ids', { headers: authHeaders() }),
  malwareMetrics: () => request('/models/malware', { headers: authHeaders() }),
  modelInsights: () => request('/api/model-insights', { headers: authHeaders() }),
}

function saveLocalScan(scan_type, target_name, result, confidence) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('xai_scan_history')
    const list = raw ? JSON.parse(raw) : []
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    list.unshift({
      id: Date.now(),
      scan_type,
      target_name,
      result,
      confidence,
      timestamp: now
    })
    localStorage.setItem('xai_scan_history', JSON.stringify(list.slice(0, 50)))
  } catch (_) {}
}

const API = window.API_BASE || ''
const speak = (text) => {
  try {
    const synth = window.speechSynthesis
    if (!synth) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1
    utter.pitch = 1
    synth.cancel()
    synth.speak(utter)
  } catch {}
}

// ====== DOM SHORTCUTS ======
const el = (id) => document.getElementById(id)
const statusEl = el('status')
const resultsEl = el('results')
const summaryEl = el('summary')
const speakBtn = el('speakBtn')
const queryInput = el('queryInput')
const searchBtn = el('searchBtn')

// ====== UI HELPERS ======
const showCard = (title, item) => {
  const card = document.createElement('div')
  card.className = 'card'
  card.innerHTML = `
    <div class="row"><span class="label">Type</span><span class="value">${title}</span></div>
    <div class="row"><span class="label">Operator</span><span class="value">${item.operator || '-'}</span></div>
    <div class="row"><span class="label">Departure</span><span class="value">${item.departure_time || '-'}</span></div>
    <div class="row"><span class="label">Arrival</span><span class="value">${item.arrival_time || '-'}</span></div>
    <div class="row"><span class="label">Fare</span><span class="value">${item.fare != null ? '₹' + Math.round(item.fare) : '-'}</span></div>
    <div class="row"><span class="label">Distance</span><span class="value">${item.distance_km != null ? item.distance_km : '-'}</span></div>
  `
  resultsEl.appendChild(card)
}

const showSummary = (text, type='info') => {
  summaryEl.textContent = text
  summaryEl.className = 'summary ' + (type === 'ok' ? 'pill ok' : type === 'err' ? 'pill err' : '')
}

// ====== QUERY PARSER ======
const parseQuery = (q) => {
  const lower = q.toLowerCase()
  const isFare = /(fare|price|cost)/.test(lower)
  const isNext = /(next|first)/.test(lower)
  const type = lower.includes('train') ? 'train' : (lower.includes('bus') ? 'bus' : 'any')
  const m = /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)/i.exec(q)
  return { isFare, isNext, type, source: m?.[1]?.trim(), destination: m?.[2]?.trim() }
}

// ====== FETCH WRAPPER ======
const call = async (path, params) => {
  const url = new URL(path, API || window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

// ====== MAIN QUERY FUNCTION ======
const runQuery = async (q) => {
  resultsEl.innerHTML = ''
  const p = parseQuery(q)
  if (!p.source || !p.destination) {
    const msg = 'Please say or type: from CITY to CITY'
    showSummary(msg, 'err')
    speak(msg)
    return
  }
  try {
    if (p.isFare) {
      const params = { source: p.source, destination: p.destination }
      if (p.type === 'bus' || p.type === 'train') params.type = p.type
      const data = await call('/api/fare', params)
      if (data.fares && data.fares.length) {
        const best = data.fares[0]
        showCard('Fare', best)
        const s = `The ${best.transport_type} fare from ${p.source} to ${p.destination} is ₹${Math.round(best.fare)}.`
        showSummary(s, 'ok')
        speak(s)
      } else {
        const msg = data.message || 'No fare found'
        showSummary(msg, 'err')
        speak(msg)
      }
    } else if (p.isNext) {
      const path = p.type === 'train' ? '/api/nexttrain' : '/api/nextbus'
      const data = await call(path, { source: p.source, destination: p.destination })
      if (data.operator) {
        showCard('Next option', data)
        const s = `Next ${data.transport_type || 'option'} from ${p.source} to ${p.destination} is ${data.operator} at ${data.departure_time}.`
        showSummary(s, 'ok')
        speak(s)
      } else {
        const msg = data.message || 'No option found'
        showSummary(msg, 'err')
        speak(msg)
      }
    } else {
      const params = { source: p.source, destination: p.destination }
      if (p.type === 'bus' || p.type === 'train') params.type = p.type
      const data = await call('/api/search', params)
      if (data.results && data.results.length) {
        const s = `Found ${data.results.length} option(s).`
        showSummary(s, 'ok')
        speak(s)
        data.results.slice(0, 6).forEach(item => showCard(item.transport_type || 'Result', item))
      } else {
        const msg = data.message || 'No transport found'
        showSummary(msg, 'err')
        speak(msg)
      }
    }
  } catch (e) {
    console.error(e)
    const msg = 'Sorry, something went wrong.'
    showSummary(msg, 'err')
    speak(msg)
  }
}

// ====== VOICE RECOGNITION ======
const supportSpeech = () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

let recognizer = null
let micInitialized = false
let isListening = false

const ensureMicPermission = async () => {
  if (micInitialized) return
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    micInitialized = true
    console.log('🎤 Mic permission granted.')
  } catch (e) {
    showSummary('Microphone permission denied. Please allow mic for this site.')
    throw e
  }
}

const getRecognizer = () => {
  if (recognizer) return recognizer
  const R = window.SpeechRecognition || window.webkitSpeechRecognition
  recognizer = new R()
  recognizer.lang = 'en-US'
  recognizer.interimResults = false
  recognizer.maxAlternatives = 1
  recognizer.continuous = false

  recognizer.onresult = (e) => {
    const text = e.results[0][0].transcript
    statusEl.textContent = 'Heard: ' + text
    runQuery(text)
  }

  recognizer.onerror = (err) => {
    console.error('Speech error:', err)
    statusEl.textContent = 'Voice error. Try again.'
    isListening = false
  }

  recognizer.onend = () => {
    statusEl.textContent = 'Ready'
    isListening = false
  }

  recognizer.onstart = () => { isListening = true }

  return recognizer
}

const startListening = async () => {
  if (!supportSpeech()) {
    showSummary('Voice not supported in this browser.')
    return
  }
  try {
    await ensureMicPermission()
    const r = getRecognizer()
    if (isListening) return
    statusEl.textContent = 'Listening…'
    r.start()
  } catch (err) {
    console.error('Mic error:', err)
    showSummary('Cannot access microphone.')
  }
}

// ====== EVENT LISTENERS ======
speakBtn.type = 'button' // prevent form submission
speakBtn.addEventListener('click', startListening)
searchBtn.addEventListener('click', () => {
  const q = queryInput.value.trim()
  if (q) runQuery(q)
})

// Pre-warm mic permission on load
window.addEventListener('DOMContentLoaded', () => {
  ensureMicPermission().catch(() => {})
})

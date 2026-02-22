// Helper
const el = id => document.getElementById(id);

// Language support
let currentLanguage = localStorage.getItem('transport_language') || 'en';

// Elements (define first)
const searchBtn = el('search-btn');
const voiceBtn = el('voice-btn');
const micIcon = el('mic-icon');
const voiceHint = el('voice-hint');
const resultsContainer = el('results-container');
const historyBtn = el('history-btn');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const closeHistory = document.getElementById('close-history');
const searchLoading = document.getElementById('search-loading');
const quickChips = document.querySelectorAll('.quick-chip');
const assistantHelp = document.getElementById('assistant-help');
const statusTimeEl = document.getElementById('status-time');
const statusDateEl = document.getElementById('status-date');
const statusNetworkEl = document.getElementById('status-network');
const toolbeltButtons = document.querySelectorAll('.toolbelt-btn');
const languageSelect = el('language-select');

// Hindi translations
const translations = {
  en: {
    from: 'From',
    to: 'To',
    type: 'Type',
    date: 'Date',
    all: 'All',
    bus: 'Bus',
    train: 'Train',
    searchTransport: 'Search Transport',
    voice: 'Voice',
    recent: 'Recent',
    voiceHint: 'Say: "Bus from Mumbai to Delhi"',
    listening: 'Listening... say: "Bus from X to Y"',
    voiceReady: 'Voice Ready',
    voiceReadyDesc: 'Say "Next bus from Jaipur"',
    liveAvailability: 'Live Availability',
    liveAvailabilityDesc: 'Seats updated every request',
    dynamicFares: 'Dynamic Fares',
    dynamicFaresDesc: 'Based on operator + demand',
    tip: 'Tip',
    tipText: 'Hold spacebar to start voice input anytime.',
    seeCommands: 'See Commands',
    details: 'Details',
    bookNow: 'Book Now',
    save: 'Save',
    saved: 'Saved',
    noResults: 'No Results',
    tryDifferent: 'Try different filters or use voice search.',
    enterSource: 'Enter source (city, station)',
    enterDestination: 'Enter destination'
  },
  hi: {
    from: 'से',
    to: 'तक',
    type: 'प्रकार',
    date: 'तारीख',
    all: 'सभी',
    bus: 'बस',
    train: 'ट्रेन',
    searchTransport: 'यातायात खोजें',
    voice: 'आवाज़',
    recent: 'हाल की',
    voiceHint: 'कहें: "दिल्ली से मुंबई बस"',
    listening: 'सुन रहे हैं... कहें: "X से Y बस"',
    voiceReady: 'आवाज़ तैयार',
    voiceReadyDesc: 'कहें "जयपुर से अगली बस"',
    liveAvailability: 'लाइव उपलब्धता',
    liveAvailabilityDesc: 'हर अनुरोध पर सीटें अपडेट',
    dynamicFares: 'गतिशील किराया',
    dynamicFaresDesc: 'ऑपरेटर + मांग के आधार पर',
    tip: 'सुझाव',
    tipText: 'कभी भी आवाज़ इनपुट शुरू करने के लिए स्पेसबार दबाएं।',
    seeCommands: 'कमांड देखें',
    details: 'विवरण',
    bookNow: 'अभी बुक करें',
    save: 'सहेजें',
    saved: 'सहेजा गया',
    noResults: 'कोई परिणाम नहीं',
    tryDifferent: 'अलग फ़िल्टर आज़माएं या आवाज़ खोज का उपयोग करें।',
    enterSource: 'स्रोत दर्ज करें (शहर, स्टेशन)',
    enterDestination: 'गंतव्य दर्ज करें'
  }
};

// Hindi to English city name mapping
const cityNameMapping = {
  // Major cities
  'दिल्ली': 'Delhi',
  'देहरादून': 'Dehradun',
  'मुंबई': 'Mumbai',
  'बॉम्बे': 'Mumbai',
  'पुणे': 'Pune',
  'बेंगलुरु': 'Bangalore',
  'बैंगलोर': 'Bangalore',
  'चेन्नई': 'Chennai',
  'मद्रास': 'Chennai',
  'कोलकाता': 'Kolkata',
  'कलकत्ता': 'Kolkata',
  'हैदराबाद': 'Hyderabad',
  'अहमदाबाद': 'Ahmedabad',
  'जयपुर': 'Jaipur',
  'सूरत': 'Surat',
  'लखनऊ': 'Lucknow',
  'कानपुर': 'Kanpur',
  'नागपुर': 'Nagpur',
  'इंदौर': 'Indore',
  'थाणे': 'Thane',
  'भोपाल': 'Bhopal',
  'विशाखापत्तनम': 'Visakhapatnam',
  'पटना': 'Patna',
  'वडोदरा': 'Vadodara',
  'गाजियाबाद': 'Ghaziabad',
  'लुधियाना': 'Ludhiana',
  'कोयंबटूर': 'Coimbatore',
  'आगरा': 'Agra',
  'मदुरै': 'Madurai',
  'नाशिक': 'Nashik',
  'मेरठ': 'Meerut',
  'राजकोट': 'Rajkot',
  'वाराणसी': 'Varanasi',
  'बनारस': 'Varanasi',
  'श्रीनगर': 'Srinagar',
  'अमृतसर': 'Amritsar',
  'जोधपुर': 'Jodhpur',
  'रांची': 'Ranchi',
  'रायपुर': 'Raipur',
  'कोच्चि': 'Kochi',
  'कोचीन': 'Kochi',
  'चंडीगढ़': 'Chandigarh',
  'गुवाहाटी': 'Guwahati',
  'सोलापुर': 'Solapur',
  'हुबली': 'Hubli',
  'मैसूर': 'Mysore',
  'तिरुवनंतपुरम': 'Thiruvananthapuram',
  'तिरुचिरापल्ली': 'Tiruchirappalli',
  'कोटा': 'Kota',
  'जमशेदपुर': 'Jamshedpur',
  'अलीगढ़': 'Aligarh',
  'बरेली': 'Bareilly',
  'गोरखपुर': 'Gorakhpur',
  'मुरादाबाद': 'Moradabad',
  'जलंधर': 'Jalandhar',
  'अमरावती': 'Amravati',
  'नोएडा': 'Noida',
  'ग्रेटर नोएडा': 'Greater Noida',
  'गुरुग्राम': 'Gurgaon',
  'फरीदाबाद': 'Faridabad',
  'गाजियाबाद': 'Ghaziabad',
  'शिमला': 'Shimla',
  'मनाली': 'Manali',
  'हरिद्वार': 'Haridwar',
  'ऋषिकेश': 'Rishikesh',
  'मसूरी': 'Mussoorie',
  'नैनीताल': 'Nainital',
  'अल्मोड़ा': 'Almora',
  'रानीखेत': 'Ranikhet',
  'कुल्लू': 'Kullu',
  'सोलन': 'Solan',
  'धर्मशाला': 'Dharamshala',
  'मक्लोडगंज': 'McLeod Ganj',
  'दार्जिलिंग': 'Darjeeling',
  'गंगटोक': 'Gangtok',
  'कालिम्पोंग': 'Kalimpong',
  'उदयपुर': 'Udaipur',
  'माउंट आबू': 'Mount Abu',
  'जैसलमेर': 'Jaisalmer',
  'बीकानेर': 'Bikaner',
  'अजमेर': 'Ajmer',
  'पुष्कर': 'Pushkar',
  'चित्तौड़गढ़': 'Chittorgarh',
  'बूंदी': 'Bundi',
  'कोटा': 'Kota',
  'भरतपुर': 'Bharatpur',
  'अलवर': 'Alwar',
  'सीकर': 'Sikar',
  'झुंझुनू': 'Jhunjhunu',
  'चूरू': 'Churu',
  'नागौर': 'Nagaur',
  'पाली': 'Pali',
  'बाड़मेर': 'Barmer',
  'जालौर': 'Jalore',
  'सिरोही': 'Sirohi',
  'प्रतापगढ़': 'Pratapgarh',
  'बांसवाड़ा': 'Banswara',
  'डूंगरपुर': 'Dungarpur',
  'बारां': 'Baran',
  'कोटा': 'Kota',
  'झालावाड़': 'Jhalawar',
  'बूंदी': 'Bundi',
  'सवाई माधोपुर': 'Sawai Madhopur',
  'करौली': 'Karauli',
  'धौलपुर': 'Dholpur'
};

// Function to convert Hindi city name to English
function convertHindiToEnglishCityName(hindiName) {
  if (!hindiName) return hindiName;
  
  const trimmed = hindiName.trim();
  
  // Direct mapping lookup
  if (cityNameMapping[trimmed]) {
    return cityNameMapping[trimmed];
  }
  
  // Case-insensitive lookup
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [hindi, english] of Object.entries(cityNameMapping)) {
    if (hindi.toLowerCase() === lowerTrimmed) {
      return english;
    }
  }
  
  // If no mapping found, return original (might already be in English or transliterated)
  return trimmed;
}

// Update UI based on language
function updateLanguageUI() {
  if (!voiceHint) return; // Safety check
  
  const t = translations[currentLanguage];
  
  // Voice hint and label
  if (voiceHint) {
    voiceHint.textContent = t.voiceHint;
  }
  const voiceLabel = el('voice-label');
  if (voiceLabel) {
    voiceLabel.textContent = t.voice;
  }
  
  // Form labels
  const fromLabel = document.querySelector('label[for="source"]');
  if (fromLabel) fromLabel.textContent = `📍 ${t.from}`;
  
  const toLabel = document.querySelector('label[for="destination"]');
  if (toLabel) toLabel.textContent = `🎯 ${t.to}`;
  
  const typeLabel = document.querySelector('label[for="transport-type"]');
  if (typeLabel) typeLabel.textContent = `🚌 ${t.type}`;
  
  const dateLabel = document.querySelector('label[for="date"]');
  if (dateLabel) dateLabel.textContent = `📅 ${t.date}`;
  
  // Placeholders
  const sourceInput = el('source');
  if (sourceInput) sourceInput.placeholder = t.enterSource;
  
  const destInput = el('destination');
  if (destInput) destInput.placeholder = t.enterDestination;
  
  // Select options
  const transportSelect = el('transport-type');
  if (transportSelect) {
    transportSelect.options[0].text = t.all;
    transportSelect.options[1].text = t.bus;
    transportSelect.options[2].text = t.train;
  }
  
  // Buttons
  if (searchBtn) {
    const searchBtnSpans = searchBtn.querySelectorAll('span');
    searchBtnSpans.forEach(span => {
      if (!span.classList.contains('btn-icon') && !span.classList.contains('loading') && 
          (span.textContent.includes('Search') || span.textContent.includes('खोजें'))) {
        span.textContent = t.searchTransport;
      }
    });
  }
  
  const historyBtnEl = el('history-btn');
  if (historyBtnEl) {
    historyBtnEl.innerHTML = `🕓 ${t.recent}`;
  }
  
  // Insight cards
  const insightLabels = document.querySelectorAll('.insight-label');
  const insightValues = document.querySelectorAll('.insight-value');
  if (insightLabels.length >= 3 && insightValues.length >= 3) {
    insightLabels[0].textContent = t.voiceReady;
    insightValues[0].textContent = t.voiceReadyDesc;
    insightLabels[1].textContent = t.liveAvailability;
    insightValues[1].textContent = t.liveAvailabilityDesc;
    insightLabels[2].textContent = t.dynamicFares;
    insightValues[2].textContent = t.dynamicFaresDesc;
  }
  
  // Assistant banner
  const assistantTitle = document.querySelector('.assistant-title');
  const assistantText = document.querySelector('.assistant-text');
  const assistantAction = el('assistant-help');
  if (assistantTitle) assistantTitle.textContent = t.tip;
  if (assistantText) assistantText.textContent = t.tipText;
  if (assistantAction) assistantAction.textContent = t.seeCommands;
  
  // Update voice recognition language
  if (recognition) {
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
  }
}

// Language selector
if (languageSelect) {
  languageSelect.value = currentLanguage;
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('transport_language', currentLanguage);
    updateLanguageUI();
  });
}

// Initialize language UI after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateLanguageUI();
  });
} else {
  updateLanguageUI();
}

// Save / load recent searches (localStorage)
function saveSearchHistory(src, dst, type='') {
  try {
    const key = 'transport_history_v1';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = { source: src, destination: dst, type, ts: new Date().toLocaleString() };
    // avoid duplicates: if same pair exists, move it to top
    const filtered = list.filter(i => !(i.source === src && i.destination === dst && i.type === type));
    filtered.unshift(entry);
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 6)));
  } catch(e){ console.warn(e) }
}
function loadSearchHistory(){
  try {
    return JSON.parse(localStorage.getItem('transport_history_v1') || '[]');
  } catch(e){ return [] }
}

// Render history panel
function renderHistory(){
  const list = loadSearchHistory();
  historyList.innerHTML = '';
  if(list.length === 0){
    const li = document.createElement('div');
    li.className='history-item';
    li.textContent = 'No recent searches';
    historyList.appendChild(li);
    return;
  }
  list.forEach(item => {
    const li = document.createElement('div');
    li.className='history-item';
    li.innerHTML = `<div>${item.source} ➜ ${item.destination}</div><div class="muted">${item.ts}</div>`;
    li.addEventListener('click', () => {
      el('source').value = item.source;
      el('destination').value = item.destination;
      historyPanel.classList.remove('open');
      doSearch(); // auto-search
    });
    historyList.appendChild(li);
  });
}

// Toggle history panel
// Toggle history panel
historyBtn.addEventListener('click', () => {
  renderHistory();
  historyPanel.classList.remove('hidden');
  setTimeout(() => historyPanel.classList.add('open'), 20); // trigger animation
});

if (closeHistory) {
  closeHistory.addEventListener('click', () => {
    historyPanel.classList.remove('open');
    setTimeout(() => historyPanel.classList.add('hidden'), 300); // hide after animation
  });
}
document.addEventListener('click', (e) => {
  if (!historyPanel.contains(e.target) && e.target !== historyBtn) {
    historyPanel.classList.remove('open');
    setTimeout(() => historyPanel.classList.add('hidden'), 300);
  }
});

quickChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const src = chip.dataset.src || '';
    const dst = chip.dataset.dst || '';
    const type = chip.dataset.type || '';
    if (src) el('source').value = src;
    if (dst) el('destination').value = dst;
    if (type !== undefined) el('transport-type').value = type;
    doSearch();
  });
});
const scenarioChips = document.querySelectorAll('.scenario-chip');
scenarioChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const src = chip.dataset.src || '';
    const dst = chip.dataset.dst || '';
    const type = chip.dataset.type || '';
    if (src) el('source').value = src;
    if (dst) el('destination').value = dst;
    if (type !== undefined) el('transport-type').value = type;
    doSearch();
  });
});

function updateStatusMeta() {
  const now = new Date();
  if (statusTimeEl) {
    statusTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (statusDateEl) {
    statusDateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (statusNetworkEl) {
    const online = navigator.onLine;
    statusNetworkEl.textContent = online ? 'Online' : 'Offline';
    statusNetworkEl.classList.toggle('offline', !online);
  }
}
updateStatusMeta();
setInterval(updateStatusMeta, 15000);
window.addEventListener('online', updateStatusMeta);
window.addEventListener('offline', updateStatusMeta);
// Simple speak helper with language support
function speak(text){
  if(!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
  utter.rate = 1;
  utter.pitch = 1;
  // Don't cancel previous speech - queue it instead
  window.speechSynthesis.speak(utter);
}

// Build parameters and call backend
async function doSearch(){
  let src = el('source').value.trim();
  let dst = el('destination').value.trim();
  const type = el('transport-type').value;
  const date = el('date').value;
  if(!src || !dst){
    const t = translations[currentLanguage];
    speak(currentLanguage === 'hi' ? 'कृपया स्रोत और गंतव्य दोनों दर्ज करें' : 'Please provide both source and destination');
    alert(currentLanguage === 'hi' ? 'कृपया स्रोत और गंतव्य दोनों दर्ज करें' : 'Please enter both source and destination');
    return;
  }

  // Convert Hindi city names to English for database search
  const srcEnglish = convertHindiToEnglishCityName(src);
  const dstEnglish = convertHindiToEnglishCityName(dst);
  
  // Update form fields with English names (for display consistency)
  if (srcEnglish !== src) {
    el('source').value = srcEnglish;
  }
  if (dstEnglish !== dst) {
    el('destination').value = dstEnglish;
  }

  // UI: loading
  searchBtn.disabled = true;
  searchLoading.classList.remove('hidden');
  searchBtn.classList.add('loading');

  // Save to history (save English names for consistency)
  saveSearchHistory(srcEnglish, dstEnglish, type);

  try {
    const params = new URLSearchParams({ source: srcEnglish, destination: dstEnglish, type, date });
    const res = await fetch('/api/search?' + params.toString());
    if(!res.ok) throw new Error('Network error');
    const data = await res.json();

    renderResults(data);
    if(data.results && data.results.length > 0){
      const cheapest = data.results.reduce((a,b)=> a.fare <= b.fare ? a : b);
      let speechText = '';
      
      if (currentLanguage === 'hi') {
        speechText = `${data.results.length} ${data.results.length === 1 ? 'विकल्प' : 'विकल्प'} मिले ${srcEnglish} से ${dstEnglish} के लिए`;
        if(date) {
          const dateObj = new Date(date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('hi-IN', { month: 'long', day: 'numeric', year: 'numeric' });
          speechText += ` ${dateStr} को`;
        }
        const transportType = cheapest.transport_type === 'bus' ? 'बस' : 'ट्रेन';
        speechText += `. सबसे सस्ता ${transportType} ${cheapest.operator} द्वारा ${cheapest.departure_time} पर, किराया ${Math.round(cheapest.fare)} रुपए`;
        if(data.results.length > 1) {
          speechText += `. ${data.results.length - 1} और विकल्प उपलब्ध हैं`;
        }
      } else {
        speechText = `Found ${data.results.length} ${data.results.length === 1 ? 'option' : 'options'} from ${srcEnglish} to ${dstEnglish}`;
        if(date) {
          const dateObj = new Date(date + 'T00:00:00');
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          speechText += ` for ${dateStr}`;
        }
        speechText += `. Cheapest is ${cheapest.transport_type} by ${cheapest.operator} departing at ${cheapest.departure_time}, costing rupees ${Math.round(cheapest.fare)}`;
        if(data.results.length > 1) {
          speechText += `. There are ${data.results.length - 1} more options available`;
        }
      }
      speak(speechText);
    } else {
      if (currentLanguage === 'hi') {
        speak(`${src} से ${dst} के लिए कोई यातायात नहीं मिला`);
      } else {
        speak(`No transport found for this route from ${src} to ${dst}`);
      }
    }
  } catch(err){
    console.error(err);
    alert('Search failed. Check console.');
  } finally {
    searchBtn.disabled = false;
    searchLoading.classList.add('hidden');
    searchBtn.classList.remove('loading');
  }
}

// Render results as glass cards
// Render results as glass cards (with universal ID detection)
function renderResults(data) {
  resultsContainer.innerHTML = '';
  const t = translations[currentLanguage];

  if (!data || !data.results || data.results.length === 0) {
    const no = document.createElement('div');
    no.className = 'result-card';
    no.innerHTML = `
      <div class="result-row">
        <div class="result-title">${t.noResults}</div>
      </div>
      <div style="color:var(--muted);margin-top:8px">
        ${t.tryDifferent}
      </div>`;
    resultsContainer.appendChild(no);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'results-grid';

  data.results.forEach(r => {
    const scheduleId = r.schedule_id || r.id || r.scheduleid || r.scheduleID;
    const card = document.createElement('div');
    card.className = 'result-card-modern';
    
    // Store travel_date in data attribute for modal use
    const travelDate = r.travel_date || '';
    card.setAttribute('data-travel-date', travelDate);

    const icon = r.transport_type === 'bus' ? '🚌' : '🚆';
    const badgeColor = r.transport_type === 'bus' ? 'BUS' : 'TRAIN';

    card.innerHTML = `
      <div class="result-header">
        <div class="result-operator">${icon} ${r.operator}</div>
        <div class="result-badge">${badgeColor}</div>
      </div>

      <div class="result-times">
        <span><span class="dot dot-start"></span>${r.departure_time}</span>
        <span><span class="dot dot-end"></span>${r.arrival_time}</span>
      </div>

      <div class="result-fare">
        <span>💰 ₹${Number(r.fare).toFixed(0)}</span>
        <span>📏 ${r.distance_km} km</span>
      </div>

      <div class="result-buttons">
        <button class="btn-modern btn-details">${t.details}</button>
        <button class="btn-modern btn-book">${t.bookNow}</button>
      </div>

      <div style="margin-top:8px;text-align:center;">
  <button class="bookmark-btn"
          data-id="${scheduleId}"
          data-fare="${Number(r.fare || 0)}">
    ⭐ ${t.save}
  </button>
</div>

    `;

    grid.appendChild(card);
  });

  resultsContainer.appendChild(grid);
}


// Wire search button
searchBtn.addEventListener('click', (e) => {
  e.preventDefault();
  doSearch();
});

// Voice recognition with improved UX
let recognition = null;
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    micIcon.classList.add('mic-listening');
    voiceHint.classList.remove('hidden');
    const t = translations[currentLanguage];
    voiceHint.textContent = t.listening;
  };
  recognition.onend = () => {
    micIcon.classList.remove('mic-listening');
    voiceHint.classList.add('hidden');
  };
  recognition.onerror = (e) => {
    micIcon.classList.remove('mic-listening');
    voiceHint.classList.add('hidden');
    console.warn('Recognition error', e);
    alert('Voice recognition error');
  };
 recognition.onresult = (e) => {
  const transcript = e.results[0][0].transcript.toLowerCase().trim();
  console.log("🎤 Heard:", transcript);

  // === TRANSPORT TYPE DETECTION (English and Hindi) ===
  let type = '';
  if (transcript.includes('bus') || transcript.includes('बस')) type = 'bus';
  else if (transcript.includes('train') || transcript.includes('ट्रेन') || transcript.includes('रेल')) type = 'train';

  // === SOURCE AND DESTINATION DETECTION ===
  let src = '', dst = '';
  
  if (currentLanguage === 'hi') {
    // Hindi patterns: 
    // "देहरादून से दिल्ली बस" (X से Y बस)
    // "दिल्ली से मुंबई तक" (X से Y तक)
    // "से दिल्ली तक मुंबई" (से X तक Y)
    
    console.log('🎤 Hindi transcript:', transcript);
    
    // Pattern 1: "X से Y बस/ट्रेन" - most common pattern
    // Split on "से" and extract source and destination
    const seIndex = transcript.indexOf('से');
    if (seIndex >= 0) {
      if (seIndex > 0) {
        // "से" is in the middle: "X से Y बस"
        src = transcript.substring(0, seIndex).trim();
        let afterSe = transcript.substring(seIndex + 2).trim(); // +2 for "से" (2 chars)
        
        // Remove transport type if present at the end
        afterSe = afterSe.replace(/\s+(बस|ट्रेन|bus|train)$/i, '').trim();
        // Remove "तक" if present
        afterSe = afterSe.replace(/\s+तक\s*$/i, '').trim();
        
        dst = afterSe;
        console.log('✅ Pattern 1 matched - src:', src, 'dst:', dst);
      } else {
        // "से" is at the start: "से X तक Y" or "से X Y बस"
        const afterSe = transcript.substring(2).trim(); // Skip "से"
        const takIndex = afterSe.indexOf('तक');
        
        if (takIndex > 0) {
          // Pattern: "से X तक Y"
          const parts = afterSe.split('तक');
          if (parts.length >= 2) {
            src = parts[0].trim();
            let dstPart = parts.slice(1).join('तक').trim();
            // Remove transport type if present
            dstPart = dstPart.replace(/\s+(बस|ट्रेन|bus|train)$/i, '').trim();
            dst = dstPart;
            console.log('✅ Pattern 2 matched (से X तक Y) - src:', src, 'dst:', dst);
          }
        } else {
          // Pattern: "से X Y बस" - take first word as source, rest as destination
          const words = afterSe.split(/\s+/);
          if (words.length >= 2) {
            // Find where transport type starts
            let destEnd = words.length;
            for (let i = words.length - 1; i >= 0; i--) {
              if (/^(बस|ट्रेन|bus|train)$/i.test(words[i])) {
                destEnd = i;
                break;
              }
            }
            src = words[0];
            dst = words.slice(1, destEnd).join(' ').trim();
            console.log('✅ Pattern 2 matched (से X Y बस) - src:', src, 'dst:', dst);
          }
        }
      }
    } else {
      console.log('❌ No "से" found in Hindi transcript');
    }
  } else {
    // English patterns
    if (transcript.includes('from') && transcript.includes('to')) {
      const afterFrom = transcript.split('from')[1];
      const parts = afterFrom.split('to');
      src = parts[0]?.trim() || '';
      dst = parts[1]?.trim() || '';
    }
  }

  // === DATE DETECTION (English and Hindi) ===
  let date = '';
  const today = new Date();

  // Hindi month names
  const hindiMonths = {
    'जनवरी': 0, 'फरवरी': 1, 'मार्च': 2, 'अप्रैल': 3, 'मई': 4, 'जून': 5,
    'जुलाई': 6, 'अगस्त': 7, 'सितंबर': 8, 'अक्टूबर': 9, 'नवंबर': 10, 'दिसंबर': 11
  };
  const englishMonths = [
    "january","february","march","april","may","june",
    "july","august","september","october","november","december"
  ];

  if (transcript.includes('today') || transcript.includes('आज')) {
    date = today.toISOString().split('T')[0];
  } else if (transcript.includes('tomorrow') || transcript.includes('कल')) {
    const d = new Date();
    d.setDate(today.getDate() + 1);
    date = d.toISOString().split('T')[0];
  } else if (transcript.includes('day after tomorrow') || transcript.includes('परसों')) {
    const d = new Date();
    d.setDate(today.getDate() + 2);
    date = d.toISOString().split('T')[0];
  } else {
    // Match English: "on 15 november", "on 17th november"
    let dateMatch = transcript.match(/on\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)/);
    let monthIndex = -1;
    
    if (dateMatch) {
      const monthName = dateMatch[2].toLowerCase();
      monthIndex = englishMonths.indexOf(monthName);
    } else {
      // Match Hindi: "17 नवंबर को", "15 जनवरी"
      dateMatch = transcript.match(/(\d{1,2})(?:\s+तारीख|\s+को)?\s+([\u0900-\u097F]+)/);
      if (dateMatch) {
        const monthName = dateMatch[2].trim();
        monthIndex = hindiMonths[monthName] !== undefined ? hindiMonths[monthName] : -1;
      }
    }
    
    if (dateMatch && monthIndex >= 0) {
      const day = parseInt(dateMatch[1]);
      const year = today.getFullYear();
      // Format date as YYYY-MM-DD directly to avoid timezone issues
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      date = `${year}-${monthStr}-${dayStr}`;
    }
  }

  // Clean destination: remove date information if it was extracted (English and Hindi)
  if (date && dst) {
    // Remove English patterns like "on 17th november", "on 17 november", etc.
    dst = dst.replace(/\s+on\s+\d{1,2}(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i, '').trim();
    // Remove Hindi patterns like "17 नवंबर को", "15 जनवरी"
    const hindiMonthNames = Object.keys(hindiMonths).join('|');
    dst = dst.replace(new RegExp(`\\s+\\d{1,2}(?:\\s+तारीख|\\s+को)?\\s+(${hindiMonthNames})`, 'i'), '').trim();
  }

  // === TIME RANGE DETECTION ===
  let start_time = '', end_time = '';

  // Example: "between 6 am and 9 am"
  const betweenMatch = transcript.match(/between\s+(\d{1,2})\s*(am|pm)?\s+and\s+(\d{1,2})\s*(am|pm)?/);
  if (betweenMatch) {
    start_time = convertTo24Hour(betweenMatch[1], betweenMatch[2]);
    end_time = convertTo24Hour(betweenMatch[3], betweenMatch[4]);
  } else {
    // Example: "after 5 pm"
    const afterMatch = transcript.match(/after\s+(\d{1,2})\s*(am|pm)?/);
    if (afterMatch) {
      start_time = convertTo24Hour(afterMatch[1], afterMatch[2]);
    } else if (transcript.includes('next')) {
      // “Next bus/train” = starting from now
      const now = new Date();
      start_time = now.toTimeString().split(' ')[0];
    }
  }

  // === FILL UI FIELDS ===
  if (src && dst) {
    // Convert Hindi city names to English for database search
    const srcEnglish = convertHindiToEnglishCityName(src);
    const dstEnglish = convertHindiToEnglishCityName(dst);
    
    console.log('🔄 City name conversion:', { 
      original: { src, dst }, 
      converted: { srcEnglish, dstEnglish } 
    });
    
    el('source').value = capitalize(srcEnglish);
    el('destination').value = capitalize(dstEnglish);
    el('transport-type').value = type || '';
    if (date) el('date').value = date;

    // Speak in selected language (use original Hindi names for speech)
    if (currentLanguage === 'hi') {
      const transportText = type === 'bus' ? 'बस' : type === 'train' ? 'ट्रेन' : 'यातायात';
      speak(`${src} से ${dst} के लिए ${transportText} खोज रहे हैं` + (date ? ` ${date} को` : ''));
    } else {
      speak(`Searching ${type || 'transport'} from ${srcEnglish} to ${dstEnglish}` + (date ? ` on ${date}` : ''));
    }

    // Call backend with English city names for database search
    doSearchWithParams(srcEnglish, dstEnglish, type, date, start_time, end_time);
  } else {
    if (currentLanguage === 'hi') {
      speak("क्षमा करें, मैं रूट समझ नहीं पाया। कृपया फिर से कोशिश करें।");
    } else {
      speak("Sorry, I couldn't understand the route. Please try again.");
    }
  }
};

// === Helper to convert AM/PM to 24-hour ===
function convertTo24Hour(hour, period) {
  let h = parseInt(hour);
  if (period === 'pm' && h < 12) h += 12;
  if (period === 'am' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:00:00`;
}

// === Custom search with extra time filters ===
async function doSearchWithParams(src, dst, type, date, start, end) {
  const params = new URLSearchParams({
    source: src,
    destination: dst,
    type: type || '',
    date: date || '',
    start_time: start || '',
    end_time: end || ''
  });
  const res = await fetch('/api/search?' + params.toString());
  const data = await res.json();
  renderResults(data);
  
  // Speak the results
  if(data.results && data.results.length > 0){
    const cheapest = data.results.reduce((a,b)=> a.fare <= b.fare ? a : b);
    let speechText = '';
    
    if (currentLanguage === 'hi') {
      speechText = `${data.results.length} ${data.results.length === 1 ? 'विकल्प' : 'विकल्प'} मिले ${src} से ${dst} के लिए`;
      if(date) {
        const dateObj = new Date(date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('hi-IN', { month: 'long', day: 'numeric', year: 'numeric' });
        speechText += ` ${dateStr} को`;
      }
      const transportType = cheapest.transport_type === 'bus' ? 'बस' : 'ट्रेन';
      speechText += `. सबसे सस्ता ${transportType} ${cheapest.operator} द्वारा ${cheapest.departure_time} पर, किराया ${Math.round(cheapest.fare)} रुपए`;
      if(data.results.length > 1) {
        speechText += `. ${data.results.length - 1} और विकल्प उपलब्ध हैं`;
      }
    } else {
      speechText = `Found ${data.results.length} ${data.results.length === 1 ? 'option' : 'options'} from ${src} to ${dst}`;
      if(date) {
        const dateObj = new Date(date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        speechText += ` for ${dateStr}`;
      }
      speechText += `. Cheapest is ${cheapest.transport_type} by ${cheapest.operator} departing at ${cheapest.departure_time}, costing rupees ${Math.round(cheapest.fare)}`;
      if(data.results.length > 1) {
        speechText += `. There are ${data.results.length - 1} more options available`;
      }
    }
    speak(speechText);
  } else {
    if (currentLanguage === 'hi') {
      speak(`${src} से ${dst} के लिए कोई यातायात नहीं मिला`);
    } else {
      speak(`No transport found for this route from ${src} to ${dst}`);
    }
  }
}

}

// start/stop recognition
voiceBtn.addEventListener('click', () => {
  if(!recognition) {
    alert('Voice recognition not supported in this browser.');
    return;
  }
  try {
    recognition.start();
  } catch(e){ console.warn(e) }
});


// small capitalize helper
function capitalize(s){
  return s.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
// ===================== ⭐ BOOKMARK FEATURE =====================
// ===================== ⭐ BOOKMARK FEATURE (FIXED) =====================
document.addEventListener('click', async (e) => {
  const bookmarkBtn = e.target.closest('.bookmark-btn');
  if (!bookmarkBtn) return; // clicked elsewhere

  const scheduleId = bookmarkBtn.dataset.id;
  if (!scheduleId) {
    alert("Schedule ID missing. Cannot bookmark this item.");
    return;
  }

  bookmarkBtn.disabled = true;
  bookmarkBtn.innerHTML = "⏳ Saving...";

  try {
    const fare = parseFloat(bookmarkBtn.dataset.fare || '0');
    const res = await fetch('/api/bookmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedule_id: scheduleId, fare: fare })
});


    const data = await res.json();
    const t = translations[currentLanguage];
    if (res.ok && data.success) {
      bookmarkBtn.classList.add('saved');
      bookmarkBtn.innerHTML = `<span class="icon">💾</span> <span class="text">${t.saved}</span>`;
    } else {
      bookmarkBtn.innerHTML = `⭐ ${t.save}`;
      alert(data.error || "Failed to save bookmark");
    }
  } catch (err) {
    console.error('Bookmark error:', err);
    const t = translations[currentLanguage];
    alert('Could not add to bookmarks');
    bookmarkBtn.innerHTML = `⭐ ${t.save}`;
  } finally {
    bookmarkBtn.disabled = false;
  }
});

// ===================== ⭐ BOOKMARKS PANEL (VIEW + DELETE) =====================

// Open bookmarks popup
// === ⭐ BOOKMARKS POPUP ===
// ===================== ⭐ BOOKMARKS PANEL (CENTER MODAL) =====================
const bookmarkLink = document.getElementById('bookmark-link');
const overlay = document.getElementById('bookmarks-overlay');
const bookmarksPanel = document.getElementById('bookmarks-panel');
const bookmarksList = document.getElementById('bookmarks-list');
const closeBookmarks = document.getElementById('close-bookmarks');

if (bookmarkLink) {
  bookmarkLink.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      bookmarksList.innerHTML = '';

      if (data.bookmarks && data.bookmarks.length > 0) {
        data.bookmarks.forEach(b => {
          const li = document.createElement('li');
          li.innerHTML = `
            <div>
              <strong>${b.operator}</strong> (${b.transport_type.toUpperCase()})<br>
              ${b.source} → ${b.destination}<br>
              🕐 ${b.departure_time} → ${b.arrival_time}<br>
              💰 <strong>₹${Number(b.fare).toFixed(0)}</strong>
            </div>
            <button class="remove-bookmark" data-id="${b.schedule_id}">❌ Remove</button>
          `;
          bookmarksList.appendChild(li);
        });
      } else {
        bookmarksList.innerHTML = `<p>No bookmarks saved yet.</p>`;
      }

      overlay.classList.add('open');
      bookmarksPanel.classList.add('open');
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  });
}

// Close modal
if (closeBookmarks) {
  closeBookmarks.addEventListener('click', () => {
    bookmarksPanel.classList.remove('open');
    setTimeout(() => overlay.classList.remove('open'), 250);
  });
}

// Close if user clicks outside modal
if (overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      bookmarksPanel.classList.remove('open');
      setTimeout(() => overlay.classList.remove('open'), 250);
    }
  });
}
// Remove a bookmark
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('remove-bookmark')) {
    const id = e.target.dataset.id;
    try {
      await fetch(`/api/bookmark/${id}`, { method: 'DELETE' });
      e.target.closest('li').remove();
    } catch (err) {
      console.error('Delete bookmark error:', err);
    }
  }
});
// ================== DETAILS MODAL LOGIC ==================
const detailsModal = document.getElementById('details-modal');
const closeDetails = document.getElementById('close-details');

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-details')) {
    const card = e.target.closest('.result-card-modern');
    const operator = card.querySelector('.result-operator').textContent;
    const type = card.querySelector('.result-badge').textContent;
    const times = card.querySelectorAll('.result-times span');
    const fare = card.querySelector('.result-fare span:first-child').textContent.replace('💰', '').trim();
    const distance = card.querySelector('.result-fare span:last-child').textContent.replace('📏', '').trim();
    
    // Get travel_date from card data attribute
    const travelDateStr = card.getAttribute('data-travel-date') || '';
    let displayDate = new Date().toLocaleDateString(); // fallback to today
    if (travelDateStr) {
      try {
        // Parse date string (format: YYYY-MM-DD) and format it
        const dateParts = travelDateStr.split('-');
        if (dateParts.length === 3) {
          const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
          displayDate = date.toLocaleDateString();
        }
      } catch (err) {
        console.warn('Error parsing travel date:', err);
      }
    }

    // populate modal
    document.getElementById('details-operator').textContent = operator;
    document.getElementById('details-type').textContent = type;
    document.getElementById('details-departure').textContent = times[0].innerText;
    document.getElementById('details-arrival').textContent = times[1].innerText;
    document.getElementById('details-fare').textContent = fare;
    document.getElementById('details-distance').textContent = distance;
    document.getElementById('details-date').textContent = displayDate;

    detailsModal.classList.remove('hidden');
  }
});

closeDetails.addEventListener('click', () => {
  detailsModal.classList.add('hidden');
});
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-book')) {
    const card = e.target.closest('.result-card-modern');
    const operator = card.querySelector('.result-operator').textContent;
    const fare = card.querySelector('.result-fare span:first-child').textContent;
    alert(`✅ Booking confirmed for ${operator}\nTotal fare: ${fare}\n(Booking simulation)`);
  }
});
// ================= HELP POPUP LOGIC =================
// ================= HELP POPUP LOGIC =================
const helpButton = document.getElementById("help-btn");
const helpOverlay = document.getElementById("help-overlay");
const helpClose = document.getElementById("close-help");

// Ensure initial state
helpOverlay.classList.remove("open");
helpOverlay.style.opacity = 0;
helpOverlay.style.pointerEvents = "none";

if (helpButton) {
  helpButton.addEventListener("click", (e) => {
    e.preventDefault();
    helpOverlay.classList.add("open");
    helpOverlay.style.opacity = 1;
    helpOverlay.style.pointerEvents = "all";
  });
}

if (assistantHelp) {
  assistantHelp.addEventListener('click', (e) => {
    e.preventDefault();
    if (helpButton) {
      helpButton.click();
    }
  });
}

if (helpClose) {
  helpClose.addEventListener("click", () => {
    helpOverlay.classList.remove("open");
    helpOverlay.style.opacity = 0;
    helpOverlay.style.pointerEvents = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === helpOverlay) {
    helpOverlay.classList.remove("open");
    helpOverlay.style.opacity = 0;
    helpOverlay.style.pointerEvents = "none";
  }
});

toolbeltButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'voice') {
      voiceBtn?.click();
    } else if (action === 'history') {
      historyBtn?.click();
    } else if (action === 'bookmarks') {
      document.getElementById('bookmark-link')?.click();
    } else if (action === 'help') {
      document.getElementById('help-btn')?.click();
    }
  });
});


// quick init: restore language, history
(function init(){
  renderHistory();
})();

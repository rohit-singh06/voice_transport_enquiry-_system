// Helper
const el = id => document.getElementById(id);

// Language support
let currentLanguage = localStorage.getItem('transport_language') || 'en';
const languageSelect = el('language-select');
if (languageSelect) {
  languageSelect.value = currentLanguage;
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    localStorage.setItem('transport_language', currentLanguage);
    updateLanguageUI();
    // Update recognition language
    if (recognition) {
      recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    }
  });
}

// Update UI based on language
function updateLanguageUI() {
  if (currentLanguage === 'hi') {
    voiceHint.textContent = 'सुन रहे हैं... कहें: "दिल्ली से मुंबई बस"';
    el('voice-label').textContent = 'आवाज़';
  } else {
    voiceHint.textContent = 'Say: "Bus from Mumbai to Delhi"';
    el('voice-label').textContent = 'Voice';
  }
}

// Elements
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

// Initialize language UI
updateLanguageUI();

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
  const src = el('source').value.trim();
  const dst = el('destination').value.trim();
  const type = el('transport-type').value;
  const date = el('date').value;
  if(!src || !dst){
    speak('Please provide both source and destination');
    alert('Please enter both source and destination');
    return;
  }

  // UI: loading
  searchBtn.disabled = true;
  searchLoading.classList.remove('hidden');
  searchBtn.classList.add('loading');

  // Save to history
  saveSearchHistory(src, dst, type);

  try {
    const params = new URLSearchParams({ source: src, destination: dst, type, date });
    const res = await fetch('/api/search?' + params.toString());
    if(!res.ok) throw new Error('Network error');
    const data = await res.json();

    renderResults(data);
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

  if (!data || !data.results || data.results.length === 0) {
    const no = document.createElement('div');
    no.className = 'result-card';
    no.innerHTML = `
      <div class="result-row">
        <div class="result-title">No Results</div>
      </div>
      <div style="color:var(--muted);margin-top:8px">
        Try different filters or use voice search.
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
        <button class="btn-modern btn-details">Details</button>
        <button class="btn-modern btn-book">Book Now</button>
      </div>

      <div style="margin-top:8px;text-align:center;">
  <button class="bookmark-btn"
          data-id="${scheduleId}"
          data-fare="${Number(r.fare || 0)}">
    ⭐ Save
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
    if (currentLanguage === 'hi') {
      voiceHint.textContent = 'सुन रहे हैं... कहें: "दिल्ली से मुंबई बस"';
    } else {
      voiceHint.textContent = 'Listening... say: "Bus from X to Y"';
    }
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
    // Hindi patterns: "दिल्ली से मुंबई", "से दिल्ली तक मुंबई", etc.
    const hindiFromToMatch = transcript.match(/(?:से|from)\s+([a-z\u0900-\u097F\s]+?)(?:\s+तक|\s+to)\s+([a-z\u0900-\u097F\s]+)/);
    if (hindiFromToMatch) {
      src = hindiFromToMatch[1].trim();
      dst = hindiFromToMatch[2].trim();
    } else {
      // Try separate patterns
      const hindiFromMatch = transcript.match(/(?:से|from)\s+([a-z\u0900-\u097F\s]+?)(?:\s+तक|\s+to)/);
      const hindiToMatch = transcript.match(/(?:तक|to)\s+([a-z\u0900-\u097F\s]+?)(?:\s+बस|\s+ट्रेन|\s+bus|\s+train|$)/);
      if (hindiFromMatch) src = hindiFromMatch[1].trim();
      if (hindiToMatch) dst = hindiToMatch[1].trim();
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
    el('source').value = capitalize(src);
    el('destination').value = capitalize(dst);
    el('transport-type').value = type || '';
    if (date) el('date').value = date;

    // Speak in selected language
    if (currentLanguage === 'hi') {
      const transportText = type === 'bus' ? 'बस' : type === 'train' ? 'ट्रेन' : 'यातायात';
      speak(`${src} से ${dst} के लिए ${transportText} खोज रहे हैं` + (date ? ` ${date} को` : ''));
    } else {
      speak(`Searching ${type || 'transport'} from ${src} to ${dst}` + (date ? ` on ${date}` : ''));
    }

    // Call backend with parameters
    doSearchWithParams(src, dst, type, date, start_time, end_time);
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
    if (res.ok && data.success) {
      bookmarkBtn.classList.add('saved');
      bookmarkBtn.innerHTML = '<span class="icon">💾</span> <span class="text">Saved</span>';
    } else {
      bookmarkBtn.innerHTML = "⭐ Save";
      alert(data.error || "Failed to save bookmark");
    }
  } catch (err) {
    console.error('Bookmark error:', err);
    alert('Could not add to bookmarks');
    bookmarkBtn.innerHTML = "⭐ Save";
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


// quick init: restore language, history
(function init(){
  renderHistory();
})();

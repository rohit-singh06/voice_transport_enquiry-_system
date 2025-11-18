const API_BASE = "";
const el = (id) => document.getElementById(id);

// ========== MULTILINGUAL SUPPORT ==========
let currentLanguage = 'en';

// Language data
const translations = {
  en: {
    // Manual search
    'manual-search': 'Manual Search',
    'voice-search': 'Voice Search',
    'from': '📍 From',
    'to': '🎯 To',
    'transport-type': '🚌 Transport Type',
    'all-transport': 'All Transport',
    'bus-only': '🚌 Bus Only',
    'train-only': '🚆 Train Only',
    'travel-date': '📅 Travel Date',
    'start-time': '🕐 Start Time',
    'end-time': '🕕 End Time',
    'search-transport': 'Search Transport',
    'searching': 'Searching...',
    'enter-source': 'Enter source location',
    'enter-destination': 'Enter destination',
    'start-time-placeholder': 'Start Time',
    'end-time-placeholder': 'End Time',
    
    // Voice search
    'tap-to-speak': 'Tap to Speak',
    'press-mic': 'Press the microphone and say your query...',
    'try-saying': '💡 Try saying:',
    'example1': 'Bus from Mumbai to Delhi',
    'example2': 'Train from Bangalore to Chennai tomorrow',
    'example3': 'Transport from Pune to Goa at 9 AM',
    'listening': 'Listening... 🎙️',
    'you-said': 'You said:',
    'error-voice': 'Error capturing voice. Try again.',
    'processing': 'Processing your request...',
    'no-speech-support': 'Speech recognition not supported in your browser.',
    
    // Results
    'loading': 'Finding the best transport options for you...',
    'no-results': 'No transport found',
    'no-results-desc': 'Sorry, we couldn\'t find any transport options for this route. Please try different locations or dates.',
    'error-fetching': 'Error fetching results',
    'error-desc': 'Something went wrong while searching. Please try again.',
    'departure': 'Departure:',
    'arrival': 'Arrival:',
    'date': 'Date:',
    'distance': 'Distance:',
    'fare': 'Fare:',
    'daily': 'Daily',
    
    // Messages
    'enter-both': 'Please enter both source and destination.',
    'found-options': 'Found {count} options.',
    'no-transport-route': 'No transport found for this route.',
    'error-occurred': 'An error occurred while fetching results.',
    'searching-from-to': 'Searching for available options from {source} to {destination}.',
    'couldnt-detect': 'I couldn\'t detect the source or destination clearly. Please repeat your query.',
    'listening-query': 'Listening for your query.',
    'couldnt-hear': 'Sorry, I couldn\'t hear that properly. Please try again.'
  },
  hi: {
    // Manual search
    'manual-search': 'मैनुअल खोज',
    'voice-search': 'आवाज़ खोज',
    'from': '📍 कहाँ से',
    'to': '🎯 कहाँ तक',
    'transport-type': '🚌 परिवहन प्रकार',
    'all-transport': 'सभी परिवहन',
    'bus-only': '🚌 केवल बस',
    'train-only': '🚆 केवल ट्रेन',
    'travel-date': '📅 यात्रा की तारीख',
    'start-time': '🕐 प्रारंभ समय',
    'end-time': '🕕 समाप्ति समय',
    'search-transport': 'परिवहन खोजें',
    'searching': 'खोज रहे हैं...',
    'enter-source': 'स्रोत स्थान दर्ज करें',
    'enter-destination': 'गंतव्य दर्ज करें',
    'start-time-placeholder': 'प्रारंभ समय',
    'end-time-placeholder': 'समाप्ति समय',
    
    // Voice search
    'tap-to-speak': 'बोलने के लिए टैप करें',
    'press-mic': 'माइक्रोफोन दबाएं और अपना प्रश्न बोलें...',
    'try-saying': '💡 यह कहने की कोशिश करें:',
    'example1': 'मुंबई से दिल्ली तक बस',
    'example2': 'कल बैंगलोर से चेन्नई तक ट्रेन',
    'example3': 'सुबह 9 बजे पुणे से गोवा तक परिवहन',
    'listening': 'सुन रहे हैं... 🎙️',
    'you-said': 'आपने कहा:',
    'error-voice': 'आवाज़ पकड़ने में त्रुटि। कृपया पुनः प्रयास करें।',
    'processing': 'आपका अनुरोध संसाधित किया जा रहा है...',
    'no-speech-support': 'आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।',
    
    // Results
    'loading': 'आपके लिए सबसे अच्छे परिवहन विकल्प खोज रहे हैं...',
    'no-results': 'कोई परिवहन नहीं मिला',
    'no-results-desc': 'क्षमा करें, हमें इस मार्ग के लिए कोई परिवहन विकल्प नहीं मिला। कृपया अलग स्थान या तारीख आज़माएं।',
    'error-fetching': 'परिणाम प्राप्त करने में त्रुटि',
    'error-desc': 'खोजते समय कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
    'departure': 'प्रस्थान:',
    'arrival': 'आगमन:',
    'date': 'तारीख:',
    'distance': 'दूरी:',
    'fare': 'किराया:',
    'daily': 'दैनिक',
    
    // Messages
    'enter-both': 'कृपया स्रोत और गंतव्य दोनों दर्ज करें।',
    'found-options': '{count} विकल्प मिले।',
    'no-transport-route': 'इस मार्ग के लिए कोई परिवहन नहीं मिला।',
    'error-occurred': 'परिणाम प्राप्त करते समय त्रुटि हुई।',
    'searching-from-to': '{source} से {destination} तक उपलब्ध विकल्प खोज रहे हैं।',
    'couldnt-detect': 'मैं स्रोत या गंतव्य को स्पष्ट रूप से पहचान नहीं सका। कृपया अपना प्रश्न दोहराएं।',
    'listening-query': 'आपके प्रश्न के लिए सुन रहे हैं।',
    'couldnt-hear': 'क्षमा करें, मैं इसे ठीक से नहीं सुन सका। कृपया पुनः प्रयास करें।'
  }
};

// Function to get translated text
function t(key, params = {}) {
  let text = translations[currentLanguage][key] || translations['en'][key] || key;
  
  // Replace parameters in text
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}

// Function to update UI language
function updateLanguage(lang) {
  currentLanguage = lang;
  
  // Update all elements with data attributes
  document.querySelectorAll('[data-en], [data-hi]').forEach(element => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) {
      element.textContent = text;
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-placeholder-en], [data-placeholder-hi]').forEach(element => {
    const placeholder = element.getAttribute(`data-placeholder-${lang}`);
    if (placeholder) {
      element.placeholder = placeholder;
    }
  });
  
  // Update select options
  document.querySelectorAll('option[data-en], option[data-hi]').forEach(option => {
    const text = option.getAttribute(`data-${lang}`);
    if (text) {
      option.textContent = text;
    }
  });
  
  // Store language preference
  localStorage.setItem('preferred-language', lang);
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedLanguage = localStorage.getItem('preferred-language') || 'en';
  updateLanguage(savedLanguage);
  el('language-select').value = savedLanguage;
  
  // Add language selector event listener
  el('language-select').addEventListener('change', function() {
    updateLanguage(this.value);
  });
});

// ========== MODE TOGGLE ==========
const manualBox = el("manual-box");
const voiceBox = el("voice-box");
const manualBtn = el("manual-mode");
const voiceBtn = el("voice-mode");

manualBtn.onclick = () => {
  manualBox.classList.remove("hidden");
  voiceBox.classList.add("hidden");
  manualBtn.classList.add("active");
  voiceBtn.classList.remove("active");
};

voiceBtn.onclick = () => {
  voiceBox.classList.remove("hidden");
  manualBox.classList.add("hidden");
  voiceBtn.classList.add("active");
  manualBtn.classList.remove("active");
};
// ========== TEXT TO SPEECH ==========
function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.lang = currentLanguage === 'hi' ? "hi-IN" : "en-IN";
    synth.cancel(); // Stop any ongoing speech
    synth.speak(utter);
  } catch (err) {
    console.error("Speech synthesis error:", err);
  }
}

// ========== SEARCH (Manual Mode) ==========
async function searchTransport(params) {
  const url = `${API_BASE}/api/search?${params.toString()}`;
  const resultsContainer = el("results-container");
  const searchBtn = el("search-btn");
  const searchLoading = el("search-loading");
  
  // Show loading state
  searchBtn.disabled = true;
  searchLoading.classList.remove("hidden");
  searchBtn.querySelector(".text").textContent = t('searching');
  
  resultsContainer.innerHTML = `
    <div class="loading-container">
      <div class="loading"></div>
      <p>${t('loading')}</p>
    </div>
  `;

  try {
    const res = await fetch(url);
    const data = await res.json();

    resultsContainer.innerHTML = "";

    if (data.results && data.results.length > 0) {
      let spokenSummary = "";
      data.results.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "result-card";
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
          <h3 data-type="${item.transport_type}">${item.operator} (${item.transport_type.toUpperCase()})</h3>
          <p><strong>${t('departure')}</strong> ${item.departure_time}</p>
          <p><strong>${t('arrival')}</strong> ${item.arrival_time}</p>
          <p><strong>${t('date')}</strong> ${item.travel_date || t('daily')}</p>
          <p><strong>${t('distance')}</strong> ${item.distance_km} km</p>
          <p><strong>${t('fare')}</strong> ₹${item.fare}</p>
        `;
        resultsContainer.appendChild(card);

        // Speak summary of first 2 results
        if (index < 2) {
          spokenSummary += ` ${item.transport_type} by ${item.operator} departing at ${item.departure_time}, arriving at ${item.arrival_time}. Estimated fare ₹${item.fare}.`;
        }
      });

      // Add animation to cards
      const cards = resultsContainer.querySelectorAll('.result-card');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'all 0.5s ease-out';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });

      // Speak results aloud
      speak(t('found-options', {count: data.results.length}) + spokenSummary);
    } else {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🚫</div>
          <h3>${t('no-results')}</h3>
          <p>${t('no-results-desc')}</p>
        </div>
      `;
      speak(t('no-transport-route'));
    }
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = `
      <div class="error-results">
        <div class="error-icon">⚠️</div>
        <h3>${t('error-fetching')}</h3>
        <p>${t('error-desc')}</p>
      </div>
    `;
    speak(t('error-occurred'));
  } finally {
    // Reset button state
    searchBtn.disabled = false;
    searchLoading.classList.add("hidden");
    searchBtn.querySelector(".text").textContent = t('search-transport');
  }
}

el("search-btn").addEventListener("click", () => {
  const params = new URLSearchParams();
  const source = el("source").value.trim();
  const destination = el("destination").value.trim();
  const type = el("transport-type").value.trim();
  const date = el("date").value.trim();
  const startTime = el("start-time").value.trim();
  const endTime = el("end-time").value.trim();

  if (!source || !destination) {
    alert(t('enter-both'));
    speak(t('enter-both'));
    return;
  }

  params.append("source", source);
  params.append("destination", destination);
  if (type) params.append("type", type);
  if (date) params.append("date", date);
  if (startTime) params.append("start_time", startTime);
  if (endTime) params.append("end_time", endTime);

  searchTransport(params);
});

// ========== VOICE MODE ==========
const speakBtn = el("speak-btn");
const spokenText = el("spoken-text");

let recognition;

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = currentLanguage === 'hi' ? "hi-IN" : "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    speakBtn.classList.add("listening");
    spokenText.innerText = t('listening');
    const voiceWaves = el("voice-waves");
    voiceWaves.classList.remove("hidden");
    speak(t('listening-query'));
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    spokenText.innerText = `${t('you-said')} "${transcript}"`;
    speakBtn.classList.remove("listening");
    const voiceWaves = el("voice-waves");
    voiceWaves.classList.add("hidden");

    processVoiceQuery(transcript);
  };

  recognition.onerror = () => {
    speakBtn.classList.remove("listening");
    const voiceWaves = el("voice-waves");
    voiceWaves.classList.add("hidden");
    spokenText.innerText = t('error-voice');
    speak(t('couldnt-hear'));
  };

  recognition.onend = () => {
    speakBtn.classList.remove("listening");
    const voiceWaves = el("voice-waves");
    voiceWaves.classList.add("hidden");
  };
} else {
  speakBtn.disabled = true;
  spokenText.innerText = "Speech recognition not supported in your browser.";
}

speakBtn.onclick = () => recognition.start();

// ========== VOICE QUERY PROCESSING ==========
function processVoiceQuery(query) {
  query = query.toLowerCase();
  const params = new URLSearchParams();

  // Extract transport type (support both English and Hindi)
  if (query.includes("bus") || query.includes("बस")) params.append("type", "bus");
  else if (query.includes("train") || query.includes("ट्रेन")) params.append("type", "train");

  // Extract source and destination
  let source = null;
  let destination = null;

  if (currentLanguage === 'hi') {
    // Hindi patterns
    const hindiFromMatch = query.match(/(?:से|from)\s+([a-z\u0900-\u097F\s]+?)(?:\s+तक|\s+to)/);
    if (hindiFromMatch) {
      source = hindiFromMatch[1].trim();
    }
    
    const hindiToMatch = query.match(/(?:तक|to)\s+([a-z\u0900-\u097F\s]+?)(?:\s+बस|\s+ट्रेन|\s+bus|\s+train|$)/);
    if (hindiToMatch) {
      destination = hindiToMatch[1].trim();
    }
    
    // Fallback for Hindi
    if (!source) {
      const fromMatch = query.match(/(?:से|from)\s+([a-z\u0900-\u097F\s]+)/);
      if (fromMatch) source = fromMatch[1].trim();
    }
    if (!destination) {
      const toMatch = query.match(/(?:तक|to)\s+([a-z\u0900-\u097F\s]+)/);
      if (toMatch) destination = toMatch[1].trim();
    }
  } else {
    // English patterns
    const match = query.match(/from\s+([a-z\s]+)\s+to\s+([a-z\s]+)/);
    if (match) {
      source = match[1].trim();
      destination = match[2].trim();
    } else {
      // fallback as before
      const fromMatch = query.match(/from\s+([a-z\s]+)/);
      const toMatch = query.match(/to\s+([a-z\s]+)/);
      if (fromMatch) source = fromMatch[1].trim();
      if (toMatch) destination = toMatch[1].trim();
    }
  }

  if (source) params.append("source", source);
  if (destination) params.append("destination", destination);

  // Date detection (support both languages)
  const today = new Date();
  if (query.includes("today") || query.includes("आज")) {
    params.append("date", today.toISOString().split("T")[0]);
  } else if (query.includes("tomorrow") || query.includes("कल")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    params.append("date", tomorrow.toISOString().split("T")[0]);
  }

  // Time extraction (support both languages)
  const timeMatch = query.match(/(?:at|पर|सुबह|शाम)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|बजे|सुबह|शाम)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3];
    if ((period === "pm" || period === "शाम") && hours < 12) hours += 12;
    if ((period === "am" || period === "सुबह") && hours === 12) hours = 0;
    const formatted = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:00`;
    params.append("start_time", formatted);
  }

  // Fallback
  if (!params.get("source") || !params.get("destination")) {
    spokenText.innerText = t('couldnt-detect');
    speak(t('couldnt-detect'));
    return;
  }

  spokenText.innerText = t('processing');
  speak(t('searching-from-to', {source: params.get("source"), destination: params.get("destination")}));
  searchTransport(params);
  saveSearchHistory(source, destination);
}
// ========== RECENT SEARCHES FEATURE ==========
const historyBtn = el("history-btn");
const historyPopup = el("history-popup");
const historyList = el("history-list");
const closeHistory = el("close-history");

// Save history when a search happens
// (add this part inside your existing search-btn event if not already added)
function saveSearchHistory(source, destination) {
  let searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
  const newEntry = { source, destination, date: new Date().toLocaleString() };
  searchHistory.unshift(newEntry);
  searchHistory = searchHistory.slice(0, 5);
  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
}

// Open the recent searches popup
historyBtn.addEventListener("click", () => {
  const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
  historyList.innerHTML = "";

  if (searchHistory.length === 0) {
    historyList.innerHTML = "<li>No recent searches</li>";
  } else {
    searchHistory.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.source} ➜ ${item.destination}`;
      li.addEventListener("click", () => {
        el("source").value = item.source;
        el("destination").value = item.destination;
        historyPopup.classList.add("hidden");
        speak(`Route ${item.source} to ${item.destination} selected.`);
      });
      historyList.appendChild(li);
    });
  }

  historyPopup.classList.remove("hidden");
});

// Close the popup
closeHistory.addEventListener("click", () => {
  historyPopup.classList.add("hidden");
});


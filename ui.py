import streamlit as st
import requests
import speech_recognition as sr
import re
import io
import base64
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except Exception:
    GTTS_AVAILABLE = False

st.set_page_config(page_title="Voice Transport Assistant", page_icon="🎤", layout="centered")
st.title("🎤 Voice Transport Assistant")

# Base URL of your Flask API (fixed)
API_BASE = "http://127.0.0.1:5000"

# Session defaults
if "source" not in st.session_state:
    st.session_state["source"] = ""
if "destination" not in st.session_state:
    st.session_state["destination"] = ""
if "transport_type" not in st.session_state:
    st.session_state["transport_type"] = "any"
if "last_text_query" not in st.session_state:
    st.session_state["last_text_query"] = ""

# (Sidebar removed for simplicity)

# Helpers (define before voice UI)
def call_api(path: str, params: dict):
    try:
        url = f"{API_BASE}{path}"
        res = requests.get(url, params=params, timeout=15)
        res.raise_for_status()
        return res.json(), None
    except requests.exceptions.RequestException as e:
        return None, str(e)

def speak_text(message: str):
    if not GTTS_AVAILABLE:
        return
    try:
        # Generate audio in-memory and autoplay via HTML to avoid manual play
        tts = gTTS(text=message, lang="en")
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        b64 = base64.b64encode(buf.getvalue()).decode()
        audio_html = f'<audio autoplay="autoplay" hidden="hidden"><source src="data:audio/mp3;base64,{b64}" type="audio/mp3"></audio>'
        st.markdown(audio_html, unsafe_allow_html=True)
    except Exception:
        # Fallback: silently ignore TTS errors
        pass

def parse_query_spoken(text: str):
    lower = text.lower()
    # detect intent
    is_fare = any(k in lower for k in ["fare", "price", "cost"])
    is_next = any(k in lower for k in ["next", "first"])
    inferred_type = "train" if "train" in lower else ("bus" if "bus" in lower else "any")
    # extract source/destination using common pattern: from X to Y (allow multi-word)
    source = destination = None
    m = re.search(r"from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+)", text, flags=re.IGNORECASE)
    if m:
        source = m.group(1).strip()
        destination = m.group(2).strip()
    return {
        "transport_type": inferred_type,
        "is_fare": is_fare,
        "is_next": is_next,
        "source": source,
        "destination": destination,
    }

def render_result_card(title: str, items: dict):
    with st.container(border=True):
        st.subheader(title)
        cols = st.columns(4)
        cols[0].metric("Operator", items.get("operator", "-"))
        cols[1].metric("Departure", str(items.get("departure_time", "-")))
        cols[2].metric("Arrival", str(items.get("arrival_time", "-")))
        if "fare" in items:
            cols[3].metric("Fare (₹)", int(items.get("fare", 0)))
        else:
            cols[3].metric("Distance (km)", items.get("distance_km", "-"))

def show_summary(message: str):
    # Large, high-contrast summary line for readability
    st.markdown(f"<div style='font-size:1.1rem;font-weight:600;padding:10px 12px;border-radius:8px;background:#eef6ff;color:#0b5394;'>" 
                f"{message}</div>", unsafe_allow_html=True)

def handle_voice_once():
    try:
        recognizer = sr.Recognizer()
        with sr.Microphone() as source_mic:
            recognizer.dynamic_energy_threshold = True
            recognizer.pause_threshold = 0.6
            recognizer.non_speaking_duration = 0.3
            recognizer.phrase_threshold = 0.2
            st.info("Listening… please speak your query")
            recognizer.adjust_for_ambient_noise(source_mic, duration=0.8)
            audio = recognizer.listen(source_mic, timeout=8, phrase_time_limit=10)
        text = recognizer.recognize_google(audio)
        st.success(f"You said: {text}")

        parsed = parse_query_spoken(text)
        if parsed["source"]:
            st.session_state["source"] = parsed["source"]
        if parsed["destination"]:
            st.session_state["destination"] = parsed["destination"]
        if parsed["transport_type"] in ["bus", "train", "any"]:
            st.session_state["transport_type"] = parsed["transport_type"]

        src = st.session_state["source"]
        dst = st.session_state["destination"]
        inferred_type = st.session_state["transport_type"]
        if not src or not dst:
            msg = "I couldn’t catch both places. Please say ‘from CITY to CITY’."
            st.warning(msg)
            speak_text(msg)
            return

        # Decide endpoint and call
        if parsed["is_fare"]:
            params = {"source": src, "destination": dst}
            if inferred_type in ["bus", "train"]:
                params["type"] = inferred_type
            data, err = call_api("/api/fare", params)
            if err:
                st.error("Could not fetch fare.")
                speak_text("Sorry, I could not fetch the fare.")
                return
            fares = data.get("fares")
            if fares:
                best = fares[0]
                render_result_card("Fare", best)
                summary = f"The {best['transport_type']} fare from {src} to {dst} is ₹{int(best['fare'])}."
                show_summary(summary)
                speak_text(summary)
            else:
                msg = data.get("message", "No fare found")
                st.warning(msg)
                speak_text(msg)
        elif parsed["is_next"]:
            path = "/api/nexttrain" if inferred_type == "train" else "/api/nextbus"
            data, err = call_api(path, {"source": src, "destination": dst})
            if err:
                st.error("Could not fetch the next option.")
                speak_text("Sorry, I could not fetch the next option.")
                return
            if "operator" in data:
                render_result_card("Next option", data)
                summary = f"Next {data.get('transport_type','option')} from {src} to {dst}: {data['operator']} at {data['departure_time']}."
                show_summary(summary)
                speak_text(summary)
            else:
                msg = data.get("message", "No option found")
                st.warning(msg)
                speak_text(msg)
        else:
            params = {"source": src, "destination": dst}
            if inferred_type in ["bus", "train"]:
                params["type"] = inferred_type
            data, err = call_api("/api/search", params)
            if err:
                st.error("Could not complete the search.")
                speak_text("Sorry, I could not complete the search.")
                return
            results = data.get("results")
            if results:
                st.success(f"Found {len(results)} option(s)")
                for item in results[:5]:
                    render_result_card(item.get("transport_type", "Result"), item)
                first = results[0]
                summary = f"Found {len(results)} options. Example: {first['transport_type']} {first['operator']} at {first['departure_time']}."
                show_summary(summary)
                speak_text(summary)
            else:
                msg = data.get("message", "No transport found")
                st.warning(msg)
                speak_text(msg)
    except sr.WaitTimeoutError:
        st.error("I didn’t hear anything. Please try again.")
    except sr.UnknownValueError:
        st.error("Sorry, I couldn’t understand that. Please try again.")
        speak_text("Sorry, I could not understand that. Please try again.")
    except Exception:
        st.error("Something went wrong with the microphone. Please try again.")
        speak_text("An error occurred while processing your voice input.")

# Speak button for input
if st.button("Speak", use_container_width=True):
    handle_voice_once()

# Alternate typed query
typed_query = st.text_input("Or type your query", value=st.session_state["last_text_query"], placeholder="e.g., Next train from Delhi to Mumbai")
col_go, _ = st.columns([1, 5])
with col_go:
    if st.button("Search"):
        st.session_state["last_text_query"] = typed_query
        if typed_query.strip():
            parsed = parse_query_spoken(typed_query)
            if parsed["source"]:
                st.session_state["source"] = parsed["source"]
            if parsed["destination"]:
                st.session_state["destination"] = parsed["destination"]
            if parsed["transport_type"] in ["bus", "train", "any"]:
                st.session_state["transport_type"] = parsed["transport_type"]
            # Reuse flow
            # Minimal duplication by constructing a faux voice text
            # and using the same branching as handle_voice_once
            try:
                src = st.session_state["source"]
                dst = st.session_state["destination"]
                inferred_type = st.session_state["transport_type"]
                if not src or not dst:
                    msg = "Please include ‘from CITY to CITY’ in your query."
                    st.warning(msg)
                    speak_text(msg)
                else:
                    if parsed["is_fare"]:
                        params = {"source": src, "destination": dst}
                        if inferred_type in ["bus", "train"]:
                            params["type"] = inferred_type
                        data, err = call_api("/api/fare", params)
                        if err:
                            st.error("Could not fetch fare.")
                            speak_text("Sorry, I could not fetch the fare.")
                        else:
                            fares = data.get("fares")
                            if fares:
                                best = fares[0]
                                render_result_card("Fare", best)
                                summary = f"The {best['transport_type']} fare from {src} to {dst} is ₹{int(best['fare'])}."
                                show_summary(summary)
                                speak_text(summary)
                            else:
                                msg = data.get("message", "No fare found")
                                st.warning(msg)
                                speak_text(msg)
                    elif parsed["is_next"]:
                        path = "/api/nexttrain" if inferred_type == "train" else "/api/nextbus"
                        data, err = call_api(path, {"source": src, "destination": dst})
                        if err:
                            st.error("Could not fetch the next option.")
                            speak_text("Sorry, I could not fetch the next option.")
                        else:
                            if "operator" in data:
                                render_result_card("Next option", data)
                                summary = f"Next {data.get('transport_type','option')} from {src} to {dst}: {data['operator']} at {data['departure_time']}."
                                show_summary(summary)
                                speak_text(summary)
                            else:
                                msg = data.get("message", "No option found")
                                st.warning(msg)
                                speak_text(msg)
                    else:
                        params = {"source": src, "destination": dst}
                        if inferred_type in ["bus", "train"]:
                            params["type"] = inferred_type
                        data, err = call_api("/api/search", params)
                        if err:
                            st.error("Could not complete the search.")
                            speak_text("Sorry, I could not complete the search.")
                        else:
                            results = data.get("results")
                            if results:
                                st.success(f"Found {len(results)} option(s)")
                                for item in results[:5]:
                                    render_result_card(item.get("transport_type", "Result"), item)
                                first = results[0]
                                summary = f"Found {len(results)} options. Example: {first['transport_type']} {first['operator']} at {first['departure_time']}."
                                show_summary(summary)
                                speak_text(summary)
                            else:
                                msg = data.get("message", "No transport found")
                                st.warning(msg)
                                speak_text(msg)
            except Exception:
                st.error("Something went wrong. Please try again.")
                speak_text("Something went wrong. Please try again.")

st.markdown("---")
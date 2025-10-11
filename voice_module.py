import speech_recognition as sr
import pyttsx3
import requests

def speak(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

def take_voice_input():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("🎤 Speak now...")
        audio = r.listen(source)
    try:
        query = r.recognize_google(audio)
        print("You said:", query)
        return query
    except:
        speak("Sorry, I could not understand your voice.")
        return None

def process_query():
    query = take_voice_input()
    if not query:
        return
    
    # Enhanced query processing
    query_lower = query.lower()
    
    # Extract source and destination
    source = None
    destination = None
    
    if "from" in query_lower and "to" in query_lower:
        words = query_lower.split()
        try:
            from_idx = words.index("from")
            to_idx = words.index("to")
            source = words[from_idx + 1]
            destination = words[to_idx + 1]
        except (ValueError, IndexError):
            speak("Sorry, I couldn't understand the source and destination.")
            return
    
    if not source or not destination:
        speak("Please specify both source and destination.")
        return
    
    # Determine transport type and intent
    transport_type = "bus"  # default
    if "train" in query_lower or "rail" in query_lower:
        transport_type = "train"
    
    is_fare_query = "fare" in query_lower or "price" in query_lower or "cost" in query_lower
    is_next_query = "next" in query_lower or "first" in query_lower
    
    try:
        if is_fare_query:
            # Get fare information
            url = f"http://127.0.0.1:5000/api/fare?source={source}&destination={destination}&type={transport_type}"
            res = requests.get(url).json()
            
            if "fares" in res and res["fares"]:
                fare_info = res["fares"][0]  # Get first result
                response = f"The fare from {source} to {destination} by {fare_info['transport_type']} is ₹{fare_info['fare']} with {fare_info['operator']}."
            else:
                response = res.get("message", "No fare information available.")
                
        elif is_next_query:
            # Get next transport
            if transport_type == "train":
                url = f"http://127.0.0.1:5000/api/nexttrain?source={source}&destination={destination}"
            else:
                url = f"http://127.0.0.1:5000/api/nextbus?source={source}&destination={destination}"
            
            res = requests.get(url).json()
            
            if "operator" in res:
                response = f"The next {transport_type} from {source} to {destination} is {res['operator']} at {res['departure_time']}. Fare is ₹{res.get('fare', 'N/A')}."
            else:
                response = res.get("message", f"No {transport_type} found for this route.")
        else:
            # General search
            url = f"http://127.0.0.1:5000/api/search?source={source}&destination={destination}&type={transport_type}"
            res = requests.get(url).json()
            
            if "results" in res and res["results"]:
                results = res["results"]
                if len(results) == 1:
                    result = results[0]
                    response = f"Found {result['transport_type']} from {source} to {destination}: {result['operator']} at {result['departure_time']}, fare ₹{result['fare']}."
                else:
                    response = f"Found {len(results)} {transport_type} options from {source} to {destination}."
            else:
                response = res.get("message", f"No {transport_type} found for this route.")
        
        print(response)
        speak(response)
        
    except requests.exceptions.ConnectionError:
        error_msg = "Sorry, I couldn't connect to the database. Please check if the server is running."
        print(error_msg)
        speak(error_msg)
    except Exception as e:
        error_msg = f"Sorry, an error occurred: {str(e)}"
        print(error_msg)
        speak(error_msg)

if __name__ == "__main__":
    process_query()

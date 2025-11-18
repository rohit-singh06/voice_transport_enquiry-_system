# 🎤 Supported Voice Query Types

This document lists all the types of queries that your voice-enabled transport enquiry system can handle.

## 📋 Query Format Requirements

**All queries must include:**
- ✅ Source location (using "from")
- ✅ Destination location (using "to")
- ✅ Optional: Transport type (bus/train)
- ✅ Optional: Query intent (fare, next, search)

---

## 🚌 **1. NEXT BUS QUERIES**

Get the next available bus from source to destination.

### **Keywords Detected:**
- "next" or "first"
- "bus" (default if not specified)

### **Example Queries:**
```
✅ "Next bus from dehradun to delhi"
✅ "First bus from delhi to mumbai"
✅ "Next from rishikesh to haridwar"
✅ "Bus from bangalore to chennai"
✅ "What is the next bus from pune to mumbai"
```

### **Response Format:**
```
"The next bus from [source] to [destination] is [operator] at [departure_time]. Fare is ₹[fare]."
```

---

## 🚂 **2. NEXT TRAIN QUERIES**

Get the next available train from source to destination.

### **Keywords Detected:**
- "next" or "first"
- "train" or "rail"

### **Example Queries:**
```
✅ "Next train from delhi to mumbai"
✅ "First train from dehradun to delhi"
✅ "Next rail from bangalore to chennai"
✅ "Train from pune to mumbai"
✅ "What is the next train from delhi to kolkata"
```

### **Response Format:**
```
"The next train from [source] to [destination] is [operator] at [departure_time]. Fare is ₹[fare]."
```

---

## 💰 **3. FARE INFORMATION QUERIES**

Get fare/pricing information for a route.

### **Keywords Detected:**
- "fare", "price", or "cost"
- Optional: "bus" or "train"

### **Example Queries:**
```
✅ "Fare from dehradun to delhi"
✅ "What is the price from delhi to mumbai"
✅ "Cost from bangalore to chennai by bus"
✅ "Train fare from pune to mumbai"
✅ "Bus price from rishikesh to haridwar"
✅ "How much does it cost from delhi to kolkata"
```

### **Response Format:**
```
"The fare from [source] to [destination] by [transport_type] is ₹[fare] with [operator]."
```

---

## 🔍 **4. GENERAL SEARCH QUERIES**

Search for all available transport options (default behavior if no specific intent).

### **Keywords Detected:**
- Any query with "from" and "to" that doesn't match fare/next queries
- Optional: "bus" or "train"

### **Example Queries:**
```
✅ "Bus from dehradun to delhi"
✅ "Train from delhi to mumbai"
✅ "Transport from bangalore to chennai"
✅ "Show me buses from pune to mumbai"
✅ "What buses go from rishikesh to haridwar"
✅ "Available transport from delhi to kolkata"
```

### **Response Format:**
- **Single result:** "Found [transport_type] from [source] to [destination]: [operator] at [departure_time], fare ₹[fare]."
- **Multiple results:** "Found [count] [transport_type] options from [source] to [destination]."

---

## 📝 **Query Pattern Structure**

### **Required Elements:**
```
[Optional: Intent] [Optional: Transport] from [SOURCE] to [DESTINATION]
```

### **Intent Keywords:**
- **Next/First:** "next", "first"
- **Fare:** "fare", "price", "cost"
- **Search:** (default, no specific keyword needed)

### **Transport Keywords:**
- **Bus:** "bus" (default if not specified)
- **Train:** "train", "rail"

---

## 🎯 **Query Processing Logic**

The system processes queries in this order:

1. **Extract Source & Destination**
   - Looks for "from [location]" and "to [location]"
   - Must have both to proceed

2. **Determine Transport Type**
   - Checks for "train" or "rail" → sets to train
   - Otherwise defaults to bus

3. **Determine Query Intent**
   - Checks for "fare", "price", "cost" → Fare query
   - Checks for "next", "first" → Next transport query
   - Otherwise → General search query

4. **Call Appropriate API**
   - Fare query → `/api/fare`
   - Next query → `/api/nextbus` or `/api/nexttrain`
   - General search → `/api/search`

---

## ⚠️ **Limitations & Notes**

### **What the System CAN Handle:**
✅ Natural language queries with "from" and "to"
✅ Flexible word order
✅ Case-insensitive queries
✅ Partial station name matching
✅ Multiple query intents (fare, next, search)

### **What the System CANNOT Handle (Yet):**
❌ Queries without "from" and "to" keywords
❌ Date-specific queries (e.g., "bus tomorrow")
❌ Time-specific queries (e.g., "bus after 5 PM")
❌ Seat availability queries
❌ Booking queries
❌ Route information queries
❌ Multi-word city names (only first word after "from"/"to" is captured)

---

## 🔧 **Improvement Suggestions**

To enhance query handling, consider:

1. **Better City Name Extraction**
   - Handle multi-word cities (e.g., "New Delhi", "New York")
   - Use NLP to extract full city names

2. **Date/Time Support**
   - Add date parsing (tomorrow, next week, etc.)
   - Add time filtering (morning, evening, after 5 PM)

3. **More Query Types**
   - Seat availability: "How many seats available from X to Y"
   - Route details: "What is the route from X to Y"
   - Operator search: "Buses by RedBus from X to Y"

4. **Better Error Handling**
   - Suggest similar city names if not found
   - Handle ambiguous queries

---

## 📊 **Query Examples Summary**

| Query Type | Example | API Endpoint |
|------------|---------|-------------|
| Next Bus | "Next bus from delhi to mumbai" | `/api/nextbus` |
| Next Train | "First train from dehradun to delhi" | `/api/nexttrain` |
| Fare Info | "Fare from bangalore to chennai" | `/api/fare` |
| General Search | "Bus from pune to mumbai" | `/api/search` |

---

## 🎤 **Best Practices for Voice Queries**

1. **Speak Clearly:** Enunciate city names clearly
2. **Use Keywords:** Include "from" and "to" in your query
3. **Be Specific:** Mention "bus" or "train" if you have a preference
4. **Simple Queries:** Keep queries simple and direct
5. **Check Microphone:** Ensure microphone permissions are granted

---

**Last Updated:** Based on voice_module.py and app.py analysis

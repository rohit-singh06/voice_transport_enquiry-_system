# Voice-Based Transport Enquiry System

A web application that allows users to query transport information using voice commands. The system supports both web interface and command-line voice interface.

## Features

- 🎤 **Voice Recognition**: Speak your queries naturally
- 🌐 **Web Interface**: Modern, responsive web UI
- 🚌 **Multi-Transport Support**: Buses and trains
- 💰 **Fare Information**: Get pricing details
- 🗣️ **Text-to-Speech**: Audio responses
- 🌍 **Multi-language**: English and Hindi support
- 📱 **Responsive Design**: Works on desktop and mobile

## Architecture

- **Frontend**: HTML5, CSS3, JavaScript (Web Speech API)
- **Backend**: Flask (Python)
- **Database**: PostgreSQL
- **Voice Processing**: SpeechRecognition, pyttsx3

## Setup Instructions

### Prerequisites

1. Python 3.7+
2. PostgreSQL database
3. Web browser with microphone access

### Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Setup PostgreSQL database:**
   - Create database: `transport_db`
   - Update connection string in `app.py` if needed
   - Import your transport data

3. **Run the application:**
   ```bash
   python start_app.py
   ```

### Database Schema

The system expects these tables:
- `stations` - Station information
- `routes` - Transport routes
- `schedules` - Timetables and fares

## Usage

### Web Interface
1. Open `index.html` in your browser
2. Click the microphone button or press Space
3. Speak your query (e.g., "Next bus from Delhi to Mumbai")
4. View results and listen to audio responses

### Command Line Interface
```bash
python voice_module.py
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/nextbus` - Next bus information
- `GET /api/nexttrain` - Next train information
- `GET /api/search` - General transport search
- `GET /api/fare` - Fare information

## Example Queries

- "Next bus from Delhi to Mumbai"
- "Train fare from Bangalore to Chennai"
- "What trains go from Pune to Mumbai?"
- "Bus availability from Dehradun to Delhi"

## Development

The project structure:
```
├── app.py                 # Flask backend
├── voice_module.py        # Command-line voice interface
├── databaseconnect.py     # Database connection test
├── requirements.txt       # Python dependencies
├── index.html            # Web frontend
├── app.js               # Frontend JavaScript
└── styles.css           # Frontend styling
```

## Troubleshooting

1. **Microphone not working**: Check browser permissions
2. **Database connection failed**: Verify PostgreSQL is running
3. **Voice recognition issues**: Try speaking clearly and slowly
4. **API errors**: Check Flask server logs

## License

This project is for educational purposes.
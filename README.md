
# How to run Mobile App
## Requirement
- Node.js 22

## Get Started
1. Open terminal and cd to the root folder of the project
2. Install dependencies

   ```bash
   npm install
   ```
3. Copy the .env for app into the root project folder and fill in your local ip address. Get your local ip with
   ```bash
   ifconfig | grep "inet "
   ```
   It should start with 192.168.1...
4. Create a development build with eas and install it to an Android device
   ```bash
   eas build -p android --profile development
   ```
4. Start the app

   ```bash
   npx expo start
   ```
5. To test the notification, please use a real device instead of a simulator. Press shift+a and select the Android device

# How to run Python Backend
## Requirement
- Python 3

## Get Started
1. Open terminal and cd to the backend folder inside the project folder
2. Activate virtual environment for Python
   ```bash
   source .venv/bin/activate
   ```
3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the .env for backend into the backend folder
5. Start the server
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

# Architecture Decisions

## Design Philosophy
This application follows a client-server architecture with asynchronous processing to handle computationally expensive AI operations without blocking the user experience.

## Component Architecture

### Mobile App (React Native)
- **Responsibility**: Audio capture and user interface
- **Recording Flow**: Records meeting audio and saves as a local file upon completion
- **Upload Mechanism**: Sends audio file to Python backend via multipart/form-data HTTP upload
- **Notification Handling**: Receives push notifications when processing completes

### Backend (Python/FastAPI)
- **Responsibility**: File management, AI processing orchestration, and notifications

#### Storage Layer
- Stores uploaded audio files in Supabase Storage for durability and accessibility
- Creates corresponding metadata records in the `Recording` database table

#### Processing Pipeline
The backend executes a sequential processing pipeline for each recording:

1. **Transcription**: Retrieves audio from Supabase Storage and sends to OpenAI Whisper-1 model for speech-to-text conversion
2. **Summarization**: Passes generated transcript to OpenAI GPT-4 model to create a concise meeting summary
3. **Persistence**: Updates the `Recording` table with both transcript and summary
4. **Notification**: Sends push notification to the client device with the `meeting_id` to signal completion

#### Error Handling Strategy
- **Retry Logic**: Implements single retry on failure for any pipeline step
- **Rationale**: Balances reliability with simplicity; prevents resource waste from infinite retries
- **Trade-off**: Prioritizes atomic processing (all-or-nothing) over partial state recovery

## Key Design Trade-offs
- **Synchronous Pipeline**: Simpler error handling and state management, but longer processing time
- **Single Retry**: Handles transient failures without complex retry logic or dead-letter queues
- **Monolithic Processing**: Easier to reason about, but less flexible for independent step scaling

# Future Enhancements

## Backend Improvements

### 1. Modular Processing Pipeline with Task Queue
**Current State**: Monolithic synchronous processing of transcription, summarization, and notification

**Proposed Enhancement**:
- Decompose pipeline into independent microservices or background tasks
- Implement message queue (e.g., Celery, RQ, or AWS SQS) for asynchronous task execution
- Add state machine to track processing stages (uploaded → transcribing → summarizing → completed)

**Benefits**:
- Parallel processing capabilities for improved throughput
- Independent scaling of resource-intensive operations
- Better fault isolation and granular retry logic
- Ability to pause/resume long-running operations

**Trade-offs**:
- Increased architectural complexity
- Need for distributed state management
- More sophisticated error handling per stage

## Mobile App Improvements

### 2. Centralized State Management
**Current State**: Component-level state management with prop drilling

**Proposed Enhancement**:
- Implement Redux Toolkit or Zustand for global state management
- Create typed state slices for recordings, user preferences, and network status
- Implement middleware for side effects (API calls, notifications)

**Benefits**:
- Predictable state updates and easier debugging
- Better separation of concerns
- Simplified component logic
- Improved testability

### 3. Enhanced User Experience
**Current State**: Functional but minimal UI design

**Proposed Enhancement**:
- Design system implementation with consistent typography, spacing, and color palette
- Add loading skeletons and optimistic UI updates
- Implement smooth animations for state transitions
- Add offline support with local caching
- Improve accessibility (screen reader support, contrast ratios)

**Benefits**:
- Professional appearance and brand consistency
- Reduced perceived latency
- Better user engagement and retention
- Compliance with accessibility standards

## Infrastructure Improvements

### 4. Monitoring and Observability
- Add structured logging with correlation IDs
- Implement application performance monitoring (APM)
- Set up alerting for processing failures and API rate limits
- Track key metrics (processing time, success rates, API costs)

### 5. Security Enhancements
- Implement user authentication and authorization
- Add rate limiting to prevent abuse
- Encrypt sensitive data at rest and in transit
- Implement audio file access controls and expiration policies

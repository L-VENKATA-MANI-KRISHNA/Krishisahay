# KrishiSahay (KisanMitra) 🌾🚜

**KrishiSahay** is an AI-powered digital companion designed to empower Indian farmers. It bridges the gap between complex agricultural knowledge and the local farmer by providing instant, multilingual support through voice and visual interactions.

---

## 🚀 Key Features

### 🎙️ Multilingual Voice AI
- **Speak in Your Language**: Full support for **English**, **Hindi**, and **Telugu**.
- **Zero-Latency**: Experience natural, uninterrupted conversations with our optimized audio engine.
- **Smart Interactivity**: The AI automatically pauses when you switch tabs or start speaking, ensuring a seamless experience.

### 🤖 Intelligent Assistance (RAG)
- **Dual-Engine Reliability**: Powered by **Google Gemini** for high-quality reasoning, with an automatic failsafe switch to **Groq (Llama 3)** to ensure 100% uptime.
- **Fact-Based Answers**: Uses Retrieval Augmented Generation (RAG) to provide accurate information on government schemes, MSP rates, and crop data.

### 📸 Visual Crop Diagnosis
- **Snap & Solve**: Farmers can upload photos of their crops.
- **Vision AI**: The system uses advanced computer vision to identify pests or diseases and suggests immediate remedies.

### 📰 Live Updates
- **Real-Time Ticker**: Stay informed with a scrolling news bar featuring the latest weather alerts, mandis prices, and government announcements.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **AI Models**: Google Gemini 1.5 Flash, Llama 3 (via Groq)
- **Authentication**: JWT & Secure Password Hashing

---

## ⚙️ Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/krishisahay.git
    cd krishisahay
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Environment Variables**
    Create a `.env` file in `backend/` with:
    ```env
    GOOGLE_API_KEY=your_google_key
    GROQ_API_KEY=your_groq_key
    MONGODB_URL=your_mongodb_url
    ```

---

## 📱 PWA Support
KrishiSahay is a Progressive Web App (PWA). It can be installed on mobile devices for a native-like experience, offering offline capabilities and fast access even in low-network areas.

---

**Empowering Farmers, One Query at a Time.** 🇮🇳

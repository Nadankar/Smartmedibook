# 🏥 Smart MediBook

Smart MediBook is a full-stack healthcare web application for doctor-patient interaction, appointment booking, and AI-powered medical assistance.

---

## ✨ Features

### Patient
- Book/cancel appointments with refund
- View appointment history
- AI chatbot for queries
- Real-time notifications (In-app)

### Doctor
- Manage appointments (accept/reject/reschedule)
- View patient details
- Set availability

### AI
- Symptom analysis
- Smart appointment suggestions
- Priority-based handling

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS, DaisyUI, Vite |
| Backend | Node.js, Express.js, MongoDB |
| AI | Python, OpenAI API |
| Realtime | Socket.io |

---

## 📂 Quick Setup

```bash
# Clone repo
git clone https://github.com/Nadankar/Smartmedibook.git
cd Smartmedibook

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# AI Module (new terminal)
cd AI
pip install -r requirements.txt
python main.py


Frontend: http://localhost:5173

Backend: http://localhost:3000

AI: http://localhost:8000

🎥 Video Management (Git LFS)
Video Location: frontend/public/animated_video.mp4 (~17 MB)

bash
# Setup Git LFS
git lfs install
git lfs track "*.mp4"
git add .gitattributes

# Add video
git add frontend/public/animated_video.mp4
git commit -m "Add video with Git LFS"
git push

# Clone without video (faster)
GIT_LFS_SKIP_SMUDGE=1 git clone <url>

# Download video later
git lfs pull

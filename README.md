# Bit2Byte - Next-gen ASCII & Binary Art Converter

Bit2Byte is a high-performance media conversion platform that transforms your images and videos into stunning ASCII and Binary art. Featuring a bold, neo-brutalist design, it provides a seamless experience for creators to "retro-fy" their media.

## ✨ Features

- 🖼️ **Image to ASCII**: Convert any standard image format into stylized text-based art.
- 🎬 **Video to ASCII**: Transform videos into ASCII sequences with frame-by-frame processing.
- ⚡ **Real-time Processing**: Fast concurrent processing for both static and moving media.
- 🎨 **Neo-Brutalist UI**: A unique, high-contrast "Bento-style" interface optimized for modern web.
- 📊 **Progress Tracking**: Real-time feedback for uploads and processing stages.
- 📂 **Flexible Formats**: Supports most common image and video formats (JPEG, PNG, MP4, MOV, etc.).

## 🚀 Tech Stack

### Frontend
- **React 19**: Modern component-based architecture.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS**: Utility-first styling with a custom neo-brutalist theme.
- **Lucide React**: Clean and consistent iconography.
- **React Dropzone**: Intuitive drag-and-drop file handling.

### Backend
- **Node.js & Express**: Scalar and robust server environment.
- **Sharp**: High-performance image processing library.
- **Fluent-FFmpeg**: Wrapper for FFmpeg to handle complex video transcoding.
- **Multer**: Middleware for handling multipart/form-data (file uploads).
- **UUID**: For secure and unique job identification.

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [FFmpeg](https://ffmpeg.org/) (Required for video processing)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bit2byte.git
   cd bit2byte
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example (if available)
   npm run start:dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the App**
   Navigate to `http://localhost:5173` in your browser.

### Environment Variables

#### Backend (`backend/.env`)
```env
PORT=3001
CLIENT_URL=http://localhost:5173
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001
```

## 📁 Project Structure

```bash
Bit2Byte/
├── frontend/           # React frontend (Vite)
│   ├── src/
│   │   ├── components/ # UI Components
│   │   ├── services/   # API logic
│   │   └── App.jsx     # Main entry point
├── backend/            # Express backend
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── lib/        # Transformation engines
│   │   └── server.js   # Server entry point
└── README.md           # You are here!
```

## 🌐 Deployment

The project is configured for deployment on **Vercel**. Both `frontend` and `backend` directories contain `vercel.json` configurations for seamless hosting.

## 📄 License

This project is licensed under the ISC License.

---
Built with 💛 by Antigravity

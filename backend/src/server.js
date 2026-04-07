import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';
import convertRouter from './routes/convert.js';
import jobRouter from './routes/job.js';

const app = express();

const Origins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3001",
    "https://bit-2byte.vercel.app"
]

// Robust CORS setup
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or matched origins
    if (!origin || Origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/convert', convertRouter);
app.use('/job', jobRouter);

app.get("/", (_, res) => {
    res.json({message : "Server is Live!"})
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Express Global Error:", err);
  
  // Ensure CORS headers are sent even on errors
  const origin = req.headers.origin;
  if (Origins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (Max 50MB)' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

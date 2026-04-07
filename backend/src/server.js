import express from 'express';
import cors from 'cors';
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

var corsOptions = {
  origin: Origins,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/convert', convertRouter);
app.use('/job', jobRouter);

app.get("/", (_, res) => {
    res.json({message : "Server is Live!"})
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

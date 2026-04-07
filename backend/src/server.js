import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const Origins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://bit-2byte.vercel.app"
]

var corsOptions = {
  origin: Origins,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (_, res) => {
    res.json({message : "Server is Live!"})
})

app.post("/api/health", (req, res) => {
    console.log(req.body);
    res.json({message : "Server is Live!"})
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

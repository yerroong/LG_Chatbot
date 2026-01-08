// 환경 변수를 가장 먼저 로드
import dotenv from "dotenv";
dotenv.config();

// 환경 변수 로드 확인
if(!process.env.OPENAI_API_KEY){
    console.error("openai api key 를 활인할 수 없습니다.");
    console.error(".env 파일을 확인해주세요");
    process.exit(1);
}

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

// 로컬 모듈 import
import { connectDatabase } from "./config/database.js";
import { setupSocketConnection } from "./handlers/socketHandlers.js";
import apiRoutes from "./routes/apiRoutes.js";

const app = express();
const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server, {
    cors:{
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// 데이터베이스 연결
await connectDatabase();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// API 라우트 설정 -> 백엔드 서버에서 이뤄지는 동작
app.use("/api", apiRoutes);

// Socket.io 연결 설정
setupSocketConnection(io);

// 서버 시작
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`${PORT}포트에서 서버 작동 중...`);
    console.log(`환경 : ${process.env.NODE_ENV}` || "development");
    console.log(`OpenAI 모델: `);
    console.log(`API 엔드포인트 : http://localhost:${PORT}/api`);
});
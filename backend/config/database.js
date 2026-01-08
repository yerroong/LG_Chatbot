import mongoose from "mongoose";

export const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL,{
            dbName: process.env.MONGODB_DB_NAME,
        });
        console.log("MONGO DB 연결됨")
    } catch (err) {
        console.error("MONGO DB 연결 실패 : ", err);
        process.exit(1); //시도 여러번 하는거 방지
    }
};

// 연결 이벤트 리스너
mongoose.connection.on("connected", () => {
    console.log("Mongoose가 연결 되었습니다.");
});

mongoose.connection.on("error", (err) => {
    console.error("Mongoose 연결 오류");
});

mongoose.connection.on("disconnected", () => {
    console.error("Mongoose 연결이 끊어졌습니다");
});
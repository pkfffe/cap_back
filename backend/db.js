require("dotenv").config();
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "db", // Docker 컨테이너 이름
  user: process.env.DB_USER || "root", // 실제 DB 사용자명 (기본 root)
  password: process.env.DB_PASSWORD || "1234", // 실제 DB 비밀번호
  database: process.env.DB_NAME || "userdb", // 실제 DB 이름
  port: 3306,
});

// 연결 시도
const connectWithRetry = () => {
  connection.connect((err) => {
    if (err) {
      console.error(
        "❌ MySQL 연결 실패. 5초 후 재시도합니다...\n",
        err.message
      );
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log("✅ MySQL 연결 성공");
    }
  });

  connection.on("error", (err) => {
    console.error("❌ MySQL 연결 오류:", err.code);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectWithRetry();
    } else {
      console.error("DB 연결 실패 - 재시도 예정:", err.message);
      setTimeout(connectWithRetry, 5000);
    }
  });
};

connectWithRetry();

// ✅ 핵심 수정: connection 객체 자체를 export 해야 함
module.exports = connection;

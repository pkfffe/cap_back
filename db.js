const mysql = require("mysql2");

let connection;

const connectWithRetry = () => {
  connection = mysql.createConnection({
    host: process.env.DB_HOST || "db", // Docker 사용 시 'db', 로컬 테스트 시 'localhost'
    user: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "userdb",
    port: 3306,
  });

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

  // 연결 종료 시 자동 재연결
  connection.on("error", (err) => {
    console.error("❌ MySQL 연결 오류:", err.code);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectWithRetry(); // 재연결 시도
    } else {
      throw err;
    }
  });
};

connectWithRetry();

module.exports = () => connection;

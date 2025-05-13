const express = require("express");
const app = express();
const PORT = 3000;

// JSON 요청 처리용
app.use(express.json());

// 기본 라우터
app.get("/", (req, res) => {
  res.send("서버 작동");
});

// 서버 실행
app.listen(PORT, () => {
  console.log("서버 실행 중: http://localhost:${PORT}");
});

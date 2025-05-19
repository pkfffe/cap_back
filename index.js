const express = require("express");
const app = express();

const PORT = 4000;

app.get("/", (req, res) => {
  res.send("서버 정상 작동 중!");
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

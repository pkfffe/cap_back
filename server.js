const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db"); // DB 연결 파일
const app = express();
const PORT = 5000;

const saltRounds = 10;

// ✅ 미들웨어 설정
app.use(
  cors({
    origin: "http://localhost:3000", // Next.js 프론트엔드 주소
    credentials: true,
  })
);
app.use(express.json()); // JSON 요청 본문 파싱

// ✅ 회원가입 API
app.post("/register", (req, res) => {
  const { userid, password, nickname } = req.body;

  if (!userid || !password || !nickname) {
    return res.status(400).json({ message: "모든 항목을 입력해주세요." });
  }

  // 중복 아이디 확인
  const checkQuery = "SELECT * FROM users WHERE userid = ?";
  db.query(checkQuery, [userid], (err, results) => {
    if (err) {
      console.error("DB 조회 오류:", err);
      return res.status(500).json({ message: "DB 에러", error: err });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    // 비밀번호 암호화
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error("비밀번호 해싱 오류:", err);
        return res
          .status(500)
          .json({ message: "비밀번호 암호화 실패", error: err });
      }

      // 유저 정보 저장
      const insertQuery =
        "INSERT INTO users (userid, password, nickname) VALUES (?, ?, ?)";
      db.query(
        insertQuery,
        [userid, hashedPassword, nickname],
        (err, result) => {
          if (err) {
            console.error("회원가입 실패:", err);
            return res
              .status(500)
              .json({ message: "회원가입 실패", error: err });
          }

          return res.status(201).json({ message: "회원가입 성공" });
        }
      );
    });
  });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

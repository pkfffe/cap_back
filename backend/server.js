const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");
const app = express();
const PORT = 5000;
const saltRounds = 10;

// ✅ 미들웨어
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// ✅ 회원가입 API
app.post("/register", (req, res) => {
  let { userid, password, nickname } = req.body;
  console.log("✅ [1] 회원가입 요청 수신:", req.body);

  // ✅ 공백 제거
  userid = userid?.trim();
  nickname = nickname?.trim();

  // 유효성 검사
  if (!userid || !password || !nickname) {
    console.log("❌ [2] 유효성 검사 실패");
    return res.status(400).json({ message: "모든 항목을 입력해주세요." });
  }

  // ✅ 중복 체크 (아이디)
  const checkUserQuery =
    "SELECT EXISTS(SELECT 1 FROM users WHERE userid = ?) AS userExists";
  db.query(checkUserQuery, [userid], (err, userResults) => {
    if (err) {
      console.error("❌ [3] DB 조회 오류 (아이디):", err);
      return res.status(500).json({ message: "DB 에러", error: err });
    }

    if (userResults[0].userExists) {
      console.log("❌ [4] 중복된 아이디");
      return res
        .status(409)
        .json({ message: "이미 가입되어있는 아이디입니다." });
    }

    // ✅ 중복 체크 (닉네임)
    const checkNicknameQuery =
      "SELECT EXISTS(SELECT 1 FROM users WHERE nickname = ?) AS nicknameExists";
    db.query(checkNicknameQuery, [nickname], (err, nicknameResults) => {
      if (err) {
        console.error("❌ [5] DB 조회 오류 (닉네임):", err);
        return res.status(500).json({ message: "DB 에러", error: err });
      }

      if (nicknameResults[0].nicknameExists) {
        console.log("❌ [6] 중복된 닉네임");
        return res
          .status(409)
          .json({ message: "이미 가입되어있는 닉네임입니다." });
      }

      // ✅ 비밀번호 해싱
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          console.error("❌ [7] 비밀번호 해싱 실패:", err);
          return res.status(500).json({ message: "서버 오류", error: err });
        }

        // ✅ 회원정보 삽입
        const insertQuery =
          "INSERT INTO users (userid, password, nickname) VALUES (?, ?, ?)";
        db.query(
          insertQuery,
          [userid, hashedPassword, nickname],
          (err, result) => {
            if (err) {
              console.error("❌ [8] 회원가입 실패:", err);

              // ✅ 중복 제약 처리
              if (err.code === "ER_DUP_ENTRY") {
                const message = err.message.toLowerCase();

                let duplicateTarget = "정보";
                if (
                  message.includes("userid") ||
                  message.includes("unique_userid") ||
                  message.includes("users.userid")
                ) {
                  duplicateTarget = "아이디";
                } else if (
                  message.includes("nickname") ||
                  message.includes("unique_nickname") ||
                  message.includes("users.unique_nickname")
                ) {
                  duplicateTarget = "닉네임";
                }

                return res.status(409).json({
                  message: `이미 가입되어있는 ${duplicateTarget}입니다.`,
                });
              }

              return res
                .status(500)
                .json({ message: "회원가입 실패", error: err });
            }

            console.log("✅ [9] 회원가입 성공");
            return res.status(201).json({ message: "회원가입 성공" });
          }
        );
      });
    });
  });
});

app.post("/login", (req, res) => {
  const { userid, password } = req.body;
  console.log("🔐 로그인 시도:", userid);

  if (!userid || !password) {
    return res
      .status(400)
      .json({ message: "아이디와 비밀번호를 모두 입력해주세요." });
  }

  const findUserQuery = "SELECT * FROM users WHERE userid = ?";
  db.query(findUserQuery, [userid], (err, results) => {
    if (err) {
      console.error("❌ 로그인 중 DB 오류:", err);
      return res.status(500).json({ message: "서버 오류", error: err });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "회원가입되지 않은 아이디입니다." });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("❌ 비밀번호 비교 오류:", err);
        return res.status(500).json({ message: "서버 오류", error: err });
      }

      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "비밀번호가 일치하지 않습니다." });
      }

      console.log("✅ 로그인 성공:", userid);
      return res
        .status(200)
        .json({ message: "로그인 성공!", nickname: user.nickname });
    });
  });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = 5000;
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ 미들웨어
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.ALLOWED_ORIGIN || "https://8133-211-177-76-64.ngrok-free.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ✅ JWT 인증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // 사용자 정보 저장
    next();
  } catch (err) {
    return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
  }
}

// ✅ 회원가입 API
app.post("/register", (req, res) => {
  let { userid, password, nickname } = req.body;
  console.log("✅ [1] 회원가입 요청 수신:", req.body);

  userid = userid?.trim();
  nickname = nickname?.trim();

  if (!userid || !password || !nickname) {
    return res.status(400).json({ message: "모든 항목을 입력해주세요." });
  }

  const checkUserQuery =
    "SELECT EXISTS(SELECT 1 FROM users WHERE userid = ?) AS userExists";
  db.query(checkUserQuery, [userid], (err, userResults) => {
    if (err) {
      return res.status(500).json({ message: "DB 에러", error: err });
    }

    if (userResults[0].userExists) {
      return res
        .status(409)
        .json({ message: "이미 가입되어있는 아이디입니다." });
    }

    const checkNicknameQuery =
      "SELECT EXISTS(SELECT 1 FROM users WHERE nickname = ?) AS nicknameExists";
    db.query(checkNicknameQuery, [nickname], (err, nicknameResults) => {
      if (err) {
        return res.status(500).json({ message: "DB 에러", error: err });
      }

      if (nicknameResults[0].nicknameExists) {
        return res
          .status(409)
          .json({ message: "이미 가입되어있는 닉네임입니다." });
      }

      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ message: "서버 오류", error: err });
        }

        const insertQuery =
          "INSERT INTO users (userid, password, nickname) VALUES (?, ?, ?)";
        db.query(insertQuery, [userid, hashedPassword, nickname], (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              const message = err.message.toLowerCase();
              const target = message.includes("userid")
                ? "아이디"
                : message.includes("nickname")
                ? "닉네임"
                : "정보";

              return res
                .status(409)
                .json({ message: `이미 가입되어있는 ${target}입니다.` });
            }

            return res
              .status(500)
              .json({ message: "회원가입 실패", error: err });
          }

          console.log("✅ [9] 회원가입 성공");
          return res.status(201).json({ message: "회원가입 성공" });
        });
      });
    });
  });
});

// ✅ 로그인 API + JWT 발급
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
        return res.status(500).json({ message: "서버 오류", error: err });
      }

      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "비밀번호가 일치하지 않습니다." });
      }

      // ✅ 로그인 성공 → JWT 발급
      const token = jwt.sign(
        {
          id: user.id,
          userid: user.userid,
          nickname: user.nickname,
        },
        JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.status(200).json({
        message: "로그인 성공!",
        token,
        nickname: user.nickname,
      });
    });
  });
});

// 🔐 보호된 유저 정보 API
app.get("/profile", authenticateToken, (req, res) => {
  return res.status(200).json({ message: "인증 성공", user: req.user });
});

// ✅ 점수 저장 API
app.post("/score", authenticateToken, (req, res) => {
  const score = req.body;
  const userId = req.user.id;

  if (typeof score !== "number") {
    return res.status(400).json({ message: "score는 숫자여야 합니다." });
  }

  const insertScoreQuery = `
    INSERT INTO scores (user_id, score)
    VALUES (?, ?)
  `;

  db.query(insertScoreQuery, [userId, score || 0], (err, result) => {
    if (err) {
      console.error("❌ 점수 저장 실패:", err);
      return res
        .status(500)
        .json({ message: "점수 저장 중 오류 발생", error: err });
    }

    console.log("✅ 점수 저장 성공:", result.insertId);
    return res.status(201).json({ message: "점수 저장 완료" });
  });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

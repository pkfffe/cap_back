const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

let users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

// ✅ 사용자 API
app.get("/api/users", (req, res) => {
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const newUser = req.body;
  newUser.id = users.length + 1;
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id == req.params.id);
  if (!user)
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
  res.json(user);
});

// ✅ 게시글(이벤트) 저장용
let posts = [];

// ✅ 게시글 전체 조회
app.get("/api/posts", (req, res) => {
  res.json(posts);
});

// ✅ 게시글 등록
app.post("/api/posts", (req, res) => {
  const newPost = req.body;
  newPost.id = posts.length + 1;
  posts.push(newPost);
  res.status(201).json(newPost);
});

// ✅ 이미지 업로드용 설정
const uploadPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ 이미지 업로드 API
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일 없음" });
  const imagePath = `/uploads/${req.file.filename}`;
  res.json({ imagePath });
});

// ✅ 서버 시작
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

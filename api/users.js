let users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

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

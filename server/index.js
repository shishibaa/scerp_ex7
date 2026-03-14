require("dotenv").config()

const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let db;

/* =========================
   DATABASE INITIALIZATION
========================= */
async function initDB() {
  db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE quotation_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT NOT NULL,
      title TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  await db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`)

  // seed 5 default records
  const seed = [
    ["John Doe","Request Product A","2024-07-15","Standard","Pending"],
    ["Alice","Website redesign","2024-07-20","Custom","In Progress"],
    ["Bob","Mobile app UI","2024-07-22","Standard","Pending"],
    ["Charlie","E-commerce system","2024-07-30","Custom","Completed"],
    ["David","Logo design","2024-08-05","Standard","Pending"],
  ];

  for (const row of seed) {
    await db.run(
      `INSERT INTO quotation_requests
       (customerName,title,dueDate,type,status)
       VALUES (?,?,?,?,?)`,
      row
    );
  }
  
  const hash = await bcrypt.hash("1234", 10)

  await db.run(
    `INSERT INTO users (name, username, password)
    VALUES (?,?,?)`,
    ["Admin", "admin", hash]
  )

  console.log("✅ SQLite initialized");
}


/* =========================
   VALIDATION
========================= */

function validateIdParam(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID parameter" });
  }
  req.id = id;
  next();
}

function validateQuotationBody(req, res, next) {
  const { customerName, title, dueDate, type, status } = req.body;

  if (!customerName || typeof customerName !== "string")
    return res.status(400).json({ message: "customerName is required" });

  if (!title || typeof title !== "string")
    return res.status(400).json({ message: "title is required" });

  if (!dueDate || isNaN(Date.parse(dueDate)))
    return res.status(400).json({ message: "Valid dueDate is required" });

  const allowedTypes = ["Standard", "Custom"];
  if (!allowedTypes.includes(type))
    return res.status(400).json({ message: "Invalid type" });

  const allowedStatus = ["Pending", "In Progress", "Completed"];
  if (!allowedStatus.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  next();
}

/* =========================
   ROUTES
========================= */
app.post("/register", async (req, res) => {
  const { name, username, password } = req.body

  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields required" })
  }

  const existing = await db.get(
    "SELECT * FROM users WHERE username=?",
    [username]
  )

  if (existing) {
    return res.status(400).json({ message: "Username already exists" })
  }

  const hash = await bcrypt.hash(password, 10)

  await db.run(
    "INSERT INTO users (name, username, password) VALUES (?,?,?)",
    [name, username, hash]
  )

  res.json({ message: "Register success" })
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" })
  }

  const user = await db.get(
    "SELECT * FROM users WHERE username=?",
    [username]
  )

  if (!user) {
    return res.status(401).json({ message: "User not found" })
  }

  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    return res.status(401).json({ message: "Wrong password" })
  }

  const token = jwt.sign(
    { username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  )

  res.json({ token })
})

// middleware 
function authMiddleware(req, res, next) {
  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({ message: "No token" })
  }

  const token = header.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: "Invalid token" })
  }
}


// Quotation routes
// GET ALL
app.get("/quotations", authMiddleware, async (req, res) => {
  const rows = await db.all("SELECT * FROM quotation_requests");
  res.json(rows);
});

// GET BY ID
app.get("/quotations/:id",authMiddleware, validateIdParam, async (req, res) => {
  const row = await db.get(
    "SELECT * FROM quotation_requests WHERE id = ?",
    [req.id]
  );

  if (!row) {
    return res.status(404).json({ message: "Quotation not found" });
  }

  res.json(row);
});

// CREATE
app.post("/quotations",authMiddleware, validateQuotationBody, async (req, res) => {
  const { customerName, title, dueDate, type, status } = req.body;

  const result = await db.run(
    `INSERT INTO quotation_requests
     (customerName,title,dueDate,type,status)
     VALUES (?,?,?,?,?)`,
    [customerName, title, dueDate, type, status]
  );

  const newRow = await db.get(
    "SELECT * FROM quotation_requests WHERE id = ?",
    [result.lastID]
  );

  res.status(201).json(newRow);
});

// UPDATE
app.put(
  "/quotations/:id",authMiddleware,
  validateIdParam,
  validateQuotationBody,
  async (req, res) => {
    const { customerName, title, dueDate, type, status } = req.body;

    const result = await db.run(
      `UPDATE quotation_requests
       SET customerName=?, title=?, dueDate=?, type=?, status=?
       WHERE id=?`,
      [customerName, title, dueDate, type, status, req.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const updated = await db.get(
      "SELECT * FROM quotation_requests WHERE id=?",
      [req.id]
    );

    res.json(updated);
  }
);

// DELETE
app.delete("/quotations/:id", authMiddleware,validateIdParam, async (req, res) => {
  const result = await db.run(
    "DELETE FROM quotation_requests WHERE id=?",
    [req.id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ message: "Quotation not found" });
  }

  res.json({ message: "Quotation deleted successfully" });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

/* ========================= */

initDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
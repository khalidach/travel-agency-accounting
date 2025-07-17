const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

db.createTables();

// Category Routes
app.get("/api/categories", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM categories ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", async (req, res) => {
  const { name, type, color } = req.body;
  try {
    const { rows } = await db.query(
      "INSERT INTO categories (name, type, color) VALUES ($1, $2, $3) RETURNING *",
      [name, type, color]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM transactions WHERE category_id = $1", [id]);
    await db.query("DELETE FROM categories WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transaction Routes
app.get("/api/transactions", async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT t.*, c.name as category 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/transactions", async (req, res) => {
  const { type, amount, description, category_id, date } = req.body;
  try {
    const { rows } = await db.query(
      "INSERT INTO transactions (type, amount, description, category_id, date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [type, amount, description, category_id, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM transactions WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

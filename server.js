require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Σύνδεση με τη MySQL βάση δεδομένων στο InfinityFree
const db = mysql.createConnection({
  host: process.env.DB_HOST, // Πάρε το από το .env
  user: process.env.DB_USER, // Πάρε το από το .env
  password: process.env.DB_PASS, // Πάρε το από το .env
  database: process.env.DB_NAME, // Πάρε το από το .env
});

db.connect((err) => {
  if (err) {
    console.error("Σφάλμα σύνδεσης στη βάση δεδομένων:", err);
    return;
  }
  console.log("✅ Συνδέθηκε στη MySQL βάση!");
});

// Απλό route για έλεγχο αν το API δουλεύει
app.get("/", (req, res) => {
  res.send("🚀 Gym Management API is running!");
});

// Ξεκινάμε τον server
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});

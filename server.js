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
const db = mysql.createPool({
  host: "sql303.infinityfree.com", // Πάρε το από το .env
  user: "if0_38279736", // Πάρε το από το .env
  password: "PztyxEDT1hk", // Πάρε το από το .env
  database: "if0_38279736_gym_booking" // Πάρε το από το .env
});

// 🔥 LOGIN ROUTE
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Σφάλμα στον server!" });
            }
            if (results.length > 0) {
                res.json({ success: true, message: "Επιτυχής σύνδεση!", token: "dummyToken123" });
            } else {
                res.status(401).json({ success: false, message: "Λάθος email ή password!" });
            }
        }
    );
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

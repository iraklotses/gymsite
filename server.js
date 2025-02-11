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
  host: "sql.freedb.tech", // Πάρε το από το .env
  user: "freedb_Iraklotses", // Πάρε το από το .env
  password: "@t92BcDp7GQ$T6F", // Πάρε το από το .env
  database: "freedb_gym_database" // Πάρε το από το .env
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

app.get("/profile", (req, res) => {
    const userId = req.query.id; // (ή από JWT αν έχεις authentication)
    
    db.query("SELECT full_name, email FROM users WHERE id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Σφάλμα στη βάση!" });
        if (result.length === 0) return res.status(404).json({ error: "Ο χρήστης δεν βρέθηκε!" });

        res.json(result[0]); // Επιστρέφει το full_name & email του χρήστη
    });
});


app.get("/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Σφάλμα σύνδεσης στη βάση!", details: err });
        }
        res.json({ success: true, message: "Η βάση δεδομένων λειτουργεί!" });
    });
});

console.log("✅ Η βάση είναι έτοιμη για queries!");

// Απλό route για έλεγχο αν το API δουλεύει
app.get("/", (req, res) => {
  res.send("🚀 Gym Management API is running!");
});

// Ξεκινάμε τον server
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});

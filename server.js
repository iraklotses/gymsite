require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Middleware (Επιτρέπει το frontend)
app.use(cors({
    origin: "https://gymsite-frontend.vercel.app", // Επιτρέπει το frontend URL
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization"
}));

// ✅ Επιπλέον CORS (για ασφάλεια και debugging)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// ✅ Middleware για JSON δεδομένα
app.use(express.json());

// 🔗 Σύνδεση με τη MySQL βάση δεδομένων
const db = mysql.createPool({
    host: "sql.freedb.tech", 
    user: "freedb_Iraklotses",
    password: "@t92BcDp7GQ$T6F",
    database: "freedb_gym_database"
});

// ✅ Test route
app.get("/", (req, res) => {
    res.send("🚀 Gym Management API is running!");
});

// 🔥 LOGIN ROUTE
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Συμπληρώστε όλα τα πεδία!" });
    }

    db.query(
        "SELECT id, email FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: "Σφάλμα στον server!", details: err });
            }
            if (results.length > 0) {
                const user = results[0];
                res.json({ success: true, message: "Επιτυχής σύνδεση!", user });
            } else {
                res.status(401).json({ success: false, message: "Λάθος email ή password!" });
            }
        }
    );
});

// 🔥 PROFILE ROUTE
app.get("/profile", (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: "Το email είναι υποχρεωτικό!" });
    }

    db.query(
        "SELECT full_name, email FROM users WHERE email = ?",
        [email],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Σφάλμα στη βάση!" });
            if (result.length === 0) return res.status(404).json({ error: "Ο χρήστης δεν βρέθηκε!" });

            res.json(result[0]);
        }
    );
});

// 🔥 TEST DATABASE ROUTE
app.get("/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Σφάλμα σύνδεσης στη βάση!", details: err });
        }
        res.json({ success: true, message: "Η βάση δεδομένων λειτουργεί!" });
    });
});

// ✅ Εκκίνηση Server
app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
});

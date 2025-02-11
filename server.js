require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Middleware
app.use(cors({
    origin: "https://gymsite-frontend.vercel.app", // Επιτρέπει το frontend URL
    methods: "GET, POST",
    allowedHeaders: "Content-Type, Authorization"
}));

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
                res.json({
                    success: true,
                    message: "Επιτυχής σύνδεση!",
                    user: {
                        id: user.id,
                        email: user.email
                    }
                });
            } else {
                res.status(401).json({ success: false, message: "Λάθος email ή password!" });
            }
        }
    );
});

// 🔥 PROFILE ROUTE
app.get("/profile", (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Το user_id είναι υποχρεωτικό!" });
    }

    db.query(
        "SELECT full_name, email FROM users WHERE id = ?",
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Σφάλμα στη βάση!" });
            if (result.length === 0) return res.status(404).json({ error: "Ο χρήστης δεν βρέθηκε!" });

            res.json(result[0]);
        }
    );
});

// 🔥 ΥΠΗΡΕΣΙΕΣ (Services)
app.get("/services", (req, res) => {
    db.query("SELECT id, name, description, price FROM services", (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Σφάλμα στη βάση!", details: err });
        }
        res.json(results);
    });
});


// 🔥 ΑΝΑΚΟΙΝΩΣΕΙΣ (Announcements)
app.get("/announcements", (req, res) => {
    db.query("SELECT title, content, DATE_FORMAT(created_at, '%d/%m/%Y') AS date FROM announcements ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error("❌ Σφάλμα στη βάση ανακοινώσεων:", err);
            return res.status(500).json({ error: "Σφάλμα στη βάση!", details: err });
        }

        console.log("📢 Ανακοινώσεις που επιστράφηκαν:", results);
        res.json(results);
    });
});



// ✅ Εκκίνηση Server
app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
});

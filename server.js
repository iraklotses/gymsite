require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Middleware
app.use(cors({
    origin: "https://gymsite-frontend.vercel.app", // Επιτρέπει το frontend URL
    methods: "GET, POST, DELETE",
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

// 🔥 LOGIN ROUTE (Έλεγχος users & admins)
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Συμπληρώστε όλα τα πεδία!" });
    }

    db.query(
        "SELECT id, email, role FROM users WHERE email = ? AND password = ?",
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
                        email: user.email,
                        role: user.role
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

//ΔΙΑΧΕΙΡΙΣΗ

app.post("/announcements", (req, res) => {
    const { title, content } = req.body;
    db.query("INSERT INTO announcements (title, content) VALUES (?, ?)", [title, content], (err) => {
        if (err) return res.status(500).json({ error: "Σφάλμα κατά την εισαγωγή!" });
        res.json({ success: true, message: "Η ανακοίνωση προστέθηκε!" });
    });
});

app.get("/users", (req, res) => {
    db.query("SELECT id, full_name, email, role FROM users", (err, results) => {
        if (err) return res.status(500).json({ error: "Σφάλμα στη βάση" });
        res.json(results);
    });
});

app.get("/trainers", (req, res) => {
    console.log("🔍 Request για trainers...");
    db.query("SELECT * FROM trainers", (err, results) => {
        if (err) {
            console.error("❌ Σφάλμα στη βάση:", err);
            return res.status(500).json({ error: "Σφάλμα στη βάση" });
        }
        if (!results || results.length === 0) {
            console.log("⚠️ Δεν βρέθηκαν γυμναστές!");
            return res.status(404).json({ error: "Δεν βρέθηκαν γυμναστές" });
        }
        res.json(results);
    });
});

app.get("/programs", (req, res) => {
    db.query("SELECT id, name, trainer_id, day_of_week, time, max_capacity FROM programs", (err, results) => {
        if (err) {
            console.error("❌ Σφάλμα στη βάση:", err);
            return res.status(500).json({ error: "Σφάλμα στη βάση" });
        }
        res.json(results);
    });
});


app.post("/programs", (req, res) => {
    const { name, capacity } = req.body;
    db.query("INSERT INTO programs (name, capacity) VALUES (?, ?)", [name, capacity], (err) => {
        if (err) return res.status(500).json({ error: "Σφάλμα κατά την εισαγωγή!" });
        res.json({ success: true, message: "Το πρόγραμμα προστέθηκε!" });
    });
});

app.delete("/programs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Λήψη DELETE request για πρόγραμμα με ID: ${id}`);

        const result = await db.query("DELETE FROM programs WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Το πρόγραμμα δεν βρέθηκε" });
        }

        console.log("✅ Επιτυχής διαγραφή");
        res.json({ success: true, message: "Το πρόγραμμα διαγράφηκε!" });
    } catch (err) {
        console.error("❌ Σφάλμα στη διαγραφή:", err);
        res.status(500).json({ error: "Σφάλμα στη βάση" });
    }
});

app.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: "Ο χρήστης διαγράφηκε επιτυχώς" });
    } catch (err) {
        console.error("❌ Σφάλμα στη διαγραφή χρήστη:", err);
        res.status(500).json({ error: "Σφάλμα στη βάση" });
    }
});

app.delete("/trainers/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM trainers WHERE id = ?", [id]);
        res.json({ message: "Ο γυμναστής διαγράφηκε επιτυχώς" });
    } catch (err) {
        console.error("❌ Σφάλμα στη διαγραφή γυμναστή:", err);
        res.status(500).json({ error: "Σφάλμα στη βάση" });
    }
});

app.delete("/announcements/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑 Διαγραφή ανακοίνωσης με ID: ${id}`);

        const result = await db.query("DELETE FROM announcements WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Η ανακοίνωση δεν βρέθηκε" });
        }

        res.json({ message: "✅ Η ανακοίνωση διαγράφηκε!" });
    } catch (err) {
        console.error("❌ Σφάλμα στη διαγραφή ανακοίνωσης:", err);
        res.status(500).json({ error: "Σφάλμα στη βάση" });
    }
});




// ✅ Εκκίνηση Server
app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
});

require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Middleware
app.use(cors({
    origin: "https://gymsite-frontend.vercel.app", // Επιτρέπει το frontend URL
    methods: "GET, POST, DELETE, PUT",
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

app.get("/announcements", async (req, res) => {
    console.log("📢 Endpoint /announcements κλήθηκε!");

    try {
        const [rows] = await db.promise().query("SELECT * FROM announcements");
        res.json(rows);
    } catch (error) {
        console.error("❌ Σφάλμα στη βάση:", error);
        res.status(500).json({ error: "Database error" });
    }
});

//ΔΙΑΧΕΙΡΙΣΗ
app.get("/pending-users", async (req, res) => {
    db.query("SELECT * FROM pending_users", (err, results) => {
        if (err) {
            console.error("Fetch error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results);
    });
});

app.post("/approve-user", async (req, res) => {
    const { id, role } = req.body; // Ο διαχειριστής επιλέγει το ρόλο (user/admin)

    if (!id || !role) {
        return res.status(400).json({ error: "Missing user ID or role" });
    }

    db.query("SELECT * FROM pending_users WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const { full_name, email, password } = results[0];

        db.query(
            "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
            [full_name, email, password, role],
            (err) => {
                if (err) return res.status(500).json({ error: "Internal Server Error" });

                db.query("DELETE FROM pending_users WHERE id = ?", [id], (err) => {
                    if (err) return res.status(500).json({ error: "Could not remove from pending_users" });

                    res.json({ message: "User approved successfully" });
                });
            }
        );
    });
});

app.post("/reject-user", async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Missing user ID" });
    }

    db.query("DELETE FROM pending_users WHERE id = ?", [id], (err) => {
        if (err) {
            return res.status(500).json({ error: "Could not remove from pending_users" });
        }
        res.json({ message: "User rejected successfully" });
    });
});


app.post("/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "INSERT INTO pending_users (full_name, email, password) VALUES (?, ?, ?)",
            [full_name, email, password],
            (err, result) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }
                res.status(201).json({ message: "Επιτυχής εγγραφή! Περιμένετε έγκριση από τον διαχειριστή." });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
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

app.post("/trainers", async (req, res) => {
    try {
        const { full_name, specialty } = req.body;

        console.log("Received POST request for new trainer");
        console.log("Received Data:", req.body);

        if (!full_name || !specialty) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "INSERT INTO trainers (full_name, specialty) VALUES (?, ?)",
            [full_name, specialty],
            (err, result) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                res.status(201).json({ message: "Trainer created successfully", trainer_id: result.insertId });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post("/programs", async (req, res) => {
    try {
        const { name, trainer_id, day_of_week, time, max_capacity } = req.body;

        console.log("Received POST request for new program");
        console.log("Received Data:", req.body);

        if (!name || !trainer_id || !day_of_week || !time || !max_capacity) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "INSERT INTO programs (name, trainer_id, day_of_week, time, max_capacity) VALUES (?, ?, ?, ?, ?)",
            [name, trainer_id, day_of_week, time, max_capacity],
            (err, result) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                res.status(201).json({ message: "Program created successfully", program_id: result.insertId });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/announcements", async (req, res) => {
    try {
        const { title, content } = req.body;

        console.log("Received POST request for new announcement");
        console.log("Received Data:", req.body);

        if (!title || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "INSERT INTO announcements (title, content) VALUES (?, ?)",
            [title, content],
            (err, result) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                res.status(201).json({ message: "Announcement created successfully", announcement_id: result.insertId });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// 🏋️ Επεξεργασία Χρήστη
app.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role } = req.body;

        console.log("Received PUT request for user:", id);
        console.log("Received Data:", req.body);

        if (!full_name || !email || !role) {
            console.log("Missing fields!");
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?",
            [full_name, email, role, id],
            (err, result) => {
                if (err) {
                    console.error("Update error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.json({ message: "User updated successfully" });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// 🏋️‍♂️ Επεξεργασία Γυμναστή
app.put("/trainers/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, specialty } = req.body;

        console.log("Received PUT request for trainer:", id);
        console.log("Received Data:", req.body);

        if (!full_name || !specialty) {
            console.log("Missing fields!");
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "UPDATE trainers SET full_name = ?, specialty = ? WHERE id = ?",
            [full_name, specialty, id],
            (err, result) => {
                if (err) {
                    console.error("Update error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Trainer not found" });
                }

                res.json({ message: "Trainer updated successfully" });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// 📅 Επεξεργασία Προγράμματος
app.put("/programs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, trainer_id, day_of_week, time, max_capacity } = req.body;

        console.log("Received PUT request for program:", id);
        console.log("Received Data:", req.body);

        if (!name || !trainer_id || !day_of_week || !time || !max_capacity) {
            console.log("Missing fields!");
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "UPDATE programs SET name = ?, trainer_id = ?, day_of_week = ?, time = ?, max_capacity = ? WHERE id = ?",
            [name, trainer_id, day_of_week, time, max_capacity, id],
            (err, result) => {
                if (err) {
                    console.error("Update error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Program not found" });
                }

                res.json({ message: "Program updated successfully" });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.put("/announcements/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        console.log("Received PUT request for announcement:", id);
        console.log("Received Data:", req.body);

        if (!title || !content) {
            console.log("Missing fields!");
            return res.status(400).json({ error: "Missing required fields" });
        }

        db.query(
            "UPDATE announcements SET title = ?, content = ? WHERE id = ?",
            [title, content, id],
            (err, result) => {
                if (err) {
                    console.error("Update error:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Announcement not found" });
                }

                res.json({ message: "Announcement updated successfully" });
            }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
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

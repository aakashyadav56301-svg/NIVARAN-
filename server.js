
const express = require("express");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(morgan("dev"));

// Database configuration: credentials .env se aayenge
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "complain"
});

// ================= DATABASE CONNECTION =================

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        return;
    }

    console.log("Database connected successfully");
});

// ================= AUTH MIDDLEWARE =================

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. Token required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin only."
        });
    }

    next();
}

function requireStudent(req, res, next) {
    if (req.user.role !== "student") {
        return res.status(403).json({
            message: "Only students can perform this action."
        });
    }

    next();
}

// ================= HOME =================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Samadhan backend is running"
    });
});

// ================= CREATE COMPLAINT =================
// Only students can create complaints.
// created_at is generated automatically by MySQL.

app.post(
    "/munna",
    verifyToken,
    requireStudent,
    (req, res) => {
        const user_id = req.user.id;
        const name = req.body.name;
        const complain = req.body.complain;
        const description = req.body.description;

        if (
            !name ||
            !complain ||
            !description ||
            !String(name).trim() ||
            !String(complain).trim() ||
            !String(description).trim()
        ) {
            return res.status(400).json({
                message: "Name, complaint and description are required"
            });
        }

        const sql = `
            INSERT INTO students
                (user_id, name, complain, description)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                user_id,
                String(name).trim(),
                String(complain).trim(),
                String(description).trim()
            ],
            (err, result) => {
                if (err) {
                    console.error("Create complaint error:", err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                // Read back the saved timestamp from MySQL
                const selectSql = `
                    SELECT id, user_id, name, complain,
                           description, created_at
                    FROM students
                    WHERE id = ?
                `;

                db.query(
                    selectSql,
                    [result.insertId],
                    (selectErr, rows) => {
                        if (selectErr) {
                            console.error(
                                "Fetch created complaint error:",
                                selectErr
                            );

                            return res.status(201).json({
                                message: "Complaint added successfully",
                                id: result.insertId
                            });
                        }

                        return res.status(201).json({
                            message: "Complaint added successfully",
                            complaint: rows[0]
                        });
                    }
                );
            }
        );
    }
);

// ================= ADMIN: GET ALL COMPLAINTS =================

app.get(
    "/admin/complaints",
    verifyToken,
    requireAdmin,
    (req, res) => {
        const sql = `
            SELECT id, user_id, name, complain,
                   description, created_at
            FROM students
            ORDER BY id DESC
        `;

        db.query(sql, (err, result) => {
            if (err) {
                console.error("Admin complaints error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            return res.status(200).json({
                message: "All complaints fetched successfully",
                total: result.length,
                complaints: result
            });
        });
    }
);

// ================= ADMIN: ALTERNATE ALL-COMPLAINTS ROUTE =================

app.get(
    "/munna",
    verifyToken,
    requireAdmin,
    (req, res) => {
        const sql = `
            SELECT id, user_id, name, complain,
                   description, created_at
            FROM students
            ORDER BY id DESC
        `;

        db.query(sql, (err, result) => {
            if (err) {
                console.error("Fetch complaints error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            return res.status(200).json({
                message: "All complaints fetched successfully",
                total: result.length,
                complaints: result
            });
        });
    }
);

// ================= STUDENT: GET OWN COMPLAINTS =================

app.get(
    "/munna/user/:user_id",
    verifyToken,
    requireStudent,
    (req, res) => {
        const user_id = Number(req.params.user_id);

        if (!Number.isInteger(user_id) || user_id <= 0) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (Number(req.user.id) !== user_id) {
            return res.status(403).json({
                message: "You can only view your own complaints."
            });
        }

        const sql = `
            SELECT id, user_id, name, complain,
                   description, created_at
            FROM students
            WHERE user_id = ?
            ORDER BY id DESC
        `;

        db.query(sql, [user_id], (err, result) => {
            if (err) {
                console.error("User complaints error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            return res.status(200).json({
                message: "User complaints fetched successfully",
                total: result.length,
                complaints: result
            });
        });
    }
);

// ================= UPDATE COMPLAINT =================
// Students can update only their own complaints.
// Admin is read/delete only.

app.put(
    "/munna/:id",
    verifyToken,
    requireStudent,
    (req, res) => {
        const id = Number(req.params.id);
        const user_id = req.user.id;

        const name = req.body.name;
        const complain = req.body.complain;
        const description = req.body.description;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Invalid complaint ID"
            });
        }

        if (
            !name ||
            !complain ||
            !description ||
            !String(name).trim() ||
            !String(complain).trim() ||
            !String(description).trim()
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const sql = `
            UPDATE students
            SET name = ?, complain = ?, description = ?
            WHERE id = ? AND user_id = ?
        `;

        db.query(
            sql,
            [
                String(name).trim(),
                String(complain).trim(),
                String(description).trim(),
                id,
                user_id
            ],
            (err, result) => {
                if (err) {
                    console.error("Update complaint error:", err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "Complaint not found or not authorized"
                    });
                }

                return res.status(200).json({
                    message: "Complaint updated successfully"
                });
            }
        );
    }
);

// ================= DELETE COMPLAINT =================
// Admin can delete any complaint.
// Student can delete only their own complaint.

app.delete("/munna/:id", verifyToken, (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid complaint ID"
        });
    }

    let sql;
    let params;

    if (req.user.role === "admin") {
        sql = `
            DELETE FROM students
            WHERE id = ?
        `;

        params = [id];
    } else if (req.user.role === "student") {
        sql = `
            DELETE FROM students
            WHERE id = ? AND user_id = ?
        `;

        params = [id, req.user.id];
    } else {
        return res.status(403).json({
            message: "Access denied."
        });
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Delete complaint error:", err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Complaint not found or not authorized"
            });
        }

        return res.status(200).json({
            message: "Complaint deleted successfully"
        });
    });
});

// ================= SIGNUP =================
// New signups receive the student role from the backend.
// Existing database schema should have role DEFAULT 'student'.

app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    try {
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, result) => {
                if (err) {
                    console.error("Signup lookup error:", err);

                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                if (result.length > 0) {
                    return res.status(409).json({
                        message: "Email already exists"
                    });
                }

                try {
                    const hashedPassword = await bcrypt.hash(
                        password,
                        10
                    );

                    const insertSql = `
                        INSERT INTO users
                            (name, email, password, role)
                        VALUES (?, ?, ?, 'student')
                    `;

                    db.query(
                        insertSql,
                        [
                            String(name).trim(),
                            String(email).trim(),
                            hashedPassword
                        ],
                        (insertErr, insertResult) => {
                            if (insertErr) {
                                console.error(
                                    "Signup insert error:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    message: "Could not create account"
                                });
                            }

                            return res.status(201).json({
                                message: "Account created successfully",
                                user: {
                                    id: insertResult.insertId,
                                    name: String(name).trim(),
                                    email: String(email).trim(),
                                    role: "student"
                                }
                            });
                        }
                    );
                } catch (hashErr) {
                    console.error("Password hashing error:", hashErr);

                    return res.status(500).json({
                        message: "Could not create account"
                    });
                }
            }
        );
    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});

// ================= LOGIN =================

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                console.error("Login database error:", err);

                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (result.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = result[0];

            try {
                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatch) {
                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                const token = jwt.sign(
                    {
                        id: user.id,
                        role: user.role
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "1h"
                    }
                );

                return res.status(200).json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (loginError) {
                console.error("Login error:", loginError);

                return res.status(500).json({
                    message: "Something went wrong"
                });
            }
        }
    );
});

// ================= START SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

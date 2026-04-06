const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database("./orders.db", (err) => {
  if (err) {
    console.error("Failed to connect to database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create orders table if it does not exist
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    totalPrice REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    createdAt TEXT NOT NULL
  )
`);

// Promise wrappers for sqlite3
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Simulate async external dependency, e.g. payment gateway
function simulatePayment() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Payment processed successfully.");
    }, 1500);
  });
}

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Order Management API is running." });
});

// POST /orders - Create a new order
app.post("/orders", async (req, res) => {
  try {
    const { customerName, product, quantity, totalPrice } = req.body;

    if (!customerName || !product || !quantity || !totalPrice) {
      return res.status(400).json({
        error: "customerName, product, quantity, and totalPrice are required."
      });
    }

    if (quantity <= 0 || totalPrice <= 0) {
      return res.status(400).json({
        error: "quantity and totalPrice must be greater than 0."
      });
    }

    // Asynchronous operation
    const paymentMessage = await simulatePayment();

    const createdAt = new Date().toISOString();

    const result = await runQuery(
      `INSERT INTO orders (customerName, product, quantity, totalPrice, status, createdAt)
       VALUES (?, ?, ?, ?, 'Pending', ?)`,
      [customerName, product, quantity, totalPrice, createdAt]
    );

    const newOrder = await getQuery(`SELECT * FROM orders WHERE id = ?`, [result.lastID]);

    res.status(201).json({
      message: "Order created successfully.",
      payment: paymentMessage,
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /orders - Retrieve all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await allQuery(`SELECT * FROM orders`);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /orders/:id - Retrieve one order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await getQuery(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /orders/:id - Update order status
app.patch("/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];

    if (!status) {
      return res.status(400).json({ error: "status is required." });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`
      });
    }

    const existingOrder = await getQuery(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    await runQuery(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id]);

    const updatedOrder = await getQuery(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);

    res.status(200).json({
      message: "Order status updated successfully.",
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /orders/:id - Delete an order
app.delete("/orders/:id", async (req, res) => {
  try {
    const existingOrder = await getQuery(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found." });
    }

    await runQuery(`DELETE FROM orders WHERE id = ?`, [req.params.id]);

    res.status(200).json({ message: "Order deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
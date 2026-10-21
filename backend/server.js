
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Expense = require("./models/Expense");
const Budget = require("./models/Budget");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/studentExpenseDB")
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(error => console.log("MongoDB Connection Error:", error));

app.get("/", (req, res) => {
    res.send("Student Expense Tracker Server is Running");
});

// Get current budget limit
async function getBudgetLimit() {
    const budget = await Budget.findOne({ key: "default" });
    return budget ? budget.limit : 5000;
}

// GET - Get budget
app.get("/budget", async (req, res) => {
    try {
        const limit = await getBudgetLimit();
        res.json({ limit });
    } catch (error) {
        res.status(500).json({
            message: "Could not load budget"
        });
    }
});

// PUT - Set budget
app.put("/budget", async (req, res) => {
    try {
        const limit = Number(req.body.limit);

        if (!Number.isFinite(limit) || limit <= 0) {
            return res.status(400).json({
                message: "Budget must be greater than zero"
            });
        }

        const result = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const spent = result.length ? result[0].total : 0;

        if (limit < spent) {
            return res.status(400).json({
                message: "Budget cannot be lower than existing expenses"
            });
        }

        const budget = await Budget.findOneAndUpdate(
            { key: "default" },
            { $set: { limit } },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.json({ limit: budget.limit });
    } catch (error) {
        res.status(500).json({
            message: "Could not save budget"
        });
    }
});

// READ - Get all expenses
app.get("/expenses", async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (error) {
        res.status(500).json({
            message: "Could not load expenses"
        });
    }
});

// READ - Get one expense
app.get("/expenses/:id", async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json(expense);
    } catch (error) {
        res.status(400).json({
            message: "Invalid ID"
        });
    }
});

// CREATE - Add expense with budget validation
app.post("/expenses", async (req, res) => {
    try {
        const { title, category } = req.body;
        const amount = Number(req.body.amount);

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                message: "Enter a valid title, amount and category"
            });
        }

        const limit = await getBudgetLimit();

        const result = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const spent = result.length ? result[0].total : 0;

        if (spent + amount > limit) {
            return res.status(400).json({
                message: "Spending limit exceeded. Expense was not added."
            });
        }

        const expense = await Expense.create({
            title: title.trim(),
            amount,
            category: category.trim()
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// UPDATE - Update expense with budget validation
app.put("/expenses/:id", async (req, res) => {
    try {
        const { title, category } = req.body;
        const amount = Number(req.body.amount);

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                message: "Enter a valid title, amount and category"
            });
        }

        const existing = await Expense.findById(req.params.id);

        if (!existing) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const limit = await getBudgetLimit();

        const result = await Expense.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const spent = result.length ? result[0].total : 0;
        const projectedTotal = spent - existing.amount + amount;

        if (projectedTotal > limit) {
            return res.status(400).json({
                message: "Spending limit exceeded. Expense was not updated."
            });
        }

        existing.title = title.trim();
        existing.amount = amount;
        existing.category = category.trim();

        await existing.save();

        res.json(existing);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
});

// DELETE - Delete expense
app.delete("/expenses/:id", async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: "Expense deleted successfully",
            expense
        });
    } catch (error) {
        res.status(400).json({
            message: "Invalid ID"
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});

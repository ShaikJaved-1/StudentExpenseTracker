
import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
    const [expenses, setExpenses] = useState([]);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Food");
    const [customCategory, setCustomCategory] = useState("");
    const [editId, setEditId] = useState(null);
    const [budget, setBudget] = useState(5000);
    const [budgetInput, setBudgetInput] = useState("5000");
    const [view, setView] = useState("dashboard");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const total = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0), 0
    );

    const remaining = budget - total;
    const percentage = budget > 0
        ? Math.min(100, (total / budget) * 100)
        : 0;

    const fetchExpenses = async () => {
        try {
            const response = await fetch(`${API}/expenses`);
            if (!response.ok) throw new Error("Could not load expenses");
            setExpenses(await response.json());
        } catch (err) {
            setError("Cannot connect to the server. Check your backend.");
        }
    };

    const fetchBudget = async () => {
        try {
            const response = await fetch(`${API}/budget`);
            if (!response.ok) return;
            const data = await response.json();
            setBudget(data.limit);
            setBudgetInput(String(data.limit));
        } catch (err) {
            console.log("Could not load budget:", err);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchBudget();
    }, []);

    const resetForm = () => {
        setTitle("");
        setAmount("");
        setCategory("Food");
        setCustomCategory("");
        setEditId(null);
    };

    const saveExpense = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const value = Number(amount);
        const selectedCategory = category === "Other"
            ? customCategory.trim()
            : category;

        if (!title.trim() || !amount.trim() ||
            !Number.isFinite(value) || value <= 0 ||
            !selectedCategory) {
            setError("Enter a valid name, amount and category.");
            return;
        }

        setLoading(true);

        try {
            const url = editId
                ? `${API}/expenses/${editId}`
                : `${API}/expenses`;

            const response = await fetch(url, {
                method: editId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    amount: value,
                    category: selectedCategory
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save expense");
            }

            await fetchExpenses();
            resetForm();
            setMessage(editId ? "Expense updated." : "Expense added.");
            setView("expenses");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (expense) => {
        const standardCategories = ["Food", "Academic", "Travel"];
        setTitle(expense.title);
        setAmount(String(expense.amount));
        setCategory(
            standardCategories.includes(expense.category)
                ? expense.category
                : "Other"
        );
        setCustomCategory(
            standardCategories.includes(expense.category)
                ? ""
                : expense.category
        );
        setEditId(expense._id);
        setView("add");
        setMessage("");
        setError("");
    };

    const deleteExpense = async (id) => {
        if (!window.confirm("Delete this expense?")) return;

        setError("");
        setMessage("");

        try {
            const response = await fetch(`${API}/expenses/${id}`, {
                method: "DELETE"
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not delete expense");
            }

            await fetchExpenses();
            setMessage("Expense deleted.");
        } catch (err) {
            setError(err.message);
        }
    };

    const saveBudget = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const value = Number(budgetInput);

        if (!budgetInput.trim() ||
            !Number.isFinite(value) || value <= 0) {
            setError("Enter a valid spending limit.");
            return;
        }

        try {
            const response = await fetch(`${API}/budget`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: value })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not save budget");
            }

            setBudget(data.limit);
            setMessage("Spending limit saved.");
        } catch (err) {
            setError(err.message);
        }
    };

    const formatMoney = (value) =>
        Number(value).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        });

    const iconFor = (cat) => ({
        Food: "🍔",
        Academic: "📚",
        Travel: "🚌"
    }[cat] || "✦");

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">₹</div>
                    <div>
                        <h2>SpendWise</h2>
                        <span>Student finances</span>
                    </div>
                </div>

                <p className="nav-label">WORKSPACE</p>

                {[
                    ["dashboard", "▦", "Dashboard"],
                    ["add", "＋", "Add Expense"],
                    ["expenses", "☷", "All Expenses"],
                    ["budget", "◎", "Spending Limit"]
                ].map(([key, icon, label]) => (
                    <button
                        key={key}
                        className={`nav-item ${view === key ? "active" : ""}`}
                        onClick={() => {
                            setView(key);
                            setError("");
                            setMessage("");
                        }}
                    >
                        <span>{icon}</span>{label}
                    </button>
                ))}

                <div className="sidebar-note">
                    <span>✦</span>
                    <h3>Spend smarter.</h3>
                    <p>Small savings today make a big difference tomorrow.</p>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
                        <h1>
                            {view === "dashboard" ? "Dashboard" :
                             view === "add" ? (editId ? "Edit Expense" : "Add Expense") :
                             view === "expenses" ? "All Expenses" :
                             "Spending Limit"}
                        </h1>
                    </div>
                    <div className="profile-badge">S</div>
                </header>

                {error && <div className="alert error">{error}</div>}
                {message && <div className="alert success">{message}</div>}

                {(view === "dashboard" || view === "budget") && (
                    <section className="budget-card">
                        <div className="budget-card-top">
                            <div>
                                <p className="muted">TOTAL EXPENSES</p>
                                <h2>{formatMoney(total)}</h2>
                                <p className="budget-subtitle">
                                    {remaining >= 0
                                        ? `${formatMoney(remaining)} remaining`
                                        : `${formatMoney(Math.abs(remaining))} over budget`}
                                </p>
                            </div>
                            <div className="budget-symbol">₹</div>
                        </div>

                        <div className="progress-info">
                            <span>Spending limit</span>
                            <strong>{formatMoney(budget)}</strong>
                        </div>

                        <div className="progress-track">
                            <div
                                className={`progress-fill ${
                                    total >= budget ? "over-limit" : ""
                                }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>

                        <div className="progress-info bottom-info">
                            <span>{percentage.toFixed(0)}% used</span>
                            <span>{total >= budget ? "Limit reached" : "Keep it up!"}</span>
                        </div>

                        {total >= budget && (
                            <div className="budget-warning">
                                ⚠ Your spending limit has been reached.
                            </div>
                        )}
                    </section>
                )}

                {view === "dashboard" && (
                    <>
                        <section className="stat-grid">
                            <div className="stat-card">
                                <div className="stat-icon purple">₹</div>
                                <p>Total spent</p>
                                <h3>{formatMoney(total)}</h3>
                                <span>Across all recorded expenses</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green">↗</div>
                                <p>Budget remaining</p>
                                <h3>{formatMoney(Math.max(0, remaining))}</h3>
                                <span>{remaining < 0 ? "Over your limit" : "Available to spend"}</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon orange">☷</div>
                                <p>Transactions</p>
                                <h3>{expenses.length}</h3>
                                <span>Expenses recorded</span>
                            </div>
                        </section>

                        <div className="section-heading">
                            <div>
                                <h2>Recent expenses</h2>
                                <p>Your latest recorded spending</p>
                            </div>
                            <button className="text-button" onClick={() => setView("expenses")}>
                                View all →
                            </button>
                        </div>

                        <ExpenseList
                            expenses={expenses.slice(-5).reverse()}
                            formatMoney={formatMoney}
                            iconFor={iconFor}
                            onEdit={startEdit}
                            onDelete={deleteExpense}
                        />

                        <button className="primary-button dashboard-add"
                            onClick={() => {
                                resetForm();
                                setView("add");
                            }}>
                            + Add new expense
                        </button>
                    </>
                )}

                {view === "add" && (
                    <section className="content-card form-card">
                        <div className="section-heading">
                            <div>
                                <h2>{editId ? "Update your expense" : "Record an expense"}</h2>
                                <p>Keep track of where your money goes.</p>
                            </div>
                            <div className="form-emoji">✦</div>
                        </div>

                        <form onSubmit={saveExpense}>
                            <label htmlFor="expense-title">Expense name</label>
                            <input
                                id="expense-title"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Lunch, Notebook, Bus fare"
                                maxLength={100}
                                required
                            />

                            <label htmlFor="expense-amount">Amount (₹)</label>
                            <div className="amount-input">
                                <span>₹</span>
                                <input
                                    id="expense-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <label>Choose a category</label>
                            <div className="category-grid">
                                {[
                                    ["Food", "🍔"],
                                    ["Academic", "📚"],
                                    ["Travel", "🚌"],
                                    ["Other", "✦"]
                                ].map(([cat, icon]) => (
                                    <button
                                        type="button"
                                        key={cat}
                                        className={`category-option ${
                                            category === cat ? "selected" : ""
                                        }`}
                                        onClick={() => {
                                            setCategory(cat);
                                            setError("");
                                        }}
                                    >
                                        <span>{icon}</span>
                                        {cat}
                                        {category === cat && <b>✓</b>}
                                    </button>
                                ))}
                            </div>

                            {category === "Other" && (
                                <>
                                    <label htmlFor="custom-category">Custom category</label>
                                    <input
                                        id="custom-category"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        placeholder="e.g. Shopping, Entertainment"
                                        maxLength={50}
                                        required
                                    />
                                </>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="primary-button"
                                    disabled={loading}>
                                    {loading ? "Saving..." :
                                        editId ? "Update expense →" : "Save expense →"}
                                </button>
                                {editId && (
                                    <button type="button" className="secondary-button"
                                        onClick={resetForm}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                )}

                {view === "budget" && (
                    <section className="content-card form-card">
                        <div className="section-heading">
                            <div>
                                <h2>Set your spending limit</h2>
                                <p>Choose a budget and stay in control.</p>
                            </div>
                            <div className="form-emoji">◎</div>
                        </div>

                        <form onSubmit={saveBudget}>
                            <label htmlFor="budget-limit">Spending limit (₹)</label>
                            <div className="amount-input">
                                <span>₹</span>
                                <input
                                    id="budget-limit"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={budgetInput}
                                    onChange={e => setBudgetInput(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="budget-tip">
                                <strong>💡 Your budget, your rules</strong>
                                <p>
                                    New expenses and expense updates that exceed this
                                    limit will be rejected by the server.
                                </p>
                            </div>
                            <button className="primary-button" type="submit">
                                Save spending limit →
                            </button>
                        </form>
                    </section>
                )}

                {view === "expenses" && (
                    <>
                        <div className="section-heading">
                            <div>
                                <h2>All expenses</h2>
                                <p>{expenses.length} recorded transactions</p>
                            </div>
                            <button className="primary-button"
                                onClick={() => {
                                    resetForm();
                                    setView("add");
                                }}>
                                + Add expense
                            </button>
                        </div>
                        <ExpenseList
                            expenses={[...expenses].reverse()}
                            formatMoney={formatMoney}
                            iconFor={iconFor}
                            onEdit={startEdit}
                            onDelete={deleteExpense}
                        />
                    </>
                )}

                <footer>SpendWise · Make every rupee count.</footer>
            </main>
        </div>
    );
}

function ExpenseList({ expenses, formatMoney, iconFor, onEdit, onDelete }) {
    if (expenses.length === 0) {
        return (
            <div className="empty-state">
                <div>☷</div>
                <h3>No expenses yet</h3>
                <p>Your recorded expenses will appear here.</p>
            </div>
        );
    }

    return (
        <div className="expense-list">
            {expenses.map(expense => (
                <div className="expense-row" key={expense._id}>
                    <div className="expense-icon">{iconFor(expense.category)}</div>
                    <div className="expense-details">
                        <h3>{expense.title}</h3>
                        <p>{expense.category}</p>
                    </div>
                    <strong className="expense-amount">
                        {formatMoney(expense.amount)}
                    </strong>
                    <div className="row-actions">
                        <button title="Edit" onClick={() => onEdit(expense)}>✎</button>
                        <button title="Delete" onClick={() => onDelete(expense._id)}>×</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default App;

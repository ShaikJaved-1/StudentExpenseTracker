
const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    key: {
        type: String,
        default: "default",
        unique: true
    },
    limit: {
        type: Number,
        required: true,
        min: 0.01
    }
});

module.exports = mongoose.model("Budget", budgetSchema);

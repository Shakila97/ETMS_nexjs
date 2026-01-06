const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["planning", "active", "on-hold", "completed", "cancelled"],
            default: "planning",
        },
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        teamMembers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Employee",
            },
        ],
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        progress: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model("Project", projectSchema)

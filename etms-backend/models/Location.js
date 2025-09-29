const mongoose = require("mongoose")

const locationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    accuracy: Number,
    activity: {
      type: String,
      enum: ["stationary", "walking", "running", "driving", "unknown"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
  },
)

// Index for geospatial queries
locationSchema.index({ location: "2dsphere" })

module.exports = mongoose.model("Location", locationSchema)

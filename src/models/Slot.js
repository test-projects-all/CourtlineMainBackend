// import mongoose from "mongoose";

// const slotSchema = new mongoose.Schema({
//   courtId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Court",
//     required: true,
//   },
//   // date: { type: String, required: true },
//   FromDate: { type: String, required: true },
//   ToDate: { type: String, required: true },
//   // slotId: { type: String, required: true },
//   timeRange: { type: String, required: true },
//   price: { type: Number, required: true },
//   // status: {
//   //   type: String,
//   //   enum: ["available", "reserved", "booked"],
//   //   default: "available",
//   // },
//   status: {
//     type: String,
//     enum: ["available", "inactive", "booked"],
//     default: "available",
//   },

//   // status: Boolean(active) ? "available" : "inactive",

//   reservedBy: { type: String, default: null },
//   reservedAt: { type: Date },
// });

// const Slot = mongoose.model("Slot", slotSchema);

// export default Slot;

import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    courtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },

    FromDate: {
      type: String,
      required: true,
    },

    ToDate: {
      type: String,
      required: true,
    },

    timeRange: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "inactive", "booked"],
      default: "available",
    },

    reservedBy: {
      type: String,
      default: null,
    },

    reservedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 🔒 CRITICAL:
 * Prevent duplicate slots for same court + time + date range
 */
slotSchema.index(
  { courtId: 1, timeRange: 1, FromDate: 1, ToDate: 1 },
  { unique: true }
);

const Slot = mongoose.model("Slot", slotSchema);

export default Slot;

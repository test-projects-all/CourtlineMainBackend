// // import mongoose from "mongoose";

// // const slotSchema = new mongoose.Schema({
// //   courtId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: "Court",
// //     required: true,
// //   },
// //   date: { type: String },
// //   timeRange: { type: String },
// // //   price: { type: Number },
// // //   status: {
// // //     type: String,
// // //     enum: ["available", "reserved", "booked"],
// // //     default: "available",
// // //   },
// // //   reservedBy: { type: String, default: null },
// // //   reservedAt: { type: Date },
// // });

// // const tournamentSchema = new mongoose.Schema({
// //   name: { type: String, required: true },
// //   age: { type: String, required: true },
// //   phone: { type: String, required: true },
// //   email: { type: String, required: true },
// //   category: { type: String, required: true },
// //   slots: [slotSchema],
// // //   startTime: { type: String },
// // //   endTime: { type: String },
// // //   length: { type: String },
// // //   active: { type: String, default: "true" },
// // //   createdAt: { type: Date, default: Date.now },
// // });

// // const Tournament = mongoose.model("Tournament", tournamentSchema);
// // export default Tournament;

// import mongoose from "mongoose";

// const slotSchema = new mongoose.Schema({
//   courtId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Court",
//     required: true,
//   },
//   date: { type: String },
//   timeRange: { type: String },
// });

// const tournamentSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   age: { type: String, required: true },
//   phone: { type: String, required: true },
//   email: { type: String, required: true },
//   category: { type: String, required: true },

//   slots: [slotSchema],

//   payment: {
//     orderId: { type: String },
//     paymentId: { type: String },
//     signature: { type: String },
//     amount: { type: Number },
//     status: {
//       type: String,
//       enum: ["PENDING", "PAID", "FAILED"],
//       default: "PENDING",
//     },
//   },
// }, { timestamps: true });

// const Tournament = mongoose.model("Tournament", tournamentSchema);
// export default Tournament;
import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    category: { type: String, required: true },
    gender: { type: String, required: true },

    payment: {
      orderId: String,
      paymentId: String,
      signature: String,
      amount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Tournament", tournamentSchema);

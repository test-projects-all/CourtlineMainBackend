import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  date: { type: String, required: true },
  timeRange: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["available","reserved","booked"], default: "available" },
  reservedBy: { type: String, default: null },
  reservedAt: { type: Date },
});


const courtBookingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  slots: [slotSchema], // ✅ Array of slot objects
  totalAmount: { type: Number, required: true },
  paymentId: { type: String, required: true },
  status: { type: String, default: "Paid" },
  createdAt: { type: Date, default: Date.now },
});

const CourtBooking = mongoose.model("CourtBookingUser", courtBookingUserSchema);

export default CourtBooking;

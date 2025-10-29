import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["upcoming", "possibility"],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String }, // only for upcoming events
  image: { type: String, required: true }, // image URL or base64 string
  createdAt: { type: Date, default: Date.now },
});

const Event = mongoose.model("Event", eventSchema);
export default Event;

import express from "express";
import {
  getCourt,
  getSlot,
  bookSlot,
  getEvents,
  createOrder,
  verifyOrder,
  newsletterSignup,
  checkAvailability,
  initiateBooking,
//   razorpayWebhook,
} from "../controllers/usersController.js";
const router = express.Router();

router.get("/getCourts", getCourt);

router.get("/getSlot/:courtId", getSlot);

router.post("/bookSlot", bookSlot);
router.get("/getEvents", getEvents);

router.post("/createOrder", createOrder);
router.post("/verifyOrder", verifyOrder);
router.post("/newsletter-signup", newsletterSignup);
router.post("/checkAvailability", checkAvailability);
router.post("/initiateBooking", initiateBooking);
// router.post("/razorpay-webhook", razorpayWebhook);

// router.post("/razorpay-webhook", razorpayWebhook);

// Razorpay Webhook (RAW BODY REQUIRED)
// router.post(
//   "/razorpay-webhook",
//   express.raw({ type: "application/json" }),
//   razorpayWebhook
// );

// router.get("/",auth, getUsers);
// router.post("/", createUser);

export default router;
// http://localhost:5000/api/users/newsletter-signup

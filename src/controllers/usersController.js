import CourtBooking from "../models/CourtBookingUser.js";
import Court from "../models/Court.js";
import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Event from "../models/Event.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import crypto from "crypto";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export async function bookSlot(req, res) {
  const {
    courtId,
    name,
    phone,
    email,
    slots,
    totalAmount,
    PaymentId,
    date,
    time,
    status,
  } = req.body;

  if (
    !courtId ||
    !name ||
    !phone ||
    !email ||
    !slots ||
    !totalAmount ||
    !PaymentId ||
    !date ||
    !time
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const courtName = COURT_NAME_MAP[courtId.toString()] || "Unknown Court";

    const newBooking = new CourtBooking({
      courtId,
      courtName, // ✅ now defined
      name,
      phone,
      email,
      slots,
      totalAmount,
      PaymentId,
      date,
      time,
      status,
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      message: "Booking successful",
      bookingId: savedBooking._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 🟡 Get all events (optionally filter by type)
export const getEvents = async (req, res) => {
  try {
    const { type } = req.query; // e.g. ?type=upcoming or ?type=possibility
    const filter = type ? { type } : {};

    const events = await Event.find(filter).sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: err.message });
  }
};

export async function getSlot(req, res) {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!courtId) {
      return res.status(400).json({ error: "courtId is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ error: "Court not found" });
    }

    /* -------------------------------------------------------
       DATE NORMALIZATION (expects DD-MM-YYYY)
    ------------------------------------------------------- */
    let formattedDate = "";

    if (date.includes("/")) {
      const [dd, mm, yyyy] = date.split("/");
      formattedDate = `${dd}-${mm}-${yyyy}`;
    } else if (date.includes("-")) {
      formattedDate = date;
    } else {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const toDateObj = (d) => {
      const [dd, mm, yyyy] = d.split("-");
      return new Date(yyyy, mm - 1, dd);
    };

    const selectedDateObj = toDateObj(formattedDate);

    /* -------------------------------------------------------
       TIME HELPERS
    ------------------------------------------------------- */
    const normalizeTimeStr = (str) => str.replace(/\s+/g, " ").trim();

    const formatTo12Hour = (h, m) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )} ${ampm}`;
    };

    const parseTime = (t) => {
      const [time, ampm] = t.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return [h, m];
    };

    /* -------------------------------------------------------
       SLOT GENERATION (BASE SLOTS FROM COURT)
    ------------------------------------------------------- */
    const generateSlots = (startTime, endTime, length) => {
      const slots = [];

      let [sh, sm] = parseTime(startTime);
      const [eh, em] = parseTime(endTime);

      const totalMinutes = Number(length);
      const stepH = Math.floor(totalMinutes / 60);
      const stepM = totalMinutes % 60;

      while (sh < eh || (sh === eh && sm < em)) {
        let endH = sh + stepH;
        let endM = sm + stepM;

        if (endM >= 60) {
          endH += Math.floor(endM / 60);
          endM %= 60;
        }

        const slotTime = `${formatTo12Hour(sh, sm)} - ${formatTo12Hour(
          endH,
          endM
        )}`;

        slots.push({
          time: slotTime,
          price: Number(court.price) || 2000,
          status: "available",
        });

        sh = endH;
        sm = endM;
      }

      return slots;
    };

    const baseSlots = generateSlots(
      court.startTime,
      court.endTime,
      court.length
    );

    /* -------------------------------------------------------
       SLOT MAP (CANONICAL)
    ------------------------------------------------------- */
    const slotMap = new Map();
    baseSlots.forEach((s) => {
      slotMap.set(normalizeTimeStr(s.time), s);
    });

    /* -------------------------------------------------------
       BOOKINGS (BOOKED ALWAYS WINS)
    ------------------------------------------------------- */
    const bookings = await CourtBooking.find({
      "slots.courtId": courtId,
      "slots.date": formattedDate,
      status: { $in: ["Paid", "reserved"] },
    });

    bookings.forEach((booking) => {
      booking.slots.forEach((bs) => {
        if (bs.courtId.toString() === courtId && bs.date === formattedDate) {
          const key = normalizeTimeStr(bs.timeRange);
          if (slotMap.has(key)) {
            slotMap.set(key, {
              ...slotMap.get(key),
              status: "booked",
            });
          }
        }
      });
    });

    /* -------------------------------------------------------
       PRICING + INACTIVE (FIXED — STRING DATE SAFE)
    ------------------------------------------------------- */
    let pricingSlots = await Slot.find({
      courtId: String(courtId),
    }).lean();

    pricingSlots = pricingSlots.filter((ps) => {
      if (!ps.FromDate || !ps.ToDate) return false;

      const from = toDateObj(ps.FromDate);
      const to = toDateObj(ps.ToDate);

      return from <= selectedDateObj && selectedDateObj <= to;
    });

    pricingSlots.forEach((ps) => {
      const key = normalizeTimeStr(ps.timeRange);
      if (!slotMap.has(key)) return;

      const existing = slotMap.get(key);

      // booked always wins
      if (existing.status === "booked") return;

      let finalStatus = existing.status;
      if (ps.status === "inactive") finalStatus = "inactive";

      slotMap.set(key, {
        ...existing,
        price: Number(ps.price) || existing.price,
        status: finalStatus,
      });
    });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */
    return res.status(200).json({
      message: "Slots fetched successfully",
      date: formattedDate,
      courtId,
      slots: Array.from(slotMap.values()),
    });
  } catch (err) {
    console.error("getSlot error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getCourt(req, res) {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// export async function initiateBooking(req, res) {
//   try {
//     const { courts, totalPrice, formData } = req.body;

//     if (!courts || !totalPrice || !formData) {
//       return res.status(400).json({ success: false });
//     }

//     /* ---------------------------------------
//        BUILD SLOTS (ENUM SAFE)
//     --------------------------------------- */
//     const slots = [];
//     courts.forEach((court) => {
//       court.dates.forEach((dateObj) => {
//         dateObj.slots.forEach((slot) => {
//           slots.push({
//             courtId: court.courtId,
//             date: dateObj.date,
//             timeRange: slot.time || slot.timeRange,
//             price: slot.price,
//             status: "available", // ✅ VALID ENUM
//           });
//         });
//       });
//     });

//     /* ---------------------------------------
//        TEMP PAYMENT ID (REQUIRED BY SCHEMA)
//     --------------------------------------- */
//     const tempPaymentId = `INIT_${Date.now()}`;

//     const booking = await CourtBooking.create({
//       name: formData.name,
//       phone: formData.phone,
//       email: formData.email,
//       slots,
//       totalAmount: totalPrice,
//       paymentId: tempPaymentId, // ✅ REQUIRED FIELD
//       status: "initiated",
//     });

//     return res.json({
//       success: true,
//       bookingId: booking._id,
//     });
//   } catch (err) {
//     console.error("initiateBooking error:", err.message);
//     return res.status(500).json({ success: false });
//   }
// }

export async function initiateBooking(req, res) {
  try {
    const { courts, totalPrice, formData } = req.body;

    if (!courts?.length || !totalPrice || !formData?.name) {
      return res.status(400).json({ success: false });
    }

    const slots = [];

    courts.forEach((court) =>
      court.dates.forEach((d) =>
        d.slots.forEach((s) =>
          slots.push({
            courtId: court.courtId,
            date: d.date,
            timeRange: s.time || s.timeRange,
            price: s.price,
            status: "reserved",
          })
        )
      )
    );

    const booking = await CourtBooking.create({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      slots,
      totalAmount: totalPrice,
      paymentId: `INIT_${Date.now()}`,
      status: "initiated",
    });

    return res.json({
      success: true,
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("❌ initiateBooking:", err);
    return res.status(500).json({ success: false });
  }
}

// export async function createOrder(req, res) {
//   try {
//     const { amount, bookingId } = req.body;

//     const order = await razorpay.orders.create({
//       amount,
//       currency: "INR",
//       receipt: bookingId, // 🔑 CRITICAL LINK
//     });

//     // 🔥 SAVE ORDER ID IN BOOKING
//     await CourtBooking.findByIdAndUpdate(bookingId, {
//       razorpayOrderId: order.id,
//     });

//     return res.json({
//       orderId: order.id,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     console.error("createOrder error:", err.message);
//     return res.status(500).json({ success: false });
//   }
// }
export async function createOrder(req, res) {
  try {
    const { amount, bookingId } = req.body;

    const booking = await CourtBooking.findById(bookingId);
    if (!booking) {
      return res.status(400).json({ success: false });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: bookingId.toString(),
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    return res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ createOrder:", err);
    return res.status(500).json({ success: false });
  }
}

export async function verifyOrder(req, res) {
  try {
    const { paymentResponse, orderData } = req.body;
    const { bookingId, totalPrice, courts } = orderData;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      paymentResponse;

    if (!bookingId) throw new Error("Booking ID missing");

    // ✅ IDEMPOTENCY
    const existing = await CourtBooking.findById(bookingId);
    if (existing?.status === "Paid") {
      return res.json({ success: true, booking: existing });
    }

    // ✅ VERIFY SIGNATURE
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await CourtBooking.findByIdAndUpdate(bookingId, {
        status: "Failed",
        paymentId: razorpay_payment_id || razorpay_order_id,
      });

      return res.status(400).json({ success: false });
    }

    // ✅ REBUILD SLOTS
    const slots = [];
    courts.forEach((court) =>
      court.dates.forEach((d) =>
        d.slots.forEach((s) =>
          slots.push({
            courtId: court.courtId,
            date: d.date,
            timeRange: s.time || s.timeRange,
            price: s.price,
            status: "booked",
          })
        )
      )
    );

    const booking = await CourtBooking.findByIdAndUpdate(
      bookingId,
      {
        status: "Paid",
        paymentId: razorpay_payment_id,
        slots,
        totalAmount: totalPrice,
      },
      { new: true }
    );

    return res.json({ success: true, booking });
  } catch (err) {
    console.error("verifyOrder error:", err.message);
    return res.status(500).json({ success: false });
  }
}

/* ---------------------------------------
   4️⃣ CHECK AVAILABILITY (UNCHANGED)
--------------------------------------- */
export async function checkAvailability(req, res) {
  const { courts } = req.body;

  const slots = [];
  courts.forEach((court) => {
    court.dates.forEach((dateObj) => {
      dateObj.slots.forEach((slot) => {
        slots.push({
          courtId: court.courtId,
          date: dateObj.date,
          timeRange: slot.time || slot.timeRange,
        });
      });
    });
  });

  const booked = await CourtBooking.find({
    "slots.courtId": { $in: slots.map((s) => s.courtId) },
    "slots.date": { $in: slots.map((s) => s.date) },
    "slots.timeRange": { $in: slots.map((s) => s.timeRange) },
    status: { $in: ["Paid", "reserved"] },
  });

  return res.json({ available: booked.length === 0 });
}

export async function newsletterSignup(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const whatsappInviteLink = process.env.WHATSAPP_INVITE_LINK;

    const mailOptions = {
      from: `Courtline <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to Courtline Community! 🎾",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #76B73A;">Welcome to Courtline! 🎾</h2>
          <p>Thank you for joining our community!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${whatsappInviteLink}" 
               style="background-color: #25D366; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 25px; font-weight: bold;">
              Join WhatsApp Group
            </a>
          </div>
          <p>See you on the court!</p>
          <p><strong>Team Courtline</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Welcome email sent successfully!" });
  } catch (error) {
    console.error("Newsletter signup error:", error.response?.data || error);

    res.status(500).json({ success: false, message: "Failed to send email" });
  }
}

// export async function razorpayWebhook(req, res) {
//   console.log("🔔 ================= WEBHOOK HIT =================");
//   console.log("⏰ Time:", new Date().toISOString());

//   try {
//     /* --------------------------------------------------
//        0️⃣ BODY MUST BE BUFFER (CRITICAL)
//     -------------------------------------------------- */
//     if (!Buffer.isBuffer(req.body)) {
//       console.error("❌ Webhook body is NOT Buffer. Middleware order wrong.");
//       return res.status(500).json({ success: false });
//     }

//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const razorpaySignature = req.headers["x-razorpay-signature"];

//     if (!razorpaySignature || !webhookSecret) {
//       console.error("❌ Missing webhook signature or secret");
//       return res.status(400).json({ success: false });
//     }

//     /* --------------------------------------------------
//        1️⃣ VERIFY SIGNATURE (RAW BODY ONLY)
//     -------------------------------------------------- */
//     const expectedSignature = crypto
//       .createHmac("sha256", webhookSecret)
//       .update(req.body)
//       .digest("hex");

//     if (expectedSignature !== razorpaySignature) {
//       console.error("❌ Webhook signature mismatch");
//       return res.status(400).json({ success: false });
//     }

//     console.log("✅ Webhook signature verified");

//     /* --------------------------------------------------
//        2️⃣ PARSE PAYLOAD
//     -------------------------------------------------- */
//     const payload = JSON.parse(req.body.toString());
//     const event = payload.event;

//     const payment = payload.payload?.payment?.entity;
//     const order = payload.payload?.order?.entity;

//     const paymentId = payment?.id;
//     const orderId = payment?.order_id || order?.id;
//     const receiptBookingId = order?.receipt; // 🔑 bookingId

//     console.log("📌 Event:", event);
//     console.log("💳 Payment ID:", paymentId);
//     console.log("🧾 Order ID:", orderId);
//     console.log("📦 Receipt (bookingId):", receiptBookingId);

//     /* --------------------------------------------------
//        3️⃣ HANDLE SUCCESS EVENTS
//     -------------------------------------------------- */
//     if (event === "payment.captured" || event === "order.paid") {
//       console.log("✅ Handling SUCCESS payment");

//       let booking =
//         (orderId &&
//           (await CourtBooking.findOne({ razorpayOrderId: orderId }))) ||
//         (receiptBookingId && (await CourtBooking.findById(receiptBookingId)));

//       if (!booking) {
//         console.error("❌ PAYMENT SUCCESS BUT BOOKING NOT FOUND", {
//           orderId,
//           receiptBookingId,
//         });
//         return res.json({ success: true }); // do not retry webhook
//       }

//       // ✅ IDEMPOTENT UPDATE
//       if (booking.status !== "Paid") {
//         booking.status = "Paid";
//         booking.paymentId = paymentId || booking.paymentId;
//         booking.slots.forEach((s) => (s.status = "booked"));
//         await booking.save();

//         console.log("🎉 BOOKING MARKED PAID:", booking._id.toString());
//       } else {
//         console.log("ℹ️ Booking already Paid, skipping");
//       }
//     }

//     /* --------------------------------------------------
//        4️⃣ HANDLE FAILURE
//     -------------------------------------------------- */
//     if (event === "payment.failed") {
//       console.log("❌ Handling PAYMENT FAILED");

//       let booking =
//         (orderId &&
//           (await CourtBooking.findOne({ razorpayOrderId: orderId }))) ||
//         (receiptBookingId && (await CourtBooking.findById(receiptBookingId)));

//       if (booking && booking.status !== "Paid") {
//         booking.status = "Failed";
//         booking.paymentId = paymentId || booking.paymentId;
//         await booking.save();

//         console.log("🛑 BOOKING MARKED FAILED:", booking._id.toString());
//       }
//     }

//     console.log("🔔 =============== WEBHOOK END ===============");
//     return res.json({ success: true });
//   } catch (err) {
//     console.error("🔥 WEBHOOK CRASHED:", err);
//     return res.status(500).json({ success: false });
//   }
// }
export async function razorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ success: false });
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;

    const paymentId = payment?.id;
    const orderId = payment?.order_id || order?.id;
    const bookingId = order?.receipt;

    let booking =
      (orderId && (await CourtBooking.findOne({ razorpayOrderId: orderId }))) ||
      (bookingId && (await CourtBooking.findById(bookingId)));

    // 🔥 CREATE BOOKING IF PAYMENT EXISTS BUT BOOKING DOES NOT
    if (!booking && event === "payment.captured") {
      booking = await CourtBooking.create({
        paymentId,
        razorpayOrderId: orderId,
        totalAmount: payment.amount / 100,
        status: "Paid",
        slots: [],
      });

      console.log("🆕 Booking auto-created:", booking._id);
    }

    if (!booking) return res.json({ success: true });

    if (event === "payment.captured" && booking.status !== "Paid") {
      booking.status = "Paid";
      booking.paymentId = paymentId;
      booking.slots.forEach((s) => (s.status = "booked"));
      await booking.save();
    }

    if (event === "payment.failed") {
      booking.status = "Failed";
      await booking.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("🔥 WEBHOOK ERROR:", err);
    return res.status(500).json({ success: false });
  }
}

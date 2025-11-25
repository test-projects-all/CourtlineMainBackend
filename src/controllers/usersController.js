import CourtBooking from "../models/CourtBookingUser.js";
import Court from "../models/Court.js";
import mongoose from "mongoose";
import Slot from "../models/Slot.js";
import Event from "../models/Event.js"
import Razorpay from "razorpay";
import dotenv from "dotenv"
import nodemailer from "nodemailer";
import { google } from "googleapis";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export async function bookSlot(req, res) {
  const { courtId, name, phone, email, slots, totalAmount, PaymentId, date, time, status } = req.body;
  if (!courtId || !name || !phone || !email || !slots || !totalAmount || !PaymentId || !date || !time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const court = await Court.findById(courtId);


  try {
    const newBooking = new CourtBooking({
      courtId,
      courtName,
      name,
      phone,
      email,
      slots,
      totalAmount,
      PaymentId,
      date,
      time,
      status
    });
    const savedBooking = await newBooking.save();
    res.status(201).json({ message: 'Booking successful', bookingId: savedBooking._id });
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
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

export async function getSlot(req, res) {
  try {
    const { courtId } = req.params;
    const { date } = req.query; // Allow passing date as query param

    if (!courtId) return res.status(400).json({ error: 'courtId is required' });

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ error: 'Court not found' });

 let formattedDate = "";

if (date.includes("/")) {
  // Frontend sent DD/MM/YYYY
  const [dd, mm, yyyy] = date.split("/");
  formattedDate = `${dd}-${mm}-${yyyy}`;
} else if (date.includes("-")) {
  // Already in DD-MM-YYYY
  formattedDate = date;
} else {
  return res.status(400).json({ error: "Invalid date format" });
}

    const timeStrToMinutes = (timeStr) => {
      let [time, ampm] = timeStr.split(" ");
      let [h, m] = time.split(":").map(Number);
      if (ampm === "PM" && h < 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    const normalizeTimeStr = (timeStr) => {
      return timeStr.replace(/\s+/g, ' ').trim();
    };

    const formatTo12Hour = (hour24, minute) => {
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      const hour12 = hour24 % 12 || 12;
      return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
    };

    const generateSlots = (startTime, endTime, length) => {
      const slots = [];
      const parseTime = (timeStr) => {
        const [time, ampm] = timeStr.split(" ");
        const [h, m] = time.split(":").map(Number);
        return [h, m, ampm];
      };

      const [startH, startM, startAMPM] = parseTime(startTime);
      const [endH, endM, endAMPM] = parseTime(endTime);
      const [slotH, slotM] = length.split(":").map(Number);

      let currentH = startH + (startAMPM === "PM" && startH < 12 ? 12 : 0);
      let currentM = startM;
      let endHour = endH + (endAMPM === "PM" && endH < 12 ? 12 : 0);

      while (currentH < endHour || (currentH === endHour && currentM < endM)) {
        let slotEndH = currentH + slotH;
        let slotEndM = currentM + slotM;
        if (slotEndM >= 60) {
          slotEndH += Math.floor(slotEndM / 60);
          slotEndM = slotEndM % 60;
        }

        const slotStart = formatTo12Hour(currentH, currentM);
        const slotEnd = formatTo12Hour(slotEndH, slotEndM);

        slots.push({
          time: `${slotStart} - ${slotEnd}`,
          price: court.price || 2000,
          status: "available"
        });

        currentH = slotEndH;
        currentM = slotEndM;
      }

      return slots;
    };

    const dynamicSlots = generateSlots(court.startTime, court.endTime, court.length);

    // ✅ FETCH ALL CONFIRMED BOOKINGS FOR THIS COURT & DATE
    const bookings = await CourtBooking.find({
      'slots.courtId': courtId,
      'slots.date': formattedDate,
      status: { $in: ['Paid', 'reserved'] } // Only confirmed bookings
    });

    const slotMap = new Map();
    dynamicSlots.forEach(s => slotMap.set(normalizeTimeStr(s.time), s));
    console.log(
      "Generated Slot Times:",
      dynamicSlots.map(s => s.time)
    );
    console.log(
      "Booked Slot Times:",
      bookings.flatMap(b => b.slots.map(s => s.timeRange))
    );


    // ✅ MARK BOOKED SLOTS
    bookings.forEach(booking => {
      booking.slots.forEach(bookedSlot => {
        if (bookedSlot.courtId.toString() === courtId && bookedSlot.date === formattedDate) {
          const normalizedTime = normalizeTimeStr(bookedSlot.timeRange);
          if (slotMap.has(normalizedTime)) {
            const slot = slotMap.get(normalizedTime);
            slotMap.set(normalizedTime, { ...slot, status: "booked" });
          }
        }
      });
    });

    // ✅ APPLY EDITED SLOTS (Price & Availability Changes)
    const editedSlots = await Slot.find({
      courtId: String(courtId),
      date: formattedDate
    });

    editedSlots.forEach(editedSlot => {
      const normalizedEditedTime = normalizeTimeStr(editedSlot.slotTime);

      if (slotMap.has(normalizedEditedTime)) {
        const existingSlot = slotMap.get(normalizedEditedTime);

        slotMap.set(normalizedEditedTime, {
          ...existingSlot,
          price: Number(editedSlot.price) || existingSlot.price,
          status: editedSlot.active === "true" || editedSlot.active === true
            ? existingSlot.status // Keep booked/available status
            : "inactive" // Admin disabled this slot
        });
      }
    });

    const finalSlots = Array.from(slotMap.values());

    res.status(200).json({
      message: "Slots fetched successfully",
      date: formattedDate,
      courtId,
      slots: finalSlots
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

// Create Razorpay order
export async function createOrder(req, res) {
  try {
    const { amount } = req.body;
    console.log(amount)
    const options = {
      amount: amount, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create order", error: err.message });
  }
}


export async function verifyOrder(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentResponse, orderData } = req.body;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;
    const { userId, totalPrice, activity, courts, formData } = orderData;

    // Transform courts array into slots array
    const slots = [];
    courts.forEach((court) => {
      court.dates.forEach((dateObj) => {
        dateObj.slots.forEach((slot) => {
          slots.push({
            courtId: court.courtId,
            date: dateObj.date,
            timeRange: slot.time,
            price: slot.price,
            status: 'booked',
          });
        });
      });
    });

    // ✅ CHECK IF ANY SLOT IS ALREADY BOOKED (Race Condition Prevention)
    const conflictingBookings = await CourtBooking.find({
      'slots.courtId': { $in: slots.map(s => s.courtId) },
      'slots.date': { $in: slots.map(s => s.date) },
      'slots.timeRange': { $in: slots.map(s => s.timeRange) },
      status: { $in: ['Paid', 'reserved'] }
    }).session(session);

    // Check for exact slot conflicts
    for (const booking of conflictingBookings) {
      for (const bookedSlot of booking.slots) {
        const conflict = slots.find(
          s => s.courtId.toString() === bookedSlot.courtId.toString() &&
            s.date === bookedSlot.date &&
            s.timeRange === bookedSlot.timeRange
        );

        if (conflict) {
          await session.abortTransaction();
          session.endSession();

          return res.status(409).json({
            success: false,
            message: `Slot ${conflict.timeRange} on ${conflict.date} is already booked. Please refresh and select another slot.`,
            conflictingSlot: conflict
          });
        }
      }
    }

    // ✅ CREATE BOOKING IF NO CONFLICTS
    const booking = new CourtBooking({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      slots,
      totalAmount: totalPrice,
      paymentId: razorpay_payment_id,
      status: 'Paid'
    });

    await booking.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error(err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
}


export async function newsletterSignup(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
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
      subject: 'Welcome to Courtline Community! 🎾',
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
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Welcome email sent successfully!' });

  } catch (error) {
   console.error('Newsletter signup error:', error.response?.data || error);

    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
}

export async function checkAvailability(req, res) {
  const { courts } = req.body;

  const slots = [];
  courts.forEach(court => {
    court.dates.forEach(dateObj => {
      dateObj.slots.forEach(slot => {
        slots.push({
          courtId: court.courtId,
          date: dateObj.date,
          timeRange: slot.time
        });
      });
    });
  });

  // Check existing bookings
  const booked = await CourtBooking.find({
    'slots.courtId': { $in: slots.map(s => s.courtId) },
    'slots.date': { $in: slots.map(s => s.date) },
    'slots.timeRange': { $in: slots.map(s => s.timeRange) },
    status: { $in: ['Paid', 'reserved'] }
  });

  if (booked.length > 0) {
    return res.json({ available: false });
  }

  return res.json({ available: true });
}

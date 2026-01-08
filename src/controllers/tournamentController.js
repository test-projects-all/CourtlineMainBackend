// import tournament from "../models/Tournament.js";
// export const postTournament = async (req, res) => {
//   const { name, age, phone, email, category } = req.body;
//   try {
//     const newTournament = new tournament({
//       name,
//       gender,
//       phone,
//       email,
//       category,
//     });
//     await newTournament.save();
//     res.status(201).json(newTournament);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// import crypto from "crypto";
// import tournament from "../models/Tournament.js";
// import razorpay from "../utils/razorpay.js";

// export const postTournament = async (req, res) => {
//   try {
//     const { name, age, phone, email, category } = req.body;

//     const AMOUNT = 500; // INR

//     const newTournament = await tournament.create({
//       name,
//       age,
//       phone,
//       email,
//       category,
//       payment: {
//         amount: AMOUNT,
//         status: "PENDING",
//       },
//     });

//     // 2️⃣ Create Razorpay Order
//     const order = await razorpay.orders.create({
//       amount: AMOUNT * 100, // paise
//       currency: "INR",
//       receipt: `tournament_${newTournament._id}`,
//     });

//     // 3️⃣ Save orderId
//     newTournament.payment.orderId = order.id;
//     await newTournament.save();

//     res.status(201).json({
//       success: true,
//       tournamentId: newTournament._id,
//       orderId: order.id,
//       amount: AMOUNT,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getTournament = async (req, res) => {
//   try {
//     const tournaments = await tournament.find();
//     console.log("here is the tournaments list", tournament);
//     res.status(200).json(tournaments);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const verifyTournamentPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       tournamentId,
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false });
//     }

//     await tournament.findByIdAndUpdate(tournamentId, {
//       "payment.paymentId": razorpay_payment_id,
//       "payment.signature": razorpay_signature,
//       "payment.status": "PAID",
//     });

//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

import crypto from "crypto";
import Tournament from "../models/Tournament.js";
import razorpay from "../utils/razorpay.js";

export const postTournament = async (req, res) => {
  try {
    const { name, gender, phone, email, category, amount,title } = req.body;

    if (!name || !gender || !phone || !email || !category || !amount || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    console.log("Req body:", req.body);
    const tournament = await Tournament.create({
      name,
      gender,
      phone,
      email,
      category,
      payment: {
        amount: Number(amount), 
        status: "PENDING",
      },
      title,
    });

    const order = await razorpay.orders.create({
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `tournament_${tournament._id}`,
    });

    tournament.payment.orderId = order.id;
    await tournament.save();

    res.status(201).json({
      success: true,
      tournamentId: tournament._id,
      orderId: order.id,
      amount,
      title,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const postTournament = async (req, res) => {
//   const { name, gender, phone, email, category } = req.body;
//   try {
//     const newTournament = new tournament({
//       name,
//       gender,
//       phone,
//       email,
//       category,
//     });
//     await newTournament.save();
//     res.status(201).json(newTournament);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

export const verifyTournamentPayment = async (req, res) => {
  try {
    const {
      tournamentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status,
    } = req.body;

    // Handle FAILED first
    if (status === "FAILED") {
      if (!tournamentId) {
        return res.status(400).json({ success: false });
      }

      await Tournament.findByIdAndUpdate(tournamentId, {
        "payment.status": "FAILED",
      });

      return res.json({ success: false });
    }

    // Validate success payload
    if (
      !tournamentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ success: false });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    await Tournament.findByIdAndUpdate(tournamentId, {
      "payment.paymentId": razorpay_payment_id,
      "payment.signature": razorpay_signature,
      "payment.status": "PAID",
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTournament = async (req, res) => {
  try {
    const data = await Tournament.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

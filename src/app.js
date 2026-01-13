import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";

import adminRoutes from "./routes/adminRoute.js";
import tournamentRoutes from "./routes/tournamentRoute.js";
import { razorpayWebhook } from "./controllers/usersController.js";
import { tournamentrazorpayWebhook } from "./controllers/tournamentController.js";
const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://courtline.netlify.app",
      "https://courtlineadminpanel.netlify.app",
      "https://www.courtline.club",
      "https://courtline.club",
      "https://admin-panel-frontend-tau.vercel.app",
      "https://court-line-frontend.vercel.app",
    ],
    // your frontend URL
    credentials: true, // allow cookies to be sent
  })
);
// app.use("/api/users/razorpay-webhook", bodyParser.raw({ type: "*/*" }));
// app.post(
//   "/api/users/razorpay-webhook",
//   bodyParser.raw({ type: "application/json" }),
//   razorpayWebhook
// );
// app.use("/api/users/razorpay-webhook", bodyParser.raw({ type: "*/*" }));

app.post(
  "/api/users/razorpay-webhook",
  bodyParser.raw({ type: "application/json" }),
  razorpayWebhook
);


app.post(
  "/api/admin/tournament/webhook-razorpay",
  express.raw({ type: "application/json" }),
  tournamentrazorpayWebhook
);

// app.post(
//   "/api/users/razorpay-webhook",
//   bodyParser.raw({ type: "application/json" }),
//   userRoutes
// );

// app.use(
//   "/api/users/razorpay-webhook",
//   express.raw({ type: "application/json" }),
//   razorpayWebhook
// );
app.use(express.json());
app.use(bodyParser.json());

// Example route
app.get("/", (req, res) => {
  res.json({ message: "Courtline Backend API is running." });
});

app.use("/api/users", userRoutes); //not sure
// app.use('/api/auth', authRoutes);
// app.use('/api', courtRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/tournament", tournamentRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;

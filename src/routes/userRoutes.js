import express from 'express';
import {getCourt,getSlot,bookSlot, getEvents, createOrder, verifyOrder,newsletterSignup, checkAvailability} from '../controllers/usersController.js';
const router = express.Router();


router.get('/getCourts',getCourt);

router.get('/getSlot/:courtId',getSlot);

router.post('/bookSlot',bookSlot);
router.get('/getEvents',getEvents)

router.post("/createOrder",createOrder);
router.post("/verifyOrder", verifyOrder); 
router.post("/newsletter-signup", newsletterSignup);
router.post("/checkAvailability", checkAvailability);
app.use("/auth", authRoutes);

// router.get("/",auth, getUsers);
// router.post("/", createUser);

export default router;
// http://localhost:5000/api/users/newsletter-signup
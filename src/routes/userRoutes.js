import express from 'express';
import {getCourt,getSlot,bookSlot, getEvents, createOrder, verifyOrder} from '../controllers/usersController.js';
const router = express.Router();


router.get('/getCourts',getCourt);

router.get('/getSlot/:courtId',getSlot);

router.post('/bookSlot',bookSlot);
router.get('/getEvents',getEvents)

router.post("/createOrder",createOrder);
router.post("/verifyOrder", verifyOrder); 

// router.get("/",auth, getUsers);
// router.post("/", createUser);

export default router;

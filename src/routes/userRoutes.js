import express from 'express';
import {getCourt,getSlot,bookSlot} from '../controllers/usersController.js';
const router = express.Router();


router.get('/getCourts',getCourt);

router.get('/getSlot/:courtId/:date',getSlot);

router.post('/bookSlot',bookSlot);

// router.get("/",auth, getUsers);
// router.post("/", createUser);

export default router;

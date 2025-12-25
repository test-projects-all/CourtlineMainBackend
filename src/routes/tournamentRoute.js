import express from 'express';
// const router = express.Router()
const router = express.Router();
import {postTournament,getTournament, verifyTournamentPayment} from "../controllers/tournamentController.js"
router.post('/postTournament',postTournament);
router.get('/getTournaments',getTournament)
router.post("/verifyTournamentPayment", verifyTournamentPayment);

export default router;

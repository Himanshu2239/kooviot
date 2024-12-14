import { Router } from "express";
import {
  logoutUser,
  registerUser,
  refresh_token,
  assignDailyTasksToSelf,
  retrieveDailyTaskCompleted,
  updateDailyTargetCompletion,
  getSalespersonMonthlyStatsAndDailyTasks,
  canAddTasks,
  markTaskAsCompleted,
  addExtraTask,
} from "../controller/user.js";
// import { upload } from "../middlewares/multer.js";
import { verifyjwt, authSalesperson } from "../middleware/auth.js";
import multer from "multer";


const router = Router();

const upload = multer({
  storage: multer.memoryStorage(), // Store file in memory for further processing
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 5MB
});

router.route("/register").post(registerUser);

router.route("/assignDailyTask").post(
  verifyjwt,
  authSalesperson,
  upload.single("file"), // Middleware to handle single file upload
  assignDailyTasksToSelf
);
router
  .route("/dailyTaskHistory")
  .post(verifyjwt, authSalesperson, retrieveDailyTaskCompleted);
router
  .route("/updateDailyTarget")
  .post(verifyjwt, authSalesperson, updateDailyTargetCompletion);
router
  .route("/getMonthlyStatsAndDailyTasks")
  .post(verifyjwt, authSalesperson, getSalespersonMonthlyStatsAndDailyTasks);

router.route("/canAddTasks").get(verifyjwt, authSalesperson, canAddTasks);
router
  .route("/markTaskAsCompleted")
  .post(verifyjwt, authSalesperson, markTaskAsCompleted);
router.route("/addExtraTask").post(verifyjwt, authSalesperson, addExtraTask);


//secure routes
// router.route("/logout").post(verifyjwt, logoutUser);
// router.route("/refresh-token").post(refresh_token);

export default router;

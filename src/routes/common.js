import { Router } from "express";
import { authAdmin, verifyjwt } from "../middleware/auth.js";
import {
  changeCurrentPassword,
  logoutUser,
  refresh_token,
  adminChangePasswordOfSalesperson,
} from "../controller/common.js";

const router = Router();

router.route("/changePassword").post(verifyjwt, changeCurrentPassword);
router.route("/logoutUser").get(verifyjwt, logoutUser);
router.route("/token").post(refresh_token);
router
  .route("/adminChangePasswordOfSalesperson")
  .post(verifyjwt, authAdmin, adminChangePasswordOfSalesperson);

export default router;

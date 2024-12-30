import { Router } from "express";
import { authAdmin, verifyjwt } from "../middleware/auth.js";
import {
  changeCurrentPassword,
  logoutUser,
  refresh_token,
  adminChangePasswordOfSalesperson,
} from "../controller/common.js";
import { addIssue, getAllIssue, updateIssueStatus } from "../controller/issue.js";
import { addOrder, getAllOrder, updateOrderStatus } from "../controller/order.js";

const router = Router();

router.route("/changePassword").post(verifyjwt, changeCurrentPassword);
router.route("/logoutUser").get(verifyjwt, logoutUser);
router.route("/token").post(refresh_token);
router
  .route("/adminChangePasswordOfSalesperson")
  .post(verifyjwt, authAdmin, adminChangePasswordOfSalesperson);


router.route('/getIssue').get(verifyjwt, getAllIssue);
router.route('/addIssue').post(verifyjwt, addIssue);
router.route('/updateIssueStatus').put(verifyjwt, updateIssueStatus);
router.route('/addOrder').post(verifyjwt, addOrder);
router.route('/getAllOrder').get(verifyjwt, getAllOrder);
router.route('/updateOrderStatus').put(verifyjwt, updateOrderStatus);



  // router.get('/getIssue',  getAllIssue);
  // router.post('/addIssue',  addIssue);
  // router.post('/addOrder',  addOrder);
  // router.get('/getAllOrder',  getAllOrder);
  // router.put('/updateOrderStatus', updateOrderStatus);



export default router;

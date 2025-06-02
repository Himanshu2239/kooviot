import { Router } from "express";
import multer from "multer"; // Import multer
import { authProduction, verifyjwt } from "../middleware/auth.js";
import {
  uploadFileForProduction,
  productionUpdateReport,
  updateStocksForProduction,
  updateRejectionReport,
  updateProductionMesData,
  updatePackinigMesData,
  updatePackingRejMes,
  updateDispatchOutMesData,
  updateInvoiceMesData,
  // updateManPowerCosting,
} from "../controller/production.js";

// Multer setup for storing files in /tmp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp"); // Destination for the uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // File naming convention
  },
});

// Define the upload middleware using multer
const upload = multer({ storage });

const router = Router();

// Route for production person to upload files

router
  .route("/upload")
  .post(
    verifyjwt,
    authProduction,
    upload.single("file"),
    uploadFileForProduction
  );

// Route for production personnel to update MTD values
router
  .route("/mtd/update")
  .post(verifyjwt, authProduction, productionUpdateReport);

router
  .route("/stocks/update")
  .post(verifyjwt, authProduction, updateStocksForProduction);
// router.route("/manPowerCosting/update").post(verifyjwt, authProduction, updateManPowerCosting)
router.route('/rejectionReport/update').post(verifyjwt, authProduction, updateRejectionReport); 

// Mes API
router.route('/productionMesData/update').post(verifyjwt, updateProductionMesData);
router.route('/packingMesData/update').post(verifyjwt, updatePackinigMesData);
router.route('/packingRejMes/update').post(verifyjwt, updatePackingRejMes);
router.route('/dispachOutMes/update').post(verifyjwt, updateDispatchOutMesData)
// router.route('/invoiceMesData/update').post(verifyjwt, updateInvoiceMesData);


export default router;

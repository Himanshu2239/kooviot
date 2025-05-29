import express from "express";
import multer from "multer";
import AWS from "aws-sdk";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Required to define __dirname in ES modules
import { FileUpload } from "../models/uploadDocument.js";
import { asynchandler } from "../utils/asynchandler.js";
import { MTDReport } from "../models/mtd.js";
import { TotalStocks } from "../models/totalStocks.js";
import { ManPowerCosting } from "../models/manPowerCosting.js"
import { rejection } from "../models/rejectionReport.js";
import { ProductionMes } from "../models/productionMes.js";
import { PackingMes } from "../models/packingMes.js";
import PackingRejMes from "../models/packingRejMes.js";
import DispatchOutMes from "../models/dispatchOutMes.js";
import { productionId } from "../constant.js";
import { Invoice } from "../models/invoice.js";

// import { packingMe } from "../models/packingMes.js";
// Define __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// AWS S3 setup
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Use /tmp directory for temporary file storage
const tempDirectory = '/tmp';

// Multer setup to store files in /tmp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDirectory); // Save to /tmp directory
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Utility function to upload file to S3
const uploadToS3 = (filePath, s3Key, contentType) => {
  const fileStream = fs.createReadStream(filePath);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key, // S3 key will include the directory structure
    Body: fileStream,
    ContentType: contentType, // Use file mimetype dynamically
  };

  return s3.upload(params).promise();

};

// Function to generate S3 Key based on fileType
const generateS3Key = (
  fileType,
  userId,
  originalFilename,
  reportMonth,
  reportYear
) => {
  let s3Key = `${fileType}/${userId}/`;

  // If the fileType is a productionReport, append the reportMonth and reportYear
  if (fileType === "productionReport") {
    s3Key += `${reportYear}-${reportMonth}/`;
  }

  // Append timestamp and original filename to s3Key
  s3Key += `${Date.now()}-${originalFilename}`;

  return s3Key;
};

// Function to handle file upload for production
const uploadFileForProduction = asynchandler(async (req, res) => {
  const { fileType, reportMonth, reportYear } = req.body;
  const { file } = req;
  const userId = req.user._id;

  if (!file) {
    return res.status(400).json({ message: "File is required" });
  }

  // Generate the S3 key based on fileType and other parameters

  const s3Key = generateS3Key(
    fileType,
    userId,
    file.originalname,
    reportMonth,
    reportYear
  );

  const localFilePath = path.join(tempDirectory, file.filename);

  try {
    // Upload file to S3

    const s3Response = await uploadToS3(localFilePath, s3Key, file.mimetype);

    // Save file metadata including S3 URL to MongoDB

    const newFile = new FileUpload({
      productionUser: userId,
      fileType,
      s3Key,
      s3FileUrl: s3Response.Location, // Store the public S3 file URL
      reportMonth: fileType === "productionReport" ? reportMonth : null,
      reportYear: fileType === "productionReport" ? reportYear : null,
    });
    await newFile.save();

    // Remove the file from temp folder

    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting temp file:", err);
      }
    });

    res
      .status(201)
      .json({ message: "File uploaded successfully", data: newFile });
  } catch (error) {
    // If an error occurs during file system operations or any other step
    console.error("Error during file upload:", error);

    if (error.code === "ENOENT") {
      return res
        .status(500)
        .json({ message: "File not found in temp directory" });
    }

    return res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
});

// Controller for productionUpdateReport
const productionUpdateReport = async (req, res) => {
  try {

    const { year, month, day, mtdType, value } = req.body;
    const userId = req.user._id;

    // console.log(year, month, day, mtdType, value);

    // Validate and normalize year
    const normalizedYear = year.toString().padStart(4, "0");
    if (!/^\d{4}$/.test(normalizedYear)) {
      return res
        .status(400)
        .json({ message: "Invalid year format. Must be a 4-digit year." });
    }

    // Validate and normalize month

    const validMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const normalizedMonth =
      month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    if (!validMonths.includes(normalizedMonth)) {
      return res
        .status(400)
        .json({ message: "Invalid month. Must be the full month name." });
    }

    // Validate and normalize day
    const normalizedDay = day.toString().padStart(2, "0");
    if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
      return res
        .status(400)
        .json({ message: "Invalid day format. Must be 01-31." });
    }

    // Validate mtdType
    const validMtdTypes = ["totaldispatch", "production", "packing", "sales"];
    if (!validMtdTypes.includes(mtdType)) {
      return res.status(400).json({
        message:
          "Invalid mtdType. Must be one of: totaldispatch, production, packing, sales.",
      });
    }

    // Find or create the report for the production user
    let report = await MTDReport.findOne({ productionUser: userId });
    if (!report) {
      report = new MTDReport({
        productionUser: userId,
        updatedBy: "production",
      });
    }

    // Initialize nested structures if they don't exist
    if (!report.yearReport) {
      report.yearReport = {};
    }

    if (!report.yearReport[normalizedYear]) {
      report.yearReport[normalizedYear] = {
        year: normalizedYear,
        months: {},
        yearReport: {},
      };
    }

    const yearData = report.yearReport[normalizedYear];

    if (!yearData.months[normalizedMonth]) {
      yearData.months[normalizedMonth] = {
        month: normalizedMonth,
        days: {},
        monthReport: {},
      };
    }
    const monthData = yearData.months[normalizedMonth];

    if (!monthData.days[normalizedDay]) {
      monthData.days[normalizedDay] = {
        todayReport: {},
        lastUpdated: new Date(),
      };
    }

    const dayData = monthData.days[normalizedDay];

    // Check if there is an existing value for mtdType on this day
    const previousValue = dayData.todayReport[mtdType] || 0;

    // Update today's report
    dayData.todayReport[mtdType] = value;
    dayData.lastUpdated = new Date();

    // Adjust month and year report by subtracting the previous value and adding the new value

    monthData.monthReport[mtdType] =
      (monthData.monthReport[mtdType] || 0) - previousValue + value;
    yearData.yearReport[mtdType] =
      (yearData.yearReport[mtdType] || 0) - previousValue + value;

    // Save the updated report
    report.markModified("yearReport");
    await report.save();

    res.status(200).json({ message: "Report updated successfully." });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: error.message });
  }
};

// Function to handle stock update for production
// const updateStocksForProduction = asynchandler(async (req, res) => {
//   const { year, month, day, packedStocks, unpackedStocks } = req.body;
//   const userId = req.user._id;

//   console.log(packedStocks, unpackedStocks);

//   // Check that all required fields are provided and valid
//   if (!year || !month || !day || packedStocks===undefined || unpackedStocks===undefined) {
//     return res.status(400).json({
//       message:
//         "Year, month, day, packedStocks, and unpackedStocks are required",
//     });
//   }

//   // Normalize year, month, and day
//   const normalizedYear = year.toString().padStart(4, "0");
//   const normalizedMonth = month.toString().padStart(2, "0");
//   const normalizedDay = day.toString().padStart(2, "0");

//   // Validate that year, month, and day are in the correct format
//   if (!/^\d{4}$/.test(normalizedYear)) {
//     return res
//       .status(400)
//       .json({ message: "Invalid year format. Must be a 4-digit year." });
//   }

//   if (!/^(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
//     return res
//       .status(400)
//       .json({ message: "Invalid month format. Must be 01-12." });
//   }

//   if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
//     return res
//       .status(400)
//       .json({ message: "Invalid day format. Must be 01-31." });
//   }

//   // Construct the date from normalized values
//   const date = new Date(
//     `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
//   );
//   console.log("date",date)
//   date.setHours(0, 0, 0, 0); // Set time to start of the day

//   try {
//     // Find existing record for the specified date and user
//     let totalStocks = await TotalStocks.findOne({ user: userId, date });

//     if (totalStocks) {
//       // Subtract previous values before updating
//       totalStocks.packedStocks = packedStocks;
//       totalStocks.unpackedStocks = unpackedStocks;
//     } else {
//       // Create a new entry if none exists for the specified date
//       totalStocks = new TotalStocks({
//         user: userId,
//         date,
//         packedStocks,
//         unpackedStocks,
//       });
//     }

//     await totalStocks.save();
//     res
//       .status(200)
//       .json({ message: "Stocks updated successfully", totalStocks });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });
//fix date issue
const updateStocksForProduction = asynchandler(async (req, res) => {
  const { year, month, day, agradeStocks, bgradeStocks, unpackedStocks, nonMovingStocks } = req.body;
  const userId = req.user._id;

  // console.log("unmoved", nonMovingStocks)

  // console.log(year, month, day, agradeStocks, bgradeStocks, unpackedStocks, nonMovingStocks );

  // console.log('Packed Stocks:', packedStocks, 'Unpacked Stocks:', unpackedStocks);

  // Check that all required fields are provided and valid
  if (!year || !month || !day || agradeStocks === undefined || bgradeStocks === undefined || nonMovingStocks === undefined || unpackedStocks === undefined) {
    return res.status(400).json({
      message: "Year, month, day, agradeStock, bgradeStocks, nonMovingStocks and unpackedStocks are required",
    });
  }

  // Normalize year, month, and day
  const normalizedYear = year.toString().padStart(4, '0');
  const normalizedMonth = month.toString().padStart(2, '0');
  const normalizedDay = day.toString().padStart(2, '0');

  // Validate that year, month, and day are in the correct format

  if (!/^\d{4}$/.test(normalizedYear)) {
    return res.status(400).json({ message: "Invalid year format. Must be a 4-digit year." });
  }

  if (!/^(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
    return res.status(400).json({ message: "Invalid month format. Must be 01-12." });
  }

  if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
    return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
  }

  // Correctly construct the UTC date without time shift
  const date = new Date(Date.UTC(Number(normalizedYear), Number(normalizedMonth) - 1, Number(normalizedDay), 0, 0, 0));
  // console.log('Date to be saved:', date.toISOString()); // Log the date for debugging


  try {
    // Find existing record for the specified date and user
    let totalStocks = await TotalStocks.findOne({ user: userId, date });

    // console.log(totalStocks.nonMovingStocks)
    // if(totalStocks.nonMovingStocks === undefined){
    //   totalStocks.nonMovingStocks = 0;
    //   console.log("total", totalStocks);
    // }

    if (totalStocks && totalStocks.agradeStocks !== undefined && totalStocks.bgradeStocks !== undefined) {
      // Update existing record

      // console.log("unmoved1", nonMovingStocks);
      // totalStocks.packedStocks = packedStocks;


      totalStocks.agradeStocks = agradeStocks;
      totalStocks.bgradeStocks = bgradeStocks;
      totalStocks.nonMovingStocks = nonMovingStocks;
      totalStocks.packedStocks = agradeStocks + bgradeStocks + nonMovingStocks;
      totalStocks.unpackedStocks = unpackedStocks;
    } else {
      // Create a new entry if none exists for the specified date
      // console.log("unmoved2", nonMovingStocks)
      totalStocks = new TotalStocks({
        user: userId,
        date,
        agradeStocks,
        bgradeStocks,
        nonMovingStocks,
        packedStocks: agradeStocks + bgradeStocks + nonMovingStocks,
        unpackedStocks,
      });

      // console.log("totalStocks", totalStocks);
    }

    // console.log("totalStocks", totalStocks);

    await totalStocks.save();
    res.status(200).json({ message: "Stocks updated successfully", totalStocks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Assuming you have a ManPowerCosting model

const updateManPowerCosting = asynchandler(async (req, res) => {
  const { year, month, day, payroll, contractorLabour, otherLabour } = req.body;
  const userId = req.user._id;

  // console.log(year, month, day, payroll, contractorLabour, otherLabour)

  // Check that all required fields are provided and valid

  if (!year || !month || !day || payroll === undefined || contractorLabour === undefined || otherLabour === undefined) {
    return res.status(400).json({
      message: "Year, month, day, payroll, contractorLabour, and otherLabour are required",
    });
  }

  // Normalize year, month, and day
  const normalizedYear = year.toString().padStart(4, '0');
  const normalizedMonth = month.toString().padStart(2, '0');
  const normalizedDay = day.toString().padStart(2, '0');

  // Validate that year, month, and day are in the correct format
  if (!/^\d{4}$/.test(normalizedYear)) {
    return res.status(400).json({ message: "Invalid year format. Must be a 4-digit year." });
  }

  if (!/^(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
    return res.status(400).json({ message: "Invalid month format. Must be 01-12." });
  }

  if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
    return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
  }

  // Correctly construct the UTC date without time shift
  const date = new Date(Date.UTC(Number(normalizedYear), Number(normalizedMonth) - 1, Number(normalizedDay), 0, 0, 0));

  // console.log("date of production",date);

  try {
    // Find existing record for the specified date and user
    let manPowerCosting = await ManPowerCosting.findOne({ user: userId, date });

    if (manPowerCosting) {
      // Update existing record
      manPowerCosting.payroll = payroll;
      manPowerCosting.contractorLabour = contractorLabour;
      manPowerCosting.otherLabour = otherLabour;
      manPowerCosting.totalCost = payroll + contractorLabour + otherLabour;
    } else {
      // Create a new entry if none exists for the specified date
      manPowerCosting = new ManPowerCosting({
        user: userId,
        date,
        payroll,
        contractorLabour,
        otherLabour,
        totalCost: payroll + contractorLabour + otherLabour,
      });
    }

    await manPowerCosting.save();
    res.status(200).json({ message: "Man Power Costing updated successfully", manPowerCosting });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


const updateRejectionReport = async (req, res) => {
  const userId = req.user._id;
  // console.log(req.user);
  if (!userId) {
    res.status(400).send("invalid user")
  }

  const { year, month, day, lineRejection, packingRejection, scrap } = req.body;
  if (!year || !month || !day) {
    return res.status(400).json({ message: "Date is required." });
  }

  const normalizedYear = year.toString().padStart(4, '0');
  const normalizedMonth = month.toString().padStart(2, '0');
  const normalizedDay = day.toString().padStart(2, '0');

  // Validate that year, month, and day are in the correct format
  if (!/^\d{4}$/.test(normalizedYear)) {
    return res.status(400).json({ message: "Invalid year format. Must be a 4-digit year." });
  }

  if (!/^(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
    return res.status(400).json({ message: "Invalid month format. Must be 01-12." });
  }

  if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
    return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
  }

  // Correctly construct the UTC date without time shift
  const date = new Date(Date.UTC(Number(normalizedYear), Number(normalizedMonth) - 1, Number(normalizedDay), 0, 0, 0));

  try {
    let rejectionReport = await rejection.findOne({ userId, date });
    // check if exist report then save it
    if (rejectionReport) {
      rejectionReport.lineRejection = lineRejection,
        rejectionReport.packingRejection = packingRejection,
        rejectionReport.scrap = scrap
    }
    else {
      rejectionReport = new rejection({
        userId,
        lineRejection,
        packingRejection,
        scrap,
        date,
      })
    }
    await rejectionReport.save();
    return res.status(201).json(rejectionReport);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
}


// Mes API

const updateProductionMesData = async (req, res) => {
  if (req.method === "POST") {
    try {
      const userId = productionId;
      if (!userId) {
        res.status(400).send("user is not found");
      }

      const data = req.body;
      const { year, month, day, line, mtdType, shift, lineRejection, totalPieces } = data;

      const newData = { userId, ...data };

      // Check if batchId already exists
      // const existingBatch = await ProductionMes.findOne({  });
      // if (existingBatch) {
      //   return res.status(400).json({ message: 'Data is already exists!' });
      // }

      const normalizedYear = year.toString().padStart(4, "0");
      if (!/^\d{4}$/.test(normalizedYear)) {
        return res
          .status(400)
          .json({ message: "Invalid year format. Must be a 4-digit year." });
      }

      const monthIndex = parseInt(month, 10);
      const validMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
        return res.status(400).json({ message: "Invalid month. Must be between 01 and 12." });
      }

      const normalizedMonth = validMonths[monthIndex - 1]; // 0-indexed

      // Validate and normalize day
      const normalizedDay = day.toString().padStart(2, "0");
      if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
        return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
      }

      const date = new Date(Date.UTC(Number(normalizedYear), monthIndex - 1, Number(normalizedDay), 0, 0, 0));

      const existingBatch = await ProductionMes.findOne({ date, shift, line });
      if (existingBatch) {
        return res.status(400).json({ message: 'Data is already exists!' });
      }

      const newEntry = new ProductionMes({ date, ...newData });
      await newEntry.save();

      // Validate mtdType
      const validMtdTypes = ["totaldispatch", "production", "packing", "sales"];
      if (!validMtdTypes.includes(mtdType)) {
        return res.status(400).json({
          message: "Invalid mtdType. Must be one of: totaldispatch, production, packing, sales.",
        });
      }

      // Save whole data in packing

      let report = await MTDReport.findOne({ productionUser: userId });
      if (!report) {
        report = new MTDReport({
          productionUser: userId,
          updatedBy: "production",
        });
      }

      // Initialize nested structures if they don't exist
      if (!report.yearReport) {
        report.yearReport = {};
      }

      if (!report.yearReport[normalizedYear]) {
        report.yearReport[normalizedYear] = {
          year: normalizedYear,
          months: {},
          yearReport: {},
        };
      }

      const yearData = report.yearReport[normalizedYear];

      if (!yearData.months[normalizedMonth]) {
        yearData.months[normalizedMonth] = {
          month: normalizedMonth,
          days: {},
          monthReport: {},
        };
      }
      const monthData = yearData.months[normalizedMonth];

      if (!monthData.days[normalizedDay]) {
        monthData.days[normalizedDay] = {
          todayReport: {},
          lastUpdated: new Date(),
        };
      }

      const dayData = monthData.days[normalizedDay];

      // Check if there is an existing value for mtdType on this day
      const previousValue = dayData.todayReport[mtdType] || 0;
      dayData.todayReport[mtdType] = previousValue + totalPieces;
      dayData.lastUpdated = new Date();

      // Adjust month and year report by subtracting the previous value and adding the new value

      monthData.monthReport[mtdType] =
        (monthData.monthReport[mtdType] || 0) + totalPieces;
      yearData.yearReport[mtdType] =
        (yearData.yearReport[mtdType] || 0) + totalPieces;

      report.markModified("yearReport");
      await report.save();

      // const date = new Date(year, month - 1, day);
      // const date = new Date(Date.UTC(Number(normalizedYear), Number(normalizedMonth) - 1, Number(normalizedDay), 0, 0, 0));

      // console.log("date", date);

      // check if exist report then save it
      let rejectionReport = await rejection.findOne({ userId, date });

      // If a report exists, update only lineRejection

      if (rejectionReport) {
        rejectionReport.lineRejection += lineRejection;
      } else {
        // Create a new report with only lineRejection
        rejectionReport = new rejection({
          userId,
          lineRejection,
          date,
        });
      }

      await rejectionReport.save();

      res.status(200).json({ status: 200, message: "Report updated successfully." });
    }
    catch (error) {
      res.status(400).send(error)
      console.log("something went wrong", error);
    }
  }
  else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}


const updatePackinigMesData = async (req, res) => {

  if (req.method === 'POST') {
    try {
      const { year, month, day, mtdType, items, totalPacking } = req.body;

      // console.log(1);

      const userId = productionId;
      // console.log("user", userId);

      if (!userId) {
        res.status(400).send("user is not found");
      }

      if (!year || !month || !day || !items?.length || totalPacking == null) {
        return res.status(400).json({ message: 'Missing required fields' });
      }


      const normalizedYear = year.toString().padStart(4, "0");
      if (!/^\d{4}$/.test(normalizedYear)) {
        return res
          .status(400)
          .json({ message: "Invalid year format. Must be a 4-digit year." });
      }

      const monthIndex = parseInt(month, 10);
      const validMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
        return res.status(400).json({ message: "Invalid month. Must be between 01 and 12." });
      }

      const normalizedMonth = validMonths[monthIndex - 1]; // 0-indexed

      // Validate and normalize day
      const normalizedDay = day.toString().padStart(2, "0");
      if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
        return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
      }

      const date = new Date(Date.UTC(Number(normalizedYear), monthIndex - 1, Number(normalizedDay), 0, 0, 0));

      const existingData = await PackingMes.findOne({ date });
      if(existingData){
        return res.status(400).json({success: false, message: "Data is already exist"})
      }

      let agrade = 0;
      let bgrade = 0;
      let nonMoving = 0;

      // Calculate total pieces by grade
      items.forEach((item) => {
        const pieces = Number(item.pieces) || 0;
        if (item.grade === "A") agrade += pieces;
        else if (item.grade === "B") bgrade += pieces;
        else if (item.grade === "Non moving") nonMoving += pieces;
      });

      // Normalize the given date
      const givenDate = date;
      // givenDate.setHours(0, 0, 0, 0);

      // Get the latest stock in the last 20 days
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      // console.log("twentyDaysAgo", twentyDaysAgo)


      const recentStock = await TotalStocks.find({
        user: userId,
        date: { $gte: twentyDaysAgo }
      }).sort({ date: -1 }).limit(1); // Get the latest one

      // console.log("recentStock", recentStock);

      let matchedStock = null;
      let latestStockDate = null;
      let latestStock = null;

      if (recentStock.length > 0) {
        latestStock = recentStock[0];
        const stockDate = latestStock.date;
        // stockDate.setHours(0, 0, 0, 0);
        latestStockDate = stockDate;

        // console.log("latestStockDate and givenDate", latestStockDate, givenDate)

        // console.log("matchTime and latestTime",stockDate.getTime(), givenDate.getTime())

        if (stockDate.getTime() === givenDate.getTime()) {
          matchedStock = latestStock; // Dates match
        }
      }
      else {
        return res.status(400).json({ success: false, message: "No older stock in record" });
      }

      // === CASE 1: Date matches existing entry ===

      if (matchedStock) {
        matchedStock.agradeStocks += agrade;
        matchedStock.bgradeStocks += bgrade;
        matchedStock.nonMovingStocks += nonMoving;
        matchedStock.packedStocks += (agrade + bgrade + nonMoving);
        await matchedStock.save();

        // === CASE 2: Given date is newer than last saved stock ===
      } else if (givenDate.getTime() > latestStockDate.getTime()) {
        await TotalStocks.create({
          user: userId,
          date: givenDate,
          agradeStocks: latestStock.agradeStocks + agrade,
          bgradeStocks: latestStock.bgradeStocks + bgrade,
          nonMovingStocks: latestStock.nonMovingStocks + nonMoving,
          packedStocks: latestStock.packedStocks + (agrade + bgrade + nonMoving),
        });

        // === CASE 3: Given date is older than latest stock (optional error or ignore) ===
      } else {
        return res.status(400).json({ success: false, message: "Cannot add stock to a past date older than last recorded." });
      }

      
      await PackingMes.create({
        userId,
        date,
        items,
        totalPacking,
      });


      // Validate mtdType
      const validMtdTypes = ["totaldispatch", "production", "packing", "sales"];
      if (!validMtdTypes.includes(mtdType)) {
        return res.status(400).json({
          message: "Invalid mtdType. Must be one of: totaldispatch, production, packing, sales.",
        });
      }

      let report = await MTDReport.findOne({ productionUser: userId });
      if (!report) {
        report = new MTDReport({
          productionUser: userId,
          updatedBy: "production",
        });
      }

      // Initialize nested structures if they don't exist
      if (!report.yearReport) {
        report.yearReport = {};
      }

      if (!report.yearReport[normalizedYear]) {
        report.yearReport[normalizedYear] = {
          year: normalizedYear,
          months: {},
          yearReport: {},
        };
      }

      const yearData = report.yearReport[normalizedYear];

      if (!yearData.months[normalizedMonth]) {
        yearData.months[normalizedMonth] = {
          month: normalizedMonth,
          days: {},
          monthReport: {},
        };
      }

      const monthData = yearData.months[normalizedMonth];

      if (!monthData.days[normalizedDay]) {
        monthData.days[normalizedDay] = {
          todayReport: {},
          lastUpdated: new Date(),
        };
      }

      const dayData = monthData.days[normalizedDay];

      // Check if there is an existing value for mtdType on this day
      const previousValue = dayData.todayReport[mtdType] || 0;
      dayData.todayReport[mtdType] = previousValue + totalPacking;
      dayData.lastUpdated = new Date();

      // Adjust month and year report by subtracting the previous value and adding the new value

      monthData.monthReport[mtdType] =
        (monthData.monthReport[mtdType] || 0) + totalPacking;
      yearData.yearReport[mtdType] =
        (yearData.yearReport[mtdType] || 0) + totalPacking;
      report.markModified("yearReport");
      await report.save();
      return res.status(200).json({ message: 'Packing entry saved' });
    }


    catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
  else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}

const updatePackingRejMes = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const userId = productionId;
      if (!userId) {
        res.status(400).send("user is not found");
      }
      const { year, month, day, items, totalPackingRej } = req.body;
      if (!year || !month || !day || !items?.length || !totalPackingRej) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const normalizedYear = year.toString().padStart(4, "0");
      if (!/^\d{4}$/.test(normalizedYear)) {
        return res
          .status(400)
          .json({ message: "Invalid year format. Must be a 4-digit year." });
      }

      const monthIndex = parseInt(month, 10);
      const validMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
        return res.status(400).json({ message: "Invalid month. Must be between 01 and 12." });
      }

      const normalizedMonth = validMonths[monthIndex - 1]; // 0-indexed

      // Validate and normalize day
      const normalizedDay = day.toString().padStart(2, "0");
      if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
        return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
      }

      const date = new Date(Date.UTC(Number(normalizedYear), monthIndex - 1, Number(normalizedDay), 0, 0, 0));

      const existingPackingRejection = await PackingRejMes.findOne({ date });
      if(existingPackingRejection){
        return res.status(400).json({success: false, message: "Data is already exists"})
      }

      await PackingRejMes.create({
        date,
        items,
        totalPackingRej
      });

      let rejectionReport = await rejection.findOne({ userId, date });

      // If a report exists, update only lineRejection

      if (rejectionReport) {
        rejectionReport.packingRejection += totalPackingRej;
      } else {
        // Create a new report with only lineRejection
        rejectionReport = new rejection({
          userId,
          packingRejection: totalPackingRej,
          date,
        });
      }
      await rejectionReport.save();
      res.status(200).json({success: "true", message: "Packing Rejection Saved Successfully"})
    }
    catch (error) {
      res.status(500).send(error)
    }
  }
  else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}

const updateDispatchOutMesData = async (req, res) => {

  if (req.method === 'POST') {
    try {
      const { year, month, day, mtdType, invoiceNo, items, totalPieces } = req.body;
      if (!year || !month || !day || !invoiceNo || !items?.length || !totalPieces) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // const userId = req.user._id;

      const userId = productionId;

      if (!userId) {
        res.status(400).send("user is not found");
      }

      const normalizedYear = year.toString().padStart(4, "0");
      if (!/^\d{4}$/.test(normalizedYear)) {
        return res
          .status(400)
          .json({ message: "Invalid year format. Must be a 4-digit year." });
      }

      const monthIndex = parseInt(month, 10);
      const validMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
        return res.status(400).json({ message: "Invalid month. Must be between 01 and 12." });
      }

      const normalizedMonth = validMonths[monthIndex - 1]; // 0-indexed

      // Validate and normalize day
      const normalizedDay = day.toString().padStart(2, "0");
      if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
        return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
      }

      const date = new Date(Date.UTC(Number(normalizedYear), monthIndex - 1, Number(normalizedDay), 0, 0, 0));

      const invoiceNoForDispatch = await Invoice.findOne({ invoiceNo })
       
      if(!invoiceNoForDispatch)
       return res.status(400).json({success: "false", error: "Invoice No is not exists"});


      // console.log("date", date);
      // const existingEntry = await DispatchOutMes.findOne({ invoiceNo });


      // if (existingEntry) {
      //   return res.status(400).json({ success: false, error: 'Invoice number already exists' });
      // }

      const dispatchEntry = new DispatchOutMes({
        userId,
        date,
        invoiceNo,
        items,
        totalPieces,
      });

      await dispatchEntry.save();

      // Validate mtdType
      const validMtdTypes = ["totaldispatch", "production", "packing", "sales"];
      if (!validMtdTypes.includes(mtdType)) {
        return res.status(400).json({
          message: "Invalid mtdType. Must be one of: totaldispatch, production, packing, sales.",
        });
      }


      // Save whole data in packing

      let report = await MTDReport.findOne({ productionUser: userId });
      if (!report) {
        report = new MTDReport({
          productionUser: userId,
          updatedBy: "production",
        });
      }

      // Initialize nested structures if they don't exist
      if (!report.yearReport) {
        report.yearReport = {};
      }

      if (!report.yearReport[normalizedYear]) {
        report.yearReport[normalizedYear] = {
          year: normalizedYear,
          months: {},
          yearReport: {},
        };
      }

      const yearData = report.yearReport[normalizedYear];

      if (!yearData.months[normalizedMonth]) {
        yearData.months[normalizedMonth] = {
          month: normalizedMonth,
          days: {},
          monthReport: {},
        };
      }
      const monthData = yearData.months[normalizedMonth];

      if (!monthData.days[normalizedDay]) {
        monthData.days[normalizedDay] = {
          todayReport: {},
          lastUpdated: new Date(),
        };
      }

      const dayData = monthData.days[normalizedDay];

      // Check if there is an existing value for mtdType on this day
      const previousValue = dayData.todayReport[mtdType] || 0;
      dayData.todayReport[mtdType] = previousValue + totalPieces;
      dayData.lastUpdated = new Date();

      // Adjust month and year report by subtracting the previous value and adding the new value

      monthData.monthReport[mtdType] =
        (monthData.monthReport[mtdType] || 0) + totalPieces;
      yearData.yearReport[mtdType] =
        (yearData.yearReport[mtdType] || 0) + totalPieces;

      report.markModified("yearReport");
      await report.save();

      res.status(200).json({ success: true, message: "Data Saved Successfully" });


      // res.status(200).json({ success: true, message: "Data Saved Successfully" })

    }
    catch (error) {
      res.status(500).json({ success: false, message: error })
      console.log(error);
    }
  }
  else {
    res.status(405).json({ success: false, message: "Method not allowed" });
  }
}

const updateInvoiceMesData = async (req, res) => {
  try {
    // console.log(2);
    const { invoiceNo, year, month, day, totalPieces, items } = req.body;
    if (!invoiceNo || !year || !month || !day || !totalPieces || !items?.length) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const userId = productionId;

    const normalizedYear = year.toString().padStart(4, "0");
    if (!/^\d{4}$/.test(normalizedYear)) {
      return res
        .status(400)
        .json({ message: "Invalid year format. Must be a 4-digit year." });
    }

    const monthIndex = parseInt(month, 10);
    const validMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];


    if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
      return res.status(400).json({ message: "Invalid month. Must be between 01 and 12." });
    }

    const normalizedMonth = validMonths[monthIndex - 1]; // 0-indexed

    // Validate and normalize day
    const normalizedDay = day.toString().padStart(2, "0");

    if (!/^(0[1-9]|[12][0-9]|3[01])$/.test(normalizedDay)) {
      return res.status(400).json({ message: "Invalid day format. Must be 01-31." });
    }

    const date = new Date(Date.UTC(Number(normalizedYear), monthIndex - 1, Number(normalizedDay), 0, 0, 0));

    console.log("date", date);

    const existingInvoice = await Invoice.findOne({ invoiceNo })

    if (existingInvoice) {
      return res.status(400).json({ success: "false", message: "Invoice no is already exist" })
    }

    let agrade = 0;
    let bgrade = 0;
    let nonMoving = 0;

    // Calculate total pieces by grade
    items.forEach((item) => {
      const pieces = Number(item.pieces) || 0;
      if (item.grade === "A") agrade += pieces;
      else if (item.grade === "B") bgrade += pieces;
      else if (item.grade === "Non moving") nonMoving += pieces;
    });

    // Normalize the given date
    const givenDate = date;
    // givenDate.setHours(0, 0, 0, 0);

    // Get the latest stock in the last 20 days
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    // console.log("twentyDaysAgo", twentyDaysAgo)



    const recentStock = await TotalStocks.find({
      user: userId,
      date: { $gte: twentyDaysAgo }
    }).sort({ date: -1 }).limit(1); // Get the latest one

    console.log("recentStock", recentStock);

    let matchedStock = null;
    let latestStockDate = null;
    let latestStock = null;

    if (recentStock.length > 0) {
      latestStock = recentStock[0];
      const stockDate = latestStock.date;
      // stockDate.setHours(0, 0, 0, 0);
      latestStockDate = stockDate;

      // console.log("latestStockDate and givenDate", latestStockDate, givenDate)


      // console.log("matchTime and latestTime",stockDate.getTime(), givenDate.getTime())
      // if (latestStock.agradeStocks < agrade || latestStock.bgradeStocks < bgrade || latestStock.nonMovingStocks < nonMoving)
      //   return res.status(400).json({ success: false, message: "Amount of stock is not present" })

      let insufficientTypes = [];

      if (latestStock.agradeStocks < agrade) insufficientTypes.push("A Grade");
      if (latestStock.bgradeStocks < bgrade) insufficientTypes.push("B Grade");
      if (latestStock.nonMovingStocks < nonMoving) insufficientTypes.push("Non-Moving");

      if (insufficientTypes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock in: ${insufficientTypes.join(", ")}`,
        });
      }

      if (stockDate.getTime() === givenDate.getTime()) {
        matchedStock = latestStock; // Dates match
      }
    }
    else {
      return res.status(400).json({ success: false, message: "No older stock in record" });
    }

    // === CASE 1: Date matches existing entry ===

    if (matchedStock) {

      matchedStock.agradeStocks -= agrade;
      matchedStock.bgradeStocks -= bgrade;
      matchedStock.nonMovingStocks -= nonMoving;
      matchedStock.packedStocks -= (agrade + bgrade + nonMoving);
      await matchedStock.save();

      // === CASE 2: Given date is newer than last saved stock ===
    } else if (!latestStockDate || givenDate.getTime() > latestStockDate.getTime()) {
      await TotalStocks.create({
        user: userId,
        date: givenDate,
        agradeStocks: latestStock.agradeStocks - agrade,
        bgradeStocks: latestStock.bgradeStocks - bgrade,
        nonMovingStocks: latestStock.nonMovingStocks - nonMoving,
        packedStocks: latestStock.packedStocks - (agrade + bgrade + nonMoving),
      });

      // === CASE 3: Given date is older than latest stock (optional error or ignore) ===
    } else {
      return res.status(400).json({ success: false, message: "Cannot add stock to a past date older than last recorded." });
    }

    // === Saved in invoice database
    const newInvoice = new Invoice({
      userId,
      invoiceNo,
      date,
      totalPieces,
      items
    });

    await newInvoice.save();

    return res.status(200).json({ success: true, message: "Data Saved Successfully" });

  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });

  }
}


export {
  uploadFileForProduction,
  upload,
  productionUpdateReport,
  updateStocksForProduction,
  updateManPowerCosting,
  updateRejectionReport,
  updateProductionMesData,
  updatePackinigMesData,
  updatePackingRejMes,
  updateDispatchOutMesData,
  updateInvoiceMesData,
};

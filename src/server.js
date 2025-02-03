import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MAX_LIMIT_OF_DATA, STORE_STATIC_DATA } from "./constant.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
// app.use(cors())

app.use(express.json({ limit: `${MAX_LIMIT_OF_DATA}` })); //accept data : json format
app.use(express.urlencoded({ extended: true, limit: `${MAX_LIMIT_OF_DATA}` })); //accept data : url
app.use(express.static(`${STORE_STATIC_DATA}`)); //store  static data  in public folder.
app.use(cookieParser());

//routes import
import authRouter from "./routes/Auth.js";
import userRouter from "./routes/user.js";
import adminRouter from "./routes/admin.js";
import productionRouter from "./routes/production.js";
import commonRouter from "./routes/common.js";

//routes declaration
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/production", productionRouter);
app.use("/common", commonRouter);








// ----- API Added for excel data to save in Database -----

// import multer from "multer";
// import xlsx from "xlsx";
// import { Task } from "./models/task.js";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "/tmp"); // Destination for the uploaded files
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`); // File naming convention
//   },
// });

// // Define the upload middleware using multer
// const upload = multer({ storage });

// // API Endpoint to upload Excel file

// function parseDate(dateStr) {
//   const [day, month, year] = dateStr.split(".").map(Number);
//   // return new Date(year, month - 1, day); // JavaScript's Date object expects months in 0-11 range
//   return new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
// }

// app.post("/upload-tasks", upload.single("file"), async (req, res) => {

//   try {
//     // const { file } = req;
//     // if (!file) {
//     //   return res.status(400).json({ message: "No file uploaded" });
//     // }

//     const filepath = "C:\\Users\\Vishal Gupta\\Downloads\\January 2025 Daily Visit Report (2).xlsx";
//     const workbook = xlsx.readFile(filepath);
//     const sheetName = workbook.SheetNames[0]; // Read the first sheet
//     const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
//       header: 1, // Extract as an array of arrays
//     });

//     // Validate and extract rows
//     const tasks = [];
//     let date;
//     for (let i = 3; i < 66; i++) {  // Start from the third row (index 2)

//       // if(data[i][1] === "SUNDAY" || data[i][1] === "Makarshankranti")
//       // console.log("data", data[i]);
//       if ((i + 1) === 14 || (i + 1) === 28)
//         continue;

//       if (data[i][0]) {
//         date = data[i][0];
//       }
//       const description = data[i][1];
//       // Extract date and description from each row
//       if (!date && !description) {
//         continue; // Skip rows with missing data
//       }

//       const parsedDate = parseDate(date);

//       if (isNaN(parsedDate)) {
//         return res.status(400).json({ message: `Invalid date in row ${i + 1}` });
//       }

//       tasks.push({
//         userId: req.body.userId, // Assuming userId is passed in the request body
//         description: description?.trim(),
//         date: parsedDate,
//         isCompleted: true, // Default to true
//         isExtraTask: false, // Default to false
//       });
//     }

//     // Save tasks to MongoDB

//     const savedTasks = await Task.insertMany(tasks);

//     res.status(200).json({
//       message: "Tasks uploaded successfully",
//       tasks: savedTasks,
//     });
//   } catch (error) {
//     console.error("Error uploading tasks:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// });









// -------- API for All Task to convert into excel file ---------

// import xlsx from "xlsx";
// import { Task } from "./models/task.js";
// import { User } from "./models/user.js";


// app.get("/export-tasks", async (req, res) => {
//   try {
//     // Define the date range (from 1st November to the current date)
//     const startDate = new Date("2024-11-01T00:00:00Z");
//     const endDate = new Date(); // Current date

//     // Fetch tasks within the date range
//     const tasks = await Task.find({
//       date: { $gte: startDate, $lte: endDate },
//     }).populate("userId"); // Populate user details (fullName, jobId, etc.)

//     // Prepare Excel Data
//     const excelData = [
//       ["Date", "Salesperson Name (Job ID)", "Completed Tasks", "Not Completed Tasks"], // Header row
//     ];

//     // Process and group tasks by salesperson
//     tasks.forEach((task) => {
//       const user = task.userId;
//       const salesperson = user ? `${user.fullName} (${user.jobId})` : "Unknown Salesperson";

//       // Add the row to the excelData
//       excelData.push([
//         task.date.toISOString().split("T")[0], // Format date to YYYY-MM-DD
//         salesperson,
//         task.isCompleted ? task.description : "", // Add to Completed Tasks column
//         !task.isCompleted ? task.description : "", // Add to Not Completed Tasks column
//       ]);
//     });

//     console.log("ExcelData", excelData);

//     // Generate Excel workbook and sheet
//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.aoa_to_sheet(excelData);
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Tasks Report");

//     // Write the Excel file to a buffer
//     const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

//     // Set response headers to auto-download the file
//     const fileName = `Tasks_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

//     // Send the file buffer as the response
//     res.status(200).send(buffer);
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// });

// -------  main API ---------

// app.get("/export-tasks", async (req, res) => {
//   try {
//     // Define the date range (from 1st November to the current date)
//     const startDate = new Date("2024-11-01T00:00:00Z");
//     const endDate = new Date(); // Current date

//     // Fetch tasks within the date range
//     const tasks = await Task.find({
//       date: { $gte: startDate, $lte: endDate },
//     }).populate("userId"); // Populate user details (fullName, jobId, etc.)

//      // Sort tasks by date (ascending order)
//     tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

//     // Prepare Excel Data
//     const excelData = [
//       ["Date", "Salesperson Name (Job ID)", "Completed Tasks", "Not Completed Tasks"], // Header row
//     ];

//     // Process and group tasks by salesperson
//     tasks.forEach((task) => {
//       const user = task.userId;
//       const salesperson = user ? `${user.fullName} (${user.jobId})` : "Unknown Salesperson";
//       const formattedDate = task.date.toISOString().split("T")[0];

//       // Check if a row with the same date and salesperson already exists
//       const existingRow = excelData.find(
//         (row) => row[0] === formattedDate && row[1] === salesperson
//       );

//       if (existingRow) {
//         // Update the existing row
//         if (task.isCompleted) {
//           existingRow[2] += existingRow[2] ? `, ${task.description}` : task.description;
//         } else {
//           existingRow[3] += existingRow[3] ? `, ${task.description}` : task.description;
//         }
//       } else {
//         // Add a new row to excelData
//         excelData.push([
//           formattedDate,
//           salesperson,
//           task.isCompleted ? task.description : "", // Completed tasks
//           !task.isCompleted ? task.description : "", // Not completed tasks
//         ]);
//       }
//     });

//     console.log("ExcelData", excelData);

//     // Generate Excel workbook and sheet
//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.aoa_to_sheet(excelData);
//     xlsx.utils.book_append_sheet(workbook, worksheet, "Tasks Report");

//     // Write the Excel file to a buffer
//     const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

//     // Set response headers to auto-download the file
//     const fileName = `Tasks_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
//     res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
//     res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

//     // Send the file buffer as the response
//     res.status(200).send(buffer);
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// });











export { app };


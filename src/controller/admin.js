import { asynchandler } from "../utils/asynchandler.js";
import { Target } from "../models/target.js";
import { User } from "../models/user.js";
import { Task } from "../models/task.js";
import { MTDReport } from "../models/mtd.js";
import { TotalStocks } from "../models/totalStocks.js";
import { FileUpload } from "../models/uploadDocument.js";
import { GlobalPermission } from "../models/permission.js";
import AWS from "aws-sdk";
import path from "path";
import { jobIds } from "../constant.js";

// Salespersons data array
const salesPersons = [
  { id: "SP001", name: "Ravikumar", jobId: "KIOL2238", area: "Bangalore" },
  { id: "SP002", name: "Sugumar", jobId: "KIOL2236", area: "Chennai, TN" },
  { id: "SP003", name: "Vineesh", jobId: "KIOL2239", area: "Delhi" },
  {
    id: "SP004",
    name: "Soma Naveen",
    jobId: "KIOL2070",
    area: "Hyderabad",
  },
  {
    id: "SP005",
    name: "Bharat Lal",
    jobId: "KIOL2064",
    area: "Maharashtra",
  },
  { id: "SP006", name: "Sushila", jobId: "KIOL2225", area: "Kolkata" },
  { id: "SP007", name: "Ardhendu Aditya", jobId: "KIOL2234", area: "Kolkata" },
  { id: "SP008", name: "Yogesh", jobId: "KIOL2049", area: "Pan India" },
  { id: "SP009", name: "Krishnamoorthi", jobId: "KIOL2243", area: "Singapore" },
  { id: "SP0010", name: "others", jobId: "others", area: "Pan India" },
];

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Your AWS Access Key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
  region: process.env.AWS_REGION, // Your S3 bucket region
});

//jobId of salesperson(jobId),target of current month (target)
// const assignMonthlyTargetToSalesperson = asynchandler(async (req, res) => {
//   let { month, year, jobId, target } = req.body;

//   console.log("month,year,jobId,target", month, year, jobId, target);

//    // Convert target to a number (if it's a string that looks like a number)
//    const numericTarget = Number(target);

//    // Validate input data
//    if (!jobId || isNaN(numericTarget) || !month || !year) {
//      return res
//        .status(400)
//        .json({ message: "JobId, month, year, and valid target are required." });
//    }

//   year = year.toString().padStart(4, "0"); // Ensure year is a 4-digit string
//   month = month.toString().padStart(2, "0"); // Ensure month is two digits
//   try {
//     // Find the salesperson by jobId and ensure the role is "salesperson"
//     const salesperson = await User.findOne({ jobId, role: "salesperson" });

//     // If the salesperson is not found
//     if (!salesperson) {
//       return res.status(404).json({ message: "Salesperson not found." });
//     }

//     // Set the start and end of the provided month and year to search for an existing target
//     const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0); // First day of the specified month
//     const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the specified month

//     console.log("startOfMonth,endOfMonth", startOfMonth, endOfMonth);

//     // Check if there is already a target assigned for the specified month, created by the admin
//     let targetRecord = await Target.findOne({
//       userId: salesperson._id,
//       date: { $gte: startOfMonth, $lte: endOfMonth },
//       createdby: "admin", // Ensure the target was created by the admin
//     });

//     if (targetRecord) {
//       // Update the existing target if found
//       targetRecord.assignedMonthlyTarget = target;
//       targetRecord.createdby = "admin"; // Update the creator to admin (if needed)
//     } else {
//       // Create a new target for the salesperson for the specified month
//       targetRecord = new Target({
//         userId: salesperson._id,
//         date: startOfMonth, // Assign the start of the specified month
//         assignedMonthlyTarget: target,
//         dailyCompletedTarget: 0, // Initialize daily completion
//         totalMonthlyTaskCompleted: 0, // Initialize total task completion
//         createdby: "admin", // Set createdBy to admin
//       });
//     }

//     // Save the target record to the database
//     await targetRecord.save();

//     // Respond with success
//     return res.status(200).json({
//       message: `Target of ${target}  assigned to ${salesperson.fullName} (Job ID: ${jobId}) for ${month}/${year}.`,
//       target: targetRecord,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ message: "Server error. Please try again later." });
//   }
// });

//fix date issue here into this code.
const assignMonthlyTargetToSalesperson = asynchandler(async (req, res) => {
  let { month, year, jobId, target } = req.body;

  console.log("month,year,jobId,target", month, year, jobId, target);

  // Convert target to a number (if it's a string that looks like a number)
  const numericTarget = Number(target);

  // Validate input data
  if (!jobId || isNaN(numericTarget) || !month || !year) {
    return res
      .status(400)
      .json({ message: "JobId, month, year, and valid target are required." });
  }

  // Normalize the month and year
  let normalizedMonth = month - 1; // Convert 1-indexed month to 0-indexed
  let normalizedYear = year;
  if (normalizedMonth > 11) {
    normalizedYear += Math.floor(normalizedMonth / 12); // Increment year if month > 12
    normalizedMonth = normalizedMonth % 12; // Normalize month to 0-11 range
  }

  try {
    // Find the salesperson by jobId and ensure the role is "salesperson"
    const salesperson = await User.findOne({ jobId, role: "salesperson" });

    // If the salesperson is not found
    if (!salesperson) {
      return res.status(404).json({ message: "Salesperson not found." });
    }

    // Set the start and end of the provided month and year using UTC
    const startOfMonth = new Date(
      Date.UTC(normalizedYear, normalizedMonth, 1, 0, 0, 0, 0)
    ); // First day of the month in UTC
    const endOfMonth = new Date(
      Date.UTC(normalizedYear, normalizedMonth + 1, 0, 23, 59, 59, 999)
    ); // Last day of the month in UTC

    console.log(
      "startOfMonth, endOfMonth",
      startOfMonth,
      endOfMonth,
      normalizedMonth,
      normalizedYear
    );

    // Check if there is already a target assigned for the specified month, created by the admin
    let targetRecord = await Target.findOne({
      userId: salesperson._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      createdby: "admin", // Ensure the target was created by the admin
    });

    if (targetRecord) {
      // Update the existing target if found
      targetRecord.assignedMonthlyTarget = numericTarget; // Make sure to use numeric target
      targetRecord.createdby = "admin"; // Update the creator to admin (if needed)
    } else {
      // Create a new target for the salesperson for the specified month
      targetRecord = new Target({
        userId: salesperson._id,
        date: startOfMonth, // Assign the start of the specified month
        assignedMonthlyTarget: numericTarget, // Make sure to use numeric target
        dailyCompletedTarget: 0, // Initialize daily completion
        totalMonthlyTaskCompleted: 0, // Initialize total task completion
        createdby: "admin", // Set createdBy to admin
      });
    }

    // Save the target record to the database
    await targetRecord.save();

    // Respond with success
    return res.status(200).json({
      message: `Target of ${numericTarget} assigned to ${salesperson.fullName} (Job ID: ${jobId}) for ${month}/${year}.`,
      target: targetRecord,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
});

//jobId of salesperson, month, year
// const getMonthlyTargetStats = asynchandler(async (req, res) => {
//   let { jobId, month, year } = req.body;

//   console.log("month,year,jobId", month, year, jobId);
//   // Validate inputs
//   if (!jobId || !month || !year) {
//     return res
//       .status(400)
//       .json({ message: "JobId, month, and year are required." });
//   }
//   // Normalize year and month
//   year = year.toString().padStart(4, "0"); // Ensure year is a 4-digit string
//   month = month.toString().padStart(2, "0"); // Ensure month is two digits
//   // console.log("month,year", month, year);

//   try {
//     // Find the salesperson by jobId
//     const salesperson = await User.findOne({ jobId, role: "salesperson" });
//     if (!salesperson) {
//       return res.status(404).json({ message: "Salesperson not found." });
//     }

//     // Get the start and end date of the month
//     const startDate = new Date(year, month - 1, 1); // First day of the month
//     const endDate = new Date(year, month, 0); // Last day of the month

//     // Retrieve the monthly target assigned to the salesperson
//     const monthlyTarget = await Target.findOne({
//       userId: salesperson._id,
//       date: { $gte: startDate, $lte: endDate }, // Ensure it's for the specified month
//     });

//     // If no target found for the specified month
//     if (!monthlyTarget) {
//       return res
//         .status(404)
//         .json({ message: "No target data found for this month." });
//     }

//     // Calculate pending target
//     const totalAssignedTarget = monthlyTarget.assignedMonthlyTarget;
//     const totalCompletedTarget = monthlyTarget.dailyCompletedTarget;
//     const totalPendingTarget = totalAssignedTarget - totalCompletedTarget;

//     // Respond with target stats
//     res.status(200).json({
//       message: `Target data for Job ID: ${jobId} for month/year: ${month}/${year}`,
//       totalAssignedTarget,
//       totalCompletedTarget,
//       totalPendingTarget,
//       tasks: monthlyTarget.tasks, // Include task details with completion status
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// });




//fix date issue :
const getMonthlyTargetStats = asynchandler(async (req, res) => {
  let { jobId, month, year } = req.body;

  console.log("month, year, jobId", month, year, jobId);

  // Validate inputs
  if (!jobId || !month || !year) {
    return res
      .status(400)
      .json({ message: "JobId, month, and year are required." });
  }

  // Normalize the month and year
  let normalizedMonth = Number(month) - 1; // Convert 1-indexed month to 0-indexed
  let normalizedYear = Number(year); // Ensure year is a number
  if (normalizedMonth > 11) {
    normalizedYear += Math.floor(normalizedMonth / 12); // Increment year if month > 12
    normalizedMonth = normalizedMonth % 12; // Normalize month to 0-11 range
  }

  try {
    // Find the salesperson by jobId
    const salesperson = await User.findOne({ jobId, role: "salesperson" });
    if (!salesperson) {
      return res.status(404).json({ message: "Salesperson not found." });
    }

    // Get the start and end date of the month using UTC
    const startDate = new Date(
      Date.UTC(normalizedYear, normalizedMonth, 1, 0, 0, 0, 0)
    ); // First day of the month in UTC
    const endDate = new Date(
      Date.UTC(normalizedYear, normalizedMonth + 1, 0, 23, 59, 59, 999)
    ); // Last day of the month in UTC

    console.log("startDate, endDate", startDate, endDate);

    // Retrieve the monthly target assigned to the salesperson
    const monthlyTarget = await Target.findOne({
      userId: salesperson._id,
      date: { $gte: startDate, $lte: endDate }, // Ensure it's for the specified month
    });

    // If no target found for the specified month
    if (!monthlyTarget) {
      return res
        .status(404)
        .json({ message: "No target data found for this month." });
    }

    // Calculate pending target
    const totalAssignedTarget = monthlyTarget.assignedMonthlyTarget;
    const totalCompletedTarget = monthlyTarget.dailyCompletedTarget;
    const totalPendingTarget = totalAssignedTarget - totalCompletedTarget;

    // Respond with target stats
    res.status(200).json({
      message: `Target data for Job ID: ${jobId} for month/year: ${month}/${year}`,
      totalAssignedTarget,
      totalCompletedTarget,
      totalPendingTarget,
      tasks: monthlyTarget.tasks, // Include task details with completion status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

//canAssignTasks(true/false)
const setTaskAssignmentPermission = asynchandler(async (req, res) => {
  const { canAssignTasks } = req.body; // Boolean value: true/false

  // Validate input
  if (typeof canAssignTasks !== "boolean") {
    return res
      .status(400)
      .json({ message: "Invalid input. Expected a boolean value." });
  }

  try {
    // Ensure only one global permission document exists
    const permission = await GlobalPermission.findOneAndUpdate(
      {}, // We assume only one global settings document
      { canAssignTasks }, // Update the canAssignTasks field
      { new: true, upsert: true } // Return updated doc, create if not found
    );

    res.status(200).json({
      message: `Task assignment permission set to ${canAssignTasks}`,
      permission,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

//set permission
const canSalespersonAddTasks = asynchandler(async (req, res) => {
  try {
    const { jobId } = req.user; // Extract jobId from req.user

    // Fetch global permission settings
    const globalPermission = await GlobalPermission.findOne({});

    // Check if global permission exists
    if (!globalPermission) {
      return res.status(404).json({
        message: "Global permission settings not found.",
      });
    }

    // Find the admin by jobId
    const admin = await User.findOne({ jobId, role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Respond with task assignment permission
    res.status(200).json({
      canAssignTasks: globalPermission.canAssignTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Admin view the latest file uploaded for a given fileType (POST request)
const adminViewFile = asynchandler(async (req, res) => {
  const { fileType } = req.body; // Get fileType from request body
  console.log("fileType:", fileType);

  // Find the latest file by fileType
  const latestFile = await FileUpload.findOne({ fileType })
    .sort({ uploadedAt: -1 }) // Sort by latest uploaded time
    .limit(1); // Get the latest file only

  // If no file is found, return an error
  if (!latestFile) {
    return res
      .status(404)
      .json({ message: `No file found for type ${fileType}` });
  }

  // Return the latest file's URL and relevant details
  res.status(200).json({
    message: "Latest file found",
    fileType: latestFile.fileType,
    uploadedAt: latestFile.uploadedAt,
    s3FileUrl: latestFile.s3FileUrl,
    s3Key: latestFile.s3Key,
  });
});

// Admin download file from S3 using s3Key from request body
const adminDownloadFile = asynchandler(async (req, res) => {
  const { s3Key } = req.body; // Get s3Key from request body

  if (!s3Key) {
    return res.status(400).json({ message: "s3Key is required" });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // S3 bucket name from env
    Key: s3Key, // S3 key (path) provided in the request body
  };

  // Get the file from S3
  s3.getObject(params, (err, data) => {
    if (err) {
      console.error("Error downloading file from S3:", err);
      return res
        .status(500)
        .json({ message: "Error downloading file from S3" });
    }

    // Set the response headers for downloading the file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${path.basename(s3Key)}`
    );
    res.setHeader("Content-Type", data.ContentType);
    console.log("res.Body", data.Body);

    // Send the file data
    res.send(data.Body);
  });
});

//Production Reports from Last 4 Months
const adminViewLastFourMonthsReports = asynchandler(async (req, res) => {
  const currentDate = new Date();
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

  console.log("currentDate,fourMonthsAgo", currentDate, fourMonthsAgo);

  // Fetch the reports for the last 4 months
  const reports = await FileUpload.find({
    fileType: "productionReport",
    reportYear: { $gte: fourMonthsAgo.getFullYear() },
    reportMonth: { $gte: fourMonthsAgo.getMonth() + 1 },
  }).sort({ reportYear: -1, reportMonth: -1 });

  if (!reports || reports.length === 0) {
    return res
      .status(404)
      .json({ message: "No production reports found for the last 4 months" });
  }

  // Return the list of reports along with file URLs
  res.status(200).json(
    reports.map((report) => ({
      reportMonth: report.reportMonth,
      reportYear: report.reportYear,
      uploadedAt: report.uploadedAt,
      s3FileUrl: report.s3FileUrl, // Return the S3 file URL
    }))
  );
});

// Controller for adminViewTasks
// const adminViewTasks = async (req, res) => {
//   try {
//     // Extract body parameters
//     const { date, month, year, jobId } = req.body;

//     // Validate required parameters
//     if (!date || !month || !year || !jobId) {
//       return res.status(400).json({ message: "Missing required parameters." });
//     }

//     // Fetch user based on jobId
//     const user = await User.findOne({ jobId });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     // Create a Date object for the specified day
//     const selectedDate = new Date(year, month - 1, date);

//     // Find all tasks for the user on the selected date
//     const tasks = await Task.find({
//       userId: user._id,
//       date: {
//         $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
//         $lt: new Date(selectedDate.setHours(23, 59, 59, 999)),
//       },
//     });

//     // Categorize tasks into completed, incomplete, and extra
//     const completedTasks = tasks.filter(
//       (task) => task.isCompleted && !task.isExtraTask
//     );
//     const incompleteTasks = tasks.filter((task) => !task.isCompleted);
//     const extraTasks = tasks.filter(
//       (task) => task.isExtraTask && task.isCompleted
//     );

//     // Return the response with categorized tasks
//     res.status(200).json({
//       date: selectedDate.toISOString().split("T")[0],
//       jobId: user.jobId,
//       tasks: tasks.map((task) => ({
//         taskId: task._id,
//         taskDescription: task.description,
//         status: task.isCompleted ? "completed" : "pending",
//       })),
//       completedTasks: completedTasks.map((task) => ({
//         taskId: task._id,
//         taskDescription: task.description,
//       })),
//       incompleteTasks: incompleteTasks.map((task) => ({
//         taskId: task._id,
//         taskDescription: task.description,
//       })),
//       extraTasks: extraTasks.map((task) => ({
//         taskId: task._id,
//         taskDescription: task.description,
//       })),
//     });
//   } catch (error) {
//     console.error("Error fetching tasks:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };
//new api after adding document
const adminViewTasks = async (req, res) => {
  try {
    // Utility function to normalize date to UTC
    const normalizeDateToUTC = (year, month, date) => {
      return new Date(Date.UTC(year, month - 1, date, 0, 0, 0)); // Ensure UTC normalization
    };

    // Extract body parameters
    const { date, month, year, jobId } = req.body;

    console.log(date, month, year, jobId);

    // Validate required parameters
    if (!date || !month || !year || !jobId) {
      return res.status(400).json({ message: "Missing required parameters." });
    }

    // Fetch user based on jobId
    const user = await User.findOne({ jobId });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Normalize the selected date to UTC
    const selectedDate = normalizeDateToUTC(year, month, date);

    console.log("selectedDate", selectedDate);

    // Find all tasks for the user on the selected date
    const tasks = await Task.find({
      userId: user._id,
      date: {
        $gte: selectedDate,
        $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000), // End of the day in UTC
      },
    });

    if (!tasks.length) {
      return res.status(200).json({
        date: selectedDate.toISOString().split("T")[0],
        jobId: user.jobId,
        message: "No tasks found for the given day.",
        tasks: [],
        latestDocument: null,
      });
    }

    // Get the latest document uploaded on the day
    const latestTaskWithDocument = tasks
      .filter((task) => task.fileUrl) // Filter tasks with a fileUrl
      .sort((a, b) => b.updatedAt - a.updatedAt)[0]; // Sort by `updatedAt` and get the latest

    const latestDocument = latestTaskWithDocument?.fileUrl || null;

    // Categorize tasks into completed, incomplete, and extra
    const completedTasks = tasks.filter(
      (task) => task.isCompleted && !task.isExtraTask
    );
    const incompleteTasks = tasks.filter((task) => !task.isCompleted);
    const extraTasks = tasks.filter(
      (task) => task.isExtraTask && task.isCompleted
    );

    // Return the response with categorized tasks and latest document
    res.status(200).json({
      date: selectedDate.toISOString().split("T")[0],
      jobId: user.jobId,
      latestDocument,
      tasks: tasks.map((task) => ({
        taskId: task._id,
        taskDescription: task.description,
        fileUrl: task.fileUrl || null, // Include the file URL if available
        status: task.isCompleted ? "completed" : "pending",
      })),
      completedTasks: completedTasks.map((task) => ({
        taskId: task._id,
        taskDescription: task.description,
        fileUrl: task.fileUrl || null,
      })),
      incompleteTasks: incompleteTasks.map((task) => ({
        taskId: task._id,
        taskDescription: task.description,
        fileUrl: task.fileUrl || null,
      })),
      extraTasks: extraTasks.map((task) => ({
        taskId: task._id,
        taskDescription: task.description,
        fileUrl: task.fileUrl || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Controller for adminFetchReport
// const adminFetchReport = async (req, res) => {
//   try {
//     let { year, month, day } = req.body;
//     const userId = req.productionUserId;

//     // Validate required parameters
//     if (!userId || !year || !month || !day) {
//       return res.status(400).json({ message: "Missing required parameters." });
//     }
//     // Normalize year, month, and day
//     year = year.toString(); // Ensure year is a string
//     day = day.toString().padStart(2, "0"); // Ensure day is two digits
//     // Find the report for the production user

//     const report = await MTDReport.findOne({ productionUser: userId }).populate(
//       "productionUser"
//     );
//     if (!report) {
//       return res.status(404).json({ message: "Report not found." });
//     }

//     // Extract the required data
//     const yearData = report.yearReport?.[year];
//     if (!yearData) {
//       return res.status(404).json({ message: "Year data not found." });
//     }

//     const monthData = yearData.months?.[month];
//     if (!monthData) {
//       return res.status(404).json({ message: "Month data not found." });
//     }

//     const dayData = monthData.days?.[day] || { todayReport: {} };

//     // Ensure all mtdTypes have a value in dayReport, defaulting to 0 if not found
//     const allMtdTypes = ["totaldispatch", "production", "packing", "sales"];
//     const dayReport = {};
//     allMtdTypes.forEach((type) => {
//       dayReport[type] = dayData.todayReport[type] || 0;
//     });

//     // Calculate month-to-date report till the given day
//     const monthReportTillDate = {};
//     allMtdTypes.forEach((type) => {
//       monthReportTillDate[type] = 0;
//       for (let d in monthData.days) {
//         if (parseInt(d) <= parseInt(day)) {
//           monthReportTillDate[type] += monthData.days[d].todayReport[type] || 0;
//         }
//       }
//     });

//     // Return the response with the day and month-to-date report
//     res.status(200).json({
//       dayReport: dayReport,
//       monthReportTillDate: monthReportTillDate, // Cumulative MTD value till the given day
//       monthReport: monthData.monthReport, // Total cumulative value for the whole month
//     });
//   } catch (error) {
//     console.error("Error fetching report:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// };

/**
 * Converts month numbers to their corresponding month names.
 * @param {number|string} month - The month number (1-12) or month name.
 * @returns {string|null} - The month name or null if invalid.
 */
const getMonthName = (month) => {
  const monthNames = [
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

  if (typeof month === "number") {
    if (month >= 1 && month <= 12) {
      return monthNames[month - 1];
    }
    return null;
  }

  if (typeof month === "string") {
    const index = monthNames.findIndex(
      (m) => m.toLowerCase() === month.toLowerCase()
    );
    return index !== -1 ? monthNames[index] : null;
  }

  return null;
};

/**
 * Helper function to extract dayReport and monthReportTillDate
 * @param {Object} yearData - The data for the specified year.
 * @param {Object} monthData - The data for the specified month.
 * @param {string} targetDay - The day to extract data for.
 * @returns {Object} - Contains dayReport, monthReportTillDate, and monthReport.
 */
const extractReports = (yearData, monthData, targetDay, allMtdTypes) => {
  const dayData = monthData.days?.[targetDay] || { todayReport: {} };

  // Extract the day report, ensuring all types are present
  const dayReport = {};
  allMtdTypes.forEach((type) => {
    dayReport[type] = dayData.todayReport[type] || 0;
  });

  // Calculate month-to-date cumulative report till the target day
  const monthReportTillDate = {};
  allMtdTypes.forEach((type) => {
    monthReportTillDate[type] = 0;
    for (let d in monthData.days) {
      if (parseInt(d, 10) <= parseInt(targetDay, 10)) {
        monthReportTillDate[type] += monthData.days[d].todayReport[type] || 0;
      }
    }
  });

  // Extract cumulative month report
  const monthReport = {};
  allMtdTypes.forEach((type) => {
    monthReport[type] = monthData.monthReport?.[type] || 0;
  });

  return { dayReport, monthReportTillDate, monthReport };
};

/**
 * Fetches the MTD report for a production user based on the provided date
 * or retrieves the latest available report.
 * @param {Object} req - The request object containing productionUserId and optionally year, month, day.
 * @param {Object} res - The response object used to send back the desired data.
 */
const adminFetchReport = async (req, res) => {
  try {
    const { year, month, day } = req.body;
    const userId = req.productionUserId;

    // **Validation: Only userId is mandatory**
    if (!userId) {
      return res.status(400).json({ message: "Missing required user ID." });
    }

    // **Find the report for the production user**
    const report = await MTDReport.findOne({ productionUser: userId }).populate(
      "productionUser"
    );
    if (!report) {
      return res
        .status(404)
        .json({ message: "Report not found for this user." });
    }

    // **Define required MTD types**
    const allMtdTypes = ["totaldispatch", "production", "packing", "sales"];

    /**
     * **Case 1**: Specific Date Provided
     */
    if (year && month && day) {
      // **Convert and Validate Month**
      const formattedMonth = getMonthName(month);
      if (!formattedMonth) {
        return res.status(400).json({ message: "Invalid month value." });
      }

      // **Normalize Year and Day**
      const formattedYear = year.toString();
      const formattedDay = day.toString().padStart(2, "0");

      // **Access Year Data**
      const yearData = report.yearReport?.[formattedYear];
      if (!yearData) {
        return res.status(404).json({ message: "Year data not found." });
      }

      // **Access Month Data**
      const monthData = yearData.months?.[formattedMonth];
      if (!monthData) {
        return res.status(404).json({ message: "Month data not found." });
      }

      // **Extract Reports for the Specific Day**
      const { dayReport, monthReportTillDate, monthReport } = extractReports(
        yearData,
        monthData,
        formattedDay,
        allMtdTypes
      );

      // **Construct Report Date**
      const reportDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;

      // **Respond with the Specific Date's Report**
      return res.status(200).json({
        message: "Report data retrieved successfully for the specified date.",
        dayReport,
        monthReportTillDate,
        monthReport,
        date: reportDate,
      });
    }

    /**
     * **Case 2**: No Specific Date Provided (Fetch Latest Report)
     */
    // **Initialize Variables for Iteration**
    let latestReportFound = false;
    const currentDate = new Date();
    let dateToCheck = new Date(currentDate);

    // **Iterate Backward Up to 30 Days to Find the Latest Available Report**
    for (let i = 0; i < 30; i++) {
      const checkYear = dateToCheck.getFullYear().toString();
      const checkMonthNumber = dateToCheck.getMonth() + 1; // getMonth() is zero-based
      const checkMonthName = getMonthName(checkMonthNumber);
      const checkDay = dateToCheck.getDate().toString().padStart(2, "0");

      if (!checkMonthName) {
        // Invalid month, skip to previous day
        dateToCheck.setDate(dateToCheck.getDate() - 1);
        continue;
      }

      // **Access Year and Month Data**
      const yearData = report.yearReport?.[checkYear];
      if (!yearData) {
        // Year data not found, skip to previous day
        dateToCheck.setDate(dateToCheck.getDate() - 1);
        continue;
      }

      const monthData = yearData.months?.[checkMonthName];
      if (!monthData) {
        // Month data not found, skip to previous day
        dateToCheck.setDate(dateToCheck.getDate() - 1);
        continue;
      }

      // **Access Day Data**
      const dayData = monthData.days?.[checkDay];
      if (!dayData || !dayData.todayReport) {
        // Day data not found or todayReport is empty, skip to previous day
        dateToCheck.setDate(dateToCheck.getDate() - 1);
        continue;
      }

      // **Check if All Required MTD Types are Present and Not Null**
      const hasAllTypes = allMtdTypes.every(
        (type) =>
          dayData.todayReport[type] !== undefined &&
          dayData.todayReport[type] !== null
      );

      if (hasAllTypes) {
        // **Extract Reports for the Found Day**
        const { dayReport, monthReportTillDate, monthReport } = extractReports(
          yearData,
          monthData,
          checkDay,
          allMtdTypes
        );

        // **Construct Report Date**
        const reportDate = `${checkYear}-${checkMonthName}-${checkDay}`;

        // **Respond with the Latest Available Report**
        return res.status(200).json({
          message: "Latest available report data retrieved successfully.",
          dayReport,
          monthReportTillDate,
          monthReport,
          date: reportDate,
        });
      }

      // **Move to the Previous Day**
      dateToCheck.setDate(dateToCheck.getDate() - 1);
    }

    /**
     * **If No Report Found in the Last 30 Days**
     */
    return res.status(404).json({
      message: "No report data found in the last 30 days.",
      dayReport: { totaldispatch: 0, production: 0, packing: 0, sales: 0 },
      monthReportTillDate: {
        totaldispatch: 0,
        production: 0,
        packing: 0,
        sales: 0,
      },
      monthReport: { totaldispatch: 0, production: 0, packing: 0, sales: 0 },
      date: null,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Controller function to retrieve TotalStocks data
// const retrieveStocksData = asynchandler(async (req, res) => {
//   const { date, month, year } = req.body;
//   const productionUserId = req.productionUserId;

//   console.log("productionId", productionUserId);

//   // Ensure all three inputs (date, month, year) are provided
//   if (!date || !month || !year) {
//     return res.status(400).json({
//       message: "Please provide all fields: date, month, and year.",
//     });
//   }

//   // Set up the query object based on the provided date, month, and year
//   const query = {
//     user: productionUserId,
//     date: {
//       $gte: new Date(year, month - 1, date, 0, 0, 0, 0),
//       $lt: new Date(year, month - 1, date, 23, 59, 59, 999),
//     },
//   };

//   try {
//     const stocksData = await TotalStocks.findOne(query);

//     if (!stocksData) {
//       return res
//         .status(404)
//         .json({ message: "No data found for the given date." });
//     }

//     // Calculate total stocks (packed + unpacked)
//     const totalStocks = stocksData.packedStocks + stocksData.unpackedStocks;

//     // Return the packedStocks, unpackedStocks, and calculated totalStocks
//     res.status(200).json({
//       message: "Stocks data retrieved successfully",
//       data: {
//         packedStocks: stocksData.packedStocks,
//         unpackedStocks: stocksData.unpackedStocks,
//         totalStocks: totalStocks,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

//Controller function to retrieve TotalStocks data  final tested
const retrieveStocksData = asynchandler(async (req, res) => {
  const { date, month, year } = req.body;
  const productionUserId = req.productionUserId;

  console.log("productionId", productionUserId);

  let queryDate;

  try {
    let stocksData;

    // **Case 1**: If a specific date is provided
    if (date && month && year) {
      queryDate = new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0));

      const query = {
        user: productionUserId,
        date: {
          $gte: new Date(Date.UTC(year, month - 1, date, 0, 0, 0, 0)),
          $lt: new Date(Date.UTC(year, month - 1, date, 23, 59, 59, 999)),
        },
      };

      // Check for data on the specific date
      stocksData = await TotalStocks.findOne(query);

      if (!stocksData) {
        // No data found for the specific date
        return res.status(200).json({
          message: "No data found for the provided date.",
          data: {
            packedStocks: 0,
            unpackedStocks: 0,
            totalStocks: 0,
            date: queryDate.toISOString(),
          },
        });
      }
    }
    // **Case 2**: If no date is provided, iterate backward to find the latest data
    else {
      queryDate = new Date(); // Start from today

      // Search for the latest document iterating backward
      while (!stocksData) {
        const query = {
          user: productionUserId,
          date: {
            $gte: new Date(
              Date.UTC(
                queryDate.getFullYear(),
                queryDate.getMonth(),
                queryDate.getDate(),
                0,
                0,
                0,
                0
              )
            ),
            $lt: new Date(
              Date.UTC(
                queryDate.getFullYear(),
                queryDate.getMonth(),
                queryDate.getDate(),
                23,
                59,
                59,
                999
              )
            ),
          },
        };

        stocksData = await TotalStocks.findOne(query);

        if (!stocksData) {
          queryDate.setUTCDate(queryDate.getUTCDate() - 1);
        } else {
          break;
        }

        // Avoid infinite loop: Stop iterating after 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        if (queryDate < thirtyDaysAgo) {
          break;
        }
      }

      if (!stocksData) {
        // No data found even after iterating
        return res.status(200).json({
          message: "No data found for the latest available days.",
          data: {
            packedStocks: 0,
            unpackedStocks: 0,
            totalStocks: 0,
            date: null,
          },
        });
      }
    }

    // Calculate total stocks
    const totalStocks = stocksData.packedStocks + stocksData.unpackedStocks;

    res.status(200).json({
      message: "Stocks data retrieved successfully",
      data: {
        packedStocks: stocksData.packedStocks,
        unpackedStocks: stocksData.unpackedStocks,
        totalStocks: totalStocks,
        date: queryDate.toISOString(), // Return the exact date for which data was found
      },
    });
  } catch (error) {
    console.error("Error fetching stocks data:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// API to get monthly target stats for all salespersons
// const getAllMonthlyTargetStats = asynchandler(async (req, res) => {
//   const { month, year } = req.body;

//   // Validate inputs
//   if (!month || !year) {
//     return res.status(400).json({ message: "Month and year are required." });
//   }

//   try {
//     // Get the start and end dates of the month
//     const startDate = new Date(year, month - 1, 1);
//     const endDate = new Date(year, month, 0);

//     console.log("startDate,endDate", startDate, endDate);

//     // Initialize an array to store each salesperson's target stats
//     const statsArray = await Promise.all(
//       salesPersons.map(async (person) => {
//         const salesperson = await User.findOne({
//           jobId: person.jobId,
//           role: "salesperson",
//         });

//         if (!salesperson) {
//           return {
//             name: person.name,
//             jobId: person.jobId,
//             message: "Salesperson not found",
//           };
//         }

//         // Retrieve the target for the specified month and year
//         const monthlyTarget = await Target.findOne({
//           userId: salesperson._id,
//           date: { $gte: startDate, $lte: endDate },
//         });

//         if (!monthlyTarget) {
//           return {
//             name: person.name,
//             jobId: person.jobId,
//             message: "No target data found for this month",
//           };
//         }

//         // Calculate targets
//         const totalAssignedTarget = monthlyTarget.assignedMonthlyTarget;
//         const totalCompletedTarget = monthlyTarget.dailyCompletedTarget;
//         const totalPendingTarget = totalAssignedTarget - totalCompletedTarget;

//         return {
//           name: person.name,
//           jobId: person.jobId,
//           totalAssignedTarget,
//           totalCompletedTarget,
//           totalPendingTarget,
//           tasks: monthlyTarget.tasks || [], // Include task details with completion status
//         };
//       })
//     );

//     // Respond with the array of stats
//     res.status(200).json({
//       message: `Monthly target stats for all salespersons for ${month}/${year}`,
//       stats: statsArray,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// });

//fixing the date issue.
const getAllMonthlyTargetStats = asynchandler(async (req, res) => {
  const { month, year } = req.body;

  // Validate inputs
  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required." });
  }

  // Normalize the month and year
  let normalizedMonth = month - 1; // Convert 1-indexed month to 0-indexed
  let normalizedYear = year;
  if (normalizedMonth > 11) {
    normalizedYear += Math.floor(normalizedMonth / 12); // Increment year if month > 12
    normalizedMonth = normalizedMonth % 12; // Normalize month to 0-11 range
  }

  try {
    // Get the start and end dates of the month using UTC
    const startDate = new Date(
      Date.UTC(normalizedYear, normalizedMonth, 1, 0, 0, 0, 0)
    ); // First day of the month in UTC
    const endDate = new Date(
      Date.UTC(normalizedYear, normalizedMonth + 1, 0, 23, 59, 59, 999)
    ); // Last day of the month in UTC

    console.log("startDate, endDate", startDate, endDate);

    // Initialize an array to store each salesperson's target stats
    const statsArray = await Promise.all(
      salesPersons.map(async (person) => {
        const salesperson = await User.findOne({
          jobId: person.jobId,
          role: "salesperson",
        });

        if (!salesperson) {
          return {
            name: person.name,
            jobId: person.jobId,
            message: "Salesperson not found",
          };
        }

        // Retrieve the target for the specified month and year
        const monthlyTarget = await Target.findOne({
          userId: salesperson._id,
          date: { $gte: startDate, $lte: endDate },
        });

        if (!monthlyTarget) {
          return {
            name: person.name,
            jobId: person.jobId,
            message: "No target data found for this month",
          };
        }

        // Calculate targets
        const totalAssignedTarget = monthlyTarget.assignedMonthlyTarget;
        const totalCompletedTarget = monthlyTarget.dailyCompletedTarget;
        const totalPendingTarget = totalAssignedTarget - totalCompletedTarget;

        return {
          name: person.name,
          jobId: person.jobId,
          totalAssignedTarget,
          totalCompletedTarget,
          totalPendingTarget,
          tasks: monthlyTarget.tasks || [], // Include task details with completion status
        };
      })
    );

    // Respond with the array of stats
    res.status(200).json({
      message: `Monthly target stats for all salespersons for ${month}/${year}`,
      stats: statsArray,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});
//overall totalmonthlyTargets
// const getTotalMonthlyTargetsOverall = asynchandler(async (req, res) => {
//   let { month, year } = req.body;

//   // Validate input
//   if (!month || !year) {
//     return res.status(400).json({
//       message: "Month and year are required.",
//     });
//   }
//   year = year.toString().padStart(4, "0"); // Ensure year is a 4-digit string
//   month = month.toString().padStart(2, "0"); // Ensure month is two digits
//   try {
//     // Set the start and end dates of the month for querying targets
//     const startOfMonth = new Date(year, month - 1, 1);
//     const endOfMonth = new Date(year, month, 0);

//     // Initialize totals
//     let totalAssignedTargets = 0;
//     let totalCompletedTargets = 0;
//     let totalPendingTargets = 0;

//     // Loop through each jobId
//     for (const jobId of jobIds) {
//       // Find the salesperson by jobId
//       console.log("jobId", jobId);
//       const salesperson = await User.findOne({ jobId, role: "salesperson" });
//       if (!salesperson) {
//         console.warn(`Salesperson with jobId ${jobId} not found.`);
//         continue; // Skip if salesperson not found
//       }

//       // Fetch the monthly target for each salesperson within the specified month
//       const monthlyTarget = await Target.findOne({
//         userId: salesperson._id,
//         date: { $gte: startOfMonth, $lte: endOfMonth },
//         createdby: "admin",
//       });

//       // If no target data for the month, skip to the next salesperson
//       if (!monthlyTarget) continue;

//       // Accumulate totals
//       totalAssignedTargets += monthlyTarget.assignedMonthlyTarget;
//       totalCompletedTargets += monthlyTarget.dailyCompletedTarget;
//     }

//     // Calculate total pending targets
//     totalPendingTargets = totalAssignedTargets - totalCompletedTargets;

//     // Respond with the accumulated totals
//     res.status(200).json({
//       message: `Total targets for all salespersons for ${month}/${year}`,
//       totalAssignedTargets,
//       totalCompletedTargets,
//       totalPendingTargets,
//     });
//   } catch (error) {
//     console.error("Error fetching total monthly targets:", error);
//     res.status(500).json({ message: "Server error. Please try again later." });
//   }
// });

//fix date issue :javascript indexing
const getTotalMonthlyTargetsOverall = asynchandler(async (req, res) => {
  let { month, year } = req.body;

  // Validate input
  if (!month || !year) {
    return res.status(400).json({
      message: "Month and year are required.",
    });
  }

  // Normalize the month and year
  let normalizedMonth = month - 1; // Convert 1-indexed month to 0-indexed
  let normalizedYear = year;
  if (normalizedMonth > 11) {
    normalizedYear += Math.floor(normalizedMonth / 12); // Increment year if month > 12
    normalizedMonth = normalizedMonth % 12; // Normalize month to 0-11 range
  }

  try {
    // Set the start and end dates of the month using UTC for querying targets
    const startOfMonth = new Date(
      Date.UTC(normalizedYear, normalizedMonth, 1, 0, 0, 0, 0)
    ); // First day of the month in UTC
    const endOfMonth = new Date(
      Date.UTC(normalizedYear, normalizedMonth + 1, 0, 23, 59, 59, 999)
    ); // Last day of the month in UTC

    console.log("startOfMonth, endOfMonth", startOfMonth, endOfMonth);

    // Initialize totals
    let totalAssignedTargets = 0;
    let totalCompletedTargets = 0;
    let totalPendingTargets = 0;

    // Loop through each jobId
    for (const jobId of jobIds) {
      // Find the salesperson by jobId
      console.log("jobId", jobId);
      const salesperson = await User.findOne({ jobId, role: "salesperson" });
      if (!salesperson) {
        console.warn(`Salesperson with jobId ${jobId} not found.`);
        continue; // Skip if salesperson not found
      }

      // Fetch the monthly target for each salesperson within the specified month
      const monthlyTarget = await Target.findOne({
        userId: salesperson._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        createdby: "admin",
      });

      // If no target data for the month, skip to the next salesperson
      if (!monthlyTarget) continue;

      // Accumulate totals
      totalAssignedTargets += monthlyTarget.assignedMonthlyTarget;
      totalCompletedTargets += monthlyTarget.dailyCompletedTarget;
    }

    // Calculate total pending targets
    totalPendingTargets = totalAssignedTargets - totalCompletedTargets;

    // Respond with the accumulated totals
    res.status(200).json({
      message: `Total targets for all salespersons for ${month}/${year}`,
      totalAssignedTargets,
      totalCompletedTargets,
      totalPendingTargets,
    });
  } catch (error) {
    console.error("Error fetching total monthly targets:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

export {
  assignMonthlyTargetToSalesperson,
  getMonthlyTargetStats,
  setTaskAssignmentPermission,
  canSalespersonAddTasks,
  adminDownloadFile,
  adminViewLastFourMonthsReports,
  adminViewFile,
  adminViewTasks,
  adminFetchReport,
  retrieveStocksData,
  getAllMonthlyTargetStats,
  getTotalMonthlyTargetsOverall,
};

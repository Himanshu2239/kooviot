import { Issues as issueModel } from "../models/issue.js";
import { asynchandler } from "../utils/asynchandler.js";

const addIssue = async (req, res) => {
  const { issue, assignedTo, relatedTo, currentStatus } = req.body;
  try {
    const allIssues = await issueModel.find();
    const userId = req.user._id;
    let issueNo = (allIssues.length + 1).toString();
    if (issueNo.length === 1)
      issueNo = '000' + issueNo;
    if (issueNo.length === 2)
      issueNo = '00' + issueNo;
    if (issueNo.length === 3)
      issueNo = '0' + issueNo;
    // console.log(IssuesLength);
    const newIssue = await issueModel.create({ userId, issueNo, issue, assignedTo, relatedTo, currentStatus });
    res.status(201).json({
      success: true,
      message: "Issue successfully added.",
      data: newIssue,
    });
  } catch (error) {
    console.error("Error adding issue:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding the issue.",
      error: error.message,
    });
  }
}


const getAllIssue = asynchandler(
  async (req, res) => {
    try {
      const issue = await issueModel.find();
      res.status(200).send(issue)
    } catch (error) {
      console.error("Error fetching issues:", error.message);
      res.status(500).json({
        success: false,
        message: "Internal server error while fetching issues.",
        error: error.message,
      });
    }
  }
)

const updateIssueStatus = asynchandler(
  async (req, res) => {
    try {
      const Id = req.body.id;
      if (!Id)
        res.status(404).send('user is not valid');
      const updatedStatus = req.body.selectedStatus;
      if (!updatedStatus)
        res.status(404).send("User is not selected status");
      const updatedIssue = await issueModel.updateOne(
        { _id: Id },
        { $set: { currentStatus: updatedStatus } }
      )
      res.status(200).send("Status is updated");
    }
    catch (error) {
      res.status(500).send(error)
      console.log(error);
      // res.status(500).send(error);
    }
  }
)


export { addIssue, getAllIssue, updateIssueStatus };


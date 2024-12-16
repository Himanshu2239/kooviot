import AWS from "aws-sdk";

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

export const uploadToS3 = async (file, fileName) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME, // Your S3 bucket name
    Key: fileName, // File name to be saved in S3
    Body: file.buffer, // File content
    ContentType: file.mimetype, // MIME type of the file

  };

  return s3.upload(params).promise();
};

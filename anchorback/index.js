const express = require("express");
const ytSearch = require("yt-search");
const mongoose = require("mongoose");
const cors = require('cors')
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB (replace 'your_database_url' with your actual MongoDB connection string)
mongoose.connect("mongodb://localhost:27017/ytbox", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// Define a simplified schema for storing video information in MongoDB
const videoSchema = new mongoose.Schema({
  title: String,
  views: Number,
  likes: Number,
});

const Video = mongoose.model("Video", videoSchema);

app.post("/analyze-video", async (req, res) => {
  const { videoUrl } = req.body;

  try {
    const videoData = await getVideoData(videoUrl);
    res.json(videoData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
async function getVideoData(videoUrl) {
  try {
    const videoId = await extractVideoId(videoUrl);
    const videoSearchResult = await ytSearch(videoId);

    if (videoSearchResult && videoSearchResult.videos.length > 0) {
      const video = videoSearchResult.videos[0];

      // Check if both like_ratio and views are present and valid numbers
      if (
        video.like_ratio !== undefined &&
        video.views !== undefined &&
        !isNaN(video.like_ratio) &&
        !isNaN(video.views)
      ) {
        const likes = video.like_ratio * video.views;
        const videoData = {
          title: video.title,
          views: video.views,
          likes: likes,
        };
        await saveVideoToDatabase(videoData); // Save to database
        return videoData;
      } else {
        // If like_ratio or views are missing or not valid, save available information
        const videoData = {
          title: video.title,
          views: video.views,
          likes: null, // or any default value you want to assign
        };
        await saveVideoToDatabase(videoData); // Save to database
        return videoData;
      }
    } else {
      throw new Error("Video not found");
    }
  } catch (error) {
    console.error("Error fetching or processing video data:", error);
    throw new Error("Error fetching or processing video data");
  }
}

async function saveVideoToDatabase(videoData) {
  try {
    const savedVideo = await Video.create(videoData);
    console.log("Video saved to MongoDB:", savedVideo);
    return savedVideo;
  } catch (error) {
    console.error("Error saving video to MongoDB:", error);
    throw new Error("Error saving video to database");
  }// Handle callback request
app.post('/request-callback', (req, res) => {
  const { name, phoneNumber, preferredTime, comments } = req.body;

  // Send email notification
  sendEmailNotification({ name, phoneNumber, preferredTime, comments });

  // Send a response to the client
  res.json({ message: 'Callback request received successfully' });
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Your Gmail email address
    pass: 'your-password',       // Your Gmail password (use an "App Password" if using 2-step verification)
  },
});

// Function to send email notification
const sendEmailNotification = ({ name, phoneNumber, preferredTime, comments }) => {
  const mailOptions = {
    from: 'your-email@gmail.com',   // Sender's email address
    to: 'ravi@anchors.in',          // Recipient's email address
    subject: 'Callback Request',    // Email subject
    html: `
      <p>Name: ${name || 'Not provided'}</p>
      <p>Contact Number: ${phoneNumber}</p>
      <p>Preferred Callback Time: ${preferredTime || 'Not specified'}</p>
      <p>Comments/Questions: ${comments || 'None'}</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};
}

async function extractVideoId(url) {
  // Extract video ID from YouTube URL
  const match = url.match(
    /(?:youtube\.com\/.*(?:[\?&]v=|\/embed\/|\/shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
};

// Handle callback request
app.post('/request-callback', (req, res) => {
  const { name, phoneNumber, preferredTime, comments } = req.body;

  // Send email notification
  sendEmailNotification({ name, phoneNumber, preferredTime, comments });

  // Send a response to the client
  res.json({ message: 'Callback request received successfully' });
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Your Gmail email address
    pass: 'your-password',       // Your Gmail password (use an "App Password" if using 2-step verification)
  },
});

// Function to send email notification
const sendEmailNotification = ({ name, phoneNumber, preferredTime, comments }) => {
  const mailOptions = {
    from: 'hitsaini0050@gmail.com',   // Sender's email address
    to: 'ravi@anchors.in',          // Recipient's email address
    subject: 'Callback Request',    // Email subject
    html: `
      <p>Name: ${name || 'Not provided'}</p>
      <p>Contact Number: ${phoneNumber}</p>
      <p>Preferred Callback Time: ${preferredTime || 'Not specified'}</p>
      <p>Comments/Questions: ${comments || 'None'}</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

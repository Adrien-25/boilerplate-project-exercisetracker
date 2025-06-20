const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// =========================================================
// NEW: Body parser middleware for POST requests
// =========================================================
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // In case you send JSON bodies
// =========================================================

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// =========================================================
// NEW: In-memory data storage for users and exercises
// =========================================================
const users = [];
let nextUserId = 1; // Simple counter for unique user IDs

// Helper function to generate a unique ID
const generateId = () => {
  const id = (nextUserId++).toString();
  return id;
};

// =========================================================
// API Endpoints for Exercise Tracker
// =========================================================
// 2. POST /api/users - Create a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;

  if (!username) {
    return res.json({ error: "Username is required" });
  }

  // Check if username already exists
  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.json({ username: existingUser.username, _id: existingUser._id });
  }

  const newUser = {
    username: username,
    _id: generateId(),
    log: [], // Each user has a log array to store exercises
  };
  users.push(newUser);

  res.json({ username: newUser.username, _id: newUser._id });
});

// 4. GET /api/users - Get a list of all users
app.get("/api/users", (req, res) => {
  // Return only username and _id for each user
  const usersList = users.map((user) => ({
    username: user.username,
    _id: user._id,
  }));
  res.json(usersList);
});

// 7. POST /api/users/:_id/exercises - Add an exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Find the user by _id
  const user = users.find((u) => u._id === userId);

  if (!user) {
    return res.json({ error: "User not found" });
  }

  // Validate required fields
  if (!description || !duration) {
    return res.json({ error: "Description and duration are required" });
  }

  // Validate duration is a number
  const parsedDuration = parseInt(duration, 10);
  if (isNaN(parsedDuration)) {
    return res.json({ error: "Duration must be a number" });
  }

  // Parse and format date
  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
    // Check for invalid date (e.g., "invalid date" string)
    if (isNaN(exerciseDate.getTime())) {
      return res.json({ error: "Invalid date format. Use yyyy-mm-dd" });
    }
  } else {
    exerciseDate = new Date(); // Use current date if not provided
  }

  const newExercise = {
    description: description,
    duration: parsedDuration,
    date: exerciseDate.toDateString(), // Format date as required
  };

  user.log.push(newExercise);

  // Return the user object with the exercise fields added
  res.json({
    _id: user._id,
    username: user.username,
    date: newExercise.date,
    duration: newExercise.duration,
    description: newExercise.description,
  });
});

// 9. GET /api/users/:_id/logs - Get a user's exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = users.find((u) => u._id === userId);

  if (!user) {
    return res.json({ error: "User not found" });
  }

  let userLog = [...user.log]; // Create a copy to filter

  // Filter by 'from' date
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      userLog = userLog.filter(
        (exercise) => new Date(exercise.date) >= fromDate,
      );
    }
  }

  // Filter by 'to' date
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      userLog = userLog.filter((exercise) => new Date(exercise.date) <= toDate);
    }
  }

  // Limit results
  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      userLog = userLog.slice(0, parsedLimit);
    }
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: userLog.length,
    log: userLog,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

const express = require('express');
require('./db/mongoose.js');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();

app.use(express.json()); // For express to parse json requests

// All defined routes
app.use(userRouter);
app.use(taskRouter);

module.exports = app;

const mongoose = require('mongoose');

mongoose
   .connect(process.env.MONGODB_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
   })
   .catch('Connecting to the database has failled.');

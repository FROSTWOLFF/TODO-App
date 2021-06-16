const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const SALT_NO = 8;

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         trim: true,
         required: true,
      },
      email: {
         type: String,
         trim: true,
         lowercase: true,
         unique: true,
         required: true,
         validate(email) {
            if (!validator.isEmail(email)) throw new Error('The inputted email is not valid.');
         },
      },
      password: {
         type: String,
         trim: true,
         required: true,
         minlength: 7,

         validate(password) {
            if (password.includes('password')) {
               throw new Error("Your password cannot include 'password'");
            }
         },
      },
      age: {
         type: Number,
         maxlength: 4,
         default: 0,
      },
      tokens: [
         {
            token: {
               type: String,
               required: true,
            },
         },
      ],
      avatar: {
         type: Buffer,
      },
   },
   {
      timestamps: true,
   }
);

userSchema.virtual('tasks', {
   ref: 'Task',
   localField: '_id',
   foreignField: 'owner',
});

// Filtering responses
userSchema.methods.toJSON = function () {
   const user = this;
   const rawUser = user.toObject();

   delete rawUser.password;
   delete rawUser.tokens;
   delete rawUser.avatar;

   return rawUser;
};

// Generating Web Tokens
userSchema.methods.generateAuthToken = async function () {
   const user = this;

   const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '1h',
   });

   user.tokens = user.tokens.concat({ token });
   await user.save();

   return token;
};

// Custom modal methods
userSchema.statics.findByCredentials = async function (email, password) {
   const user = await this.findOne({ email });

   if (!user) {
      throw new Error('Unable to login');
   }

   const isMatch = await bcrypt.compare(password, user.password);

   if (!isMatch) {
      throw new Error('Wrong Password');
   }

   return user;
};

// Hashing passwords before saving modal
userSchema.pre('save', async function (next) {
   const user = this;

   if (user.isModified('password')) {
      user.password = await bcrypt.hash(user.password, SALT_NO);
   }

   next();
});

// Delete all user tasks when user is removed.
userSchema.pre('remove', async function (next) {
   const user = this;
   await Task.deleteMany({ owner: user._id });

   next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

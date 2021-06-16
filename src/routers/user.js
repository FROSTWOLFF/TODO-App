const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const Task = require('../models/task');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');

const router = new express.Router();

router.post('/users', async (req, res) => {
   const newUser = new User(req.body);

   try {
      const token = await newUser.generateAuthToken();
      await newUser.save();
      sendWelcomeEmail(newUser.name, newUser.email);

      res.status(201).send({ user: newUser, token });
   } catch (e) {
      res.status(400).send(e);
   }
});

router.post('/users/login', async (req, res) => {
   try {
      const user = await User.findByCredentials(req.body.email, req.body.password);
      const token = await user.generateAuthToken();

      res.status(200).send({ user, token });
   } catch (e) {
      res.status(400).send(e);
   }
});

router.post('/users/logout', auth, async (req, res) => {
   try {
      req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
      await req.user.save();

      res.status(200).send('Succesfully Logged Out');
   } catch (e) {
      res.status(400).send(e);
   }
});

router.post('/users/logoutAll', auth, async (req, res) => {
   try {
      req.user.tokens = [];
      await req.user.save();

      res.status(200).send('Global logout successful');
   } catch (e) {
      res.status(400).send(e);
   }
});

router.get('/users/me', auth, async (req, res) => {
   res.send(req.user);
});

router.get('/users/:id', auth, async (req, res) => {
   const _id = req.params.id;

   try {
      const user = await User.findById(_id);

      if (!user) return res.sendStatus(404);
      res.send(user);
   } catch (e) {
      res.status(500).send(e);
   }
});

router.patch('/users/me', auth, async (req, res) => {
   const updates = Object.keys(req.body);
   const allowedUpdates = ['name', 'email', 'password', 'age'];
   const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

   if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Updates !' });

   try {
      updates.forEach(update => {
         req.user[update] = req.body[update];
      });

      await req.user.save();

      res.send(req.user);
   } catch (e) {
      res.status(500).send(e);
   }
});

router.delete('/users/me', auth, async (req, res) => {
   try {
      req.user.remove();
      sendCancelEmail(req.user.name, req.user.email);

      res.send(req.user);
   } catch (e) {
      res.status(500).send(e);
   }
});

// File upload routes

// Multer file options
const upload = multer({
   limits: {
      fileSize: 1000000,
   },
   fileFilter(req, file, cb) {
      const allowedFiles = ['jpg', 'jpeg', 'png'];
      const isFileValid = allowedFiles.some(fileType => file.originalname.endsWith(fileType));

      if (!isFileValid) return cb(new Error('Invalid File Type'));

      cb(undefined, true);
   },
});

// Avatar uploads editted with sharp
router.post(
   '/users/me/avatar',
   auth,
   upload.single('avatar'),
   async (req, res) => {
      const edittedBuffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250 }).toBuffer();
      req.user.avatar = edittedBuffer;
      await req.user.save();

      res.send('Avatar upload succesful');
   },
   (error, req, res, next) => {
      res.status(400).send({ error: error.message });
   }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
   req.user.avatar = undefined;
   await req.user.save();
   res.status(200).send('Avatar Deleted');
});

// Serving avatars for client-side
router.get('/users/me/:id/avatar', async (req, res) => {
   try {
      const user = await User.findById(req.params.id);

      if (!user || !user.avatar) return res.sendStatus(404);

      res.set('Content-Type', 'image/jpg');
      res.send(user.avatar);
   } catch (error) {
      res.send(error);
   }
});

module.exports = router;

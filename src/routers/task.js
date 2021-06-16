const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
   const task = new Task({
      ...req.body,
      owner: req.user._id,
   });

   try {
      await task.save();
      res.status(201).send(task);
   } catch (e) {
      res.status(400).send(err);
   }
});

// Task response with sorting functionality
router.get('/tasks', auth, async (req, res) => {
   const match = {};
   const sort = {};

   if (req.query.sort) {
      let [sortField, sortOrder] = req.query.sort.split('_');

      sort[sortField] = sortOrder === 'asc' ? 1 : -1;
   }

   if (req.query.completed) {
      match.completed = req.query.completed === 'true';
   }

   try {
      // Solution 1
      // const tasks = await Task.find({ owner: req.user._id });

      // Solution 2
      await req.user
         .populate({
            path: 'tasks',
            match,
            options: {
               limit: parseInt(req.query.limit),
               skip: parseInt(req.query.skip),
               sort,
            },
         })
         .execPopulate();

      res.send(req.user.tasks);
   } catch (e) {
      res.status(500).send(e);
   }
});

router.get('/tasks/:id', auth, async (req, res) => {
   const _id = req.params.id;
   try {
      const task = await Task.findOne({ _id, owner: req.user._id });

      if (!task) res.sendStatus(404);

      res.send(task);
   } catch (e) {
      res.status(500).send(e);
   }
});

router.patch('/tasks/:id', auth, async (req, res) => {
   const _id = req.params.id;
   const updates = Object.keys(req.body);
   const allowedUpdates = ['description', 'completed'];
   const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

   if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Updates !' });

   try {
      const task = await Task.findOne({ _id, owner: req.user._id });

      if (!task) return res.sendStatus(404);

      updates.forEach(update => {
         task[update] = req.body[update];
      });

      await task.save();

      res.send(task);
   } catch (e) {
      res.status(500).send(e);
   }
});

router.delete('/tasks/:id', auth, async (req, res) => {
   const _id = req.params.id;
   try {
      const task = await Task.findOneAndDelete({ _id, owner: req.user._id });

      if (!task) res.sendStatus(404);

      res.send(task);
   } catch (e) {
      res.status(500).send(e);
   }
});

module.exports = router;

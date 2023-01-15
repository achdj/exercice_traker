const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { User, Exercise } = require('./models/model');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });

  newUser.save((err, user) => {
    if (err) return res.json({ error: err });
    res.json({ username: user.username, _id: user._id });
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.json({ error: err });
    res.json(users);
  });
});

app.post('/api/users/:userId/exercises', (req, res) => {
  const { userId } = req.params;
  const { description, duration, date } = req.body;

  User.findById(userId, (err, user) => {
    if (err) return res.json({ error: err });
    if (!user) return res.json({ error: 'User not found' });

    const newExercise = new Exercise({ userId, description, duration, date });
    newExercise.save((err, exercise) => {
      if (err) return res.json({ error: err });
      res.json({
        username: user.username,
        _id: user._id,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      });
    });
  });
});

app.get('/api/users/:userId/logs', (req, res) => {
  const { userId } = req.params;
  const { from, to, limit } = req.query;

  User.findById(userId,
    (err, user) => {
      if (err) return res.json({ error: err });
      if (!user) return res.json({ error: 'User not found' });
  
      Exercise.find({ userId, date: { $gte: from, $lte: to } })
        .limit(+limit)
        .exec((err, exercises) => {
          if (err) return res.json({ error: err });
          res.json({
            username: user.username,
            _id: user._id,
            count: exercises.length,
            log: exercises.map(exercise => ({
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date.toDateString()
            }))
          });
        });
    });
  });
  
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server started on port 3000');
  });
  
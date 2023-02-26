const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')
const bodyParser = require('body-parser');
//const { User, Exercise } = require('./models/model');
const userModel = require('../models/User');

const app = express();
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ optionsSuccessStatus: 200 }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


/*app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });

  newUser.save((err, user) => {
    if (err) return res.json({ error: err });
    res.json({ username: user.username, _id: user._id });
  });
});*/

app.get('/api/users', async (req, res) => {
  try {
    const users = await userModel.find({})
    res.status(200).json(users);
  } catch (err) {
    res.status(200).json({ error: err });
  }
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  User.findById(_id, (err, user) => {
    if (err) return res.json({ error: err });
    if (!user) return res.json({ error: 'User not found' });

    const newExercise = new Exercise({ _id, description, duration, date });
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

app.get('/api/users/:_id/logs', async (req, res) => {
  /*const { _id } = req.params;
  const { from, to, limit } = req.query;

  User.findById(_id,
    (err, user) => {
      if (err) return res.json({ error: err });
      if (!user) return res.json({ error: 'User not found' });
  
      Exercise.find({ _id, date: { $gte: from, $lte: to } })
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
    }
  );*/

  const id = req.params._id;
  try {
    const userLog = await userModel.findById(id).exec();

    if (req.query.from || req.query.to) {
      let fromDate = new Date(0).getTime();
      let toDate = new Date().getTime();

      if (req.query.from) {
        fromDate = new Date(req.query.from).getTime()
      }

      if (req.query.to) {
        toDate = new Date(req.query.to).getTime()
      }

      userLog.log = userLog.log.filter(exercise => {
        exerciseTimestamp = exercise.date.getTime()
        if (exerciseTimestamp >= fromDate && exerciseTimestamp<= toDate) return true;
      })
    }

    if (req.query.limit) {
      userLog.log = userLog.log.slice(0, req.query.limit)
    }

    const resultJson = {
      username: userLog.username,
      count: userLog.log.length,
      _id: userLog._id,
      log: userLog.log.map(({description, duration, date}) => {
        return {
          description,
          duration,
          date: date.toDateString()
        }
      })
    };

    res.status(200).json(resultJson);

  } catch (err) {
    res.status(200).json({ error: err });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const newUser = new userModel({ username: req.body.username, log: [] })
    // save the object in the database
    newUser.save((errSaved, userSaved) => {
      if (errSaved) {
        res.status(200).json({ err: errSaved });
      }
      const { _id, username } = userSaved;
      res.status(200).json({
        username,
        _id
      });
    })
  } catch (err) {
    res.status(200).json({ error: err });
  }
});

app.post('/api/users:_id/exercises', (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  const userIdInput = id;
  const descriptionInput = description;
  const durationInput = duration;
  const dateInput = date || new Date().toISOString();

  try {
    userModel.findOneAndUpdate(
      {
        _id: userIdInput
      },
      {
        $push: {
          log: {
            description: descriptionInput,
            duration: durationInput,
            date: dateInput
          }
        }
      },
      {
        new: true
      }
    ).then(updatedUser => {
      res.json({
        username: updatedUser.username,
        description: updatedUser.log[updatedUser.log.length - 1].description,
        duration: updatedUser.log[updatedUser.log.length - 1].duration,
        date: updatedUser.log[updatedUser.log.length - 1].date.toDateString(),
        _id: updatedUser._id
      });
    }).catch(err => {
      res.status(200).json({ error: err });
    });
  } catch (err) {
    res.status(200).json({ error: err });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { Router } = require('express')
const mongoose = require('mongoose');

const router = Router();
//db connexion
const db = process.env['MONGO_URI'];

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("Mongoose is connected")
);

const Schema = mongoose.Schema;
//user schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  log: [{
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  }]
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ optionsSuccessStatus: 200 })); 

//routes

//Get all users from the database
app.get('/api/users/', async (req, res) => {
  try {
      const users = await userModel.find({})
      res.status(200).json(users);
  } catch (err) {
      res.status(200).json({ error: err });
  }

});

//Get the user log
app.get('/api/users/:_id/logs', async (req, res) => {

  const id = req.params._id;
  try {
    const userLog = await userModel.findById(id).exec();

    if (req.query.from || req.query.to) {

      //timestamps for comparing dates
      let fromDate = new Date(0).getTime();
      let toDate = new Date().getTime();

      if (req.query.from) {
        fromDate = new Date(req.query.from).getTime();
      }

      if (req.query.to) {
        toDate = new Date(req.query.to).getTime();
      }

      userLog.log = userLog.log.filter(exercise => {
        exerciseTimestamp = exercise.date.getTime();
        if (exerciseTimestamp >= fromDate && exerciseTimestamp<= toDate) return true;
      })

    }

    if (req.query.limit) {
      userLog.log = userLog.log.slice(0, req.query.limit);
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

//Register a user
app.post('/api/users/', (req, res) => {

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

//Add an exersize to a user
router.post('/:_id/exercises', (req, res) => {
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

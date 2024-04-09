const express = require('express');
const router = express.Router();
const Workout = require('../../models/Workout');

// @route   POST api/workouts
// @desc    Add a new workout
// @access  Public
router.post('/', async (req, res) => {
  const { name, exercises } = req.body;
  try {
    workout = new Workout({
      name,
      exercises
    });
    await workout.save();
    res.send('Workout Added');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workouts/:id
// @desc    Fetch data for a workout
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    let workout = await Workout.findById(req.params.id);
    if (workout) {
      return res.json(workout);
    } else {
      return res.json({ msg: 'Workout does not exist' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workouts
// @desc    Fetch all workouts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const workouts = await Workout.find();
    res.json(workouts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/workouts/:id
// @desc    Edit a workout
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    let workoutExists = await Workout.findById(req.params.id);
    if (workoutExists) {
      await Workout.findOneAndUpdate({ _id: req.params.id }, req.body);
      res.send('Workout updated');
    } else {
      res.send('Workout not found');
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/workouts/:id
// @desc    Delete a workout
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    let workoutToDelete = await Workout.findById(req.params.id);
    if (workoutToDelete) {
      await Workout.deleteOne({ _id: req.params.id });
      res.json({ msg: 'Workout removed' });
    } else {
      res.json({ msg: 'Workout does not exist' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



module.exports = router;

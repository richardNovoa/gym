const express = require('express');
const router = express.Router();
const Exercise = require('../../models/Exercise');
const { check, validationResult } = require('express-validator');

// @route   POST api/exercises
// @desc    Add an exercise
// @access  Public
router.post(
  '/',
  [
    check('name', 'An exercise name is required').not().isEmpty(),
    check('primaryMuscles', 'A muscle group is required').not().isEmpty(),
    check('equipment', 'An equipment type is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      force,
      level,
      mechanic,
      equipment,
      primaryMuscles,
      secondaryMuscles,
      instructions,
      category
    } = req.body;

    try {
      let exercise = await Exercise.findOne({ name: name });
      if (exercise) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Exercise already exists' }] });
      }

      exercise = new Exercise({
        name,
        force,
        level,
        mechanic,
        equipment,
        primaryMuscles,
        secondaryMuscles,
        instructions,
        category
      });
      await exercise.save();
      res.send('Exercise Added');
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/exercises
// @desc    Fetch all exercises
// @access  Public
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/exercises/:id
// @desc    Delete an existing exercise
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    let exerciseToDelete = await Exercise.findById(req.params.id);
    if (exerciseToDelete) {
      await Exercise.deleteOne({ _id: req.params.id });
      res.json({ msg: 'Exercise removed' });
    } else {
      res.json({ msg: 'Exercise does not exist' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

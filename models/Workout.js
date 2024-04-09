const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  }
});

const WorkoutExerciseSchema = new mongoose.Schema({
  exercise_id: {
    type: String,
    required: true
  },
  sets: [SetSchema]
});

const WorkoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  exercises: [WorkoutExerciseSchema]
});

module.exports = Workout = mongoose.model('workouts', WorkoutSchema);

const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  force: {
    type: String
  },
  level: {
    type: String
  },
  mechanic: {
    type: String
  },
  equipment: {
    type: String,
    required: true
  },
  primaryMuscles: {
    type: Array,
    required: true
  },
  secondaryMuscles: {
    type: Array
  },
  instructions: {
    type: Array
  },
  category: {
    type: Array
  }
});

module.exports = Exercise = mongoose.model('exercises', ExerciseSchema);

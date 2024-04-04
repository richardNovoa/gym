const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  muscle: {
    type: String,
    required: true
  },
  equipment: {
    type: String,
    required: true
  }
});

module.exports = Exercise = mongoose.model('exercises', ExerciseSchema);

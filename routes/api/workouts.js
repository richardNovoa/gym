const express = require('express');
const router = express.Router();

// @route   GET api/workouts
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('Workouts route'));

module.exports = router;
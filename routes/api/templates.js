const express = require('express');
const router = express.Router();

// @route   GET api/templates
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('Templates route'));

module.exports = router;

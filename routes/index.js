var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/quiz', function (req, res, next) {
  res.render('quiz', { title: 'Express' });
});

module.exports = router;

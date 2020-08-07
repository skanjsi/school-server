const express = require('express');
const router = express.Router();
const pool = require('../utils/mysql');

/* GET users listing. */

router.get('/', async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    const data = await connection.query('SELECT * FROM USER');
    const results = data[0];
    let sum = 0;
    for (let user of results) {
      sum += user.money;
    }
    const avg = sum / results.length;
    const data2 = await connection.query('SELECT * FROM USER WHERE money > ?', [
      avg,
    ]);
    const results2 = data2[0];

    res.json({ status: 200, arr: results2 });
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = req.body.name;
    const money = req.body.money; //using body
    // const name = req.query.name;
    // const money = req.query.money; //using url(it is not secure)
    const connection = await pool.getConnection();
    await connection.query('INSERT INTO USER(name, money) VALUES(?, ?)', [
      name,
      money,
    ]);
    res.json({ status: 201, msg: 'Success!' });
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

router.get('/:id/profile', async (req, res, next) => {
  try {
    const id = req.params.id;
    const connection = await pool.getConnection();
    const [results] = await connection.query(
      'SELECT * FROM USER WHERE id = ?',
      [id]
    );
    res.json({ status: 200, arr: results });
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

module.exports = router;

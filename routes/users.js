const express = require('express');
const router = express.Router();
const pool = require('../utils/mysql');
const crypto = require('crypto'); // hash
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

    connection.release();
    res.json({ status: 200, arr: results2 });
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

//sign up api
router.post('/', async (req, res, next) => {
  try {
    const name = req.body.name;
    const money = req.body.money; //using body
    // const name = req.query.name;
    // const money = req.query.money; //using url(it is not secure)
    const email = req.body.email;
    const pwd = req.body.pwd;

    const saltByte = await crypto.randomBytes(64);
    const salt = saltByte.toString('base64'); // make random string(64)
    const hashedPwdByte = crypto.pbkdf2Sync(pwd, salt, 100000, 64, 'SHA512'); // 'SHA512' is algorithm
    const hashedPwd = hashedPwdByte.toString('base64');

    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO USER(name, money, email, hashed_pwd, salt) VALUES(?, ?, ?, ?, ?)',
      [name, money, email, hashedPwd, salt]
    );
    connection.release();
    res.json({ status: 201, msg: 'Success!' });
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

//login api
router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email;
    const pwd = req.body.pwd;

    //check email
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT * FROM USER WHERE email = ?',
      [email]
    );

    connection.release();
    if (users.length === 0) {
      return res.json({ status: 404, msg: 'not a registered email' });
    }
    const user = users[0];
    const loginHashedPwdByte = crypto.pbkdf2Sync(
      pwd,
      user.salt,
      100000,
      64,
      'SHA512'
    );
    const loginHashedPwd = loginHashedPwdByte.toString('base64');
    if (loginHashedPwd !== user.hashed_pwd) {
      return res.json({ status: 401, msg: 'password is not correct' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ status: 200, token: token });
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

router.get('/:id/profile', async (req, res, next) => {
  try {
    try {
      const token = req.headers.authorization;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = payload.id;

      const id = req.params.id;

      if (userId !== Number(id)) {
        return res.json({ status: 403, msg: 'you are not authorized' });
      }

      const connection = await pool.getConnection();
      const [
        results,
      ] = await connection.query('SELECT * FROM USER WHERE id = ?', [id]);

      connection.release();
      res.json({ status: 200, arr: results });
    } catch (err) {
      console.log(err);
      res.json({ status: 401, msg: 'incorrect token' });
    }
  } catch (err) {
    console.log(err);
    res.json({ status: 500, msg: 'Error!' });
  }
});

module.exports = router;

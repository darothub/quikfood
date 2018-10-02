import bcrypt from 'bcryptjs';
import pool from '../../model/database';


const validUser = (user) => {
  const validUsername = typeof user.username === 'string'
                                      && user.username.trim() !== '';
  const validEmail = typeof user.email === 'string'
                                      && user.email.trim() !== '';
  const validPassword = typeof user.password === 'string'
                                      && user.password.trim() !== ''
                                      && user.password.trim().length >= 6;
  return validUsername && validEmail && validPassword;
};

const signup = (req, res) => {
  const { username, email, password } = req.body;
  const tquery = {
    text: 'SELECT * FROM users WHERE email=$1',
    values: [email],
  };
  const query = {
    text: 'INSERT INTO users(username, email, pass) VALUES($1, $2, $3) RETURNING *',
    values: [username, email, bcrypt.hashSync(password, 10)],
  };
  if (!validUser(req.body)) {
    return res.status(400).send({ message: 'input correct details' });
  }
  return pool.query(tquery)
    .then((data) => {
      if (data.rowCount === 1) {
        return res.status(400).send({
          message: 'User already exist',
        });
      }
      return pool.query(query)
        .then(user => res.status(201).send({
          message: 'Created', user,
        }))
        .catch(e => res.send(e));
    })
    .catch(e => res.send(e));
};

const signin = (req, res) => {
  // const { username, email, password } = req.body;
  const selQuery = {
    text: 'SELECT * FROM users WHERE email=$1',
    values: [req.body.email],
  };
  if (!validUser(req.body)) {
    return res.status(400).send({ message: 'input correct details' });
  }
  return pool.query(selQuery)
    .then((data) => {
      if (data.rowCount === 0) {
        return res.status(404).send({ message: 'user not found' });
      }
      return (bcrypt.compare(req.body.password, data.rows[0].pass))
        .then((value) => {
          if (value) {
            return res.status(200).send({
              email: req.body.email,
              message: 'You have signed in successfully',
            });
          }
          return res.status(409).send({ message: 'invalid username/password' });
        });
    })
    .catch(e => res.send(e));
};
const user = {
  signup,
  signin,
};
export default user;

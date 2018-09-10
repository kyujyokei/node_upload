require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');

var {mongoose}  = require('./db/mongoose');
var {User} = require('./models/user');
var {Job} = require('./models/job');
var {authenticate} = require('./middleware/authenticate');

var app = express();

// for Heroku deploy, if not on Heroku then uses port 3000
const port = process.env.PORT || 3000;


app.use(bodyParser.json()); // give this json() function as a middle ware to express, so we can send json to application


/* -----------------USERS----------------- */

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password', 'f_name', 'l_name', 'phone', 'address']);
    var user = new User(body);
  
    user.save().then(() => {
      return user.generateAuthToken();
    }).then((token) => {
      res.header('x-auth', token).send(user);
    }).catch((err) => {
      res.status(400).send(err);
    });
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((err) => {
    res.status(400).send(err);
  })
});

app.patch('/users/me', authenticate, (req, res) => {
  var body = _.pick(req.body, ['oldPass, newPass']);

  // User.findByCredentials(req.user.email, body.password).then((user) => {
    User.findOneAndUpdate({_id: req.user._id}, {$set: body}, {new: true}).then((user) => {
      if (!user) {
        return res.status(404).send();
      }

      res.status(200).send({user});
    // })
  }).catch((err) => {
    return res.status(400).send();
  });
});

// logout (private route by adding authenticate)
app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
      res.status(200).send();
  }, () => {
      res.status(400).send();
  });
});



/* -----------------JOB----------------- */

app.get('/jobs', (req, res) => {
  Job.find({}).then((jobs) => {
    res.send({jobs});
  }, (err) => {
    res.status(400).send(err);
  });
});

app.get('/jobs/me', authenticate, (req, res) => {
  Job.find({
    _creator: req.user._id
  }).then((jobs) => {
    res.send({jobs});
  }, (err) => {
    res.status(400).send(err);
  });
});

app.post('/jobs', authenticate, (req, res) => {
  var body = _.pick(req.body, ['companyName', 'position', 'isCurrent', 'startedDate', 'endDate', 'exps'])
  var exp = new Job({
    _creator: req.user._id,
    companyName: body.companyName,
    position: body.position,
    isCurrent: body.isCurrent,
    startedDate: body.startedDate,
    endDate: body.endDate,
    exps: body.exps
  });
  exp.save().then(() => {
    res.send(exp);
  }, (err) => {
    res.status(400).send(err);
  });
});

app.patch('/jobs/:id', authenticate, (req, res) => {
  var id = req.params.id;

  var body = _.pick(req.body, ['companyName', 'position', 'isCurrent', 'startedDate', 'endDate', 'exps'])
  
  if (!ObjectID.isValid(id)){
    return res.status(404).send('ID not valid')
  }

  Job.findOneAndUpdate({
    _id: id
  }, {$set: body}, {new: true}).then((job) => {
    if (!job) {
      return res.status(404).send('Job not found');
    }

    res.status(200).send({job});
  }).catch((err) => {
    return res.status(400).send(err);
  });
});


app.delete('/jobs/:id', authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)){
    return res.status(404).send('ID not valid');
  }

  Job.findByIdAndRemove({_id: id}).then((job) => {
    if (!job) {
      return res.status(404).send('Job not found');
    }

    res.status(200).send({job});
  }).catch((err) => {
    res.status(400).send(err);
  });

});




/* ---------------------------------------- */




app.listen( port, () => {
    console.log(`Starting on port ${port}`);
});




module.exports = {app};
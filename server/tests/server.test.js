const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {User} = require('./../models/user');
const {Job} = require('./../models/job');
const {users, jobs, populateUsers, populateJobs} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateJobs);


/* -----------------USER----------------- */

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = 'example@example.com';
        var password = '123mnb!';

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBeTruthy();
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }

                User.findOne({email}).then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password); // make sure password got hashed
                    done();
                }).catch((err) => done(err));
            });
    });
    it('should return validation errors if request invalid', (done) => {
        request(app)
            .post('/users')
            .send({email: 'invalid email', password: 'password'})
            .expect(400)
            .end(done);
    });
    it('should not create user if email in use', (done) => {

        request(app)
            .post('/users')
            .send({email: users[0].email , password: 'password'})
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('Should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[0].email,
                password: users[0].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.toObject().tokens[1]).toMatchObject({
                        access: 'auth',
                        token: res.headers['x-auth']
                    });
                    done();
                }).catch((e) => done(e));
            });
    });

    it('Should reject invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[0].email,
                password: users[0].password + '1'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy();
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch((err) => done(err));
            });
    });
});

describe('DELETE /users/me/token', () => {
    it('Should remove aith token', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((err) => done(err));
            });
    });
});



/* -----------------JOB----------------- */

describe('GET /jobs',() => {
    it('Should get all jobs', (done) => {
        request(app)
            .get('/jobs')
            .expect(200)
            .expect((res) => {
                expect(res.body.jobs.length).toBe(2);
            })
            .end(done);
    });
    it('Shoulg get only the specific users jobs when valid authentication is provided', (done) => {
        request(app)
            .get('/jobs/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.jobs.length).toBe(1);
            })
            .end(done);
    })
});

describe('POST /jobs', () => {
    var hexId = new ObjectID().toHexString();
    it('Should create new job', (done) => {
        request(app)
            .post('/jobs')
            .set('x-auth', users[0].tokens[0].token)
            .send({
                companyName: "BUBUI",
                position: "Product Manager",
                isCurrent: false,
                startedDate: '2010-01-01',
                endDate: '2015-05-05',
                exps: [{
                    description: "Build some machines",
                },{
                    description: "Raised income to 150%",
                }]
            })
            .expect(200)
            .end((err) => {
                if (err) {
                    return done(err);
                } else {
                    done;
                }

                Job.find({}).then((jobs) => {
                    expect(jobs.length).toBe(3);
                    expect(jobs[2].companyName).toBe("BUBUI");
                    done();
                }).catch((err) => done(err));
            });
    });
    it('Should not create job without valid authentication and return 401 Unauthorized', (done) => {
        request(app)
            .post('/jobs')
            .set('x-auth', users[0].tokens[0].token + 1)
            .send(jobs[0])
            .expect(401)
            .end(done);
    });
});

describe('PATCH /jobs/:id', () => {
    it('Should update job', (done) => {
        var hexId = jobs[0]._id.toHexString();
        request(app)
            .patch(`/jobs/${hexId}`)
            .set('x-auth', users[0].tokens[0].token)
            .send({
                companyName: "APPLE",
                position: "Product Manager",
                isCurrent: false,
                startedDate: '2010-01-01',
                endDate: '2015-05-05',
                exps: [{
                    description: "Build some machines",
                },{
                    description: "Raised income to 150%",
                }]
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.job.companyName).toBe("APPLE");
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }

                Job.findById(jobs[0]._id).then((job) => {
                    expect(job.companyName).toBe("APPLE");
                    done();
                }).catch((err) => done(err));
            });
    });
});

describe('DELETE /jobs/:id', () => {
    it('Should delete job', (done) => {
        var hexId = jobs[0]._id.toHexString();
        request(app)
            .delete(`/jobs/${hexId}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.job._id).toBe(hexId);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Job.findById(hexId).then((job) => {
                    expect(job).toBeFalsy();
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });
});




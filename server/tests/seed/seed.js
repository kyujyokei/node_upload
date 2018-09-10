const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {User} = require('./../../models/user');
const {Job} = require('./../../models/job');


const UserOneId = new ObjectID();
const UserTwoId = new ObjectID();

const JobOneId = new ObjectID();

const users = [{
    // user with valid auth
    _id: UserOneId,
    email: 'bubui@example.com',
    password: 'bubuibubu',
    f_name: 'fatfat',
    l_name: 'buibui',
    phone: '1234567890',
    address: 'fatbuilane1024',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: UserOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
    
    },{
    // user without valid auth
    _id: UserTwoId,
    email: 'jen@example.com',
    password: 'bubuibubu',
    f_name: 'Jen',
    l_name: 'Jon',
    phone: '1234567890',
    address: 'f3273',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: UserOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}];



const jobs = [{
    _id: JobOneId,
    _creator: UserOneId,
    companyName: "ASUS",
    position: "Product Manager",
    isCurrent: false,
    startedDate: '2010-01-01',
    endDate: '2015-05-05',
    exps: [{
        description: "Build some machines"
    },{
        description: "Raised income to 150%"
    }]
},{
    _creator: UserTwoId,
    companyName: "ACER",
    position: "CEO",
    isCurrent: true,
    startedDate: '2015-06-06',
    exps: [{
        description: "Managed departments"
    },{
        description: "Changed department structure"
    }]
}]


const populateUsers = (done) => {
    User.remove({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();
        // Ppromise.all takes an array of promises, so this only continues after user 1 and 2 are both saved
        return Promise.all([userOne, userTwo]).then(() => done());
    });
};



const populateJobs = (done) => {
    Job.remove({}).then(() => {
        var jobOne = new Job(jobs[0]).save();
        var jobTwo = new Job(jobs[1]).save();
        return Promise.all([jobOne, jobTwo]).then(() => done());
    })
}



module.exports = {users, jobs, populateUsers, populateJobs};

var mongoose = require('mongoose');

var Job = mongoose.model('Job', {
    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    isCurrent: {
        type: Boolean,
        required: true
    },
    startedDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    exps: [{
        description: {
            type: String,
            required: true
        }
    }]
});

module.exports = {Job};
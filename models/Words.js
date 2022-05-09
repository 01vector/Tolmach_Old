const mongoose = require('mongoose');
const db = require('../index')

const word = new mongoose.Schema({
    name : String,
    english : {
        word : 'String',
        meanings : {},
        examples : [String],
        phonetics : {
            text : {
                us : [String],
                uk : [String],
                unknown : [String],
            },
            audio: {
                us : String,
                uk : String,
                unknown : String,
            },
        },
        forms : {
            second : String,
            third : String,
            ing : String,
            thirdPerson : String,
        },
    },
    russian : {
        word : 'String',
        meanings : {},
        examples : [String],
        phonetics : {
            text : {
                us : [String],
                uk : [String],
                unknown : [String],
            },
            audio: {
                us : String,
                uk : String,
                unknown : String,
            },
        },
    },
    isChecked : Boolean,
    isIrVerb : Boolean,
});

module.exports = mongoose.model('Word', word);


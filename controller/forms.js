const fs = require('fs');

const getForms = (word) => {
    console.log(word);
    const FILE_PATH = './irverbs.txt';
    let irVerbs = fs.readFileSync('/Users/a1/Desktop/TolmachEng/controller/ir_verbs.txt', 'utf-8');
    let nonContVerbs = fs.readFileSync('/Users/a1/Desktop/TolmachEng/controller/non_cont_verbs.txt', 'utf-8');

    let forms = {
        second : word + 'ed',
        third : word + 'ed',
        ing : '',
        thirdPerson : '',
        isIrVerb : '',
    };
    let vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    let thirdPerson = '';
    let ing = '';

    let lastOneChar = word.slice(word.length - 1);
    let lastTwoChars = word.slice(word.length - 2);
    let lastThreeChars = word.slice(word.length - 3);

    let chars = word.split('');
    let length = chars.length;

    const largeFirstLetter = (word) => {
        return word[0].toUpperCase() + word.slice(1);
    };

    const getIng = (word) => {
        word = largeFirstLetter(word);

        if (lastTwoChars === 'ie') {
            ing = word.slice(0, word.length - 2) + 'ying';
        } else if (lastOneChar === 'l' && vowels.includes(chars[length - 2]) && !vowels.includes(chars[length - 2])) {
            ing = word.slice(0, word.length - 1) + 'ling';
        } else if (lastOneChar === 'r' && vowels.includes(chars[length - 2]) && !vowels.includes(chars[length - 2])) {
            ing = word + 'ring';
        } else if (lastTwoChars === 'ic') {
            ing = word + 'king';
        } else if (lastOneChar === 'e' && !vowels.includes(chars[length - 2])) {
            ing = word.slice(0, word.length - 1) + 'ing';
        } else if ( !vowels.includes(lastOneChar)) {
            let count = 0;
            let index = 0;
            chars.forEach( (char, i) => {
                if ( vowels.includes(char)) {
                    index = i;
                    count += 1;
                }
            });

            // Если слогов меньше двух и перед единственной гласной стоит согласная
            if ( ( count < 2 && !vowels.includes(chars[index - 1]) && vowels.includes(chars[index - 2])) ||
                   count > 1 && ( !vowels.includes(lastOneChar) && vowels.includes(chars[length - 2]) && 
                   !vowels.includes( chars[length - 3]))) {
                ing = word + lastOneChar + 'ing'
            } else {
                ing = word + 'ing';
            }
        } else {
            ing = word + 'ing';
        }
    };

    const getThirdPerson = (word) => {
        word = largeFirstLetter(word);
        if (lastOneChar === 'y') {

            thirdPerson = vowels.includes(chars[length - 2]) ? 
                word + 's'  : word.slice(0, word.length - 1) + 'ies';

        } else if ( lastOneChar === 'x'   ||    lastOneChar === 'o'   ||    lastTwoChars === 'sh' ||    
                    lastTwoChars === 'ch' ||    lastTwoChars === 'cc' ||    lastThreeChars === 'tch' ) {
            thirdPerson = word + 'es';
        } else {
            thirdPerson = word + 's';
        };

        return;
    };

    const getSecondForm = (word) => {
        word = largeFirstLetter(word);
        if (lastOneChar === 'e' || lastTwoChars === 'ee') {
            forms.second = forms.third = word + 'd';
        } else if (lastOneChar === 'y') {

            forms.second = forms.third = vowels.includes(chars[length - 2]) ?
                word + 'ed' : word.slice(0, word.length - 1) + 'ied';
        } else if (lastOneChar === 'l') {
            forms.second = forms.third = word + 'led';
        } else if (lastTwoChars === 'ic') {
            forms.second = forms.third = word + 'ked';
        } else if ( !vowels.includes(lastOneChar) && vowels.includes(chars[length - 2])) {
            let count = 0;

            chars.forEach(char => {
                if ( vowels.includes(char)) {
                    count += 1;
                }; 
            });

            // Если один слог
            forms.second = forms.third = count > 1 ?
                word + 'ed' : word + lastOneChar + 'ed'; 

        } else {
            forms.second = forms.third = word + 'ed';
        };
    };

    // -ing форма
    if ( nonContVerbs.indexOf(word.toLowerCase() + 1)) {
        forms.ing = 'Continious form don`t exist';
    } else {
        getIng(word);
        forms.ing = ing;
    }

    // Third person form
    getThirdPerson(word);
    forms.thirdPerson = thirdPerson;
    
    // Если глагол неправильный
    if (irVerbs.indexOf(word) + 1) {

        // Is iregular verb
        forms.isIrVerb = true;

        // Second form
        forms.second = word + ' (требуется редактирование)';

        // Third form
        forms.third = word + ' (требуется редактирование)';
        
    // Если глагол правильный
    } else {
        console.log('ПРАВИЛЬНЫЙ');
        forms.isIrVerb = true;  
        // Second and third form
        getSecondForm(word);
    }

    return forms;
};

module.exports.getForms = getForms;
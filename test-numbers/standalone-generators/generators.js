/**
 * Number Generators Library
 * A collection of generators and validators for various number formats
 * Easily expandable - just add new generator objects to the generators map
 */

// Utility Functions
const validateElfProef = (input, weights) => {
    if (typeof input === 'number') {
        input = input.toString();
    }
    if (input.length !== weights.length) {
        return false;
    }

    const numbers = input.split('');
    const sum = numbers
        .map((value, index) => {
            const number = parseInt(value, 10);
            const weight = weights[index];
            return number * weight;
        })
        .reduce((a, b) => a + b);

    return sum > 0 && sum % 11 === 0;
};

const generateElfProef = (weights) => {
    const length = weights.length;
    let success = false;
    let value = null;
    
    while (!success) {
        value = Math.random().toString().slice(2, 2 + length);
        success = validateElfProef(value, weights);
    }
    
    return value;
};

// Generator Definitions
const generators = {
    bsn: {
        name: 'BSN',
        weights: [9, 8, 7, 6, 5, 4, 3, 2, -1],
        generate: function() {
            return generateElfProef(this.weights);
        },
        validate: function(value) {
            return validateElfProef(value, this.weights);
        }
    },
    // Template for adding new generators:
    // 
    // newgenerator: {
    //     name: 'Generator Name',
    //     weights: [/* weights array */],
    //     generate: function() {
    //         // Your generation logic
    //     },
    //     validate: function(value) {
    //         // Your validation logic
    //     }
    // }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generators, validateElfProef, generateElfProef };
}

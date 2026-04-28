# Standalone Number Generators

A lightweight, easily expandable HTML/CSS/JavaScript framework for generating and validating various number formats without React or npm dependencies.

## Features

- ✨ No dependencies - pure HTML, CSS, and JavaScript
- 🎨 Modern, responsive design with smooth animations
- 📦 Easily expandable architecture
- 🔧 Simple modular generator system
- 📱 Mobile-friendly interface

## Project Structure

```
standalone-generators/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── generators.js   # Generator definitions and utilities
├── app.js          # UI interaction logic
└── README.md       # This file
```

## How to Use

1. Simply open `index.html` in any web browser
2. Use the interface to generate and validate numbers

## Current Generators

### BSN (Burgerservicenummer)
Dutch citizen identification number validator and generator using the Elfproef checksum algorithm.

- **Length**: 9 digits
- **Weights**: [9, 8, 7, 6, 5, 4, 3, 2, -1]
- **Validation**: Sum of (digit × weight) must be > 0 and divisible by 11

## How to Add New Generators

### Step 1: Define the Generator in `generators.js`

Add a new entry to the `generators` object:

```javascript
const generators = {
    bsn: { /* existing */ },
    
    // Your new generator
    mynumber: {
        name: 'My Number',
        weights: [/* your weights */],
        generate: function() {
            // Your generation logic
            return generatedValue;
        },
        validate: function(value) {
            // Your validation logic
            return isValid; // boolean
        }
    }
};
```

### Step 2: Add UI in `index.html`

Add a new section in the `<main>` element:

```html
<section class="generator-section">
    <div class="generator-card">
        <h2>My Number Generator</h2>
        <p class="description">Description of what this generates</p>
        
        <div class="generator-controls">
            <button id="generateMyNumber" class="btn btn-primary">Generate</button>
            <button id="clearMyNumber" class="btn btn-secondary">Clear</button>
        </div>

        <div class="result-section">
            <label for="myNumberOutput">Generated Number:</label>
            <input type="text" id="myNumberOutput" class="result-input" readonly>
        </div>

        <div class="validator-section">
            <label for="myNumberInput">Validate Number:</label>
            <div class="input-group">
                <input type="text" id="myNumberInput" class="input-field" placeholder="Enter number to validate">
                <button id="validateMyNumber" class="btn btn-tertiary">Validate</button>
            </div>
            <div id="myNumberValidationResult" class="validation-result"></div>
        </div>
    </div>
</section>
```

### Step 3: Add Interactions in `app.js`

Create an initialization function:

```javascript
function initializeMyNumberGenerator() {
    const generateBtn = document.getElementById('generateMyNumber');
    const validateBtn = document.getElementById('validateMyNumber');
    const output = document.getElementById('myNumberOutput');
    const input = document.getElementById('myNumberInput');
    const validationResult = document.getElementById('myNumberValidationResult');

    generateBtn.addEventListener('click', () => {
        const number = generators.mynumber.generate();
        output.value = number;
        output.select();
    });

    validateBtn.addEventListener('click', () => {
        const value = input.value.trim();
        const isValid = generators.mynumber.validate(value);
        
        if (isValid) {
            showValidationResult('✓ Valid!', 'valid');
        } else {
            showValidationResult('✗ Invalid!', 'invalid');
        }
    });
}
```

### Step 4: Call Your Initialization

Add to `DOMContentLoaded`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    initializeBsnGenerator();
    initializeMyNumberGenerator();  // Add this line
});
```

## Styling Reference

The framework uses CSS custom property patterns for easy theme customization:

- **Primary color**: `#667eea` (purple-blue)
- **Secondary color**: `#764ba2` (purple)
- **Success green**: `#d4edda`
- **Error red**: `#f8d7da`

Modify the colors in `styles.css` to customize the appearance.

## Browser Support

Works in all modern browsers that support:
- ES6 JavaScript
- CSS Flexbox and Grid
- CSS Transitions and Animations

## License

Free to use and modify for any purpose.

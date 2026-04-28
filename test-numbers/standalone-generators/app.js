/**
 * Main Application Logic
 * Handles UI interactions for all generators
 */

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeBsnGenerator();
});

/**
 * BSN Generator Initialization
 */
function initializeBsnGenerator() {
    const generateBtn = document.getElementById('generateBsn');
    const clearBtn = document.getElementById('clearBsn');
    const validateBtn = document.getElementById('validateBsn');
    const bsnOutput = document.getElementById('bsnOutput');
    const bsnInput = document.getElementById('bsnInput');
    const validationResult = document.getElementById('bsnValidationResult');

    // Generate BSN
    generateBtn.addEventListener('click', () => {
        const bsn = generators.bsn.generate();
        bsnOutput.value = bsn;
        bsnOutput.select();
    });

    // Clear all
    clearBtn.addEventListener('click', () => {
        bsnOutput.value = '';
        bsnInput.value = '';
        validationResult.classList.remove('show', 'valid', 'invalid');
        validationResult.textContent = '';
    });

    // Validate BSN
    validateBtn.addEventListener('click', () => {
        const value = bsnInput.value.trim();
        
        if (!value) {
            showValidationResult('Please enter a BSN to validate', 'invalid');
            return;
        }

        const isValid = generators.bsn.validate(value);
        
        if (isValid) {
            showValidationResult(`✓ Valid BSN: ${value}`, 'valid');
        } else {
            showValidationResult(`✗ Invalid BSN: ${value}`, 'invalid');
        }
    });

    // Allow Enter key to trigger validation
    bsnInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateBtn.click();
        }
    });

    // Helper function to show validation result
    function showValidationResult(message, status) {
        validationResult.textContent = message;
        validationResult.classList.add('show', status);
        
        // Remove the status class after 5 seconds if it's valid (auto-clear)
        if (status === 'valid') {
            setTimeout(() => {
                validationResult.classList.remove('show', status);
            }, 5000);
        }
    }
}

/**
 * Template for adding new generator UI interactions:
 * 
 * function initializeNewGenerator() {
 *     const generateBtn = document.getElementById('generateNew');
 *     const validateBtn = document.getElementById('validateNew');
 *     const output = document.getElementById('newOutput');
 *     const input = document.getElementById('newInput');
 *     
 *     generateBtn.addEventListener('click', () => {
 *         const result = generators.newgenerator.generate();
 *         output.value = result;
 *     });
 *     
 *     validateBtn.addEventListener('click', () => {
 *         const value = input.value.trim();
 *         const isValid = generators.newgenerator.validate(value);
 *         // Handle result
 *     });
 * }
 */

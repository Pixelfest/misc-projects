document.addEventListener('DOMContentLoaded', () => {
    const bingoItemsTextarea = document.getElementById('bingoItems');
    const generateBtn = document.getElementById('generateBtn');
    const bingoGrid = document.getElementById('bingoGrid');
    let bingoMessage = null;

    generateBtn.addEventListener('click', generateBingoCard);

    function generateBingoCard() {
        // Clear previous grid and message
        bingoGrid.innerHTML = '';
        if (bingoMessage) {
            bingoMessage.remove();
            bingoMessage = null;
        }

        // Get items from textarea and filter out empty lines
        const items = bingoItemsTextarea.value
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);

        if (items.length < 25) {
            alert('Please enter at least 25 items for the bingo card.');
            return;
        }

        // Shuffle items
        const shuffledItems = [...items].sort(() => Math.random() - 0.5);

        // Create 5x5 grid
        for (let i = 0; i < 5; i++) {
            const row = document.createElement('tr');
            
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('td');
                const item = shuffledItems[i * 5 + j];
                cell.textContent = item;
                
                // Add click event listener
                cell.addEventListener('click', () => {
                    cell.classList.toggle('clicked');
                    checkBingo();
                });
                
                row.appendChild(cell);
            }
            
            bingoGrid.appendChild(row);
        }

        // Create BINGO message element
        bingoMessage = document.createElement('div');
        bingoMessage.className = 'bingo-message';
        bingoMessage.textContent = 'BINGO!';
        document.querySelector('.bingo-card').appendChild(bingoMessage);
    }

    function checkBingo() {
        const rows = bingoGrid.getElementsByTagName('tr');
        let hasBingo = false;

        // Check rows
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            const isRowComplete = Array.from(cells).every(cell => cell.classList.contains('clicked'));
            
            if (isRowComplete) {
                Array.from(cells).forEach(cell => cell.classList.add('blink'));
                hasBingo = true;
            }
        }

        // Check columns
        for (let i = 0; i < 5; i++) {
            const columnCells = Array.from(rows).map(row => row.getElementsByTagName('td')[i]);
            const isColumnComplete = columnCells.every(cell => cell.classList.contains('clicked'));
            
            if (isColumnComplete) {
                columnCells.forEach(cell => cell.classList.add('blink'));
                hasBingo = true;
            }
        }

        // Show/hide BINGO message
        if (bingoMessage) {
            bingoMessage.style.display = hasBingo ? 'block' : 'none';
        }
    }

    function adjustFontSize(cell) {
        const text = cell.textContent;
        const maxWidth = cell.clientWidth - 20; // Account for padding
        const maxHeight = cell.clientHeight - 20;
        
        // Create a temporary div to measure text
        const measureDiv = document.createElement('div');
        measureDiv.style.position = 'absolute';
        measureDiv.style.visibility = 'hidden';
        measureDiv.style.whiteSpace = 'pre-wrap';
        measureDiv.style.wordWrap = 'break-word';
        measureDiv.style.width = `${maxWidth}px`;
        measureDiv.style.padding = '10px';
        document.body.appendChild(measureDiv);

        // Find the maximum font size that fits
        let fontSize = 8;
        let maxFittingSize = 8;
        
        // Try increasing font size until it no longer fits
        while (fontSize <= 40) {
            measureDiv.style.fontSize = `${fontSize}px`;
            measureDiv.textContent = text;
            
            const height = measureDiv.offsetHeight;
            
            if (height <= maxHeight) {
                maxFittingSize = fontSize;
                fontSize += 2;
            } else {
                break;
            }
        }

        // Clean up
        document.body.removeChild(measureDiv);

        // Apply the found font size and styles
        cell.style.fontSize = `${maxFittingSize}px`;
        cell.style.whiteSpace = 'pre-wrap';
        cell.style.wordWrap = 'break-word';
        cell.style.overflow = 'hidden';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.style.width = '20%'; // Ensure each cell takes up 20% of the table width
    }
}); 
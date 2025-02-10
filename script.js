const plants = ['Corn', 'Lettuce', 'Eggplant', 'Tomato', 'Potato'];
let currentRound = 1;
let remainingSeeds = 3;
let board = Array(9).fill(null);
let rules = [];
let plantsInRoundRules = [];
let undoStack = [];
const MAX_UNDO_STACK_SIZE = 50;

function initializeBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    // Add column labels (A, B, C)
    const columnLabels = document.createElement('div');
    columnLabels.className = 'column-labels';
    for (let i = 0; i < 3; i++) {
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = String.fromCharCode(65 + i);
        columnLabels.appendChild(label);
    }
    gameBoard.appendChild(columnLabels);

    // Add row labels and cells
    for (let row = 0; row < 3; row++) {
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = row + 1;
        gameBoard.appendChild(rowLabel);

        for (let col = 0; col < 3; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${row * 3 + col}`;
            gameBoard.appendChild(cell);
        }
    }

    board = Array(9).fill(null);
}


function hasConflict(newRule, existingRules) {
    return existingRules.some(rule => {
        const samePair = (newRule.plant1 === rule.plant1 && newRule.plant2 === rule.plant2) ||
                         (newRule.plant1 === rule.plant2 && newRule.plant2 === rule.plant1);
        return samePair && newRule.mustBeAdjacent !== rule.mustBeAdjacent;
    });
}

function generateRules() {
    rules = [];
    plantsInRoundRules = [];
    const numRules = Math.min(currentRound, 3);
    const maxAttempts = 100;

    for (let i = 0; i < numRules; i++) {
        let plant1, plant2, mustBeAdjacent;
        let attempts = 0;
        let valid = false;

        do {
            plant1 = plants[Math.floor(Math.random() * plants.length)];
            plant2 = plants[Math.floor(Math.random() * plants.length)];
            mustBeAdjacent = Math.random() < 0.5;
            attempts++;

            // Check for validity
            const tempRule = { plant1, plant2, mustBeAdjacent };
            valid = plant1 !== plant2 && 
                   !hasConflict(tempRule, rules) && 
                   plantsInRoundRules.filter(p => ![plant1, plant2].includes(p)).length <= remainingSeeds - 2;

        } while (!valid && attempts < maxAttempts);

        if (!valid) {
            // Fallback to simpler rule if stuck
            plant1 = plants[Math.floor(Math.random() * plants.length)];
            plant2 = plants.filter(p => p !== plant1)[Math.floor(Math.random() * (plants.length - 1))];
            mustBeAdjacent = true;
        }

        rules.push({ plant1, plant2, mustBeAdjacent });
        if (!plantsInRoundRules.includes(plant1)) plantsInRoundRules.push(plant1);
        if (!plantsInRoundRules.includes(plant2)) plantsInRoundRules.push(plant2);
    }
}

function printToTerminal(text, className = '') {
    const output = document.getElementById('output');
    const newLine = document.createElement('div');
    // Use innerHTML for blank lines to preserve formatting
    newLine.innerHTML = text === ' ' ? '&nbsp;' : text;
    if (className) {
        newLine.classList.add(className);
    }
    output.appendChild(newLine);
    output.scrollTop = output.scrollHeight;
    // Keep terminal to reasonable size
    while (output.childElementCount > 200) {
        output.removeChild(output.firstChild);
    }
}

function coordToIndex(coord) {
    const colChar = coord[0].toLowerCase();
    const row = parseInt(coord[1]) - 1;
    const col = colChar.charCodeAt(0) - 97;
    
    // Validate that row and col are within bounds (0 to 2 for a 3x3 grid)
    if (row < 0 || row > 2 || col < 0 || col > 2) {
        return -1;
    }
    return row * 3 + col;
}

function areAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / 3);
    const col1 = index1 % 3;
    const row2 = Math.floor(index2 / 3);
    const col2 = index2 % 3;
    return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
}

function clearTerminal() {
    document.getElementById('output').innerHTML = '';
}

// Updated JavaScript
function createRainParticle() {
    const particle = document.createElement('div');
    particle.className = 'rain-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${1 + Math.random() * 0.5}s`;
    particle.style.height = `${30 + Math.random() * 30}px`;
    return particle;
}

function startRain() {
    return new Promise(resolve => {
        const container = document.createElement('div');
        container.className = 'rain-container';
        document.body.appendChild(container);

        // Create dark overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(36, 36, 36, 0)';
        overlay.style.zIndex = '9998';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);

        let intensity = 5;
        const particles = [];
        
        // Build-up phase with darkening
        const buildUp = setInterval(() => {
            // Add rain particles
            for (let i = 0; i < intensity; i++) {
                const p = createRainParticle();
                container.appendChild(p);
                particles.push(p);
            }
            intensity = Math.min(intensity + 2, 35);
            
            // Gradually darken overlay
            const currentOpacity = parseFloat(overlay.style.backgroundColor.split(',')[3]) || 0;
            overlay.style.backgroundColor = `rgba(36, 36, 36, ${Math.min(currentOpacity + 0.02, 0.95)})`;
        }, 50);

        // Fade-out phase
        setTimeout(() => {
            clearInterval(buildUp);
            particles.forEach(p => p.style.opacity = 0);
            container.style.opacity = 0;
            overlay.style.opacity = 0;
        }, 3500);

        // Cleanup
        setTimeout(() => {
            container.remove();
            overlay.remove();
            resolve();
        }, 4000);
    });
}

function checkRules() {
    // Ensure every required plant is present.
    for (let requiredPlant of plantsInRoundRules) {
        if (!board.includes(requiredPlant)) {
            printToTerminal(`You must plant at least one ${requiredPlant}!`);
            return false;
        }
    }
    
    // For each rule, ensure every instance obeys it.
    for (const rule of rules) {
        const plant1Positions = board.reduce((acc, plant, index) => {
            if (plant === rule.plant1) acc.push(index);
            return acc;
        }, []);
        const plant2Positions = board.reduce((acc, plant, index) => {
            if (plant === rule.plant2) acc.push(index);
            return acc;
        }, []);
        
        if (rule.mustBeAdjacent) {
            for (const pos1 of plant1Positions) {
                let found = false;
                for (const pos2 of plant2Positions) {
                    if (areAdjacent(pos1, pos2)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    printToTerminal(`Round failed: Every <span class="plant">${rule.plant1}</span> must be adjacent to a <span class="plant">${rule.plant2}</span>.`, 'error');
                    return false;
                }
            }
            for (const pos2 of plant2Positions) {
                let found = false;
                for (const pos1 of plant1Positions) {
                    if (areAdjacent(pos2, pos1)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    printToTerminal(`Round failed: Every <span class="plant">${rule.plant2}</span> must be adjacent to a <span class="plant">${rule.plant1}</span>.`, 'error');
                    return false;
                }
            }
        } else {
            for (const pos1 of plant1Positions) {
                for (const pos2 of plant2Positions) {
                    if (areAdjacent(pos1, pos2)) {
                        printToTerminal(`Round failed: <span class="plant">${rule.plant1}</span> cannot be adjacent to <span class="plant">${rule.plant2}</span>.`, 'error');
                        return false;
                    }
                }
            }
        }
    }
    return true;
}


function preserveRules() {
    return {
        savedRules: [...rules],
        savedPlants: [...plantsInRoundRules]
    };
} 

// Modified startRound function
function startRound(newRound = true) {
    undoStack = [];
    initializeBoard();
    remainingSeeds = Math.min(currentRound + 2, 8);
    
    if (newRound) {
        generateRules();
    }

    if (currentRound !== 1) {
        clearTerminal();
    }
    
    printToTerminal(`=== Round ${currentRound} ===`);
    printToTerminal(`Seeds to plant: ${remainingSeeds}`);
    printToTerminal(`Seed types required (${plantsInRoundRules.length}): ${plantsInRoundRules.join(', ')}`);
    printToTerminal('Rules:');
    displayRules();
    
    if (currentRound === 1) {
        const examplePlant = plantsInRoundRules[0].toLowerCase();
        printToTerminal(`Example: ${examplePlant} A1`);
        // Scroll to top after initial messages for Round 1
        setTimeout(() => {
            const output = document.getElementById('output');
            output.scrollTop = 0;
        }, 0);
    }
}

function displayRules() {
    rules.forEach(rule => {
        const adjText = rule.mustBeAdjacent ? 'must be' : 'cannot be';
        printToTerminal(
            `<span class="plant">${rule.plant1}</span> ` +
            `<span class="${rule.mustBeAdjacent ? 'success' : 'error'}">${adjText}</span> ` +
            `adjacent to <span class="plant">${rule.plant2}</span>`
        );
    });
}

function showHelp() {
    printToTerminal('Commands:');
    printToTerminal('- plant <type> <coord> (e.g., "plant potato A1")');
    printToTerminal('- submit     Verify garden');
    printToTerminal('- rules      Show current rules');
    printToTerminal('- undo       Undo last action');
    printToTerminal('- restart    Restart current round');
    printToTerminal('- clear      Clean terminal');
    printToTerminal('- help       Show this message');
    printToTerminal('Allowed plants: ' + plantsInRoundRules.join(', '));
    printToTerminal('Coordinates: A1-C3');
}

function undoLastAction() {
    if (undoStack.length > 0) {
        const prevState = undoStack.pop();
        board = prevState.board;
        remainingSeeds = prevState.seeds;
        
        // Update board display
        board.forEach((plant, index) => {
            const cell = document.getElementById(`cell-${index}`);
            cell.textContent = plant ? plant[0] : '';
        });
        printToTerminal('Undo successful');
    } else {
        printToTerminal('Nothing to undo');
    }
}

document.getElementById('command-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const rawInput = this.value.trim();
        const command = rawInput.toLowerCase();
        printToTerminal(`> ${rawInput}`);
        this.value = '';

        if (command === 'help') {
            showHelp();
            return;
        }

        if (command === 'rules') {
            printToTerminal('Current Rules:');
            displayRules();
            return;
        }

        
        if (command === 'submit') {
            if (remainingSeeds > 0) {
                printToTerminal('Plant all seeds first! Type "submit" when done.');
            } else if (checkRules()) {
                printToTerminal('Success! Advancing...', 'success');
                
                // Start rain transition with darkening effect
                startRain().then(() => {
                    currentRound++;
                    startRound();
                });
            } else {
                currentRound = currentRound > 6 ? 7 : 1;
                printToTerminal(currentRound > 6 
                    ? 'Failed! Continuing from round 7...' 
                    : 'Failed! Restarting from round 1...', 'error');
                printToTerminal('');
                setTimeout(startRound, 1500);
            }
            return;
        }

        if (command === 'clear') {
            clearTerminal();
            return;
        }

        if (command === 'undo') {
            undoLastAction();
            return;
        }

        if (command === 'restart') {
            clearTerminal();
            const preserved = preserveRules();
            printToTerminal(`Restarting round ${currentRound}...`);
            startRound(false);
            rules = preserved.savedRules;
            plantsInRoundRules = preserved.savedPlants;
            return;
        }

        const match = command.match(/(?:plant )?(\w+) ([a-z]\d)/i);  // More permissive regex
        if (match) {
            // Normalize plant name and validate
            const inputPlant = match[1].trim();
            const plant = plants.find(p => p.toLowerCase() === inputPlant.toLowerCase());
            if (!plant) {
                printToTerminal(`Invalid plant name! Allowed: <span class="plant">${plantsInRoundRules.join('</span>, <span class="plant">')}</span>`, 'warning');
                return;
            }
            const coord = match[2].toUpperCase();
            const index = coordToIndex(coord.toLowerCase());

            // First check if coordinate is valid
            if (index === -1 || !/^[a-cA-C][1-3]$/.test(coord)) {
                printToTerminal(`Invalid coordinate <span class="coord">${coord}</span>! Must be letter (A-C) followed by number (1-3)`, 'warning');
                return;
            }

            if (!plantsInRoundRules.includes(plant)) {
                printToTerminal(`Invalid plant for this round! Allowed: <span class="plant">${plantsInRoundRules.join('</span>, <span class="plant">')}</span>`, 'warning');
                return;
            }

            if (board[index]) {
                printToTerminal(`<span class="coord">${coord}</span> already occupied!`, 'warning');
                return;
            }

            if (remainingSeeds <= 0) {
                printToTerminal('No seeds left! Type <span class="command">submit</span>', 'warning');
                return;
            }

            // Add new state and trim stack if needed
            undoStack.push({
                board: [...board],
                seeds: remainingSeeds
            });
            if (undoStack.length > MAX_UNDO_STACK_SIZE) {
                undoStack.shift(); // Remove oldest entry
            }

            board[index] = plant;
            document.getElementById(`cell-${index}`).textContent = plant[0];
            remainingSeeds--;
            printToTerminal(`Planted <span class="plant">${plant}</span> at <span class="coord">${coord}</span> (<span class="info">${remainingSeeds}</span> left)`, 'success');
        } else {
            printToTerminal('Invalid command! Type "help"');
        }
    }
});

window.onload = function() {
    printToTerminal('<span class="system">Welcome to Verdant!</span>');
    printToTerminal('Sow seeds according to the rules each round');
    printToTerminal('&nbsp;');  // Use &nbsp; for blank lines
    printToTerminal('------------------------');
    printToTerminal('<span class="info">=== How to Play ===</span>');
    printToTerminal('1. The game board is a 3x3 grid (<span class="coord">A1-C3</span>)');
    printToTerminal('2. You must sow different types of seeds on the grid');
    printToTerminal('3. Each round has specific rules about which seeds must or must not be touching (including diagonally)');
    printToTerminal('4. You will have a limited number of seeds to sow each round');
    printToTerminal('5. After sowing, type <span class="command">submit</span> to verify your garden');
    printToTerminal('6. If you succeed, you move to the next round. If you fail, you start over');
    printToTerminal('7. You must use all seed types at least once, but you can use any amount besides that');
    printToTerminal('9. To play the game, type text commands in the box below.');
    printToTerminal('------------------------');
    printToTerminal('&nbsp;');  // Use &nbsp; for blank lines
    printToTerminal('Commands: <span class="command">submit</span>, <span class="command">rules</span>, <span class="command">undo</span>, <span class="command">restart</span>');
    printToTerminal('Type <span class="command">help</span> for details');
    printToTerminal('&nbsp;');

    startRound();
};

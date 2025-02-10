const plants = ['Corn', 'Lettuce', 'Eggplant', 'Tomato', 'Potato'];
let currentRound = 1;
let remainingSeeds = 3;
let board = Array(9).fill(null);
let rules = [];
let plantsInRoundRules = [];

function initializeBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    // Add column labels (A, B, C)
    const columnLabels = document.createElement('div');
    columnLabels.className = 'column-labels';
    for (let i = 0; i < 3; i++) {
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = String.fromCharCode(65 + i); // A, B, C
        columnLabels.appendChild(label);
    }
    gameBoard.appendChild(columnLabels);

    // Add row labels and cells
    for (let row = 0; row < 3; row++) {
        // Add row label (1, 2, 3)
        const rowLabel = document.createElement('div');
        rowLabel.className = 'row-label';
        rowLabel.textContent = row + 1;
        gameBoard.appendChild(rowLabel);

        // Add cells for the row
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

function printToTerminal(text) {
    const output = document.getElementById('output');
    output.innerHTML += text + '<br>';
    output.scrollTop = output.scrollHeight;
}

function coordToIndex(coord) {
    const col = coord.toLowerCase().charCodeAt(0) - 97;
    const row = parseInt(coord[1]) - 1;
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
        // For every instance of plant1, ensure there is at least one adjacent plant2.
        for (const pos1 of plant1Positions) {
          let found = false;
          for (const pos2 of plant2Positions) {
            if (areAdjacent(pos1, pos2)) {
              found = true;
              break;
            }
          }
          if (!found) {
            printToTerminal(`Rule failed: Every ${rule.plant1} must be adjacent to a ${rule.plant2}.`);
            return false;
          }
        }
        // And for every instance of plant2, ensure there is at least one adjacent plant1.
        for (const pos2 of plant2Positions) {
          let found = false;
          for (const pos1 of plant1Positions) {
            if (areAdjacent(pos2, pos1)) {
              found = true;
              break;
            }
          }
          if (!found) {
            printToTerminal(`Rule failed: Every ${rule.plant2} must be adjacent to a ${rule.plant1}.`);
            return false;
          }
        }
      } else {
        // For a "cannot be adjacent" rule, no instance of plant1 may be adjacent to any plant2.
        for (const pos1 of plant1Positions) {
          for (const pos2 of plant2Positions) {
            if (areAdjacent(pos1, pos2)) {
              printToTerminal(`Rule failed: ${rule.plant1} cannot be adjacent to ${rule.plant2}.`);
              return false;
            }
          }
        }
      }
    }
    return true;
}

  

function startRound() {
    initializeBoard();
    remainingSeeds = Math.min(currentRound + 2, 8); // Cap at 8 seeds

    if (currentRound !== 1) {
        clearTerminal();
    }

    generateRules();
    printToTerminal(`=== Round ${currentRound} ===`);
    printToTerminal(`You have ${remainingSeeds} seeds to plant.`);
    printToTerminal('Rules:');
    displayRules();
}

function displayRules() {
    rules.forEach(rule => {
        printToTerminal(`${rule.plant1} ${rule.mustBeAdjacent ? 'must be' : 'cannot be'} adjacent to ${rule.plant2}`);
    });
}

function showHelp() {
    printToTerminal('Available commands:');
    printToTerminal('- plant <type> <coordinate> (e.g., "plant potato a1")');
    printToTerminal('- check (verify your garden)');
    printToTerminal('- rules (re-iterate the rules)');
    printToTerminal('- clear (clears the terminal)');
    printToTerminal('- help (show this message)');
    printToTerminal('You can only plant plants involved in the current round\'s rules.');
    printToTerminal('Allowed plants: ' + plantsInRoundRules.join(', '));
    printToTerminal('Coordinates: A1-C3');
}

document.getElementById('command-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const command = this.value.trim().toLowerCase();
        printToTerminal(`> ${this.value.trim()}`);
        this.value = '';

        if (command === 'help') {
            showHelp();
            return;
        }

        if (command === 'rules') {
            printToTerminal('Current Round Rules:');
            displayRules();
            return;
        }

        if (command === 'check') {
            if (remainingSeeds > 0) {
                printToTerminal('You must plant all seeds before checking!');
            } else if (checkRules()) {
                currentRound++;
                printToTerminal('Success! Moving to next round...');
                setTimeout(startRound, 1500);
            } else {
                // Reset to round 1 but keep progression after round 6
                currentRound = currentRound > 6 ? 7 : 1;
                printToTerminal(currentRound > 6 
                    ? 'Failed! Continuing from round 7...' 
                    : 'Failed! Starting over from round 1...');
                setTimeout(startRound, 1500);
            }
            return;
        }

        if (command === 'clear') {
            clearTerminal();
            return;
        }

        const match = command.match(/plant (\w+) ([a-c][1-3])/i);
        if (match) {
            const plant = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            const coord = match[2];
            const index = coordToIndex(coord);

            if (!plantsInRoundRules.includes(plant)) {
                printToTerminal(`You can only plant plants involved in the current round's rules!`);
                printToTerminal(`Allowed plants: ${plantsInRoundRules.join(', ')}`);
                return;
            }

            if (!plants.includes(plant)) {
                printToTerminal('Invalid plant type!');
                return;
            }

            if (index < 0 || index >= 9) {
                printToTerminal('Invalid coordinates!');
                return;
            }

            if (board[index]) {
                printToTerminal('This spot is already occupied!');
                return;
            }

            if (remainingSeeds <= 0) {
                printToTerminal('No more seeds left! Type "check" to verify your garden.');
                return;
            }

            board[index] = plant;
            document.getElementById(`cell-${index}`).textContent = plant[0];
            remainingSeeds--;
            printToTerminal(`Planted ${plant} at ${coord}. ${remainingSeeds} seeds remaining.`);
        } else {
            printToTerminal('Invalid command! Use format: plant <type> <coordinate> (e.g., "plant Corn A1") or type "help"');
        }
    }
});

window.onload = function() {
    printToTerminal('welcome to verdant.exe');
    printToTerminal('                       ');
    printToTerminal('=== How to Play ===');
    printToTerminal('1. The game board is a 3x3 grid (A1-C3).');
    printToTerminal('2. You must plant different types of plants on the grid.');
    printToTerminal('3. Each round has specific rules about which plants must or must not be touching (including diagonally).');
    printToTerminal('4. You will have a limited number of seeds to plant each round.');
    printToTerminal('5. After planting, type "check" to see if you followed the rules.');
    printToTerminal('6. If you succeed, you move to the next round. If you fail, you start over.');
    printToTerminal('7. You must use all plant types atleast once.');
    printToTerminal('8. To play the game, type text commands in the box below.');
    printToTerminal('                       ');
    printToTerminal('Type "help" for a list of commands.');
    printToTerminal('                       ');
    startRound();
};

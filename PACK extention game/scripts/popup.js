

document.addEventListener("DOMContentLoaded", function () {
    const screen = document.getElementById("popup-container");

    // Function to load the title screen
    function loadTitleScreen() {
        document.body.style.backgroundColor = "#3a4b52"; // Title screen background

        screen.innerHTML = `
            <div id="background-container"></div>
            <div class="start-container">
                <img id="title" src="/assets/title.png" alt="PACK Game">
            </div>
        `;

        // Add event listener to make the "PACK" image clickable
        document.getElementById("title").addEventListener("click", loadGameScreen);
        fallingPackagesInterval = setInterval(createFallingPackage, 600); // Generate packages at intervals (this part handles falling packages)
    }

    // Function to load the game screen
    function loadGameScreen() {
        document.body.style.backgroundColor = "#dbdbdb"; // Light grey background for game

        screen.innerHTML = `
            <div class="game-container"></div>
            <div id="tile-container"></div>
            <div id="structure-container"></div>
            <div id="vignette"></div>
        `;

        // Initialize game grid or any game-specific logic here
        clearInterval(fallingPackagesInterval);
        document.documentElement.style.setProperty('--img', `${img}`);
        createTileGrid(41, 40);  // Initialize grid for the full screen
        pickStructure();
    }

    // Load the title screen first
    loadTitleScreen();
});

function createTileGrid(rows, cols) {
    const tileContainer = document.getElementById('tile-container');
    tileContainer.innerHTML = '';  // Clear previous tiles

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.row = r;
            tile.dataset.col = c;

            // Add a click event to each tile
            tile.addEventListener('click', () => handleTileClick(r, c));

            tileContainer.appendChild(tile);
        }
    }
    
}

var spriteSize = 32;
var sheetSize = 224;
var sheetIndex = sheetSize/spriteSize;

function pickStructure() {
    const pick = document.getElementById("structure-container");
    pick.innerHTML = ""; // Clear previous buttons
    console.log("loading structures...");
    var pos = 0;
    document.documentElement.style.setProperty('--sheetSize', sheetSize + "px");

    for (let i = 0; i < sheetIndex; i++) {
        pos = -(i * spriteSize);
        console.log("loaded", i);
        const button = document.createElement("button");
        button.style.width = `${spriteSize}px`;
        button.style.height = `${spriteSize}px`;
        button.style.backgroundImage = `url("../assets/ROADS.png")`;
        button.style.backgroundPosition = `${pos}px 0px`; // Shift left per sprite
        button.style.border = "none";
        button.style.marginRight = "5px"; // Space between buttons

        button.dataset.structure = i; // Store index for reference

        button.addEventListener("click", () => selectStructure(i));

        pick.appendChild(button);

    }
}

function selectStructure() {

}

function handleTileClick(row, col) {
    console.log(`Tile at row ${row}, col ${col} clicked`);
    setTileSprite(row, col, si); // Set first sprite from the spritesheet
}

function setTileSprite(row, col, spriteIndex) {
    const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (tile) {
        let r = rotation + "deg";
        let f = flip + "deg";

        const spriteX = -(spriteIndex * 32); // Move left by 32 pixels per sprite
        tile.style.backgroundImage = img; // Set spritesheet
        tile.style.backgroundPosition = `${spriteX}px 0px`; // Position it to the correct sprite
        tile.style.backgroundSize = `${sheetSize}px auto`; // Keep original scaling, just shift position
        tile.style.width = "32px"; // Tile size
        tile.style.height = "32px"; // Tile size
        tile.style.backgroundRepeat = "no-repeat"; // Prevent tiling
        tile.style.transform = `rotate(${r}) rotateY(${f})`; //transform individual tiles
    }
}

function rotateTile() {
    console.log(rotation);
    document.documentElement.style.setProperty('--rot', rotation + "deg");
}

function deleteTile() {
    document.documentElement.style.setProperty('--colour', `#c76161`);
    img = '';
}

function flipTile() {
    if (flip == 0) {
        flip = 180;
        document.documentElement.style.setProperty('--flip', flip + "deg");
    } else {
        flip = 0;
        document.documentElement.style.setProperty('--flip', flip + "deg");
        
    }
}

function moveCameraLeft() {
    document.documentElement.style.setProperty('--moveX', 32 + "px");
}
function moveCameraRight() {
    document.documentElement.style.setProperty('--moveX', -32 + "px");
}

function resetTile() {
    img = "url('../assets/ROADS.png')";
    document.documentElement.style.setProperty('--flip', flip + "deg");
    document.documentElement.style.setProperty('--rot', rotation + "deg");
}

var rotation = 0;
var flip = 0;
var img = "url('../assets/ROADS.png')";
var si = 0;

document.addEventListener("keydown", (event) => {
    console.log(rotation, flip); 
    console.log("key pressed:", event.key);

    if (event.key === "e" || event.key === "E") {
        deleteTile();
    }if (event.key === "1") {
        resetTile();
    } if (event.key === "t" || event.key === "T") {
        si = (si + 1) %sheetIndex; // %3 set to number of sprites
        document.documentElement.style.setProperty('--index', (-(si * 32)) + "px");
    }if (event.key === "," || event.key === "<") {
        moveCameraLeft();
    } if (event.key === "." || event.key === ">") {
        moveCameraRight();
    } if (img == "url('../assets/ROADS.png')") {
        if (event.key === "r" || event.key === "R") {
            rotation = (rotation + 90) % 360;
            rotateTile(rotation);
        } if (event.key === "u" || event.key === "U") {
            flipTile();
        }
    }
    document.documentElement.style.setProperty('--img', `${img}`);
});

let tileMap = [];

function initializeTileMap(rows, cols) {
    tileMap = Array.from({ length: rows }, () => Array(cols).fill(null)); // null means empty tile
}

// Function to create falling packages
function createFallingPackage() {
    const packageElement = document.createElement("div");
    packageElement.classList.add("package");

    // Random starting position
    packageElement.style.left = Math.random() * window.innerWidth + "px"; // Random position across the screen

    // Random animation duration for variety
    let duration = Math.random() * 3 + 2; // Between 2 and 5 seconds
    packageElement.style.animationDuration = `${duration}s`;

    document.getElementById("background-container").appendChild(packageElement);

    // Remove package after animation ends
    setTimeout(() => {
        packageElement.remove();
    }, duration * 1000);
}

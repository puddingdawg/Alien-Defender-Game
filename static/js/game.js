//board
let tileSize = 32;
let rows = 16;
let cols = 16;


let bWidth = tileSize * cols; //32*16
let bHeight = tileSize * rows; //32*16
let board;
let context; // draw on canvas

//Variables for Drawing ship
const shipAR = 1.68;//Ship Aspect Ratio
const shipScale = 1.5;
let shipWidth = tileSize * shipAR * shipScale;
let shipHeight = tileSize * shipScale;
let shipX = tileSize * cols / 2 - tileSize; //make sure ship is in the middle
let shipY = tileSize * rows - tileSize * 2; //Gets ship at the bottom


let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight

}

let shipImg;
let shipVelX = tileSize; //ship moving speed


//variables for drawing aliens
const alienScale = 1.5;
let alienArray = [];
let alienWidth = tileSize * alienScale;
let alienHeight = tileSize;
let alienX = tileSize;
let alienY = tileSize;
let alienImg;

let alienRows = 2;//how many rows of aliens
let alienCols = 4;//how many colunms of aliens
let alienCount = 0; // # of aliens to defeat
let alienVelX = 3;//alien moving speed


//bullets
let bulletArray = [];//store bullet
let bulletVelY = -10; //bullet moving speed 

//score tracking 
let score = 0;
let isGameOver = false;

//start game
let isGameStart = false;

//end game screen
let endGame = false;

window.onload = function () {
    board = document.getElementById("board");
    board.width = bWidth;
    board.height = bHeight;
    context = board.getContext("2d"); //drawing on the board
}

function startGame() {
    if (isGameStart) {
        return;
    }
    isGameStart = true;
    document.getElementById("start-btn").remove();
    gameScreen();

}

function gameScreen() {
    isGameStart = true;
    //loading spaceship image
    shipImg = new Image();
    shipImg.src = "/static/image/ship.png";
    shipImg.onload = function () {
        context.drawImage(shipImg, ship.x, ship.y, shipWidth, shipHeight);
    }

    //loading alien image
    alienImg = new Image();
    alienImg.src = "/static/image/alien.png";

    generateAliens();//create number of alliens in row and cols

    requestAnimationFrame(update);

    document.addEventListener("keydown", moveShip);

    document.addEventListener("keyup", shoot);//tap to shoot
}




function update() {
    requestAnimationFrame(update);
    if (isGameOver) {
        displayGameOver();
        return;//stops game when the game is over
    }

    context.clearRect(0, 0, bWidth, bHeight);

    //drawing ship
    // context.drawImage(shipImg, ship.x, ship.y, shipWidth, shipHeight);
    drawShip();

    //drawing aliens
    drawAliens();

    //drawing bullets
    drawBullets();

    //clear bullet
    clearingbBullets();

    //next level
    increaseLevel();

    //score
    showScore();

}

function drawShip() {
    context.drawImage(shipImg, ship.x, ship.y, shipWidth, shipHeight);
}

function drawAliens() {
    for (let i = 0; i < alienArray.length; i++) {
        let alien = alienArray[i];
        if (alien.alive) {
            alien.x += alien.speed;

            if (alien.x <= 0 || alien.x + alien.width >= board.width) { //making aliens shift directions when it touches border
                alien.speed *= -1; //change direction
                alien.y += alienHeight * 2; //move aliens down by 1 row
            }

            context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);

            if (alien.y >= ship.y) {
                isGameOver = true;
            }
        }
    }
}

function drawBullets() {
    for (let i = 0; i < bulletArray.length; i++) {
        let bullet = bulletArray[i];
        bullet.y += bulletVelY;
        context.fillStyle = "pink";
        context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        //bullet collision with aliens
        for (let j = 0; j < alienArray.length; j++) {
            let alien = alienArray[j];
            if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
                bullet.used = true;
                alien.alive = false;
                alienCount--;
                score += 100;
            }
        }
    }
}

function clearingbBullets() {
    while (bulletArray.length > 0 && bulletArray[0].used || bulletArray.y < 0) {
        bulletArray.shift();//removes bullet that is used
    }
}

function increaseLevel() {
    if (alienCount == 0) {
        //increase number of aliens
        alienCols = Math.min(alienCols + 1, cols / 2 - 3); //cap at 5 col of aliens
        alienRows = Math.min(alienRows + 1, rows - 5); //cap at 11 rows of aliens
        alienVelX += 1.5;//increase alien travel speed by 1.5
        alienArray = [];
        bulletArray = [];
        generateAliens();
    }
}

function showScore() {
    //show score on top left corner
    context.fillStyle = "white";
    context.font = "20px courier";
    context.fillText(score, 5, 20);
}

function moveShip(e) {
    let leftbound = ship.x - shipVelX;
    let rightbound = ship.x + shipVelX + ship.width;
    if (isGameOver) {
        return;
    }

    //stops ship from crossing the canvas size
    if (e.code == "ArrowLeft" && leftbound >= 0) {
        ship.x -= shipVelX; // move left 1 tile
    }
    else if (e.code == "ArrowRight" && rightbound <= board.width) {
        ship.x += shipVelX; // move right 1 tile
    }
}

//create aliens
function generateAliens() {
    for (let c = 0; c < alienCols; c++) {
        for (let r = 0; r < alienRows; r++) {
            let alien = {
                img: alienImg,
                x: alienX + c * alienWidth,
                y: alienY + r * alienHeight,
                width: alienWidth,
                height: alienHeight,
                speed: alienVelX,
                alive: true
            }

            alienArray.push(alien);
        }
    }
    alienCount = alienArray.length;
}

function shoot(e) {
    if (isGameOver) {
        return;
    }
    if (e.code == "Space") {
        //shoot
        let bullet = {
            x: ship.x + shipWidth * 15 / 32,
            y: ship.y,
            width: tileSize / 8,
            height: tileSize / 2,
            used: false
        }
        bulletArray.push(bullet);
    }
}

//Bullet collision detection 
function detectCollision(a, b) {
    return a.x < b.x + b.width && //a's top left corner dont reach b's top right corner
        a.x + a.width > b.x && //a's top right corner passes b's top left corner
        a.y < b.y + b.height && //a's top left corner dont reach b's bottom left corner
        a.y + a.height > b.y; //a's bottom left coner passes b's top left corner
}

//display gameover screen
function displayGameOver() {
    if (endGame) return;
    endGame = true;
    let text = "GAME OVER";
    let gs = "Score: " + score;
    context.clearRect(0, 0, bWidth, bHeight);
    let ele = document.createElement("div");
    let ele2 = document.createElement("div");
    ele.className = "gameOverTxt";
    ele2.className = "score";
    ele.innerHTML = text;
    ele2.innerHTML = gs;
    document.getElementById("cc").appendChild(ele);
    document.getElementById("cc").appendChild(ele2);
    postReq(score);
}
//Help with storing score inside score.db
function postReq(score) {
    fetch('http://127.0.0.1:81/storeScore/' + score, { method: "POST" })

}
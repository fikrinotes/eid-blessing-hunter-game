var keranjang;
var targets = [];
var score = 0;
var max_score = 0;
var target_speed = 1

var freq = 150 // frekuensi munculnya target dalam frame
var freq_function;

var level = 0;

// sound
var startSound = new Audio("assets/start-sound.mp3");
var bonusSound = new Audio("assets/bonus-sound.mp3");
var cookieSound = new Audio("assets/cookie-sound.mp3");
var wrongSound = new Audio("assets/wrong-sound.mp3");
var gameOverSound = new Audio("assets/gameover.mp3");

// Touch controls
let touchStartX = 0;
let touchMoveX = 0;
const TOUCH_SENSITIVITY = 50; // Seberapa jauh touch harus bergerak untuk menggerakkan keranjang


var item_list = [
    { name: "cookies", url: "assets/cookies.png" },
    { name: "firecracker", url: "assets/firecracker.png" },
    { name: "fly", url: "assets/fly.png" },
    { name: "money", url: "assets/money.png" }
];


var myGameArea = {
    canvas: document.getElementById("gameCanvas"),
    initialize: function() {
        // Set proper canvas size
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.offsetWidth * dpr;
        this.canvas.height = this.canvas.offsetHeight * dpr;
        
        this.context = this.canvas.getContext("2d");
        this.context.scale(dpr, dpr);
        this.context.imageSmoothingEnabled = false;
    },
    start: function() {
        // Add touch controls
        startSound.play();
        this.canvas.addEventListener('touchmove', function(event) {
            touchMoveX = event.touches[0].clientX;
            let diffX = touchMoveX - (keranjang.x + keranjang.width / 2);
            // if (Math.abs(diffX) > TOUCH_SENSITIVITY) {
            //     if (diffX > 0) {
            //         moveRight();
            //     } else {
            //         moveLeft();
            //     }
            // } else {
            //     stopMoving();
            // }
            // Convert touch position relative to canvas
            let rect = myGameArea.canvas.getBoundingClientRect();
            let touchX = event.touches[0].clientX - rect.left;
            
            // Move basket based on touch position
            if (touchX > keranjang.x + keranjang.width && Math.abs(diffX) > TOUCH_SENSITIVITY) {
                moveRight();
            } else if (touchX < keranjang.x && Math.abs(diffX) > TOUCH_SENSITIVITY) {
                moveLeft();
            } else {
                stopMoving();
            }
            
            event.preventDefault();
        });

        this.canvas.addEventListener('touchend', function(event) {
            stopMoving();
            event.preventDefault();
        });

        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 10);
        
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    },
    stop : function() {
        clearInterval(this.interval);
    }
};



function Component(name, width, height, src, x, y) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    
    // Load image properly
    this.image = new Image();
    this.imageLoaded = false;
    this.image.onload = () => {
        this.imageLoaded = true;
    };
    this.image.src = src;
    
    this.update = function() {
        const ctx = myGameArea.context;
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
    this.newPos = function() {
        let nextX = this.x + this.speedX;
        if (nextX >= 0 && nextX <= myGameArea.canvas.width - this.width) {
            this.x = nextX;
        } else if (nextX < 0) {
            this.x = 0;
        } else {
            this.x = myGameArea.canvas.width - this.width;
        }
        this.y += this.speedY;
    }
    this.crashWith = function(otherobj) {
        var myleft = this.x + this.width/4;
        var myright = this.x + (this.width - this.width/4);
        var mytop = this.y + 3*this.height/4;
        var mybottom = this.y + (this.height) - this.height/4;
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        
        return crash;

    }
}

function everyinterval(n) {
    if ((myGameArea.frameNo / n) % 1 == 0) {return true;}
    return false;
}

function updateGameArea() {
    myGameArea.clear();
    myGameArea.frameNo += 1;

    if (score <= 0) {
        level = 0 // Stop the game if score is negative
    }
    else {
        level = Math.floor(score / 5); // Level increases every 5 points
    }
    freq_function = 150*Math.E**(-20*level/150); // Set frequency of target based on level
    if (Math.floor(freq_function) > 0) {
        freq = Math.floor(freq_function);
    } else {
        freq = 1;
    }
    if (myGameArea.frameNo == 1 || everyinterval(freq)) {
        // generate target secara acak
        let randomIndex = Math.floor(Math.random() * item_list.length);
        let randomItem = new Component(item_list[randomIndex].name, 50, 50, item_list[randomIndex].url, Math.random() * (myGameArea.canvas.width - 100), 100);
        
        targets.push(randomItem);
    }
    // increase target speed based on level
    target_speed = 1 + (level * 0.1); // Increase speed based on level

    for (i = 0; i < targets.length; i += 1) {
        targets[i].y += target_speed;
        targets[i].update();
        if (targets[i].y > myGameArea.canvas.height) {
            targets.splice(i, 1); // Remove the target if it goes off screen
            i--;
        }
    }

    for (i = 0; i < targets.length; i += 1) {
        if (keranjang.crashWith(targets[i])) {
            if (targets[i].name === "cookies") {
                cookieSound.play(); // Play cookie sound
                score += 1; // Increment score for cookies  
            }
            else if (targets[i].name === "firecracker") {
                wrongSound.play(); // Play wrong sound
                score -= 4; // Increment score for firecracker
            }
            else if (targets[i].name === "fly") {
                wrongSound.play(); // Play wrong sound
                score -= 4; // Increment score for fly
            }
            else if (targets[i].name === "money") {
                bonusSound.play(); // Play bonus sound
                score += 3; // Increment score for money
            }

            targets.splice(i, 1); // hapus item jika telah menyentuh keranjang
            i--;
        }
    }

    if (score > max_score) {
        max_score = score; // Update max score  
    }

    ctx = myGameArea.context;
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillStyle = "white";
    ctx.fillText("Score: " + score, 30, 50);
    ctx.fillText("Level: " + level, 30, 80);

    keranjang.newPos();
    keranjang.update();

    if (score < 0) {
        stopGame(); // Stop the game if score is negative
        gameOverSound.play(); // Play game over sound
        myGameArea.clear();
        document.getElementById("finalScore").innerHTML = "Skor tertinggi anda: " + max_score; // Hide game canvas
        document.getElementById("gameOver").style.display = "block"; // Show game over screen
    }
}

function startGame() {
    document.getElementById("playButton").style.display = "none"; // Hide the play button
    keranjang = new Component("keranjang", 80, 65, "assets/wicker-basket.png", 100, document.getElementById("gameCanvas").offsetHeight - 75);
    myGameArea.start();
}

function stopGame() {
    myGameArea.stop();
    gameOverSound.play(); // Play game over sound
}

// Navigasi game dengan tombol
function moveLeft() {
    let nextPosition = keranjang.x - 1.2;
    if (nextPosition >= 0) {
        keranjang.speedX = -1.2;
    } else {
        keranjang.speedX = 0;
        keranjang.x = 0;  // Force position to boundary
    }
}

function moveRight() {
    let maxX = document.getElementById('gameCanvas').offsetWidth - keranjang.width;
    let nextPosition = keranjang.x + 1.2;
    if (nextPosition < maxX) {
        keranjang.speedX = 1.2;
    } else {
        keranjang.speedX = 0;
        keranjang.x = maxX;  // Force position to boundary
    }
}

function stopMoving() {
    keranjang.speedX = 0;
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft') {
        moveLeft();
    }
    if (event.key === 'ArrowRight') {
        moveRight();
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        stopMoving();
    }
});

// initialize the game area
myGameArea.initialize();



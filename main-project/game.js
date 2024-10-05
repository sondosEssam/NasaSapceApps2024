const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Planet data with image paths
const planets = [
    { 
        name: 'Mercury', 
        info: 'Mercury is the smallest planet in the Solar System.',
        imagePath: 'planets_images/mercury.png'
    },
    { 
        name: 'Venus', 
        info: 'Venus has an incredibly thick atmosphere.',
        imagePath: 'planets_images/venus.png'
    },
    { 
        name: 'Earth', 
        info: 'Earth is the only planet known to support life.',
        imagePath: 'planets_images/earth.png'
    },
    { 
        name: 'Mars', 
        info: 'Mars is often called the Red Planet due to its reddish appearance.',
        imagePath: 'planets_images/mars.png'
    },
    { 
        name: 'Jupiter', 
        info: 'Jupiter is the largest planet in the Solar System.',
        imagePath: 'planets_images/jupitar.png'
    },
    { 
        name: 'Saturn', 
        info: 'Saturn is known for its prominent ring system.',
        imagePath: 'planets_images/saturn.png'
    },
    { 
        name: 'Uranus', 
        info: 'Uranus has a unique tilt, causing extreme seasons.',
        imagePath: 'planets_images/uranus.png'
    },
    { 
        name: 'Neptune', 
        info: 'Neptune is known for its deep blue color and strong winds.',
        imagePath: 'planets_images/neptune.png'
    }
];

// Load all images
const spaceshipImage = new Image();
spaceshipImage.src = 'space_craft.png';

const enemyImage = new Image();
enemyImage.src = 'rock.png';

const bulletImage = new Image();
bulletImage.src = 'bullet.png';

// Background image
const background = new Image();
background.src = 'images.jpg';

// Game state
let isGameRunning = true;

// Spaceship setup
const spaceship = {
    x: 50,
    y: canvas.height / 2,
    width: 100,
    height: 100,
    speed: 5,
    health: 3,
    autoMove: false,
    hasWon: false,
};

// Current planet and its image
let currentPlanet = null;
let planetImage = new Image();
let planet; // Will be set by getRandomPlanet()

let enemies = [];
let bullets = [];
let keys = {};

// Get random planet
function getRandomPlanet() {
    const randomIndex = Math.floor(Math.random() * planets.length);
    const selectedPlanet = planets[randomIndex];
    
    // Create planet object with position and size
    currentPlanet = {
        ...selectedPlanet,
        x: canvas.width - 150,
        y: canvas.height / 2,
        width: 140,
        height: 140
    };

    // Load the corresponding planet image
    planetImage = new Image();
    planetImage.src = currentPlanet.imagePath;
    
    return currentPlanet;
}

// Event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        fireBullet();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game functions
function fireBullet() {
    const bullet = {
        x: spaceship.x + spaceship.width,
        y: spaceship.y + spaceship.height / 2 - 15,
        width: 30,
        height: 30,
        speed: 10,
    };
    bullets.push(bullet);
}

function createEnemy() {
    let enemy = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 30),
        width: 30,
        height: 30,
        speed: 2 + Math.random() * 3,
    };
    enemies.push(enemy);
}

async function generateEnemies() {
    let n = 30;
    while (n > 0) {
        for (let i = 0; i < 3; i++) {
            createEnemy();
        }
        n -= 3;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function drawHealthBar() {
    const maxHealth = 3;
    const barWidth = 150;
    const healthPercentage = spaceship.health / maxHealth;
    
    // Draw outer border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(20, 20, barWidth, 30);
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(19, 19, barWidth + 2, 32);
    
    // Gradient health bar
    const gradient = ctx.createLinearGradient(20, 0, barWidth, 0);
    gradient.addColorStop(0, '#ff4b1f');
    gradient.addColorStop(1, '#1fddff');

    ctx.fillStyle = gradient;
    ctx.fillRect(20, 20, barWidth * healthPercentage, 30);

    // Glowing effect
    ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00fff6';
    ctx.strokeRect(20, 20, barWidth, 30);
    ctx.shadowBlur = 0;
}

function moveToPlanet() {
    spaceship.autoMove = true;
    spaceship.hasWon = true;
    displayPlanetInfo(); // Show planet info first
}

function showWinMessage() {
    const messageModal = document.getElementById('messageModal');
    const messageText = document.getElementById('messageText');
    messageText.innerHTML = `
        <span style="color: #4CAF50;">Mission Accomplished!</span><br>
        <span style="font-size: 1.2rem;">You've reached ${planet.name}!</span>
    `;
    messageModal.style.display = 'block';
}

function showLoseMessage() {
    const messageModal = document.getElementById('messageModal');
    const messageText = document.getElementById('messageText');
    messageText.innerHTML = `
        <span style="color: #f44336;">Game Over!</span><br>
        <span style="font-size: 1.2rem;">Your ship was destroyed.</span>
    `;
    messageModal.style.display = 'block';
}

function displayPlanetInfo() {
    const planetInfoModal = document.getElementById('planetInfoModal');
    document.getElementById('planetName').innerText = planet.name;
    document.getElementById('planetInfo').innerText = planet.info;
    planetInfoModal.style.display = 'block';
}

function closeModal() {
    document.getElementById('planetInfoModal').style.display = 'none';
    if (spaceship.hasWon) {
        showWinMessage(); // Show win message after closing planet info
    }
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
}

function restartGame() {
    // Reset game state
    isGameRunning = true;
    spaceship.health = 3;
    spaceship.x = 50;
    spaceship.y = canvas.height / 2;
    spaceship.autoMove = false;
    spaceship.hasWon = false;
    
    // Get new random planet
    planet = getRandomPlanet();
    
    // Clear existing enemies and bullets
    enemies = [];
    bullets = [];
    
    // Generate new enemies
    generateEnemies();
    
    // Close message modal
    closeMessageModal();
    
    // Restart the game loop
    gameLoop();
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameLoop() {
    if (!isGameRunning) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
    // Check game state
    if (spaceship.health <= 0) {
        isGameRunning = false;
        showLoseMessage();
        return;
    }
    
    // Move spaceship
    if (!spaceship.autoMove) {
        if (keys['ArrowUp'] && spaceship.y > 0) spaceship.y -= spaceship.speed;
        if (keys['ArrowDown'] && spaceship.y < canvas.height - spaceship.height) spaceship.y += spaceship.speed;
    } else {
        spaceship.x += 7;
        if (spaceship.x >= planet.x - spaceship.width && !spaceship.hasWon) {
            moveToPlanet();
        }
    }
    
    // Draw planet using the current planetImage
    ctx.drawImage(planetImage, planet.x, planet.y, planet.width, planet.height);
    
    // Update and draw bullets
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.speed;
        if (bullet.x > canvas.width) {
            bullets.splice(index, 1);
        } else {
            ctx.drawImage(bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });
    
    // Draw spaceship
    ctx.drawImage(spaceshipImage, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
    
    // Update and draw enemies
    enemies.forEach((enemy, enemyIndex) => {
        enemy.x -= enemy.speed;
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Check collisions
        bullets.forEach((bullet, bulletIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
            }
        });
        
        if (checkCollision(enemy, spaceship)) {
            spaceship.health--;
            enemies.splice(enemyIndex, 1);
        }
        
        if (enemy.x + enemy.width < 0) {
            enemies.splice(enemyIndex, 1);
        }
    });
    
    // Draw health bar
    drawHealthBar();
    
    // Check win condition
    if (enemies.length === 0 && spaceship.health > 0 && !spaceship.autoMove) {
        moveToPlanet();
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize the game
function initGame() {
    planet = getRandomPlanet();
    generateEnemies();
    gameLoop();
}

// Start the game
initGame();
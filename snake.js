/* Global variables */
var frontBuffer = document.getElementById('snake');
var frontCtx = frontBuffer.getContext('2d');
var backBuffer = document.createElement('canvas');
backBuffer.width = frontBuffer.width;
backBuffer.height = frontBuffer.height;
var backCtx = backBuffer.getContext('2d');
var oldTime = performance.now();
var grid = null;
var snake = null;
var score = null;
var gameOverWindow = document.getElementById('game-over');
var runtime = 0;

/* Useful constants */
var CELL_SIZE = 10;
var EMPTY = " ";
var SNAKE = "X";
var APPLE = "A";
var MIN_TIME = 40;

var NORTH = "N";
var EAST = "E";
var SOUTH = "S";
var WEST = "W";


/**
 * Grid where the game takes place
 */
function Grid() {
  this.width = frontBuffer.width / CELL_SIZE;
  this.height = frontBuffer.height / CELL_SIZE;
  this.grid = new Array();
  this.apple = null;

  /* Initializes the grid */
  this.init = function() {
    for (var y = 0; y < this.height; y++) {
      this.grid[y] = new Array();
      for (var x = 0; x < this.width; x++) {
        this.grid[y][x] = EMPTY;
      }
    }
  }

  /* Generates and places an apple on a free spot */
  this.placeApple = function() {
    var emptyCells = Array();

    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        if (this.grid[y][x] == EMPTY) emptyCells.push({x:x,y:y});
      }
    }

    var index = Math.round(Math.random()*(emptyCells.length - 1));
    this.grid[emptyCells[index].y][emptyCells[index].x] = APPLE;
  }

  /* Sets a given cell with given value */
  this.setCell = function(x,y,val) {
    this.grid[y][x] = val;
  }

  /* Gets cell content */
  this.getCell = function(x,y) {
    return this.grid[y][x];
  }

}


/**
 * Main actor of the game
 */
function Snake() {
  this.direction = null;
  this.x = null;
  this.y = null;
  this.body = null;

  /* Places snake to a starting position */
  this.place = function() {
    this.direction = EAST;
    this.x = Math.floor(grid.width / 2);
    this.y = Math.floor(grid.height / 2);
    this.body = [{x:this.x,y:this.y},{x:this.x-1,y:this.y},{x:this.x-2,y:this.y}];
  }

  /* Grows snake by one body part */
  this.grow = function(x,y) {
    this.body.push({x:x,y:y});
    grid.setCell(x,y,SNAKE);
    score += 10;
  }

  /* Tells if snake is going in given direction or not */
  this.isGoing = function(direction) {
    switch(direction) {
      case NORTH:
        if(this.body[0].y - this.body[1].y == 1) return true;
        break;
      case EAST:
        if(this.body[0].x - this.body[1].x == 1) return true;
        break;
      case SOUTH:
        if(this.body[0].y - this.body[1].y == -1) return true;
        break;
      case WEST:
        if(this.body[0].x - this.body[1].x == -1) return true;
        break;
    }
    return false;
  }

  /* Change snake's direction */
  this.changeDirection = function(event) {
    event.preventDefault();
    switch (event.keyCode) {
      case 38:
      case 87:
        if(this.direction != SOUTH && !this.isGoing(SOUTH)) this.direction = NORTH;
        break;
      case 39:
      case 68:
        if(this.direction != WEST && !this.isGoing(WEST)) this.direction = EAST;
        break;
      case 40:
      case 83:
        if(this.direction != NORTH && !this.isGoing(NORTH)) this.direction = SOUTH;
        break;
      case 37:
      case 65:
        if(this.direction != EAST && !this.isGoing(EAST)) this.direction = WEST;
        break;
    }
  }

  /* Moves snake in a given direction */
  this.move = function() {
    var last = this.body.pop();
    var x = this.body[0].x, y = this.body[0].y;

    switch (this.direction) {
      case NORTH:
        y--;
        break;
      case EAST:
        x++;
        break;
      case SOUTH:
        y++;
        break;
      case WEST:
        x--;
        break;
    }

    grid.setCell(last.x, last.y, EMPTY);
    this.body.unshift({x:x,y:y});

    /* Snake out of bounds */
    if(x < 0 || x == grid.width || y < 0 || y == grid.height) {
      throw "GameOver";
    }

    switch(grid.getCell(x,y)) {
      case SNAKE:
        throw "GameOver";
        break;
      case APPLE:
        this.grow(last.x, last.y);
        grid.placeApple();
      default:
        grid.setCell(x,y, SNAKE);
        break;
    }
  }
}

/**
 * Ends the game
 */
function gameOver() {
  gameOverWindow.style.display = "block";
  document.getElementById('final-score').textContent = score;
}


/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
function loop(newTime) {
  var elapsedTime = newTime - oldTime;
  oldTime = newTime;
  runtime += elapsedTime;

  try {
    if (runtime > MIN_TIME) {
      update(elapsedTime);
      render(elapsedTime);
      runtime = 0;
    }
  } catch(e) {
    gameOver();
    return;
  }

  // Flip the back buffer
  frontCtx.drawImage(backBuffer, 0, 0);
  frontCtx.font = "0.75em Georgia";
  frontCtx.fillText("SCORE: " + score, 10, 20);

  // Run the next loop
  window.requestAnimationFrame(loop);
}

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {elapsedTime} A DOMHighResTimeStamp indicting
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {

  snake.move();

}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {elapsedTime} A DOMHighResTimeStamp indicting
  * the number of milliseconds passed since the last frame.
  */
function render(elapsedTime) {
  backCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);

  for (var y = 0; y < grid.height; y++) {
    for (var x = 0; x < grid.width; x++) {
      switch (grid.getCell(x,y)) {
        case APPLE:
          backCtx.fillStyle = "#0A0";
          break;
        case SNAKE:
          backCtx.fillStyle = "#0066FF";
          break
        default:
          backCtx.fillStyle = "#FFF";
      }
      backCtx.fillRect(x*CELL_SIZE, y*CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}


/* Launch the game */
function start() {
  gameOverWindow.style.display = "none";

  grid = new Grid();
  grid.init();
  grid.placeApple();
  snake = new Snake();
  snake.place();
  score = 0;

  window.onkeydown = function(event){
    snake.changeDirection(event);
  }

  window.requestAnimationFrame(loop);
}

start();

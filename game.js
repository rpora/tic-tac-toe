const EMPTY = -1;
const PLAYER = 0;
const OPPONENT = 1;

// DOM
const $board = document.querySelector('.board');
const $cells = Array.from($board.children);
const $diceRoll = document.querySelector('.dice-roll');
const $scores = document.querySelector('.scores');
const $message = document.querySelector('.message');
const $playBtn = document.querySelector('.play-btn');


// State
let board = emptyBoard();
let winPatterns = [
    0b111000000, 0b000111000, 0b000000111,  // rows
    0b100100100, 0b010010010, 0b001001001,  // cols
    0b100010001, 0b001010100                // diags
];

class AI {

    constructor(difficulty = 1) {
        this.difficulty = difficulty;
    }

    findBestMove() {
        let result = this.minimax(this.difficulty, OPPONENT);
        return result.position;
    }

    minimax(depth, minmaxer) {

        let nextMoves = getAvailableMoves();
        let bestMove = { score: (minmaxer === OPPONENT) ? -10000 : 10000,  position: -1};

        // Collect every available move
        let randomizedMoves = [];


        if (!nextMoves.length || depth === 0) {
            bestMove.score = this.evaluate();
        } else {

            for (let i = 0; i < nextMoves.length; ++i) {

                let moveSimulation = nextMoves[i];
                board[moveSimulation] = minmaxer;

                let score = this.minimax(depth - 1, (minmaxer === OPPONENT) ? PLAYER : OPPONENT).score;

                randomizedMoves.push({score:score, position:moveSimulation});

                if ((minmaxer === OPPONENT && score > bestMove.score) ||
                    (minmaxer === PLAYER && score < bestMove.score)) {
                    bestMove = {score: score, position: moveSimulation };
                }

                board[moveSimulation] = EMPTY;
            }
        }

        if(randomizedMoves.length){

            // First move
            if(randomizedMoves.length === board.length){
                bestMove = randomizedMoves[Math.floor(Math.random() * randomizedMoves.length)];
            }

            randomizedMoves = randomizedMoves.filter( m => m.score === bestMove.score);
            bestMove = randomizedMoves[Math.floor(Math.random() * randomizedMoves.length)];
        }

        return bestMove;
    }

    evaluate() {

        let score = 0;

        score += this.evaluateLine(0, 1, 2); // row 1
        score += this.evaluateLine(3, 4, 5); // row 2
        score += this.evaluateLine(6, 7, 8); // row 3
        score += this.evaluateLine(0, 3, 6); // col 1
        score += this.evaluateLine(1, 4, 7); // col 2
        score += this.evaluateLine(2, 5, 8); // col 3
        score += this.evaluateLine(0, 4, 8); // diag.
        score += this.evaluateLine(2, 4, 6); // alt. diag.

        return score;
    }

    evaluateLine(a, b, c) {

        let score = 0;
        let cA = board[a];
        let cB = board[b];
        let cC = board[c];

        // first cell
        if (cA == OPPONENT) {
            score = 1;
        } else if (cA == PLAYER) {
            score = -1;
        }

        // second cell
        if (cB == OPPONENT) {
            if (score == 1) {
                score = 10;
            } else if (score == -1) {
                return 0;
            } else {
                score = 1;
            }
        } else if (cB == PLAYER) {
            if (score == -1) {
                score = -10;
            } else if (score == 1) {
                return 0;
            } else {
                score = -1;
            }
        }

        // third cell
        if (cC == OPPONENT) {
            if (score > 0) {
                score *= 10;
            } else if (score < 0) {
                return 0;
            } else {
                score = 1;
            }
        } else if (cC == PLAYER) {
            if (score < 0) {
                score *= 10;
            } else if (score > 1) {
                return 0;
            } else {
                score = -1;
            }
        }

        return score;
    }

}

class HumanPlayer {

    constructor() {
        this.name = 'You';
        this.win = 0;
    }

    play() {
        $message.textContent = 'Your turn!';
        return new Promise((resolve) => {
            let disposeFn = event($board, 'click', e => {
                let target = e.target;
                if (target.classList.contains('cell')) {  // If we hit a cell
                    let idx = $cells.indexOf(target);       // get the cell index.
                    if (getAvailableMoves().indexOf(idx) !== -1) {  // must be available
                        disposeFn();
                        resolve(idx);
                    }
                }
            });
        })
    }

}

class AIPlayer {

    constructor(difficulty = 2) {
        this.difficulty = difficulty;
        this.name = `${this._getRandomName()}(AI)`;
        this.win = 0;
    }

    _getRandomName() {
        return AIPlayer.names[Math.floor(Math.random() * (AIPlayer.names.length - 1))];
    }

    setBoard() {
        this.ai = new AI(1);
    }

    play() {
        $message.textContent = `${this.name}'s turn`;
        return new Promise((res) => {
            let randomTimer = Math.floor(Math.random() * 1000 + 500);
            let move = this.ai.findBestMove();
            setTimeout(() => res(move), randomTimer);
        })
    }
}

AIPlayer.names = ['Leanne', 'Ervin', 'Clementine', 'Patricia', 'Chelsey', 'Dennis', 'Kurtis',
    'Nicholas', 'Alphonse', 'Marie', 'Edouard', 'Lucille', 'Julie', 'Bernard'];

let player = null;
let opponent = null;
let startingPlayer = null;
let currentPlayer = null;

/**
 * Game utils
 */
function emptyBoard() {
    return [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
}

function hasAvailableMove() {
    return board.some(cell => cell === EMPTY);
}

function getAvailableMoves() {
    return board.reduce((acc, current, idx) => {
        current === EMPTY && acc.push(idx);
        return acc;
    }, []);
}

function hasWon(player) {

    let pattern = board.reduce((acc, curr, i) => {
        curr === player.symbol && (acc |= (1 << i));
        return acc;
    }, 0b000000000);

    return winPatterns.some(winPattern => {
        return (pattern & winPattern) == winPattern;
    });
}

function getWinner() {
    if (hasWon(player)) return player;
    if (hasWon(opponent)) return opponent;
    return null;
}

function clearBoard() {
    board = emptyBoard();
    $cells.forEach(cell => {
        cell.classList.remove('cross');
        cell.classList.remove('circle');
    });
}

function updateBoard(idx, symbol) {
    board[idx] = symbol;
    $board.children[idx].classList.add(symbol === PLAYER ? 'cross' : 'circle');
}

function isOver() {
    return hasWon(player) || hasWon(opponent) || !hasAvailableMove();
}

function declareTurnWinner() {

    let winner = getWinner();

    if (winner) {

        winner.win++;
        $message.textContent = `${winner.name} win!`;
        $scores.children[winner.symbol].querySelectorAll('li')[winner.win - 1].classList.add('won');

        if (player.win == 3) {
            endState(player);
        } else if (opponent.win == 3) {
            endState(opponent);
        } else {
            nextTurn();
        }

    } else {
        $message.textContent = `Draw!`;
        nextTurn();
    }
}

function nextTurn() {
    $playBtn.textContent = 'Next turn';
    $playBtn.classList.remove('hide');

    let disposeEvent = event($playBtn, 'click', () => {
        currentPlayer = startingPlayer;
        $playBtn.classList.add('hide');
        clearBoard();
        disposeEvent();
        takeTurn();
    });
}

function getOpponent(which) {
    return which === player ? opponent : player;
}

function takeTurn() {
    return currentPlayer.play()
        .then(move => {
            updateBoard(move, currentPlayer.symbol);
            currentPlayer = getOpponent(currentPlayer);
            return isOver() ? declareTurnWinner() : takeTurn();
        })
}

/**
 * Events handling
 */
let events = [];

function event(target, type, handler) {
    target.addEventListener(type, handler);
    return function disposeEvent() {
        target.removeEventListener(type, handler);
    }
}

function removeEvents() {
    events.forEach(disposeFn => disposeFn());
    events = [];
}


/**
 * Game States
 */
function initState() {

    removeEvents();

    $scores.classList.add('hide');
    $diceRoll.classList.add('hide');
    $playBtn.classList.remove('hide');

    $playBtn.textContent = 'Click to start';
    $message.textContent = 'Tic Tac Toe';

    events.push(event($playBtn, 'click', playerSetup));
}

function dice() {

    $playBtn.classList.add('hide');
    document.body.classList.remove('playing');

    setTimeout(() => {
        $playBtn.textContent = 'Click to throw the dice';
        $playBtn.classList.remove('hide');
    }, 500);

    let disposeEvent = event($playBtn, 'click', onDiceRoll);

    function onDiceRoll() {

        $playBtn.classList.add('hide');

        $diceRoll.querySelector('.dice-rolling').textContent = 'The dices are rolling!';

        let scoreA = Math.floor(Math.random() * 0) + 1;
        let scoreB = Math.floor(Math.random() * 5) + 1;

        while (scoreA === scoreB) {
            scoreA = Math.floor(Math.random() * 0) + 1;
            scoreB = Math.floor(Math.random() * 5) + 1;
        }

        startingPlayer = scoreA > scoreB ? player : opponent;
        currentPlayer = startingPlayer;

        disposeEvent();

        setTimeout(() => {

            $diceRoll.querySelector('.dice-score').textContent = `You: ${scoreA} - ${opponent.name}: ${scoreB}.`;
            $diceRoll.querySelector('.dice-result').textContent = `${startingPlayer.name} start!`;

            $playBtn.textContent = 'Start';
            $playBtn.classList.remove('hide');

            events.push(event($playBtn, 'click', playingState));
        }, 1000);
    }


}

function playerSetup() {

    removeEvents();

    $scores.classList.add('hide');
    $message.classList.add('hide');
    $playBtn.classList.add('hide');
    $board.classList.add('hide');
    $diceRoll.classList.remove('hide');

    $diceRoll.querySelector('.dice-rolling').textContent = '';
    $diceRoll.querySelector('.dice-score').textContent = '';
    $diceRoll.querySelector('.dice-result').textContent = '';

    player = new HumanPlayer();
    player.symbol = PLAYER;

    opponent = new AIPlayer();
    opponent.symbol = OPPONENT;
    opponent.setBoard(board);

    $diceRoll.querySelector('.opponent').textContent = `You are playing against ${opponent.name}`;

    dice();
}

function playingState() {

    removeEvents();
    clearBoard();
    Array.from($scores.querySelectorAll('li')).forEach(li => li.classList.remove('won'));

    $board.classList.remove('hide');
    $scores.classList.remove('hide');
    $playBtn.classList.add('hide');
    $diceRoll.classList.add('hide');
    $message.classList.remove('hide');

    $scores.children[PLAYER].querySelector('span').textContent = player.name;
    $scores.children[OPPONENT].querySelector('span').textContent = opponent.name;

    document.body.classList.add('playing');

    takeTurn();
}

function endState(winner) {
    removeEvents();

    $message.textContent = `${winner.name} wins the game!`;
    document.body.classList.remove('playing');

    $playBtn.classList.remove('hide');
    $playBtn.textContent = 'Try again!';

    events.push(event($playBtn, 'click', playerSetup));
}

initState();

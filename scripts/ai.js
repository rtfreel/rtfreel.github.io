class Player {
    constructor(game, playerId, symbol) {
        this.game = game;
        this.id = playerId;
        this.symbol = symbol;
    }

    makeMove() { 
        this.updateStatus(TURN_MSG);
        return undefined; 
    }

    endTurn() { this.updateStatus(""); }

    updateStatus(newStatus) { 
        this.status = newStatus;
        if(this.statusOut != undefined)
            $(this.statusOut).text(newStatus);
    }

    setStatusOut(statusElement) {
        this.statusOut = statusElement;
    }
}

class AI extends Player{
    constructor(difficulty, game, id, symbol){
        super(game, id, symbol);
        this.difficulty = difficulty;
    }

    makeMove() {
        this.updateStatus(TURN_MSG);
        this.analysis();

        // occupie last cell to win / find longest sequence
        let winMax = 0;
        let lastMove = this.flipCoin(this.difficulty.ONE_STEP_WIN);
        for(let [cell, len] of this.winMoves.entries()) {
            len.sort().reverse();
            if(lastMove && len[0] == CELLS_TO_WIN - 1)
                return [cell.getRow(), cell.getCol()];
            if(len[0] > winMax) winMax = len[0];
        }
        
        // occupie last cell before opponent wins / find longest sequence
        let oppMax = 0;
        lastMove = this.flipCoin(this.difficulty.PREVENT_ONE_STEP_WIN);
        for(let [cell, len] of this.prevMoves.entries()) {
            len.sort().reverse();
            if(lastMove && len[0] == CELLS_TO_WIN - 1)
                return [cell.getRow(), cell.getCol()];
            if(len[0] > oppMax) oppMax = len[0];
        }
        
        // prevent opponent from continuing longest sequence
        // if there is any preventive moves
        if(this.prevMoves.size > 0) {
            // if it is larger than AI's longest one
            if(oppMax > winMax) {
                if(this.flipCoin(this.difficulty.PREVENT_SEQ_LONGER)) {
                    return this.preventSeq(oppMax);
                }
            } 
            // if it is the same length as AI's longest one
            else if(oppMax == winMax) {
                if(this.flipCoin(this.difficulty.PREVENT_SEQ_EQUALS)) {
                    return this.preventSeq(oppMax);
                }
            } 
            // if it is smaller than AI's longest one
            else {
                if(this.flipCoin(this.difficulty.PREVENT_SEQ_SHORTER)) {
                    return this.preventSeq(oppMax);
                }
            }
        }

        // occupie cell, that is close to opponent's
        // if there are any neighbours
        if(this.oppMoves.size > 0 && 
            this.flipCoin(this.difficulty.PREVENT_SPREAD)) {
            return this.randomMove([...this.oppMoves]);
        }

        // intelligent move to continue sequence
        if(this.winMoves.size > 0 && 
            this.flipCoin(this.difficulty.WIN_MOVE)) {
            return this.continueSequence(winMax);
        }

        // move to ocuppie larger area
        if(this.spreadMoves.size > 0 && 
            this.flipCoin(this.difficulty.SPREAD_MOVE)) {
            return this.randomMove([...this.spreadMoves]);
        }

        // occupie 
        return this.randomMove(this.sortedCells[-1]);
    }

    continueSequence(maxLength){
        let maxScore = 0;
        let bestMoves = new Map();
        for(let [cell, lengths] of this.winMoves) {
            if(lengths[0] == maxLength) {
                let sum = lengths.reduce((a, b) => a+b)
                bestMoves.set(cell, sum);
                if(sum > maxScore) maxScore = sum;
            }
        }
        bestMoves = new Map([...bestMoves]
            .filter(([_, len]) => len == maxScore));
        return this.randomMove([...bestMoves.keys()])
    }

    preventSeq(maxLength) {
        // find cells that either help AI and fails the opponent
        let cross = new Map();
        for(let [cell, lengths] of this.prevMoves) {
            if(this.winMoves.has(cell))
                cross.set(cell, 
                    [lengths.reduce((a, b) => a+b), 
                    this.winMoves.get(cell).reduce((a, b) => a+b)]);
        }
        
        // if only one cross - return it
        if(cross.size == 1) {
            let cell = cross.keys().next().value;
            return [cell.getRow(), cell.getCol()];
        } else if(cross.size > 1){
            // find the best cell to pick
            let opMax = 0, aiMax = 0;
            for(let [_, lengths] of cross) {
                if(lengths[0] > opMax) 
                    opMax = lengths[0];
            }
            cross = new Map([...cross]
                .filter(([_, len]) => len[0] == opMax));
            for(let [_, lengths] of cross) {
                if(lengths[1] > aiMax) 
                    aiMax = lengths[1];
            }
            cross = new Map([...cross]
                .filter(([_, len]) => len[1] == aiMax));
            return this.randomMove([...cross.keys()]);
        }

        let bestMoves = new Map([...this.prevMoves]
            .filter(([_, len]) => len[0] == maxLength));
        bestMoves = [...bestMoves.keys()];
        return this.randomMove(bestMoves);
    }

    analysis() {
        this.spreadMoves = new Set([]);  //moves to ocuppie larger area
        this.oppMoves = new Set([]);     //moves to make opponent change stategy
        this.winMoves = new Map();       //moves to get victory closer
        this.prevMoves = new Map();      //moves to prevent opponent from winning
        this.sortedCells = this.game.getSortedCells();
    
        // iterate through different cell types separetly
        Object.keys(this.sortedCells).forEach(curId => {
            // ignore empty cells
            if(curId == -1) return;
    
            // all sequences for current type
            let allSeq = {};
    
            // iterate through every cell in type
            for(let ci = 0; ci < this.sortedCells[curId].length; ci++){
                let x = this.sortedCells[curId][ci].getCol();
                let y = this.sortedCells[curId][ci].getRow();
                
                // define current neighbours set
                let neighborsRef = (curId == this.id) ? this.spreadMoves : this.oppMoves;
    
                // add neighbours of current cell
                let neighbours;
                neighbours = this.game.getSortedNeighbours(y, x);
                    if(neighbours[-1] != undefined)
                        neighbours[-1].forEach(neighborsRef.add, neighborsRef);
                
                // iterate through deltas
                for(let dy = 0; dy < 2; dy++){
                    if(y + dy >= this.game.size) continue;
                    for(let dx = -1; dx < 2; dx++){
                        if(dy == 0 && dx < 1) continue;
                        let curSeq = [];
    
                        // cell where sequence begins
                        let curCell = this.game.cells[y][x];
    
                        // find current sequence
                        let nextX, nextY;
                        do{
                            curSeq.push(curCell);
                            nextX = curCell.getCol() + dx;
                            nextY = curCell.getRow() + dy;
                            if(nextX < 0 || nextX >= this.game.size ||
                                nextY >= this.game.size) break;
                            curCell = this.game.cells[nextY][nextX];
                        } while(curCell.playerId == curId);
    
                        // ignore subsequences
                        let delta = [dx, dy];
                        if(allSeq[delta] == undefined)
                            allSeq[delta] = [];
                        else {
                            let isSubseqence = false;
                            curSeq.forEach(cell => {
                                if(allSeq[delta].includes(cell)){
                                    isSubseqence = true;
                                    return;
                                }
                            });
                            if(isSubseqence) continue;
                        }
    
                        // save sequence for current delta
                        curSeq.forEach(cell => allSeq[delta].push(cell));
    
                        // add all empty neighbours to spread moves
                        let neighbours;
                        for(let i = 1; i < curSeq.length; i++){
                            neighbours = this.game.getSortedNeighbours(curSeq[i].getRow(), curSeq[i].getCol());
                            if(neighbours[-1] != undefined)
                                neighbours[-1].forEach(neighborsRef.add, neighborsRef);
                        }
    
                        // find moves to continue sequence
                        if(curSeq.length > 1){
                            let movesRef = (curId == this.id) ? this.winMoves : this.prevMoves;
                            let movesForCurSeq = [curCell];
                            nextX = curSeq[0].getCol() - dx;
                            nextY = curSeq[0].getRow() - dy;
                            if(nextX >= 0 && nextX < this.game.size &&
                                nextY >= 0 && nextY < this.game.size) 
                                movesForCurSeq.push(this.game.cells[nextY][nextX]);    
                            movesForCurSeq.forEach(cell => {
                                if(cell.playerId == -1) {
                                    if(!movesRef.has(cell))
                                        movesRef.set(cell, []);
                                    movesRef.get(cell).push(curSeq.length);
                                }
                            });
                        }
                    }
                }
            }
        });
    }

    flipCoin(probability) {
        return (probability == 0) ? false : 
            (probability == 1) ? true: probability >= Math.random();
    }

    randomMove(cells) {
        let target = cells[Math.floor(Math.random() * cells.length)];
        return [target.getRow(), target.getCol()];
    }
}
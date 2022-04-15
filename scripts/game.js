class Game{
    constructor(table, sizeOut = undefined) {
        this.table = table;
        this.sizeOut = sizeOut;
        this.running = false;
        this.started = false;
    }

    generate(size) {
        this.running = false;
        this.started = false;
        this.size = size;
        this.generateCells();
        this.renderTable();
        if(this.sizeOut != undefined)
            $(this.sizeOut).html(this.size + "&times;" + this.size);
    }

    start() {
        this.started = true;
        this.running = true;
    }    

    /**
     * undefined - game is still running
     * -1 - tie
     * {id} - winner
     */
    checkWinner(pId) {
        let sortedCells = this.getSortedCells();
        
        // winner check
        let curCell, x, y, nextX, nextY;
        let curSeq = [];
        // iterate through current player's cells
        for(let ci = 0; ci < sortedCells[pId].length; ci++){
            x = sortedCells[pId][ci].getCol();
            y = sortedCells[pId][ci].getRow();
            // try every step by one
            for(let dy = 0; dy < 2; dy++){
                if(y + dy >= this.size) continue;
                for(let dx = -1; dx < 2; dx++){
                    if(dy == 0 && dx < 1) continue;
                    curCell = this.cells[y][x];
                    // find all sequence
                    do{
                        curSeq.push(curCell);
                        nextX = curCell.getCol() + dx;
                        nextY = curCell.getRow() + dy;
                        if(nextX < 0 || nextX >= this.size ||
                            nextY >= this.size) break;
                        curCell = this.cells[nextY][nextX];
                    } while(curCell.playerId == pId);

                    // if sequence is long enough to win
                    if(curSeq.length >= CELLS_TO_WIN) {
                        this.running = false;
                        curSeq.forEach(cell => cell.highlight());
                        return pId;
                    }
                    curSeq = [];
                }
            }
        }

        // if no empty cells left
        if(sortedCells[-1] == undefined) {
            this.running = false;
            return -1;
        }

        return undefined;
    }

    generateCells() {
        this.cells = [];
        for(let i = 0; i < this.size; i++){
            this.cells.push([]);
            for(let j = 0; j < this.size; j++){
                this.cells[i].push(new Cell(this.size));
            }
        }
    }

    renderTable() {
        $(this.table).empty();
        for(let i = 0; i < this.size; i++){
            let cur = $("<tr></tr>");
            for(let j = 0; j < this.size; j++){
                cur.append(this.cells[i][j].html);
            }
            $(this.table).append(cur);
        }
        this.roundCorners();
    }

    roundCorners() {
        $(this.table + " > tr:first-child > td:first-child").css("border-top-left-radius", "1vw");
        $(this.table + " > tr:first-child > td:last-child").css("border-top-right-radius", "1vw");
        $(this.table + " > tr:last-child > td:first-child").css("border-bottom-left-radius", "1vw");
        $(this.table + " > tr:last-child > td:last-child").css("border-bottom-right-radius", "1vw");
    }

    getSortedCells() {
        let result = {};
        let curId;
        for(let i = 0; i < this.size; i++){
            for(let j = 0; j < this.size; j++){
                curId = this.cells[i][j].playerId;
                if(result[curId] == undefined)
                    result[curId] = [];
                    result[curId].push(this.cells[i][j]);
            }
        }
        return result;
    }

    getSortedNeighbours(row, col) {
        let result = {};
        let curId;
        this.getNeighbours(row, col).forEach(cell => {
            curId = cell.playerId;
            if(result[curId] == undefined)
                result[curId] = [];
                result[curId].push(cell);
        });
        return result;
    }

    getNeighbours(row, col) {
        let result = [];
        let nX, nY;
        for(let dy = -1; dy < 2; dy++) {
            for(let dx = -1; dx < 2; dx++) {
                if(dy == 0 && dx == 0) continue;
                nY = row + dy;
                nX = col + dx;
                if(nY < 0 || nY >= this.size ||
                    nX < 0 || nX >= this.size)
                    continue;
                result.push(this.cells[nY][nX]);
            }
        }
        return result;
    }
}
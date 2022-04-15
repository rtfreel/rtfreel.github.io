class Cell {
    constructor(size) {
        this.playerId = -1; // means cell is empty
        this.symbol = "&nbsp";
        this.html = $("<td class=\"square\">" + this.symbol + "</td>");
        $(this.html).css("font-size", SIZE_FONT_REL[size] + "vh");
        
        let obj = this;
        $(this.html).click(function(){
            turn(obj.getRow(), obj.getCol());
        });
    }
    
    getRow() { return $(this.html).parent().index(); }
    getCol() { return $(this.html).index(); }

    occupie(id, player) {
        this.playerId = id;
        this.symbol = player.symbol;
        $(this.html).html(this.symbol);
    }

    highlight() {
        $(this.html).addClass("highlighted");
    }
}
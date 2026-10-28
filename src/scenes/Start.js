export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/tile_0042.png');
       
    }

    create() {
        this.background = this.add.sprite(640, 320, 'background');
        this.last_time = 0;
    }

    update(time) {
        let dt = (time - this.last_time)/1000;
        this.last_time = time;
        
    }
    
}

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }


    // Load images and uhh any assets I guess in general. I manually scaled the background in piskel but that was before I
    // knew how to scale images LMAO. 
    preload() {
        this.load.image('background', 'assets/tile_0042.png');
        this.load.image('ship', 'assets/ship_0005.png');
        this.load.image('shipBullet', 'assets/sun.png');
        this.load.image('enemyType1', 'assets/ship_0009.png'); // Enemy type 1
        this.load.image('enemy1Bullet', 'assets/tower.png'); // Type 1 bullet. Its just a tower that I'll flip lmao
        this.load.image('enemyType2', 'assets/ship_0001.png'); 
    }

    create() {
        // Background sprite creation
        this.background = this.add.sprite(640, 320, 'background'); // This creates le blue background. Everything else is layered on top of this. 
        this.lastTime = 0; // This is changed in update to see how much time passed beteween each frame cause I guess deltaTime is needed.
    
        // Sets up player health, starting score, and text for those things. 
        this.playerHealth = 10;
        this.score = 0;

        this.healthText = this.add.text(20, 55, 'Health: 10', {
            fontSize: '24px',
            color: '#44ff00',
            backgroundColor: '#736c6c' // Background behind le text
        });

        this.pointsText = this.add.text(20, 85, 'SCORE: 0 (Destroy enemies to get score!)', {
            fontSize: '24px',
            color: '#eaf4e6',
            backgroundColor: '#455c43' // Background behind le text
        });
        
        // GROUPS so that way I can control the nature of all of them at once. Also useful for iterating in loops. 

        this.bullets = this.add.group(); // Grouping up ALL player bullets. Since all player bullets move up, there will be a second one.
        this.enemyBullets = this.add.group(); // All enemy bullets move down. 
        this.enemyType1Group = this.add.group(); // All enemies of type 1 also move down.   
        this.enemyType2Group = this.add.group();

        // Wave system
        this.waveNumber = 1;
        this.enemiesPerWave = 3; // This changes depending on the waveNumber.
        this.enemiesSpawned = 0; // Basic counter.
        // SPAWN INTERVALS. Basically that way it doesn't just throw everything at once cause that was lowk terrifying. 
        this.lastEnemySpawn = 0;
        this.enemySpawnDelay = 1000;

        // Tracks when to start the next wave
        this.waveClearTime = null;

        // Display the current wave
        this.waveText = this.add.text(20, 20, 'Wave: 1', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#736c6c' // Background behind le text
        });

        // If this becomes true then basically the game will stop. 
        this.gameEnded = false;

        // Restart input
        this.restartInput = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // Ship sprite creation
        this.ship = this.add.sprite(640, 640, 'ship'); // Creates the ship sprite
        this.ship.setScale(3); // USE THIS TO SCALE IMAGES LOL. 

        // Get keys
        this.moveLeftInput = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        this.moveRightInput = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        this.shootInput = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

        // Duration in-between each shot. 
        this.lastShotTime = 0;
        this.shootCooldown = 120;

    }

    update(time, delta) {

        
        // If gameEnded ever becomes true then well... the game will wait until the player presses R. 
        if (this.gameEnded) {
            if (Phaser.Input.Keyboard.JustDown(this.restartInput)) {
                this.scene.restart();
            }

            return;
        }

        let dt = (time - this.lastTime)/1000; //deltaTime. Pretty much Unity's time.DeltaTime if I recally correctly.
        this.lastTime = time; // How much time psased between each update basically.
        
        // Ship Movement
        if (this.moveLeftInput.isDown) {
            this.ship.x -= 10;
            if (this.ship.x < 180) {
                this.ship.x = 180;
            }
        }

        if (this.moveRightInput.isDown) {
            this.ship.x += 10;
            if (this.ship.x > 1100) {
                this.ship.x = 1100;
            }
        }

        // Ship gunning stuff
        if (this.shootInput.isDown && time - this.lastShotTime >= this.shootCooldown) { // If the cooldown has hit zero, the ship can shoot again.
            this.shootBullet();
            this.lastShotTime = time;
        }


        // Move all bullets upward (towards enemy air planes / ships.)
        this.bullets.getChildren().forEach(function(bullet) {
            bullet.y -= 500 * dt;

            if (bullet.y < -bullet.displayHeight) {
                bullet.destroy();
            }
        });

        // Move all enemy bullets downward towards the player.

        this.enemyBullets.getChildren().forEach(function(bullet) {
            bullet.y -= -500 * dt;

            if (bullet.y < -bullet.displayHeight) {
                bullet.destroy();
            }
        });

        
        // Spawn enemies for the current wave
        if (this.enemiesSpawned < this.enemiesPerWave) {
            if (time - this.lastEnemySpawn >= this.enemySpawnDelay) {

                // Waves 1 and 2 only spawn type 1
                // Wave 3 onwards can spawn either type
                if (this.waveNumber >= 3 && Math.random() < 0.3) {
                    // Type 2 enemy has a 30% chance of spawning. 
                    this.spawnEnemyType2(time);
                } else {
                    this.spawnEnemy(time);
                }
                
                this.enemiesSpawned++;
                this.lastEnemySpawn = time;
            }
        }

        // Move every enemy downward
        this.enemyType1Group.getChildren().forEach((enemy) => {
            enemy.y += 100 * (delta / 1000);

            // Remove enemies that leave the screen
            if (enemy.y > 640 + enemy.displayHeight) {
                enemy.destroy();
            }
        });

        // Move type 2 enemies in a sine wave. Or close to it anyway lmao. I kinda failed at making it look like one. Had to slow it down immensley. 
        let enemies2 = this.enemyType2Group.getChildren();

        for (let i = 0; i < enemies2.length; i++) {
            let enemy = enemies2[i];

            // Move downward
            enemy.y += 50 * (delta / 1000);

            // Advance the sine wave over time
            enemy.waveOffset += enemy.waveSpeed * (delta / 1000);

            // Move left and right
            enemy.x = enemy.startX + Math.sin(enemy.waveOffset) * enemy.waveWidth;
                

            // Remove enemies that leave the screen
            if (enemy.y > 640 + enemy.displayHeight) {
                enemy.destroy();
            }
        }

        // Make both enemy types shoot bullets
        let enemyBulletGroups = [this.enemyType1Group,this.enemyType2Group];
        

        for (let g = 0; g < enemyBulletGroups.length; g++) {
            let enemies = enemyBulletGroups[g].getChildren();

            for (let i = 0; i < enemies.length; i++) {
                let enemy = enemies[i];

                if (time - enemy.lastShotTime >= enemy.shootCooldown) {
                    this.shootEnemyBullet(enemy);

                    // Reset this enemy's shooting timer
                    enemy.lastShotTime = time;
                }
            }
        }

        // Check each bullet against each enemy
        let enemyGroups = [this.enemyType1Group,this.enemyType2Group];
        

        for (let g = 0; g < enemyGroups.length; g++) {
            let enemies = enemyGroups[g].getChildren();

            for (let i = 0; i < enemies.length; i++) {
                let enemy = enemies[i];

                // Check every player bullet against this enemy
                let bullets = this.bullets.getChildren();

                for (let j = 0; j < bullets.length; j++) {
                    let bullet = bullets[j];

                    if (!bullet.active || !enemy.active) {
                        continue;
                    }

                    let distance = Phaser.Math.Distance.Between(
                        bullet.x, bullet.y,
                        enemy.x, enemy.y
                    );

                    if (distance < 35) {
                        bullet.destroy();

                        enemy.health -= 1;

                        if (enemy.health <= 0) {
                            enemy.destroy();
                            this.score += enemy.pointsGiven;
                            this.pointsText.setText('Score: ' + this.score);
                            // CHECK ENEMIES POINT AMOUNT AND ADD IT TO THE SCORE. Type 2 enemies give 10 points while type 1 only give 1. 
                        }

                        // This bullet has hit; don't process it again
                        break;
                    }
                }
            }
        }

        // Move enemy bullets downward
        let enemyBullets = this.enemyBullets.getChildren();

        for (let i = 0; i < enemyBullets.length; i++) {
            let bullet = enemyBullets[i];

            bullet.y += 300 * dt;

            // Remove bullets that leave the bottom of the screen
            if (bullet.y > 640 + bullet.displayHeight) {
                bullet.destroy();
            }
        }

        // Check whether enemy bullets hit the player
        let bullets = this.enemyBullets.getChildren();

        for (let i = 0; i < bullets.length; i++) {
            let bullet = bullets[i];

            if (!bullet.active) {
                continue;
            }

            let distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.ship.x, this.ship.y);
                

            if (distance < 35) {
                bullet.destroy();

                // Damage the player
                this.playerHealth -= 1;

                this.healthText.setText(
                    'Health: ' + this.playerHealth
                );

                // End the game if health reaches zero
                if (this.playerHealth <= 0) {
                    this.gameOver();
                }
            }
        }

        // Check whether the current wave is cleared
        if (this.enemiesSpawned >= this.enemiesPerWave && this.enemyType1Group.countActive(true) === 0 && this.enemyType2Group.countActive(true) === 0)
            {
        
            // Start the pause when the wave is first cleared
            if (this.waveClearTime === null) {
                this.waveClearTime = time + 2000;
                this.waveText.setText('Wave cleared!');
            }

            // Start the next wave after 2 seconds
            if (time >= this.waveClearTime) {
                this.waveNumber++;

                // Increase the number of enemies
                this.enemiesPerWave += 2;

                // Reset the spawning system
                this.enemiesSpawned = 0;
                this.lastEnemySpawn = time;
                this.waveClearTime = null;

                // Display the new wave number
                this.waveText.setText('Wave: ' + this.waveNumber);
            }
        }
    }

    shootBullet() {
        // Create a bullet just above the ship
        let bullet = this.add.sprite(this.ship.x, this.ship.y - 30, 'shipBullet');

        bullet.setScale(0.2); // Apparently the sun is quite large :/

        // Putting bullet in le group
        this.bullets.add(bullet);
    }

    spawnEnemy(time) {
        // Choose a random horizontal position
        let x = Phaser.Math.Between(180, 1100);

        // Spawn enemy near the top of the screen
        let enemy = this.add.sprite(x, 0, 'enemyType1');
        // Time when this enemy can next shoot
        enemy.lastShotTime = time;

        // Each enemy shoots every 2 seconds
        enemy.shootCooldown = 2000;
        enemy.angle = 180;
        enemy.health = 5;

        enemy.pointsGiven = 1;

        enemy.setScale(2);

        // Store the enemy in the group
        this.enemyType1Group.add(enemy);
        
        
    }

    spawnEnemyType2(time) {
        let x = Phaser.Math.Between(250, 1030);

        let enemy = this.add.sprite(x, 0, 'enemyType2');

        // Health and shooting
        enemy.health = 5;   
        enemy.lastShotTime = time;
        enemy.shootCooldown = 1500;

        enemy.pointsGiven = 5;

        // Sine wave movement properties
        enemy.startX = x;
        enemy.waveOffset = 0;
        enemy.waveWidth = 100;
        enemy.waveSpeed = 2;

        enemy.setScale(2);

        this.enemyType2Group.add(enemy);
    }

    shootEnemyBullet(enemy) {
        // Create a bullet below the enemy
        let bullet = this.add.sprite(enemy.x, enemy.y + 20, 'enemy1Bullet');
        

        bullet.angle = 180;
        bullet.setScale(0.15);

        // Add it to the enemy bullet group
        this.enemyBullets.add(bullet);
    }

    gameOver() {
        // Prevent game over from triggering multiple times DAMMIT.
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;

        // Display game-over message. I couldn't find the right shocked emoji but this works I guess lol. 
        this.add.text(640, 280, '😧 GAME OVER 😧', {
            fontSize: '64px',
            color: '#ff0000'
        }).setOrigin(0.5);

        this.add.text(640, 350, 'Press R to Restart', {
            fontSize: '32px',
            color: '#0a0a0a'
        }).setOrigin(0.5);
    }
    
    
}

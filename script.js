var spaceGame = {}

spaceGame.stateA = function(game) {
  this.level = 1;
  this.score = 0;
  this.landed = false;
  this.shipWeapon = spaceGame.stateA.prototype.fireBullet;
  this.health = 10;
  this.oreCollected = 0;
}

spaceGame.stateA.prototype = {
  preload: function() {

    this.load.image('star', 'http://www.first-last-always.com/application/themes/default/images/dot-white.png');
    this.load.image("planet", "planet.png");
    this.load.image('bullet', 'bullet.png');
    this.load.image('ship', 'spshipspr1.png');
    this.load.image("enemy", "smallfreighterspr.png");
    this.load.image("laser", "laser.png");
    this.load.image("superLaser", "superlaser.png");
    this.load.image("ore", "ore.png");
    this.load.spritesheet("asteroids", "asteroids.png", 128, 128, 16);
    this.load.spritesheet("explosions", "explosion.png", 96, 96, 20);
  },

  create: function() {
    game.renderer.clearBeforeRender = true;
    game.renderer.roundPixels = true;

    game.world.setBounds(0, 0, 2000, 2000);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    this.game.stage.backgroundColor = "#000";

    this.createPlanet();

    this.createAsteroids(40, 2, 4, 5);

    this.createStars(1000, 1);

    this.createBullets();

    this.createLasers();

    this.createSuperLasers();

    this.createShip(this.planet.x + this.planet.width / 2, this.planet.y + this.planet.height / 2, 1, this.health);

    this.createEnemies(this.level + Math.floor(this.level * Math.random()), 100, 1, 5);

    this.createConsole();

    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR]);
    pKey = game.input.keyboard.addKey(Phaser.Keyboard.P);
    lKey = game.input.keyboard.addKey(Phaser.Keyboard.L);
  },

  update: function() {
    this.flyShip();

    game.physics.arcade.overlap(enemies, superLasers, this.collisionHandler, null, this);

    game.physics.arcade.overlap(asteroids, superLasers, this.collisionHandler, null, this);

    game.physics.arcade.overlap(asteroids, bullets, this.collisionHandler, null, this);

    game.physics.arcade.overlap(asteroids, lasers, this.collisionHandler, null, this);

    game.physics.arcade.overlap(ship, lasers, this.collisionHandler, null, this);

    game.physics.arcade.overlap(enemies, bullets, this.collisionHandler, null, this);

    game.physics.arcade.overlap(ship, ores, this.pickupOre, null, this);

    bullets.forEachExists(this.screenWrap, this);
    lasers.forEachExists(this.screenWrap, this);
    enemies.forEachExists(this.screenWrap, this);

    for (var i = 0; i < enemies.children.length; i++) {
      if(enemies.children[i].alive){
        this.flyEnemies(enemies.children[i]);
      }
    }
    lKey.onDown.add(this.land, this);
    pKey.onDown.add(this.pause, this);
    this.updateConsole();
//    this.victoryTest();
    console.log(Math.sqrt(ship.body.velocity.x * ship.body.velocity.x + ship.body.velocity.y * ship.body.velocity.y));
  },

  render: function() {
  },

  createPlanet: function() {
    this.planet = game.add.sprite(game.world.bounds.width / 2, game.world.bounds.height / 2, "planet");
    this.planet.scale.setTo(0.2, 0.2);
  },

  createBullets: function () {
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(40, 'bullet');
    bullets.setAll("anchor.x", 0.5);
    bullets.setAll("anchor.y", 0.5);
  },

  createLasers: function() {
    lasers = game.add.group();
    lasers.enableBody = true;
    lasers.physicsBodyType = Phaser.Physics.ARCADE;
    lasers.createMultiple(40, "laser");
    lasers.setAll("anchor.x", 0.5);
    lasers.setAll("anchor.y", 0.5);
  },

  createSuperLasers: function() {
    superLasers = game.add.group();
    superLasers.enableBody = true;
    superLasers.physicsBodyType = Phaser.Physics.ARCADE;
    superLasers.createMultiple(40, "superLaser");
    superLasers.setAll("anchor.x", 0.5);
    superLasers.setAll("anchor.y", 0.5);
  },

  createOres: function(n) {
    ores = game.add.group();
    ores.enableBody = true;
    ores.physicsBodyType = Phaser.Physics.ARCADE;
    ores.createMultiple(n, "ore");
    ores.setAll("anchor.x", 0.5);
    ores.setAll("anchor.y", 0.5);
  },

  createAsteroids: function(n, lv, av, health) {
    asteroids = game.add.group();
    asteroids.enableBody = true;
    asteroids.physicsBodyType = Phaser.Physics.ARCADE;

    for (var i = 0; i < n; i++) {
      asteroid = game.add.sprite(game.world.randomX, game.world.randomY, "asteroids", i, asteroids);
      asteroid.body.velocity.x = Math.random() * lv;
      asteroid.body.velocity.y = Math.random() * lv;
      asteroid.body.angularVelocity = Math.random() * av;
      asteroid.anchor.set(0.5, 0.5);
      asteroid.health = health;
    }
    this.createOres(n);
  },

  createStars: function(n, s) {
    for (var i = 0; i < n; i++) {
      var star = game.add.sprite(game.world.randomX, game.world.randomY, 'star');
      star.scale.setTo(0.02 * s, 0.02 * s);
    }
  },

  createEnemies: function(n, v, size, health) {
    enemies = game.add.group();

    for (var i = 0; i < n; i++) {
      var enemy = game.add.sprite(game.world.randomX, game.world.randomY, "enemy", 1, enemies);
      enemy.anchor.set(0.5);
      enemy.scale.setTo(size, size);
      game.physics.enable(enemy, Phaser.Physics.ARCADE);
      enemy.body.maxVelocity.set(v)
      enemy.health = health;
      enemy.rof = 0;
      enemy.weapon = this.fireLaser;
    }
  },

  createConsole: function() {
    var barConfig = {width: 100, height: 10, x: 60, y: 15};
    this.healthBar = new HealthBar(this.game, barConfig);
    this.healthBar.setFixedToCamera(true);

    this.text = this.game.add.text(10, 30, "Score: " + this.score + "\nOre: " + this.oreCollected, {font: "40px", fill: "#fff"});
    this.text.fixedToCamera = true;
  },

  createShip: function(x, y, size, health) {
    ship = game.add.sprite(x, y, 'ship');
    ship.velocity = 300;
    ship.range = 1000;
    ship.aa = 200;
    ship.la = 300;
    ship.rof = 0;
    ship.weapon = this.shipWeapon;
    ship.anchor.set(0.5, 0.5);
    ship.scale.setTo(size, size);
    game.camera.follow(ship);
    game.physics.enable(ship, Phaser.Physics.ARCADE);
    ship.body.maxVelocity.set(ship.velocity);
    ship.health = health;
    ship.totalHealth = health;
  },

  spawnOre: function(asteroid) {
    ore = ores.getFirstExists(false);

    ore.scale.setTo(0.25, 0.25);
    ore.reset(asteroid.body.x + asteroid.body.width / 2, asteroid.body.y + asteroid.body.height / 2);
    ore.rotation = asteroid.rotation;
    game.physics.arcade.velocityFromRotation(asteroid.rotation, asteroid.body.velocity, ore.body.velocity);
  },

  fireBullet: function() {
    if(game.time.now > this.rof) {
      bullet = bullets.getFirstExists(false);


      if(bullet) {
        bullet.power = 1;
        bullet.reset(ship.body.x +Math.cos(ship.rotation) * 50 + 25, ship.body.y + Math.sin(ship.rotation) * 50 + 25);
        bullet.lifespan = 1000;
        bullet.rotation = ship.rotation;
        game.physics.arcade.velocityFromRotation(ship.rotation, 600, bullet.body.velocity);
        this.rof = game.time.now + 50;
      }
    }
  },

  fireSuperLaser: function(ship) {
    if(game.time.now > this.rof) {
      superLaser = superLasers.getFirstExists(false);

      if(superLaser) {
        superLaser.power = 3;
        superLaser.reset(ship.body.x +Math.cos(ship.rotation) * 50 + 25, ship.body.y + Math.sin(ship.rotation) * 50 + 25);
        superLaser.lifespan = 2000;
        superLaser.rotation = ship.rotation;
        game.physics.arcade.velocityFromRotation(ship.rotation, 400, superLaser.body.velocity);
        this.rof = game.time.now + 200;
      }
    }
  },

  fireLaser: function(enemy) {
    if(game.time.now > this.rof) {
      laser = lasers.getFirstExists(false);

      if(laser) {
        laser.power = 1;
        laser.reset(enemy.body.x + Math.cos(enemy.rotation) * 50 + 25, enemy.body.y + Math.sin(enemy.rotation) * 50 + 25);
        laser.lifespan = 1600;
        laser.rotation = enemy.rotation;
        game.physics.arcade.velocityFromRotation(enemy.rotation, 400, laser.body.velocity);
        this.rof = game.time.now + 100;
      }
    }
  },

  flyShip: function() {
    this.screenWrap(ship);
    if (cursors.up.isDown) {
      game.physics.arcade.accelerationFromRotation(ship.rotation, ship.la, ship.body.acceleration);
    } else {
      ship.body.acceleration.set(0);
    }
    if (cursors.left.isDown) {
      ship.body.angularVelocity = -ship.aa;
    } else if (cursors.right.isDown) {
      ship.body.angularVelocity = ship.aa;
    } else {
      ship.body.angularVelocity = 0;
    }
    if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      ship.weapon(ship);
    }
  },

  flyEnemies: function(enemy) {
    var direction = new Phaser.Point(ship.x, ship.y);
    var vector;
    direction.subtract(enemy.x, enemy.y);
    direction.normalize();
    vector = Math.atan2(direction.y, direction.x) - enemy.rotation;
    if(vector > 0.1) {
      enemy.body.angularVelocity = 200;
    } else if(vector < -0.1) {
      enemy.body.angularVelocity = -200;
    } else {
      enemy.body.angularVelocity = 0;
      enemy.weapon(enemy);
    }
    game.physics.arcade.accelerationFromRotation(enemy.rotation, 400, enemy.body.acceleration);
  },

  screenWrap: function(ship) {
    if (ship.x < 0) {
      ship.x = game.world.bounds.width;
    }
    else if (ship.x > game.world.bounds.width) {
      ship.x = 0;
    }

    if (ship.y < 0) {
      ship.y = game.world.bounds.height;
    }
    else if (ship.y > game.world.bounds.height) {
      ship.y = 0;
    }
  },

  collisionHandler: function(target, projectile) {
    if(target.health > 0) {
      target.health -= projectile.power;
      if(target === ship) {
        this.healthBar.setPercent(100 * (target.health / target.totalHealth))
      }
    } else {
      if(target.key === "asteroids") {
        this.spawnOre(target);
      }
      target.kill();
      var explode = game.add.sprite(target.body.x, target.body.y, "explosions");
      explode.animations.add("boom");
      explode.play("boom");

    }
    projectile.kill();
  },

  pickupOre: function(ship, ore) {
    ore.kill();
    this.oreCollected += 1;
  },

  victoryTest: function() {
    if(ship.health === 0) {
      console.log("You lose...");
      return;
    } else {
      for (var i = 0; i < enemies.children.length; i++) {
        if(enemies.children[i].alive){
          return;
        }
      }
    }
    console.log("You WIN!");
  },

  pause: function() {
    game.paused = (game.paused ? false : true);
  },

  land: function() {
    var velMag = Math.sqrt(ship.body.velocity.x * ship.body.velocity.x + ship.body.velocity.y * ship.body.velocity.y);
    if(this.landed) {
      this.landed = !this.landed;
      this.level += 1;
      this.state.start("StateA");
    } else {
      if((ship.x > this.planet.x) && (ship.x < (this.planet.x + this.planet.width)) &&
      ((ship.y > this.planet.y) && (ship.y < (this.planet.y + this.planet.height)))){
        if(velMag < 20) {
          this.landed = !this.landed;
          this.state.start("StateB");
        } else {
          console.log("Slow Down!");
        }
      }
    }
  },

  updateConsole: function() {
    this.text.setText("Score: " + this.score + "\nOre: " + this.oreCollected);
  }
}

spaceGame.stateB = function(game) {
  this.buyButton;
  this.sellButton;
  this.superLaserButton;
  this.betterArmorButton;
  this.otherState = game.state.states.StateA;
  this.text;
}

spaceGame.stateB.prototype = {
  preload: function() {
    this.load.image("buyButton", "buybutton.png");
    this.load.image("sellButton", "sellbutton.png");
    this.load.image("superLaserButton", "superlaserbutton.png");
    this.load.image("betterArmorButton", "betterarmorbutton.png");
  },
  create: function() {
    this.game.stage.backgroundColor = "#888";
    this.showScore();

    this.buyButton = this.game.add.button(game.width / 4, game.height / 4, "buyButton", this.buy, this)

    this.sellButton = this.game.add.button(game.width / 2, game.height / 4, "sellButton", this.sell, this);
  },
  update: function() {
    this.updateScore();
  },
  render: function() {
  },

  buy: function() {
    console.log("BUY");
    this.superLaserButton = this.game.add.button(game.width / 4, game.height / 4 + this.buyButton.height, "superLaserButton", this.buySuperLaser, this);
    this.betterArmorButton = this.game.add.button(game.width / 4, game.height / 4 + this.buyButton.height + this.superLaserButton.height, "betterArmorButton", this.buyBetterArmor, this);
  },

  sell: function() {
    console.log("SELL");
    this.otherState.score += this.otherState.oreCollected * 25;
    this.otherState.oreCollected = 0;
  },

  buySuperLaser: function() {
    if(this.otherState.score > 499) {
      console.log("bought");
      this.otherState.shipWeapon = spaceGame.stateA.prototype.fireSuperLaser;
      this.otherState.score -= 500;
    }
  },

  buyBetterArmor: function() {
    if(this.otherState.score > 999) {
      console.log("bought");
      this.otherState.health = 20;
      this.otherState.score -= 1000;
    }
  },

  showScore: function() {
    this.text = this.game.add.text(10, 30, "Score: " + this.otherState.score, {fontSize: "100px", fill: "#fff"});
  },

  updateScore: function() {
    this.text.setText("Score: " + this.otherState.score);
  }
}




var game = new Phaser.Game(800, 600, Phaser.CANVAS, '');

game.state.add("StateA", spaceGame.stateA);
game.state.add("StateB", spaceGame.stateB);

game.state.start("StateA");

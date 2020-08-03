const gameConfig = {
    stakes: {
        max: 50,
        min: 5,
        current: 5
    },
    "stake-change-magnitude": 5,
    balance: 20000,
    "wheel-amount": 4
}




class MainScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'MainScene'
        });
        this.stakes = gameConfig.stakes;
    }
    preload() {
        // localise file location to symbols folder
        this.load.setPath('./assets/symbols/')
        // cache spines
        this.load.spine('cherry', 'symbol_00.json', ['symbol_00.atlas'], true);
        this.load.spine('lemon', 'symbol_01.json', ['symbol_01.atlas'], true);
        this.load.spine('orange', 'symbol_02.json', ['symbol_02.atlas'], true);
        this.load.spine('plumb', 'symbol_03.json', ['symbol_03.atlas'], true);
        this.load.spine('grapes', 'symbol_04.json', ['symbol_04.atlas'], true);
        this.load.spine('melon', 'symbol_05.json', ['symbol_05.atlas'], true);
    }

    create() {
        // display all the wheels
        this.wheelArray = new SpinningWheelArray(this);

        // create stake controls pass stake object via reference
        this.stakeControls = new StakeControls(this, this.stakes);

        // create balance display
        this.balanceDisplay = new BalanceDisplay(this);

        // create the spin button, handle action via the scene
        this.spinButton = new Button(this,
            game.config.width - 100,
            game.config.height - 50,
            150,
            50,
            () => {
                this.performSpinAction()
            },
            "SPIN!"
        );
    }


    performSpinAction() {

        // disable any controls
        this.spinButton.setInteractive(false);
        this.stakeControls.setInteractive(false);

        // trigger promise to check for win and trigger spins
        // call in reality would be asyncronous
        let fakeAPICallPromise = new Promise(
            (resolution, rejection) => {
                 if(this.canAffordBet()){
                     getRandomRoll(resolution);
                 }
                 else{
                     // player cant afford this role trigger rejection
                     rejection("not enough funds");
                 }

            }
        ).catch(error => {
            // display error message to the user
            this.spinErrorDisplay(error);

            // chain will not continue so re-enable buttons here
            this.spinButton.setInteractive(true);
            this.stakeControls.setInteractive(true);
        })


        fakeAPICallPromise.then((result) => {

             if(!result){
                 // previouse chain rejected, dont continue
                 return false;
             }
            // simulate reduction in balance
            this.removeBalance();

            // make sure the response is valid
            let winResult = this.checkResult(result);

            if(winResult === false){
                throw new Error("Bad data from server")
            }
            return winResult;

        }).catch(error => {
            // display error message to the user
            this.spinErrorDisplay(error);
        })




        // after result is worked out
        fakeAPICallPromise.then((result) => {

            if(!result){
                // previouse chain rejected, dont continue
                return false;
            }
            // make sure the response is valid
            let winResult = this.checkResult(result);
            if(winResult === false){
                throw new Error("Bad data from server")
            }

            // spin the dials asyncronously after API has returned result
            let spinPromise = new Promise(
                (resolution) => {
                    // trigger wheel spins, spin to winning symbols
                    this.showWheelSpin(winResult.symbolIDs, resolution);
                })
                .then(() => {
                    // show any increase in money
                    if (winResult.win) {
                        this.rewardPlay(winResult.win);
                    }

                })
                .then(() => {
                    // spin has finished, re enable buttons
                    this.spinButton.setInteractive(true);
                    this.stakeControls.setInteractive(true);
                })

        }).catch(error => {

            // display error message to the user
            this.spinErrorDisplay(error);

            // spin has errored, re enable buttons
            this.spinButton.setInteractive(true);
            this.stakeControls.setInteractive(true);
        })
    }

    spinErrorDisplay(val) {
        // feedback spin attempt error to UI
        let errorText = new FadingText(this, val, game.config.width - 100, game.config.height - 100);
    }

    balanceMessageDisplay(val) {
        // show gaining or loosing money
        let sign = val ? "+" : "";
        let balanceMessage = new FadingText(this, sign + val, 100, game.config.height - 140);
    }

    checkResult(rollResult) {

            // safely access the response of the roll
            if (rollResult.hasOwnProperty("response")) {
                let response = rollResult.response;

                // safely access the result of the response
                if (response.hasOwnProperty("results")) {
                    let result = response.results;
                    if (result.hasOwnProperty("win") && result.hasOwnProperty("symbolIDs")) {
                        return result;
                    }
                }
            }
            // data is malformed
            return false;

    }

    removeBalance() {
        // deduct the balance
        gameConfig.balance -= this.stakes.current;
        // display deduction
        this.balanceDisplay.showBalance();
    }

    rewardPlay(amount) {
        // add the win amount to the current balance
        gameConfig.balance += amount;
        // display any changes
        this.balanceDisplay.showBalance();
        this.balanceMessageDisplay(amount);
    }

    showWheelSpin(ids, resolution) {
        // animate the wheel, a blank list of ids will produce fake spins
        this.wheelArray.animateSpin(ids, resolution);
    }



    canAffordBet() {
        if (gameConfig.balance >= this.stakes.current) {
            return true;
        } else {
            return false;
        }
    }

}




class SpinningWheelArray {

    constructor(scene) {
        this.wheels = [];
        let startPos = 400;
        let wheelOffset = 150;

        // create a wheel to display each potential wins
        for (let i = 0; gameConfig["wheel-amount"] > i; i++) {
            let xPosition = startPos + (wheelOffset * i + 1);
            this.wheels.push(new SpinningWheel(scene, xPosition));
        }

        let graphics = scene.add.graphics({
            fillStyle: {
                color: 0x000000
            }
        });

        // bottom of the wheel cover
        let bottomCover = new Phaser.Geom.Rectangle(
            0,
            500,
            game.config.width,
            600
        );

        // top of the wheel cover
        let topCover = new Phaser.Geom.Rectangle(
            0,
            0,
            game.config.width,
            300
        );

        // cover up the addition spines to give the effect of a wheel
        graphics.fillRectShape(bottomCover);
        graphics.fillRectShape(topCover);
    }

    animateSpin(results, resolution) {

        // trigger tweens to animate the 'wheel'
        let i;
        // show all of the winning results
        for (i = 0; i < results.length; i++) {
            let wheel = this.wheels[i];
            wheel.spin(results[i], true, resolution);
        }

        // run fake spins to simulate loosing wheels
        for (let j = i; j < this.wheels.length; j++) {
            let wheel = this.wheels[j];
            wheel.spin(randomNumberBetween(0, 5), false, resolution);
        }

    }
}




class SpinningWheel {
    constructor(scene, x) {

        // display one of each of the symbols
        let cherry = scene.add.spine(x, -320, 'cherry');
        let lemon = scene.add.spine(x, -180, 'lemon');
        let orange = scene.add.spine(x, -40, 'orange');
        let plumb = scene.add.spine(x, 100, 'plumb');
        let grapes = scene.add.spine(x, 240, 'grapes');
        let melon = scene.add.spine(x, 380, 'melon');

        // set base values to allow the rolling to continue
        cherry.baseY = -320;
        lemon.baseY = -180;
        orange.baseY = -40;
        plumb.baseY = 100;
        grapes.baseY = 240;
        melon.baseY = 380;

        // adding timeline at runtime
        this.scene = scene;

        // array of wheel pictures
        this.wheelSpines = [cherry, lemon, orange, plumb, grapes, melon];
    }
    spin(result, isWin, resolution) {
        let timeline = this.scene.tweens.createTimeline();

        // tween spine to original position
        timeline.add({
            targets: this.wheelSpines,
            y: {
                value: {
                    getEnd: function(target) {
                        // the end is its original position
                        return target.baseY;
                    }
                }
            },
            ease: 'Linear',
            duration: 600,
            repeat: 0
        });

        // repeated spin, show the wheel rolling round
        timeline.add({
            targets: this.wheelSpines,
            y: {
                value: '+=700'
            },
            ease: 'Linear',
            duration: 600,
            repeat: 3
        });

        // show the result of the spin
        timeline.add({
            targets: this.wheelSpines,

            y: {
                value: {
                    getEnd: function(target, key, value, targetIndex) {
                        // how far away from the winning index is the current spine
                        let goalDiff = targetIndex - result;
                        // work out what position that reprisents
                        let finishPos = (140) * goalDiff + 400;
                        // finish at that location
                        return finishPos
                    }
                }
            },
            onComplete: () => {
                // tigger after finishing
                if (isWin)
                    // only animate the wining symbols
                    this.playAnimation(result);
                // trigger promise resolution enabling the spin again
                resolution("done");
            },
            ease: 'Bounce',
            duration: 200,
            repeat: 0
        });
        // chain the tween above
        timeline.play();
    }

    playAnimation(pos) {
        // animation the winning symbol
        this.wheelSpines[pos].play("win");
    }
}




class BalanceDisplay {
    constructor(scene) {
        let displayY = game.config.height - 100;
        // create current balance display
        this.balanceText = scene.add.text(
            100,
            displayY,
            gameConfig.balance,
        );
        this.balanceText.setOrigin(0.5);
    }

    showBalance() {
        // display remaining balance
        this.balanceText.setText(gameConfig.balance);
    }
}




class FadingText {
    constructor(scene, text, x, y) {
        // show the message and hide it gradually
        let fadingText = scene.add.text(x, y, text);
        fadingText.setOrigin(0.5);

        scene.add.tween({
            targets: fadingText,
            alpha: {
                from: 1,
                to: 0
            },
            ease: 'Linear',
            duration: 1000,
            delay: 0
        })

    }
}


class StakeControls {
    constructor(scene, stakes) {

        // store reference locally
        this.stakes = stakes;
        let controlY = game.config.height - 50;

        // create increase stakes button
        this.plusButton = new Button(scene,
            50,
            controlY,
            50,
            50,
            () => {
                this.changeStakes(+1)
            },
            "+",
        );

        // create decrease stakes button
        this.minusButton = new Button(scene,
            150, controlY,
            50,
            50,
            () => {
                this.changeStakes(-1)
            },
            "-",
        );

        // create current stakes display
        this.currentStakeText = scene.add.text(
            100,
            controlY,
            this.stakes.current,
        );
        this.currentStakeText.setOrigin(0.5);
        // supper impose a dom element over  the top of the button
        this.scene = scene;
        let elem = this.scene.add.dom(0, 0, 'div', `width: 0px;`, 'current stake ' + this.stakes.current)
        elem.node.setAttribute('role', 'alert');

        this.node = elem.node;
    }

    changeStakes(sign) {
        // calculate the amount to change the stakes
        let changeMagnitude = gameConfig["stake-change-magnitude"];
        let change = sign * changeMagnitude;

        // do the change to stakes
        this.stakes.current += change;

        // is the current value too low?
        if (this.stakes.current < this.stakes.min) {
            // set it to the minimum
            this.stakes.current = this.stakes.min;
        }
        // is the current value too high?
        else if (this.stakes.current > this.stakes.max) {
            // set it to the maximum
            this.stakes.current = this.stakes.max;
        }
        this.node.innerHTML = 'current stake ' + this.stakes.current
        this.node.setAttribute('role', '');
        this.node.setAttribute('role', 'alert');


        // change the display to reprisent the new stakes
        this.currentStakeText.setText(this.stakes.current);
    }

    setInteractive(val) {

        // disable interactability
        this.plusButton.setInteractive(val);
        this.minusButton.setInteractive(val);
    }
}


class Button {
    constructor(scene, x, y, width, height, action, text) {
        // shape to reprisent the touch area
        let rect = new Phaser.Geom.Rectangle(
            x - width / 2,
            y - height / 2,
            width,
            height
        );
        // add the graphics to the scene
        this.graphics = scene.add.graphics({
            fillStyle: {
                color: 0xffffff,
                alpha: 0.3
            }
        });

        // Zone to handle touch/click input
        this.clickZone = scene.add.zone(
            x, y, width, height
        );

        // textual element of button
        let buttonText = scene.add.text(
            x, y, text
        );
        // center the text
        buttonText.setOrigin(0.5);

        // enable interaction, add handler to trigger action
        this.clickZone.setInteractive().on('pointerdown', function() {
            action();
        })

        // display the visible touch area
        this.graphics.fillRectShape(rect);

    }

    setInteractive(val) {
        // change interactability
        if (val) {
            this.graphics.alpha = 0.3;
            this.clickZone.setInteractive();
        } else {
            this.graphics.alpha = 0.1;
            this.clickZone.disableInteractive();
        }
    }
}
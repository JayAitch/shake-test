//Dummy JSON responses
let data = [

    {
        "response": {
            "results": {
                "win": 0,
                "symbolIDs": []
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 8,
                "symbolIDs": [5, 4, 0]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 1,
                "symbolIDs": [0]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 0,
                "symbolIDs": []
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 2,
                "symbolIDs": [1, 0]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 4,
                "symbolIDs": [2, 1, 0]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 4,
                "symbolIDs": [5]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 3,
                "symbolIDs": [2, 0]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 0,
                "symbolIDs": []
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 8,
                "symbolIDs": [5, 4, 1]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 9,
                "symbolIDs": [5, 3, 2, 1]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 6,
                "symbolIDs": [4, 0, 1]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 1,
                "symbolIDs": [1]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 5,
                "symbolIDs": [1, 2, 3]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 0,
                "symbolIDs": []
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 5,
                "symbolIDs": [0, 2, 3]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 0,
                "symbolIDs": []
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 6,
                "symbolIDs": [0, 2, 3]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 8,
                "symbolIDs": [0, 1, 2, 5]
            }
        }
    },

    {
        "response": {
            "results": {
                "win": 0,
                "symbolIDs": []
            }
        }
    },

]

let config  = {
    type: Phaser.WEBGL,
    width: 1280,
    height: 720,
	scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    plugins: {
        scene: [
            {
                key: 'SpinePlugin',
                plugin: window.SpinePlugin,
                sceneKey: 'spine'
            }
        ]
    },
    dom: {
        createContainer: true
    },
    parent: 'divId',
    scene:[MainScene]
}

let game

window.addEventListener('load', function() {
    game = new Phaser.Game(config)
})

function getRandomRoll(resolution){
    // simulate a role, normaly performed server side
   let randomNumber = randomNumberBetween(0, data.length - 1);
   let result = data[randomNumber];

   // result found - continue promise chain
   resolution(result);
   return result;
}



function randomNumberBetween(min, max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}
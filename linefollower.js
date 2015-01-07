var five = require("johnny-five");
var board = new five.Board();

var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();

board.on("ready", function () {
    var wheels = {
        left: new five.Servo({ pin: 9, type: 'continuous' }),
        right: new five.Servo({ pin: 10, type: 'continuous' }),
        stop: function () {
            wheels.left.center();
            wheels.right.center();
        },
        forward: function () {
            wheels.left.ccw();
            wheels.right.cw();
            console.log("goForward");
        },
        pivotLeft: function () {
            wheels.left.center();
            wheels.right.cw();
            console.log("turnLeft");
        },
        pivotRight: function () {
            wheels.left.ccw();
            wheels.right.center();
            console.log("turnRight");
        },
        steer: function (dir) {
            console.log("steer: " + dir);
            var rightdir = null;
            var leftdir = null;
            var right = 0;
            var left = 0;

            var scale = 0.3;

            if (dir < -0.5) {
                leftdir = 'cw';
                left = -dir * 0.75;
                rightdir = 'cw';
                right = 1.0;
            }
            else if (dir < 0) {
                leftdir = 'ccw';
                left = 1.0 + 1.5 * dir;
                rightdir = 'cw';
                right = 1.0;
            }
            else if (dir < 0.5) {
                leftdir = 'ccw';
                left = 1.0;
                rightdir = 'cw';
                right = 1.0 - 1.5 * dir;
            }
            else {
                leftdir = 'ccw';
                left = 1.0;
                rightdir = 'ccw';
                right = dir * 0.75;
            }
            console.log("right " + right + " " + rightdir + ", left " + left + " " + leftdir);
            wheels.right[rightdir](right * scale);
            wheels.left[leftdir](left * scale);
        }
    };
    
    var eyes = new five.IR.Reflect.Array({
        emitter: 13,
        pins: ["A0", "A1", "A2", "A3", "A4", "A5"]
    });
    
    var calibrating = true;
    var running = false;

    wheels.stop();
    
    // Start calibration
    // All sensors need to see the extremes so they can understand what a line is,
    // so move the eyes over the materials that represent lines and not lines during calibration.
    eyes.calibrateUntil(function () { return !calibrating; });
    console.log("Press the spacebar to end calibration and start running...");
    
    stdin.on("keypress", function(chunk, key) {
        if (!key || key.name !== 'space') return;
        
        calibrating = false;
        console.log(eyes.calibration.max);
        running = !running;
        
        if (!running) {
            wheels.stop();
            console.log("Stopped running. Press the spacebar to start again...")
        }
    });

    eyes.on("line", function(err, line) {
        if(!running) return;
    

        // check for stop line
        var lcount = 0;
        for (i = 0; i < 6; i++) {
            if (eyes.raw[i] > 0.8 * eyes.calibration.max[i])
                lcount++;
        }

        if (lcount == 6) {
            console.log("Finish!");
            wheels.stop();
            running = false;
            return;
        }
        wheels.steer((line - 2500) / 2500);

        console.log(line);
    });
    
    eyes.enable();
});

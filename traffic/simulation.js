const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Constants (in meters)
const LANE_WIDTH = 3.75;
const CAR_WIDTH = 2.0;
const CAR_LENGTH = 4.6;

// Configurable settings - will be overwritten by HTML input values on load
let MIN_SPEED_KMH = 80;
let MAX_SPEED_KMH = 90;
let HIGHWAY_LENGTH_KM = 1;
let HIGHWAY_LENGTH_M = HIGHWAY_LENGTH_KM * 1000;
let NUM_CARS = 10;
let FOLLOWING_DISTANCE_SECONDS = 2.0;

// Car behavior constants
const NORMAL_BRAKE_RATE = 2.0; // m/s² - realistic braking deceleration
const EMERGENCY_BRAKE_RATE = 4.0; // m/s² - emergency braking (twice as hard)
const ACCELERATION_RATE = 1.5; // m/s² - realistic acceleration
const LANE_CHANGE_CLEARANCE = 6.0; // meters - clearance needed before/after for lane change
const RIGHT_LANE_RETURN_TIME = 4.0; // seconds - check 4 seconds ahead in right lane before returning

// Canvas settings - wide oval
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Calculate scale (pixels per meter)
let scale;
let ovalA; // semi-major axis (horizontal)
let ovalB; // semi-minor axis (vertical)

// Car state - array of cars
let cars = [];
let lastTime = Date.now();

function initializeCars() {
    cars = [];
    const minCarDistance = 24; // Minimum 24 meters between cars

    // Create cars with random positions and speeds, ensuring they don't overlap
    for (let i = 0; i < NUM_CARS; i++) {
        const randomSpeed = MIN_SPEED_KMH + Math.random() * (MAX_SPEED_KMH - MIN_SPEED_KMH);
        let randomPosition;
        let attempts = 0;
        const maxAttempts = 100;

        // Try to find a position that's not too close to existing cars
        do {
            randomPosition = Math.random() * HIGHWAY_LENGTH_M;
            attempts++;

            // Check if this position is far enough from all existing cars
            let isTooClose = false;
            for (let j = 0; j < cars.length; j++) {
                let distance = Math.abs(cars[j].position - randomPosition);
                // Account for wraparound on the loop
                distance = Math.min(distance, HIGHWAY_LENGTH_M - distance);

                if (distance < minCarDistance) {
                    isTooClose = true;
                    break;
                }
            }

            if (!isTooClose || attempts >= maxAttempts) {
                break;
            }
        } while (attempts < maxAttempts);

        cars.push({
            position: randomPosition,
            lane: 'right',
            targetLane: 'right',
            lanePosition: 1.0, // 0.0 = left lane, 1.0 = right lane (smooth transition)
            desiredSpeed: randomSpeed / 3.6, // Convert to m/s
            currentSpeed: randomSpeed / 3.6,
            previousSpeed: randomSpeed / 3.6,
            color: '#ffffff',
            transitionTimer: 0,
            transitionDuration: 1.0 + Math.random() * 1.0, // Random 1-2 seconds
            isBraking: false,
            brakeTimer: 0,
            isEmergencyBraking: false, // For blinking red
            emergencyBlinkTimer: 0
        });
    }
}

function calculateScale() {
    // For a rounded rectangle track
    const margin = 50; // pixels
    const availableWidth = CANVAS_WIDTH - margin * 2;
    const availableHeight = CANVAS_HEIGHT - margin * 2;

    ovalA = availableWidth / 2;
    ovalB = availableHeight / 2;

    const cornerRadiusPx = Math.min(availableHeight, availableWidth) / 2;
    const straightLength = availableWidth - 2 * cornerRadiusPx;
    const curveLength = Math.PI * cornerRadiusPx;
    const perimeterPx = 2 * straightLength + 2 * curveLength;

    scale = perimeterPx / HIGHWAY_LENGTH_M;

    // Recalculate dimensions in meters
    ovalA = ovalA / scale;
    ovalB = ovalB / scale;

    return scale;
}

function updateInfo() {
    const avgSpeed = (MIN_SPEED_KMH + MAX_SPEED_KMH) / 2;
    const loopTimeSeconds = HIGHWAY_LENGTH_M / (avgSpeed / 3.6);

    document.getElementById('specs').innerHTML = `
        <strong>Highway Length:</strong> ${HIGHWAY_LENGTH_KM} km (${HIGHWAY_LENGTH_M} m)<br>
        <strong>Oval Dimensions:</strong> ${(ovalA * 2).toFixed(2)}m × ${(ovalB * 2).toFixed(2)}m<br>
        <strong>Lanes:</strong> 4 total (2 each direction), ${LANE_WIDTH}m wide each<br>
        <strong>Car:</strong> ${CAR_LENGTH}m long × ${CAR_WIDTH}m wide
    `;

    document.getElementById('scaleInfo').textContent =
        `1 pixel = ${(1/scale).toFixed(2)} meters`;

    document.getElementById('speedInfo').textContent =
        `${MIN_SPEED_KMH} - ${MAX_SPEED_KMH} km/h`;

    document.getElementById('loopTime').textContent =
        `~${loopTimeSeconds.toFixed(2)} seconds (${(loopTimeSeconds/60).toFixed(2)} minutes) per lap at avg speed`;
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

function drawHighway() {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const trackWidth = ovalA * 2 * scale;
    const trackHeight = ovalB * 2 * scale;
    const innerWidth = (ovalA - LANE_WIDTH * 2) * 2 * scale;
    const innerHeight = (ovalB - LANE_WIDTH * 2) * 2 * scale;
    const lane1Width = (ovalA - LANE_WIDTH) * 2 * scale;
    const lane1Height = (ovalB - LANE_WIDTH) * 2 * scale;
    const lane2Width = (ovalA + LANE_WIDTH) * 2 * scale;
    const lane2Height = (ovalB + LANE_WIDTH) * 2 * scale;
    const outerWidth = (ovalA + LANE_WIDTH * 2) * 2 * scale;
    const outerHeight = (ovalB + LANE_WIDTH * 2) * 2 * scale;

    const cornerRadius = Math.min(trackHeight, trackWidth) / 2;
    const innerCornerRadius = cornerRadius - LANE_WIDTH * 2 * scale;
    const lane1CornerRadius = cornerRadius - LANE_WIDTH * scale;
    const centerCornerRadius = cornerRadius;
    const lane2CornerRadius = cornerRadius + LANE_WIDTH * scale;
    const outerCornerRadius = cornerRadius + LANE_WIDTH * 2 * scale;

    ctx.fillStyle = '#34495e';
    drawRoundedRect(centerX - outerWidth/2, centerY - outerHeight/2, outerWidth, outerHeight, outerCornerRadius);
    ctx.fill();

    ctx.fillStyle = '#1e272e';
    drawRoundedRect(centerX - innerWidth/2, centerY - innerHeight/2, innerWidth, innerHeight, innerCornerRadius);
    ctx.fill();

    ctx.strokeStyle = '#f5f6fa';
    ctx.lineWidth = 2;
    drawRoundedRect(centerX - outerWidth/2, centerY - outerHeight/2, outerWidth, outerHeight, outerCornerRadius);
    ctx.stroke();
    drawRoundedRect(centerX - innerWidth/2, centerY - innerHeight/2, innerWidth, innerHeight, innerCornerRadius);
    ctx.stroke();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    drawRoundedRect(centerX - lane1Width/2, centerY - lane1Height/2, lane1Width, lane1Height, lane1CornerRadius);
    ctx.stroke();

    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    drawRoundedRect(centerX - trackWidth/2, centerY - trackHeight/2, trackWidth, trackHeight, centerCornerRadius);
    ctx.stroke();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    drawRoundedRect(centerX - lane2Width/2, centerY - lane2Height/2, lane2Width, lane2Height, lane2CornerRadius);
    ctx.stroke();

    ctx.setLineDash([]);
}

function getCarPosition(carPosition, lanePosition) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    const trackWidth = ovalA * 2 * scale;
    const trackHeight = ovalB * 2 * scale;
    const cornerRadius = Math.min(trackHeight, trackWidth) / 2;

    const leftLaneOffset = LANE_WIDTH * 0.5 * scale;
    const rightLaneOffset = LANE_WIDTH * 1.5 * scale;
    const laneOffset = leftLaneOffset + (rightLaneOffset - leftLaneOffset) * lanePosition;

    const straightLength = (trackWidth - 2 * cornerRadius);
    const curveLength = Math.PI * cornerRadius;
    const totalPerimeter = 2 * straightLength + 2 * curveLength;

    const pos = (carPosition * scale) % totalPerimeter;

    let carX, carY, angle;

    if (pos < straightLength) {
        carX = centerX - trackWidth/2 + cornerRadius + pos;
        carY = centerY - trackHeight/2 + laneOffset;
        angle = 0;
    } else if (pos < straightLength + curveLength) {
        const arcPos = pos - straightLength;
        const arcAngle = arcPos / cornerRadius;
        carX = centerX + trackWidth/2 - cornerRadius + (cornerRadius - laneOffset) * Math.sin(arcAngle);
        carY = centerY - trackHeight/2 + cornerRadius - (cornerRadius - laneOffset) * Math.cos(arcAngle);
        angle = arcAngle;
    } else if (pos < 2 * straightLength + curveLength) {
        const straightPos = pos - straightLength - curveLength;
        carX = centerX + trackWidth/2 - cornerRadius - straightPos;
        carY = centerY + trackHeight/2 - laneOffset;
        angle = Math.PI;
    } else {
        const arcPos = pos - 2 * straightLength - curveLength;
        const arcAngle = arcPos / cornerRadius;
        carX = centerX - trackWidth/2 + cornerRadius - (cornerRadius - laneOffset) * Math.sin(arcAngle);
        carY = centerY + trackHeight/2 - cornerRadius + (cornerRadius - laneOffset) * Math.cos(arcAngle);
        angle = Math.PI + arcAngle;
    }

    return { carX, carY, angle };
}

function drawCar(car) {
    const { carX, carY, angle } = getCarPosition(car.position, car.lanePosition);

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(angle + Math.PI / 2);

    const carWidthPx = CAR_WIDTH * scale;
    const carLengthPx = CAR_LENGTH * scale;

    // Emergency braking: blink red (4 times per second)
    let carColor = car.color;
    if (car.isEmergencyBraking) {
        const blinkFrequency = 8;
        const isRedPhase = Math.floor(car.emergencyBlinkTimer * blinkFrequency) % 2 === 0;
        carColor = isRedPhase ? '#FF0000' : car.color;
    }

    ctx.fillStyle = carColor;
    ctx.fillRect(-carWidthPx / 2, -carLengthPx / 2, carWidthPx, carLengthPx);

    ctx.fillStyle = '#34495e';
    ctx.fillRect(-carWidthPx / 2 + 2, -carLengthPx / 2 + 5, carWidthPx - 4, carLengthPx / 3);

    // Brake lights
    if (car.isBraking) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-carWidthPx / 2 + 2, carLengthPx / 2 - 1);
        ctx.lineTo(carWidthPx / 2 - 2, carLengthPx / 2 - 1);
        ctx.stroke();
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-carWidthPx / 2, -carLengthPx / 2, carWidthPx, carLengthPx);

    ctx.restore();
}

// Helper functions for car detection
function getDistanceToCarAhead(car, carIndex, targetLane = null) {
    const checkLane = targetLane !== null ? targetLane : car.targetLane;
    let minDistance = Infinity;
    let carAhead = null;

    for (let i = 0; i < cars.length; i++) {
        if (i === carIndex) continue;
        const otherCar = cars[i];

        // Check cars in target lane or transitioning to target lane
        const otherCarLane = otherCar.targetLane;
        if (otherCarLane !== checkLane) continue;

        let distance = otherCar.position - car.position;
        if (distance < 0) distance += HIGHWAY_LENGTH_M;

        if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            carAhead = otherCar;
        }
    }

    return { distance: minDistance, carAhead: carAhead };
}

function getDistanceToCarBehind(car, carIndex, targetLane = null) {
    const checkLane = targetLane !== null ? targetLane : car.lane;
    let minDistance = Infinity;
    let carBehind = null;

    for (let i = 0; i < cars.length; i++) {
        if (i === carIndex) continue;
        const otherCar = cars[i];

        const otherCarLane = otherCar.targetLane;
        if (otherCarLane !== checkLane) continue;

        let distance = car.position - otherCar.position;
        if (distance < 0) distance += HIGHWAY_LENGTH_M;

        if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            carBehind = otherCar;
        }
    }

    return { distance: minDistance, carBehind: carBehind };
}

function simulateTimeStep(deltaTime) {
    // Update emergency blink timers
    for (let car of cars) {
        if (car.isEmergencyBraking) {
            car.emergencyBlinkTimer += deltaTime;
            if (car.emergencyBlinkTimer >= 1.0) {
                car.isEmergencyBraking = false;
                car.emergencyBlinkTimer = 0;
            }
        }
    }

    // RULE: Lane changes
    for (let i = 0; i < cars.length; i++) {
        const car = cars[i];

        // Only change lanes if not currently transitioning
        if (car.targetLane === car.lane) {
            if (car.lane === 'right') {
                // Rule: Move to left lane if there's a slower car ahead AND left lane is clear (6m before/after)
                const { distance: distRightAhead, carAhead: carRightAhead } = getDistanceToCarAhead(car, i, 'right');

                // Only change lanes if there's a car ahead that's slower
                if (carRightAhead && carRightAhead.desiredSpeed < car.desiredSpeed) {
                    const { distance: distAhead } = getDistanceToCarAhead(car, i, 'left');
                    const { distance: distBehind } = getDistanceToCarBehind(car, i, 'left');

                    if (distAhead >= LANE_CHANGE_CLEARANCE && distBehind >= LANE_CHANGE_CLEARANCE) {
                        car.targetLane = 'left';
                        car.transitionTimer = 0;
                    }
                }
            } else if (car.lane === 'left') {
                // Rule: Return to right lane when no slower car in right lane within 4 seconds
                // New rule: Don't return if driving slower than desired speed
                const isAtDesiredSpeed = car.currentSpeed >= car.desiredSpeed - 0.5; // Allow small tolerance

                if (isAtDesiredSpeed) {
                    const { distance: distRightAhead, carAhead: carRightAhead } = getDistanceToCarAhead(car, i, 'right');
                    const fourSecondDistance = car.currentSpeed * RIGHT_LANE_RETURN_TIME;

                    let canReturn = true;
                    if (carRightAhead && distRightAhead < fourSecondDistance) {
                        if (carRightAhead.desiredSpeed < car.desiredSpeed) {
                            canReturn = false;
                        }
                    }

                    if (canReturn) {
                        const { distance: distAhead } = getDistanceToCarAhead(car, i, 'right');
                        const { distance: distBehind } = getDistanceToCarBehind(car, i, 'right');

                        if (distAhead >= LANE_CHANGE_CLEARANCE && distBehind >= LANE_CHANGE_CLEARANCE) {
                            car.targetLane = 'right';
                            car.transitionTimer = 0;
                        }
                    }
                }
            }
        }

        // Smoothly transition between lanes
        if (car.targetLane !== car.lane) {
            car.transitionTimer += deltaTime;
            const progress = Math.min(car.transitionTimer / car.transitionDuration, 1.0);

            if (car.targetLane === 'left') {
                car.lanePosition = 1.0 - progress;
            } else {
                car.lanePosition = progress;
            }

            if (progress >= 1.0) {
                car.lane = car.targetLane;
                car.lanePosition = car.targetLane === 'left' ? 0.0 : 1.0;
            }
        }
    }

    // RULE: Speed control
    for (let i = 0; i < cars.length; i++) {
        const car = cars[i];

        const { distance, carAhead } = getDistanceToCarAhead(car, i);
        const emergencyThreshold = car.currentSpeed * 0.5; // 0.5 seconds
        const safeDistance = car.currentSpeed * FOLLOWING_DISTANCE_SECONDS;

        let targetSpeed = car.desiredSpeed;
        let brakeRate = 0;

        if (carAhead) {
            // Rule: Emergency brake (twice as hard) when closer than 0.5 seconds
            if (distance < emergencyThreshold) {
                targetSpeed = carAhead.currentSpeed - (20 / 3.6); // 20 km/h slower
                brakeRate = EMERGENCY_BRAKE_RATE;
            }
            // Rule: Normal brake when encountering slower car
            else if (distance < safeDistance && carAhead.currentSpeed < car.currentSpeed) {
                targetSpeed = carAhead.currentSpeed;
                brakeRate = NORMAL_BRAKE_RATE;
            }
        }

        // Apply braking or acceleration
        if (targetSpeed < car.currentSpeed) {
            // Braking
            car.currentSpeed = Math.max(targetSpeed, car.currentSpeed - brakeRate * deltaTime);

            if (car.currentSpeed < car.previousSpeed - 0.1) {
                car.isBraking = true;
                car.brakeTimer = 0;
            }
        } else if (targetSpeed > car.currentSpeed) {
            // Rule: Accelerate to desired speed with realistic acceleration
            car.currentSpeed = Math.min(targetSpeed, car.currentSpeed + ACCELERATION_RATE * deltaTime);

            if (car.isBraking) {
                car.brakeTimer += deltaTime;
                if (car.brakeTimer >= 0.5) {
                    car.isBraking = false;
                }
            }
        } else {
            if (car.isBraking) {
                car.brakeTimer += deltaTime;
                if (car.brakeTimer >= 0.5) {
                    car.isBraking = false;
                }
            }
        }

        car.previousSpeed = car.currentSpeed;
    }

    // Update car positions
    for (let car of cars) {
        car.position += car.currentSpeed * deltaTime;
        if (car.position >= HIGHWAY_LENGTH_M) {
            car.position -= HIGHWAY_LENGTH_M;
        }
    }
}

function animate() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    simulateTimeStep(deltaTime);

    drawHighway();
    for (let car of cars) {
        drawCar(car);
    }

    requestAnimationFrame(animate);
}

function updateSimulation() {
    HIGHWAY_LENGTH_KM = parseFloat(document.getElementById('lengthInput').value);
    HIGHWAY_LENGTH_M = HIGHWAY_LENGTH_KM * 1000;

    MIN_SPEED_KMH = parseFloat(document.getElementById('minSpeedInput').value);
    MAX_SPEED_KMH = parseFloat(document.getElementById('maxSpeedInput').value);
    FOLLOWING_DISTANCE_SECONDS = parseFloat(document.getElementById('followingDistanceInput').value);

    NUM_CARS = parseInt(document.getElementById('carsInput').value);

    calculateScale();
    updateInfo();
    initializeCars();

    // Run 10 seconds of simulation before displaying
    const warmupTime = 10.0;
    const timeStep = 0.05;
    const steps = Math.floor(warmupTime / timeStep);

    for (let i = 0; i < steps; i++) {
        simulateTimeStep(timeStep);
    }
}

function triggerRandomBrake() {
    if (cars.length === 0) return;

    const randomIndex = Math.floor(Math.random() * cars.length);
    const car = cars[randomIndex];

    car.currentSpeed = car.currentSpeed / 2;
    car.desiredSpeed = car.currentSpeed;
    car.isBraking = true;
    car.brakeTimer = 0;
    car.isEmergencyBraking = true;
    car.emergencyBlinkTimer = 0;

    setTimeout(() => {
        car.desiredSpeed = (MIN_SPEED_KMH + Math.random() * (MAX_SPEED_KMH - MIN_SPEED_KMH)) / 3.6;
    }, 2000);
}

// Initialize
updateSimulation();
animate();

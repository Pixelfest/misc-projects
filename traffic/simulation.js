const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Constants (in meters)
const LANE_WIDTH = 3.75;
const CAR_WIDTH = 2.0;
const CAR_LENGTH = 4.6;

// Configurable settings
let MIN_SPEED_KMH = 80;
let MAX_SPEED_KMH = 90;
let HIGHWAY_LENGTH_KM = 1;
let HIGHWAY_LENGTH_M = HIGHWAY_LENGTH_KM * 1000;
let NUM_CARS = 1;
let FOLLOWING_DISTANCE_SECONDS = 2.0;

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
    // Half the cars in left lane, half in right lane
    const carsPerLane = Math.ceil(NUM_CARS / 2);
    const slowCars = NUM_CARS - carsPerLane;

    // Left lane cars
    for (let i = 0; i < carsPerLane; i++) {
        const randomSpeed = MIN_SPEED_KMH + Math.random() * (MAX_SPEED_KMH - MIN_SPEED_KMH);
        cars.push({
            position: (HIGHWAY_LENGTH_M / carsPerLane) * i,
            lane: 'left',
            desiredSpeed: randomSpeed / 3.6, // Convert to m/s
            currentSpeed: randomSpeed / 3.6,
            color: `hsl(${(360 / carsPerLane) * i}, 70%, 55%)`
        });
    }

    // Right lane cars
    for (let i = 0; i < slowCars; i++) {
        const randomSpeed = MIN_SPEED_KMH + Math.random() * (MAX_SPEED_KMH - MIN_SPEED_KMH);
        cars.push({
            position: (HIGHWAY_LENGTH_M / slowCars) * i + (HIGHWAY_LENGTH_M / (slowCars * 2)),
            lane: 'right',
            desiredSpeed: randomSpeed / 3.6,
            currentSpeed: randomSpeed / 3.6,
            color: `hsl(${(360 / slowCars) * i + 180}, 70%, 55%)`
        });
    }
}

function calculateScale() {
    // For a rounded rectangle track
    const margin = 50; // pixels
    const totalLanesWidth = LANE_WIDTH * 4; // 2 lanes each side

    // Set dimensions to fill the screen
    const availableWidth = CANVAS_WIDTH - margin * 2;
    const availableHeight = CANVAS_HEIGHT - margin * 2;

    // Track dimensions in pixels
    const trackWidthPx = availableWidth;
    const trackHeightPx = availableHeight;

    ovalA = trackWidthPx / 2;
    ovalB = trackHeightPx / 2;

    // Corner radius
    const cornerRadiusPx = Math.min(trackHeightPx, trackWidthPx) / 2;

    // Calculate perimeter: 2 straights + 2 semicircles
    const straightLength = trackWidthPx - 2 * cornerRadiusPx;
    const curveLength = Math.PI * cornerRadiusPx;
    const perimeterPx = 2 * straightLength + 2 * curveLength;

    // Now calculate scale based on desired highway length
    scale = perimeterPx / HIGHWAY_LENGTH_M;

    // Recalculate dimensions in meters for info display
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

    // Draw grass background
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Calculate dimensions for each lane boundary (in pixels)
    const trackWidth = ovalA * 2 * scale;
    const trackHeight = ovalB * 2 * scale;

    const innerWidth = (ovalA - LANE_WIDTH * 2) * 2 * scale;
    const innerHeight = (ovalB - LANE_WIDTH * 2) * 2 * scale;
    const lane1Width = (ovalA - LANE_WIDTH) * 2 * scale;
    const lane1Height = (ovalB - LANE_WIDTH) * 2 * scale;
    const centerLineWidth = trackWidth;
    const centerLineHeight = trackHeight;
    const lane2Width = (ovalA + LANE_WIDTH) * 2 * scale;
    const lane2Height = (ovalB + LANE_WIDTH) * 2 * scale;
    const outerWidth = (ovalA + LANE_WIDTH * 2) * 2 * scale;
    const outerHeight = (ovalB + LANE_WIDTH * 2) * 2 * scale;

    // Corner radius should be roughly equal to the shorter dimension
    const cornerRadius = Math.min(trackHeight, trackWidth) / 2;

    // Adjust corner radii for each lane to maintain parallel curves
    const innerCornerRadius = cornerRadius - LANE_WIDTH * 2 * scale;
    const lane1CornerRadius = cornerRadius - LANE_WIDTH * scale;
    const centerCornerRadius = cornerRadius;
    const lane2CornerRadius = cornerRadius + LANE_WIDTH * scale;
    const outerCornerRadius = cornerRadius + LANE_WIDTH * 2 * scale;

    // Draw outer asphalt
    ctx.fillStyle = '#34495e';
    drawRoundedRect(centerX - outerWidth/2, centerY - outerHeight/2, outerWidth, outerHeight, outerCornerRadius);
    ctx.fill();

    // Cut out inner area
    ctx.fillStyle = '#1e272e';
    drawRoundedRect(centerX - innerWidth/2, centerY - innerHeight/2, innerWidth, innerHeight, innerCornerRadius);
    ctx.fill();

    // Draw outer edge
    ctx.strokeStyle = '#f5f6fa';
    ctx.lineWidth = 2;
    drawRoundedRect(centerX - outerWidth/2, centerY - outerHeight/2, outerWidth, outerHeight, outerCornerRadius);
    ctx.stroke();

    // Draw inner edge
    drawRoundedRect(centerX - innerWidth/2, centerY - innerHeight/2, innerWidth, innerHeight, innerCornerRadius);
    ctx.stroke();

    // Draw lane dividers (dashed yellow lines)
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);

    // Inner lane divider
    drawRoundedRect(centerX - lane1Width/2, centerY - lane1Height/2, lane1Width, lane1Height, lane1CornerRadius);
    ctx.stroke();

    // Center line (solid yellow)
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    drawRoundedRect(centerX - centerLineWidth/2, centerY - centerLineHeight/2, centerLineWidth, centerLineHeight, centerCornerRadius);
    ctx.stroke();

    // Outer lane divider
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    drawRoundedRect(centerX - lane2Width/2, centerY - lane2Height/2, lane2Width, lane2Height, lane2CornerRadius);
    ctx.stroke();

    ctx.setLineDash([]);
}

function getCarPosition(carPosition, lane) {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Car travels in the bottom lanes (right side of center divider)
    const trackWidth = ovalA * 2 * scale;
    const trackHeight = ovalB * 2 * scale;
    const cornerRadius = Math.min(trackHeight, trackWidth) / 2;

    // Left lane (inner) vs right lane (outer)
    const laneOffset = lane === 'left' ? LANE_WIDTH * 0.5 * scale : LANE_WIDTH * 1.5 * scale;

    // Calculate track perimeter (2 straights + 2 semicircles)
    const straightLength = (trackWidth - 2 * cornerRadius);
    const curveLength = Math.PI * cornerRadius;
    const totalPerimeter = 2 * straightLength + 2 * curveLength;

    // Normalize position to [0, totalPerimeter]
    const pos = (carPosition * scale) % totalPerimeter;

    let carX, carY, angle;

    // Top straight (moving right, in the bottom lane of top section)
    if (pos < straightLength) {
        carX = centerX - trackWidth/2 + cornerRadius + pos;
        carY = centerY - trackHeight/2 + laneOffset;
        angle = 0;
    }
    // Top-right corner (in the bottom lane)
    else if (pos < straightLength + curveLength) {
        const arcPos = pos - straightLength;
        const arcAngle = arcPos / cornerRadius;
        carX = centerX + trackWidth/2 - cornerRadius + (cornerRadius - laneOffset) * Math.sin(arcAngle);
        carY = centerY - trackHeight/2 + cornerRadius - (cornerRadius - laneOffset) * Math.cos(arcAngle);
        angle = arcAngle;
    }
    // Bottom straight (moving left, in the bottom lane of bottom section)
    else if (pos < 2 * straightLength + curveLength) {
        const straightPos = pos - straightLength - curveLength;
        carX = centerX + trackWidth/2 - cornerRadius - straightPos;
        carY = centerY + trackHeight/2 - laneOffset;
        angle = Math.PI;
    }
    // Bottom-left corner (in the bottom lane)
    else {
        const arcPos = pos - 2 * straightLength - curveLength;
        const arcAngle = arcPos / cornerRadius;
        carX = centerX - trackWidth/2 + cornerRadius - (cornerRadius - laneOffset) * Math.sin(arcAngle);
        carY = centerY + trackHeight/2 - cornerRadius + (cornerRadius - laneOffset) * Math.cos(arcAngle);
        angle = Math.PI + arcAngle;
    }

    return { carX, carY, angle };
}

function drawCar(car) {
    const { carX, carY, angle } = getCarPosition(car.position, car.lane);

    // Draw car
    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(angle + Math.PI / 2); // Add 90 degrees to fix orientation

    // Car body
    const carWidthPx = CAR_WIDTH * scale;
    const carLengthPx = CAR_LENGTH * scale;

    ctx.fillStyle = car.color;
    ctx.fillRect(-carWidthPx / 2, -carLengthPx / 2, carWidthPx, carLengthPx);

    // Car windows
    ctx.fillStyle = '#34495e';
    ctx.fillRect(-carWidthPx / 2 + 2, -carLengthPx / 2 + 5, carWidthPx - 4, carLengthPx / 3);

    // Car outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-carWidthPx / 2, -carLengthPx / 2, carWidthPx, carLengthPx);

    ctx.restore();
}

function getDistanceToCarAhead(car, carIndex) {
    // Find the next car in the same lane
    let minDistance = Infinity;
    let carAheadSpeed = null;

    for (let i = 0; i < cars.length; i++) {
        if (i === carIndex) continue;
        const otherCar = cars[i];

        // Only check cars in the same lane
        if (otherCar.lane !== car.lane) continue;

        // Calculate distance (accounting for loop)
        let distance = otherCar.position - car.position;
        if (distance < 0) {
            distance += HIGHWAY_LENGTH_M;
        }

        if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            carAheadSpeed = otherCar.currentSpeed;
        }
    }

    return { distance: minDistance, speed: carAheadSpeed };
}

function animate() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // in seconds
    lastTime = currentTime;

    // Update car speeds based on following distance
    for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        const { distance, speed: carAheadSpeed } = getDistanceToCarAhead(car, i);

        // Calculate safe following distance based on current speed
        const safeDistance = car.currentSpeed * FOLLOWING_DISTANCE_SECONDS;

        if (distance < safeDistance && carAheadSpeed !== null) {
            // Match speed of car ahead (or slow down)
            car.currentSpeed = Math.min(car.currentSpeed, carAheadSpeed);
        } else {
            // Gradually accelerate back to desired speed
            if (car.currentSpeed < car.desiredSpeed) {
                car.currentSpeed = Math.min(car.desiredSpeed, car.currentSpeed + 2 * deltaTime); // Accelerate at 2 m/s²
            }
        }
    }

    // Update car positions
    for (let car of cars) {
        car.position += car.currentSpeed * deltaTime;

        // Loop around
        if (car.position >= HIGHWAY_LENGTH_M) {
            car.position -= HIGHWAY_LENGTH_M;
        }
    }

    // Draw
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
}

// Initialize
calculateScale();
updateInfo();
initializeCars();
animate();

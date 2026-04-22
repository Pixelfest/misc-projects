// Main simulation controller
let gameLoopService = null;
let people = [];

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusDiv = document.getElementById('status');

    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);

    function getSettings() {
        return {
            yearsToSimulate: parseInt(document.getElementById('yearsToSimulate').value),
            initialPopulation: parseInt(document.getElementById('initialPopulation').value),
            sameSexCouplePercentage: parseFloat(document.getElementById('sameSexPercentage').value),
            maxAgeDifference: parseInt(document.getElementById('maxAgeDifference').value),
            coupleWantsChildrenPercentage: parseFloat(document.getElementById('coupleWantsChildrenPercentage').value),
            minChildren: parseInt(document.getElementById('minChildren').value),
            maxChildren: parseInt(document.getElementById('maxChildren').value),
            minimumRelationshipYearsForChildren: parseInt(document.getElementById('minRelationshipYears').value),
            maxAgeForChildren: parseInt(document.getElementById('maxAgeForChildren').value),
            minimumGapBetweenChildrenMonths: parseFloat(document.getElementById('minGapBetweenChildren').value),
            annualConceptionProbability: parseFloat(document.getElementById('conceptionProbability').value),
            mortalityStartAge: parseInt(document.getElementById('mortalityStartAge').value),
            maximumAge: parseInt(document.getElementById('maximumAge').value)
        };
    }

    async function startSimulation() {
        const settings = getSettings();

        // Disable settings form
        document.getElementById('settingsForm').querySelectorAll('input').forEach(input => {
            input.disabled = true;
        });
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        // Initialize services
        const personFactory = new PersonFactory();
        const statisticsService = new StatisticsService();
        const partnerMatchingService = new PartnerMatchingService(settings);
        gameLoopService = new GameLoopService(partnerMatchingService, statisticsService, personFactory, settings);

        // Generate initial population
        statusDiv.textContent = `Generating ${settings.initialPopulation} people...`;
        people = personFactory.createPeople(settings.initialPopulation);

        // Display initial statistics
        const initialStats = statisticsService.calculateStatistics(people);
        statisticsService.displayStatistics(initialStats);

        statusDiv.textContent = `Running simulation for ${settings.yearsToSimulate} years...`;

        // Run simulation
        const startTime = Date.now();
        const daysToSimulate = 365 * settings.yearsToSimulate;

        const yearsPassed = await gameLoopService.runDays(people, daysToSimulate, (year) => {
            statusDiv.textContent = `Year ${year} / ${settings.yearsToSimulate} completed`;
        });

        const endTime = Date.now();
        const totalSeconds = (endTime - startTime) / 1000;

        if (gameLoopService.shouldStop) {
            statusDiv.textContent = `Simulation stopped at year ${yearsPassed}`;
        } else {
            statusDiv.textContent = `Simulation completed in ${totalSeconds.toFixed(2)} seconds`;
        }

        // Re-enable form
        document.getElementById('settingsForm').querySelectorAll('input').forEach(input => {
            input.disabled = false;
        });
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }

    function stopSimulation() {
        if (gameLoopService) {
            gameLoopService.stop();
            statusDiv.textContent = 'Stopping simulation...';
        }
    }
});

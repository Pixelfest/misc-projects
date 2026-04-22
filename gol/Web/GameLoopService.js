class GameLoopService {
    constructor(partnerMatchingService, statisticsService, personFactory, settings) {
        this.partnerMatchingService = partnerMatchingService;
        this.statisticsService = statisticsService;
        this.personFactory = personFactory;
        this.settings = settings;
        this.currentDate = new Date();
        this.isRunning = false;
        this.shouldStop = false;
    }

    async runDays(people, numberOfDays, onYearComplete) {
        this.isRunning = true;
        this.shouldStop = false;
        let yearsPassed = 0;
        const random = Math.random;

        for (let day = 0; day < numberOfDays && !this.shouldStop; day++) {
            this.currentDate.setDate(this.currentDate.getDate() + 1);

            // Advance day for all people
            for (const person of people) {
                person.advanceDay(this.currentDate);
            }

            // Process deaths
            for (const person of people) {
                if (person.isAlive && person.age >= this.settings.mortalityStartAge) {
                    const deathProbability = this.calculateDeathProbability(person.age);
                    if (random() < deathProbability / 365.0) {
                        person.die(this.currentDate);
                    }
                }
            }

            // Match partners
            this.partnerMatchingService.matchPartners(people, this.currentDate);

            // Generate children
            this.generateChildren(people);

            // Year completed
            if ((day + 1) % 365 === 0) {
                yearsPassed++;
                const stats = this.statisticsService.calculateStatistics(people);
                this.statisticsService.displayStatistics(stats);

                if (onYearComplete) {
                    onYearComplete(yearsPassed);
                }

                // Allow UI to update
                await this.sleep(0);
            }
        }

        this.isRunning = false;
        return yearsPassed;
    }

    generateChildren(people) {
        const processedCouples = new Set();

        for (const parent of people) {
            if (!parent.isAlive || !parent.hasPartner || !parent.partner.isAlive) {
                continue;
            }
            if (parent.gender === parent.partner.gender) {
                continue;
            }
            if (parent.relationshipDuration < 365 * this.settings.minimumRelationshipYearsForChildren * 24 * 60 * 60 * 1000) {
                continue;
            }
            if (parent.age >= this.settings.maxAgeForChildren || parent.partner.age >= this.settings.maxAgeForChildren) {
                continue;
            }
            if (parent.maxChildren <= 0 || parent.numberOfChildren >= parent.maxChildren) {
                continue;
            }

            const couple = parent.name < parent.partner.name
                ? `${parent.name}|${parent.partner.name}`
                : `${parent.partner.name}|${parent.name}`;

            if (processedCouples.has(couple)) {
                continue;
            }
            processedCouples.add(couple);

            if (parent.lastChildBirthDate) {
                const daysSinceLastChild = (this.currentDate - parent.lastChildBirthDate) / (1000 * 60 * 60 * 24);
                if (daysSinceLastChild < 365 * this.settings.minimumGapBetweenChildrenMonths / 12.0) {
                    continue;
                }
            }

            if (Math.random() < (this.settings.annualConceptionProbability / 100) / 365.0) {
                const child = this.personFactory.createChild(parent, parent.partner, this.currentDate);
                people.push(child);
                parent.addChild(child);
                parent.partner.addChild(child);
            }
        }
    }

    calculateDeathProbability(age) {
        if (age < this.settings.mortalityStartAge) return 0;
        if (age >= this.settings.maximumAge) return 1.0;

        const yearsAfterMortalityStart = age - this.settings.mortalityStartAge;
        return Math.min(1.0, 0.02 * Math.exp(0.15 * yearsAfterMortalityStart));
    }

    stop() {
        this.shouldStop = true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

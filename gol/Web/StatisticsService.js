class StatisticsService {
    calculateStatistics(people) {
        let alive = 0;
        let peopleInRelationship = 0;
        let totalChildren = 0;
        let parentsWithChildren = 0;
        const ageGroupCounts = {};

        for (const person of people) {
            if (person.isAlive) {
                alive++;

                const ageGroup = Math.floor(person.age / 10) * 10;
                if (!ageGroupCounts[ageGroup]) {
                    ageGroupCounts[ageGroup] = 0;
                }
                ageGroupCounts[ageGroup]++;
            }

            if (person.hasPartner) {
                peopleInRelationship++;
            }

            if (person.numberOfChildren > 0) {
                totalChildren += person.numberOfChildren;
                parentsWithChildren++;
            }
        }

        const dead = people.length - alive;
        const couplesWithChildren = Math.floor(parentsWithChildren / 2);
        const averageChildrenPerCouple = couplesWithChildren > 0
            ? totalChildren / parentsWithChildren
            : 0;

        const peopleSingle = people.length - peopleInRelationship;

        return {
            total: people.length,
            alive,
            dead,
            alivePercent: (alive / people.length * 100).toFixed(1),
            deadPercent: (dead / people.length * 100).toFixed(1),
            peopleInRelationship,
            relationshipPercent: (peopleInRelationship / people.length * 100).toFixed(1),
            peopleSingle,
            singlePercent: (peopleSingle / people.length * 100).toFixed(1),
            totalChildren: Math.floor(totalChildren / 2),
            couplesWithChildren,
            averageChildrenPerCouple: averageChildrenPerCouple.toFixed(1),
            ageGroupCounts
        };
    }

    displayStatistics(stats) {
        // Update population
        document.getElementById('totalPopulation').textContent = stats.total;
        document.getElementById('alivePopulation').textContent = stats.alive;
        document.getElementById('alivePercent').textContent = `(${stats.alivePercent}%)`;
        document.getElementById('deadPopulation').textContent = stats.dead;
        document.getElementById('deadPercent').textContent = `(${stats.deadPercent}%)`;

        // Update relationships
        document.getElementById('inRelationship').textContent = stats.peopleInRelationship;
        document.getElementById('relationshipPercent').textContent = `(${stats.relationshipPercent}%)`;
        document.getElementById('single').textContent = stats.peopleSingle;
        document.getElementById('singlePercent').textContent = `(${stats.singlePercent}%)`;

        // Update children
        document.getElementById('totalChildren').textContent = stats.totalChildren;
        document.getElementById('couplesWithChildren').textContent = stats.couplesWithChildren;
        document.getElementById('avgChildren').textContent = stats.averageChildrenPerCouple;

        // Update age groups
        const ageGroupsDiv = document.getElementById('ageGroups');
        ageGroupsDiv.innerHTML = '';

        const sortedAgeGroups = Object.keys(stats.ageGroupCounts)
            .map(Number)
            .sort((a, b) => a - b);

        for (const ageGroup of sortedAgeGroups) {
            const rangeStart = ageGroup;
            const rangeEnd = rangeStart + 9;
            const count = stats.ageGroupCounts[ageGroup];

            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <span class="stat-label">${rangeStart}-${rangeEnd}:</span>
                <span class="stat-value">${count}</span>
            `;
            ageGroupsDiv.appendChild(div);
        }
    }
}

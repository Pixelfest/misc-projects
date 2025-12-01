// Create a default person (70kg male)
const person1 = new Person("male", 70, 180);
const drinkingPerson = new DrinkingPerson(person1);
let editingIndex = -1;

// Initialize chart
const ctx = document.getElementById('alcoholChart').getContext('2d');
let alcoholChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Alcohol Level (‰)',
                data: [],
                borderColor: '#00dbde',
                backgroundColor: 'rgba(0, 219, 222, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Safety Limit',
                data: [],
                borderColor: '#4CAF50',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Promille (‰)',
                    color: 'white'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'white'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time',
                    color: 'white'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'white'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        if (context.datasetIndex === 0) {
                            return `Alcohol Level: ${context.parsed.y.toFixed(3)}‰`;
                        }
                        return `Safety Limit: 0.500‰`;
                    }
                }
            }
        }
    }
});

function updateDrinksTable() {
    const tbody = document.getElementById('drinksTableBody');
    tbody.innerHTML = '';

    drinkingPerson.drinks.forEach((drink, index) => {
        const row = document.createElement('tr');
        const time = new Date(drink.startTime);
        const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
                    <td>${timeStr}</td>
                    <td>${drink.name}</td>
                    <td>${drink.size}</td>
                    <td>${drink.percentage}</td>
                    <td>${drink.alcoholGram.toFixed(2)}</td>
                    <td>${drink.duration / 60000}</td>
                    <td class="action-buttons">
                        <button class="edit-btn" onclick="editDrink(${index})">Edit</button>
                        <button class="delete-btn" onclick="deleteDrink(${index})">Delete</button>
                    </td>
                `;

        tbody.appendChild(row);
    });
}

function editDrink(index) {
    const drink = drinkingPerson.drinks[index];
    const time = new Date(drink.startTime);
    const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    document.getElementById('drinkName').value = drink.name;
    document.getElementById('drinkTime').value = timeStr;
    document.getElementById('drinkSize').value = drink.size;
    document.getElementById('drinkPercentage').value = drink.percentage;
    document.getElementById('drinkDuration').value = drink.duration / 60000;

    editingIndex = index;
    document.querySelector('button[type="submit"]').textContent = 'Save Changes';
}

function deleteDrink(index) {
    drinkingPerson.drinks.splice(index, 1);
    drinkingPerson.calculate();
    updateDrinksTable();
    updateChart();
}

document.getElementById('drinkForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const drinkName = document.getElementById('drinkName').value;
    const drinkTime = document.getElementById('drinkTime').value;
    const drinkSize = parseFloat(document.getElementById('drinkSize').value);
    const drinkPercentage = parseFloat(document.getElementById('drinkPercentage').value);
    const drinkDuration = parseFloat(document.getElementById('drinkDuration').value);

    // Parse time string to Date object
    const [hours, minutes] = drinkTime.split(':');
    const drinkDateTime = new Date();
    drinkDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const drink = new Drink(drinkDateTime, drinkDuration, drinkSize, drinkPercentage, drinkName);

    if (editingIndex >= 0) {
        drinkingPerson.drinks[editingIndex] = drink;
        editingIndex = -1;
        document.querySelector('button[type="submit"]').textContent = 'Add Drink';
    } else {
        drinkingPerson.addDrink(drink);
    }

    drinkingPerson.calculate();
    updateDrinksTable();
    updateChart();

    // Reset form
    this.reset();
});

function updateChart() {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);

    const labels = [];
    const data = [];
    const safetyData = [];

    for (let time = startTime; time <= endTime; time.setMinutes(time.getMinutes() + 5)) {
        const state = drinkingPerson.timeLine.find(s =>
            Math.abs(s.time.getTime() - time.getTime()) < 2.5 * 60 * 1000
        );

        if (state) {
            labels.push(time.toLocaleTimeString());
            data.push(state.promille);
            safetyData.push(0.5); // Safety limit line
        }
    }

    alcoholChart.data.labels = labels;
    alcoholChart.data.datasets[0].data = data;
    alcoholChart.data.datasets[1].data = safetyData;
    alcoholChart.update();

    // Update timeline table
    updateTimelineTable();
}

function updateTimelineTable() {
    const tbody = document.getElementById('timelineTableBody');
    tbody.innerHTML = '';

    // Only show every 5th entry to keep the table manageable
    drinkingPerson.timeLine.forEach((state, index) => {
        if (index % 5 === 0) {
            const row = document.createElement('tr');
            const time = state.time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            // Get the actual buildup from the state
            const buildup = state.totalAlcoholGrams || 0;

            row.innerHTML = `
                        <td>${time}</td>
                        <td>${state.alcoholGrams.toFixed(2)}</td>
                        <td>${state.promille.toFixed(3)}</td>
                        <td>${state.alcoholBuildup.toFixed(2)}</td>
                        <td>${state.totalAlcoholGrams.toFixed(2)}</td>
                    `;

            tbody.appendChild(row);
        }
    });
}

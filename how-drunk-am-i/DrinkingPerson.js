const DrinkingPerson = function(person) {
	this.person = person;
	this.drinks = [];
	this.timeLine = [];
};

DrinkingPerson.prototype.addDrink = function(drink) {
	this.drinks.push(drink);
	this.drinks.sort((a, b) => (a.startTime > b.startTime) ? 1 : -1);
};

DrinkingPerson.prototype.calculate = function() {
	this.drinks.map(drink => {
		console.log(drink.toString());
	});

	const minute = 60 * 1000;
	const initialTeardownDelay = minute * 20;
	const initialBuildupDelay = minute * 5;

	if (this.drinks.length === 0)
		return;

	const startTime = this.drinks[0].startTime;
	const endTime = Math.max(...this.drinks.map(drink => drink.endTime));
	const maxSlowProcessingTime = Math.max(...this.drinks.map(drink => drink.slowProcessingTime));
	let currentTime = startTime;
	let alcoholGram = 0.00;
	let counter = 0;

	let alcoholBuildupTotal = 0.00;

	// Calculate the alcohol buildup and teardown for each drink
	while (currentTime >= startTime && currentTime <= endTime + maxSlowProcessingTime || alcoholGram > 0.00) {
		counter++;

		// Break after 10 hours
		if (counter > 600)
			break;

		// Make a list of the total alcohol buildup for each drink
		const currentDrinks = this.drinks.map(drink => {
			const { startTime } = drink;
			const index = (currentTime - startTime) / minute;

			// Get the alcohol buildup for the current minute in the drink
			if(index >= 0 && index < drink.alcoholAbsorptionTimeline.length)
				return drink.alcoholAbsorptionTimeline[index] ?? 0;

			return 0;
		});

		// Take the sum of all buildup from all drinks to get the newly added alcohol
		const alcoholBuildup = currentDrinks.reduce((a, b) => a + b, 0);

		let alcoholTeardown = 0;

		// Liver starts tearing down alcohol after 20 minutes
		if (startTime + initialTeardownDelay <= currentTime && alcoholGram > 0) {
			// Alcohol removed by the liver
			alcoholTeardown = this.person.teardown * this.person.metabolismFactor;
		}

		// Total alcohol so far
		alcoholBuildupTotal = alcoholBuildupTotal + alcoholBuildup;

		// Current amount of alcohol
		alcoholGram = alcoholGram + alcoholBuildup - alcoholTeardown;

		if (alcoholGram < 0)
			alcoholGram = 0;

		// Calculations complete, push the new minute entry into the array
		this.timeLine.push(
			new DrinkingState(
				new Date(currentTime),
				alcoholGram,
				(alcoholGram / (this.person.weight * this.person.weightFactor)),
				alcoholBuildup,
				alcoholBuildupTotal));

		// Prepare for next iteration
		currentTime = currentTime + minute;
	}
};

// For browser environments
if (typeof window !== 'undefined') {
	window.DrinkingPerson = DrinkingPerson;
}

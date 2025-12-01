import Person from "./Person";
import Drink from "./Drink";
import DrinkingState from "./DrinkingState";

export default class DrinkingPerson {
	constructor(person) {
		this.person = person;
		this.drinks = new Array();
		this.timeLine = new Array();

		console.log("Created DrinkingPerson");
	}

	//get person() { return this.person; }
	//get drinks() { return this.drinks; }
	//get timeline() { return this.timeline; }

	addDrink(drink) {
		this.drinks.push(drink);
		this.drinks.sort((a, b) => (a.startTime > b.startTime) ? 1 : -1);
	}

	calculate() {
		console.log("DrinkingPerson.calculate");
		const minute = 60 * 1000;
		const initialTeardownDelay = minute * 20;
		const initialBuildupDelay = minute * 5;

		if (this.drinks.length === 0)
			return;

		var startTime = this.drinks[0].startTime;
		var endTime = Math.max.apply(Math, this.drinks.map(function (drink) { return drink.endTime; }));
		var maxSlowProcessingTime = Math.max.apply(Math, this.drinks.map(function (drink) { return drink.slowProcessingTime; }));
		var currentTime = startTime;
		var alcoholGram = 0.00;
		var counter = 0;

		console.log(`Processing starts at ${(new Date(startTime)).toString()} and last alcohol consumed at: ${(new Date(endTime)).toString()}`);

		var totalGrams = this.drinks.reduce(function (a, b) { return a + b.alcoholGram; }, 0);

		var teardown = this.person.teardown * 60;

		console.log(`Estimate: ${totalGrams} of alcohol is broken down by ${teardown} an hour so the person is sober in ${totalGrams/teardown} hours`);

		var alcoholBuildupTotal = 0;

		while (currentTime >= startTime && currentTime <= endTime + maxSlowProcessingTime || alcoholGram > 0.00) {
			counter++

			if (counter > 600)
				break;

			var currentDrinks = this.drinks.map(
				function (drink, index, array) {
					var startTime = drink.startTime;
					var endTime = drink.endTime;
					var duration = drink.duration;

					// Simple calculation
					if (false) {
						if (startTime <= currentTime && endTime > currentTime) {
							return drink.alcoholGram / duration * minute;
						}
						else
							return 0;
					}

					if (startTime <= currentTime && endTime + drink.slowProcessingTime > currentTime) {
						var alcoholGram = 0.00;

						// Quick absorbed - 10 minute delay
						if (startTime + initialBuildupDelay <= currentTime && endTime + initialBuildupDelay > currentTime) {
							let quickAbsorbedGrams = drink.alcoholGramQuick / duration * minute;
							alcoholGram += quickAbsorbedGrams;
							console.log(`Quick at ${currentTime}: ${quickAbsorbedGrams}`);
						}

						// Slow absorbed - 10 minut delay, + 45 minutes processing
						if (startTime + initialBuildupDelay <= currentTime && endTime + drink.slowProcessingTime > currentTime) {
							let slowAbsorbedGrams = drink.alcoholGramSlow / ((endTime + drink.slowProcessingTime) - (startTime + initialBuildupDelay)) * minute;
							alcoholGram += slowAbsorbedGrams;
							console.log(`Slow at ${currentTime}: ${slowAbsorbedGrams}`);
						}

						return alcoholGram;
					} else {
						return 0;
					}
				});

			// Alcohol present + new alcohol taken
			let alcoholBuildup = currentDrinks.reduce(function (a, b) { return a + b; }, 0);

			alcoholBuildupTotal += alcoholBuildup;

			let alcoholTeardown = 0;

			// Liver starts tearing down alcohol after 20 minutes
			if (startTime + initialTeardownDelay <= currentTime && alcoholGram > 0) {
				// Alcohol removed by the liver
				alcoholTeardown = this.person.teardown * this.person.metabolismFactor;
			}


			alcoholGram = alcoholGram + alcoholBuildup - alcoholTeardown;

			console.log(`Calculated grams +${alcoholBuildup}g -${alcoholTeardown}g => ${alcoholGram}g`);

			if (alcoholGram < 0)
				alcoholGram = 0;


			// Calculations complete, push the new minute entry into the array
			this.timeLine.push(new DrinkingState(new Date(currentTime), alcoholGram, (alcoholGram / (this.person.weight * this.person.weightFactor))));

			// Prepare for next iteration
			currentTime = currentTime + minute;
		}

		console.log(`Total calculated grams: ${totalGrams}, total grams from buildup: ${alcoholBuildupTotal}`);

	}

}

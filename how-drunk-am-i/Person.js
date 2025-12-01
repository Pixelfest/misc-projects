function Person(gender, weight, height) {
	this.gender = gender;
	this.weight = weight;
	this.height = height;
	this.metabolismFactor = 0.8;

	this.bloodLiters = this.calculateBloodLiters();
	this.teardown = this.calculateTearDown();

	if (gender === "male") {
		this.weightFactor = 0.71;
	} else {
		this.weightFactor = 0.62;
	}
}

Person.prototype.toString = function() {
	return "Person is a " + this.gender + ". With " + this.weight + "kg at " + this.height + "cm. Teardown speed is " + (this.teardown * 60) + "g an hour. Amount of blood: " + this.bloodLiters;
};

Person.prototype.calculateBloodLiters = function() {
	let bloodLiters;

	if (false) {
		// https://www.bloedcellen.nl/hoeveel-liter-bloed-heeft-een-mens/
		bloodLiters = this.weight * 0.07;
		return bloodLiters;
	}

	// https://www.omnicalculator.com/health/blood-volume#how-does-blood-volume-calculator-work
	if (this.gender === "male") {
		// amountOfBlood = 0.3669 * height^3 + 0.03219 * weight + 0.6041 // height in meters
		bloodLiters = (0.3669 * Math.pow(this.height / 100, 3) + 0.03219 * this.weight + 0.6041);
	}
	else {
		// amountOfBlood = 0.3561 * height^3 + 0.03308 * weight + 0.1833 // height in meters
		bloodLiters = (0.3561 * Math.pow(this.height / 100, 3) + 0.03308 * this.weight + 0.1833);
	}

	return bloodLiters;
};

Person.prototype.calculateTearDown = function() {
	let teardown;

	// https://www.berekenen.nl/auto/alcoholpromillage-berekenen/resultaat#1W79erJ
	if (this.gender === "male") {
		// teardownSpeed = 0,002 x weight^2 x 0.71
		teardown = 0.002 * (this.weight * this.weight) * 0.71 / 60; // 60 minutes for an hour
	}
	else {
		// teardownSpeed = 0,002 x weight^2 x 0.62
		teardown = 0.002 * (this.weight * this.weight) * 0.62 / 60; // 60 minutes for an hour
	}

	return teardown;
};

// For browser environments
if (typeof window !== 'undefined') {
	window.Person = Person;
}

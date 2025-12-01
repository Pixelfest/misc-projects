function DrinkingState(time, alcoholGrams, promille, alcoholBuildup, totalAlcoholGrams) {
    this.time = time;
    this.alcoholGrams = alcoholGrams;
    this.promille = promille;
    this.alcoholBuildup = alcoholBuildup
    this.totalAlcoholGrams = totalAlcoholGrams;
}

DrinkingState.prototype.toString = function() {
    return "State at " + this.time + " is " + this.alcoholGrams + "grams of alcohol and " + this.promille + " promille. Total alcohol grams: " + this.totalAlcoholGrams;
};

// For browser environments
if (typeof window !== 'undefined') {
    window.DrinkingState = DrinkingState;
}

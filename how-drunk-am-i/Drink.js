/**
 * Creates a new Drink object
 * @param {Date} startTime - The dateTime the drink was started
 * @param {any} duration - The time it took to drink it
 * @param {any} size - The size of the drink in ml
 * @param {any} percentage - The percentage of the drink
 * @param {string} name - The name of the drink
 */
function Drink(startTime, duration, size, percentage, name) {
    const minute = 60 * 1000;

    if (startTime instanceof Date)
        this.startTime = startTime.getTime();
    else
        this.startTime = startTime;

    this.duration = duration * minute;
    this.size = size;
    this.percentage = percentage;
    this.name = name;
    this.endTime = this.startTime + this.duration;

    this.alcoholGram = this.size * this.percentage / 100 * 0.79; // 0.79 = Specific weight of Alcohol

    // https://www.jellinek.nl/vraag-antwoord/hoe-wordt-alcohol-door-het-lichaam-opgenomen/
    // 20% of alcohol is absorbed by the stomach - 10 minutes
    this.alcoholGramQuick = this.alcoholGram * 0.2;

    // 75% of alcohol is absorbed by the small intestine - from 10 to 45 minutes - 60 minutes
    this.alcoholGramSlow = this.alcoholGram * 0.75;

    // The remaining 5% is not absorbed at all
    // Alcohol in lower percentage drinks are absorbed slower
    if (this.percentage < 5)
        this.slowProcessingTime = 60 * minute;
    else if (this.percentage < 10)
        this.slowProcessingTime = 55 * minute;
    else if (this.percentage < 15)
        this.slowProcessingTime = 50 * minute;
    else
        this.slowProcessingTime = 45 * minute;

    // 1. De duration of the drink means every minute an X amount of alcohol enters the body
    // 2. While the drink is being consumed, the alcohol is already being absorbed
    // 3. Total absorption time is the duration of the drink + the slow processing time
    // With these rules we can make an array with the alcohol entering the bloodstream per minute
    // Create array to store alcohol absorption per minute
    this.alcoholAbsorptionTimeline = [];

    // Calculate total duration including slow processing
    const totalDuration = Math.ceil((this.duration + this.slowProcessingTime) / minute);

    // Calculate per-minute absorption rates
    const quickAbsorptionPerMinute = this.alcoholGramQuick / Math.min(10, this.duration/minute);
    const slowAbsorptionPerMinute = this.alcoholGramSlow / (totalDuration - 10);

    // Fill timeline array
    for (let i = 0; i < totalDuration; i++) {
        if (i < Math.min(10, this.duration/minute)) {
            // First 10 minutes (or duration if shorter): Quick absorption phase
            this.alcoholAbsorptionTimeline.push(quickAbsorptionPerMinute);
        } else if (i < totalDuration) {
            // Remaining time: Slow absorption phase
            this.alcoholAbsorptionTimeline.push(slowAbsorptionPerMinute);
        }
    }

    console.log(this.alcoholAbsorptionTimeline);
   }

Drink.prototype.toString = function() {
    const date = new Date(this.startTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    return "On " + timeStr + " you started drinking " + this.size + "ml of " + this.name + " (" + this.percentage + "%, " + this.alcoholGram + "g), which took you " + (this.duration / 1000 / 60).toFixed() + " minutes to finish.";
};

// For browser environments
if (typeof window !== 'undefined') {
    window.Drink = Drink;
}

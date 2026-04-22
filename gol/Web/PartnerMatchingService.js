class PartnerMatchingService {
    constructor(settings) {
        this.settings = settings;
    }

    matchPartners(people, currentDate) {
        const lookingForPartner = people.filter(p => p.isLookingForPartner);

        if (lookingForPartner.length < 2) {
            return;
        }

        // Shuffle to randomize matches
        for (let i = lookingForPartner.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lookingForPartner[i], lookingForPartner[j]] = [lookingForPartner[j], lookingForPartner[i]];
        }

        for (let i = 0; i < lookingForPartner.length - 1; i++) {
            const person = lookingForPartner[i];

            if (person.hasPartner) {
                continue;
            }

            for (let j = i + 1; j < lookingForPartner.length; j++) {
                const potential = lookingForPartner[j];

                if (potential.hasPartner) {
                    continue;
                }

                // Check if same-sex or opposite-sex based on settings
                const isSameSex = person.gender === potential.gender;
                const allowSameSex = Math.random() < (this.settings.sameSexCouplePercentage / 100);

                if (isSameSex && !allowSameSex) {
                    continue;
                }

                if (!isSameSex && allowSameSex) {
                    continue;
                }

                if (person.isCompatibleWith(potential, this.settings.maxAgeDifference)) {
                    person.setPartner(potential, currentDate);
                    potential.setPartner(person, currentDate);

                    // Determine if couple wants children
                    if (Math.random() < (this.settings.coupleWantsChildrenPercentage / 100)) {
                        const numChildren = this.settings.minChildren +
                            Math.floor(Math.random() * (this.settings.maxChildren - this.settings.minChildren + 1));
                        person.setMaxChildren(numChildren);
                        potential.setMaxChildren(numChildren);
                    }

                    break;
                }
            }
        }
    }
}

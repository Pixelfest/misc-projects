class Person {
    constructor(firstName, lastName, birthDate, gender, hobbies) {
        // Personal Information
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.hobbies = hobbies;

        // Lifecycle & State
        this.birthDate = new Date(birthDate);
        this.currentDate = new Date(birthDate);
        this.cachedAge = 0;
        this.isAlive = true;
        this.dateOfDeath = null;

        // Partnership
        this.partner = null;
        this.relationshipStartDate = null;

        // Children
        this.maxChildren = 0;
        this.children = [];
        this.lastChildBirthDate = null;

        // Parents & Siblings
        this.parent1 = null;
        this.parent2 = null;
        this.cachedSiblings = null;
    }

    get name() {
        return `${this.firstName} ${this.lastName}`;
    }

    get displayName() {
        if (this.hasPartner && this.partner.lastName !== this.lastName) {
            return `${this.firstName} ${this.lastName} (${this.partner.lastName})`;
        }
        return this.name;
    }

    get age() {
        return this.cachedAge;
    }

    get hasPartner() {
        return this.partner !== null;
    }

    get isLookingForPartner() {
        return this.age >= 18 && !this.hasPartner && this.isAlive;
    }

    get relationshipDuration() {
        if (this.hasPartner && this.relationshipStartDate) {
            return this.currentDate - this.relationshipStartDate;
        }
        return 0;
    }

    get numberOfChildren() {
        return this.children.length;
    }

    get hasParents() {
        return this.parent1 !== null && this.parent2 !== null;
    }

    get siblings() {
        if (this.cachedSiblings !== null) {
            return this.cachedSiblings;
        }

        if (!this.hasParents) {
            this.cachedSiblings = [];
            return this.cachedSiblings;
        }

        const siblings = [];
        if (this.parent1) {
            for (const child of this.parent1.children) {
                if (child !== this) {
                    siblings.push(child);
                }
            }
        }
        this.cachedSiblings = siblings;
        return this.cachedSiblings;
    }

    advanceDay(newDate) {
        this.currentDate = new Date(newDate);
        const age = this.currentDate.getFullYear() - this.birthDate.getFullYear();
        const dayOfYear = this.getDayOfYear(this.currentDate);
        const birthDayOfYear = this.getDayOfYear(this.birthDate);
        this.cachedAge = dayOfYear < birthDayOfYear ? age - 1 : age;
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    setPartner(partner, relationshipStartDate) {
        if (!partner) {
            throw new Error('Partner cannot be null');
        }

        if (this.hasPartner && this.partner !== partner) {
            throw new Error(`${this.displayName} already has a partner.`);
        }

        if (partner.hasPartner && partner.partner !== this) {
            throw new Error(`${partner.displayName} already has a partner.`);
        }

        this.partner = partner;
        this.relationshipStartDate = new Date(relationshipStartDate);
    }

    setMaxChildren(maxChildren) {
        this.maxChildren = maxChildren;
    }

    addChild(child) {
        this.children.push(child);
        this.lastChildBirthDate = new Date(child.birthDate);
        this.cachedSiblings = null;
    }

    setParents(parent1, parent2) {
        this.parent1 = parent1;
        this.parent2 = parent2;
    }

    isCompatibleWith(other, maxAgeDifference = 4) {
        if (!other) {
            return false;
        }

        if (!this.isLookingForPartner || !other.isLookingForPartner) {
            return false;
        }

        const ageDifference = Math.abs(this.age - other.age);
        return ageDifference <= maxAgeDifference;
    }

    die(dateOfDeath) {
        this.isAlive = false;
        this.dateOfDeath = new Date(dateOfDeath);
    }
}

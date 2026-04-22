class PersonFactory {
    constructor() {
        this.nameGenerator = new NameGenerator();
        this.birthDateGenerator = new BirthDateGenerator();
        this.genderGenerator = new GenderGenerator();
        this.hobbiesGenerator = new HobbiesGenerator();
    }

    createPeople(count) {
        const people = [];
        const currentDate = new Date();

        for (let i = 0; i < count; i++) {
            const firstName = this.nameGenerator.generateFirstName();
            const lastName = this.nameGenerator.generateLastName();
            const birthDate = this.birthDateGenerator.generate(currentDate);
            const gender = this.genderGenerator.generate();
            const hobbies = this.hobbiesGenerator.generate();

            const person = new Person(firstName, lastName, birthDate, gender, hobbies);
            people.push(person);
        }

        return people;
    }

    createChild(parent1, parent2, birthDate) {
        const firstName = this.nameGenerator.generateFirstName();
        const lastName = Math.random() < 0.5 ? parent1.lastName : parent2.lastName;
        const gender = this.genderGenerator.generate();
        const hobbies = this.hobbiesGenerator.generate();

        const child = new Person(firstName, lastName, birthDate, gender, hobbies);
        child.setParents(parent1, parent2);

        return child;
    }
}

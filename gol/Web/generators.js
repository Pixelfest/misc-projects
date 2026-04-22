// Name Generator
class NameGenerator {
    constructor() {
        this.firstNames = [
            'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
            'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
            'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
            'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
            'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
            'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
            'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
            'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
            'Nicholas', 'Shirley', 'Eric', 'Angela', 'Jonathan', 'Helen', 'Stephen', 'Anna',
            'Larry', 'Brenda', 'Justin', 'Pamela', 'Scott', 'Nicole', 'Brandon', 'Emma',
            'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
            'Alexander', 'Rachel', 'Frank', 'Catherine', 'Patrick', 'Carolyn', 'Raymond', 'Janet',
            'Jack', 'Ruth', 'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane',
            'Aaron', 'Virginia', 'Jose', 'Julie', 'Adam', 'Joyce', 'Henry', 'Victoria',
            'Nathan', 'Olivia', 'Douglas', 'Kelly', 'Zachary', 'Christina', 'Peter', 'Lauren',
            'Kyle', 'Joan', 'Walter', 'Evelyn', 'Ethan', 'Judith', 'Jeremy', 'Megan'
        ];

        this.lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
            'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
            'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
            'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
            'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
            'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
            'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
            'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
            'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
            'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
            'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
            'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell'
        ];
    }

    generateFirstName() {
        return this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
    }

    generateLastName() {
        return this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
    }
}

// BirthDate Generator
class BirthDateGenerator {
    generate(currentDate) {
        const minAge = 18;
        const maxAge = 65;
        const ageYears = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));

        const birthDate = new Date(currentDate);
        birthDate.setFullYear(birthDate.getFullYear() - ageYears);

        // Random day of the year
        const randomDays = Math.floor(Math.random() * 365);
        birthDate.setDate(birthDate.getDate() - randomDays);

        return birthDate;
    }
}

// Gender Generator
class GenderGenerator {
    generate() {
        return Math.random() < 0.5 ? 'Male' : 'Female';
    }
}

// Hobbies Generator
class HobbiesGenerator {
    constructor() {
        this.hobbies = [
            'Reading', 'Gaming', 'Cooking', 'Gardening', 'Photography', 'Painting',
            'Music', 'Sports', 'Hiking', 'Traveling', 'Writing', 'Dancing',
            'Fishing', 'Cycling', 'Swimming', 'Yoga', 'Movies', 'Theater'
        ];
    }

    generate() {
        const numHobbies = 1 + Math.floor(Math.random() * 4); // 1-4 hobbies
        const selected = [];
        const shuffled = [...this.hobbies].sort(() => Math.random() - 0.5);

        for (let i = 0; i < numHobbies && i < shuffled.length; i++) {
            selected.push(shuffled[i]);
        }

        return selected;
    }
}

// https://github.com/MrLuit/elfproef/blob/master/src/index.ts
export const validateElfProef = (input, weights) => {
	if (typeof input === 'number') {
		input = input.toString();
	}
	if (input.length !== weights.length) {
		return false;
	}

	const numbers = input.split('');
	const sum = numbers
		.map((value, index) => {
			const number = parseInt(value, 10);
			const weight = weights[index];
			return number * weight;
		})
		.reduce((a, b) => a + b);

	return sum > 0 && sum % 11 === 0;
};

export const generateElfProef = (weights) => {
	const length = weights.length;
	let success = false;
	let value = null;
	
	while(!success) {
		// This can be a "safer" random generator
		value = Math.random().toString().slice(2, 2 + length);
		success = validateElfProef(value, weights);
	}
	
	return value;
};

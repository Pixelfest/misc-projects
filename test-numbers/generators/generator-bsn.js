import { generateElfProef, validateElfProef } from './utils-elf.js';

const weights = [9, 8, 7, 6, 5, 4, 3, 2, -1];

const generate = () => {
	return generateElfProef(weights);
}

const validate = (value) => {
	return validateElfProef(value, weights);
}

const createGenerator = () => {
	const section = document.getElementById('generatorContainer');

	const title = document.createElement('h2');
	title.textContent = 'BSN';
	section.appendChild(title);


}

createGenerator();
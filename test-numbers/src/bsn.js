import React from 'react';
import {validateElfProef, generateElfProef} from './utils'
import GenericGenerator from "./GenericGenerator";

function BsnGenerator() {
	const weights = [9, 8, 7, 6, 5, 4, 3, 2, -1];

	const validate = (value) => {
		return validateElfProef(value, weights);
	}

	const generate = () => {
		return generateElfProef(weights);
	};

	return (
		<GenericGenerator generate={generate} validate={validate} title="BSN"/>
	)
}

export default BsnGenerator;
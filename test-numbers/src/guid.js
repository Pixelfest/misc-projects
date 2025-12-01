import React from "react";
import GenericGenerator from "./GenericGenerator";

function GuidGenerator() {
	const validate = function (value) {
		const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		return regex.test(value);
	};

	const generate  = function() {
		// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid/2117523#2117523
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	
	return (
		<GenericGenerator generate={generate} validate={validate} title="Guids" />
	)	
}

export default GuidGenerator;
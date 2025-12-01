import React from "react";
import GenericGenerator from "./GenericGenerator";

function EmailGenerator() {
	// https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
	const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

	const validate = (value) => {
		return regex.test(value);
	}

	const generate  = function() {
		const firstNames = ["Tony", "Bruce", "Thor", "Natasha", "Clint", "Steve", "Wanda", "James", "Scott", "Carol", "Happy", "Stephen", "Peter", "Sam", "Bucky", "Loki", "Maria", "Nick", "Hope", "Peggy", "Hank"];
		const lastNames = ["Stark", "Banner", "Odinson", "Romanov", "Barton", "Rogers", "Maximoff", "Rhodes", "Lang", "Danvers", "Hogan", "Strange", "Parker", "Quill", "Wilson", "Barnes", "Laufeyson", "Hill", "Fury", "van Dyne", "Carter", "Pym"];
		const domains = ["fake", "test", "notreal", "test"];
		const tops = ["nl", "com", "net", "org"];
		const seperators = [".", "-", "_", ""];
		const plus = ["facebook","google","microsoft"];
		
		let firstName = firstNames[Math.floor(Math.random()*firstNames.length)];
		let lastName = lastNames[Math.floor(Math.random()*lastNames.length)];

		const separator = seperators[Math.floor(Math.random()*seperators.length)];
		const domain =  domains[Math.floor(Math.random()*domains.length)];
		const top =  tops[Math.floor(Math.random()*tops.length)];

		if(Math.random() > 0.7)
			firstName = firstName[0];

		lastName = lastName.replace(" ", "");
		if(Math.random() > 0.8)
			lastName = `${lastName}${Math.floor((Math.random() * 72) + 1950)}`;

		if(Math.random() > 0.95)
			lastName = `${lastName}+${plus[Math.floor(Math.random()*plus.length)]}`;

		return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}@${domain}.${top}`;
	}

	return (
		<GenericGenerator generate={generate} validate={validate} title="Email"/>
	)
}

export default EmailGenerator;
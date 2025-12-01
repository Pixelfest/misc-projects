import React from 'react';
import GenericGenerator from "./GenericGenerator";

function PostalcodeGenerator() {
    const regex = new RegExp("^[1-9][0-9]{3} ?[A-Z]{2}$");
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const validate = (value) => {
        return regex.test(value);
    }

    const generate = () => {
        let result = (Math.floor(Math.random() * 9) + 1).toString();
        let i;
        for (i = 0; i < 3; i++) {
            const number = Math.floor(Math.random() * 10);
            result += number.toString();
        }

        result += " ";

        for (i = 0; i < 2; i++) {
            const letter = letters.charAt(Math.floor(Math.random() * 26));
            result += letter;
        }
        return result;
    };

    return (
        <GenericGenerator generate={generate} validate={validate} title="Postalcode"/>
    )
}

export default PostalcodeGenerator;

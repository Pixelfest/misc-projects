import React from "react";
import GenericGenerator from "./GenericGenerator";

function PhoneNumberGenerator() {
    const regex = /^(0|\+31|0031)[1-9]{1}[0-9]{8}$/;

    const validate = (value) => {
        return regex.test(value);
    }

    const generate = () => {
        let result = "+31" + (Math.floor(Math.random() * 9) + 1).toString();
        for (let i = 0; i < 8; i++) {
            const number = Math.floor(Math.random() * 10);
            result += number.toString();
        }

        return result;
    };

    return (
        <GenericGenerator generate={generate} validate={validate} title="Phone number"/>
    )
}

export default PhoneNumberGenerator;

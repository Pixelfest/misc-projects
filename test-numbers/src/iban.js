import React from "react";
import {generateElfProef, validateElfProef} from "./utils";
import GenericGenerator from "./GenericGenerator";

function IbanGenerator() {
    const bics = [
        "ABNA", "FTSB", "AEGO", "ANAA", "ANDL", "ARBN", "ARSN", "ARTE", "ASNB", "ASRB", "ATBA", "BBRU", "BCDM", "BCIT", "BICK", "BKCH", "BKMG",
        "BLGW", "BMEU", "BNGH", "BNPA", "BOFA", "BOFS", "BOTK", "CHAS", "CITC", "CITI", "COBA", "DEUT", "DHBN", "DLBK", "DNIB", "FBHL", "FLOR",
        "FRBK", "FRGH", "FVLB", "GILL", "HAND", "HHBA", "HSBC", "ICBK", "INGB", "INSI", "ISBK", "KABA", "KASA", "KNAB", "KOEX", "KRED", "LOCY",
        "LOYD", "LPLN", "MHCB", "NNBA", "NWAB", "OVBN", "RABO", "RBOS", "RBRB", "SNSB", "SOGE", "STAL", "TEBU", "TRIO", "UBSW", "UGBI", "VOWA",
        "ZWLB"
    ];
    const weights = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const characterValues = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const countrypatterns = {
        //"AL": "\\d{8}[\\dA-Z]{16}",
        //"AD": "\\d{8}[\\dA-Z]{12}",
        //"AT": "\\d{16}",
        //"AZ": "[\\dA-Z]{4}\\d{20}",
        //"BE": "\\d{12}",
        //"BH": "[A-Z]{4}[\\dA-Z]{14}",
        //"BA": "\\d{16}",
        //"BR": "\\d{23}[A-Z][\\dA-Z]",
        //"BG": "[A-Z]{4}\\d{6}[\\dA-Z]{8}",
        //"CR": "\\d{17}",
        //"HR": "\\d{17}",
        //"CY": "\\d{8}[\\dA-Z]{16}",
        //"CZ": "\\d{20}",
        //"DK": "\\d{14}",
        //"DO": "[A-Z]{4}\\d{20}",
        //"EE": "\\d{16}",
        //"FO": "\\d{14}",
        //"FI": "\\d{14}",
        //"FR": "\\d{10}[\\dA-Z]{11}\\d{2}",
        //"GE": "[\\dA-Z]{2}\\d{16}",
        //"DE": "\\d{18}",
        //"GI": "[A-Z]{4}[\\dA-Z]{15}",
        //"GR": "\\d{7}[\\dA-Z]{16}",
        //"GL": "\\d{14}",
        //"GT": "[\\dA-Z]{4}[\\dA-Z]{20}",
        //"HU": "\\d{24}",
        //"IS": "\\d{22}",
        //"IE": "[\\dA-Z]{4}\\d{14}",
        //"IL": "\\d{19}",
        //"IT": "[A-Z]\\d{10}[\\dA-Z]{12}",
        //"KZ": "\\d{3}[\\dA-Z]{13}",
        //"KW": "[A-Z]{4}[\\dA-Z]{22}",
        //"LV": "[A-Z]{4}[\\dA-Z]{13}",
        //"LB": "\\d{4}[\\dA-Z]{20}",
        //"LI": "\\d{5}[\\dA-Z]{12}",
        //"LT": "\\d{16}",
        //"LU": "\\d{3}[\\dA-Z]{13}",
        //"MK": "\\d{3}[\\dA-Z]{10}\\d{2}",
        //"MT": "[A-Z]{4}\\d{5}[\\dA-Z]{18}",
        //"MR": "\\d{23}",
        //"MU": "[A-Z]{4}\\d{19}[A-Z]{3}",
        //"MC": "\\d{10}[\\dA-Z]{11}\\d{2}",
        //"MD": "[\\dA-Z]{2}\\d{18}",
        //"ME": "\\d{18}",
        "NL": "[A-Z]{4}\\d{10}" //,
    };
    
    const convertToDigits = function (iban) {
        const ibanSwitched = iban.substring(4, iban.length) + iban.substring(0, 4);
        let result = "";
        for (let i = 0; i < ibanSwitched.length; i++) {
            const currentcharacter = ibanSwitched.charAt(i);
            result += characterValues.indexOf(currentcharacter);
        }
        return result;
    };

    const calculateMod = function (ibanDigits) {
        let currentcharacter;
        let operator;
        let result = 0;
        // calculate the result of: ibancheckdigits % 97
        for (let i = 0; i < ibanDigits.length; i++) {
            currentcharacter = ibanDigits.charAt(i);
            operator = result.toString() + currentcharacter.toString();
            result = +operator % 97;
        }
        return result;
    };

    const generateBankAccountNumber = function () {
        return generateElfProef(weights);
    };

    const validate = (value) => {
        // remove spaces and to upper case
        const trimmedValue = value.replace(/ /g, "").toUpperCase();
        let countrycode, ibanregexp, ibanpattern, ibancheck;
        // check the country code and find the country specific format
        countrycode = value.substring(0, 2);
        ibanpattern = countrypatterns[countrycode];
        if (typeof ibanpattern !== "undefined") {
            ibanregexp = new RegExp("^[A-Z]{2}\\d{2}" + ibanpattern + "$", "");
            if (!(ibanregexp.test(trimmedValue))) {
                return false; // invalid country specific format
            }
        }
        ibancheck = convertToDigits(trimmedValue);
        return calculateMod(ibancheck) === 1;
    }

    const generate = () => {
        let accountNumber = bics[Math.floor(Math.random() * bics.length)];
        let digits, checksum;
        accountNumber += generateBankAccountNumber();
        digits = convertToDigits("NL00" + accountNumber);
        checksum = (98 - calculateMod(digits)).toString();
        if (checksum.length === 1)
            checksum = "0" + checksum;
        return "NL" + checksum + accountNumber;
    };

    return (
        <GenericGenerator generate={generate} validate={validate} title="IBAN"/>
    )
}

export default IbanGenerator;

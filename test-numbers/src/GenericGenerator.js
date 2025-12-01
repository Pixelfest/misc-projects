import React, {useEffect, useState} from "react";

function GenericGenerator({title, validate, generate}) {
	const [value, setValue] = useState('');
	const [isValid, setValid] = useState(true);

	const handleChange = event => {
		setValue(event.target.value);
	}

	const handleGenerate = event => {
		setValue(generate);
	};
	
	const copy = event => {
		navigator.clipboard.writeText(value);
	}

	const validateValue = () => {
		setValid(validate(value));
	}
	
	useEffect(validateValue, [value]);

	const style = value ? isValid ? "valid" : "invalid" : "none";
	
	return (
		<div className="generator">
			<h2>{title}</h2>
			<div className="row">
				<input type="text" onInput={handleChange} value={value} className={style}/>
			</div>
			<div className="row">
				<button onClick={handleGenerate}>Generate</button>
				<button onClick={copy}>Copy</button>
			</div>
		</div>
	)
}

export default GenericGenerator;
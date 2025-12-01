import React, {useState} from "react";
import Qrcode from 'qrcode-svg';

function QrCodeGenerator() {
	const [text, setText] = useState('https://www.test.com');
	const [qrCode, setQrCode] = useState('');

	const create = function () {
		const qrcode = new Qrcode(text);
		setQrCode(qrcode.svg());
	};

	const download = function () {
		const a = document.body.appendChild(
			document.createElement("a")
		);
		a.download = "qr-code.svg";
		a.href = "data:image/svg+xml," + encodeURIComponent(qrCode);
		a.click(); //Trigger a click on the element
	};
	
	const handleChange = event => {
		setText(event.target.value);
	};
	
	return (
		<div className="generator x3">
			<h2>QR Codes</h2>
			<div className="row">
				<input type="text" value={text} onChange={handleChange}/>
			</div>
			<div className="row">
				<div className="qr-code-output" dangerouslySetInnerHTML={{__html: qrCode}}>
				</div>
			</div>
			<div className="row">
				<button onClick={create}>Create</button>
				<button onClick={download}>Download</button>
			</div>
		</div>
	)
}

export default QrCodeGenerator;
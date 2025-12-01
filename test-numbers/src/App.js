import './App.css';
import BsnGenerator from "./bsn";
import EmailGenerator from "./email";
import GuidGenerator from "./guid";
import IbanGenerator from "./iban";
import PhoneNumberGenerator from "./phonenumber";
import PostalcodeGenerator from "./postalcode";
import QrCodeGenerator from "./qr-code";

function App() {
	return (
		<div className="App">
			<header className="App-header">
				<h1>TST numbers generator&trade;</h1>
				<p>Generating and validating, you know, whatever. Values are validated as soon as they are typed.</p>
			</header>
			<div className="generators">
				<EmailGenerator/>
				<GuidGenerator/>
				<IbanGenerator/>
				<BsnGenerator/>
				<PhoneNumberGenerator/>
				<PostalcodeGenerator/>
				<QrCodeGenerator/>
			</div>
		</div>
	);
}

export default App;

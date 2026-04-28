// Function to load a JavaScript file dynamically
function loadScript(scriptName) {
	const script = document.createElement('script');
	script.src = scriptName;
	script.type = 'module';
	document.head.appendChild(script);
}

// Get the URL parameters
const urlParams = new URLSearchParams(window.location.search);
let scriptToLoad = urlParams.get('generator');
if (scriptToLoad) {
	scriptToLoad = scriptToLoad.substring(scriptToLoad.lastIndexOf('/') + 1);
}

// Load the specified script if it exists
if (scriptToLoad) {
	loadScript('generator-' + scriptToLoad + '.js');
}
var Tools = new function() {
	this.defaultFontSize = 2.4;
	this.defaultStrokeWidth = 0.2;
	this.defaultFontColor = 'black';

	this.uniqueId = function () {
		return Math.random().toString(36).substring(2)
			+ (new Date()).getTime().toString(36);
	};

	this.getCoordinatesForPercent = function (percent, size) {
		if (!size) size = 100;
		var x = Math.cos(2 * Math.PI * percent) * size;
		var y = Math.sin(2 * Math.PI * percent) * size;
		return [x, y];
	};

	this.drawSlice = function (options) {
		options.FontSize = options.FontSize || this.defaultFontSize;
		options.FontColor = options.FontColor || this.defaultFontColor;
		options.StrokeWidth = options.StrokeWidth || this.defaultStrokeWidth;

		var gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');


		var [innerStartX, innerStartY] = this.getCoordinatesForPercent(options.PercentStart, options.InnerRadius);
		var [outerStartX, outerStartY] = this.getCoordinatesForPercent(options.PercentStart, options.OuterRadius);

		var [innerEndX, innerEndY] = this.getCoordinatesForPercent(options.PercentEnd, options.InnerRadius);
		var [outerEndX, outerEndY] = this.getCoordinatesForPercent(options.PercentEnd, options.OuterRadius);

		// if the slice is more than 50%, take the large arc (the long way around)
		var largeArcFlag = options.PercentEnd - options.PercentStart > .5 ? 1 : 0;

		var pathData = [
			`M ${innerStartX} ${innerStartY}`,
			`L ${outerStartX} ${outerStartY}`,
			`A ${options.OuterRadius} ${options.OuterRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
			`L ${innerEndX} ${innerEndY}`,
			`A ${options.InnerRadius} ${options.InnerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`
		].join(' ');

		var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		pathEl.setAttribute('d', pathData);
		pathEl.setAttribute('fill', options.Color);
		pathEl.setAttribute('stroke', 'black');

		if (options.Text.Description)
			pathEl.setAttribute('data-description', options.Text.Description);

		if (options.StrokeWidth)
			pathEl.setAttribute('stroke-width', `${options.StrokeWidth}pt`);

		gEl.appendChild(pathEl);

		var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');

		if (options.FontFamily)
			textEl.setAttribute('font-size', `${options.FontSize}pt`);

		if (options.FontFamily)
			textEl.setAttribute('font-family', options.FontFamily)

		if (options.Bold) {
			textEl.setAttribute('font-weight', 'bold');
		}

		textEl.setAttribute('fill', options.FontColor);

		if (options.UseTextPath) {
			var idToUse = this.uniqueId();
			var textRadius = options.InnerRadius + (options.OuterRadius - options.InnerRadius) / 2 - options.FontSize / 2;
			var [textStartX, textStartY] = this.getCoordinatesForPercent(options.PercentStart, textRadius);
			var [textEndX, textEndY] = this.getCoordinatesForPercent(options.PercentEnd, textRadius);

			var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			var pathData = [
				`M ${textStartX} ${textStartY}`,
				`A ${textRadius} ${textRadius} 0 ${largeArcFlag} 1 ${textEndX} ${textEndY}`
			].join(' ');
			pathEl.setAttribute('d', pathData);
			pathEl.setAttribute('fill', 'none');
			pathEl.setAttribute('stroke', 'none');
			pathEl.setAttribute('stroke-width', `${options.StrokeWidth}pt`);
			pathEl.setAttribute('id', `${idToUse}`);
			gEl.appendChild(pathEl);

			var textPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
			textPathEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${idToUse}`);
			textPathEl.setAttribute('startOffset', '50%');
			textPathEl.innerHTML = options.Text.Name;

			textEl.setAttribute('text-anchor', 'middle');
			textEl.appendChild(textPathEl);
		}
		else {
			textEl.setAttribute('x', options.OuterRadius - options.FontSize);
			textEl.setAttribute('y', options.FontSize / 2);
			textEl.innerHTML = options.Text.Name;
			textEl.setAttribute('text-anchor', 'end');

			textEl.setAttribute('transform', `rotate(${(options.PercentStart + (options.PercentEnd - options.PercentStart) / 2) * 360} 0,0)`);
		}

		gEl.appendChild(textEl);

		options.ParentElement.appendChild(gEl);
	};
};


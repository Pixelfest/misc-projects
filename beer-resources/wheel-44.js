var Wheel44 = new function () {
	this.size = 100;
	this.defaultFontSize = 2.3;
	this.defaultStrokeWidth = 0.2;
	this.strokeWidthThick = this.defaultStrokeWidth * 2;
	this.totalFlavors = 44;
	this.percentage = 1 / this.totalFlavors;
	this.fontFamily = 'Arial, Sans serif';

	this.outer = {
		InnerRadius: 60,
		OuterRaduis: 100
	};

	this.middle = {
		InnerRadius: 30,
		OuterRaduis: this.outer.InnerRadius
	};

	this.inner = {
		InnerRadius: 0,
		OuterRaduis: this.middle.InnerRadius
	};

	this.sliceNames = {
		Alcoholic: {
			Name: "Alcoholisch",
			Description: "Je kunt de alcohol letterlijk ruiken en proeven"
		},
		Solvant: {
			Name: "Oplosmiddel"
		},
		Estery: {
			Name: "Esterig"
		},
		Fruity: {
			Name: "Fruitig"
		},
		Acetaldehyde: {
			Name: "Acetaldehyde"
		},
		Flowery: {
			Name: "Bloemig"
		},
		Hoppy: {
			Name: "Hoppig"
		},
		Resin: {
			Name: "Hars"
		},
		Nut: {
			Name: "Noot"
		},
		Grassy: {
			Name: "Groen, gras"
		},
		Grain: {
			Name: "Graan"
		},
		Malt: {
			Name: "Mout"
		},
		Wort: {
			Name: "Wort"
		},
		Caramel: {
			Name: "Karamel"
		},
		Roast: {
			Name: "Gebrand"
		},
		Phenolic: {
			Name: "Fenolisch"
		},
		Fatty: {
			Name: "Vetzuur, vettig"
		},
		Diacetyl: {
			Name: "Diacetyl"
		},
		Rancid: {
			Name: "Ranzig"
		},
		Oil: {
			Name: "Olie"
		},
		Sulfur: {
			Name: "Zwavel"
		},
		SulfurOxide: {
			Name: "Zwaveloxide"
		},
		HydrogenSulfide: {
			Name: "Rotte eieren"
		},
		CookedVegetable: {
			Name: "Gekookte groente"
		},
		Yeast: {
			Name: "Gist"
		},
		Musty: {
			Name: "Verouderd"
		},
		Stale: {
			Name: "Verschaald"
		},
		Paper: {
			Name: "Papier"
		},
		Leather: {
			Name: "Leer"
		},
		Mould: {
			Name: "Schimmel"
		},
		Sour: {
			Name: "Zuur"
		},
		AceticAcid: {
			Name: "Azijnzuur"
		},
		LacticAcid: {
			Name: "Melkzuur"
		},
		Sweet: {
			Name: "Zoet"
		},
		Salt: {
			Name: "Zout"
		},
		Bitter: {
			Name: "Bitter"
		},
		Alkaline: {
			Name: "Alkalisch"
		},
		Mouthcoating: {
			Name: "Mondklevend"
		},
		Metal: {
			Name: "Metaal"
		},
		Astringent: {
			Name: "Samentrekkend"
		},
		Powdery: {
			Name: "Poederig"
		},
		CarbonicAcid: {
			Name: "Koolzuur"
		},
		Warning: {
			Name: "Verwarmend"
		},
		Body: {
			Name: "Body"
		}
	};

	this.groupTexts = {
		AromaticFragrantFruityFloral: {
			Name: "Aroma"
		},
		ResinousNuttyGreenGrassy: {
			Name: "Plant"
		},
		Cereal: {
			Name: "Graan"
		},
		CaramelizedRoasted: {
			Name: "Gebrand"
		},
		Phenolic: {
			Name: "Fenolisch"
		},
		SoapyFattyDiacetylOilyRancid: {
			Name: "Vet"
		},
		Sulfury: {
			Name: "Zwavel"
		},
		OxidizedStaleMusty: {
			Name: "Muf"
		},
		SourAcidic: {
			Name: "Zuur"
		},
		Sweet: {
			Name: "Zoet"
		},
		Salty: {
			Name: "Zout"
		},
		Bitter: {
			Name: "Bitter"
		},
		Mouthfeel: {
			Name: "Mondgevoel"
		},
		Fullness: {
			Name: "Volheid"
		},
	};

	this.categoryNames = {
		Odor: {
			Name: "Smaak"
		},
		Taste: {
			Name: "Geur"
		}
	};

	this.slices = [
		{ Color: '#CBCDFB', Text: this.sliceNames.Alcoholic },
		{ Color: '#CBCDFB', Text: this.sliceNames.Solvant },
		{ Color: '#CBCDFB', Text: this.sliceNames.Estery },
		{ Color: '#CBCDFB', Text: this.sliceNames.Fruity },
		{ Color: '#CBCDFB', Text: this.sliceNames.Acetaldehyde },
		{ Color: '#CBCDFB', Text: this.sliceNames.Flowery },
		{ Color: '#CBCDFB', Text: this.sliceNames.Hoppy },
		{ Color: '#9CCC66', Text: this.sliceNames.Resin },
		{ Color: '#9CCC66', Text: this.sliceNames.Nut },
		{ Color: '#9CCC66', Text: this.sliceNames.Grassy },
		{ Color: '#CA9965', Text: this.sliceNames.Grain },
		{ Color: '#CA9965', Text: this.sliceNames.Malt },
		{ Color: '#CA9965', Text: this.sliceNames.Wort },
		{ Color: '#996634', Text: this.sliceNames.Caramel},
		{ Color: '#996634', Text: this.sliceNames.Roast },
		{ Color: '#CCFECC', Text: this.sliceNames.Phenolic },
		{ Color: '#FCFE9C', Text: this.sliceNames.Fatty },
		{ Color: '#FCFE9C', Text: this.sliceNames.Diacetyl },
		{ Color: '#FCFE9C', Text: this.sliceNames.Rancid },
		{ Color: '#FCFE9C', Text: this.sliceNames.Oil },
		{ Color: '#CCCCCC', Text: this.sliceNames.Sulfur },
		{ Color: '#CCCCCC', Text: this.sliceNames.SulfurOxide },
		{ Color: '#CCCCCC', Text: this.sliceNames.HydrogenSulfide },
		{ Color: '#CCCCCC', Text: this.sliceNames.CookedVegetable },
		{ Color: '#CCCCCC', Text: this.sliceNames.Yeast },
		{ Color: '#9DC8CD', Text: this.sliceNames.Musty },
		{ Color: '#9DC8CD', Text: this.sliceNames.Stale },
		{ Color: '#9DC8CD', Text: this.sliceNames.Paper },
		{ Color: '#9DC8CD', Text: this.sliceNames.Leather },
		{ Color: '#9DC8CD', Text: this.sliceNames.Mould },
		{ Color: '#9B9966', Text: this.sliceNames.Sour },
		{ Color: '#9B9966', Text: this.sliceNames.AceticAcid },
		{ Color: '#9B9966', Text: this.sliceNames.LacticAcid },
		{ Color: '#FC9964', Text: this.sliceNames.Sweet },
		{ Color: '#FCFECC', Text: this.sliceNames.Salt },
		{ Color: '#CC6664', Text: this.sliceNames.Bitter },
		{ Color: '#FC6664', Text: this.sliceNames.Alkaline },
		{ Color: '#FC6664', Text: this.sliceNames.Mouthcoating },
		{ Color: '#FC6664', Text: this.sliceNames.Metal },
		{ Color: '#FC6664', Text: this.sliceNames.Astringent },
		{ Color: '#FC6664', Text: this.sliceNames.Powdery },
		{ Color: '#FC6664', Text: this.sliceNames.CarbonicAcid },
		{ Color: '#FC6664', Text: this.sliceNames.Warning },
		{ Color: '#FC9905', Text: this.sliceNames.Body }
	];

	var position = 0;

	this.groups = [
		{ ElementStart: position, ElementEnd: position += 7, Color: "#CBCDFB", Text: this.groupTexts.AromaticFragrantFruityFloral },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#9CCC66", Text: this.groupTexts.ResinousNuttyGreenGrassy },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#CA9965", Text: this.groupTexts.Cereal },
		{ ElementStart: position, ElementEnd: position += 2, Color: "#996634", Text: this.groupTexts.CaramelizedRoasted },
		{ ElementStart: position, ElementEnd: position += 1, Color: "#CCFECC", Text: this.groupTexts.Phenolic },
		{ ElementStart: position, ElementEnd: position += 4, Color: "#FCFE9C", Text: this.groupTexts.SoapyFattyDiacetylOilyRancid },
		{ ElementStart: position, ElementEnd: position += 5, Color: "#CCCCCC", Text: this.groupTexts.Sulfury },
		{ ElementStart: position, ElementEnd: position += 5, Color: "#9DC8CD", Text: this.groupTexts.OxidizedStaleMusty },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#9B9966", Text: this.groupTexts.SourAcidic },
		{ ElementStart: position, ElementEnd: position += 1, Color: "#FC9964", Text: this.groupTexts.Sweet },
		{ ElementStart: position, ElementEnd: position += 1, Color: "#FCFECC", Text: this.groupTexts.Salty },
		{ ElementStart: position, ElementEnd: position += 1, Color: "#CC6664", Text: this.groupTexts.Bitter },
		{ ElementStart: position, ElementEnd: position += 7, Color: "#FC6664", Text: this.groupTexts.Mouthfeel },
		{ ElementStart: position, ElementEnd: position += 1, Color: "#FC9905", Text: this.groupTexts.Fullness }
	];

	this.categories = [
		{ ElementStart: -3, Count: 35.5, Color: "#000000", Text: this.categoryNames.Taste, FontColor: "#ffffff", InnerRadius: 10, OuterRadius: 20 },
		{ ElementStart: 28.5, Count: 16, Color: "#ffffff", Text: this.categoryNames.Odor, InnerRadius: 20, OuterRadius: 30  }
	];

	this.draw = function (elementId) {
		var parentDiv = document.getElementById(elementId);
		var height = window.getComputedStyle(parentDiv).height;
		var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svgEl.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
		svgEl.setAttribute('viewBox', '-101 -101 202 202');
		svgEl.setAttribute('style', `transform: rotate(-90deg); height: ${height};`)
		parentDiv.appendChild(svgEl);

		var cumulativePercent = 0;

		this.slices.forEach(slice => {
			var options = {
				ParentElement: svgEl,
				Color: slice.Color,
				InnerRadius: this.outer.InnerRadius,
				OuterRadius: this.outer.OuterRaduis,
				Text: slice.Text,
				PercentStart: cumulativePercent,
				PercentEnd: cumulativePercent + this.percentage,
				FontFamily: this.fontFamily
			};
			Tools.drawSlice(options);
			cumulativePercent += this.percentage;
		});

		this.groups.forEach(group => {
			var options = {
				ParentElement: svgEl,
				Color: group.Color,
				InnerRadius: this.middle.InnerRadius + 5,
				OuterRadius: this.middle.OuterRaduis,
				Text: group.Text,
				PercentStart: group.ElementStart * this.percentage,
				PercentEnd: (group.ElementEnd) * this.percentage,
				FontFamily: this.fontFamily
			};
			Tools.drawSlice(options);
		});

		this.categories.forEach(category => {
			var options = {
				ParentElement: svgEl,
				Color: category.Color,
				InnerRadius: category.InnerRadius,
				OuterRadius: category.OuterRadius,
				Text: category.Text,
				PercentStart: category.ElementStart * this.percentage,
				PercentEnd: (category.ElementStart + category.Count) * this.percentage,
				FontFamily: this.fontFamily,
				FontColor: category.FontColor,
				UseTextPath: true
			};
			Tools.drawSlice(options);
		});
	};
};
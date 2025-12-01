// http://www.carolinabrewmasters.com/PDF/Complete_Beer_Fault_Guide.pdf
// https://www.hobbybrouwen.nl/
// https://www.twortwat.nl
// https://www.biernet.nl
// https://www.morebeer.com
// http://www.belgiansmaak.com

var Wheel100 = new function () {
	this.size = 100;
	this.defaultFontSize = 2.3;
	this.defaultStrokeWidth = 0.2;
	this.strokeWidthThick = this.defaultStrokeWidth * 2;
	this.totalFlavors = 100;
	this.percentage = 1 / this.totalFlavors;
	this.fontFamily = 'Arial, Sans serif';

	this.outer = {
		InnerRadius: 60,
		OuterRaduis: 100
	}
	this.middle = {
		InnerRadius: 50,
		OuterRaduis: this.outer.InnerRadius
	}

	this.inner = {
		InnerRadius: 20,
		OuterRaduis: this.middle.InnerRadius
	}

	this.flavorNames = {
		Piney: {
			Name: "Hars"
		},
		Woody: {
			Name: "Hout"
		},
		Walnut: {
			Name: "Walnoot"
		},
		Coconut: {
			Name: "Kokosnoot"
		},
		Beany: {
			Name: "Bonen"
		},
		Almond: {
			Name: "Amandel"
		},
		FreshlyCutGrass: {
			Name: "Gesneden gras"
		},
		StrawLike: {
			Name: "Stro-achtig"
		},
		Husky: {
			Name: "Bostel",
			Description: "Wat er over is na het brouwen, gebruikte granen exclusief alle zetmeel en eiwitten."
		},
		CornGrits: {
			Name: "Maïsgrutten"
		},
		Mealy: {
			Name: "Meel"
		},
		Malty: {
			Name: "Mout"
		},
		Worty: {
			Name: "Wort"
		},
		Molasses: {
			Name: "Melasse",
			Description: "Melasse of molasse is een stroopachtig bijproduct van de productie van suiker uit suikerriet of suikerbieten.",
			Origin: "Deze smaak is waarschijnlijk afkomstig van de gist."
		},
		Licorice: {
			Name: "Drop",
			Description: "De gebrande zoete smaak van drop is een smaak op zichzelf. Vooral nederlanders moeten deze smaak makkelijk herkennen.",
			Origin: "Donkere mouten"
		},
		BreadCrust: {
			Name: "Broodkorst",
			Description: "",
			Origin: "Mout",
			Examples: ""
		},
		RoastBarley: {
			Name: "Gebrande mout",
			Description: "Heet ge-eeste mouten leveren deze smaak op.",
			Origin: "Veel bieren gebruiken letterlijk gebrande mout in de storting.",
			Examples: "Je zou deze smaak ook kunnen proeven in te lang geroosterd donker brood."
		},
		Smokey: {
			Name: "Rokerig",
			Description: "Rokerigheid zit vooral in het aroma, als je uitademt na een slok bier komen de gerookte mouten duidelijk naar voren.",
			Origin: "Donkere mouten, of wellicht zat het nog in de vaten waarin het bier is gelagerd?",
			Examples: "Whiskey is een duidelijk voorbeeld waarin de gerookte smaak/geur duidelijk aanwezig is."
		},
		Tarry: {
			Name: "Teer",
			Description: "Sigarettenrook",
			Origin: "Tijdens het maischen kan de boel zijn aangebrand onderin de brouwketel. Daarnaast krijg je deze smaak waarschijnlijk ook als je te veel donkere mouten in je storting hebt zitten.",
			Examples: "Sigarettenrook."
		},
		Bakelite: {
			Name: "Bakeliet",
			Description: "Gebrande smaak die neigt naar plastic.",
			Origin: "Aanbranden tijdens maischen? Teveel donkere mout in de storting.",
			Examples: ""
		},
		Carbolic: {
			Name: "Houtskool",
			Description: "Gebrande, wrange smaak. Norit.",
			Origin: "Aanbranden tijdens, teveel, te donkere donkere mout in de storting.",
			Examples: "Norit (wel kauwen), houtskool."
		},
		Chlorophenol: {
			Name: "Chlorofenol",
			Description: "Ziekenhuis, ontsmettingsmiddel.",
			Origin: "Te hoge temperatuur tijdens het maischproces, voor het klaren.",
			Examples: "Hansaplast pleisters."
		},
		Isodoform: {
			Name: "Isodoform",
			Description: "Ziekenhuis, ontsmettingsmiddel.",
			Origin: "Te hoge temperatuur tijdens het maischproces, voor het klaren.",
			Examples: "Hansaplast pleisters."
		},
		Caprylic: {
			Name: "Caprylzuur",
			Description: "Vetzuur met een vettig/ranzig aroma.",
			Origin: "Bijproduct van de gisting.",
			Examples: ""
		},
		Cheesy: {
			Name: "Kaas",
			Description: "Kaas",
			Origin: "Deze bijsmaak komt uit oude hop en is in veel gevallen ongewenst. Een IPA kan een beperkte hoeveelheid hebben.",
			Examples: "Kaas."
		},
		Isovaleric: {
			Name: "Isovaleriaanzuur",
			Description: "Ranzige tenenkaas.",
			Origin: "Deze bijsmaak komt uit oude hop en is in veel gevallen ongewenst.",
			Examples: "Ranzige tenenkaas."
		},
		Butyric: {
			Name: "Boterzuur",
			Description: "Oude, ranzige boter.",
			Origin: "",
			Examples: "Oude, ranzige boter."
		},
		Diacetyl: {
			Name: "Diacetyl",
			Description: "Boterachtig (ranzig). Goed in kleine hoeveelheiden voor een volle body en zachte smaak.",
			Origin: "Bijproduct van gist, te hoge begintemperatuur van de gisting. Teveel suiker toegevoegd aan het wort. Bij het lageren kan de overgebleven gist deze smaak ook weer afbreken.",
			Examples: "Boter"
		},
		Rancid: {
			Name: "Ranzig",
			Description: "Bedorven vet, het slechte broertje van diacetyl.",
			Origin: "Bijproduct van gist, te hoge begintemperatuur van de gisting. Teveel suiker toegevoegd aan het wort.",
			Examples: "Bedorven boter."
		},
		VegetableOil: {
			Name: "Plantenolie",
			Description: ""
		},
		MineralOil: {
			Name: "Mineraalolie"
		},
		StrikingMatch: {
			Name: "Zwavel",
			Description: "",
		},
		Meaty: {
			Name: "Vlees",
			Description: "",
			Origin: "Gisting, veroudering van het bier.",
			Examples: "Marmite, Vegemite."
		},
		HydrogenSulfide: {
			Name: "Rotte eieren",
			Description: "Zwavelwaterstof, de geur/smaak van rotte eieren.",
			Origin: "Zwavelwaterstof wordt tijdens de vergisting gevormd maar is zeer vluchtig. Tijdens de gisting kan het bier dus stinken, maar na het lageren verdwijnt deze geur. Alleen bij een te korte lagering kan de smaak in het bier terecht komen.",
			Examples: "Rotte eieren."
		},
		Mercaptan: {
			Name: "Rotte groente",
			Description: "Oude vuilnis, of riool. In weinig bierstijlen gewenst, en dan in een zeer kleine hoeveelheid",
			Origin: "Bijproduct van de gisting, maar bij nadelige effecten waarschijnlijk het resultaat van een infectie.",
			Examples: "Oude vuilnis, of riool."
		},
		Garlic: {
			Name: "Knoflook",
		},
		Lightstruck: {
			Name: "Verse koffie",
			Description: "Verse gezette koffie, stinkdier",
			Origin: "Bier is blootgesteld aan licht. Vooral lichte bieren en bieren met veel hop zijn hiervoor vatbaar.",
			Examples: "Importbieren hebben hier vaker last van als ze niet fatsoenlijk verscheept zijn."
		},
		Autolysed: {
			Name: "Autolysed"
		},
		BurntRubber: {
			Name: "Burnt rubber"
		},
		ShrimpLike: {
			Name: "Shrimp like"
		},
		ParsnipCelery: {
			Name: "Parsnip/Celery"
		},
		DimethylSulfide: {
			Name: "Dimethyl sulfide"
		},
		CookedCabbage: {
			Name: "Cooked cabbage"
		},
		CookedSweetCorn: {
			Name: "Cooked sweet corn"
		},
		CookedTomato: {
			Name: "Cooked tomato"
		},
		CookedOnion: {
			Name: "Cooked onion"
		},
		Yeasty: {
			Name: "Yeasty"
		},
		Catty: {
			Name: "Catty"
		},
		Papery: {
			Name: "Papery"
		},
		Leathery: {
			Name: "Leathery"
		},
		Earthy: {
			Name: "Earthy"
		},
		Musty: {
			Name: "Musty"
		},
		Acetic: {
			Name: "Acetic"
		},
		Sour: {
			Name: "Sour"
		},
		Honey: {
			Name: "Honey"
		},
		JamLike: {
			Name: "Jam-Like"
		},
		Vanilla: {
			Name: "Vanilla"
		},
		Primings: {
			Name: "Primings"
		},
		Syrupy: {
			Name: "Syrupy"
		},
		Oversweet: {
			Name: "Oversweet"
		},
		Salty: {
			Name: "Salty"
		},
		Bitter: {
			Name: "Bitter"
		},
		Alkaline: {
			Name: "Alkaline"
		},
		Mouthcoating: {
			Name: "Mouthcoating"
		},
		Metallic: {
			Name: "Metallic"
		},
		Drying: {
			Name: "Drying"
		},
		Tart: {
			Name: "Tart"
		},
		Puckering: {
			Name: "Puckering"
		},
		Powdery: {
			Name: "Powdery"
		},
		Flat: {
			Name: "Flat"
		},
		Gassy: {
			Name: "Gassy"
		},
		Alcoholic: {
			Name: "Alcoholic"
		},
		Piquant: {
			Name: "Piquant"
		},
		Watery: {
			Name: "Watery"
		},
		Characterless: {
			Name: "Characterless"
		},
		Satiating: {
			Name: "Satiating"
		},
		Thick: {
			Name: "Thick"
		},
		Spicy: {
			Name: "Spicy"
		},
		Vinous: {
			Name: "Vinous"
		},
		Plastics: {
			Name: "Plastics"
		},
		CanLiner: {
			Name: "Can-liner"
		},
		LaquerLike: {
			Name: "Laquer-like"
		},
		IsoamylAcetate: {
			Name: "Isoamyl acetate"
		},
		EthylHexanoate: {
			Name: "Ethyl hexanoate"
		},
		EthylAcetate: {
			Name: "Ethyl acetate"
		},
		Citrus: {
			Name: "Citrus"
		},
		Apple: {
			Name: "Apple"
		},
		Banana: {
			Name: "Banana"
		},
		BlackCurrant: {
			Name: "Black currant"
		},
		Melory: {
			Name: "Melory"
		},
		Pear: {
			Name: "Pear"
		},
		Raspberry: {
			Name: "Raspberry"
		},
		Strawberry: {
			Name: "Strawberry"
		},
		Acetaldehyde: {
			Name: "Acetaldehyde"
		},
		Phenylethanol: {
			Name: "2-Phenylethanol"
		},
		Geraniol: {
			Name: "Geraniol"
		},
		Perfumy: {
			Name: "Perfumy"
		},
		KettleHop: {
			Name: "Kettle-hop"
		},
		DryHop: {
			Name: "Dry-hop"
		},
		HopOil: {
			Name: "Hop oil"
		}
	};

	this.groupTexts = {
		Vegetal: {
			Name: "Vegetal"
		},
		Cereal: {
			Name: "Cereal"
		},
		Maillard: {
			Name: "Maillard"
		},
		Fatty: {
			Name: "Fatty"
		},
		Sulfury: {
			Name: "Sulfury"
		},
		Stale: {
			Name: "Stale"
		},
		Mouthfeel: {
			Name: "Mouthfeel"
		},
		Fullness: {
			Name: "Fullness"
		},
		AromaticFragrantFruityFloral: {
			Name: "Aromatic, Fragrant, Fruity, Floral"
		}
	};

	this.subGroupTexts = {
		Resinous: {
			Name: "Resinous"
		},
		Nutty: {
			Name: "Nutty"
		},
		Grassy: {
			Name: "Grassy"
		},
		Grainy: {
			Name: "Grainy"
		},
		Caramel: {
			Name: "Caramel"
		},
		Burut: {
			Name: "Burut"
		},
		Phenolic: {
			Name: "Phenolic"
		},
		FattyAcid: {
			Name: "Fatty acid"
		},
		Oily: {
			Name: "Oily"
		},
		Sulfitic: {
			Name: "Sulfitic"
		},
		Sulfidic: {
			Name: "Sulfidic"
		},
		CookedVegetable: {
			Name: "Cooked vegetable"
		},
		Moldy: {
			Name: "Moldy"
		},
		Acidic: {
			Name: "Acidic"
		},
		Sweet: {
			Name: "Sweet"
		},
		Astringent: {
			Name: "Astringent"
		},
		Carbonation: {
			Name: "Carbonation"
		},
		Warming: {
			Name: "Warming"
		},
		Body: {
			Name: "Body"
		},
		Alcoholic: {
			Name: "Alcoholic"
		},
		SolventLike: {
			Name: "Solvent-like"
		},
		Estery: {
			Name: "Estery"
		},
		Fruity: {
			Name: "Fruity"
		},
		Floral: {
			Name: "Floral"
		},
		Hoppy: {
			Name: "Hoppy"
		}
	}

	this.slices = [
		{ Color: '#E4FEBF', Text: this.flavorNames.Piney, OuterRadius: this.outer.OuterRaduis, InnerRadius: this.outer.InnerRadius },
		{ Color: '#E1FFC2', Text: this.flavorNames.Woody },
		{ Color: '#DEFEBF', Text: this.flavorNames.Walnut, },
		{ Color: '#D9FDBD', Text: this.flavorNames.Coconut },
		{ Color: '#D7FDBF', Text: this.flavorNames.Beany },
		{ Color: '#D0FDBF', Text: this.flavorNames.Almond },
		{ Color: '#CEFFBD', Text: this.flavorNames.FreshlyCutGrass },
		{ Color: '#CAFEBE', Text: this.flavorNames.StrawLike },
		{ Color: '#C7FDC1', Text: this.flavorNames.Husky },
		{ Color: '#C3FDC2', Text: this.flavorNames.CornGrits },
		{ Color: '#BFFEC0', Text: this.flavorNames.Mealy },
		{ Color: '#7EFD88', Text: this.flavorNames.Malty, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#7EFD90', Text: this.flavorNames.Worty, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#BFFECA', Text: this.flavorNames.Molasses },
		{ Color: '#BFFED1', Text: this.flavorNames.Licorice },
		{ Color: '#C0FED4', Text: this.flavorNames.BreadCrust },
		{ Color: '#BEFEDC', Text: this.flavorNames.RoastBarley },
		{ Color: '#BEFEDC', Text: this.flavorNames.Smokey },
		{ Color: '#80FEBF', Text: this.flavorNames.Tarry, StrokeWidth: this.strokeWidthThick },
		{ Color: '#80FEC6', Text: this.flavorNames.Bakelite, StrokeWidth: this.strokeWidthThick },
		{ Color: '#80FDCC', Text: this.flavorNames.Carbolic, StrokeWidth: this.strokeWidthThick },
		{ Color: '#7FFDD4', Text: this.flavorNames.Chlorophenol, StrokeWidth: this.strokeWidthThick },
		{ Color: '#80FDDE', Text: this.flavorNames.Isodoform, StrokeWidth: this.strokeWidthThick },
		{ Color: '#BFFEF2', Text: this.flavorNames.Caprylic },
		{ Color: '#BFFEF6', Text: this.flavorNames.Cheesy },
		{ Color: '#BDFEFB', Text: this.flavorNames.Isovaleric },
		{ Color: '#C0FEFF', Text: this.flavorNames.Butyric },
		{ Color: '#80FAFE', Text: this.flavorNames.Diacetyl, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#83F3FF', Text: this.flavorNames.Rancid, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#C0F5FD', Text: this.flavorNames.VegetableOil },
		{ Color: '#BFF1FC', Text: this.flavorNames.MineralOil },
		{ Color: '#BEEDFD', Text: this.flavorNames.StrikingMatch },
		{ Color: '#C1EAFE', Text: this.flavorNames.Meaty },
		{ Color: '#BEE6FE', Text: this.flavorNames.HydrogenSulfide },
		{ Color: '#BFE3FD', Text: this.flavorNames.Mercaptan },
		{ Color: '#BDDFFC', Text: this.flavorNames.Garlic },
		{ Color: '#BEDBFE', Text: this.flavorNames.Lightstruck },
		{ Color: '#BFD8FE', Text: this.flavorNames.Autolysed },
		{ Color: '#C1D2FD', Text: this.flavorNames.BurntRubber },
		{ Color: '#BED0FE', Text: this.flavorNames.ShrimpLike },
		{ Color: '#BECAFE', Text: this.flavorNames.ParsnipCelery },
		{ Color: '#BFC8FF', Text: this.flavorNames.DimethylSulfide },
		{ Color: '#BFC3FD', Text: this.flavorNames.CookedCabbage },
		{ Color: '#BFBFFE', Text: this.flavorNames.CookedSweetCorn },
		{ Color: '#C2BDFD', Text: this.flavorNames.CookedTomato },
		{ Color: '#C5BFFD', Text: this.flavorNames.CookedOnion },
		{ Color: '#947FFE', Text: this.flavorNames.Yeasty, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#9D7FFD', Text: this.flavorNames.Catty, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#A380F9', Text: this.flavorNames.Papery, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#AC80FE', Text: this.flavorNames.Leathery, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#D9C0FD', Text: this.flavorNames.Earthy },
		{ Color: '#DEBFFF', Text: this.flavorNames.Musty },
		{ Color: '#C380FC', Text: this.flavorNames.Acetic, StrokeWidth: this.strokeWidthThick },
		{ Color: '#CE80F7', Text: this.flavorNames.Sour, StrokeWidth: this.strokeWidthThick },
		{ Color: '#D37FFF', Text: this.flavorNames.Honey, StrokeWidth: this.strokeWidthThick },
		{ Color: '#DA7FFB', Text: this.flavorNames.JamLike, StrokeWidth: this.strokeWidthThick },
		{ Color: '#E37FFE', Text: this.flavorNames.Vanilla, StrokeWidth: this.strokeWidthThick },
		{ Color: '#E980FC', Text: this.flavorNames.Primings, StrokeWidth: this.strokeWidthThick },
		{ Color: '#F17FFD', Text: this.flavorNames.Syrupy, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FA7FFE', Text: this.flavorNames.Oversweet, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FC01F9', Text: this.flavorNames.Salty, StrokeWidth: this.strokeWidthThick, InnerRadius: this.inner.InnerRadius, Bold: true },
		{ Color: '#FD00EC', Text: this.flavorNames.Bitter, StrokeWidth: this.strokeWidthThick, InnerRadius: this.inner.InnerRadius, Bold: true },
		{ Color: '#FB80ED', Text: this.flavorNames.Alkaline, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FD7FE6', Text: this.flavorNames.Mouthcoating, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FE80DC', Text: this.flavorNames.Metallic, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FDBEE9', Text: this.flavorNames.Drying },
		{ Color: '#FEBEE9', Text: this.flavorNames.Tart },
		{ Color: '#FCBFE3', Text: this.flavorNames.Puckering },
		{ Color: '#FE7FBF', Text: this.flavorNames.Powdery, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FDBDDD', Text: this.flavorNames.Flat },
		{ Color: '#FFBFDA', Text: this.flavorNames.Gassy },
		{ Color: '#FDC0D5', Text: this.flavorNames.Alcoholic },
		{ Color: '#FCBDCE', Text: this.flavorNames.Piquant },
		{ Color: '#FEBECC', Text: this.flavorNames.Watery },
		{ Color: '#FFBDC8', Text: this.flavorNames.Characterless },
		{ Color: '#FFBFC5', Text: this.flavorNames.Satiating },
		{ Color: '#FFC0C1', Text: this.flavorNames.Thick },
		{ Color: '#FCC0BF', Text: this.flavorNames.Spicy },
		{ Color: '#FEC5C1', Text: this.flavorNames.Vinous },
		{ Color: '#FCC8C2', Text: this.flavorNames.Plastics },
		{ Color: '#FCCDBF', Text: this.flavorNames.CanLiner },
		{ Color: '#FED2BE', Text: this.flavorNames.LaquerLike },
		{ Color: '#FED4BE', Text: this.flavorNames.IsoamylAcetate },
		{ Color: '#FFD7BE', Text: this.flavorNames.EthylHexanoate },
		{ Color: '#FEDCBF', Text: this.flavorNames.EthylAcetate },
		{ Color: '#FEE1BF', Text: this.flavorNames.Citrus },
		{ Color: '#FEE1C0', Text: this.flavorNames.Apple },
		{ Color: '#FEE8BF', Text: this.flavorNames.Banana },
		{ Color: '#FDEAC1', Text: this.flavorNames.BlackCurrant },
		{ Color: '#FDEFBE', Text: this.flavorNames.Melory },
		{ Color: '#FEF3BF', Text: this.flavorNames.Pear },
		{ Color: '#FEF7BE', Text: this.flavorNames.Raspberry },
		{ Color: '#FFFAC1', Text: this.flavorNames.Strawberry },
		{ Color: '#FFFE80', Text: this.flavorNames.Acetaldehyde, InnerRadius: this.inner.InnerRadius, StrokeWidth: this.strokeWidthThick },
		{ Color: '#FEFCC4', Text: this.flavorNames.Phenylethanol },
		{ Color: '#FAFEC0', Text: this.flavorNames.Geraniol },
		{ Color: '#F3FDBF', Text: this.flavorNames.Perfumy },
		{ Color: '#F0FEC1', Text: this.flavorNames.KettleHop },
		{ Color: '#ECFEBE', Text: this.flavorNames.DryHop },
		{ Color: '#E7FFBE', Text: this.flavorNames.HopOil }
	];

	this.groups = [
		{ ElementStart: 0, Count: 8, Color: "#73F519", Text: this.groupTexts.Vegetal },
		{ ElementStart: 8, Count: 5, Color: "#28F41C", Text: this.groupTexts.Cereal },
		{ ElementStart: 13, Count: 5, Color: "#1CF568", Text: this.groupTexts.Maillard },
		{ ElementStart: 23, Count: 8, Color: "#14F9EB", Text: this.groupTexts.Fatty },
		{ ElementStart: 31, Count: 16, Color: "#1351F8", Text: this.groupTexts.Sulfury },
		{ ElementStart: 47, Count: 5, Color: "#6927F3", Text: this.groupTexts.Stale },
		{ ElementStart: 62, Count: 11, Color: "#F6159D", Text: this.groupTexts.Mouthfeel },
		{ ElementStart: 73, Count: 4, Color: "#F61C34", Text: this.groupTexts.Fullness },
		{ ElementStart: 77, Count: 23, Color: "#F8B217", Text: this.groupTexts.AromaticFragrantFruityFloral }
	];

	var position = 0;

	this.subGroups = [
		{ ElementStart: position, ElementEnd: position += 2, Color: "#C6FE81", Text: this.subGroupTexts.Resinous },
		{ ElementStart: position, ElementEnd: position += 4, Color: "#AFFF82", Text: this.subGroupTexts.Nutty },
		{ ElementStart: position, ElementEnd: position += 2, Color: "#94F977", Text: this.subGroupTexts.Grassy },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#87FE7C", Text: this.subGroupTexts.Grainy },
		{ ElementStart: position += 2, ElementEnd: position += 2, Color: "#81FF9B", Text: this.subGroupTexts.Caramel },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#80FFAE", Text: this.subGroupTexts.Burut },
		{ ElementStart: position, ElementEnd: position += 5, Color: "#00FE9B", Text: this.subGroupTexts.Phenolic, OuterRadius: this.middle.OuterRaduis, StrokeWidth: this.strokeWidthThick, Bold: true },
		{ ElementStart: position, ElementEnd: position += 4, Color: "#80FEF2", Text: this.subGroupTexts.FattyAcid },
		{ ElementStart: position += 2, ElementEnd: position += 2, Color: "#82E8FF", Text: this.subGroupTexts.Oily },
		{ ElementStart: position, ElementEnd: position += 2, Color: "#81DBFF", Text: this.subGroupTexts.Sulfitic },
		{ ElementStart: position, ElementEnd: position += 7, Color: "#81B7FF", Text: this.subGroupTexts.Sulfidic },
		{ ElementStart: position, ElementEnd: position += 6, Color: "#8084FF", Text: this.subGroupTexts.CookedVegetable },
		{ ElementStart: position += 4, ElementEnd: position += 2, Color: "#B780FF", Text: this.subGroupTexts.Moldy },
		{ ElementStart: position, ElementEnd: position += 2, Color: "#9100FD", Text: this.subGroupTexts.Acidic, OuterRadius: this.middle.OuterRaduis, StrokeWidth: this.strokeWidthThick, Bold: true },
		{ ElementStart: position, ElementEnd: position += 6, Color: "#CC00FF", Text: this.subGroupTexts.Sweet, OuterRadius: this.middle.OuterRaduis, StrokeWidth: this.strokeWidthThick, Bold: true },
		{ ElementStart: position += 5, ElementEnd: position += 3, Color: "#FD80CF", Text: this.subGroupTexts.Astringent },
		{ ElementStart: position += 1, ElementEnd: position += 2, Color: "#FB82B5", Text: this.subGroupTexts.Carbonation },
		{ ElementStart: position, ElementEnd: position += 2, Color: "#FA81A7", Text: this.subGroupTexts.Warming },
		{ ElementStart: position, ElementEnd: position += 4, Color: "#FF8091", Text: this.subGroupTexts.Body },
		{ ElementStart: position, ElementEnd: position += 2, Color: "#FD8780", Text: this.subGroupTexts.Alcoholic },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#FF9980", Text: this.subGroupTexts.SolventLike },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#FEB180", Text: this.subGroupTexts.Estery },
		{ ElementStart: position, ElementEnd: position += 8, Color: "#FEDB7F", Text: this.subGroupTexts.Fruity },
		{ ElementStart: position += 1, ElementEnd: position += 3, Color: "#F0FF80", Text: this.subGroupTexts.Floral },
		{ ElementStart: position, ElementEnd: position += 3, Color: "#DAFE81", Text: this.subGroupTexts.Hoppy }
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
				StrokeWidth: slice.StrokeWidth,
				Color: slice.Color,
				InnerRadius: slice.InnerRadius || this.outer.InnerRadius,
				OuterRadius: this.outer.OuterRaduis,
				Text: slice.Text,
				PercentStart: cumulativePercent,
				PercentEnd: cumulativePercent + this.percentage,
				Bold: slice.Bold || false,
				FontFamily: this.fontFamily
			};
			Tools.drawSlice(options);
			cumulativePercent += this.percentage;
		});

		this.groups.forEach(group => {
			var options = {
				ParentElement: svgEl,
				StrokeWidth: this.strokeWidthThick,
				Color: group.Color,
				InnerRadius: this.middle.InnerRadius,
				OuterRadius: this.middle.OuterRaduis,
				Text: group.Text,
				PercentStart: group.ElementStart * this.percentage,
				PercentEnd: (group.ElementStart + group.Count) * this.percentage,
				UseTextPath: true,
				Bold: true,
				FontFamily: this.fontFamily
			};
			Tools.drawSlice(options);
		});

		this.subGroups.forEach(subGroup => {
			var options = {
				ParentElement: svgEl,
				StrokeWidth: subGroup.StrokeWidth,
				Color: subGroup.Color,
				InnerRadius: this.inner.InnerRadius,
				OuterRadius: subGroup.OuterRadius || this.inner.OuterRaduis,
				Text: subGroup.Text,
				PercentStart: subGroup.ElementStart * this.percentage,
				PercentEnd: subGroup.ElementEnd * this.percentage,
				Bold: subGroup.Bold || false,
				FontFamily: this.fontFamily
			};
			Tools.drawSlice(options);
		});
	};
};
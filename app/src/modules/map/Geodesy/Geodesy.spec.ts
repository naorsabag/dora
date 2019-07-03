import { Projection } from "./Projection";
import { Coordinate } from "../Geometries/Coordinate";
import { PROJECTIONS, UNITS } from "./Consts";
import { Geodesy } from "./Geodesy";

describe("Geodesy", () => {

	describe("converts geodesy system", () => {
		let coordinate: Coordinate = new Coordinate(32, 32);
		let projFrom: Projection;
		let projTo: Projection;
		let zone: number = 36;
		let correctOutput: { coordinate: Coordinate, zone: number };

		let createTest: () => void = () => {
			let testOutput: { coordinate: Coordinate, zone: number } =
				Geodesy.convertCoordinate(coordinate, projFrom, projTo, zone);

			expect(testOutput.zone)
				.toEqual(correctOutput.zone);
			expect(testOutput.coordinate.latitude)
				.toBeCloseTo(correctOutput.coordinate.latitude, 2);
			expect(testOutput.coordinate.longitude)
				.toBeCloseTo(correctOutput.coordinate.longitude, 2);
		};

		describe("from WGS84GEO to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.WGS84GEO;
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("PROJDUTMIII", () => {
				projTo = PROJECTIONS.PROJDUTMIII;
				correctOutput = {
					coordinate: new Coordinate(3541047.25, 405575.08),
					zone: 36
				};
				createTest();
			});

			it("WGS84UTM", () => {
				projTo = PROJECTIONS.WGS84UTM;
				correctOutput = {
					coordinate: new Coordinate(3540872.53, 405542.54),
					zone: 36
				};
				createTest();
			});

			it("PROJDIIIGEO", () => {
				projTo = PROJECTIONS.PROJDIIIGEO;
				correctOutput = {
					coordinate: new Coordinate(32.001099, 32.000376),
					zone: null
				};
				createTest();
			});

			it("PROJA", () => {
				projTo = PROJECTIONS.PROJA;
				correctOutput = {
					coordinate: new Coordinate(31.999616, 31.999424),
					zone: null
				};
				createTest();
			});

			it("PROJB", () => {
				projTo = PROJECTIONS.PROJB;
				correctOutput = {
					coordinate: new Coordinate(-220880.70, -675732.64),
					zone: 36
				};
				createTest();
			});

			it("PROJC", () => {
				projTo = PROJECTIONS.PROJC;
				correctOutput = {
					coordinate: new Coordinate(-220880.70, -675732.64),
					zone: 36
				};
				createTest();
			});
		});

		describe("from PROJDUTMIII to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.PROJDUTMIII;
				coordinate = new Coordinate(250000, 250000);
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("WGS84GEO", () => {
				projTo = PROJECTIONS.WGS84GEO;
				correctOutput = {
					coordinate: new Coordinate(2.258654, 30.751891),
					zone: null
				};
				createTest();
			});

			it("WGS84UTM", () => {
				projTo = PROJECTIONS.WGS84UTM;
				correctOutput = {
					coordinate: new Coordinate(249843.87, 249970.38),
					zone: 36
				};
				createTest();
			});

			it("PROJDIIIGEO", () => {
				projTo = PROJECTIONS.PROJDIIIGEO;
				correctOutput = {
					coordinate: new Coordinate(2.260042, 30.752243),
					zone: null
				};
				createTest();
			});

			it("PROJA", () => {
				projTo = PROJECTIONS.PROJA;
				correctOutput = {
					coordinate: new Coordinate(2.256172, 30.754745),
					zone: null
				};
				createTest();
			});

			it("PROJB", () => {
				projTo = PROJECTIONS.PROJB;
				correctOutput = {
					coordinate: new Coordinate(-3604222.33, -1010716.94),
					zone: 36
				};
				createTest();
			});

			it("PROJC", () => {
				projTo = PROJECTIONS.PROJC;
				correctOutput = {
					coordinate: new Coordinate(-3604222.33, -1010716.94),
					zone: 36
				};
				createTest();
			});
		});

		describe("from WGS84UTM to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.WGS84UTM;
				coordinate = new Coordinate(250000, 250000);
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("WGS84GEO", () => {
				projTo = PROJECTIONS.WGS84GEO;
				correctOutput = {
					coordinate: new Coordinate(2.260066, 30.752155),
					zone: null
				};
				createTest();
			});

			it("PROJDUTMIII", () => {
				projTo = PROJECTIONS.PROJDUTMIII;
				correctOutput = {
					coordinate: new Coordinate(250156.13, 250029.62),
					zone: 36
				};
				createTest();
			});

			it("PROJDIIIGEO", () => {
				projTo = PROJECTIONS.PROJDIIIGEO;
				correctOutput = {
					coordinate: new Coordinate(2.261454, 30.752507),
					zone: null
				};
				createTest();
			});

			it("PROJA", () => {
				projTo = PROJECTIONS.PROJA;
				correctOutput = {
					coordinate: new Coordinate(2.257584, 30.755009),
					zone: null
				};
				createTest();
			});

			it("PROJB", () => {
				projTo = PROJECTIONS.PROJB;
				correctOutput = {
					coordinate: new Coordinate(-3604054.48, -1010676.99),
					zone: 36
				};
				createTest();
			});

			it("PROJC", () => {
				projTo = PROJECTIONS.PROJC;
				correctOutput = {
					coordinate: new Coordinate(-3604054.48, -1010676.99),
					zone: 36
				};
				createTest();
			});
		});

		describe("from PROJDIIIGEO to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.PROJDIIIGEO;
				coordinate = new Coordinate(32, 32);
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("WGS84GEO", () => {
				projTo = PROJECTIONS.WGS84GEO;
				correctOutput = {
					coordinate: new Coordinate(31.998901, 31.999624),
					zone: null
				};
				createTest();
			});

			it("PROJDUTMIII", () => {
				projTo = PROJECTIONS.PROJDUTMIII;
				correctOutput = {
					coordinate: new Coordinate(3540925.74, 405538.44),
					zone: 36
				};
				createTest();
			});

			it("WGS84UTM", () => {
				projTo = PROJECTIONS.WGS84UTM;
				correctOutput = {
					coordinate: new Coordinate(3540751.02, 405505.90),
					zone: 36
				};
				createTest();
			});

			it("PROJA", () => {
				projTo = PROJECTIONS.PROJA;
				correctOutput = {
					coordinate: new Coordinate(31.998517, 31.999048),
					zone: null
				};
				createTest();
			});

			it("PROJB", () => {
				projTo = PROJECTIONS.PROJB;
				correctOutput = {
					coordinate: new Coordinate(-221000.20, -675776.50),
					zone: 36
				};
				createTest();
			});

			it("PROJC", () => {
				projTo = PROJECTIONS.PROJC;
				correctOutput = {
					coordinate: new Coordinate(-221000.20, -675776.50),
					zone: 36
				};
				createTest();
			});
		});

		describe("from PROJA to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.PROJA;
				coordinate = new Coordinate(32, 32);
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("WGS84GEO", () => {
				projTo = PROJECTIONS.WGS84GEO;
				correctOutput = {
					coordinate: new Coordinate(32.000384, 32.000576),
					zone: null
				};
				createTest();
			});

			it("PROJDUTMIII", () => {
				projTo = PROJECTIONS.PROJDUTMIII;
				correctOutput = {
					coordinate: new Coordinate(3541089.29, 405629.87),
					zone: 36
				};
				createTest();
			});

			it("WGS84UTM", () => {
				projTo = PROJECTIONS.WGS84UTM;
				correctOutput = {
					coordinate: new Coordinate(3540914.57, 405597.32),
					zone: 36
				};
				createTest();
			});

			it("PROJDIIIGEO", () => {
				projTo = PROJECTIONS.PROJDIIIGEO;
				correctOutput = {
					coordinate: new Coordinate(32.001483, 32.000952),
					zone: null
				};
				createTest();
			});

			it("PROJB", () => {
				projTo = PROJECTIONS.PROJB;
				correctOutput = {
					coordinate: new Coordinate(-220841.85, -675675.31),
					zone: 36
				};
				createTest();
			});

			it("PROJC", () => {
				projTo = PROJECTIONS.PROJC;
				correctOutput = {
					coordinate: new Coordinate(-220841.85, -675675.31),
					zone: 36
				};
				createTest();
			});
		});

		describe("from PROJB to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.PROJB;
				coordinate = new Coordinate(100000, 100000);
				zone = 37;
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("WGS84GEO", () => {
				projTo = PROJECTIONS.WGS84GEO;
				correctOutput = {
					coordinate: new Coordinate(35.096387, 40.248485),
					zone: null
				};
				createTest();
			});

			it("PROJDUTMIII", () => {
				projTo = PROJECTIONS.PROJDUTMIII;
				correctOutput = {
					coordinate: new Coordinate(3884592.28, 613799.55),
					zone: 37
				};
				createTest();
			});

			it("WGS84UTM", () => {
				projTo = PROJECTIONS.WGS84UTM;
				correctOutput = {
					coordinate: new Coordinate(3884445.02, 613795.61),
					zone: 37
				};
				createTest();
			});

			it("PROJDIIIGEO", () => {
				projTo = PROJECTIONS.PROJDIIIGEO;
				correctOutput = {
					coordinate: new Coordinate(35.097393, 40.248603),
					zone: null
				};
				createTest();
			});

			it("PROJA", () => {
				projTo = PROJECTIONS.PROJA;
				correctOutput = {
					coordinate: new Coordinate(35.096963, 40.247132),
					zone: null
				};
				createTest();
			});

			it("PROJC", () => {
				projTo = PROJECTIONS.PROJC;
				correctOutput = {
					coordinate: new Coordinate(100000.01, 100000.01),
					zone: 37
				};
				createTest();
			});
		});

		describe("from PROJC to", () => {
			beforeAll((done) => {
				projFrom = PROJECTIONS.PROJC;
				coordinate = new Coordinate(100000, 100000);
				zone = 37;
				done();
			});

			beforeEach((done) => {
				Geodesy.initilize();
				done();
			});

			it("WGS84GEO", () => {
				projTo = PROJECTIONS.WGS84GEO;
				correctOutput = {
					coordinate: new Coordinate(35.096387, 40.248485),
					zone: null
				};
				createTest();
			});

			it("PROJDUTMIII", () => {
				projTo = PROJECTIONS.PROJDUTMIII;
				correctOutput = {
					coordinate: new Coordinate(3884592.28, 613799.55),
					zone: 37
				};
				createTest();
			});

			it("WGS84UTM", () => {
				projTo = PROJECTIONS.WGS84UTM;
				correctOutput = {
					coordinate: new Coordinate(3884445.02, 613795.61),
					zone: 37
				};
				createTest();
			});

			it("PROJDIIIGEO", () => {
				projTo = PROJECTIONS.PROJDIIIGEO;
				correctOutput = {
					coordinate: new Coordinate(35.097393, 40.248603),
					zone: null
				};
				createTest();
			});

			it("PROJA", () => {
				projTo = PROJECTIONS.PROJA;
				correctOutput = {
					coordinate: new Coordinate(35.096963, 40.247132),
					zone: null
				};
				createTest();
			});

			it("PROJB", () => {
				projTo = PROJECTIONS.PROJB;
				correctOutput = {
					coordinate: new Coordinate(100000.01, 100000.01),
					zone: 37
				};
				createTest();
			});
		});
	});

	describe("converts units", () => {
		let coordinate: any;
		let source: UNITS;
		let target: UNITS;
		let correctOutput: string;

		let createTest: () => void = () => {
			let testOutput: string =
				Geodesy.convertUnits(coordinate, source, target);

			expect(testOutput)
				.toEqual(correctOutput);
		};

		describe("from DEGREES to", () => {
			beforeAll((done) => {
				source = UNITS.DEGREES;
				done();
			});

			it("SECONDS", () => {
				coordinate = 34.980584333940996;
				target = UNITS.SECONDS;
				correctOutput = "125930.10";

				createTest();
			});

			it("DMS", () => {
				coordinate = 34.980522992120456;
				target = UNITS.DMS;
				correctOutput = "34ᵒ58'49.8828\"";

				createTest();
			});
		});

		describe("from SECONDS to", () => {
			beforeAll((done) => {
				source = UNITS.SECONDS;
				done();
			});

			it("DEGREES", () => {
				coordinate = 125930.10;
				target = UNITS.DEGREES;
				correctOutput = "34.980583";

				createTest();
			});
		});

		describe("from DMS to", () => {
			beforeAll((done) => {
				source = UNITS.DMS;
				done();
			});

			it("DEGREES", () => {
				coordinate = "34°58'49.8828\"";
				target = UNITS.DEGREES;
				correctOutput = "34.980523";

				createTest();
			});
		});

	});
});
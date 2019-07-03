// Karma configuration
// Generated on Thu Jan 04 2018 16:12:41 GMT+0200 (Jerusalem Standard Time)

module.exports = function (config) {
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: 'test_bundle',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [
			"dora-tests.js",
			{ pattern: "Assets/**/*", included: false, served: true },
			{ pattern: "Workers/**/*", included: false, served: true },
			{ pattern: "Widgets/**/*", included: false, served: true },
			{ pattern: "ThirdParty/**/*", included: false, served: true },
			{ pattern: "test_assets/**/*", included: false, served: true },
			"../node_modules/jquery/dist/jquery.js",
			"../node_modules/jasmine-jquery/lib/jasmine-jquery.js"
		],

		proxies: {
			"/Assets/": "http://localhost:9876/base/Assets/",
			"/Workers/": "http://localhost:9876/base/Workers/",
			"/Widgets/": "http://localhost:9876/base/Widgets/",
			"/test_assets/": "http://localhost:9876/base/test_assets/"
		},

		// list of files to exclude
		exclude: [],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'app/**/*.js': ['sourcemap']
		},


		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress', 'kjhtml'],


		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],


		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false,

		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity,

		plugins: [
			"karma-jasmine",
			'karma-sourcemap-loader',
			"karma-chrome-launcher",
			'karma-jasmine-html-reporter'
		],

		browserConsoleLogOptions: {
			terminal: true
		},

		client: {
			captureConsole: true,
			clearContext: false,
			args: config.scene2d ? ["scene2d"] : config.scene3d ? ["scene3d"] : []
		}
	});
};

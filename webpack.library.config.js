const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const packageJson = require("./package.json");
const webpackConfig = require("./webpack.config.js");

for (let rule of webpackConfig.module.rules) {
	if (rule.use && rule.use[0] === "style-loader") {
		rule.use[0] = MiniCssExtractPlugin.loader;
	}
}

module.exports = {
	mode: "production",
	context: path.join(__dirname, "app"),
	devtool: 'source-map',
	entry: {
		"common": "./src/dora-common.ts",
		"leaflet": "./src/dora-leaflet.ts",
		"google-maps": "./src/dora-google-maps.ts",
		"google-earth": "./src/dora-google-earth.ts",
		"cesium": "./src/dora-cesium.ts",
		"style": "./src/Style/Map.less"
	},
	output: {
		path: path.join(__dirname, "bundle"),
		filename: "dora" + "-[name].js",
		library: "@dora/common",
		libraryTarget: "commonjs2"
	},
	optimization: {
		minimize: false
	},
	resolve: webpackConfig.resolve,
	module: webpackConfig.module,
	externals: [
		function (context, request, callback) {
			if (!/^\./.test(request) && !/\.(jpe?g|png|kml|gif|jpg|ico|svg)$/.test(request)) {
				return callback(null, {
					commonjs: request,
					commonjs2: request
				});
			} else {
				callback();
			}
		},
	],
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css"
		})
	]
};
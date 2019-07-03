const path = require("path");
const webpack = require("webpack");

const CopyWebpackPlugin = require("copy-webpack-plugin");

const cesiumSource = '/node_modules/cesium/Build/Cesium';

module.exports = {
	context: path.join(__dirname, "demo"),
	entry: "./scripts/index.ts",
	output: {
		path: "/dist",
		publicPath: "/dist",
		filename: "demo.js",
		libraryTarget: "umd",
		sourcePrefix: ''
	},
	node: {
		fs: 'empty'
	},
	amd: {
		toUrlUndefined: true
	},
	resolve: {
		extensions: ['.ts', '.js', '.html', '.webpack.js', '.web.js', '.css']
	},
	module: {
		unknownContextCritical: false,
		rules: [
			{
				test: /\.tsx?$/,
				loader: "ts-loader"
			}, {
				test: /\.less$/,
				use: ["style-loader", "css-loader", "less-loader"]
			}, {
				test: /\.css$/,
				use: ["style-loader", "css-loader"]
			}, {
				test: /\.svg$/,
				loader: "svg-url-loader",
				options: { limit: 10000 }
			}, {
				test: require.resolve("./app/vendor/earth-api-utility-library/extensions.js"),
				loader: "exports-loader?window.GEarthExtensions"
			},
			{ test: /\.(jpe?g|png|kml|gif|jpg|ico)$/, loader: "url-loader", options: { limit: 10000 } }
		]
	},
	plugins: [
		new CopyWebpackPlugin([{
			from: path.join(__dirname, cesiumSource, 'Workers'),
			to: path.join(__dirname, 'demo/Workers')
		}, {
			from: path.join(__dirname, cesiumSource, 'Assets'),
			to: path.join(__dirname, 'demo/Assets')
		}, {
			from: path.join(__dirname, cesiumSource, 'Widgets'),
			to: path.join(__dirname, 'demo/Widgets')
		},{
            from: path.join(__dirname, cesiumSource, 'ThirdParty'),
            to: path.join(__dirname, 'demo/ThirdParty')
        }]),
		new webpack.DefinePlugin({
			CESIUM_BASE_URL: JSON.stringify('/')
		})
	],
	devtool: "inline-source-map",
	devServer: {
		inline: true,
		hot: true,
		contentBase: path.join(__dirname, "demo"),
		port: 88
	},
	mode: "development"
};
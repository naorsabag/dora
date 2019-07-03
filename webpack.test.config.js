const path = require("path");
const packageJson = require("./package.json");
const webpack = require("webpack");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const cesiumSource = '../node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';

module.exports = {
    devtool: "inline-source-map",
    mode: "development",
    context: path.join(__dirname, "app"),
    entry: {
        tests: "./src/test/app.test.ts"
    },
    output: {
        path: path.join(__dirname, "test_bundle"),
        filename: "dora" + "-[name].js",
        library: "@dora/common",
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
        extensions: ['.ts', '.js', '.html', '.css']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.less$/,
                loader: ["style-loader", "css-loader", "less-loader"]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.svg$/,
                loader: "svg-url-loader",
                options: {limit: 10000}
            },
            {
                test: require.resolve("./app/vendor/earth-api-utility-library/extensions.js"),
                loader: "exports-loader?window.GEarthExtensions"
            },
            {test: /\.(jpe?g|png|kml|gif|jpg|ico)$/, loader: "url-loader", options: {limit: 10000}}
        ]
    },
    plugins: [
        new CopyWebpackPlugin([{from: path.join(cesiumSource, cesiumWorkers), to: 'Workers'},
            {from: path.join(cesiumSource, 'Assets'), to: 'Assets'},
            {from: path.join(cesiumSource, 'Widgets'), to: 'Widgets'},
            {from: path.join(cesiumSource, 'ThirdParty'), to: 'ThirdParty'},
            {from: 'src/test/test_assets', to: 'test_assets'}]),
        new webpack.DefinePlugin({
            CESIUM_BASE_URL: JSON.stringify('/')
        })
    ]
};

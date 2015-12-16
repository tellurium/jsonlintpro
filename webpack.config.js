var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            _: 'underscore',
            Backbone: 'backbone'
        }),
        new HtmlWebpackPlugin({
            favicon: 'src/images/favicon.png',
            template: 'src/index.html',
        }),
    ],
    module: {
        loaders: [
            { test: /\.css$/, loader: 'style-loader!css-loader' },
            { test: /\.js$/, loader: 'babel-loader' },
            { test: /\.html/, loader: 'html-loader' },
            { test: /\.(jpe?g|gif|png)$/, loader: "file-loader" }
        ]
    }
};

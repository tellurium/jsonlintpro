module.exports = {
    entry: './src/js/main.js',
    output: {
        path: 'dist',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: 'style-loader!css-loader' },
            { test: /\.js$/, loader: 'babel-loader' },
            { test: /\.html/, loader: 'file?name=[name].[ext]' }
        ]
    }
};

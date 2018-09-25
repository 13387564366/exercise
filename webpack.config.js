const webpack = require('webpack');
const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        'test': path.resolve(__dirname, `./src/test.js`)
    },
    output: {
        publicPath: '/',
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
    },
    plugins:[
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new HtmlPlugin({
            filename: path.resolve(__dirname, `./dist/index.html`),
            template: path.resolve(__dirname, `./src/index.html`)
        })
    ],
    devtool: 'eval-source-map',
    devServer: {
        hot: true,
        inline: true,
        open: true, // 自动打开浏览器
        contentBase: path.join(__dirname, 'dist'),
        publicPath: '',
        compress: true,
        host: 'localhost', // 0.0.0.0 localhost
        port: 9000,
        overlay: {
            warnings: false,
            errors: true
        }
    }
};



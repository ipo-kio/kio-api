'use strict';

const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
// const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const merge = require('deepmerge');
const path = require('path');

const sourceFolders = [
    // path.join(__dirname, 'src', 'task_example'),
    // path.join(__dirname, 'src', 'kio_api'),
    // path.join(__dirname, 'src', 'kio_test_box')
    path.join(__dirname, 'src')
];

//envirnoment env.mode = 'prod'|'dev'

module.exports = function (env) {
    let config = {
        entry: {
            'kio_api': './src/kio_api/kio_api.js',
            'dces2contest': './src/kio_test_box/dces2contest.js',
            'task_example': './src/task_example/task_example.js'
        },
        output: {
            path: path.join(__dirname, '/kio_test_box'),
            filename: '[name].js',
            library: '[name]'
        },
        resolve: {
            modules: sourceFolders
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader', //Why loader instead of use?
                    include: sourceFolders,
                    options: {
                        presets: [
                            ['es2015', { "modules": false }] //this is es2015 preset with options
                        ]
                    }
                },
                {
                    test: /\.scss$/,
                    include: sourceFolders,
                    use: ExtractTextPlugin.extract({
                        fallbackLoader: "style-loader",
                        loader: ["css-loader", "sass-loader"]
                    })
                },
                {
                    // test: /.*/,
                    include: [path.join(__dirname, 'src/kio_test_box/static')],
                    use: [{
                        loader: 'file-loader',
                        options: {
                            name: "[name].[ext]"
                        }
                    }]
                }
            ]
        },
        plugins: [
            new ExtractTextPlugin("[name].css"),
            // new CopyWebpackPlugin([{from: './src/kio_test_box/static'}]),
            new WebpackCleanupPlugin()
        ]
    };

    let debugConfig = {
        devtool: 'source-map',
        //debug: true, //TODO https://webpack.js.org/guides/migrating/#debug
        output: {
            pathinfo: true
        }
    };

    let productionConfig = {
        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                comments: false
            })
        ]
    };

    let arrayMerge = function (destArray, sourceArray, options) {
        return destArray.concat(sourceArray);
    };

    if (env && env.mode === 'prod') {
        return merge(config, productionConfig, {arrayMerge: arrayMerge});
    } else
        return merge(config, debugConfig, {arrayMerge: arrayMerge});
};
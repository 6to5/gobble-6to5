var babelc = require('babel-core');
var sander = require('sander');
var mapSeries = require('promise-map-series');
var objectAssign = require('object-assign');
var path = require('path');

module.exports = babel;

function babel(inputdir, outputdir, opts) {
	if (opts.importHelpers) {
		opts.externalHelpers = true;
		opts.metadataUsedHelpers = true;
	}
	return sander.lsr(inputdir).then(function(allFiles) {
		allFiles = allFiles.filter(extFilter);
		var usedHelpers = [];
		return mapSeries(allFiles, function(filename) {
			return sander.readFile(inputdir, filename).then(function(code) {
				if (opts.importHelpers) {
					var hf = slashes(filename) + '__babelHelpers.js';
					code = 'import babelHelpers from "' + hf + '";\n' + code;
				}
				var fileOpts = objectAssign({}, opts, {
					filename: inputdir + '/' + filename,
					filenameRelative: filename
				});
				delete fileOpts.importHelpers;
				var result = babelc.transform(code, fileOpts);
				if (opts.importHelpers) {
					var helpers = result.metadata.usedHelpers;
					for (var i = helpers.length - 1; i >= 0; i--) {
						if (usedHelpers.indexOf(helpers[i]) < 0) {
							usedHelpers.push(helpers[i]);
						}
					}
				}
				return sander.writeFile(outputdir, filename, result.code);
			});
		}).then(function() {
			if (opts.importHelpers) {
				var code = babelc.buildExternalHelpers(usedHelpers, 'var');
				code = code + '\nexport default babelHelpers;';
				return sander.writeFile(outputdir, '__babelHelpers.js', code);
			}
		});
	});
}

function extFilter(filename) {
	return /\.(js|es6)$/.test(filename)
}

function slashes(from) {
	var count = from.split('/').length;
	return count > 1 ? (new Array(count + 1)).join('../') : './';
}

babel.defaults = {
	accept: ['.js', '.es6'],
	ext: '.js',
	sourceMap: true
};

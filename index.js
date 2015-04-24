var babelc = require('babel-core');
var resolveRc = require('babel-core/lib/babel/tools/resolve-rc')
var sander = require('sander');
var mapSeries = require('promise-map-series');
var objectAssign = require('object-assign');
var path = require('path');

module.exports = babel;

function babel(inputdir, outputdir, opts) {
	importHelpers = !!opts.importHelpers;
	if (importHelpers) {
		opts.externalHelpers = true;
		opts.metadataUsedHelpers = true;
	}
	delete opts.importHelpers;
	resolveRc(inputdir, opts);
	return sander.lsr(inputdir).then(function(allFiles) {
		allFiles = allFiles.filter(extFilter);
		var usedHelpers = [];
		return mapSeries(allFiles, function(filename) {
			return sander.readFile(inputdir, filename).then(function(code) {
				if (importHelpers) {
					var hf = slashes(filename) + '__babelHelpers.js';
					code = 'import {babelHelpers} from "' + hf + '";\n' + code;
				}
				var result = babelc.transform(code, objectAssign({}, opts, {
					filename: inputdir + '/' + filename
				}));
				if (importHelpers) {
					addUniqueHelpers(usedHelpers, result.metadata.usedHelpers);
				}
				return sander.writeFile(outputdir, filename, result.code);
			});
		}).then(function() {
			if (importHelpers) {
				var code = buildHelpers(usedHelpers, opts);
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

function buildHelpers(usedHelpers, opts) {
	var helpers1 = babelc.buildExternalHelpers(usedHelpers, "var");
	addUniqueHelpers(usedHelpers,
		babelc.transform(helpers1, objectAssign({}, opts, {
			externalHelpers: true,
			metadataUsedHelpers: true
		})).metadata.usedHelpers
	);
	delete opts.metadataUsedHelpers;
	var helpers2 = babelc.buildExternalHelpers(usedHelpers, "var");
	return "export " + babelc.transform(helpers2, opts).code;
}

function addUniqueHelpers(dest, src) {
	for (var i = src.length - 1; i >= 0; i--) {
		if (dest.indexOf(src[i]) < 0) {
			dest.push(src[i]);
		}
	}
}

babel.defaults = {
	accept: ['.js', '.es6'],
	ext: '.js',
	sourceMap: true
};

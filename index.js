var babelc = require('babel-core');
var resolveRc = require('babel-core/transformation/file/options/resolve-rc')
var sander = require('sander');
var mapSeries = require('promise-map-series');
var assign = require('lodash/object/assign');
var merge = require('lodash/object/merge');
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
				var result = babelc.transform(code, assign({}, opts, {
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
	opts = merge({}, opts, {
		externalHelpers: true,
		metadataUsedHelpers: true,
		blacklist: ["strict", "es6.tailCall"]
	}, mergeCustom);
	addUniqueHelpers(usedHelpers,
		babelc.transform(helpers1, opts).metadata.usedHelpers
	);
	delete opts.metadataUsedHelpers;
	var helpers2 = babelc.buildExternalHelpers(usedHelpers, "var");
	return "export " + babelc.transform(helpers2, opts).code;
}

function mergeCustom(a, b) {
	if (Array.isArray(a)) {
		var c = a.slice(0);
		for (var i = b.length - 1; i >= 0; i--) {
			var v = b[i];
			if (c.indexOf(v) < 0) {
				c.push(v);
			}
		}
		return c;
	}
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

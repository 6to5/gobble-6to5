var babelCore = require( 'babel-core' );
var dirname = require( 'path' ).dirname;

module.exports = babel;

function babel ( code, options ) {
	options.sourceMap = options.sourceMap !== false;

	// trigger use of .babelrc
	options.filename = this.src;

	var result = babelCore.transform( code, options );

	if ( options.externalHelpers ) {
		var helpers = babelCore.buildExternalHelpers( result.metadata.usedHelpers );
		result.write( helpers );
	}
	return result;
}

babel.defaults = {
	accept: [ '.js', '.es6' ],
	ext: '.js'
};

var transform = require( 'babel-core' ).transform;
var dirname = require( 'path' ).dirname;
var rc = require( 'rc' );

module.exports = babel;

function babel ( code, options ) {
	var cwd = process.cwd();
	options.sourceMap = options.sourceMap !== false;

	// apply .babelrc files
	process.chdir( dirname( this.src ) );
	rc( 'babel', options );
	process.chdir( cwd );

	delete options.config;
	delete options.configs;

	return transform( code, options );
}

babel.defaults = {
	accept: [ '.js', '.es6' ],
	ext: '.js'
};

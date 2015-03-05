module.exports = babel;

function babel ( code, options ) {
	options.sourceMap = options.sourceMap !== false;
	delete options.accept;
	delete options.ext;
	return require( 'babel-core' ).transform( code, options );
}

babel.id = 'babel';

babel.defaults = {
	accept: ['.js', '.es6'],
	ext: 'js'
};

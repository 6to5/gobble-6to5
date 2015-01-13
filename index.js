module.exports = to5;

function to5 ( code, options ) {
	options.sourceMap = options.sourceMap !== false;

	// 6to5 falls over if someone slips a contains method on the Array prototype (es6-transpiler)
	if ( Array.prototype.hasOwnProperty( 'contains' ) ) {
		delete Array.prototype.contains;
	}

	return require( '6to5-core' ).transform( code, options );
}

to5.id = '6to5';

to5.defaults = {
	accept: '.js'
};

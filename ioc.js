( function() {
	var pub = {},
		path = require( 'path' ), fs = require( 'fs' ),
		log = require( './log.js' )( 'ioc' ),
		settings = require( './settings.js' )( require( './log.js' )( 'settings' ) ),
		container = require( './container.js' )( require( './log.js' )( 'container' ) ),
		files = require( './files.js' )( path, fs, require( './log.js' )( 'files' ), require( 'path' ).dirname( module.parent.filename ) ),
		startedCallback,
		started = false;
	pub.register = function( name, pathOrLoaded, lifecycleTransient ) {
		if( typeof( pathOrLoaded ) == 'string' )
			container.register( name, require( files.getFullPath( pathOrLoaded ) ), lifecycleTransient ? false : true );
		else
			container.load( name, pathOrLoaded );
		return pub;
	};
	pub.registerRequired = function( name, required, lifecycleTransient ) {
		container.register( name, required, lifecycleTransient ? false : true );
		return pub;
	};
	pub.registerDependency = function( name, loaded ) {
		container.registerDependency( name, loaded );
		return pub;
	};

	pub.replaceDependency = function(name, loaded) {
		container.replaceDependency(name, loaded);
		return pub;
	};

	pub.registerLib = function( required ) {
		if( typeof( required ) == 'string' )
			container.registerLib( required, require( required ) );
		else
			container.register( undefined, required, true );
		return pub;
	};
	pub.autoRegister = function( relativePath ) {
		log.trace( 'ioc', 'Auto regestering', relativePath, undefined );
		files.findValidFiles( relativePath, pub.register );
		return pub;
	};
	pub.wrap = function( name, wrapperName ) {
		log.info( 'Wrapping', wrapperName + '( ' + name + ' )' );
		container.wrap( name, wrapperName );
		return pub;
	};
	pub.start = function( callback ) {
		log.info( 'ioc', 'Starting by resolving all', undefined, undefined );
		container.resolveAll( function() {
			log.info( 'ioc', 'All resolved', undefined, undefined );
			started = true;
			if( callback )
				container.inject( callback );
			if( startedCallback )
				container.inject( startedCallback );
		} );
		return pub;
	};
	pub.inject = function( fn ) {
		container.inject( fn );
		return pub;
	};
	pub.reset = function() {
		container.reset();
		settings.reset();
		pub.register( 'ioc', pub );
		return pub;
	};
	pub.setLogLevel = function( level ) {
		log.setLogLevel( level );
		return pub;
	};
	pub.setStartedCallback = function( fn ) {
		startedCallback = fn;
		if( started )
			pub.inject( startedCallback );
		return pub;
	};
	pub.setSettings = function( name, data ) {
		settings.set( data );
		pub.register( name, data );
		return pub;
	};
	pub.conditionalAutoRegister = function( settingsKey, conditionalValue, path ) {
		log.trace( 'ioc', 'ConditionalAutoRegister', settingsKey, undefined );
		return ( settings.matchesSetting( settingsKey, conditionalValue ) ) ? pub.autoRegister( path ) : pub;
	};
	pub.getSettings = function() {
		return settings.getSettings();
	};
	pub.conditionalPathAutoRegister = function( settingsKey, basePath ) {
		log.trace( 'ioc', 'ConditionalPathAutoRegister', settingsKey, undefined );
		var settingsValue = settings.getSetting( settingsKey );
		if( settingsValue ) {
			if( basePath.indexOf( '/', basePath.length - 1 ) < 0 )
				basePath += '/';
			return pub.autoRegister( basePath + settingsValue );
		}
		else return pub;
	};
	pub.conditionalRegister = function( settingsKey, conditionalValue, name, pathOrLoaded, lifecycleTransient ) {
		log.trace( 'ioc', 'ConditionalRegister', settingsKey, undefined );
		return ( settings.matchesSetting( settingsKey, conditionalValue ) ) ? pub.register( name, pathOrLoaded, lifecycleTransient ) : pub;
	};
	pub.conditionalRegisterRequired = function( settingsKey, conditionalValue, name, required, lifecycleTransient ) {
		log.trace( 'ioc', 'ConditionalRegisterRequired', settingsKey, undefined );
		return ( settings.matchesSetting( settingsKey, conditionalValue ) ) ? pub.registerRequired( name, required, lifecycleTransient ) : pub;
	};
	pub.wrapFromSettings = function( settingsKey ) {
		log.trace( 'wrapFromSettings', settingsKey );
		var wrapperSettings = settings.getSetting( settingsKey );
		if( wrapperSettings ) {
			for( var name in wrapperSettings )
				pub.wrap( name, wrapperSettings[ name ] );
		}
		return pub;
	};
	pub.setWaitingWarningTime = function( milliseconds ) {
		container.setWaitingWarningTime( milliseconds );
		return pub;
	};
	pub.setLogger = function( name, logger ) {
		var resolvedLogger = logger( 'ioc', settings.getSettings() );
		pub.registerRequired( name, logger, true );
		log = resolvedLogger;
		settings.setLogger( logger( 'settings', settings.getSettings() ) );
		container.setLogger( logger( 'container', settings.getSettings() ) );
		files.setLogger( logger( 'files', settings.getSettings() ) );
		return pub;
	};
	pub.multiRegisterSingletons = function( components ) {
		for( var name in components )
			pub.register( name, components[ name ] );
		return pub;
	};
	pub.multiRegisterLibs = function( libs ) {
		libs.forEach( function( lib ) {
			pub.registerLib( lib );
		} );
		return pub;
	};
	pub.register( 'ioc', pub );
	module.exports = pub;
} ).call( this );

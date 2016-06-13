import fs from 'fs';

import {Config} from '../../config.js';

Picker.route('/media/:filename', function( params, req, res ){
	var imageContent;
	try{
		console.log( 'loading image' );
		imageContent = fs.readFileSync( Config.data.path + params.filename );
	} catch( e ){
		imageContent = false;
	}
	res.end( imageContent )
});

Picker.route('/media/thumbnail/:filename', function( params, req, res ){
	var imageContent;
	try{		
		imageContent = fs.readFileSync( Config.data.thumbnailPath + params.filename );
	} catch( e ){
		imageContent = false;
	}
	res.end( imageContent )
});
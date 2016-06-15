import { Meteor } from 'meteor/meteor';

import fs from 'fs';


//routes
import './routes.js';

//data & api 
import { Contributions } from '../../api/contributions/contributions.js';
import '../../api/contributions/methods.js';
import '../../api/contributions/server/publications.js';

import { Cursor } from '../../api/cursor/cursor.js';
import '../../api/cursor/methods.js';
import '../../api/cursor/server/publications.js';

import { Localnets } from '../../api/localnets/localnets.js';
import '../../api/localnets/methods.js';
import '../../api/localnets/server/publications.js';

import { Transforms } from '../../api/transforms/transforms.js';
import '../../api/transforms/methods.js';
import '../../api/transforms/server/publications.js';

import { LocalnetsApi } from '../../modules/server/Localnets.js';

import { Helpers } from '../../modules/server/Helpers.js';

import { Config } from '../../config.js';

var lnApi;

Meteor.startup(() => {
	//ensure folders
	Helpers.makeFolderIfNotExists( Config.data.path );
	Helpers.makeFolderIfNotExists( Config.data.thumbnailPath );

	// also exactly and only one transforms object
	if( Transforms.find().count() === 0 ){
		// if there are no Transformss, add one
		Transforms.insert({ 
			// cssTransform: 'transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
			// rawLayout: {
			// 	id: 'storymap-grid',
			// 	sourcePoints: [
			// 		[ 0, 0 ],
			// 		[ 1080, 0 ],
			// 		[ 1080, 1080 * Config.grid.ratio.y ],
			// 		[ 0, 1080 * Config.grid.ratio.y ]
			// 	],
			// 	targetPoints: [
			// 		[ 0, 0 ],
			// 		[ 1080, 0 ],
			// 		[ 1080, 1080 * Config.grid.ratio.y ],
			// 		[ 0, 1080 * Config.grid.ratio.y ]
			// 	]
			// }		
		});
	}	
	
	if( Transforms.find().count() > 1 ){
		// if there is more than one Transforms, delete all but the first
		var transforms = Transforms.findOne({});
		Transforms.remove({});
		Transforms.insert( Transforms );
	}

	// we should always have exactly and only one cursor at a time (otherwise shit gets weird)

	if( Cursor.find().count() === 0 ){
		// if there are no cursors, add one
		Cursor.insert({ 
			position: [500, 500],
			size: [10,10] // i.e. grid of 10x10
		});
	}	
	
	if( Cursor.find().count() > 1 ){
		// if there is more than one cursor, delete all but the first
		var cursor = Cursor.findOne({});
		Cursor.remove({});
		Cursor.insert( cursor );
	}

	lnApi = new LocalnetsApi();

});
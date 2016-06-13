import { Meteor } from 'meteor/meteor';
import { Cursor } from './cursor.js';
import { Contributions } from '../contributions/contributions.js';

import { Config } from '../../config.js';
import { Helpers } from '../../modules/server/Helpers.js';

Meteor.methods({
	'cursor.getPosition'(){
		return Cursor.findOne({}).position;
	},
	'cursor.getContribution'(){
		var cursor = Cursor.findOne({});
		var box = [
			[ cursor.position[0], cursor.position[1] + cursor.size[1] ], //bottom left 
			[ cursor.position[0] + cursor.size[0], cursor.position[1] ] //top right
		];
		var contribution = Contributions.findOne({ position: { $geoWithin: { $box: box } } });
		
		return contribution || false;
	},
	'cursor.setSize'({ width, height }){		
		var w = Math.round( width );
		var h = Math.round( height );
		if( w < Config.cursor.min ){
			w = Config.cursor.min;
		}
		if( w > Config.cursor.max ){
			w = Config.cursor.max;
		}
		if( h < Config.cursor.min ){
			h = Config.cursor.min;
		}
		if( h > Config.cursor.max ){
			h = Config.cursor.max;
		}		
		var cursor = Cursor.findOne({});
		Cursor.update( cursor._id, { $set: {size: [w, h] } } );

		Meteor.call( 'cursor.moveBy', {xSteps: 0, ySteps: 0 });
	},
	'cursor.moveBy'({ xSteps, ySteps }){
		var cursor = Cursor.findOne({});
		var position = cursor.position;
		position[0] = position[0] + ( xSteps * cursor.size[0] );
		position[1] = position[1] + ( ySteps * cursor.size[1] );
		//keep cursor within bounds of the grid
		if( position[0] < Config.grid.min ){
			position[0] = Config.grid.min;
		}
		if( position[0] > Config.grid.max - cursor.size[0] ){
			position[0] = Config.grid.max - cursor.size[0];
		}
		if( position[1] < Config.grid.min ){
			position[1] = Config.grid.min;
		}
		if( position[1] > Config.grid.max - cursor.size[1] ){
			position[1] = Config.grid.max - cursor.size[1];
		}
		//fix it to grid steps (grid is based on its size)
		if( position[0] % cursor.size[0] !== 0 ){
			position[0] -= position[0] % cursor.size[0];
		}
		if( position[1] % cursor.size[1] !== 0 ){
			position[1] -= position[1] % cursor.size[0];
		}
		Cursor.update(cursor._id, {$set: {position: position}} );
		return position;
	}
});
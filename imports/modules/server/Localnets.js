import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
//import { lwip } from 'meteor/jss:meteor-lwip';
//import fs from 'fs';

import { Helpers } from '../../modules/server/Helpers.js';

import { Config } from '../../config.js';

import { Cursor } from '../../api/cursor/cursor.js';
import { Contributions } from '../../api/contributions/contributions.js';
import { Localnets } from '../../api/localnets/localnets.js';

var LocalnetsWrapper = function(){
	var self = this;
	var url = Config.localnets.url;

	var getLocalnetsGridPosition = function( post ){
		var position = [
			post.preferred_location.lat, 
			post.preferred_location.lng 
		];
		// convert lat / lon to grid coordinates
		position = Helpers.worldToGrid( position );
		// clamp to grid range - just in case there's any outliers
		position = Helpers.clampToGrid( position );
		return position;
	};

	var coordFromOffset = function( point, offset, size ){
		var x = offset[0] * size[0];
		var y = offset[1] * size[1];

		return [ point[0] + x, point[1] + y ];
	};

	var cellsFromOffset = function( point, offset, size ){
		var ringLength = offset * 8;
		var sideLength = (ringLength / 4) + 1;		
		var nw = coordFromOffset( point, [-offset, -offset], size );
		var ne = coordFromOffset( point, [offset, -offset], size );
		var se = coordFromOffset( point, [offset, offset], size );
		var sw = coordFromOffset( point, [-offset, offset], size );
		var cellBoundarySize = 0.000001;
		var cells = []
		/// top
		var x = 0;
		var y = nw[1];
		for( x = nw[0]; x <= ne[0]; x += size[0] ){
			cells.push( Helpers.calculateCellBox( [x, y], size ) );
		}
		/// right
		x = ne[0];
		for( y = ne[1] + size[1]; y < se[1]; y += size[1] ){
			cells.push( Helpers.calculateCellBox( [x, y], size ) );
		}
		/// bottom
		y = se[1];
		for( x = se[0]; x >= sw[0]; x-= size[0] ){
			cells.push( Helpers.calculateCellBox( [x, y], size ) );
		}
		//left
		x = sw[0];
		for( y = sw[1] - size[1]; y > nw[1]; y -= size[1] ){
			cells.push( Helpers.calculateCellBox( [x, y], size ) );
		}
 
		return cells;
	};

	var calculateOffsetPosition = function( position, size, aimMax, offset ){
		offset = offset || 0;
		var gridW = Config.grid.max;
		var gridH = Math.floor( Config.grid.max * Config.grid.ratio.y );
		var max = aimMax;
		// 1. Calculate position (i.e. Is it on an edge/ corner 
		// -> this affects the no. of rings we use)
		if( position[0] < aimMax || position[0] > gridW - aimMax){			
			max++;
		}
		if( position[1] < aimMax || position[1] > gridH - aimMax ){
			max++;
		}
		var cells = [];
		// 2. Calculate boxes for each cell in each ring. 
		// Clockwise spiral as 1d array
		for( var i = 1; i < max + 1; i++ ){			
			// TODO : get correct offset for edge cells so that they don't 
			// leave the grid...
			cells = cells.concat( cellsFromOffset( position, i, size ) );			
		}
		// 3. Find last overflow index (modulo possible boxes)
		//console.log( 'cells: ', cells )
		var index = offset % cells.length;

		console.log( 'Adding overflows at index: ' + index );

		for( var i = index; i < cells.length; i++ ){
			var existing = Contributions.findOne({ position: { $geoWithin: { $box: cells[i] } } });
			if( !existing ){
				var cell = cells[i];
				var pos = [ cell[0][0], cell[1][1] ];
				pos = Helpers.clampToGrid( pos );
				console.log( 'Overflow position: ', pos );
				return {
					offset: i,
					position: pos
				}
			}
		}
		return false;
	};

	var createContributionFromLocalnets = function( post ){
		var cursor = Cursor.findOne({});
		var position = getLocalnetsGridPosition( post );
		
		var box = Helpers.calculateCellBox( position, cursor.size );
		var existing = Contributions.findOne({ position: { $geoWithin: { $box: box } } });

		if( existing ){
			// TODO : wrap around actual cell in the center
			// var newPos = calculateOffsetPosition( position, cursor.size, 2, existing.overflowIndex );			
			// if( newPos ){
			// 	Contributions.update( existing._id, { $set: { overflowIndex: newPos.offset } } );
			// 	position = newPos.position;
			// }
		}
		console.log( 'Position: ', position );
		var media = false;
		var preview = false
		post.native_secondary_nodes.forEach( function( node ){
			// TODO : check if this is the right way of doing it
			if( !media && !preview && node.type === 'image' ){
				media = node.value;
				preview = node.value + ':thumb';
			}
		});
		var contribution = {
			position: position,
			viaTable: false,
			localnetsID: post._id,
			tweetID: post.native_id,
		};
		if( media ){			
			contribution.media = media;
			// TODO : resize image to preview (50x50)
			// unless we are able to have the different sizes from twitter
			// possibly using lwip: https://github.com/EyalAr/lwip 
			contribution.preview = preview;
		} else {
			console.log( '---> No media in', post._id ,'Use Default' );
			contribution.media = Config.localnets.defaultImage;
			contribution.preview = Config.localnets.defaultPreview;
		}
		return contribution;
	}

	var addPostIfNotExists = function( post ){
		var id = post._id;
		if( !Localnets.findOne( {localnetsID: id } ) ){
			// add to localnets collection
			var dbLocalnetsID = Localnets.insert({ 
				localnetsID: id, 
				post: post 
			});
			// ready a record to store as contribution
			// this includes figuring out lat/lon -> grid coordinates
			// and offsetting positions in case of overlap
			var record = createContributionFromLocalnets( post );
			record.dbLocalnetsID = dbLocalnetsID;
			// save as a contribution
			Contributions.insert( record );
		}
	};

	var debugAtCountAt = function( location, count ){
		var first = Contributions.insert({
			position: location,
			viaTable: false,
			localnetsID: i + '-fake-' + (new Date()).getTime(),
			tweetID: i + '-fake-' + (new Date()).getTime()
		});
		for( var i = 1; i < count; i++ ){
			var nextID = Contributions.insert({
				position: location,
				viaTable: false,
				localnetsID: i + '-fake-' + (new Date()).getTime(),
				tweetID: i + '-fake-' + (new Date()).getTime()
			});
			Contributions.update( {_id:first}, {overflow: {$push: nextID} })
		}
	}

	var getAllPosts = function(){
		console.log( '-----> Getting Localnets from URL -----> ', url );
		var posts = false;
		try{
			posts = HTTP.get( url );
			posts.content = JSON.parse( posts.content );
		} catch( e ){
			console.log( '-----> Unable to reach localnets.' );
			console.log( '-----> ERROR: ', e );
		}
		if( posts ){
			if( posts.content.count > 0 ){
				console.log('-----> Localnets get success. ', posts.content.count, ' posts' );			
				posts.content.data.forEach(function( post ){
					addPostIfNotExists( post );
				});
			}
		}
		//debugAtCountAt( [150,150], 10 );
		//console.log( '------> Fake localnets grid check: at [150, 150]' );
		//calculateOffsetPosition( [150,150], [10,10], 3, 0 );
	};

	getAllPosts();

	this.getInterval = Meteor.setInterval( function(){
		getAllPosts();
	}, Config.localnets.updateInterval );
}

var LocalnetsApi = LocalnetsWrapper;

export { LocalnetsApi };
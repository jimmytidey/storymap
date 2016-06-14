import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
//import { lwip } from 'meteor/jss:meteor-lwip';
//import fs from 'fs';

import { Helpers } from '../../modules/server/Helpers.js';

import { Config } from '../../config.js';

import { Cursor } from '../../api/cursor/cursor.js';
import { Contributions } from '../../api/contributions/contributions.js';
import { Localnets } from '../../api/localnets/localnets.js';

var LocalnetsApi = function(){
	var self = this;
	var url = Config.localnets.url;

	var getLocalnetsGridPosition = function( post, _steps ){
		var steps = _steps || false;
		var position = [
			post.preferred_location.lat, 
			post.preferred_location.lng 
		];
		// convert lat / lon to grid coordinates
		position = Helpers.worldToGrid( position );
		if( steps ){
			//set to be on the grid interval
			position = Helpers.fitToCells( position, steps );
		}
		// clamp to grid range - just in case there's any outliers
		position = Helpers.clampToGrid( position );
		return position;
	};

	var coordFromOffset = function( point, offset, size ){
		var x = offset[0] * size[0];
		var y = offset[1] * size[1];

		return [ point[0] + x, point[1] + y ];
	};

	var cellsFromOffset = function( point, offset, size, _nudge ){
		nudge = _nudge || [0,0];
		var ringLength = offset * 8;
		var sideLength = (ringLength / 4) + 1;		
		var nw = coordFromOffset( point, [(-offset) + nudge[0], (-offset) + nudge[1]], size );
		var ne = coordFromOffset( point, [(offset) + nudge[0], (-offset) + nudge[1]], size );
		var se = coordFromOffset( point, [(offset) + nudge[0], (offset) + nudge[1]], size );
		var sw = coordFromOffset( point, [(-offset) + nudge[0], (offset) + nudge[1]], size );
		var cellBoundarySize = 0.000001;
		var cells = []
		/// top
		var x = 0;
		var y = nw[1];
		var pl
		for( x = nw[0] + size[0]; x <= ne[0]; x += size[0] ){
			p = Helpers.clampToGrid( [x, y] );
			cells.push( Helpers.calculateCellBox( p, size ) );
		}
		/// right
		x = ne[0];
		for( y = ne[1] + size[1]; y < se[1]; y += size[1] ){
			p = Helpers.clampToGrid( [x, y] );
			cells.push( Helpers.calculateCellBox( p, size ) );
		}
		/// bottom
		y = se[1];
		for( x = se[0]; x >= sw[0]; x-= size[0] ){
			p = Helpers.clampToGrid( [x, y] );
			cells.push( Helpers.calculateCellBox( p, size ) );
		}
		//left
		x = sw[0];
		for( y = sw[1] - size[1]; y >= nw[1]; y -= size[1] ){
			p = Helpers.clampToGrid( [x, y] );
			cells.push( Helpers.calculateCellBox( [x, y], size ) );
		}
 
		return cells;
	};

	var calculateOffsetPosition = function( position, size, aimMax, offset ){
		offset = offset || 0;
		var gridW = Config.grid.max;
		var gridH = Math.floor( Config.grid.max * Config.grid.ratio.y );
		var max = aimMax;
		var nudge = [0,0];
		// 1. Calculate position (i.e. Is it on an edge/ corner 
		// -> this affects the no. of rings we use)
		if( position[0] < aimMax ){			
			nudge[0] = ( position[0] - aimMax ) * -1;
			max++;
		}
		if( position[0] > gridW - aimMax ){
			nudge[0] = position[0] - gridW;
			max++;
		}			
		if( position[1] < aimMax ){
			nudge[1] = ( position[1] - aimMax ) * -1;
			max++;
		} 
		if( position[1] > gridH - aimMax ){
			nudge[1] = position[1] - gridH;
			max++;
		}

		console.log( 'Spiralling from: ', position, 'Offsetting by: ', nudge );

		var cells = [];		
		
		for( var i = 1; i < max + 1; i++ ){						
			cells = cells.concat( cellsFromOffset( position, i, size, nudge ) );
		}
		var notFromTable = [];

		// look for an empty cell surrounding this one
		for( var i = 0; i < cells.length; i++ ){
			var existing = Contributions.findOne({ position: { $geoWithin: { $box: cells[i] } } });
			console.log( existing )
			var cell = cells[i];
			if( !existing ){
				var pos = [ cell[0][0], cell[1][1] ];
				pos = Helpers.clampToGrid( pos );

				return {
					offset: i,
					position: pos,
					replace: false
				}
			} else {
				if( !existing.viaTable ){
					var pos = [ cell[0][0], cell[1][1] ];
					
					notFromTable.push( cell );
				}
			}
		}
		// we haven't found an empty one.
		// pick a random one that hasn't got table content in it
		
		var randomIndex = Math.floor( Math.random() * notFromTable.length );
		var cell = notFromTable[ randomIndex ];
		var existing = Contributions.findOne({ position: { $geoWithin: { $box: cell } } });
		var pos = [ cell[0][0], cell[1][1] ];
		pos = Helpers.clampToGrid( pos );
		
		return {
			offset: i,
			position: pos,
			replace: existing
		};

	};

	var createContributionFromLocalnets = function( post ){
		var cursor = Cursor.findOne({});
		var position = getLocalnetsGridPosition( post, cursor.size );
		
		var box = Helpers.calculateCellBox( position, cursor.size );
		
		var existing = Contributions.findOne(
			{ position: { $geoWithin: { $box: box } } },
			{ sort: {timestamp: 1} }
		);


		if( existing ){			
			var newPos = calculateOffsetPosition( position, cursor.size, Config.grid.overflowRingCount, existing.overflowIndex );			
			if( newPos ){
				if( newPos.replace ){
					Contributions.remove( newPos.replace._id );
				}
				position = newPos.position;
			}
		}
		
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
		if( !Localnets.findOne( { localnetsID: id } ) ){
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
			if( posts ){
				posts.content = JSON.parse( posts.content );
				if( posts.content.count > 0 ){
					console.log('-----> Localnets get success. ', posts.content.count, ' posts' );			
					posts.content.data.forEach(function( post ){
						addPostIfNotExists( post );
					});
				}
			}
		} catch( e ){
			console.log( '-----> Unable to reach localnets.' );
			console.log( '-----> ERROR: ', e );
		}		
		// debugAtCountAt( [150,150], 10 );
		// console.log( '------> Fake localnets grid check: at [150, 150]' );
		// calculateOffsetPosition( [150,150], [10,10], 3, 0 );
	};

	getAllPosts();

	this.getInterval = Meteor.setInterval( function(){
		getAllPosts();
	}, Config.localnets.updateInterval );
}

export { LocalnetsApi };
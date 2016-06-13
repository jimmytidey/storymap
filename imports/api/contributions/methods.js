import { Meteor } from 'meteor/meteor';
import { Contributions } from './contributions.js';

import { Config } from '../../config.js';
import { Helpers } from '../../modules/server/Helpers.js';

import { Twitter } from '../../modules/server/Twitter.js';

Meteor.methods({
	'contributions.atPosition'({ position, size }){
		var box = Helpers.calculateCellBox( position, size );
		var contrib = Contributions.find({ position: { $geoWithin: { $box: box } } });
		if( contrib.count() > 0 ){
			return contrib.fetch();
		} else {
			return false;
		}
	},
	'contributions.deleteAt'({ position, size }){
		console.log( 'DELETE AT: ', position, size );
		var box = Helpers.calculateCellBox( position, size );		
		var removed = Contributions.remove({ position: { $geoWithin: { $box: box } } });
		if( removed > 0 ){
			return 'Deleted content at ' + position[0] + ' x ' + position[1] + ' (' + size[0] + ' by ' + size[1] + ')';
		} else {
			return 'Nothing to delete at ' + position[0] + ' x ' + position[1] + ' (' + size[0] + ' by ' + size[1] + ')';
		}
	},
	'contributions.addFromTableAt'({ image, position, size }){	
		this.unblock();

		var box = Helpers.calculateCellBox( position, size );
		var existing = Contributions.find({ position: { $geoWithin: { $box: box } } });

		if( existing.count() === 0 ){
			// nothing there, so add it
			var time = (new Date()).getTime();
			var filename = Helpers.saveContributionImage( image.data, image.type, position, size, time );
			var previewFilename = Helpers.saveThumbnailImage( image.preview, image.type, position, size, time );
			var contributionID = Contributions.insert({
				tweetID: 'UNKNOWN', //initial placeholder for tweet ID
				position: position,
				media: filename,
				preview: previewFilename,
				viaTable: true
			});
			var id = Twitter.tweetImage( 
				Helpers.cleanBase64StringFromCanvas( image.data, image.type), 
				Config.twitter.tableTweetText + ' #' + Config.twitter.tableTweetHashtag 
			);			

			Contributions.update( contributionID, { $set: {tweetID: id } } );

			return 'Added new Contribution at ' + position[0] + ' x ' + position[1] + ' - twitter ID: ' + id;
		} else {
			throw new Meteor.Error("contribution-exists", "Already a contribution at " + position[0] + ' x ' + position[1]);
		}
	}
});
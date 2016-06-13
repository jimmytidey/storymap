import {Meteor} from 'meteor/meteor';
import Twit from 'twit';
import {Config} from '../../config.js';

var TwitterWrapper = function(){
	var self = this;

	this.T = new Twit( Config.twitter.credentials );

	var _postTweetWithImage = function( _imageData, _tweetText, _callback ){
		var imageData = _imageData;
		var tweetText = _tweetText;
		self.T.post( 'media/upload', { media_data: imageData }, function( err, data, response ){
			var status = {
				status: tweetText,
			};
			
			if( err ){
				console.log( 'Twitter Error: ', err );
			} else {
				var mediaID = data.media_id_string;
				console.log( 'media uploaded, id is: ', mediaID );
					status.media_ids = [ mediaID ];
			}
  			self.T.post( 'statuses/update', status, _callback );		
		});
	}

	var postTweetWithImage = Meteor.wrapAsync( _postTweetWithImage, self );

	var _getAllNonTableTweets = function( _since, _callback ){
		var config = {
			screen_name: Config.twitter.twitterUsername,
			count: 199
		}
		if( _since ){
			config.since_id = _since;
		}
		self.T.get('statuses/user_timeline', config, function( err, data ){
			var finalTweets = [];
			for( var i = 0; i < data.length; i++ ){
				var tweet = data[i];				
				if( tweet.entities.hashtags.length ){
					var hashtagExists = _.some(  tweet.entities.hashtags, function( el ) {
						return el.text.indexOf( Config.twitter.tableTweetHashtag ) !== -1;
					});
					if( !hashtagExists ){
						//console.log( 'non hashtag tweet: ', tweet );
						finalTweets.push( tweet );
					}
				} else {
					finalTweets.push( tweet );
				}
			}
			if( typeof _callback === 'function' ){
				_callback( err, finalTweets );
			}
		});
	}	

	var getAllNonTableTweets = Meteor.wrapAsync( _getAllNonTableTweets, self );

	var _getTweetById = function( id, _callback ){
		var config = {
			id: id
		};		
		self.T.get('statuses/show', config, function( err, data ){
			if( typeof _callback === 'function' ){
				_callback( err, data );
			}
		});
	}	

	var getTweetById = Meteor.wrapAsync( _getTweetById, self );

	this.tweetImage = function( _imageData, _tweetText, _callback ){
		var data = postTweetWithImage( _imageData, _tweetText );
		return data.id_str;
	};

	this.getNonTableTweets = function( since ){
		return getAllNonTableTweets( since );
	}
	this.getTweetById = function( id ){
		return getTweetById( id );
	}

}

var Twitter = new TwitterWrapper();

export { Twitter };
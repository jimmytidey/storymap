import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Collection2 } from 'meteor/aldeed:collection2';

import { Config } from '../../config.js';

export const Contributions = new Mongo.Collection('Contributions');

//set up MongoDB collection index for geospatial queries
if( Meteor.isServer ){
	Contributions._ensureIndex({'position': '2d'}, {min: Config.grid.min, max: Config.grid.max});
}

Contributions.deny({
	insert(){ return true; },
	update(){ return true; },
	remove(){ return true; }
});

Contributions.schema = new SimpleSchema({
	//required values
	position: {
		label: 'Position',
		type: [Number],
		minCount: 2,
		maxCount: 2,
		min: Config.grid.min,
		max: Config.grid.max,
		decimal: false
	},
	viaTable: {
		label: 'Via Table',
		type: Boolean,
		defaultValue: false
	},
	timestamp: {
		label: 'Timestamp',
		type: Number,
		autoValue: function(){
			return (new Date()).getTime();
		}
	},
	//optional values (dependent on source as table vs. localnets)	
	tweetID: {
		label: 'Tweet ID',
		type: String,
		optional: true
	},
	localnetsID: {
		label: 'Localnets ID',
		type: String,
		optional: true
	},
	dbLocalnetsID: {
		label: 'Database ID localnets',
		type: String,
		optional: true
	},
	// all table contributions will have media but, for localnets,
	// it will be variable, so media is now optional
	media: {
		label: 'Media',
		type: String,
		optional: true
	},
	preview: {
		label: 'Preview',
		type: String,
		optional: true
	},
	// if there's extra contributions from this location, we have to store 
	// a referece to them here, so we can overwrite them if we get too many
	overflowIndex: {
		label: 'Overflow Index',
		type: Number,
		defaultValue: 0
	}
});

Contributions.attachSchema( Contributions.schema );

Contributions.publicFields = {
	media: 1
};
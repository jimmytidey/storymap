import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Collection2 } from 'meteor/aldeed:collection2';

import { Config } from '../../config.js';

import { Contributions } from '../contributions/contributions.js';

export const Cursor = new Mongo.Collection('Cursor');

Cursor.allow({
	update: function(){
		return true;
	}
});

Cursor.deny({
	insert(){ return true; },
	update(){ return false; },
	remove(){ return true; }
});

Cursor.schema = new SimpleSchema({
	position: {
		label: 'Position',
		type: [Number],
		minCount: 2,
		maxCount: 2,
		min: Config.grid.min,
		max: Config.grid.max,
		decimal: false
	},
	size: {
		label: 'Size',
		type: [Number],
		minCount: 2,
		maxCount: 2,
		min: Config.cursor.min,
		max: Config.cursor.max,
		decimal: false
	},
	newContribution: {
		label: 'New Contribution',
		type: Boolean,
		optional: true,
		defaultValue: false
	} 
});

Cursor.attachSchema( Cursor.schema );

Cursor.publicFields = {
	position: 1,
	size: 1
};
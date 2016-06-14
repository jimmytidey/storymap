import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Collection2 } from 'meteor/aldeed:collection2';

import { Config } from '../../config.js';

export const Transforms = new Mongo.Collection('Transforms');

Transforms.allow({
	update: function(){
		return true;
	}
});

Transforms.deny({
	insert(){ return true; },
	update(){ return false; },
	remove(){ return true; }
});

Transforms.schema = new SimpleSchema({
	cssTransform: {
		label: 'Transform CSS',
		type: String,
		optional: true
	},
	rawLayout: {
		label: 'Raw Maptastic Layout',
		type: Object,
		blackbox: true,
		optional: true
	},
	showMap: {
		label: 'Show Map',
		type: Boolean,
		defaultValue: false
	}
});

Transforms.attachSchema( Transforms.schema );

Transforms.publicFields = {
	cssTransform: 1
};
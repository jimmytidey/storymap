import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Collection2 } from 'meteor/aldeed:collection2';

import { Config } from '../../config.js';

export const Localnets = new Mongo.Collection('Localnets');

Localnets.deny({
	insert(){ return true; },
	update(){ return true; },
	remove(){ return true; }
});

Localnets.schema = new SimpleSchema({
	localnetsID: {
		label: 'Localnets ID',
		type: String
	},
	post: {
		label: 'Localnets Post',
		type: Object,
		blackbox: true
	}
});

Localnets.attachSchema( Localnets.schema );

Localnets.publicFields = {
	tweet: 1
};
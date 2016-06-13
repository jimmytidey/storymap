import { Meteor } from 'meteor/meteor';

import { Localnets } from '../localnets.js';

Meteor.publish( 'all-localnets', function(){
	return Localnets.find({});
});
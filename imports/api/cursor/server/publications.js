import { Meteor } from 'meteor/meteor';

import { Cursor } from '../cursor.js';
import { Contributions } from '../cursor.js';

Meteor.publish( 'all-cursors', function(){
	return Cursor.find();
});
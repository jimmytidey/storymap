import { Meteor } from 'meteor/meteor';

import { Transforms } from '../transforms.js';
import { Helpers } from '../../../modules/server/Helpers.js';

Meteor.publish( 'all-transforms', function({position, size}){
	return Transforms.find({});
});
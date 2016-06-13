import { Meteor } from 'meteor/meteor';
import { Contributions } from '../contributions.js';

import { Helpers } from '../../../modules/server/Helpers.js';

Meteor.publish( 'localised-contributions', function({position, size}){
	var box = Helpers.calculateCellBox( position, size );
	console.log('find contrib within: ', box );
	var contributions = Contributions.find({ position: { $geoWithin: { $box: box } } });
	
	return contributions;
});

Meteor.publish( 'all-contributions', function(){
	return Contributions.find({});
});

Meteor.publish( 'latest-contributions', function(){
	return Contributions.findOne({});
});
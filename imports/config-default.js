export const Config = {
	grid: {
		min: 0,
		max: 1000,
		ratio: {
			x: 1,
			y: 0.860
		},		
	},
	world: {
		nw: [ 53.411729, -2.998487 ],
		se: [ 53.395501, -2.966567 ]
	},
	cursor: {
		feedbackTime: 500,
		min: 1,
		max: 500,
		moveRate: 20, //how many (max) times should the cursor be able to move per second
		historyLength: 300 // how many previous steps should we save & draw?
	},
	data:{
		path: process.env['PWD'] + '/media/',
		thumbnailPath: process.env['PWD'] + '/media/thumbnails/'
	},
	twitter: {
		tableTweetHashtag: 'facttest',
		twitterUsername: 'dvaccnt',
		tableTweetText: 'Something something something: ',
		credentials: {
			consumer_key:         '',
			consumer_secret:      '',
			access_token:         '',
			access_token_secret:  ''
		}
	},
	localnets: {
		url: '',
		updateInterval: 1800000, //every half an hour
		defaultImage: '/assets/images/localnets-no-image.png', //some localnets posts won't have images but will need something on the table
		defaultPreview: '/assets/images/localnets-no-image-thumbnail.png'
	}
};
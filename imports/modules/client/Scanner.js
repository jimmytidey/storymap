import '../lib/adapter.js';

var IMG_TYPE = {
	'png': 'image/png',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'webp': 'image/webp'
};

var Scanner = function( _imageSize, _imageType, _imageQuality, _thumbnailSize ){
	var self = this;
	this.imageSize = {
		width: _imageSize.width || 1280,
		height: _imageSize.height || 720
	}
	this.imageType = IMG_TYPE[ _imageType ] || IMG_TYPE['png'];
	this.imageQuality = _imageQuality || 1;
	
	_thumbnailSize = _thumbnailSize || {};

	this.thumbnailSize = {
		width: _thumbnailSize.width || 50,
		height: _thumbnailSize.height || 50
	}

	this.ele = document.createElement('div');
	this.$ele = $(this.ele)
		.addClass('scanner-container')
		.css('position','relative');
	
	this.video = document.createElement('video');
	this.video.autoplay = true;

	this.$cropBox = $( '<div></div>' )
		.addClass( 'scanner-cropbox' )
		.css({ 
			'box-sizing': 'border-box',
			'position': 'absolute',
			'top': 0,
			'left': 0
		});
	
	this.$ele.append( this.video );
	this.$ele.append( this.$cropBox );

	this.canvas = document.createElement('canvas');
	this.shrinkCanvas = document.createElement('canvas');	
	//this.cropCanvas = document.createElement('canvas');


	this.ready = false;

	this.latestSnapshot = false;

	var ctx = this.canvas.getContext( '2d' );
	var shrinkCtx = this.shrinkCanvas.getContext( '2d' );
	//var cropCtx = this.cropCanvas.getContext( '2d' );

	var init = function(){
		navigator.mediaDevices.getUserMedia({
			video: self.imageSize,
			audio: false
		})
		.then( function( stream ){					
			self.video.srcObject = stream;
			_onReady();
		})
		.catch(function(error) {
			console.log( error );
		});
	}

	var _onReady = function(){
		//wait a little while until the video has sized itself...
		setTimeout(function(){
			self.setCrop( 
				(self.video.videoWidth - self.video.videoHeight)/2, 
				0, 
				self.video.videoHeight + ((self.video.videoWidth - self.video.videoHeight)/2), 
				self.video.videoHeight 
			); //central square 
			self.drawCropBox();
			self.canvas.width = self.crop.width;
			self.canvas.height = self.crop.height;
				
			self.shrinkCanvas.width = self.thumbnailSize.width;
			self.shrinkCanvas.height = self.thumbnailSize.height;

			console.log( 'Video ready, (WxH): ' + self.video.videoWidth + ' x ' + self.video.videoHeight );
			console.log( self.crop );

			self.ready = true;
			
			if( typeof self.onReady === 'function' ){
				self.onReady();
			}
		}, 500 );			
	}

	this.onReady = function(){ /* ... override ... */ };

	this.snapshot = function(){
		self.setCrop( 
			(self.video.videoWidth - self.video.videoHeight)/2, 
			0, 
			self.video.videoHeight + ((self.video.videoWidth - self.video.videoHeight)/2), 
			self.video.videoHeight 
		); //central square 
		
		self.drawCropBox();
		self.canvas.width = this.crop.width;
		self.canvas.height = this.crop.height;

		ctx.save();
		ctx.translate( self.canvas.width/2, self.canvas.height/2 );
		ctx.rotate( Math.PI );

		ctx.drawImage(
			self.video, 
			this.crop.bounds.from.x, this.crop.bounds.from.y, this.crop.width, this.crop.height, //from
			this.crop.width * -0.5, this.crop.height * -0.5, this.crop.width, this.crop.height //to
		);

		ctx.restore();

		self.latestSnapshot = self.canvas.toDataURL( self.imageType, self.imageQuality );

		shrinkCtx.save();
		shrinkCtx.translate( this.shrinkCanvas.width/2, this.shrinkCanvas.height/2 );
		shrinkCtx.rotate( Math.PI );

		shrinkCtx.drawImage(
			self.video, 
			this.crop.bounds.from.x, this.crop.bounds.from.y, this.crop.width, this.crop.height, //from
			this.shrinkCanvas.width * -0.5, this.shrinkCanvas.height * -0.5, this.shrinkCanvas.width, this.shrinkCanvas.height //to
		);

		shrinkCtx.restore();

		self.latestThumbnail = self.shrinkCanvas.toDataURL( self.imageType, self.imageQuality );

		return self.latestSnapshot;
	};


	this.setCrop = function( fromX, fromY, toX, toY ){
		this.crop = this.crop || {};
		var cropW = Math.abs( toX - fromX );
		var cropH = Math.abs( toY - fromY );
		this.crop = {
			bounds: {
				from: { x: fromX, y: fromY },
				to: { x: toX, y: toY }
			},
			width: cropW,
			height: cropH
		};		
		console.log( this.crop );
		// this.cropCanvas.width = cropW;
		// this.cropCanvas.height = cropH;
	};

	this.drawCropBox = function(){
		var fromX = (this.crop.bounds.from.x / this.video.videoWidth) * 100;
		var fromY = (this.crop.bounds.from.y / this.video.videoHeight) * 100;
		var w = (this.crop.width / this.video.videoWidth) * 100;
		var h = (this.crop.height / this.video.videoHeight) * 100;
		this.$cropBox.css({
			'top': fromY + '%',
			'left': fromX + '%',
			'width': w + '%',
			'height': h + '%'
		});
	}

	init();
};

export { Scanner };
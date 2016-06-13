var Cell = function( _src ){
	var self = this;

	self.ready = false;

	var init = function(){
		self.img = document.createElement( 'img' );
		console.log( 'CELL, loading image: ', _src );
		self.img.onload = function(){
			console.log( 'CELL, loaded ', _src );
			_onReady();
		};
		self.img.src = _src;
	}

	this.onReady = function(){ /* ... override ... */ }

	var _onReady = function(){
		self.ready = true;
		if( typeof self.onReady === 'function' ){
			self.onReady();
		}
	}

	this.render = function( ctx, x, y, w, h ){
		if( self.ready ){
			ctx.drawImage( this.img, x, y, w, h );
		} else {
			ctx.save();
				ctx.fillStyle = 'rgba(255,255,255,0.5)';
				ctx.fillRect( x, y, w, h );
			ctx.restore();
		}
	}

	init();
};


export { Cell };
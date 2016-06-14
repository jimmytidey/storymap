import { Meteor } from 'meteor/meteor';
import { Config } from '../../config.js';
import { Cell } from './Cell.js';

var Grid = function( width, height, _cursor, _contributions ){
	var self = this;
	
	var tempCursorCount = 0;

	this.canvas = document.createElement('canvas');
	this.canvas.id = 'storymap-grid';
	this.ready = false;
	this.DEBUG = false;
	this.ele = this.canvas;

	// to animate the feedback when a contribution is added
	var contributionAddedCursorIncrease = 50;
	var contributionAddedLength = Config.cursor.feedbackTime;
	var contributionAddedTimer = 0;


	this.mapImage = $('.grid-map-image')[0];

	var ctx = this.canvas.getContext( '2d' );	

	var init = function(){
		self.canvas.width = width;
		self.canvas.height = height;		

		self.setCursor( _cursor );
		self.setContributions( _contributions );

		self.firstRender = true;		
	};

	var configFromCursor = function( cursor ){
		var pColCount = self.colCount;
		var pRowCount = self.rowCount;

		console.log( 'CURSOR SIZE: ', cursor.size );

		self.colCount = Config.grid.max / cursor.size[0];
		self.rowCount = (self.canvas.height / self.canvas.width) * self.colCount;
		self.gridMaxX = (self.colCount) * cursor.size[0];
		self.gridMaxY = Math.ceil( (self.rowCount) * cursor.size[0] );
		
		self.cell = {
			width: self.canvas.width / (self.colCount),
			height: self.canvas.height / (self.rowCount)
		};		

		if( pColCount !== self.colCount || pRowCount !== self.rowCount ){
			self.cursorHistory = [];
			resetRender();
		}
	};

	var calculateCursorCoords = function( cursor ){
		return calculateGridCoords( cursor.position[0], cursor.position[1], cursor.size[0], cursor.size[1] );
	};

	var clampToGrid = function( x, y ){
		var xOutBy = x % self.cell.width;
		var yOutBy = y % self.cell.height;
		if( xOutBy !== 0 ){
			if( xOutBy > self.cell.width * 0.5 ){
				x += (self.cell.width - xOutBy);
			} else {
				x -= xOutBy;
			}
		}
		if( yOutBy !== 0 ){
			if( yOutBy > self.cell.height * 0.5 ){
				y += (self.cell.height - yOutBy);
			} else {
				y -= yOutBy;
			}
		}
		return {
			x: x,
			y: y
		};
	}
	var clampToCoords = function( x, y ){
		var xOutBy = x % self.cursor.size[0];
		var yOutBy = y % self.cursor.size[1];
		if( xOutBy !== 0 ){
			x -= xOutBy;
		}
		if( yOutBy !== 0 ){
			y -= yOutBy;
		}
		return {
			x: x,
			y: y
		};
	}
	var calculateGridCoords = function( x, y, w, h ){
		var x = Math.floor(x / w) * self.cell.width;
		var y = Math.floor(y / h) * self.cell.height;
		var clamped = clampToGrid( x, y );
		x = clamped.x;
		y = clamped.y;
		return {
			x: x, 
			y: y,
			center: {
				x: x + (self.cell.width * 0.5),
				y: y + (self.cell.height * 0.5)
			}
		};
	};

	this.pixelsToUnderlyingDataCoord = function( _x, _y ){
		var c = this.pixelsToCursor( _x, _y );
		var clamped = clampToCoords( c.x, c.y );
		return {
			x: clamped.x,
			y: clamped.y,
			center: {
				x: clamped.x + ( self.cell.width * 0.5 ),
				y: clamped.y + ( self.cell.height * 0.5 )
			}
		};
	};

	this.pixelsToGrid = function( _x, _y ){
		var c = this.pixelsToCursor( _x, _y );
		return calculateGridCoords( c.x, c.y, this.cursor.size[0], this.cursor.size[1] );
	};

	this.pixelsToCursor = function( _x, _y ){
		var x = ( _x / $(this.canvas).width() ) * this.gridMaxX;
		var y = ( _y / $(this.canvas).height() ) * this.gridMaxY;
		x = Math.floor( x );
		y = Math.floor( y );

		return {
			x: x,
			y: y
		}
	};

	var resetRender = function(){
		self.firstRenderComplete = false;
	};

	var firstRender = function( _callback ){
		if( !self.firstRenderComplete && typeof _callback === 'function' ){
			_callback();
			self.firstRenderComplete = true;
		}
	};

	this.drawGrid = function(){
		for( var i = 0; i <= this.colCount + 1; i++ ){
			ctx.beginPath();
				ctx.moveTo( i * this.cell.width, 0 );
				ctx.lineTo( i * this.cell.width, this.canvas.height );
			ctx.stroke();
		}
		for( var i = 0; i <= this.rowCount + 1; i++ ){
			ctx.beginPath();
				ctx.moveTo( 0, i * this.cell.height );
				ctx.lineTo( this.canvas.width, i * this.cell.height );
			ctx.stroke();
		}
	};

	var drawContribution = function( contribution ){
		var pos = calculateGridCoords( contribution.raw.position[0], contribution.raw.position[1], self.cursor.size[0], self.cursor.size[1] );
		contribution.cell.render( ctx, pos.x, pos.y, self.cell.width, self.cell.height );
	}

	this.drawContributions = function(){
		for( var key in this.contributions ){
			drawContribution( this.contributions[ key ] );
		}
	}

	this.drawCursorHistory = function(){
		for( var i = 0; i < this.cursorHistory.length - 1; i++ ){
			var opacity = (i/(this.cursorHistory.length -1)) * 0.8;
			//ctx.fillStyle = 'rgba( 255, 255, 255, ' + opacity + ' )';			
			var pPos = calculateCursorCoords( this.cursorHistory[i] );
			var nPos = calculateCursorCoords( this.cursorHistory[i + 1] );
			//ctx.fillRect( pPos.x, pPos.y, this.cell.width, this.cell.height );			
			ctx.beginPath();
			ctx.lineWidth = 5;
			ctx.strokeStyle = 'rgba( 255,0,0, ' + opacity + ' )';			
			ctx.moveTo( pPos.center.x, pPos.center.y );
			ctx.lineTo( nPos.center.x, nPos.center.y );
			ctx.stroke();				
		}
	};

	var renderLoop = function(){
		contributionAddedTimer -= 1000/60;
		self.render();

		if( contributionAddedTimer <= 0 ){
			contributionAddedTimer = 0;
			Meteor.clearTimeout( self.renderTimer );
		} else {			
			self.renderTimer = Meteor.setTimeout( function(){
				renderLoop();
			}, 1000/60 );
		}
	}

	this.addedContribution = function(){
		contributionAddedTimer = contributionAddedLength;
		renderLoop();
	}
	this.cancelAddedContribution = function(){
		Meteor.clearTimeout( self.renderTimer );
		contributionAddedTimer = 0;
	}

	this.drawCursor = function(){
		var pos = calculateCursorCoords( this.cursor );
		var fraction = contributionAddedTimer / contributionAddedLength;
		var increase = contributionAddedCursorIncrease * fraction;
		var offset = increase / 2;
		ctx.fillRect( pos.x - offset, pos.y - offset, this.cell.width + increase, this.cell.height + increase );
	}

	this.render = function(){
		ctx.fillStyle = 'rgba(100,100,100,1)';
		ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );		
		if( this.DEBUG ){
			ctx.drawImage( this.mapImage, 0, 0, this.canvas.width, (this.canvas.width / this.mapImage.width) * this.mapImage.height );
		}

		ctx.save();
			ctx.strokeStyle = 'rgba(125,125,125,1)';
			ctx.lineWidth = 2;
			this.drawGrid();
		ctx.restore();

		ctx.save();
			ctx.fillStyle = 'rgba( 0, 0, 0, 0.5 )';
			this.drawContributions();
		ctx.restore();

		ctx.save();			
			this.drawCursorHistory();
		ctx.restore();
		ctx.save();
			ctx.fillStyle = '#ff0000';
			this.drawCursor();
		ctx.restore();
	};

	this.tempCursor = function( xChange, yChange ){
		var c = {
			position: [ 
				this.cursor.position[0] + xChange, 
				this.cursor.position[1] + yChange 
			],
			size: [ this.cursor.size[0], this.cursor.size[1] ],
		};
		tempCursorCount++;
		this.setCursor( c );
	}

	this.setCursor = function( _cursor, clearHistory ){
		if( !_cursor ){ //default initial cursor
			_cursor = {
				position: this.cursor.position || [ 0, 0 ],
				size: this.cursor.size || [10, 10]
			}
		} else {
			if( !_cursor.size ){
				_cursor.size = this.cursor.size;
			}
		}

		this.cursorHistory = this.cursorHistory || [];
		if( !clearHistory ){			
			if( this.cursorHistory.length >= Config.cursor.historyLength ){
				this.cursorHistory.shift();			
			}
			if( tempCursorCount > 0 ){
				this.cursorHistory.shift();
				tempCursorCount++;
			}
			this.cursorHistory.push( _cursor );
		} else {
			this.cursorHistory = [ _cursor ];
		}
		this.cursor = _cursor;
		configFromCursor( this.cursor );
	};

	this.setContributions = function( _contributions ){
		this.contributions = this.contributions || {};		
		if( _contributions && _contributions.length ){
			var currentIDs = [];
			for( var i = 0; i < _contributions.length; i++ ){
				var c = _contributions[i]
				currentIDs.push( c._id );
				if( !this.contributions[ c._id ] ){
					var pos = calculateGridCoords( c.position[0], c.position[1], this.cursor.size[0], this.cursor.size[1] );
					var previewUrl = '/media/thumbnail/' + c.preview;					
					if( c.preview && typeof c.preview === 'string'){
						if( 
							c.preview.indexOf( 'http://') !== -1 || c.preview.indexOf( 'https://') !== -1 	// is remote - use whole URL
							|| c.preview.indexOf( '/assets/images/') !== -1 								// is a static local asset - use whole path
						){							
							previewUrl = c.preview;
						}
					}
					var cell = new Cell( previewUrl );
					this.contributions[ c._id ] = {
						raw: c,
						cell: cell
					};
				}
			}
			this.contributions = _.pick( this.contributions, currentIDs );
			console.log( this.contributions );
		}		
	};

	this.setTransform = function( to ){
		// noop

		// console.log( 'TO: ', to );
		// $(this.canvas).css( 'transform', to );
		// console.log( 'IS: ', $(this.canvas).css('transform') );
	}

	this.setDebugTo = function( to ){
		this.DEBUG = !!to;
	}

	this.toggleDebug = function(){
		this.DEBUG = !this.DEBUG;
	};

	init();
};

export { Grid };
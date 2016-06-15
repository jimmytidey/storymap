import fs from 'fs';

import { Config } from '../../config.js';

var Helpers = {
  makeFolderIfNotExists: function( path ){
    try{
      var stats = fs.statSync( path );
    } catch( e ){
      fs.mkdirSync( path );
    }
  },
  calculateCellBox: function( position, size ){
    var cellBoundarySize = 0.000001; //0.00001 //so that a point on the boundary becomes definitive
    return [
      [ position[0], position[1] + size[1] - cellBoundarySize ], //bottom left 
      [ position[0] + size[0] - cellBoundarySize, position[1] ] //top right
    ];
  },
  cleanBase64StringFromCanvas: function( data, mime ){
    var data = data.replace( 'data:' + mime + ';base64,', '' );
    return data;
  },
  saveThumbnailImage: function( data, mime, position, size, _time ){
    return Helpers.saveImage( Config.data.thumbnailPath, data, mime, position, size, _time );
  },
  saveContributionImage: function( data, mime, position, size, _time ){
    return Helpers.saveImage( Config.data.path, data, mime, position, size, _time );
  },
  saveImage: function( path, data, mime, position, size, _time ){
    var data = Helpers.cleanBase64StringFromCanvas( data, mime );
    var time = _time || (new Date()).getTime();
    var extension = mime.replace('image/','');
    var filename = 'contribution-' + position[0] + 'x' + position[1] + '-' + size[0] + 'by' + size[1] + '-at' + time + '.' + extension;
    var filepath = path + filename;
    var imageBuffer = new Buffer( data, "base64" );
    var file = fs.writeFileSync( filepath, imageBuffer );
    return filename;
  },
  mapValueToRange: function( val, inMin, inMax, outMin, outMax ){
    //thanks Processing (as ever): https://github.com/processing/processing/blob/master/core/src/processing/core/PApplet.java#L4811
    return outMin + (outMax - outMin) * ( (val - inMin) / (inMax - inMin) );
  },
  mapPointToRange: function( point, inNW, inSE, outNW, outSE ){
    point[0] = Helpers.mapValueToRange( point[0], inNW[0], inSE[0], outNW[0], outSE[0] );
    point[1] = Helpers.mapValueToRange( point[1], inNW[1], inSE[1], outNW[1], outSE[1] );
    return point;
  },
  floorPoint: function( point ){
    return [ Math.floor( point[0] ), Math.floor( point[1] ) ];
  },
  // takes in a lat / lon pair and converts it to grid coordinates
  worldToGrid: function( world ){
    // because we're dealing in lat and lon it comes in y,x
    // so we remain that way to calculate it here but then flip it to 
    // x , y as that's how the grid is sorted

    var gridNW = [ Config.grid.min * Config.grid.ratio.y, Config.grid.min ];
    var gridSE = [ Config.grid.max * Config.grid.ratio.y, Config.grid.max * Config.grid.ratio.x ];
    
    var grid = Helpers.mapPointToRange( world, Config.world.nw, Config.world.se, gridNW, gridSE );

    return Helpers.floorPoint( [ grid[1], grid[0] ] );
  },
  // takes a grid coordinate and converts it to a lat / lon
  gridToWorld: function( grid ){
    var gridNW = [ Config.grid.min * Config.grid.ratio.y, Config.grid.min ];
    var gridSE = [ Config.grid.max * Config.grid.ratio.y, Config.grid.max * Config.grid.ratio.x ];
    
    var world = Helpers.mapPointToRange( grid, gridNW, gridSE, Config.world.nw, Config.world.se );

    // the grid coord will come int x, y, but lat lon is
    // y , x so we flip it before outputting
    return [ world[1], world[0] ];
  },
  clampToGrid: function( point ){
    if( point[0] > Config.grid.max ){
      point[0] = Config.grid.max;
    }
    if( point[0] < Config.grid.min ){
      point[0] = Config.grid.min;
    }
    if( point[1] > Math.floor( Config.grid.max * Config.grid.ratio.y ) ){
      point[1] = Math.floor( Config.grid.max * Config.grid.ratio.y );
    }
    if( point[1] < Math.floor( Config.grid.min * Config.grid.ratio.y )  ){
      point[1] = Math.floor( Config.grid.min * Config.grid.ratio.y );
    }
    return point;
  },
  fitToCells: function( point, cellSize ){
    point[0] = Math.round( point[0] / cellSize[0] ) * cellSize[0];
    point[1] = Math.round( point[1] / cellSize[1] ) * cellSize[1];
    return point;
  }
};

export {Helpers};
// configuration
import { Meteor } from 'meteor/meteor';
import { Config } from '../../config.js';

// database collections
import { Cursor } from '../../api/cursor/cursor.js';
import { Contributions } from '../../api/contributions/contributions.js';
import { Transforms } from '../../api/transforms/transforms.js';

// modules
import { Grid } from '../../modules/client/Grid.js';
import { Scanner } from '../../modules/client/Scanner.js';

// libraries
import { Maptastic } from '../../modules/lib/maptastic.js';

// associated template
import './input.html';

// local helpers
var createContentAtCursor = function(){
  var self = this;  
  var cursor = Cursor.findOne();
  var imageData = self.camera.snapshot();
  var previewData = self.camera.latestThumbnail;

  self.grid.addedContribution();
  
  Meteor.clearTimeout( self.newContributionTimeout );
  Cursor.update( {_id: cursor._id}, {$set: {newContribution: true}} )

  Meteor.clearTimeout( self.updateTimeout );
  self.updateTimeout = Meteor.setTimeout(function(){
     Cursor.update( {_id: cursor._id}, {$set: {newContribution: false}} );
  }, 100 );

  Meteor.call(
    'contributions.addFromTableAt', 
    { 
      image: { 
        data: imageData,       
        type: self.camera.imageType,
        preview: previewData
      }, 
      position: cursor.position, 
      size: cursor.size,
      via_table: true
    }, 
    function( err, res ){ 
      if( err ){
        console.log( err );
        // cancel visual feedback if cell is already full        
        self.grid.cancelAddedContribution();
      }       
      Cursor.update( {_id: cursor._id}, {$set: {newContribution: false}} );
      console.log( err, res ) 
    }
  );
}

var updateCursor = function( xSteps, ySteps, cursor ){
  var position = cursor.position;
  position[0] = position[0] + ( xSteps * cursor.size[0] );
  position[1] = position[1] + ( ySteps * cursor.size[1] );
  //keep cursor within bounds of the grid
  if( position[0] < Config.grid.min ){
    position[0] = Config.grid.min;
  }
  if( position[0] > Config.grid.max - cursor.size[0] ){
    position[0] = Config.grid.max - cursor.size[0];
  }
  if( position[1] < Config.grid.min ){
    position[1] = Config.grid.min;
  }
  if( position[1] > Config.grid.max - cursor.size[1] ){
    position[1] = Config.grid.max - cursor.size[1];
  }
  //fix it to grid steps (grid is based on its size)
  if( position[0] % cursor.size[0] !== 0 ){
    position[0] -= position[0] % cursor.size[0];
  }
  if( position[1] % cursor.size[1] !== 0 ){
    position[1] -= position[1] % cursor.size[0];
  }
  Cursor.update( {_id: cursor._id}, {$set: {position: position}} );
  return position;
}

var setupMoveCursor = function( _self ){
  var self = _self;
  var rate = 1000 / Config.cursor.moveRate; // max per second
  var DIR = false;
  
  var cursorMove = _.throttle(function(){
    var cursor = Cursor.findOne({}) ;   
    var changeX = false;
    var changeY = false;
    if( DIR === 'UP' ){
      changeX = 0;
      changeY = -1;
    }
    if( DIR === 'RIGHT' ){
      changeX = 1;
      changeY = 0;
    }
    if( DIR === 'DOWN' ){
      changeX = 0;
      changeY = 1;
    }
    if( DIR === 'LEFT' ){
      changeX = -1;
      changeY = 0;
    }
    if( changeX || changeY ){      
      updateCursor( changeX, changeY, cursor );
    }
  }, rate );

  $(window).on('keydown', function( e ){
    //console.log( e.which );
    DIR = false;    
    
    if( e.which === 38 ){ DIR = 'UP'; }
    if( e.which === 39 ){ DIR = 'RIGHT'; }
    if( e.which === 40 ){ DIR = 'DOWN'; }
    if( e.which === 37 ){ DIR = 'LEFT'; }  

    if( DIR ){
      e.preventDefault();
      cursorMove();
    } 
    
    if( e.which === 68 ){ // 'D'
      self.grid.toggleDebug();
      self.grid.render();
      e.preventDefault();
    }

    if( e.which === 32 || e.which === 80 ){ // *SPACE* or 'P'
      e.preventDefault();
      createContentAtCursor.call( self );
    }
  });
}

//rendering / template
Template.Grid_page.onCreated(function(){
  this.camera = new Scanner( {width: 1920, height: 1080}, 'jpg', 0.98 );
});

Template.Grid_page.onRendered(function(){
  var self = this;

  this.subscribe( 'all-cursors',{},{
    onReady: function(){
      var cursor = Cursor.findOne({});
      Cursor.update( {_id: cursor._id}, {$set: {newContribution: false}} );
      var gridW = 1080 * 2;
      var gridH = ( gridW / Config.grid.ratio.x ) * Config.grid.ratio.y;
      self.grid = new Grid( gridW, gridH, cursor );
      self.$('.grid').append( self.grid.canvas );

      self.autorun(function(){
        var cursor = Cursor.findOne({});
        // whenever the cursor is changed in the DB (i.e. moved)
        // update the grid - also re-renders the whole canvas
        self.grid.setCursor( cursor );
        self.grid.render();
      });
    }
  });
  
  this.subscribe( 'all-contributions', {}, {
    onReady: function(){
      self.autorun(function(){
        var contributions = Contributions.find({}).fetch();

        self.grid.setContributions( contributions );
        self.grid.render();
        
        setTimeout( function(){
          // re-render once we reckon the images will be loaded
          // not super important to get it right as the cursor 
          // will cause a re-render whenever it moves
          self.grid.render();
        }, 5000 );
      
      });
    }
  });

  this.subscribe( 'all-transforms', {}, {
    onReady: function(){
      self.autorun(function(){
        // there should only be one transform
        var transform = Transforms.findOne({});
        
        // maptastic is used to projection map the grid to the table
        // we use it here too so that the mapping and view environments
        // are as similar as possible
        var mt = Maptastic({
          autoSave: false,
          autoLoad: false,
          onchange: function(){
            return false;
          },
          layers: [ self.grid.canvas ]
        }); 

        // apply the saved / database transform to the grid
        // this works because the elements have the same ID
        mt.setLayout( [transform.rawLayout] );
        //console.log( 'MAP? ', transform.showMap );
        self.grid.setDebugTo( transform.showMap );
        self.grid.render();

      });
    }
  });

  setupMoveCursor( self );
});

// render helpers
Template.Grid_page.helpers({
  cursorPosition: function(){
    var cursor = Cursor.findOne({});
    if( cursor ){
      return {
        x: cursor.position[0],
        y: cursor.position[1]
      }
    }
  }
});
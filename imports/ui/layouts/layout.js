import './layout.html';

import { Meteor } from 'meteor/meteor';

import { Config } from '../../config.js';

import { Cursor } from '../../api/cursor/cursor.js';
import { Transforms } from '../../api/transforms/transforms.js';

import { Grid } from '../../modules/client/Grid.js';

import { Maptastic } from '../../modules/lib/maptastic.js';

var updateTransform = function( to, layout ){
  var transform = Transforms.findOne({});
  console.log( 'saving transform with id: ', transform._id, ' and value: ', to );
  console.log( layout );
  Transforms.update( {_id: transform._id}, {$set: { cssTransform: to, rawLayout: layout  }} );
}



Template.Layout_page.onRendered(function(){
  var self = this;
  self.warp = false;

  var ready = function(){
    var cursor = Cursor.findOne({});
    self.transform = Transforms.findOne({});
    var gridW = 1080;
    var gridH = ( gridW / Config.grid.ratio.x ) * Config.grid.ratio.y;
    self.grid = new Grid( gridW, gridH, cursor );

    self.$('.grid').append( self.grid.canvas );
    // if( transform && transform.cssTransform ){
    //   self.grid.setTransform( transform.cssTransform );
    // }
    self.grid.render();

    $(window).on('keydown', function( e ){
      if( e.keyCode === 68 ){
        self.grid.toggleDebug();
        self.grid.render();
        Transforms.update( self.transform._id, { $set: { showMap: self.grid.DEBUG }} );
      }
    });

   self.mt = Maptastic({
      autoSave: false,
      autoLoad: false,
      onchange: function(){
        var newTransform = $( self.grid.canvas ).css('transform');
        console.log( 'Layout Change: ' );
        console.log( newTransform );
        console.log( self.mt.getLayout()[0] );
        updateTransform( newTransform, self.mt.getLayout()[0] );
      },
      layers: [ self.grid.canvas ]
    });  

    if( self.transform && self.transform.rawLayout ){
      self.mt.setLayout( [ self.transform.rawLayout ] );
    }

  }


  this.subscribe( 'all-cursors',{},{
    onReady: function(){
      self.subscribe( 'all-transforms',{},{
        onReady: function(){
          ready();
        }
      });
    }
  }); 
});

Template.Layout_page.helpers({
 
});

Template.Layout_page.events({
  'click .toggleMap'( e ){
    var self = Template.instance();
    self.grid.toggleDebug();
    self.grid.render();
    Transforms.update( self.transform._id, { $set: { showMap: self.grid.DEBUG }} );
  },
  'click .toggleWarp'( e ){
    var self = Template.instance();
    self.warp = !self.warp;
    self.mt.setConfigEnabled( self.warp );
  }
});
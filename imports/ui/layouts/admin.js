import './admin.html';

import { Meteor } from 'meteor/meteor';

import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Contributions } from '../../api/contributions/contributions.js';
import { Cursor } from '../../api/cursor/cursor.js';
import { Localnets } from '../../api/localnets/localnets.js';

import { Config } from '../../config.js';

import { Grid } from '../../modules/client/Grid.js';


Template.Admin_page.onCreated( function(){
  this.selectionPosition = new ReactiveDict( 'selectionPosition' );
  this.selectionPosition.set('x', 0 );
  this.selectionPosition.set('y', 0 ); 

  this.selectedPositionSrc = new ReactiveVar( '#' );
  this.selectedPositionHasContribution = new ReactiveVar( false );
});

Template.Admin_page.onRendered(function(){
  var self = this;
  
  this.subscribe( 'all-cursors',{},{
    onReady: function(){
      var cursor = Cursor.findOne({});
      var gridW = 1080;
      var gridH = ( gridW / Config.grid.ratio.x ) * Config.grid.ratio.y;
      self.grid = new Grid( gridW, gridH, cursor );
      self.grid.toggleDebug();
      self.$('.grid').append( self.grid.canvas );

      self.autorun(function(){
        var cursor = Cursor.findOne({});
        // self.grid.setCursor( cursor );
        // self.grid.render();
      });
    }
  });

  this.subscribe( 'all-contributions', {}, {
    onReady: function(){
      self.autorun(function(){
        var contributions = Contributions.find({}).fetch();
        self.grid.setContributions( contributions );
        self.grid.render();
      });
    }
  });

});

Template.Admin_page.helpers({
  selectionPosition: function(){
    var self = Template.instance();
    var p = {
      x: self.selectionPosition.get('x'),
      y: self.selectionPosition.get('y'),
    }
    return p;
  },
  tweetFirstMedia: function(){
    return this.images[0];
  },
  isPositionFull: function(){
    var self = Template.instance();
    return self.selectedPositionHasContribution.get();
  },
  isPositionEmpty: function(){
    var self = Template.instance();
    return !self.selectedPositionHasContribution.get()
  },
  currentSrc: function(){
    var self = Template.instance();
    return self.selectedPositionSrc.get();
  }
});

var pointOnCanvas = function( pageX, pageY, canvas ){
    var cursor = Cursor.findOne({});
    var canvasX = pageX - canvas.offset().left;
    var canvasY = pageY - canvas.offset().top;

    var x = ( (canvasX / canvas.width()) * ( Config.grid.max - Config.grid.min ) );
    var y = ( (canvasY / canvas.height()) * ( Config.grid.max - Config.grid.min ) );

    var xOutBy = x % cursor.size[0];
    var yOutBy = y % cursor.size[1];
    
    if( xOutBy !== 0 ){
      if( xOutBy > cursor.size[0] * 0.5 ){
        x += (cursor.size[0] - xOutBy);
      } else {
        x -= xOutBy;
      }
    }

    if( yOutBy !== 0 ){
      if( yOutBy > cursor.size[1] * 0.5 ){
        y += (cursor.size[1] - yOutBy);
      } else {
        y -= yOutBy;
      }
    } 

    return {
      cursor: cursor,
      canvas: {
        x: canvasX,
        y: canvasY
      }, 
      x: x, 
      y: y 
    };
};

var setPositionMedia = function( self, media ){
  if( 
    typeof media === 'string' 
    && media.indexOf( 'http://') === -1 
    && media.indexOf( 'https://') === -1 
  ){
    self.selectedPositionSrc.set( '/media/' + media );
  } else {
    self.selectedPositionSrc.set( media + ':large' );
  }
};

var extractMediaFromTweet = function( tweet ){
  if( tweet.entities.media.length > 0 ){
    for( var i = 0; i < tweet.entities.media.length; i++ ){
      if( tweet.entities.media[i].type === 'photo' ){ //find the first photo/image in the tweet
        var media = tweet.entities.media[0];
        return media.media_url;
      }
    }
  }
  return false;
};

Template.Admin_page.events({
  'mousemove .grid canvas': function( e, self ){
    var canvas = $(self.grid.canvas);
    var canvasX = e.pageX - canvas.offset().left;
    var canvasY = e.pageY - canvas.offset().top;
    var point = self.grid.pixelsToGrid( canvasX, canvasY );

    self.grid.render();

    var ctx = self.grid.canvas.getContext( '2d' );
    ctx.save();
      ctx.fillStyle = '#00FF00';
      ctx.fillRect( point.center.x - 5, point.center.y - 5, 10, 10 );
    ctx.restore();
  },
  'click .grid canvas': function( e, self ){
    var cursor = Cursor.findOne({});
    // set fake cursor for purposes of the grid
    var canvas = $(self.grid.canvas);
    var canvasX = e.pageX - canvas.offset().left;
    var canvasY = e.pageY - canvas.offset().top;
    var point = self.grid.pixelsToCursor( canvasX, canvasY );

    self.grid.setCursor({
      position: [ point.x, point.y ]
    }, true );

    var gPoint = self.grid.pixelsToUnderlyingDataCoord( canvasX, canvasY );
    
    self.selectionPosition.set('x', gPoint.x );
    self.selectionPosition.set('y', gPoint.y );
    
    //check if the location is full or empty
    Meteor.call('contributions.atPosition', { position: [ gPoint.x, gPoint.y ], size: cursor.size },function( err, res ){    
      var full = !!res;
      console.log( "IS FULL?", full );
      if( full ){
        if( res[0].viaTable && res[0].tweetID !== 'UNKNOWN' ){
          // we have to grab the media from twitter, otherwise it's stored only on the table and we're in
          // the admin area which has no filesystem access
          // console.log( 'REAL ID: ', res[0].tweetID, ' TESTINGID: 722394021075763201' );
          Meteor.call('tweets.getById', {id: res[0].tweetID}, function( err,res ){
            if( !err ){ 
              var media = extractMediaFromTweet( res );
              setPositionMedia( self, media );
            }
          });
          
        }
        setPositionMedia( self, res[0].media );
      } else {
        self.selectedPositionSrc.set( '#' );
      }
      self.selectedPositionHasContribution.set( full );
    });
    
    self.grid.render();
    
  },
  'click a.delete-content': function( e, self ){
    var $target = $( e.target );
    var cursor = Cursor.findOne({});
    var x = self.selectionPosition.get('x' );
    var y = self.selectionPosition.get('y');

    Meteor.call('contributions.deleteAt', { position: [ x, y ], size: cursor.size },function( err, res ){    
     console.log( err, res, 'Deleted' );
     $target.fadeOut(250, function(){
      $target.parent().append('<span class="message message__deleted">DELETED</span>').hide().fadeIn( 250 );
      $target.remove();
     })
    });
  },
  'click .tweet.tweet__preview': function( e, self ){
    $tweet = $(e.currentTarget);
    var tweetID = $tweet.data( 'tweet-id' );
    var imageSrc = $tweet.data( 'url-media' );
    var thumbSrc = imageSrc + ':thumb';
    var cursor = Cursor.findOne({});
    //console.log( tweetID, imageSrc, thumbSrc );
    //console.log( 'GRID CURSOR POS', self.grid.cursor.position, " / OR? ", self.selectionPosition.get('x'), self.selectionPosition.get('y') );
    Meteor.call( 
      'contributions.addExistingTweetAt', 
      {
        tweetID: tweetID, 
        imgSrc: imageSrc, 
        thumbSrc: thumbSrc, 
        position: [self.selectionPosition.get('x'), self.selectionPosition.get('y')],
        size: cursor.size
      }, 
      function( err, res ){
        console.log( 'contributions.addExistingTweetAt: ', err,res );
      }
    )
  },
  'click #update-tweets': function( e, self ){
    console.log('update tweets');
    Meteor.call('tweets.updateData',{}, function( err,res ){
      console.log( err, res );
    })
  }

});
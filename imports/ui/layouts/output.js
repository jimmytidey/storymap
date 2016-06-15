// configuration
import { Meteor } from 'meteor/meteor';
import { Config } from '../../config.js';

import { ReactiveVar } from 'meteor/reactive-var';

// database collections
import { Cursor } from '../../api/cursor/cursor.js';
import { Contributions } from '../../api/contributions/contributions.js';
import { Localnets } from '../../api/localnets/localnets.js';

// associated template
import './output.html';

var tweetID = new ReactiveVar('');

Template.Output_page.onCreated(function(){
  var self = this;
  this.subscribe( 'all-cursors' );
  this.subscribe( 'all-localnets' );

  self.twitterReady = false;

  $.getScript('https://platform.twitter.com/widgets.js', function(){
    self.twitterReady = true;
    self.twttr = twttr;
  });
  
  this.autorun(function(){
    var cursor = Cursor.findOne();
    if( cursor ){
      self.subscribe( 'localised-contributions', { position: cursor.position, size: cursor.size });
      var contribution = Contributions.findOne({});
      var $tweetBox = $('#tweet');
      
      if( self.rendered && contribution && contribution.tweetID ){  
        $tweetBox.empty().addClass('hidden');
        self.twttr.widgets.createTweet(
          contribution.tweetID,
          $tweetBox[0],
          {
            linkColor: '#FF0000',
            align: 'center',
            dnt: true, 
            cards: 'hidden',
            conversation: 'none'
          }    
        ).then( function( el ){  
          // we might have moved on by the time twitter gets its act together
          // so here we check if we still have the same contribution
          var currentContribution = Contributions.findOne({}); 
          if( currentContribution ){
            console.log( currentContribution.tweetID, contribution.tweetID );
          }
          if( currentContribution && currentContribution.tweetID === contribution.tweetID ){            
            var $others = $tweetBox.find( 'twitterwidget' ).not('[data-tweet-id="' + contribution.tweetID + '"]' );
            $others.remove(); 
            $tweetBox.removeClass('hidden');
          }
        })
      } else {
        $tweetBox.addClass('hidden');
      }
    }
  });

});

Template.Output_page.onRendered(function(){
  this.rendered = true;
  // keep it square (for the console)
  var $sqWrapper = this.$('.square-wrapper');
  $sqWrapper.width( $sqWrapper.height() );
});


Template.Output_page.helpers({
  currentSrc: function(){
    var contribution = Contributions.findOne({});
    if( contribution ){
      var mediaUrl = '/media/' + contribution.media;
      if( contribution.media && (contribution.media.indexOf( 'http://') !== -1 || contribution.media.indexOf( 'https://') !== -1 ) ){
        mediaUrl = contribution.media;
      }
      return mediaUrl;
    }
    return false;
  },
  emptyCell: function(){
    var contribution = Contributions.findOne({});
    return !contribution;
  },
  newContribution: function(){
    var cursor = Cursor.findOne({});
    if( cursor && cursor.newContribution ){    
      console.log( cursor.newContribution );
      return true;
    }
    return false;
  }
});
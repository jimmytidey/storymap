// configuration
import { Meteor } from 'meteor/meteor';
import { Config } from '../../config.js';

// database collections
import { Cursor } from '../../api/cursor/cursor.js';
import { Contributions } from '../../api/contributions/contributions.js';
import { Localnets } from '../../api/localnets/localnets.js';

// associated template
import './output.html';

Template.Output_page.onCreated(function(){
  var self = this;
  this.subscribe( 'all-cursors' );
  this.subscribe( 'all-localnets' );
  
  this.autorun(function(){
    var cursor = Cursor.findOne();
    if( cursor ){
      self.subscribe( 'localised-contributions', { position: cursor.position, size: cursor.size });
    }
  });

  this.autorun(function(){
    self.subscribe( 'latest-contribution' );
  });

});

Template.Output_page.onRendered(function(){
  var $sqWrapper = this.$('.square-wrapper');
  $sqWrapper.width( $sqWrapper.height() );
  // TODO : transition / animation on render
  // TODO : if is new addition, notifiation / visual feedback of new contribution
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
  isLocalnets: function(){
    var contribution = Contributions.findOne({});
    return !contribution.viaTable;
  },
  localnetsDetails: function(){
    var contribution = Contributions.findOne({});
    var localnets = Localnets.findOne({  localnetsID: contribution.tweetID });
    console.log( localnets );
    return localnets;
  },
  currentTwitterID: function(){
    var contribution = Contributions.findOne({});
    if( contribution ){
      return contribution.tweetID;
    }
  },
  newContribution: function(){
    var cursor = Cursor.findOne({});
    if( cursor && cursor.newContribution ){      
      return true;
    }
    return false;
  }
});
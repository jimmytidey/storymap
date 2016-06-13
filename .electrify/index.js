var app       = require('app');
var fs       = require('fs');
var browser   = require('browser-window');
var electrify = require('electrify')(__dirname);

var windows   = {};
var Config = require( '../screen-config.json' );
console.log( Config );

app.on('ready', function() {

  // electrify start
  electrify.start(function(meteor_root_url) {

    // creates a new electron window
    var x = 0;
    for( var i = 0; i < Config.screens.length; i++ ){
      var scr = Config.screens[i];      
      var win = new browser({
        width: scr.width,
        height: scr.height,
        x: x + scr.offsetX,
        y: 0 + scr.offsetY,
        fullscreen: scr.fullscreen,
        'node-integration': false
      });

      win.loadURL( meteor_root_url + '/' + scr.path );

      windows[scr.path] = win;

      x += scr.width;
    }

    if( Config.focus ){
      windows[Config.focus].focus();
    }
      
  });
});


app.on('window-all-closed', function() {
  app.quit();
});


app.on('will-quit', function terminate_and_quit(event) {
  
  // if electrify is up, cancel exiting with `preventDefault`,
  // so we can terminate electrify gracefully without leaving child
  // processes hanging in background
  if(electrify.isup() && event) {

    // holds electron termination
    event.preventDefault();

    // gracefully stops electrify 
    electrify.stop(function(){

      // and then finally quit app
      app.quit();
    });
  }
});

// 
// =============================================================================
// 
// the methods bellow can be called seamlessly from your Meteor's
// client and server code, using:
// 
//    Electrify.call('methodname', [..args..], callback);
// 
// ATENTION:
//    From meteor, you can only call these methods after electrify is fully
//    started, use the Electrify.startup() convenience method for this
// 
// 
// Electrify.startup(function(){
//   Electrify.call(...);
// });
// 
// =============================================================================
// 
// electrify.methods({
//   'method.name': function(name, done) {
//     // do things... and call done(err, arg1, ..., argN)
//     done(null);
//   }
// });
// 

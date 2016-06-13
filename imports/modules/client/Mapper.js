import { Config } from '../../config.js';
import { NumericSolve } from '../lib/numeric-solve.js';
import '../lib/jquery.event.drag-2.2.js';

// much here is from: http://bl.ocks.org/mbostock/10571478

var Mapper = function( _target ){
  var self = this;
  var transformCSSString = ["", "-webkit-", "-moz-", "-ms-", "-o-"].reduce(function(p, v) { return v + "transform" in document.body.style ? v : p; }) + "transform";

  var transformed = function(){
    for (var a = [], b = [], i = 0, n = self.sourcePoints.length; i < n; ++i) {
      var s = self.sourcePoints[i];
      var t = self.targetPoints[i];
      a.push( [s[0], s[1], 1, 0, 0, 0, -s[0] * t[0], -s[1] * t[0]] ), b.push(t[0]);
      a.push( [0, 0, 0, s[0], s[1], 1, -s[0] * t[1], -s[1] * t[1]] ), b.push(t[1]);
    }

    var X = NumericSolve(a, b, true);
    var matrix = [
      X[0], X[3], 0, X[6],
      X[1], X[4], 0, X[7],
         0,    0, 1,    0,
      X[2], X[5], 0,    1
    ].map(function(x) {
      return parseFloat( x.toFixed( 6 ) );
    });

    self.$target.css( transformCSSString, "matrix3d(" + matrix + ")");
  }
  
  var createHandles = function(){
    var handleSize = 30;
    self.handles = [];
    for( var i = 0; i <  self.sourcePoints.length; i++ ){
      var point = self.sourcePoints[i];      
      var trans = 'translate(' + point[0] + 'px,' + point[1] + 'px)';

      $handle = $( '<div class="mapper--handle"><div>' )
        .css( 'position', 'absolute' )
        .css( 'width', handleSize )
        .css( 'height', handleSize )
        .css( 'background', 'lime' )
        .css( 'top', handleSize * -0.5 )
        .css( 'left', handleSize * -0.5 )
        .css( 'cursor', 'move' )
        .css( 'border-radius', '50%' )
        .css( transformCSSString, trans );

      $handle.data( 'id', i );

      $handle.drag(function( e ){
        var id = $(this).data( 'id' );
        var trans = 'translate(' + e.pageX + 'px,' + e.pageY + 'px)';
        $(this).css( transformCSSString, trans );
        self.targetPoints[id] = [e.pageX, e.pageY];
        transformed();
      });

      self.$ele.append( $handle );
      self.handles.push( $handle );
      console.log( trans );
    }
    console.log( self.handles );
  }

  var init = function(){
    self.$target = $( _target );
    self.$target.wrap( '<div class="mapper"></div>' );
    self.$ele = $('.mapper');
    self.width = self.$ele.width();
    self.height = self.$ele.height();
    self.sourcePoints = [[0, 0], [self.width, 0], [self.width, self.height], [0, self.height]];
    self.targetPoints = [[0, 0], [self.width, 0], [self.width, self.height], [0, self.height]];

    createHandles();
    transformed();
  }


  init();
}

export {Mapper};
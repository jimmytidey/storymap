#Setup

1. run ```npm install``` to get the  twit module
2. rename imports/config-default.js to config.js
3. add twitter API keys, change to correct account, hashtag etc
4. add localnets URL
 


#Details

#Screens:

Add screen configuration details to /screens-config.json
Console: 1920x1080
Projector: 1280x720

#Requirements/configuration

##sass/compass

Compile down to css.

See: http://compass-style.org/

To run:
```cd public/assets```
```compass watch```

##electrify 

To create app / windows and allow us to position them.

```npm install -g electrify``` AND ```meteor add arboleya:electrify```

The sizes / positions for this are configured in ./screen-config.json. Each screen gets a path that it will visit, as well as a size (overridden if fullscreen is true) and an offset.

They will appear next to each other, left to right, in order, so if there are 2 screens and both are set to fullscreen, the first one will appear on the left screen and the second one on the right.

There is also an option for 'focus' this takes a path and will set the screen that has that path to be the focussed window (to allow for input events, etc).



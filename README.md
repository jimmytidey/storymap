#Details

#Screens:

Add screen configuration details to /screens-config.json
Console: 1920x1080
Projector: 1280x720

#Requirements/configuration

##electrify 

To create app / windows and allow us to position them.

```npm install -g electrify``` AND ```meteor add arboleya:electrify```

The sizes / positions for this are configured in ./screen-config.json. Each screen gets a path that it will visit, as well as a size (overridden if fullscreen is true) and an offset.

They will appear next to each other, left to right, in order, so if there are 2 screens and both are set to fullscreen, the first one will appear on the left screen and the second one on the right.

There is also an option for 'focus' this takes a path and will set the screen that has that path to be the focussed window (to allow for input events, etc).



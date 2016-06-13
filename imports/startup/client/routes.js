import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import '../../ui/layouts/index.js';
import '../../ui/layouts/input.js';
import '../../ui/layouts/output.js';
import '../../ui/layouts/layout.js';
import '../../ui/layouts/admin.js';

FlowRouter.route( '/', {
  name: 'home',
  action() {
    console.log('HOME ROUTE');
    BlazeLayout.render('App_body', {main: 'Home_page'});
  }
});

FlowRouter.route('/input', {
  name: 'input',
  action() {
    BlazeLayout.render('App_body', {main: 'Grid_page'});
  }
});

FlowRouter.route('/output', {
  name: 'output',
  action() {
    BlazeLayout.render('App_body', {main: 'Output_page'});
  }
});

FlowRouter.route('/admin', {
  name: 'admin',
  action() {
    BlazeLayout.render('App_body', {main: 'Admin_page'});
  }
});

FlowRouter.route('/layout', {
  name: 'layout',
  action() {
    BlazeLayout.render('App_body', {main: 'Layout_page'});
  }
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'Home_page' });
  },
};
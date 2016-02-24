'use strict';

const Cylon = require('cylon');
const _ = require('underscore');

const MIN_RADIUS = 50.0;
const MIN_FINGERS = 4;

let lastState = '';

let countFingers = (pointables) => {
  let openFingers = 0;

  _.each(pointables, (pointable) => {
    if (pointable.extended) {
      openFingers += 1;
    }
  });

  return openFingers;
};

Cylon.robot()
    .connection('leapmotion', { adaptor: 'leapmotion' })
    .device('leapmotion', { driver: 'leapmotion' })
    .on('ready', (bot) => {
      bot.leapmotion.on('gesture', (gesture) => {
        let type = gesture.type;
        let state = gesture.state;
        let radius = gesture.radius;
        let stopped = _.isEqual(state, 'stop');

        if (_.isEqual(type, 'circle') && stopped && radius >= MIN_RADIUS) {
          if (gesture.normal[2] < 0) {
            console.log('taking off');
          } else if (gesture.normal[2] > 0) {
            console.log('landing');
          }
        }

        if (_.isEqual(type, 'keyTap') || _.isEqual(type, 'screenTap')) {
          console.log('hovering');
        }
      });

      bot.leapmotion.on('hand', (hand) => {
        let handOpened = (countFingers(hand.pointables) >= 4); // need to have at least 4 fingers

        if (handOpened) {
          console.log('hand open');
        } else {
          console.log('hand closed');
        }
      });
    });

Cylon.start();
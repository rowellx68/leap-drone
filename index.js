'use strict';

const Cylon = require('cylon');
const _ = require('underscore');

const LEAP_MOTION = 'leapmotion';
const MIN_RADIUS = 50.0;
const MIN_FINGERS = 4;

// states
const TAKE_OFF = 'TAKE_OFF';
const LAND = 'LAND';
const FLYING = 'FLYING';
const LANDED = 'LANDED';

// gestures
const CIRCLE = 'circle';
const KEY_TAP = 'keyTap';
const SCREEN_TAP = 'screenTap';

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

let handOpened = (pointables) => {
  return (countFingers(pointables) >= MIN_FINGERS);
};

Cylon.robot()
    .connection(LEAP_MOTION, { adaptor: LEAP_MOTION })
    .device(LEAP_MOTION, { driver: LEAP_MOTION })
    .on('ready', (bot) => {
      bot.leapmotion.on('gesture', (gesture) => {
        let type = gesture.type;
        let state = gesture.state;
        let radius = gesture.radius;
        let stopped = _.isEqual(state, 'stop');

        if (_.isEqual(type, CIRCLE) && stopped && radius >= MIN_RADIUS) {
          if (gesture.normal[2] < 0) {
            let oldLastState = lastState;
            lastState = TAKE_OFF;

            if (_.isEqual(oldLastState, lastState)) {
              console.log('taking off');
              lastState = FLYING;
            }
          } else if (gesture.normal[2] > 0) {
            let oldLastState = lastState;
            lastState = LAND;

            if (_.isEqual(oldLastState, lastState)) {
              console.log('landing');
              lastState = LANDED;
            }
          }
        }
      });

      bot.leapmotion.on('hand', (hand) => {
        if (handOpened(hand.pointables)) {

        } else {
          // if the leap motion doesn't detect 4+ finger it should hover
        }
      });
    });

Cylon.start();
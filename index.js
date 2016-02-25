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

//
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

let isHandOpened = (pointables) => {
  return (countFingers(pointables) >= MIN_FINGERS);
};

let takeOffLanding = (gesture, drone) => {
  if (gesture) {
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
  }
};

let handData = (hand, drone) => {
  if (hand) {
    if (_.isEqual(lastState, FLYING)) {
      if (isHandOpened(hand.pointables)) {
        let palmY = lastPalmY = hand.palmY;
        let thumbY = hand.thumb.direction[1];
        let middleY = hand.middleFinger.direction[1];
        let pinkyY = hand.pinky.direction[1];

        console.log(`ID: ${hand.id} PalmY: ${palmY} ${lastPalmY}`);
      }
    }
  }
};

Cylon.robot()
    .connection(LEAP_MOTION, { adaptor: LEAP_MOTION })
    .device(LEAP_MOTION, { driver: LEAP_MOTION })
    .on('ready', (bot) => {
      bot.leapmotion.on('frame', (frame) => {
        let hand = frame.hands[0];
        let gesture = frame.gestures[0];
        
        takeOffLanding(gesture, null);

        if (hand && isHandOpened(hand.pointables) && _.isEqual(lastState, FLYING)) {
          console.log(hand.palmPosition[1]);
        }
      });

      //bot.leapmotion.on('hand', (hand) => {
      //  // we will only start to translate the data if the drone is already flying.
      //  if (_.isEqual(lastState, FLYING)) {
      //    if (isHandOpened(hand.pointables)) {
      //      let palmY = lastPalmY = hand.palmY;
      //      let thumbY = hand.thumb.direction[1];
      //      let middleY = hand.middleFinger.direction[1];
      //      let pinkyY = hand.pinky.direction[1];
      //
      //      setTimeout(() => {
      //        palmY = hand.palmY;
      //      }, 500);
      //
      //      console.log(`ID: ${hand.id} PalmY: ${palmY} ${lastPalmY}`);
      //    }
      //  }
      //});
    });

Cylon.start();
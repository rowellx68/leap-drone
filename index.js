'use strict';

const Cylon = require('cylon');
const _ = require('underscore');

const LEAP_MOTION = 'leapmotion';
const MIN_RADIUS = 40.0;
const MIN_FINGERS = 5;

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
let framePrevious = {};
let frameCurrent = {};

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

let handData = (frameRef, palmY, thumbY, middleFingerY, pinkyY) => {
  console.log(`${frameRef} { PALM: ${palmY}, THUMB: ${thumbY}, MIDDLE: ${middleFingerY}, PINKY: ${pinkyY} }`);
};

Cylon.robot()
    .connection(LEAP_MOTION, { adaptor: LEAP_MOTION })
    .device(LEAP_MOTION, { driver: LEAP_MOTION })
    .on('ready', (bot) => {
      bot.leapmotion.on('frame', (frame) => {
        framePrevious = frame.controller.frame(1);
        frameCurrent = frame.controller.frame(0);

        let hand = frameCurrent.hands[0];
        let gesture = frameCurrent.gestures[0];
        
        takeOffLanding(gesture, null);

        if (hand && isHandOpened(hand.pointables) && _.isEqual(lastState, FLYING)) {
          let lastHand = framePrevious.hands[0];

          if (hand && lastHand) {
            handData('PREV:', lastHand.palmPosition[1], lastHand.thumb.tipPosition[1], lastHand.middleFinger.tipPosition[1], lastHand.pinky.tipPosition[1]);
            handData('NOW: ', hand.palmPosition[1], hand.thumb.tipPosition[1], hand.middleFinger.tipPosition[1], hand.pinky.tipPosition[1]);
            console.log(' ');
          }
        }
      });
    });

Cylon.start();
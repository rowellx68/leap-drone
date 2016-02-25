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
        framePrevious = frame.controller.frame(1);
        frameCurrent = frame.controller.frame(0);

        let hand = frameCurrent.hands[0];
        let gesture = frameCurrent.gestures[0];
        
        takeOffLanding(gesture, null);

        if (hand && isHandOpened(hand.pointables) && _.isEqual(lastState, FLYING)) {
          let lastHand = framePrevious.hands[0];

          if (hand && lastHand) {
            console.log(`PREV: { PALM: ${lastHand.palmPosition[1]}, THUMB: ${lastHand.thumb.tipPosition[1]}, MIDDLE: ${lastHand.middleFinger.tipPosition[1]}, PINKY: ${lastHand.pinky.tipPosition[1]} }`);
            console.log(`NOW:  { PALM: ${hand.palmPosition[1]}, THUMB: ${hand.thumb.tipPosition[1]}, MIDDLE: ${hand.middleFinger.tipPosition[1]}, PINKY: ${hand.pinky.tipPosition[1]} }\n`);
          }
        }
      });
    });

Cylon.start();
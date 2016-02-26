'use strict';

const Cylon = require('cylon');
const _ = require('underscore');

const LEAP_MOTION = 'leapmotion';
const MIN_RADIUS = 40.0;
const MIN_FINGERS = 5;
const UP_DOWN_THRESHOLD = 2;

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

let getHorizontalMovement = (lastHandDirectionX, handDirectionX) => {
  let horizontalMove = lastHandDirectionX - handDirectionX;

  return Math.abs(horizontalMove);
};

let getVerticalMovement = (lastPalmPositionY, handPalmPositionY) => {
  let verticalMove = handPalmPositionY - lastPalmPositionY;

  return Math.abs(verticalMove);
};

let getDirection = (valueA, valueB) => {
  let directionalValue = valueA - valueB;
  let direction = 0;

  if (directionalValue > 0) {
    direction = 1;
  } else {
    direction = -1;
  }

  return direction;
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
            let horizontalMovement = getHorizontalMovement(lastHand.direction[0], hand.direction[0]);
            let verticalMovement = getVerticalMovement(lastHand.palmPosition[1], hand.palmPosition[1]);

            if (verticalMovement >= UP_DOWN_THRESHOLD) {
              let direction = getDirection(hand.palmPosition[1], lastHand.palmPosition[1]);

              if (direction > 0) {
                console.log('Going Up');
              } else if (direction < 0) {
                console.log('Going Down');
              }
            }
          }
        }
      });
    });

Cylon.start();
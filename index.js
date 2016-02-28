'use strict';

const Cylon = require('cylon');
const _ = require('underscore');

const LEAP_MOTION = 'leapmotion';
const AR_DRONE = 'ardrone';
const MIN_RADIUS = 40.0;
const MIN_FINGERS = 5;
const UP_DOWN_DIRECTION_THRESHOLD = 2;
const DIRECTION_THRESHOLD = 3;
const UP_DOWN_MOVEMENT_SPEED = 0.8;
const MOVEMENT_SPEED = 0.4;

// states
const TAKE_OFF = 'TAKE_OFF';
const LAND = 'LAND';
const FLYING = 'FLYING';
const LANDED = 'LANDED';

// gestures
const CIRCLE = 'circle';
const KEY_TAP = 'keyTap';
const SCREEN_TAP = 'screenTap';

// globals
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

let getVerticalMovement = (lastPositionY, handPositionY) => {
  let verticalMove = handPositionY - lastPositionY;

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


Cylon.robot({
  connections: {
    leapmotion: { adaptor: LEAP_MOTION },
    ardrone: { adaptor: AR_DRONE, port: '192.168.1.1' }
  },
  devices: {
    leapmotion: { driver: LEAP_MOTION, connection: LEAP_MOTION },
    drone: { driver: AR_DRONE, connection: AR_DRONE }
  },
  work: function (bot) {
    bot.leapmotion.on('frame', (frame) => {
      framePrevious = frame.controller.frame(1);
      frameCurrent = frame.controller.frame(0);

      let hand = frameCurrent.hands[0];
      let gesture = frameCurrent.gestures[0];

      takeOffLanding(gesture, null);

      if (hand && isHandOpened(hand.pointables) && _.isEqual(lastState, FLYING)) {
        let lastHand = framePrevious.hands[0];

        if (hand && lastHand) {
          let palmVerticalMovement = getVerticalMovement(lastHand.palmPosition[1], hand.palmPosition[1]);
          let thumbVerticalMovement = getVerticalMovement(lastHand.thumb.tipPosition[1], hand.thumb.tipPosition[1]);
          let middleFingerVerticalMovement = getVerticalMovement(lastHand.middleFinger.tipPosition[1], hand.middleFinger.tipPosition[1]);

          if (palmVerticalMovement >= UP_DOWN_DIRECTION_THRESHOLD) {
            let direction = getDirection(hand.palmPosition[1], lastHand.palmPosition[1]);
            let movement = Math.round(palmVerticalMovement);

            if (direction > 0) {
              console.log(`Going Up ${movement}`);
            } else if (direction < 0) {
              console.log(`Going Down ${movement}`);
            }
          } else {
            if (thumbVerticalMovement >= DIRECTION_THRESHOLD) {
              let direction = getDirection(lastHand.middleFinger.tipPosition[1], hand.middleFinger.tipPosition[1]);
              let movement = Math.round(thumbVerticalMovement);

              if (direction > 0) {
                console.log(`Going Right ${movement}`);
              } else if (direction < 0) {
                console.log(`Going Left ${movement}`);
              }
            }

            if (middleFingerVerticalMovement >= DIRECTION_THRESHOLD) {
              let direction = getDirection(lastHand.middleFinger.tipPosition[1], hand.middleFinger.tipPosition[1]);
              let movement = Math.round(middleFingerVerticalMovement);

              if (direction > 0) {
                console.log(`Go Forward ${movement}`);
              } else if (direction < 0) {
                console.log(`Go Backward ${movement}`);
              }
            }
          }
        }
      }
    });
  }
}).start();
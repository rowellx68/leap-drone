'use strict';

const Cylon = require('cylon');
const _ = require('underscore');

const LEAP_MOTION = 'leapmotion';
const AR_DRONE = 'ardrone';
const AR_DRONE_NAV = 'ardrone-nav';
const MIN_RADIUS = 40.0;
const MIN_FINGERS = 5;
const UP_DOWN_DIRECTION_THRESHOLD = 2;
const DIRECTION_THRESHOLD = 3;
const UP_DOWN_MOVEMENT_SPEED = 0.2;
const MOVEMENT_SPEED = 0.2;

// states
const TAKE_OFF = 'TAKE_OFF';
const LAND = 'LAND';
const FLYING = 'FLYING';
const LANDED = 'LANDED';

// gestures
const CIRCLE = 'circle';

// globals
let lastState = LANDED;
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

/**
 * This method deals with the taking off and the landing
 * of the drone.
 *
 * To take off, we will need to gesture a clockwise
 * circle twice.
 *
 * Landing will only need one counter clockwise circle
 * gesture. It was apparent at testing that landing must
 * be as easy as possible, otherwise the drone could
 * fly far away.
 */
let takeOffLanding = (gesture, drone) => {
  if (gesture) {
    let type = gesture.type;
    let state = gesture.state;
    let radius = gesture.radius;
    let stopped = _.isEqual(state, 'stop');

    /**
     * We check the gesture type, the gesture state and the radius
     * before proceeding.
     *
     * Radius was needed so we don't accidentally pick up smaller
     * circle gestures.
     */
    if (_.isEqual(type, CIRCLE) && stopped && radius >= MIN_RADIUS) {
      if (gesture.normal[2] < 0 && (_.isEqual(lastState, LANDED) || _.isEqual(lastState, TAKE_OFF))) {
        /**
         * Taking off requires two circular gestures.
         *
         * This allows us to insure that we intended to start the drone.
         * We do this by checking the lastState and see if it's the same
         * as the current state.
         */
        let oldLastState = lastState;
        lastState = TAKE_OFF;

        if (_.isEqual(oldLastState, lastState)) {
          console.log('STATE: Taking Off');

          drone.takeoff(() => {
            lastState = FLYING;
            console.log('STATE: Flying');
          });
        }
      } else if (gesture.normal[2] > 0) {
        /**
         * Landing the drone only requires one counter clockwise gesture.
         *
         * Upon testing, it showed that it was more ideal to land the drone
         * using a very simple gesture, just in case we really need to land
         * the drone.
         */
        console.log('STATE: Landing');

        drone.land(() => {
          lastState = LANDED;
          console.log('STATE: Landed');
        });
      }
    }
  }
};

/**
 * Returns the vertical movement.
 * @param lastPositionY
 * @param newPositionY
 * @returns {number}
 */
let getVerticalMovement = (lastPositionY, newPositionY) => {
  let verticalMove = newPositionY - lastPositionY;

  return Math.abs(verticalMove);
};

/**
 * Returns the direction based on the differences of values.
 * @param valueA
 * @param valueB
 * @returns {number}
 */
let getDirection = (valueA, valueB) => {
  let directionalValue = valueA - valueB;
  let direction = -1;

  if (directionalValue > 0) {
    direction = 1;
  }

  return direction;
};

/**
 * Deals with the drone's up/down movement.
 * @param direction
 * @param drone
 */
let droneMovementUpDown = (direction, drone) => {
  if (direction > 0) {
    console.log(`STATE: Going Up. SPEED: ${UP_DOWN_MOVEMENT_SPEED}`);

    drone.up(UP_DOWN_MOVEMENT_SPEED);
  } else if (direction < 0) {
    console.log(`STATE: Going Down. SPEED: ${UP_DOWN_MOVEMENT_SPEED}`);

    drone.down(UP_DOWN_MOVEMENT_SPEED);
  }
};

/**
 * Deals with the drone's left/right movement.
 * @param direction
 * @param drone
 */
let droneMovementLeftRight = (direction, drone) => {
  if (direction > 0) {
    console.log(`STATE: Going Right. SPEED: ${MOVEMENT_SPEED}`);

    drone.left(MOVEMENT_SPEED);
  } else if (direction < 0) {
    console.log(`STATE: Going Left. SPEED: ${MOVEMENT_SPEED}`);

    drone.right(MOVEMENT_SPEED);
  }
};

/**
 * Deals with the drone's front/back movement.
 * @param direction
 * @param drone
 */
let droneMovementFrontBack = (direction, drone) => {
  if (direction > 0) {
    console.log(`STATE: Going Forward. SPEED: ${MOVEMENT_SPEED}`);

    drone.front(MOVEMENT_SPEED);
  } else if (direction < 0) {
    console.log(`STATE: Going Backward. SPEED: ${MOVEMENT_SPEED}`);

    drone.back(MOVEMENT_SPEED);
  }
};

Cylon.robot({
  connections: {
    leapmotion: { adaptor: LEAP_MOTION },
    ardrone: { adaptor: AR_DRONE, port: '192.168.1.1' }
  },
  devices: {
    leapmotion: { driver: LEAP_MOTION, connection: LEAP_MOTION },
    drone: { driver: AR_DRONE, connection: AR_DRONE },
    nav: { driver: AR_DRONE_NAV, connection: AR_DRONE  }
  },
  work: function (bot) {
    /**
     * We set min and max altitude so we don't got too low/high.
     * When testing the drone, it was apparent that having no max limit could
     * have caused some issues.
     */
    bot.drone.config('control:altitude_max', 2000);
    bot.drone.config('control:altitude_min', 100);
    bot.drone.config('general:navdata_demo', 'TRUE');

    /**
     * cylon-leapmotion offers a few events that we can subscribe to.
     * Using the `frame` event allows us access to the previous frame,
     * therefore we are able to deduce how much movement was made by
     * the hand.
     */
    bot.leapmotion.on('frame', (frame) => {
      framePrevious = frame.controller.frame(1);
      frameCurrent = frame.controller.frame(0);

      let hand = frameCurrent.hands[0];
      let gesture = frameCurrent.gestures[0];

      takeOffLanding(gesture, bot.drone);

      if (hand && isHandOpened(hand.pointables) && _.isEqual(lastState, FLYING)) {
        let lastHand = framePrevious.hands[0];

        if (hand && lastHand) {
          let palmVerticalMovement = getVerticalMovement(lastHand.palmPosition[1], hand.palmPosition[1]);
          let thumbVerticalMovement = getVerticalMovement(lastHand.thumb.tipPosition[1], hand.thumb.tipPosition[1]);
          let middleFingerVerticalMovement = getVerticalMovement(lastHand.middleFinger.tipPosition[1], hand.middleFinger.tipPosition[1]);

          if (palmVerticalMovement >= UP_DOWN_DIRECTION_THRESHOLD) {
            let direction = getDirection(hand.palmPosition[1], lastHand.palmPosition[1]);

            droneMovementUpDown(direction, bot.drone);
          } else {
            if (thumbVerticalMovement >= DIRECTION_THRESHOLD) {
              let direction = getDirection(hand.thumb.tipPosition[1], lastHand.thumb.tipPosition[1]);

              droneMovementLeftRight(direction, bot.drone);
            }

            if (middleFingerVerticalMovement >= DIRECTION_THRESHOLD) {
              let direction = getDirection(lastHand.middleFinger.tipPosition[1], hand.middleFinger.tipPosition[1]);

              droneMovementFrontBack(direction, bot.drone);
            }
          }
        }
      } else {
        /**
         * When no hand is detected or when the hand is closed,
         * the drone should hover in place.
         *
         * This has proven useful when you wan't the drone to stop
         * moving, you will only need to close the hand.
         */
        bot.drone.hover();
      }
    });
  }
}).start();
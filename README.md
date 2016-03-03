# LeapDrone

`Leap Motion + AR.Drone = LeapDrone`

Group project for Programming Things. Using gestures on Leap Motion, we aim to control the AR.Drone.

## Tasks

- [x] Get Leap Motion to work
- [x] Try out [Cylon](https://github.com/hybridgroup/cylon/) with Leap Motion
- [x] Recognise some gestures
- [x] Get previous frame
- [x] Get palm data
- [x] Get fingers data

## Members

- Elizabeth Athanasiadi
- Kyle Bingham
- Daniel Haswell
- Rowell Heria

## Contributing

When contributing, commits **MUST** start with these emojis.

- `:bug:` - :bug: - Bug fixes.
- `:memo:` - :memo: - Documentation addition/changes.
- `:fire:` - :fire: - When removing code/files.

## Development

To begin development, you will need to have `nodemon` installed. You can then type the script below.

```
npm run start:nm
```

`nodemon` should automatically restart the application when it detects any changes to the files.

## How To

To start controlling the drone, you will need to connect your computer to the AR.Drone's wifi. You will then need to start Cylon by typing the script below.

```
npm start
```

- Take Off - gesture circle clockwise twice
- Land - gesture circle counter clockwise

To control the drone's movement, you will need to control the drone with your hand. This can be done by tilting your open hand.
Tilting yout hand left/right will move the drone left/right; tilting your hand forward/backward will moe the drone forward/backward; moving the hand up/down will moe the drone up/down.

Details about gestures can be found [here](https://developer.leapmotion.com/documentation/javascript/devguide/Leap_Gestures.html).

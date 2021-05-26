# Umbrella-Script

This is a webapp designed to work together with my Umbrella-Planner app.
After planning out a sequence in the app, export the sequence and move the generated data.js file into this folder.

This allows participants to simply specify where in the grid they are standing and it will provide an easy-to-understand UI telling them when to open and close their umbrellas.
The interface includes three colour-changing bubbles - a large one for the current action and two smaller ones providing a preview for the next two actions.

Since this is designed to work offline, the internet is not used to start the sequence for all participants at the same time.
Instead, each participant must input the same start time. The device's local time is used to determine when to start the sequence.

To avoid problems due to out-of-sync device clocks, the time difference between a server time and the device's local time is calculated on page load and cached for later use.
This time offset is used to adjust the starting time so the sequence will start at the same time on all devices.

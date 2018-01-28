# Change Detection

This is an experiment designed to be run with psiTurk.
Developed with psiTurk version 2.2.3

## What it's for

This is the change detection task that is often used to assess working memory capacity (K).

Subjects are given a number of colored circles and are asked to remember as many as possible.
After a short delay, the circles return to the screen. 50% of the time, one circle will have changed colors.
The subject then responds with 'S' for same or 'D' for different.

The following formula can then be used to get a measure of the subject's capacity:
K = (hit rate + correct rejection rate - 1) * set size  

For more information about change detection, see Luck, S. J., & Vogel, E. K. (1997). *Nature*

## Setup

1. Install psiturk using the installation instructions on [psiturk.org](psiturk.org).
2. Download or clone this repository and move it anywhere on your computer.
3. Open terminal and use `cd \PATH\TO\YOUR\FOLDER` to enter your project's directory
4. Change the necessary files (everything that needs to be changed will be in all caps).
	- config.txt
	- templates/ad.html
	- template/consent.html
	- template/error.html
	- static/favicon.ico
	- static/images/university.png

For more information about what these files do and how to change them, please see [psiTurk's documentation](https://psiturk.readthedocs.io/en/latest/)

5. Test the experiment by running the following commands:
	1. `$ psiturk`
	2. `$ server on`
	3. `$ debug` 

## Task Changes

Two parameters that you are likely to want to change are the tested set sizes and the number of trials.

For your convenience, these settings can be changed at the top of the static/js/task.js file.

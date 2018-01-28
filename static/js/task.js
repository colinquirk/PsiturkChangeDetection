// Settings

/*
An array of all the set sizes you'd like to test.
The total number of trials should be divisible by 2 * the length of the set_sizes array
to account for same/different trials.
*/
var set_sizes = [6]
/*
The number of trials you'd like the participants to complete.
150 trials gives you a decent signal to noise and only takes 10 minutes to complete.

See the following citation for more info:
Xu, Z., Adam, K. C. S., Fang, X., & Vogel, E. K. (2017). Behavior research methods
*/
var number_of_trials = 150


// Experiment Logic
// Be careful changing anything below this
// For help, email cquirk@uchicago.edu
var psiturk = PsiTurk(uniqueId, adServerLoc);

var timeout = null;

// idea stolen from stackoverflow
// https://stackoverflow.com/questions/210717/using-jquery-to-center-a-div-on-the-screen
jQuery.fn.center = function () {
  this.css({'position':'absolute',
            'left':'50%',
            'top':'50%',
            'transform':'translate(-50%, -50%)'
  });
  return this;
}

function permute( a, p ) {
  var r = [];
  for (var i = 0; i < a.length; ++i) {
    r.push(a[p[i]]);
  }
  return r;
}

function end_experiment() {
  var end_exp_text = 
`Thank you for completing this experiment.\n
Hitting the button below will end the experiment.`;

  $('#displaydiv').append('<p id=text></p>');
  $('#displaydiv').append('<button id="continue">Continue</button>');
  $('#text').text(end_exp_text)
  $('#text').center()
  $('#text').css({'width':'85%', 'white-space':'pre-wrap'})
  $('#continue').center()
  $('#continue').css('top','75%')
  $('#continue').click(function(){
    psiturk.saveData({
      success: psiturk.completeHIT,
      error: psiturk.completeHIT // End despite the error
    })
  });
}

// recreates a blank canvas every time we want to draw something new
function blankCanvas(color) {
  $('body').empty()
  var canvas_html = "<canvas id='expcanvas' width=800 height=600 style='border:5px solid #000000'></canvas>";
  $('body').append(canvas_html);
  $('#expcanvas').center();
  $('#expcanvas').css('background-color', color);
  $('body').append('<div id="displaydiv"></div>')
  $('#displaydiv').css({'width':'800px', 'height':'600px', 'text-align' : 'center'})
  $('#displaydiv').center()
}

// displays some text on the first screen
function welcome() {
  var welcome_text = 
`Welcome to the experiment.\n
If you cannot see the box around this text you will not be able to complete this experiment with your current broswer.
Try a different browser or please return the HIT.\n
If you can see the box, please make sure that all of it is visible by resizing your window.
Everything you need to complete the HIT will appear in this box.\n
Press the button to continue.`;

  $('#displaydiv').append('<p id=text></p>');
  $('#displaydiv').append('<button id="continue">Continue</button>');
  $('#text').text(welcome_text)
  $('#text').center()
  $('#text').css({'width':'85%', 'white-space':'pre-wrap'})
  $('#continue').center()
  $('#continue').css('top','85%')
  $('#continue').click(next_main_state);
}

// Tells the participants how to complete the experiment
function instructions() {
  var instruct_text = 
`
This HIT requires you to complete a 10 minute task and a short questionaire.\n
Please do your best to complete as many trials as possible.
Please do not refresh this page as it will reset your progress.\n
If you'd like to stop during the HIT or if you have technical issues, please contact cquirk@uchicago.edu to receive partial compensation.\n
To view instructions for the task, press the button.
`

  $('#displaydiv').append('<p id=text></p>');
  $('#displaydiv').append('<button id="continue">Continue</button>');
  $('#text').text(instruct_text)
  $('#text').center()
  $('#text').css({'width':'85%', 'white-space':'pre-wrap'})
  $('#continue').center()
  $('#continue').css('top','85%')
  $('#continue').click(next_main_state);
}

/*
This is a class I use to help store data when I have multiple tasks with different fields.
It's probably overkill in the particular situation.

addFields is used to set up the header for each individual task.
recordData marks unused fields as NA, then sends the data to psiturk and saves it
*/
class DataManager {
  constructor() {
    this.fields = [];
  }

  addFields(newFields) {
    _.union(this.fields, newFields).forEach((i) => {
      this.fields.push(i);
    })
  }
  
  recordData(data) {
    var dataKeys = Object.keys(data);
    dataKeys.forEach((k) => {
      if (this.fields.indexOf(k) == -1) {
        throw 'Error: Key does not exist in fields.'
      }
    })
    
    var recData = {};
    this.fields.forEach((h) => {
      recData[h] = 'NA';
    })
    
    dataKeys.forEach((k) => {
      recData[k] = data[k];
    })
    
    psiturk.recordTrialData(recData);
    psiturk.saveData(); // Consider if you want to save every trial
  }
}

class K_Task {
  constructor(max_trials, set_sizes) {
    this.max_trials = max_trials - 1; // make it 0 indexed
    this.set_sizes = set_sizes;
    this.trials_per_setsize = max_trials/set_sizes.length;
    this.cur_trial = 0;
    this.k_trial_state = 0;
    this.radius = 45; // size of the stimuli in pix

    this.sample_time = 600; // in ms

    // All of the colors to be used
    this.colorList = ['#FF0000',
                      '#006600',
                      '#0000FF',
                      '#FFFF00',
                      '#FFB3FF',
                      '#00FFFF',
                      '#FFFFFF',
                      '#000000',
                      '#FF9933',
                      '#990099',
                      '#804D00',
                      '#00FF00']

    // simple state machine
    this.k_trial_states = [
      () => {this.display_fixation(_.random(600,900))},
      () => {this.display_sample()},
      () => {this.display_fixation(1000)},
      () => {this.display_test()}
    ];

    var trial_types = this.gen_trial_types()
    var locations = this.gen_rand_locations();
    var colors = this.gen_rand_colors();

    // shuffle everything consistently
    var p = _.shuffle(_.range(this.max_trials+1))
    trial_types = permute(trial_types, p);
    locations[0] = permute(locations[0], p);
    locations[1] = permute(locations[1], p);
    locations[2] = permute(locations[2], p);
    colors = permute(colors, p);

    this.trials = {trial_types: trial_types,
                   locations: locations[0],
                   test_locs: locations[1],
                   sample_colors: colors,
                   foil_colors: locations[2]};

    // TODO localize this
    dm.addFields(['Task',
                  'Condition',
                  'SampleTime',
                  'RT',
                  'CRESP',
                  'RESP',
                  'ACC',
                  'SetSize',
                  'DisplayColor',
                  'TestColor',
                  'LocationPresentedX',
                  'LocationPresentedY'
    ])

    this.start = () => {
      this.startTime = Date.now();
      this.k_instructions();
    }

    // manages the timing/trials
    this.next_k_trial_state = () => {
      blankCanvas('#888888');

      // if the next state exists, do it
      if (this.k_trial_states[this.k_trial_state]) {
        this.k_trial_states[this.k_trial_state]()
        this.k_trial_state++
      //otherwise, check if we have more trials
      } else {
        if (this.cur_trial >= this.max_trials) {
          next_main_state(); // if not, move on
        } else {
          // if we do, reset and run the next trial
          this.cur_trial++
          this.k_trial_state = 0;
          this.next_k_trial_state()
        }
      }
    }
  }

  gen_trial_types() {
    var trial_types = [];

    for (var i=0;i<this.set_sizes.length;i++) {
      for(var j=0;j<this.trials_per_setsize;j++) {
        trial_types.push(j % 2)
      }
    }
    return trial_types
  }

  gen_rand_colors() {
    var trial_colors = [];

    for (var i=0;i<this.set_sizes.length;i++) {
      for(var j=0;j<this.trials_per_setsize;j++) {
        var temp = [];
        for(var k=0;k<this.set_sizes[i];k++) {
            var shuffled_colors = _.shuffle(this.colorList)
            temp.push(shuffled_colors[0]);
        }
        trial_colors.push(temp);
      }
    }
    return trial_colors;
  }

  gen_rand_locations() {
    var min_dist = 110; // How far apart should stimuli be in pixels

    var locations = [];
    var test_locs = [];
    var foil_colors = [];

    for (var i=0;i<this.set_sizes.length;i++) {
      for(var j=0;j<this.trials_per_setsize;j++) {
        var temp_locs = [[400,300]]; // check against the center too
        for(var k=0;k<this.set_sizes[i];k++) {
          trying:
          while(true) {
            var attempt = [_.random(200,600),_.random(150,450)];
            for(var p=0;p<temp_locs.length;p++) {
              // test using euclidean distance
              if (Math.hypot(temp_locs[p][0]-attempt[0],temp_locs[p][1]-attempt[1]) < min_dist) {
                continue trying;
              }
            }
            break;
          }
          temp_locs.push(attempt);
        }
        locations.push(temp_locs.slice(1));
        // generates the test loc
        var test = _.random(this.set_sizes[i]-1);
        test_locs.push(test);
        while (true) {
          // generate a foil color that's not the same as the stim color
          // TODO refactor this out of the locations function...
          var foil = _.random(this.colorList.length-1)
          if (foil != test) {
            foil_colors.push(this.colorList[foil])
            break;
          }
        }
      }
    }
    return [locations, test_locs, foil_colors];
  }

  k_instructions() {
    var k_instruct_text = 
`For this task, you will be remembering the colors of 6 circles.\n
First, a cross will appear on the screen.\n
Then, 6 colors will be presented randomly in the box.
Do your best to remember as many colors as possible.\n
After a short delay, the circles will reappear in their orginal locations.
If all the circles are the SAME colors as the circles on the first screen, press 'S'.
If any of the circles are DIFFERENT colors as the circles on the first screen, press 'D'.\n
Please be sure you understand the instructions. When you are ready to start, press the button.
`

    $('#displaydiv').append('<p id=text></p>');
    $('#displaydiv').append('<button id="continue">Continue</button>');
    $('#text').text(k_instruct_text)
    $('#text').center()
    $('#text').css({'width':'85%', 'white-space':'pre-wrap'})
    $('#continue').center()
    $('#continue').css('top','85%')
    $('#continue').click(this.next_k_trial_state);
  }

  display_fixation(duration) {
    $('#displaydiv').append('<p id=text></p>');
    $('#text').text('+')
    $('#text').css('font-size', '300%')
    $('#text').center()
    timeout = setTimeout(this.next_k_trial_state, duration)
  }

  display_sample() {
    $('#displaydiv').append('<p id=text></p>');
    $('#text').text('+')
    $('#text').css('font-size', '300%')
    $('#text').center()

    // draws the circles
    var ctx = document.getElementById('expcanvas').getContext('2d');

    this.trials.locations[this.cur_trial].forEach((loc,i) => {
      ctx.fillStyle = this.trials.sample_colors[this.cur_trial][i];
      ctx.beginPath();
      ctx.arc(loc[0],loc[1],this.radius,0,2*Math.PI);
      ctx.fill();
    })

    // waits the necessary amount of time
    var called = performance.now()
    timeout = setTimeout(() => {
      this.next_k_trial_state();
      this.sample_time = performance.now() - called}, this.sample_time)
  }

  display_test() {
    $('#displaydiv').append('<p id=text></p>');
    $('#text').text('+')
    $('#text').css('font-size', '300%')
    $('#text').center()

    var trialType = this.trials.trial_types[this.cur_trial];
    var displayColor = this.trials.sample_colors[this.cur_trial][this.trials.test_locs[this.cur_trial]];

    // figure out which color should be drawn at the test location
    if (trialType == 0) {
      var testColor = displayColor;
    } else {
      var testColor = this.trials.foil_colors[this.cur_trial];
    }

    var loc = this.trials.locations[this.cur_trial][this.trials.test_locs[this.cur_trial]]

    // draws the circles
    var ctx = document.getElementById('expcanvas').getContext('2d');
    this.trials.locations[this.cur_trial].forEach((loc,i) => {
      ctx.fillStyle = this.trials.sample_colors[this.cur_trial][i];

      if(i == this.trials.test_locs[this.cur_trial]) {
        ctx.fillStyle = testColor;
      }

      ctx.beginPath();
      ctx.arc(loc[0],loc[1],this.radius,0,2*Math.PI);
      ctx.fill();
    })

    $(document).clearQueue();

    var rtStart = performance.now();

    // gets the response and records the data
    $(document).keypress((e) => {
      if(e.which === 115 || e.which === 100) {
        var rtEnd = performance.now();
        $(document).off('keypress')
        var rt = rtEnd - rtStart;
        if(e.which === 115) {
            var resp = 's';
        } else {
            var resp = 'd';
        }
        var rt = rtEnd - rtStart;

        if (trialType === 0) {
            trialType = 'same';
        } else {
            trialType = 'diff';
        }

        if (trialType[0] === resp) {
            var acc = 1;
        } else {
            var acc = 0;
        }

        var ss = this.trials.locations[this.cur_trial].length;

        dm.recordData({'Task': 'ColorK',
                      'Condition': trialType,
                      'SampleTime': this.sample_time,
                      'RT': rt,
                      'CRESP': trialType[0],
                      'RESP':resp,
                      'ACC': acc,
                      'SetSize': ss,
                      'DisplayColor': displayColor,
                      'TestColor': testColor,
                      'LocationPresentedX': loc[0],
                      'LocationPresentedY': loc[1]})

        this.next_k_trial_state();
      }
    })
  }
}

dm = new DataManager();

k_task = new K_Task(number_of_trials, set_sizes);

// The state machine for the entire experiment
var states = [
  welcome,
  instructions,
  k_task.start
];

var cur_main_state = 0;
function next_main_state () {
  blankCanvas('#888888')
  if (states[cur_main_state]) {
    states[cur_main_state]()
  } else {
    end_experiment()
  }
  cur_main_state++
}

$(window).ready(function(){
  next_main_state();
});
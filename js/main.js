$(document).ready(function () {
  
  /*=====================================
    Global Variables
  =====================================*/
  
  var x = '<i class="fa fa-times"></i>';
  var o = '<i class="fa fa-circle-o"></i>';
  
  var user = o;
  var computer = x;
  var first = 'user';
  
  var grid = ['aa', 'ab', 'ac', 'ba', 'bb', 'bc', 'ca', 'cb', 'cc'];
  var corners = ['aa','ca', 'cc', 'ac'];
  var edges = ['ab', 'ba', 'bc', 'cb'];
    
  var win_conditions = [
    ['aa','bb','cc'],
    ['ac','bb','ca'],
    ['aa','ab','ac'],
    ['ba','bb','bc'],
    ['ca','cb','cc'],
    ['aa','ba','ca'],
    ['ab','bb','cb'],
    ['ac','bc','cc']
  ];
  
  var corner_traps = [
    {
      traps: [
        ['ba', 'ab'],
        ['ba', 'ac'],
        ['ab', 'ca']
      ],
      danger: 'cc'
    },
    {
      traps: [
        ['ab', 'bc'],
        ['ab', 'cc'],
        ['aa', 'bc']
      ],
      danger: 'ca'
    },
    {
      traps: [
        ['bc', 'cb'],
        ['cb', 'ac'],
        ['bc', 'ca']
      ],
      danger: 'aa'
    },
    {
      traps: [
        ['ba', 'cb'],
        ['aa', 'cb'],
        ['ba', 'cc']
      ],
      danger: 'ac'
    },
  ];
  
  var boardState = {
    user: [],
    computer: []
  };
  
  /*=====================================
    Functions
  =====================================*/
  
  /*================ Settings Panel Functions ================*/
  
  // Function to load data onto the page
  function settings() {
    $('#character-display').html(user);
    if (first == 'user') {
      $('#first-text').html('You are playing first!');  
    } else {
      $('#first-text').html('The computer is playing first');
    }
  }
  
  // Function to clear game data
  function clearData() {
    var board = $('.board-col');
    board.each(function (i, item) {
      // Remove all data-player values
      $(this).removeAttr('data-player');
      // Reset the boardState
      boardState = {
        user: [],
        computer: []
      }
    });
  }
  
  /*================ Game Board Functions ================*/
  
  // Create a Javascript function to compare arrays
  // https://stackoverflow.com/questions/31835447/check-if-one-array-is-contained-in-another-array
  Array.prototype.contains = function(array) {
    return array.every(function(item) {
        return this.indexOf(item) !== -1;
    }, this);
  }
  
  // Function to check if a game is over
  function checkGameOver(state) {
    var occupied = evaluateBoardState(state);
    var available_options = getOptions(grid, occupied);
    $.each(win_conditions, function (k, win_condition) {
      if (first == 'computer') {
        // If the computer goes first the number of remaining moves before a draw increases by 1
        var remaining_moves = 2;
      } else {
        var remaining_moves = 1;
      }
      
      if (state.computer.contains(win_condition) || available_options.length == remaining_moves) {
        if (state.computer.contains(win_condition)) {
          var text = "The computer has won!";
        } else {
          var text = "The game has ended in a draw";
        }
        $('#message').html(text);
        $('#results').css({
          display: 'block' 
        });
        if (state.computer.contains(win_condition)) {
          return false;
        }
      }
    });
  }
  
  // Function to test if a space is available
  function isAvailable(space) {
    if (typeof space.attr('data-player') === 'undefined') {
      return true;
    } else {
      return false;
    }
  }
  
  // Function to perform a move
  function move(space, shape, player) {
    space.html(shape);
    space.attr('data-player', player);
  }
  
  // Function to evaluate the board state
  function evaluateBoardState(state) {
    // Grab the board
    var board = $('.board-col');
    // Record the board state in the boardState object
    $.each(board, function (k,v) {
      var player = $(v).attr('data-player');
      if (typeof player !== 'undefined') {
        var id = $(v).attr('id');
        if ($.inArray(id, state[player]) === -1) {
          state[player].push(id);
        }
      }
    });
    
    // After evaluating the board state return an array of occupied spaces
    var occupied = [];
    $.merge($.merge(occupied, state.user), state.computer);
    return occupied;
  }
  
  // Function to get all available move options
  function getOptions(possibilities, occupied) {
    var available_options = [];
    $.each(possibilities, function (k, space) {
      if ($.inArray(space, occupied) == -1) {
          available_options.push(space);
        }
    });
    return available_options;
  }
  
  // Function to evaluate the threat of a win condition
  function checkWinThreat(win_condition, occupied) {
    var diff = [];
    $.each(win_condition, function (k, item) {
      if ($.inArray(item, occupied) == -1) {
        diff.push(item);
      }
    });
    return diff;
  }
  
  // Function to find any available winning moves
  function getWinningMoves(state, player) {
    // Check if opponent is about to win
    var opponent = state[player];
    var occupied = evaluateBoardState(state);
    
    var opponent_winning_moves = [];
    $.each(win_conditions, function (k, win_condition) {
      var remaining_to_win = checkWinThreat(win_condition, opponent);
      // If opponent is one move away from winning block it
      if (remaining_to_win.length == 1) {
        opponent_winning_moves.push(remaining_to_win[0]);
        // What spaces are available
        var available_spaces = getOptions(grid, occupied);
        
        $.each(opponent_winning_moves, function (k, opponent_winning_move) {
          if ($.inArray(opponent_winning_move, available_spaces) == -1) {
            opponent_winning_moves.pop(opponent_winning_move);
          }
        });
      }
    });
    return opponent_winning_moves;
  }
  
  // Function for optimal turn moves
  function position(state) {
    // Computer must secure adjacent corners or the center space to ensure CAT
    var occupied = [];
    $.merge($.merge(occupied, state.user), state.computer);
    // If center space is available, secure it, otherwise take the nearest corner
    if ($.inArray('bb', occupied) === -1) {
      move($('#bb'), computer, 'computer');
    } else {
      // Are any of the corners occupied?
      var available_corners = getOptions(corners, occupied);
      if (available_corners.length > 0) {
        // Randomly select a corner from the unoccupied corners
        // Additionally, anticipate the corner trap strategy and counter it, remove the losing move from the array of possibilities
        var usable_corners = available_corners;
        $.each(corner_traps, function (k, corner_trap) {
          $.each(corner_trap.traps, function (tk, trap) {
            if (state.user.length == 2 && trap.contains(state.user)) {
              usable_corners.splice(usable_corners.indexOf(corner_trap.danger), 1);
              console.log('Trap countered!');
              return false;
            }
          });
        });
        var i = Math.floor(Math.random() * usable_corners.length);
        move($('#' + usable_corners[i]), computer, 'computer');
      } else {
        // Get the available space and put it there randomly
        var available_spaces = getOptions(grid, occupied);
        var i = Math.floor(Math.random() * available_spaces.length);
        move($('#' + available_spaces[i]), computer, 'computer');
      }
    }
  }
  
  // Computer Artificial Intelligence
  function ai(state) {
    // AI Visuals
    var occupied = evaluateBoardState(state);
    var opponent = state.user;
    var user_winning_moves = getWinningMoves(state, 'user');
    var computer_winning_moves = getWinningMoves(state, 'computer');
    
    
//    
//    console.log(state.user[0].substring(1) != state.user[1].substring(1));
//    console.log(state.user[0].substring(0,1) != state.user[1].substring(0,1));
    
    // First two moves set up a good position
    if (opponent.length == 1) {
      // Position
      position(state);
      console.log('position');
    } else if ($.inArray('bb', state.computer) > -1 && state.computer.length == 1 && state.user.length == 2 && corners.contains(state.user) && getOptions(corners, state.user).length == 2 && state.user[0].substring(1) != state.user[1].substring(1) && state.user[0].substring(0, 1) != state.user[1].substring(0, 1)) {
      // Check for diagonal play strategy and counter it
      var available_edges = getOptions(edges, occupied);
      var i = Math.floor(Math.random() * available_edges.length);
      move($('#' + available_edges[i]), computer, 'computer');
      console.log('diagonal counter');
    } else if (computer_winning_moves.length > 0) {
      // Offense
      // Offense needs to avoid already blocked corners and set traps and punish user for mistakes. (Pending...)
      
      // If you can, try to set up a corner trap
//      $.each(corner_traps, function (k, corner_trap) {
//        $.each(corner_trap.traps, function (kt, trap) {
//          
//        });
//      });
      move($('#' + computer_winning_moves[0]), computer, 'computer');
      console.log('offense');
    } else if (user_winning_moves.length > 0) {
      // Defense
      move($('#' + user_winning_moves[0]), computer, 'computer');
      console.log('defense');
    } else {
      position(state);
      console.log('position');
    }
    // Look at the board after making a move
    occupied = evaluateBoardState(state);
  }
  
  /*=====================================
    Load Defaults
  =====================================*/
  settings();
  
  /*=====================================
    Interactions
  =====================================*/
  
  $('input[name="character"]').change(function () {
    if ($(this).val() == 'x') {
      user = x;
      computer = o;
    } else {
      user = o;
      computer = x;
    }
  });
  
  $('input[name="first"]').change(function () {
    if (!$(this).is(':checked')) {
      first = 'computer';  
    } else {
      first = 'user';
    }
  });
  
  $('#edit-btn').click(function () {
    $('#display').addClass('hidden');
    $('#edit').removeClass('hidden');
  });
  
  $('#save-btn').click(function () {
    $('#display').removeClass('hidden');
    $('#edit').addClass('hidden');
    settings();
  });
  
  $('#stop-btn').click(function () {
    $('#pending-overlay').css({
      display: 'block'
    });
    $('#pre-game-actions').removeClass('hidden');
    $('#in-game-actions').addClass('hidden');
    $('.board-col').html('');
    clearData();
  });
  
  $('#reset-btn').click(function () {
    $('.board-col').html('');
    clearData();
    if (first == 'computer') {
      position(boardState);
    }
  });
  
  $('#restart-btn').click(function () {
    $('.board-col').html('');
    clearData();
    if (first == 'computer') {
      position(boardState);
    }
    $('#results').css({
      display: 'none'
    });
  });
  
  $('#start-btn').click(function () {
    $('#pending-overlay').css({
      display: 'none'
    });
    $('#pre-game-actions').addClass('hidden');
    $('#in-game-actions').removeClass('hidden');
    
    if (first == 'computer') {
      position(boardState);
    }
    
  });
  
  // The User's click action triggers a series of functions
  
  $('.board-col').click(function () {
    if (isAvailable($(this))) {
      move($(this), user, 'user');
      ai(boardState);
      checkGameOver(boardState);
    }
  });
  
});
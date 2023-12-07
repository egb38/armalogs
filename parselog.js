/*
# Licensed to the egb38 under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  egb38 licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   https://github.com/egb38/armalogs/blob/main/LICENSE
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
*/

// parse CSV log file
function parseAndSummarizeCSV(csv) {
  var _armada_analysis = null;
  var delim = ',';
  if (csv.search('\t')!=-1) {
    delim = '\t';
  }

  Papa.parse(csv, 
    {
      complete: function(results) {
        _armada_analysis = doProcess(results); 
      },
      delimiter: delim
    }
  );
  return _armada_analysis;
}

function doProcess(results) {
  var analysis = {};

  // -- TODO Need logs from station attacks & assaults
  
  // find battle rounds details
  var first = 0;
  for (var i=0; 1<results.data.length && results.data[i][0]!=1; i++){ first = i+1;}
  var rounds_details;
  if (first==0) {
    // no battle - ie. attacking an open base station
    // would need to handle this... at some point
    return null;
  } else {
    rounds_details = results.data.slice(first);
  }

  let {battle_type, opponent_type, opponent_row, opponent} = getBattleTypeAndOpponentType(results.data);

  let { players, ships, players_ship, opponent_ship, alliance, opponent_alliance } 
          = gatherBattleParticipantDetails(rounds_details, opponent, battle_type);
  // adjust battle_type
  if (players.length==1 && players.length!=players_ship.length) {
    // caveat: will not work when attacking a solo armada with only 1 ship
    //         (or 2 identical ships maybe???)
    battle_type = "solo_armada";
  }
  // TODO adjust opponent type for ship battles

  // TODO expand with player / ships details
  // unused at the moment
  //analysis.players = {"player": players, "players_ship": players_ship };

  var detailed_data_headers = [];
  // build summary table headers
  var headers = [];
  headers.push({"label":"", "rowspan":1, "colspan":4});
  headers.push({"label":getI18nContent('attack'), "rowspan":1, "colspan":8});
  headers.push({"label":getI18nContent('defense'), "rowspan":1, "colspan":8});
  detailed_data_headers.push(headers);

  // build detailed data table headers
  headers = [];
  headers.push({"label":(battle_type=="solo_armada" || battle_type=="ship")?getI18nContent('ships'):getI18nContent('player'), "rowspan":1, "colspan":1}); // player
  headers.push({"label":getI18nContent('Rounds'), "rowspan":1, "colspan":1}); // # rounds
  headers.push({"label":getI18nContent('loaded-weapon-100'), "rowspan":1, "colspan":1}); // weapons charged 100%
  headers.push({"label":getI18nContent('loaded-weapon-50'), "rowspan":1, "colspan":1}); // weapons charged 50%
  // attack
  headers.push({"label":getI18nContent('attacks'), "rowspan":1, "colspan":1}); // # attacks
  headers.push({"label":getI18nContent('critical-hits'), "rowspan":1, "colspan":1}); // # critical hits
  headers.push({"label":results.data[first-1][16], "rowspan":1, "colspan":1}); // total damages
  headers.push({"label":results.data[first-1][14], "rowspan":1, "colspan":1}); // attenuated damages
  headers.push({"label":results.data[first-1][13], "rowspan":1, "colspan":1}); // shield damages
  headers.push({"label":results.data[first-1][12], "rowspan":1, "colspan":1}); // hull damages
  headers.push({"label":results.data[first-1][17], "rowspan":1, "colspan":1}); // isolytic damages
  headers.push({"label":results.data[first-1][15], "rowspan":1, "colspan":1}); // suppressed isolytic damages
  //defense
  headers.push({"label":getI18nContent('attacks-received'), "rowspan":1, "colspan":1});
  headers.push({"label":getI18nContent('critical-hits'), "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][16], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][14], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][13], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][12], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][17], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][15], "rowspan":1, "colspan":1});

  detailed_data_headers.push(headers);

  // player by player battle data gathering
  var player_detailed_data = [];
  players_ship.forEach((p, idx) => {
    if (battle_type=="solo_armada") {
      // aggregate on ship, display ship
      player_detailed_data.push(playerData(rounds_details, ships[idx], ships[idx], battle_type));
    } else if (battle_type=="ship") {
      // aggregate on player, display ship
      player_detailed_data.push(playerData(rounds_details, players[idx], ships[idx], battle_type));
    } else {
      // aggregate player ship, display player+ship
      player_detailed_data.push(playerData(rounds_details, players[idx], players_ship[idx], battle_type));
    }
  })

  // opponnent battle data gathering
  var opponent_detailed_data = playerData(rounds_details, opponent, opponent_ship, battle_type)
  
  // what to show in the "vs" header
  if (battle_type=="group_armada") { // probably need to add assault?
    analysis.who = "[" + alliance + "]";
  } else {
    analysis.who = "[" + alliance + "] " + players[0];
  }
  if (opponent_alliance!=undefined) {
    analysis.against = { "opponent": "[" + opponent_alliance + "] " + opponent, "level": results.data[opponent_row][1]}; 
  } else {
    analysis.against = { "opponent": opponent, "level": results.data[opponent_row][1]}; 
  }

  // battle summary
  analysis.result = {};
  // checking the result of the opponent
  // opponent defeat == victory for the player
  // (for group armada, there is a result only for the opponent)
  var isVictory = getStringAllLocales('defeat').includes(results.data[opponent_row][2]); 
  analysis.result.outcome = isVictory?'outcome-v':'outcome-d';
  // getting the number of rounds
  var done = false;
  for (var i = results.data.length-1; !done; i--) {
    if (results.data[i][0] !== '') {
      analysis.result.rounds = results.data[i][0];
      done = true;
    }
  }

  // final assembly
  _armada_analysis = { 
    "battle_type": battle_type,
    "intro": analysis, 
    "details": {
      "headers":detailed_data_headers, 
      "data":player_detailed_data, 
      "armada": opponent_detailed_data
    }
  };      

  return _armada_analysis;
}

function getBattleTypeAndOpponentType(results_data) {
  // determine battle type and get opponnent details
  var battle_type;
  var opponent_type;
  var opponent_row = 1;
  if (results_data[2][0]!="") {
    // against ship / station
    //   row idx=1 is about the player 
    //   row idx=2 is about the ship / station
    opponent_row = 2;
    if (results_data[2][4]=="--") {
      battle_type = "station"
      opponent_type = "player"
    } else {
      battle_type = "ship"
      // TODO need to determine the opponent type - no good way to do it (me think)
      // if opponent name is ""--" then it is probably an hostile/engine and not a player
    }
  } else {
    // other types (group armada, solo armada, assault...) are determined later
    battle_type = "group_armada"
    opponent_type = "engine"
  }

  // oponent details
  var opponent = results_data[opponent_row][0]=="--"?results_data[opponent_row][3]:results_data[opponent_row][0];

  return { battle_type, opponent_type, opponent_row, opponent}
}

function gatherBattleParticipantDetails(rounds_details, opponent, battle_type) {
  // build players/ships lists
  var players = []; // to be used for group armada
  var ships = []; // to be used for solo armada, ship, station
  var players_ship = []; // display name
  var opponent_ship = '';
  var alliance = null;

  for (var i=0; rounds_details[i][0]==1; i++) {
    var theplayer = rounds_details[i][3];
    var theship = rounds_details[i][5];

    if (!players.includes(theplayer) && theplayer != opponent) {
      players.push(theplayer);
      if (alliance==null) 
        alliance = rounds_details[i][4];
    }
    // store player+ship as well
    var p_s = theplayer + "\u000a" + theship;
    if (!players_ship.includes(p_s) 
            && theplayer != opponent
            // attempt to workaround the CSV file bug where the ship is a "defense platform"
            // see https://github.com/egb38/armalogs/issues/15#issuecomment-1684833831
            && !startsWithAnyLocal(theship, 'defenseplatform')
          ) {
      players_ship.push(p_s);
    }
    if (theplayer==opponent) {
      opponent_ship = theship;
    }
  }

  if (players.length==1 && players.length!=players_ship.length) {
    // caveat: will not work when attacking a solo armada with only 1 ship
    //         (or 2 identical ships maybe???)
    battle_type = "solo_armada";
  }
  if (battle_type=="solo_armada" || battle_type=="ship") {
    for (var i=0; rounds_details[i][0]==1; i++) {
      if (!ships.includes(rounds_details[i][5]) && rounds_details[i][3] != opponent) {
        ships.push(rounds_details[i][5]);
      }
    }
  }

  var opponent_alliance;
  if (battle_type=="ship" || battle_type=="station") {
    for (let i=0; i<rounds_details.length && opponent_alliance==undefined; i++) {
      if (rounds_details[i][3]==opponent) {
        opponent_alliance = rounds_details[i][4];
      }
    }
  }

  return { players, ships, players_ship, opponent_ship, alliance, opponent_alliance };
}

function playerData(details, p, display, battle_type) {
  var a = [];
  var i = 0;
  var checkAttackOn = (battle_type=="solo_armada")?5:3; // if solo armada, use the ship name to aggregate data instead of player name
  var checkDefenseOn = (battle_type=="solo_armada")?9:7; // if solo armada, use the ship name to aggregate data instead of player name
  a[i++] = display;
  a[i++] = maxVal(details, p, checkAttackOn, 0); // max round
  a[i++] = countVal(details, p, checkAttackOn, 24, "100"); // # weapon recharge 100%
  a[i++] = countVal(details, p, checkAttackOn, 24, "50"); // # weapon recharge 50%
  a[i++] = countVals(details, p, checkAttackOn, 2, getStringAllLocales('attack')); // # attacks
  a[i++] = countVals(details, p, checkAttackOn, 11, getStringAllLocales('yes')); // # critical attacks
  a[i++] = sumVal(details, p, checkAttackOn, 16); // # total damages given
  a[i++] = sumVal(details, p, checkAttackOn, 14); // # attenuated damages
  a[i++] = sumVal(details, p, checkAttackOn, 13); // # shield damage
  a[i++] = sumVal(details, p, checkAttackOn, 12); // # hull damage
  a[i++] = sumVal(details, p, checkAttackOn, 17); // # total iso damages
  a[i++] = sumVal(details, p, checkAttackOn, 15); // # iso damages suppressed
  a[i++] = countVals(details, p, checkDefenseOn, 2, getStringAllLocales('attack')); // # attacks received
  a[i++] = countVals(details, p, checkDefenseOn, 11, getStringAllLocales('yes')); // # critical attacks received
  a[i++] = sumVal(details, p, checkDefenseOn, 16); // # total damages received
  a[i++] = sumVal(details, p, checkDefenseOn, 14); // # attenuated damages
  a[i++] = sumVal(details, p, checkDefenseOn, 13); // # shield damage
  a[i++] = sumVal(details, p, checkDefenseOn, 12); // # hull damage
  a[i++] = sumVal(details, p, checkDefenseOn, 17); // # total iso damages
  a[i++] = sumVal(details, p, checkDefenseOn, 15); // # iso damages suppressed
  
  return a;
}

// sum a column if matched
function sumVal(data, key, key_col_idx, data_col_idx) {
  var sum = 0;
  data.filter(row => row[key_col_idx] == key)
      .filter(row => row[data_col_idx] != "--")
      .forEach(row => sum += Number(row[data_col_idx]));
  return scaled(sum);
}

// numbers formatting
function scaled(n) {
  return Intl.NumberFormat("en-US", {notation: "compact"}).format(n);
}

function countVals(data, key, key_col_idx, data_col_idx, vals) {
  return data.filter(row => row[key_col_idx] == key)
      .filter(row => vals.includes(row[data_col_idx])).length;
}

function countVal(data, key, key_col_idx, data_col_idx, val) {
  return data.filter(row => row[key_col_idx] == key)
      .filter(row => row[data_col_idx] == val).length;
}

function maxVal(data, key, key_col_idx, data_col_idx) {
  var max = -1;
  data.filter(row => row[key_col_idx] == key)
      .forEach( row => {
        row[data_col_idx]> max;
        max = row[data_col_idx];
      });
  return max;
}

function startsWithAnyLocal(aString, lngResource) {
  resources = getStringAllLocales(lngResource);
  for (let i=0; i<resources.length; i++) {
    if (aString.startsWith(resources[i])) {
      return true;
    }
  }
  return false;
}

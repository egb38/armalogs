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

  // if row 4 is empty, then ennemy = row 3 & ship
  // if row 3 is empty, then ennemy = row 2 & aramada
  // if aramada & #players==1 & rounds described by ship then solo aramada
// -- Need logs from station attack & assault
  
  var _armada_analysis = null;
  var solo_armada = false;
  var armada = false;
  var ship = false;
  var analysis = {};

  var armada_row = 1;
  if (results.data[2][0]!="") {
    // against ship
    // in that case row idx=1 is about the player 
    // and row idx=2 is about the ship / armada
    armada_row = 2;
    ship = true;
  } else {
    armada = true;
  }

  // oponent
  var opponent = results.data[armada_row][0];
  analysis.against = { "opponent": opponent, "level": results.data[armada_row][1]}; 
  
  // first row with rounds details
  var first = 0;
  for (var i=0; results.data[i][0]!=1; i++){ first = i+1;}
  var rounds_details = results.data.slice(first);

  // players/ships list
  var players = []; // to be used for group armada
  var ships = []; // to be used for solo armada
  var players_ship = []; // display name
  var alliance = null;

  for (var i=0; rounds_details[i][0]==1; i++) {
    // list player names
    var new_player = false;

    var theplayer = rounds_details[i][3];
    var theship = rounds_details[i][5];

    if (!players.includes(theplayer) && theplayer != opponent) {
      players.push(theplayer);
      new_player = true;
      if (alliance==null) alliance = rounds_details[i][4];
    }
    // store player+ship as well
    var p_s = theplayer + "\u000a" + theship;
    if (!players_ship.includes(p_s) && theplayer != opponent
            // attempt to workaround the CSV file bug where the ship is a "defense platform"
            // see https://github.com/egb38/armalogs/issues/15#issuecomment-1684833831
            && !theship.startsWith(getI18nContent('defenseplatform'))
          ) {
      players_ship.push(p_s);
    }
  }
  if (players.length==1 && players.length!=players_ship.length) {
    solo_armada = true;
    for (var i=0; rounds_details[i][0]==1; i++) {
      if (!ships.includes(theship) && theplayer != opponent) {
        ships.push(theship);
      }
    }
  } else {
    solo_armada = false;
  }
  analysis.players = {"player": players, "players_ship": players_ship };

  var detailed_data_headers = [];
  // headers
  var headers = [];
  headers.push({"label":"", "rowspan":1, "colspan":4});
  headers.push({"label":getI18nContent('attack'), "rowspan":1, "colspan":7});
  headers.push({"label":getI18nContent('defense'), "rowspan":1, "colspan":7});
  detailed_data_headers.push(headers);


  headers = [];
  headers.push({"label":solo_armada?getI18nContent('ship'):getI18nContent('player'), "rowspan":1, "colspan":1}); // player
  headers.push({"label":getI18nContent('Rounds'), "rowspan":1, "colspan":1}); // # rounds
  headers.push({"label":getI18nContent('loaded-weapon-100'), "rowspan":1, "colspan":1}); // weapons charged 100%
  headers.push({"label":getI18nContent('loaded-weapon-50'), "rowspan":1, "colspan":1}); // weapons charged 50%
  // attack
  headers.push({"label":getI18nContent('attacks'), "rowspan":1, "colspan":1}); // # attacks
  headers.push({"label":getI18nContent('critical-hits'), "rowspan":1, "colspan":1}); // # critical hits
  headers.push({"label":results.data[first-1][16], "rowspan":1, "colspan":1}); // total damages
  headers.push({"label":results.data[first-1][14], "rowspan":1, "colspan":1}); // attenuated damages
  headers.push({"label":results.data[first-1][15], "rowspan":1, "colspan":1}); // suppressed isolytic damages
  headers.push({"label":results.data[first-1][13], "rowspan":1, "colspan":1}); // shield damages
  headers.push({"label":results.data[first-1][12], "rowspan":1, "colspan":1}); // hull damages
  //defense
  headers.push({"label":getI18nContent('attacks-received'), "rowspan":1, "colspan":1});
  headers.push({"label":getI18nContent('critical-hits'), "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][16], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][14], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][15], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][13], "rowspan":1, "colspan":1});
  headers.push({"label":results.data[first-1][12], "rowspan":1, "colspan":1});

  detailed_data_headers.push(headers);

  // player by player analysis
  var detailed_data = [];
  players_ship.forEach((p, idx) => {
    if (solo_armada) {
      detailed_data.push(playerData(rounds_details, ships[idx], "", true));
    } else {
      detailed_data.push(playerData(rounds_details, players[idx], players_ship[idx], false));
    }
  })

  if (solo_armada) {
    analysis.who = players[0];
  } else {
    analysis.who = alliance;
  }      
  // battle summary
  analysis.result = {};
  // checking the result of the opponent
  // defeat == victory for the player
  var isVictory = getStringAllLocales('defeat').includes(results.data[armada_row][2]); 
  analysis.result.outcome = isVictory?'outcome-v':'outcome-d';
  var done = false;
  for (var i = results.data.length-1; !done; i--) {
    if (results.data[i][0] !== '') {
      analysis.result.rounds = results.data[i][0];
      done = true;
    }
  }

  _armada_analysis = { 
    "solo_armada": solo_armada,
    "intro": analysis, 
    "details": {
      "headers":detailed_data_headers, 
      "data":detailed_data, 
      "armada": playerData(rounds_details, opponent, opponent, solo_armada)
    }
  };      

  return _armada_analysis;
}

function playerData(details, p, vsx, isSolo) {
  var a = [];
  var i = 0;
  var checkAttackOn = isSolo?5:3; // if solo armada, use the ship name to aggregate data instead of player name
  var checkDefenseOn = isSolo?9:7; // if solo armada, use the ship name to aggregate data instead of player name
  a[i++] = isSolo?p:vsx;
  a[i++] = maxVal(details, p, checkAttackOn, 0); // max round
  a[i++] = countVal(details, p, checkAttackOn, 24, "100"); // # weapon recharge 100%
  a[i++] = countVal(details, p, checkAttackOn, 24, "50"); // # weapon recharge 50%
  a[i++] = countVals(details, p, checkAttackOn, 2, getStringAllLocales('attack')); // # attacks
  a[i++] = countVals(details, p, checkAttackOn, 11, getStringAllLocales('yes')); // # critical attacks
  a[i++] = sumVal(details, p, checkAttackOn, 16); // # total damages given
  a[i++] = sumVal(details, p, checkAttackOn, 14); // # attenuated damages
  a[i++] = sumVal(details, p, checkAttackOn, 15); // # iso damages
  a[i++] = sumVal(details, p, checkAttackOn, 13); // # shield damage
  a[i++] = sumVal(details, p, checkAttackOn, 12); // # hull damage
  a[i++] = countVals(details, p, checkDefenseOn, 2, getStringAllLocales('attack')); // # attacks received
  a[i++] = countVals(details, p, checkDefenseOn, 11, getStringAllLocales('yes')); // # critical attacks received
  a[i++] = sumVal(details, p, checkDefenseOn, 16); // # total damages received
  a[i++] = sumVal(details, p, checkDefenseOn, 14); // # attenuated damages
  a[i++] = sumVal(details, p, checkDefenseOn, 15); // # iso damages suppressed
  a[i++] = sumVal(details, p, checkDefenseOn, 13); // # shield damage
  a[i++] = sumVal(details, p, checkDefenseOn, 12); // # hull damage
  
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

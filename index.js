var input;
var logs;
var divLogs;
var csvContent = null;
var list = null;
var armada_analysis = null;

var analysis = {};

// on load handler
window.onload = function() {
  input = document.querySelector("input");
  divLogs = document.querySelector(".logs");
  
  input.addEventListener("change", armadaLogAnalysis);    
}

function onException (ex) { 
  var err = document.createElement('pre');
  var errMsg = document.createElement('div');
  var errorBox = document.querySelector(".errorBox");

  err.textContent = ex.stack;
  errMsg.textContent = "Something went wrong!";

  errorBox.appendChild(errMsg);
  errorBox.appendChild(err);
  err.style.display = 'block';
  errMsg.style.display = 'block';
  errorBox.style.display = 'block';
}

// main entry point, on file selected
function armadaLogAnalysis() {
  try {
    // load file in memory
    var csvFile = loadCSV();
    if (csvFile!==null) {
      // main process
      var data = readCSV(csvFile);
    }
  } catch(e) {
   onException(e); 
  }
}

// display processed data
function displayData(summary, data) {
  var divLog = document.createElement('div');
  divLog.setAttribute('class', 'armada-battle');
  // summary
  divLog.appendChild(createSummary(summary));
  // main content
  divLog.appendChild(createTable(data));

  divLogs.appendChild(divLog);
}

// summary display generation
// TODO proper/more extensive I18N
function createSummary(summary) {
  var summaryTable = document.createElement('table');
  if (summary.result.outcome == "DÉFAITE" || summary.result.outcome == "DEFEAT") {
    summaryTable.setAttribute('class', 'blueTable'); 
    summary.result.outcome = "Victoire"
  } else {
    summaryTable.setAttribute('class', 'redTable'); 
    summary.result.outcome = "Défaite"
  }
  var tableBody = document.createElement('tbody');
  var row = document.createElement('tr');
  var cell = document.createElement('th');
  cell.textContent = "Bataille contre: ";
  row.appendChild(cell);
  cell = document.createElement('th');
  cell.textContent = summary.against.opponent + ", niveau: " + summary.against.level;
  row.appendChild(cell);
  summaryTable.appendChild(row);
  row = document.createElement('tr')
  cell = document.createElement('th');
  cell.textContent = "Résultat: ";
  row.appendChild(cell);
  cell = document.createElement('th');
  cell.textContent = summary.result.outcome;
  row.appendChild(cell);
  summaryTable.appendChild(row);
  return summaryTable;
}

// analyzed log display generation
function createTable(tableData) {
  var table = document.createElement('table');
  table.setAttribute('class', 'armada-battle-log')
  var tableHeader = document.createElement('thead');
  var tableBody = document.createElement('tbody');
  var tableFooter = document.createElement('tfoot');

  // headers
  tableData.headers.forEach(function(rowData) {
    var row = document.createElement('tr');

    rowData.forEach(function(cellData) {
      var cell = document.createElement('th');
      cell.setAttribute('rowspan', cellData.rowspan)
      cell.setAttribute('colspan', cellData.colspan)
      cell.appendChild(document.createTextNode(cellData.label));
      row.appendChild(cell);
    });

    tableHeader.appendChild(row);
  });

  // body
  tableData.data.forEach(function(rowData) {
    var row = document.createElement('tr');

    rowData.forEach(function(cellData) {
      var cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      cell.setAttribute("style", "white-space: pre;")
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  // armada / footer
  var row = document.createElement('tr');
  tableData.armada.forEach(function(cellData) {
    var cell = document.createElement('td');
    cell.appendChild(document.createTextNode(cellData));
    row.appendChild(cell);
  });
  tableFooter.appendChild(row);

  table.appendChild(tableHeader);
  table.appendChild(tableBody);
  table.appendChild(tableFooter);
  return table;
}

// parse CSV log file
function parseCSV(csv) {
  var delim = ',';
  if (csv.search('\t')!=-1) {
    delim = '\t';
  }

  Papa.parse(csv, 
    {
      complete: function(results) {
        doParse(results); 
      },
      delimiter: delim
    }
  );
}

function doParse(results) {
      // oponent
      var opponent = results.data[1][0];
      analysis.against = { "opponent": opponent, "level": results.data[1][1]}; 
      
      // battle summary
      analysis.result = {};
      analysis.result.outcome = results.data[1][2];
      var done = false;
      for (var i = results.data.length-1; !done; i--) {
        if (results.data[i][0] !== '') {
          analysis.result.rounds = results.data[i][0];
          done = true;
        }
      }

      // first row with rounds details
      var first = 0;
      for (var i=0; results.data[i][0]!=1; i++){ first = i+1;}
      var details = results.data.slice(first);

      // players list
      var players = [];
      var players_ship = [];
      for (var i=0; details[i][0]==1; i++) {
        if (!players.includes(details[i][3]) && details[i][3] != opponent) {
          if (details[i][3] != details[1][0]){
            players.push(details[i][3]);
            players_ship.push(details[i][5]);
          }
        }
      }
      analysis.players = players;

      var detailed_data_headers = [];
      // headers
      var headers = [];
      headers.push({"label":"", "rowspan":1, "colspan":4});
      headers.push({"label":"Attaque", "rowspan":1, "colspan":7});
      headers.push({"label":"Defense", "rowspan":1, "colspan":7});
      detailed_data_headers.push(headers);


      headers = [];
      headers.push({"label":"Player", "rowspan":1, "colspan":1}); // player
      headers.push({"label":results.data[first-1][0], "rowspan":1, "colspan":1}); // # rounds
      headers.push({"label":results.data[first-1][24] + " 100", "rowspan":1, "colspan":1}); // weapons charged 100%
      headers.push({"label":results.data[first-1][24] + " 50", "rowspan":1, "colspan":1}); // weapons charged 50%
      // attack
      headers.push({"label":"Attaques", "rowspan":1, "colspan":1}); // # attacks
      headers.push({"label":"Coups critiques", "rowspan":1, "colspan":1}); // # critical hits
      headers.push({"label":results.data[first-1][16], "rowspan":1, "colspan":1}); // total damages
      headers.push({"label":results.data[first-1][14], "rowspan":1, "colspan":1}); // attenuated damages
      headers.push({"label":results.data[first-1][15], "rowspan":1, "colspan":1}); // suppressed isolytic damages
      headers.push({"label":results.data[first-1][13], "rowspan":1, "colspan":1}); // shield damages
      headers.push({"label":results.data[first-1][12], "rowspan":1, "colspan":1}); // hull damages
      //defense
      headers.push({"label":"Attaques reçues", "rowspan":1, "colspan":1});
      headers.push({"label":"Coups critiques", "rowspan":1, "colspan":1});
      headers.push({"label":results.data[first-1][16], "rowspan":1, "colspan":1});
      headers.push({"label":results.data[first-1][14], "rowspan":1, "colspan":1});
      headers.push({"label":results.data[first-1][15], "rowspan":1, "colspan":1});
      headers.push({"label":results.data[first-1][13], "rowspan":1, "colspan":1});
      headers.push({"label":results.data[first-1][12], "rowspan":1, "colspan":1});

      detailed_data_headers.push(headers);

      // player by player analysis
      var detailed_data = [];
      players.forEach((p, idx) => {
        detailed_data.push(playerData(details, p, "\u000a" + players_ship[idx]));
      })
      armada_analysis = { "intro": analysis, "details": {"headers":detailed_data_headers, "data":detailed_data, "armada": playerData(details, opponent, "")}};
}

function playerData(details, p, vsx) {
  var a = [];
  var i = 0;
  a[i++] = p + vsx;
  a[i++] = maxVal(details, p, 3, 0); // max round
  a[i++] = countVal(details, p, 3, 24, "100"); // # weapon recharge 100%
  a[i++] = countVal(details, p, 3, 24, "50"); // # weapon recharge 50%
  a[i++] = countVals(details, p, 3, 2, ["Attaque"]); // # attacks
  a[i++] = countVals(details, p, 3, 11, ["YES", "OUI"]); // # critical attacks
  a[i++] = sumVal(details, p, 3, 16); // # total damages given
  a[i++] = sumVal(details, p, 3, 14); // # attenuated damages
  a[i++] = sumVal(details, p, 3, 15); // # iso damages
  a[i++] = sumVal(details, p, 3, 13); // # shield damage
  a[i++] = sumVal(details, p, 3, 12); // # hull damage
  a[i++] = countVals(details, p, 7, 2, ["Attaque"]); // # attacks received
  a[i++] = countVals(details, p, 7, 11, ["YES", "OUI"]); // # critical attacks received
  a[i++] = sumVal(details, p, 7, 16); // # total damages received
  a[i++] = sumVal(details, p, 7, 14); // # attenuated damages
  a[i++] = sumVal(details, p, 7, 15); // # iso damages suppressed
  a[i++] = sumVal(details, p, 7, 13); // # shield damage
  a[i++] = sumVal(details, p, 7, 12); // # hull damage
  
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

// read file into memory and start the main processing
// (parsing and display)
function readCSV(file) {
  var read = false;
  var data = null;
  if (file) {
    var reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        data = reader.result;
        parseCSV(data);
        displayData(armada_analysis.intro, armada_analysis.details);
      },
      false
    );

    reader.readAsText(file, "UTF-8");
  }
}

// load file content in memory
function loadCSV() {
  const curFiles = input.files;
  if (curFiles.length === 0) {
    return null;
  } else {

    for (const file of curFiles) {
      if (file.type === 'text/csv') {
        var content = `File name ${file.name}, file size ${returnFileSize(
          file.size
        )}. reading content...`;
        return file
      } else {
        return null;
      }
    }
    return null;
  }
}    

function returnFileSize(number) {
  if (number < 1024) {
    return `${number} bytes`;
  } else if (number >= 1024 && number < 1048576) {
    return `${(number / 1024).toFixed(1)} KB`;
  } else if (number >= 1048576) {
    return `${(number / 1048576).toFixed(1)} MB`;
  }
}

// display processed data
function displayData(divLogs, summary, data, solo_armada) {
  var divLog = document.createElement('div');
  divLog.setAttribute('class', 'armada-battle');
  // title
  var divtitle = document.createElement('div');
  divtitle.textContent = solo_armada?getI18nContent('solo-armada'):getI18nContent('group-armada');
  divtitle.setAttribute('class', 'armada-title'); 
  divLog.appendChild(divtitle);
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
  if (summary.result.outcome == 'outcome-v') {
    summaryTable.setAttribute('class', 'blueTable'); 
  } else {
    summaryTable.setAttribute('class', 'redTable'); 
  }
  var tableBody = document.createElement('tbody');
  var row = document.createElement('tr');
  var cell = document.createElement('th');
  cell.textContent = getI18nContent("battle");
  row.appendChild(cell);
  cell = document.createElement('th');
  cell.textContent = summary.who + " vs " + summary.against.opponent + ", " + getI18nContent('level') + " " + summary.against.level;
  row.appendChild(cell);
  summaryTable.appendChild(row);
  row = document.createElement('tr')
  cell = document.createElement('th');
  cell.textContent = getI18nContent("result");
  row.appendChild(cell);
  cell = document.createElement('th');
  cell.textContent = getI18nContent(summary.result.outcome) + " " + getI18nContent('in') + " " + summary.result.rounds + " " + getI18nContent('rounds');
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
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

// display processed data
function displayData(tagID, summary, data, battle_type) {
  let divLog = document.createElement('div');
  divLog.setAttribute('class', 'armada-battle');
  // title
  let divtitle = document.createElement('div');
  divtitle.textContent = getI18nContent(battle_type);
  divtitle.setAttribute('class', 'armada-title'); 
  divLog.appendChild(divtitle);
  // summary
  divLog.appendChild(createSummary(summary));
  // main content
  divLog.appendChild(createTable(data));

  let divLogs = document.querySelector(tagID);
  divLogs.insertBefore(divLog, divLogs.firstChild);
}

// summary display generation
// TODO more extensive I18N
function createSummary(summary) {
  let summaryTable = document.createElement('table');
  if (summary.result.outcome == 'outcome-v') {
    summaryTable.setAttribute('class', 'blueTable'); 
  } else {
    summaryTable.setAttribute('class', 'redTable'); 
  }
  let row = document.createElement('tr');
  let cell = document.createElement('th');
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
  let table = document.createElement('table');
  table.setAttribute('class', 'armada-battle-log')
  let tableHeader = document.createElement('thead');
  let tableBody = document.createElement('tbody');
  let tableFooter = document.createElement('tfoot');

  // headers
  tableData.headers.forEach(function(rowData) {
    let row = document.createElement('tr');

    rowData.forEach(function(cellData) {
      let cell = document.createElement('th');
      cell.setAttribute('rowspan', cellData.rowspan)
      cell.setAttribute('colspan', cellData.colspan)
      cell.appendChild(document.createTextNode(cellData.label));
      row.appendChild(cell);
    });

    tableHeader.appendChild(row);
  });

  // body
  tableData.data.forEach(function(rowData) {
    let row = document.createElement('tr');

    rowData.forEach(function(cellData) {
      let cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      cell.setAttribute("style", "white-space: pre;")
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  // armada / footer
  let row = document.createElement('tr');
  tableData.armada.forEach(function(cellData) {
    let cell = document.createElement('td');
    cell.appendChild(document.createTextNode(cellData));
    row.appendChild(cell);
  });
  tableFooter.appendChild(row);

  table.appendChild(tableHeader);
  table.appendChild(tableBody);
  table.appendChild(tableFooter);
  return table;
}
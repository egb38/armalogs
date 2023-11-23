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

var input;
//var divLogs;

// when DOM ready define hte main handler
window.onload = function() {
  input = document.querySelector("input");
  //divLogs = document.querySelector(".logs");
  
  input.addEventListener("change", armadaLogAnalysis);    
}

// general try/catch, display error message
function onException (ex) { 
  let err = document.createElement('pre');
  let errMsg = document.createElement('div');
  let errorBox = document.querySelector("#errorBox");

  err.textContent = ex.stack;
  errMsg.textContent = "Something went wrong!";

  errorBox.appendChild(errMsg);
  errorBox.appendChild(err);
  err.style.display = 'block';
  errMsg.style.display = 'block';
  errorBox.style.display = 'block';
}

// main entry point: on file selected
async function armadaLogAnalysis() {
  try {
    // load file in memory
    let data = await loadCSV();
    if (data!==null) {
      // main process
      let armada_analysis = parseAndSummarizeCSV(data);
      displayData("#logs", armada_analysis.intro, armada_analysis.details, armada_analysis.battle_type);  
    }
  } catch(e) {
   onException(e); 
  }
}

// load file content in memory
async function loadCSV() {
  const curFiles = input.files;
  if (curFiles.length === 0) {
    return null;
  } else {
    // TODO expecting 1 and only 1 file
    for (const file of curFiles) {
      if (file.type === 'text/csv') {
        // read/load the data
        let result= await new Promise((resolve) => {
          let fileReader = new FileReader();
          fileReader.onload = (e) => resolve(fileReader.result);
          fileReader.readAsText(file);
        });
        return result;
      } else {
        return null;
      }
    }
    return null;
  }
}    

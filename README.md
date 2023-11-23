# armalogs
Star Treck Fleet Command armada battle log visualizer.

![alt text](https://github.com/egb38/armalogs/blob/main/armalogs-2.png?raw=true)


Try it here: https://egb38.github.io/armalogs/

## Limitations
* armalogs localization partially log file content, this could be done in a more extensive way
* it & de localizations are incomplete
* not tested via base station attack logs & stellar station assault logs
* there are some bugs in Scopely CSV file generation (see open issues)
* (also the CSV is a pain to work with, the format is all but usable, i would consider it as broken)

## Todo
* see limitations above
* add details on ships/officer abilities
* add some nav capabilities when several logs have been uploaded
* add support for station battle logs, assaults, ...
* ...

## Changes
### next
* Better support of ship vs ship battle logs
* some code refactoring to make reading it easier (looong way to go)
* latest uploaded log inserted at the top of the screen

### 20203/10/28
* Workaround for the broken CSV log ("Defense Platform")
* Support for the newer column for total isolytics damages

### 20203/07/30
* small i18n enhancements
* bare minimum support for it and de

### 20203/07/23
* fix for group armada logs with a single attacker

### 20203/07/23
* i18n support
  * en, fr only (happy to accept contributions). 
  * Limitations: 
    * does not translate dyncamically generated content on locale change.
    * some headers in the visualization are coming from the log file, some others are coming fromthe selected locale

### 20203/07/22
* added solo armadas support
* minor changes to battle summary

### 20203/07/14
* support for tsv logs
* display js errors
* added link to github repo

### 2023/07/13
initial version

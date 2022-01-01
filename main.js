var myslider = document.getElementById("slider");
var output = document.getElementById("value");
var button = document.getElementById("submit")
var unit = ''
var notation = 'american'
var min = Math.log10(1)
var max = Math.log10(10)
var step = 1
var truth = 5
var truth_log = Math.log10(truth)
var do_exp = true
var abbr = true
const ls = window.localStorage
const red = [252, 3, 3]
const green = [3, 252, 24]

addUnitBefore = function(input){  return unit + ' ' + input }
addUnitAfter = function(input){  return input + ' ' + unit }

var addUnitFn = addUnitAfter;

humanReadable = function(input){
  // TODO: dictionaries instead of lists. allow non-3 multiples as well.
  if (notation == 'american') { 
    if (abbr) { suffixes = ['K', 'M', 'B', 'T', 'Qua', 'Qui', 'S'] }
    else { suffixes = ['thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion'] }
  }
  else if (notation == 'sci') { 
    if (abbr) { suffixes = ['e3', 'e6', 'e9', 'e12', 'e15', 'e18'] }
    else { suffixes = ['x10^3', 'x10^6', 'x10^9', 'x10^12', 'x10^15', 'x10^18'] }
  }
  else if (notation == 'year') {return Number(input).toString()}
  else if (notation == 'metric') {
    if (abbr) { suffixes = ['K', 'M', 'G', 'T', 'P', 'E', 'Z'] }
    else { suffixes = ['kilo', 'mega', 'giga', 'terra', 'peta', 'exa', 'zeta'] }
  }

  if (Math.floor(input/Math.pow(10, 12)) > 0) {
    return Number.parseFloat(input/Math.pow(10, 12)).toFixed(2).toString() + suffixes[3]
  }
  else if (Math.floor(input/Math.pow(10, 9)) > 0) {
    return Number.parseFloat(input/Math.pow(10, 9)).toFixed(2).toString() + suffixes[2]
  }
  else if (Math.floor(input/Math.pow(10, 6)) > 0) {
    return Number.parseFloat(input/Math.pow(10, 6)).toFixed(2).toString() + suffixes[1]
  }
  else if (Math.floor(input/Math.pow(10, 3)) > 0) {
    return Number.parseFloat(input/Math.pow(10, 3)).toFixed(2).toString() + suffixes[0]
  }
  else { return input.toString() }
}

getValue = function(temp, do_exp_local=do_exp){
  if (do_exp_local) {temp = Math.pow(10, temp); temp = Number.parseFloat(temp).toFixed(2)}
  temp = humanReadable(temp)
  return addUnitFn(temp)
}

//localhost = 'http://0.0.0.0:8000/facts'
//localhost = 'http://localho.st:8000/facts'
localhost = 'https://avi-jit.github.io/ballpark/'
facts_dir = localhost+'dk/facts/'
revisions_dir = localhost+'revisions/'


function shuffleArray(array) {
  // https://stackoverflow.com/a/12646864
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

function pickHex(weight) {
  // https://stackoverflow.com/a/30144587
  var p = weight;
  var w = p * 2 - 1;
  var w1 = (w/1+1) / 2;
  var w2 = 1 - w1;
  var rgb = [Math.round(red[0] * w1 + green[0] * w2),
      Math.round(red[1] * w1 + green[1] * w2),
      Math.round(red[2] * w1 + green[2] * w2)];
  //return rgb;
  return "rgb("+rgb[0]+", " + rgb[1]+ ", " + rgb[2]+ ")" 
}

all_facts = []
$.get(localhost+'all_facts.txt', function(response, status){
  if (status == 'success'){
    all_facts = response.split("\n")
    console.log(all_facts)
  } else {console.log("all_facts could not be loaded")}
  shuffleArray(all_facts)
})

var defaults = {'notation': 'american', 'unit':'count', 'limits':[1,1e15]}
$.getJSON(localhost+'defaults.json', function(data) {
  for (const [key, value] of Object.entries(data)) {
    //console.log(key, value);
    defaults[key] = value
  }
})

facts = [
  // measure, attributes (+qualifiers), observation (+unit)
  ['Market Cap', 'Apple', 2_240_000_000_000],
  ['Market Cap', 'Google', 1_370_000_000_000],
]
var current = -1
read_history = false

function load(index) {
  fact = all_facts[index]
  console.log(fact)
  $.getJSON(facts_dir+fact, function(data) {
    console.log(data)

    // defaults
    relation = data['relation']//.toLowerCase()

    if ('unit' in data) {unit = data['unit']}
    else if (relation in defaults['relation-units']) {unit = defaults['relation-units'][relation] }
    else {unit = defaults['unit']}
    //unit = unit.toLowerCase()

    if ('notation' in data) {notation = data['notation']}
    else if (relation in defaults['relation-notations']) {notation = defaults['relation-notations'][relation] }
    else if (unit in defaults['unit-notations']) {notation = defaults['unit-notations'][unit] }
    else {notation = defaults['notation']}
    //notation = notation.toLowerCase()

    if ('limits' in data) {limits = data['limits']}
    else if (relation in defaults['relation-limits']) {limits = defaults['relation-limits'][relation] }
    else if (unit in defaults['unit-limits']) {limits = defaults['unit-limits'][unit] }
    else {limits = defaults['notation']}

    // change UI
    document.getElementById("prompt").innerHTML = relation + ' of ' + data['subject']
    //console.log(unit)
    if (unit == 'USD') {addUnitFn = addUnitBefore}
    else {addUnitFn = addUnitAfter}

    output.innerHTML = getValue(myslider.value, unit);
    //mean = data['slider']['mean']
    min = logize(Number(limits[0]));
    max = logize(Number(limits[1]));
    truth = data["value"]
    myslider.min = min;
    myslider.max = max;
    myslider.step = (max - min) / 1_000;
    myslider.val = (min + max) / 2
    output.innerHTML = getValue(myslider.val);
    document.getElementById("low").innerHTML = getValue(min);
    document.getElementById("high").innerHTML = getValue(max);
  });
}

logize = function(num) {
  if (num <= 0) { console.log("negative!") }
  else { return Math.log10(num)}
}

setWrongness = function() {
  guess_log = myslider.value
  if (guess_log >= truth_log) { wrongness = (max-guess_log)/(max-truth_log) }
  else { wrongness = (guess_log-min)/(truth_log-min) }
  wrongness = 1-wrongness
  output.style.color = pickHex(wrongness)
  //console.log('wrongness: '+wrongness)
}

button.onclick = function(){
  if (this.classList.contains("inactive")) {
    current += 1
    console.log(current)
    load(current)
    if (read_history) {
      // get past records
      pasts = []
      for ([key, value] of Object.entries(ls)) {
        if (key.startsWith('*')) {
          splits = key.substring(1).split('@')
          cur = splits[0]
          timestamp = splits[1]
          if (cur == current){
            console.log(`${key}: ${value}`);
            pasts.push(Number.parseFloat(value))
          }
        }
      }
    }
    this.innerHTML = "Submit"
    output.style.color = "black"
  }
  else {
    guess_log = slider.value
    guess = Math.pow(10, guess_log)
    //truth = facts[current][2]
    truth_log = Math.log10(truth)
    rmsle = truth_log - guess_log
    rmsle = Number.parseFloat(rmsle).toPrecision(2)
    console.log(Math.abs(rmsle))
    output.innerHTML = output.innerHTML + '; \tAns. ' + getValue(truth, do_exp_local=false)
    //ls.setitem(current, rmsle)
    timestamp = Date.now()
    ls.setItem( '*' + all_facts[current]+'@'+timestamp, guess)
    console.log( '*' + all_facts[current]+'@'+timestamp + ' : ' + guess)
    this.innerHTML = "Next"
    setWrongness()
  }
  this.classList.toggle("inactive")
}

// Update the current slider value (each time you drag the slider handle)
myslider.oninput = function() {
  //output.innerHTML = this.value;
  //console.log("oninput:"+this.value)
  
  if (button.classList.contains("inactive")) { 
    output.innerHTML = getValue(this.value)+ '; \tAns. ' + getValue(truth, do_exp_local=false)
    setWrongness(); 
  }
  else {output.innerHTML = getValue(this.value);}
}

// myslider.onchange = function() {
//   output.innerHTML = getValue(this.value);
//   //console.log("onchange:"+this.value)
// }

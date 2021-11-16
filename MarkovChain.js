//parse the text value and put each word in an array, keep in mind that punctuation signs are also considered words by this algorithm.
async function markovChain(text, wordsHistoryCount = 1) {
  const strToReplace = ",?!.- \n;:()[]";
  let processedString = text;
  for(let i = 0; i < strToReplace.length; i++) {
    processedString = processedString.replaceAll(strToReplace[i], ` ${strToReplace[i]} `);
  }
  let words = [];
  for(let i = 0, cWords = processedString.split(' '); i < cWords.length; i++) {
    if(cWords[i].length) {
      words.push(cWords[i])
    }
  }
  let markovText = createWordsDependency(words, wordsHistoryCount);
  for(let i = 0; i < markovText.length; i++) {
    markovText = markovText.replaceAll(` ${strToReplace[i]} `, strToReplace[i]);
  }
  return markovText;
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

// Go through each child of a word and its counting then transform that numbers in percents between 0 and 1.
function createRelativeChange(childs) {
  let sum = 0;
  let countMap = {};
  for(const [_, value] of Object.entries(childs)) {
    sum += value;
  }
  for(const [key, value] of Object.entries(childs)) {
    countMap[key] = value / sum;
  }
  return countMap;
}

//combine multiple consecutive words
function lastWords(words, index, count) {
  let wordsString = "";
  if(index - count + 1 < 0) {
    return null;
  }
  for(let i = index - count + 1; i <= index; i++) {
    wordsString += words[i];
  }
  return wordsString;
}

//it iterate through the word list and for each word it adds the next word and its counting in a dictionary.
//This is basically a graph where each node is a word and its childs are the words that come up next in the sentence.
function createWordsDependency(words, wordsHistoryCount) {
  let wordsCountMap = {};
  for(let i = 1; i <= wordsHistoryCount; i++) {
    wordsCountMap[i] = {};
  }
  if(!words.length) {
    return "";
  }
  for(let w = 1; w <= wordsHistoryCount; w++) {
    for(let i = w - 1; i < words.length - 1; i++) {
      let lastWordsStr = lastWords(words, i, w);
      if(lastWordsStr && !(lastWordsStr in wordsCountMap[w])) {
        wordsCountMap[w][lastWordsStr] = {};
      }
      if(!(words[i + 1] in wordsCountMap[w][lastWordsStr])) {
        wordsCountMap[w][lastWordsStr][words[i + 1]] = 0;
      }
      wordsCountMap[w][lastWordsStr][words[i + 1]]++;
    }
  }
  let response = {};
  for(let i = 1; i <= wordsHistoryCount; i++) {
    response[i] = {};
    for(const [key, value] of Object.entries(wordsCountMap[i])) {
      response[i][key] = createRelativeChange(value);
    }
  }
  let responseWords = [words[0]];
  for(let i = 0; i < words.length - 1; i++) {
    let nextWord = null;
    for(let t = wordsHistoryCount; t >= 1; t--) {
      if(t <= i + 1) {
        let lastWordsStr = lastWords(words, i, t);
        nextWord = getNextWord(response[t][lastWordsStr]);
        if(nextWord) {
          break;
        }
      }
    }
    if(!nextWord) {
      return responseWords.join(' ');
    }
    responseWords.push(nextWord)
    lastWord = nextWord;
  }
  return responseWords.join(' ');
}

// Goes through the childs of a word and gets a random word that could come up based on their probability distribution.
function getNextWord(childsMap) {
  if(!childsMap) {
    return null;
  }
  let arrayKeys = Object.keys(childsMap);
  if(!arrayKeys.length) {
    return null;
  }
  let fullPercent = Math.random();
  for(const [key, value] of Object.entries(childsMap)) {
    fullPercent -= value;
    if(fullPercent <= 0) {
      return key;
    }
  }
  return arrayKeys[0];
}

// go throug each subsequence from the start to finish and try to predict the next character
async function createSubsequenceMap(text, counter = 5, maxChars = 10000) {
  let mapWithNextElements = {};
  if(text.length <= counter) {
    return text;
  }
  for(let i = 0; i < text.length - counter; i++) {
    let substrValue = text.substr(i, counter);
    if(!(substrValue in mapWithNextElements)) {
      mapWithNextElements[substrValue] = {};
    }
    if(!(text[i + counter] in mapWithNextElements[substrValue])) {
      mapWithNextElements[substrValue][text[i + counter]] = 0;
    }
    mapWithNextElements[substrValue][text[i + counter]]++;
  }
  let response = {};
  for(const [key, value] of Object.entries(mapWithNextElements)) {
    response[key] = createRelativeChange(value);
  }
  let firstChars = text.substr(0, counter);
  let currentCounter = 0;
  let maxCharacters = maxChars;
  while(currentCounter < maxCharacters) {
    let newChar = getNextWord(response[firstChars.substr(currentCounter, counter)]);
    if(!newChar) {
      return firstChars;
    }
    firstChars += newChar;
    currentCounter++;
  }
  return firstChars;
}

function finish(response) {
  document.getElementById('out').value = response;
  loadingRelease();
}

function loadingAquire() {
  document.getElementById('loading').innerHTML = "<div>Loading!</div>";
}

function loadingRelease() {
  document.getElementById('loading').innerHTML = "";
}

function removeDropDowns() {
  document.getElementById('input-zone').innerHTML = '';
  document.getElementById('diff').innerHTML = '';
}

function changeOption() {
  const selectedValue = document.getElementById('by').value;
  removeDropDowns();
  if(selectedValue === 'subsequence') {
    const parentDOM = document.getElementById('input-zone')
    parentDOM.appendChild(createElementFromHTML(`
      <div>
        <div class="inp-pair">
          <label>Character subsequence number</label>
          <input value = 5 id='sub-val'>
        </div>
        <div class='inp-pair'>
          <label>Max number of character generated</label>
          <input value = 10000 id='cnt'>
        </div>
      </div>
    `));
  }
  if(selectedValue === 'words') {
    const parentDOM = document.getElementById('diff')
    parentDOM.appendChild(createElementFromHTML(`
      <div>
        <h2>Dificulty!</h2>
        <select id="dificulty">
          <option value=1>Random!</option>
          <option value=2>Relatable!</option>
          <option value=3>Close Enough!</option>
        </select>
      </div>
    `));
  }
}

function process() {
  loadingAquire();
  if(document.getElementById('by').value == 'subsequence') {
    createSubsequenceMap(document.getElementById('inp').value,
                         parseInt(document.getElementById('sub-val').value),
                         parseInt(document.getElementById('cnt').value)).then(finish);
  }
  else {
    markovChain(document.getElementById('inp').value, document.getElementById('dificulty').value).then(finish);
  }
}


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
  let lastWord = words[0];
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

function process() {
  loadingAquire();
  markovChain(document.getElementById('inp').value, document.getElementById('dificulty').value).then(finish);
}


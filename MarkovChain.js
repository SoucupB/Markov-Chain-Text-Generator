//parse the text value and put each word in an array, keep in mind that punctuation signs are also considered words by this algorithm.
async function markovChain(text) {
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
  let markovText = createWordsDependency(words);
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

//it iterate through the word list and for each word it adds the next word and its counting in a dictionary.
//This is basically a graph where each node is a word and its childs are the words that come up next in the sentence.
function createWordsDependency(words) {
  let wordsCountMap = {};
  if(!words.length) {
    return "";
  }
  for(let i = 0; i < words.length - 1; i++) {
    if(!(words[i] in wordsCountMap)) {
      wordsCountMap[words[i]] = {};
    }
    if(!(words[i + 1] in wordsCountMap[words[i]])) {
      wordsCountMap[words[i]][words[i + 1]] = 0;
    }
    wordsCountMap[words[i]][words[i + 1]]++;
  }
  let response = {};
  for(const [key, value] of Object.entries(wordsCountMap)) {
    response[key] = createRelativeChange(value);
  }
  let responseWords = [words[0]];
  let lastWord = words[0];
  for(let i = 0; i < words.length - 1; i++) {
    let nextWord = getNextWord(response[lastWord]);
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
  markovChain(document.getElementById('inp').value).then(finish);
}


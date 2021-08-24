const axios = require('axios');
const tmi = require('tmi.js');
require('dotenv').config();

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

//File-scoped variable for the !trivia command
var correctLetter;

// Called every time a message comes in
async function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (commandName === '!joke') {
      const joke = await getJoke();
      client.say(target, `${joke}`);
      console.log(`* Executed ${commandName} command`);
    }
  else if (commandName === '!trivia') {
      const trivia = await getTrivia();
      var question = trivia.question;
      question = question.replace(/&#039;/g, "'");
      question = question.replace(/&quot;/g, "\"");
    
      var answers = trivia.incorrect_answers;
      answers.push(trivia.correct_answer);
      answers = shuffle(answers);
    
      client.say(target, `Q : ${question} A : ${answers[0]} B : ${answers[1]} C : ${answers[2]} D : ${answers[3]}`);
      declareTriviaAns(trivia.correct_answer, answers);
      client.on('message', triviaEventHandler);
      console.log(`* Executed ${commandName} command`);
    }
}

//Called to inform users if their trivia responses are correct or incorrect.
function triviaEventHandler(target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  // Remove whitespace from chat message
  const commandName = msg.trim();
  const potentialAns = ['!a', '!A', '!b', '!B', '!c', '!C', '!d', '!D'];
  for (let i = 0; i < potentialAns.length; i++) {
      if (commandName === potentialAns[i]) {
          if (commandName === `!${correctLetter}` || commandName === `!${correctLetter.toLowerCase()}`) {
            client.say(target, `You're correct!`);
          }
          else {
            client.say(target, `You're wrong. The correct answer was ${correctLetter}`);
          }
        client.off('message', triviaEventHandler);
        }
    }
}

//Updates the correctLetter variable for the corresponding trivia question.
function declareTriviaAns(correctAns, choices)
{
  for (let i = 0; i < choices.length; i++) {
        if (correctAns === choices[i]) {
              var correctNum = i;
          }
    }
  switch (correctNum) {
    case 0:
      correctLetter = "A";
      break;
    case 1:
      correctLetter = "B";
      break;
    case 2:
      correctLetter = "C";
      break;
    case 3:
      correctLetter = "D";
    }
}

// Function called when the "joke" command is issued
const getJoke = async () => {
  const res = await axios.get('https://official-joke-api.appspot.com/random_joke/')
    .catch((error) => {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      }
      else if (error.request) {
        console.log(error.request);
      }
      else {
        console.log('Error: ', error.message);
      }
    });
  return res.data.setup + " " + res.data.punchline;
}

//Arrow function that fetches the trivia data from the API
const getTrivia = async () => {
    const res = await axios.get('https://opentdb.com/api.php?amount=1&category=15&difficulty=easy&type=multiple', { headers: { Accept: 'application/json' } })
    .catch((error) => {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      }
      else if (error.request) {
        console.log(error.request);
      }
      else {
        console.log('Error: ', error.message);
      }
    });
    const trivia = res.data.results[0];
    return trivia;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

// Shuffles an array based on the Fisher-Yates Shuffle Algorithm
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
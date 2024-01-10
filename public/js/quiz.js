document.querySelector("#submitBtn").addEventListener("click", giveScore);
var score = 0;
var q1Answer = ["30", "30 degrees", "30F", "30°F"];

console.log("Test");

// Check Q1 - This is a TextBox question
function firstQuestion() {
  let questionOne = document.querySelector("#q1Text").value.toUpperCase();
  console.log(questionOne);

  for (let i = 0; i < q1Answer.length; i++) {
    if (questionOne == q1Answer[i].toUpperCase()) {
      score+=20;
      document.querySelector("#question1").style.color = "green";
      break;
    }
  }

  if (score == 0) {
    document.querySelector("#question1").style.color = "red";
  }
}

// Check Q2 - This is a Dropdown menu question
function secondQuestion() {
  let questionTwo = document.querySelector("#q2Dropdown").value;
  console.log(questionTwo);
  
  if (questionTwo == "UT") {
    score += 20;
    document.querySelector("#question2").style.color = "green";
  } else {
    document.querySelector("#question2").style.color = "red";
  }
}

// Check Q3 - This is a Radio Buttons question
function thirdQuestion() {
  if (document.querySelector("#a3").checked) {
    score += 20;
    document.querySelector("#question3").style.color = "green";
  } else {
    document.querySelector("#question3").style.color = "red";
  }
}

// Run the scores and print
function giveScore() {
  score = 0;
  firstQuestion();
  secondQuestion();
  thirdQuestion();

  // Print total score
  document.querySelector("#score").innerHTML = score;
}
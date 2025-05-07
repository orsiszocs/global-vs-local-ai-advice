import { landscapes, nrTrials, roundNumbers } from "./logic/settings.js";
import { initRounds, getNoisyReward, getAllCombinations, turkGetParam } from "./logic/computation_functions.js";
import {
    appendSwitches, getCurrentCombination, updateScoreInformation, updateRewardValue, updateBlockColours, roundIsOver,
    updateEarlierSelections, showIndividualInstructions, showComprehensionCheck, showComprehensionCheckFeedback,
    showAiInstructions, showComprehensionCheckAiFeedback, updateSuggestion, updateSwitchColours,
    gatherFinalQuizAnswers, areFinalLikertQuestionsAnswered, isAgeReasonable,
} from "./logic/ui_functions.js";
import { Advisor, getAllHighLevelSuggestions, getAllLowLevelSuggestions } from "./logic/advisor.js";

var roundTypes = ["tutorial"];
for (let i = 0; i < roundNumbers[0]; i++) {
    roundTypes.push("individual");
}
for (let i = 0; i < roundNumbers[1]; i++) {
    roundTypes.push("assisted");
}
for (let i = 0; i < roundNumbers[2]; i++) {
    roundTypes.push("individual");
}

var nrRounds = roundNumbers[0] + roundNumbers[1] + roundNumbers[2];

var assignmentID;
var workerID;
var scenarioID;
var sessionID;

var currentRound = 0;
var currentTrial = 0;
var rewardSumRound = 0;
var bonusReward = 0;
var recommendationType;
var roundsData = [];
var experimentData = {};
var allActionsData = [];

var advisor;
var currentSuggestion;
var currentAdvisorCoefficients;
var aiAnimationInterval;
var aiInstructionColours;

function assignScenario(callback) {
    var ajaxRequest = new XMLHttpRequest();
    try {
        // Opera 8.0+, Firefox, Safari
        ajaxRequest = new XMLHttpRequest();
    } catch (e) {
        // Internet Explorer Browsers
        try {
            ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                // Something went wrong
                alert("Your browser broke!");
                return false;
            }
        }
    }
    var queryString = "?action=" + 'assignScenario';
    ajaxRequest.open("GET", "databasecall.php" + queryString, false);
    ajaxRequest.send();
    var response = ajaxRequest.responseText;
    var jsonArray = JSON.parse(response);
    scenarioID = parseInt(jsonArray['scenarioId']);
    if (scenarioID % 2 == 0) {
        recommendationType = "high";
    }
    else {
        recommendationType = "low";
    }
    let roundsInformation = initRounds(roundTypes, landscapes);
    roundsData = roundsInformation.roundsData;
    aiInstructionColours = roundsInformation.aiInstructionColours;
    callback();
}

function sendData(experimentData, callback) {
    //Initiate AJAX request
    var ajaxRequest = new XMLHttpRequest();
    try {
        // Opera 8.0+, Firefox, Safari
        ajaxRequest = new XMLHttpRequest();
    } catch (e) {
        // Internet Explorer Browsers
        try {
            ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                // Something went wrong
                alert("Your browser broke!");
                return false;
            }
        }
    }
    var formdata = new FormData();
    formdata.append("action", "'completeScenario'");
    formdata.append("workerID", experimentData.prolificId);
    formdata.append("assignmentID", assignmentID);
    formdata.append("experimentData", JSON.stringify(experimentData));
    formdata.append("reward", experimentData.bonusReward);
    formdata.append("scenarioId", scenarioID);

    var requestOptions = {
        method: 'POST',
        body: formdata,
        redirect: 'follow'
    };

    fetch("./databasecall.php", requestOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(result => {
            console.log(result);
            callback();
        })
        .catch(error => {
            console.log('error', error);
            document.getElementById("connectionProblemText").style.display = "block";
            allActionsData.push({ action: "connection problem", timestamp: new Date().toISOString() });
        });
}

function startRound() {
    if (roundsData[currentRound].roundType == "tutorial") {
        showIndividualInstructions(0, roundNumbers, nrTrials);
    }
    else {
        if (roundsData[currentRound].roundType == "assisted") {
            advisor = new Advisor(getAllCombinations(), roundsData[currentRound].landscape.blockNr1, roundsData[currentRound].landscape.blockNr2);
            currentAdvisorCoefficients = [...advisor.coefficients];
            if (recommendationType == "high") {
                currentSuggestion = advisor.sampleSuggestionHighLevel();
                updateSuggestion(currentSuggestion, roundsData[currentRound]);
            }
            else {
                currentSuggestion = advisor.sampleSuggestionLowLevel();
                updateSuggestion(currentSuggestion, roundsData[currentRound]);
            }
        }
    }

    updateScoreInformation(currentTrial, nrTrials, rewardSumRound);
    let switchCheckboxes = appendSwitches(roundsData[currentRound]);
    updateRewardValue(getCurrentCombination(), roundsData[currentRound].trials);
    for (let switchCheckbox of switchCheckboxes) {
        switchCheckbox.onclick = function () {
            // a square has been clicked
            let combination = getCurrentCombination();
            allActionsData.push({ action: "square clicked", timestamp: new Date().toISOString(), combination: combination });
            updateBlockColours(roundsData[currentRound], combination);
            updateSwitchColours(roundsData[currentRound], combination);
            updateRewardValue(combination, roundsData[currentRound].trials);
        }
    }
}

function clearLastMinigame() {
    document.getElementById("moveOnFromMinigameButton").style.display = "none";
    document.getElementById("earlierSelections").innerHTML = "";
    document.getElementById("rewardButton").disabled = false;
    document.getElementById("aiUsefulQuestion").style.display = "none";
    let usefulRoundRadios = document.getElementsByName("usefulRound");
    for (let radio of usefulRoundRadios) {
        radio.checked = false;
    }
    document.getElementById("aiUsefulFeedback").style.display = "none";
    rewardSumRound = 0;
    currentTrial = 0;
    currentRound += 1;
}

document.getElementById("beginExperimentButton").onclick = function () {
    assignmentID = turkGetParam('STUDY_ID');
    workerID = turkGetParam('PROLIFIC_PID');
    sessionID = turkGetParam('SESSION_ID');
    document.getElementById('prolificIdInput').value = workerID;
    assignScenario(function () {
        document.getElementById("consentPage").style.display = "none";
        document.getElementById("taskPage").style.display = "block";
        startRound();
        allActionsData.push({ action: "start experiment", timestamp: new Date().toISOString() });
        window.scrollTo(0, 0);
    });
}

document.getElementById("rewardButton").onclick = function () {
    let combination = getCurrentCombination();
    let noisyReward = getNoisyReward(combination, roundsData[currentRound].landscape);

    if (roundsData[currentRound].roundType != "assisted") {
        roundsData[currentRound].trials.push({ combination: combination, noisyReward: noisyReward, timestamp: new Date().toISOString(), });
    } else {
        roundsData[currentRound].trials.push({
            combination: combination, noisyReward: noisyReward,
            suggestion: currentSuggestion.getSuggestedValues(),
            coefficients: currentAdvisorCoefficients,
            timestamp: new Date().toISOString(),
        });
    }

    updateRewardValue(combination, roundsData[currentRound].trials);
    updateEarlierSelections(roundsData[currentRound], roundsData[currentRound].trials, allActionsData);
    currentTrial++;
    rewardSumRound += noisyReward;
    updateScoreInformation(currentTrial, nrTrials, rewardSumRound);

    if (roundsData[currentRound].roundType == "assisted") {
        advisor.updateWithCombination(combination, noisyReward);
        currentAdvisorCoefficients = [...advisor.coefficients];
        if (currentTrial < nrTrials) {
            if (recommendationType == "high") {
                currentSuggestion = advisor.sampleSuggestionHighLevel();
                updateSuggestion(currentSuggestion, roundsData[currentRound]);
            }
            else {
                currentSuggestion = advisor.sampleSuggestionLowLevel();
                updateSuggestion(currentSuggestion, roundsData[currentRound]);
            }
        }
    }

    // round is over
    if (currentTrial == nrTrials) {
        let noisyRewardSum = roundsData[currentRound].trials.reduce((a, b) => a + b.noisyReward, 0);
        roundIsOver(noisyRewardSum / nrTrials, roundsData[currentRound], nrRounds);
        let moveOnFromMinigameButton = document.getElementById("moveOnFromMinigameButton");
        if (currentRound < nrRounds) {
            // experiment is not over
            if (roundsData[currentRound].roundType != "tutorial") {
                moveOnFromMinigameButton.style.display = "block";
                if (currentRound == roundNumbers[0]) {
                    moveOnFromMinigameButton.innerHTML = "Meet the AI assistant";
                }
                else {
                    if (currentRound == roundNumbers[0] + roundNumbers[1]) {
                        moveOnFromMinigameButton.innerHTML = "Start round number " + (currentRound + 1).toString() + " out of " + nrRounds.toString() + " (without AI)";
                    }
                    else {
                        moveOnFromMinigameButton.innerHTML = "Start round number " + (currentRound + 1).toString() + " out of " + nrRounds.toString();
                    }
                }
            }
            else {
                document.getElementById("moveToComprehensionButton").style.display = "block";
            }
        }
        else {
            // go to final quiz
            moveOnFromMinigameButton.style.display = "block";
            moveOnFromMinigameButton.innerHTML = "Go to the final quiz";
        }
        if (currentRound >= roundNumbers[0] + 1 && currentRound <= roundNumbers[0] + roundNumbers[1]) {
            document.getElementById("aiUsefulQuestion").style.display = "block";
        }
    }
}

document.getElementById("moveToComprehensionButton").onclick = function () {
    showComprehensionCheck();
    allActionsData.push({ action: "go to solo comprehension", timestamp: new Date().toISOString() });
}

document.getElementById("checkComprehensionButton").onclick = function () {
    showComprehensionCheckFeedback(nrRounds, allActionsData);
}

document.getElementById("checkComprehensionAiButton").onclick = function () {
    showComprehensionCheckAiFeedback(nrRounds, currentRound, allActionsData);
}

document.getElementById("goToInstructionsButton").onclick = function () {
    document.getElementById("comprehensionPage").style.display = "none";
    document.getElementById("taskPage").style.display = "block";
    allActionsData.push({ action: "go back to instructions", timestamp: new Date().toISOString() });
}

document.getElementById("continueInstructions1Button").onclick = function () {
    showIndividualInstructions(1, roundNumbers, nrTrials);
    document.getElementById("continueInstructions1Button").style.display = "none";
    document.getElementById("continueInstructions2Button").style.display = "block";
    document.getElementById("goBackInstructions2Button").style.display = "block";
    allActionsData.push({ action: "continue to instructions 2", timestamp: new Date().toISOString() });
}

document.getElementById("continueInstructions2Button").onclick = function () {
    showIndividualInstructions(2, roundNumbers, nrTrials);
    document.getElementById("continueInstructions2Button").style.display = "none";
    document.getElementById("goBackInstructions3Button").style.display = "block";
    document.getElementById("goBackInstructions2Button").style.display = "none";
    document.getElementById("rewardButton").style.display = "block";
    document.getElementById("rewardValue").style.display = "block";
    document.getElementById("scoreInformationDiv").style.display = "block";
    document.getElementById("switchesDiv").style.display = "block";
    allActionsData.push({ action: "continue to instructions 3", timestamp: new Date().toISOString() });
}

document.getElementById("goBackInstructions2Button").onclick = function () {
    showIndividualInstructions(0, roundNumbers, nrTrials);
    document.getElementById("continueInstructions1Button").style.display = "block";
    document.getElementById("continueInstructions2Button").style.display = "none";
    document.getElementById("goBackInstructions2Button").style.display = "none";
    allActionsData.push({ action: "go back to instructions 1", timestamp: new Date().toISOString() });
}

document.getElementById("goBackInstructions3Button").onclick = function () {
    showIndividualInstructions(1, roundNumbers, nrTrials);
    document.getElementById("continueInstructions2Button").style.display = "block";
    document.getElementById("goBackInstructions3Button").style.display = "none";
    document.getElementById("goBackInstructions2Button").style.display = "block";
    allActionsData.push({ action: "go back to instructions 2", timestamp: new Date().toISOString() });
}

document.getElementById("goToEndPageButton").onclick = function () {
    if (areFinalLikertQuestionsAnswered() && isAgeReasonable()) {
        // calculate bonus payment
        let bonusPayment = 0;
        for (let i = 1; i <= nrRounds; i++) {
            bonusPayment += roundsData[i].bonusPayment;
        }
        bonusReward = +bonusPayment.toFixed(2);
        let bonusPaymentText = document.getElementById("bonusPaymentText");
        bonusPaymentText.innerHTML = "You have earnt a bonus payment of £" + bonusReward.toString() + ".";

        allActionsData.push({ action: "go to end page", timestamp: new Date().toISOString(), bonusReward: bonusReward });

        // collect all experiment data
        experimentData.roundsData = roundsData;
        experimentData.bonusReward = bonusReward;
        experimentData.recommendationType = recommendationType;
        experimentData.allActionsData = allActionsData;
        experimentData.aiInstructionColours = aiInstructionColours;
        gatherFinalQuizAnswers(experimentData);
        document.getElementById("missingAnswersText").style.display = "none";
        // console.log(experimentData);
        sendData(experimentData, function () {
            document.getElementById("finalQuizPage").style.display = "none";
            document.getElementById("endPage").style.display = "block";
        });
    }
    else {
        document.getElementById("missingAnswersText").style.display = "block";
        if (!areFinalLikertQuestionsAnswered()) {
            document.getElementById("missingAnswersText").innerHTML = "Don't forget to answer the questions where you mark your agreement with the statements.";
            allActionsData.push({ action: "missing answers in final quiz", timestamp: new Date().toISOString() });
        }
        else {
            document.getElementById("missingAnswersText").innerHTML = "Please enter a valid age.";
            allActionsData.push({ action: "invalid or missing age in final quiz", timestamp: new Date().toISOString() });
        }
        
    }
}

document.getElementById("startMinigamesButton").onclick = function () {
    clearInterval(aiAnimationInterval);
    document.getElementById("comprehensionPage").style.display = "none";
    document.getElementById("selectSwitchHeader").style.display = "block";
    document.getElementById("instructionsDiv1").style.display = "none";
    document.getElementById("instructionsDiv2").style.display = "none";
    clearLastMinigame();
    startRound();
    document.getElementById("taskPage").style.display = "block";
    allActionsData.push({ action: "start first round", timestamp: new Date().toISOString() });
}

document.getElementById("startAiMinigamesButton").onclick = function () {
    document.getElementById("aiInstructionsPage").style.display = "none";
    document.getElementById("recommendationDiv").style.display = "block";
    clearLastMinigame();
    startRound();
    document.getElementById("taskPage").style.display = "block";
    allActionsData.push({ action: "start first ai round", timestamp: new Date().toISOString() });
}

document.getElementById("moveOnFromMinigameButton").onclick = function () {
    if (currentRound == roundNumbers[0]) {
        // go to the AI instructions
        document.getElementById("taskPage").style.display = "none";
        document.getElementById("aiInstructionsPage").style.display = "block";
        var aiAnimationSuggestions;
        if (recommendationType == "high") {
            aiAnimationSuggestions = getAllHighLevelSuggestions();
        }
        else {
            let blockNr1 = Math.floor(Math.random() * 4);
            let blockNr2 = Math.floor(Math.random() * 4);
            while (blockNr2 == blockNr1) {
                blockNr2 = Math.floor(Math.random() * 4);
            }
            aiAnimationSuggestions = getAllLowLevelSuggestions(blockNr1, blockNr2);
        }
        aiAnimationInterval = showAiInstructions(roundNumbers[1], aiAnimationSuggestions, recommendationType, aiInstructionColours);
        allActionsData.push({ action: "go to ai instructions", timestamp: new Date().toISOString() });
    }
    else {
        if (currentRound == nrRounds) {
            document.getElementById("taskPage").style.display = "none";
            document.getElementById("finalQuizPage").style.display = "block";
            allActionsData.push({ action: "go to final quiz", timestamp: new Date().toISOString() });
        }
        else {
            // if assisted round and the question isn't answered, don't move on
            if (roundsData[currentRound].roundType == "assisted") {
                let usefulRoundRadios = document.getElementsByName("usefulRound");
                let usefulRound = -1;
                for (let radio of usefulRoundRadios) {
                    if (radio.checked) {
                        usefulRound = radio.value;
                    }
                }
                if (usefulRound == -1) {
                    document.getElementById("aiUsefulFeedback").style.display = "block";
                    return;
                }
                roundsData[currentRound].usefulAiRound = usefulRound;
            }
            if (currentRound == roundNumbers[0] + roundNumbers[1]) {
                document.getElementById("recommendationDiv").style.display = "none";
            }
            // simply start the next round
            clearLastMinigame();
            startRound();
            allActionsData.push({ action: "start next round", timestamp: new Date().toISOString() });
        }
    }
}


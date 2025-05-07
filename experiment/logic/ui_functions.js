var aiAnimationSuggestionId = 0;

function showComprehensionCheck() {
    document.getElementById("taskPage").style.display = "none";
    document.getElementById("comprehensionPage").style.display = "block";
}

function showComprehensionCheckFeedback(nrRounds, allActionsData) {
    let goal = 0, reward = 0, common = 0;
    if (document.getElementById("goal1").checked) {
        goal = 1;
    }
    if (document.getElementById("goal2").checked) {
        goal = 2;
    }
    if (document.getElementById("goal3").checked) {
        goal = 3;
    }
    if (document.getElementById("reward1").checked) {
        reward = 1;
    }
    if (document.getElementById("reward2").checked) {
        reward = 2;
    }
    if (document.getElementById("reward3").checked) {
        reward = 3;
    }
    if (document.getElementById("common1").checked) {
        common = 1;
    }
    if (document.getElementById("common2").checked) {
        common = 2;
    }
    if (document.getElementById("common3").checked) {
        common = 3;
    }
    allActionsData.push({ action: "comprehension check solo", timestamp: new Date().toISOString(), goal: goal, reward: reward, common: common });

    if (goal == 2 && common == 3 && reward == 2) {
        // if correct answers
        document.getElementById("comprehensionFeedback").innerHTML = "Your answers are correct. You can now start the game.";
        document.getElementById("checkComprehensionButton").style.display = "none";
        document.getElementById("goToInstructionsButton").style.display = "none";
        let startMinigamesButton = document.getElementById("startMinigamesButton");
        startMinigamesButton.innerHTML = "Start round number 1 out of " + nrRounds.toString();
        startMinigamesButton.style.display = "block";
        return;
    }
    document.getElementById("comprehensionFeedback").innerHTML = "Incorrect answer(s). Try again.";
    // uncheck the radio buttons
    document.getElementById("goal1").checked = false;
    document.getElementById("goal2").checked = false;
    document.getElementById("goal3").checked = false;
    document.getElementById("reward1").checked = false;
    document.getElementById("reward2").checked = false;
    document.getElementById("reward3").checked = false;
    document.getElementById("common1").checked = false;
    document.getElementById("common2").checked = false;
    document.getElementById("common3").checked = false;
}

function showComprehensionCheckAiFeedback(nrRounds, currentRound, allActionsData) {
    let exactly = 0, suggestion = 0;
    if (document.getElementById("exactly1").checked) {
        exactly = 1;
    }
    if (document.getElementById("exactly2").checked) {
        exactly = 2;
    }
    if (document.getElementById("suggestion1").checked) {
        suggestion = 1;
    }
    if (document.getElementById("suggestion2").checked) {
        suggestion = 2;
    }
    if (document.getElementById("suggestion3").checked) {
        suggestion = 3;
    }
    allActionsData.push({ action: "comprehension check ai", timestamp: new Date().toISOString(), exactly: exactly, suggestion: suggestion });
    if (exactly == 2 && suggestion == 3) {
        // if correct answers
        document.getElementById("comprehensionAiFeedback").innerHTML = "Your answers are correct.";

        document.getElementById("checkComprehensionAiButton").style.display = "none";
        let startAiMinigamesButton = document.getElementById("startAiMinigamesButton");
        startAiMinigamesButton.innerHTML = "Start round number " + (currentRound + 1).toString() + " out of " + nrRounds.toString();
        startAiMinigamesButton.style.display = "block";
        return;
    }
    document.getElementById("comprehensionAiFeedback").innerHTML = "Incorrect answer(s). Try again.";
    // uncheck the radio buttons
    document.getElementById("exactly1").checked = false;
    document.getElementById("exactly2").checked = false;
    document.getElementById("suggestion1").checked = false;
    document.getElementById("suggestion2").checked = false;
    document.getElementById("suggestion3").checked = false;
}

function showIndividualInstructions(instructionsOrder, roundNumbers, nrTrials) {
    let nrRounds = roundNumbers[0] + roundNumbers[1] + roundNumbers[2];
    let instructionsText = document.getElementById("instructionsText");
    if (instructionsOrder == 0) {
        instructionsText.innerHTML = "Welcome to the Colour Combo Game!<br>";
        instructionsText.innerHTML += "Above is a colour combo. A colour combo consists of ";
        instructionsText.innerHTML += "<b>8 small squares</b> and <b>4 big rectangles</b>.<br><br>";
        instructionsText.innerHTML += "When you click on a square, <b>both the square and the surrounding rectangle change colour</b>. ";
        instructionsText.innerHTML += "You can’t modify the rectangles by clicking directly on them. ";
        instructionsText.innerHTML += "Instead, the rectangles change colour based on whether the two squares match or don’t match. ";
        instructionsText.innerHTML += "<b>Try clicking on some of the squares</b>, and observe how the colours change.<br><br>";
        instructionsText.innerHTML += "By selecting a colour combo, you <b>earn points</b>. ";
        instructionsText.innerHTML += "The amount of points you get is <b>influenced by all of the square and rectangle colours</b>.<br><br>";
        instructionsText.innerHTML += "Each square and rectangle <b>independently</b> has a more rewarding and less rewarding colour setting. ";
        instructionsText.innerHTML += "So in the case of every square and rectangle, setting them to <b>one colour is worth more points than</b> ";
        instructionsText.innerHTML += "setting them to <b>the other colour</b>, and the more rewarding colour of one square or rectangle ";
        instructionsText.innerHTML += "is <b>completely separate</b> from the more rewarding colour of the other squares and rectangles.<br>";
    }
    else if (instructionsOrder == 1) {
        instructionsText.innerHTML = "In total, you will play <b>" + nrRounds + " rounds</b>. In each round, your goal will be to ";
        instructionsText.innerHTML += "<b>collect as many points as you can by selecting " + nrTrials + " colour combos</b>.<br>";
        instructionsText.innerHTML += "First you will play " + roundNumbers[0] + " rounds on your own, and then an AI assistant will be introduced to you, ";
        instructionsText.innerHTML += "who will help you in " + roundNumbers[1] + " rounds. Finally, you will play " + roundNumbers[2] + " rounds alone.<br><br>";
        instructionsText.innerHTML += "The value of the combos change in every round. ";
        instructionsText.innerHTML += "The <b>average colour combo is worth 100 points</b>. ";
        instructionsText.innerHTML += "However, the maximum and minimum amount of points you can get in a round will change.<br><br>";
        instructionsText.innerHTML += "Your <b>bonus payment</b> depends on what <b>percentage of the maximum score</b> you achieve. ";
        instructionsText.innerHTML += "For a score of 50% you receive no bonus payment but a score of 100% earns you £0.30 for a round";
        instructionsText.innerHTML += " (£3.60 for the " + nrRounds + " rounds).<br>"
    }
    else if (instructionsOrder == 2) {
        instructionsText.innerHTML = "To get a better hang of the Colour Combo Game, <b>complete the round on this page. ";
        instructionsText.innerHTML += "You can select a colour combo by clicking on the <b>Select this combo</b> button.<br><br>";
        instructionsText.innerHTML += "<b>You can copy</b> the colour combos that you have already selected by clicking on them in the ";
        instructionsText.innerHTML += "<b>Your previous selections</b> list. When you select the same colour combo multiple times, the reward can vary a bit.<br><br>";
        instructionsText.innerHTML += "Your bonus payment won't be affected by this round.<br><br>";
        instructionsText.innerHTML += "Afterwards, we will check with a short quiz that you understand everything written here. ";
        instructionsText.innerHTML += "When you finish, a button will appear below for starting the quiz.";

    }
}

function showSuggestion(elementId, suggestion, featureColours) {
    let [lowValues, highValues] = suggestion.getSuggestedValues();
    const elementSuggestion = document.getElementById(elementId);
    elementSuggestion.style["display"] = "flex";
    elementSuggestion.innerHTML = "";
    let switchBlocks = [];
    for (let i = 0; i < 4; i++) {
        let switchBlock = document.createElement("div");
        switchBlock.className = "switchBlock";
        if (highValues[i] == 0) {
            switchBlock.style["background-color"] = "white";
        }
        else if (highValues[i] == 1) {
            switchBlock.style["background-color"] = featureColours.highColour1;
        }
        else {
            switchBlock.style["background-color"] = featureColours.highColour2;
        }
        elementSuggestion.appendChild(switchBlock);
        switchBlocks.push(switchBlock);
    }
    for (let i = 0; i < 8; i++) {
        let label = document.createElement("label");
        label.className = "switch";
        label.style["cursor"] = "default";
        if (lowValues[i] == 0) {
            label.style["background-color"] = "white";
        }
        else {
            if (lowValues[i] == 1) {
                label.style["background-color"] = featureColours.lowColour1;
            }
            else {
                label.style["background-color"] = featureColours.lowColour2;
            }
        }
        switchBlocks[Math.floor(i / 2)].appendChild(label);
    }
}

function runAiAnimations(aiAnimationSuggestions, randomColours) {
    if (aiAnimationSuggestionId >= aiAnimationSuggestions.length) {
        aiAnimationSuggestionId = 0;
    }
    let suggestion = aiAnimationSuggestions[aiAnimationSuggestionId];
    showSuggestion("possibleSuggestions", suggestion, randomColours);
    aiAnimationSuggestionId++;
}

function showAiInstructions(nrAiRounds, aiAnimationSuggestions, recommendationType, aiInstructionColours) {
    let instructionsText = document.getElementById("instructionsTextAi");
    instructionsText.innerHTML = "In the following " + nrAiRounds.toString() + " rounds, an AI assistant will help you.<br>Similarly to the animation above, ";
    if (recommendationType == "low") {
        instructionsText.innerHTML += "the AI assistant will suggest to you <b>which square and rectangle colours to select inside 2 rectangles</b>. ";
        instructionsText.innerHTML += "The AI isn't giving you any recommendations for the other 2 white rectangles with the 4 white squares. ";
        instructionsText.innerHTML += "In each round, the AI will pick 2 rectangles, and it will only advise you on those.<br>";
    }
    else {
        instructionsText.innerHTML += "the AI assistant will suggest to you <b>which 4 rectangle colours to select</b>. ";
        instructionsText.innerHTML += "The AI isn't giving you any recommendations for the 8 white squares. ";
        instructionsText.innerHTML += "In each round, the AI will only help you with the rectangle colours.<br>";
    }
    instructionsText.innerHTML += "<br>In every round, the AI assistant will have <b>the same knowledge as you do</b>. So when the round starts, ";
    instructionsText.innerHTML += "the AI assistant won't know which colour combos are valuable. ";
    instructionsText.innerHTML += "However, the AI will <b>learn from your selections</b>, "
    instructionsText.innerHTML += "and it will give better suggestions as you <b>select different colour combos</b>.<br>";
    instructionsText.innerHTML += "You will <b>receive the AI's suggestion before every selection</b>. ";
    instructionsText.innerHTML += "You can <b>freely choose to follow or ignore the suggestion</b>.<br>";
    instructionsText.innerHTML += "Now you will have to correctly answer the questions below to start the next round.";

    aiAnimationSuggestions.sort(() => Math.random() - 0.5);
    runAiAnimations(aiAnimationSuggestions, aiInstructionColours);
    return setInterval(runAiAnimations, 2000, aiAnimationSuggestions, aiInstructionColours);
}

function getCurrentCombination() {
    let combination = [];
    for (let i = 0; i < 8; i++) {
        if (document.getElementById("switch" + i.toString()).checked) {
            combination.push(1);
        }
        else {
            combination.push(-1);
        }
    }
    return combination;
}

function updateBlockColours(roundInfo, combination) {
    for (let i = 0; i < 4; i++) {
        let switchBlock = document.getElementById("block" + i.toString());
        let block = combination.slice(i * 2, (i + 1) * 2);
        if (block[0] * block[1] == 1) {
            switchBlock.style["background-color"] = roundInfo.highColour1;
        }
        else {
            switchBlock.style["background-color"] = roundInfo.highColour2;
        }
    }
}

function updateSwitchColours(roundInfo, combination) {
    for (let i = 0; i < 8; i++) {
        let switchCheckbox = document.getElementById("switch" + i.toString());
        let switchLabel = switchCheckbox.parentElement;
        if (combination[i] == 1) {
            switchLabel.style["background-color"] = roundInfo.lowColour1;
        }
        else {
            switchLabel.style["background-color"] = roundInfo.lowColour2;
        }
    }
}

function equalArrays(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function updateRewardValue(combination, roundTrials) {
    // if the current combination was already selected, it updates the reward
    // otherwise, it sets the displayed reward to ???
    const rewardValue = document.getElementById("rewardValue");
    let alreadySelected = false;
    for (let trial of roundTrials.slice().reverse()) {
        if (equalArrays(trial.combination, combination)) {
            rewardValue.innerHTML = "You earnt: <b>" + trial.noisyReward.toString() + " points</b>";
            alreadySelected = true;
            break;
        }
    }
    if (!alreadySelected) {
        rewardValue.innerHTML = "You earnt: <b>??? points</b>";
    }
}

function appendSwitches(roundInfo) {
    // appends the switches to the document and returns them in an array
    const switches = document.getElementById("switches");
    switches.innerHTML = "";
    let switchBlocks = [];
    let combination = roundInfo.landscape.initialCombination;
    for (let i = 0; i < 4; i++) {
        let switchBlock = document.createElement("div");
        switchBlock.id = "block" + i.toString();
        switchBlock.className = "switchBlock";
        switches.appendChild(switchBlock);
        switchBlocks.push(switchBlock);
    }
    let switchesArray = [];
    for (let i = 0; i < 8; i++) {
        let label = document.createElement("label");
        label.className = "switch";
        let input = document.createElement("input");
        input.type = "checkbox";
        input.id = "switch" + i.toString();
        if (combination[i] == 1) {
            input.checked = true;
        }
        label.appendChild(input);
        switchBlocks[Math.floor(i / 2)].appendChild(label);
        switchesArray.push(input);
    }
    updateSwitchColours(roundInfo, combination);
    updateBlockColours(roundInfo, combination);
    return switchesArray;
}

function updateSuggestion(suggestion, roundInfo) {
    showSuggestion("recommendedSwitches", suggestion, {
        lowColour1: roundInfo.lowColour1, lowColour2: roundInfo.lowColour2,
        highColour1: roundInfo.highColour1, highColour2: roundInfo.highColour2
    });
}

function updateEarlierSelections(roundInfo, roundTrials, allActions) {
    document.getElementById("selectionsHeader").style["display"] = "block";
    const earlierSelections = document.getElementById("earlierSelections");
    earlierSelections.innerHTML = "";
    for (let trial of roundTrials.slice().reverse()) {
        let trialRow = document.createElement("div");
        let blockRow = document.createElement("div");
        trialRow.style["display"] = "flex";
        blockRow.className = "blockRow";
        let trialBlocks = [];
        for (let i = 0; i < 4; i++) {
            let trialBlock = document.createElement("div");
            trialBlock.className = "trialBlock";
            let block = trial.combination.slice(i * 2, (i + 1) * 2);
            if (block[0] * block[1] == 1) {
                trialBlock.style["background-color"] = roundInfo.highColour1;
            }
            else {
                trialBlock.style["background-color"] = roundInfo.highColour2;
            }
            trialBlocks.push(trialBlock);
            blockRow.appendChild(trialBlock);
        }
        let trialReward = document.createElement("p");
        trialReward.className = "trialReward";
        trialRow.appendChild(blockRow);
        trialRow.appendChild(trialReward);
        trialReward.innerHTML = trial.noisyReward.toString();
        for (let i = 0; i < 8; i++) {
            let trialSwitch = document.createElement("div");
            trialSwitch.className = "trialSwitch";
            if (trial.combination[i] == 1) {
                trialSwitch.style["background-color"] = roundInfo.lowColour1;
            }
            else {
                trialSwitch.style["background-color"] = roundInfo.lowColour2;
            }
            trialBlocks[Math.floor(i / 2)].appendChild(trialSwitch);
        }
        blockRow.onclick = function () {
            this.style.transition = "border-color 0.7s, box-shadow 0.7s";
            this.style.boxShadow = "0 0 8px #808080";
            setTimeout(() => {
                this.style.boxShadow = "none";
            }, 700);
            for (let i = 0; i < 8; i++) {
                let switchCheckbox = document.getElementById("switch" + i.toString());
                if (trial.combination[i] == 1) {
                    switchCheckbox.checked = true;
                }
                else {
                    switchCheckbox.checked = false;
                }
            }
            updateSwitchColours(roundInfo, trial.combination);
            updateBlockColours(roundInfo, trial.combination);
            updateRewardValue(trial.combination, roundTrials);
            allActions.push({ action: "combo copied", timestamp: new Date().toISOString(), combination: trial.combination });
        }
        earlierSelections.appendChild(trialRow);
    }
}

function roundIsOver(roundScore, roundInfo, nrRounds) {
    // disable reward button
    document.getElementById("rewardButton").disabled = true;
    // disable switches
    for (let i = 0; i < 8; i++) {
        let switchCheckbox = document.getElementById("switch" + i.toString());
        switchCheckbox.disabled = true;
        switchCheckbox.parentNode.style["cursor"] = "default";
    }
    // disable earlier selections
    let blockRows = document.getElementsByClassName("blockRow");
    for (let blockRow of blockRows) {
        blockRow.onclick = function () { };
        blockRow.style["cursor"] = "default";
    }

    let maxReward = roundInfo.landscape.maxReward;
    let minReward = roundInfo.landscape.minReward;
    let relativeScore = (roundScore - minReward) / (maxReward - minReward);
    let bonusPayment = 0.0;
    if (relativeScore > 0.5) {
        bonusPayment = 2 * 3.6 * (relativeScore - 0.5) / nrRounds;
    }
    roundInfo.relativeScore = relativeScore;
    roundInfo.bonusPayment = bonusPayment;
    let scoreInformation = document.getElementById("scoreInformation");
    scoreInformation.innerHTML = "Your score: <b>" + (relativeScore * 100).toFixed(2).toString() + "% </b> of the best possible score<br>";
    if (roundInfo.roundType == "tutorial") {
        scoreInformation.innerHTML += "<br>";
    }
    else {
        let bonusPaymentRounded = +bonusPayment.toFixed(2);
        if (bonusPaymentRounded > bonusPayment) {
            bonusPaymentRounded -= 0.01;
            if (bonusPaymentRounded < 0) {
                bonusPaymentRounded = 0;
            }
        }
        scoreInformation.innerHTML += "Your bonus payment for this round: <b>£" + bonusPaymentRounded.toFixed(2).toString() + "</b><br>";
    }
}

function updateScoreInformation(currentTrial, nrTrials, score) {
    let scoreInfo = "";
    if (currentTrial < nrTrials) {
        scoreInfo += "Total points: <b>" + score.toString() + " points</b><br>";
        scoreInfo += "Remaining selections: <b>" + (nrTrials - currentTrial).toString() + "</b>";
    }
    document.getElementById("scoreInformation").innerHTML = scoreInfo;
}

function isAgeReasonable() {
    let age = document.getElementById("ageInput").value;
    if (age < 18 || age > 120) {
        return false;
    }
    return true;
}

function areFinalLikertQuestionsAnswered() {
    let usefulAi = -1;
    if (document.getElementById('useful1').checked) {
        usefulAi = 1;
    }
    if (document.getElementById('useful2').checked) {
        usefulAi = 2;
    }
    if (document.getElementById('useful3').checked) {
        usefulAi = 3;
    }
    if (document.getElementById('useful4').checked) {
        usefulAi = 4;
    }
    if (document.getElementById('useful5').checked) {
        usefulAi = 5;
    }
    if (document.getElementById('useful6').checked) {
        usefulAi = 6;
    }
    if (document.getElementById('useful7').checked) {
        usefulAi = 7;
    }
    let followedAi = -1;
    if (document.getElementById('followed1').checked) {
        followedAi = 1
    };
    if (document.getElementById('followed2').checked) {
        followedAi = 2
    };
    if (document.getElementById('followed3').checked) {
        followedAi = 3
    };
    if (document.getElementById('followed4').checked) {
        followedAi = 4
    };
    if (document.getElementById('followed5').checked) {
        followedAi = 5
    };
    if (document.getElementById('followed6').checked) {
        followedAi = 6
    };
    if (document.getElementById('followed7').checked) {
        followedAi = 7
    };
    if (usefulAi == -1 || followedAi == -1) {
        return false;
    }
    return true;
}

function gatherFinalQuizAnswers(experimentData) {
    // adds the final quiz answers to the experiment data
    let prolificId = document.getElementById("prolificIdInput").value;
    let age = document.getElementById("ageInput").value;

    let gender = -1;
    if (document.getElementById('gender1').checked) {
        gender = 0
    };
    if (document.getElementById('gender2').checked) {
        gender = 1
    };
    if (document.getElementById('gender3').checked) {
        gender = 2
    };

    let usefulAi = -1;
    if (document.getElementById('useful1').checked) {
        usefulAi = 1;
    }
    if (document.getElementById('useful2').checked) {
        usefulAi = 2;
    }
    if (document.getElementById('useful3').checked) {
        usefulAi = 3;
    }
    if (document.getElementById('useful4').checked) {
        usefulAi = 4;
    }
    if (document.getElementById('useful5').checked) {
        usefulAi = 5;
    }
    if (document.getElementById('useful6').checked) {
        usefulAi = 6;
    }
    if (document.getElementById('useful7').checked) {
        usefulAi = 7;
    }

    let followedAi = -1;
    if (document.getElementById('followed1').checked) {
        followedAi = 1
    };
    if (document.getElementById('followed2').checked) {
        followedAi = 2
    };
    if (document.getElementById('followed3').checked) {
        followedAi = 3
    };
    if (document.getElementById('followed4').checked) {
        followedAi = 4
    };
    if (document.getElementById('followed5').checked) {
        followedAi = 5
    };
    if (document.getElementById('followed6').checked) {
        followedAi = 6
    };
    if (document.getElementById('followed7').checked) {
        followedAi = 7
    };

    let strategyOwn = document.getElementById("strategyOnOwn").value;
    let strategyAi = document.getElementById("strategyWithAi").value;

    experimentData.prolificId = prolificId;
    experimentData.age = age;
    experimentData.gender = gender;
    experimentData.usefulAi = usefulAi;
    experimentData.followedAi = followedAi;
    experimentData.strategyOwn = strategyOwn;
    experimentData.strategyAi = strategyAi;
}

export {
    appendSwitches, getCurrentCombination, updateScoreInformation, updateRewardValue, updateBlockColours, roundIsOver,
    updateEarlierSelections, showIndividualInstructions, showComprehensionCheck, showComprehensionCheckFeedback, showAiInstructions,
    showComprehensionCheckAiFeedback, updateSuggestion, updateSwitchColours, gatherFinalQuizAnswers, areFinalLikertQuestionsAnswered,
    isAgeReasonable,
};
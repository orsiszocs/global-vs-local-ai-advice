import { roundNumbers } from "./settings.js";

var rewardVariance = 4;
var rewardOffset = 100;
var featureColours = ["#ffe119", "#4363d8", "#f58231", "#dcbeff", "#800000"];
// every way of choosing 4 colours
var colourSets = [[0, 1, 2, 3], [0, 1, 2, 4], [0, 1, 3, 4], [0, 2, 3, 4], [1, 2, 3, 4]];
// every way of choosing 2 colours from a set of 4
var colourPairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
// all unique colour settings are generated
var colourSettings = [];
for (let colourSet of colourSets) {
    for (let colourPair of colourPairs) {
        let highColourPair = [];
        for (let i = 0; i < 4; i++) {
            if (!colourPair.includes(i)) {
                highColourPair.push(i);
            }
        }
        colourSettings.push({
            lowColour1: featureColours[colourSet[colourPair[0]]], lowColour2: featureColours[colourSet[colourPair[1]]],
            highColour1: featureColours[colourSet[highColourPair[0]]], highColour2: featureColours[colourSet[highColourPair[1]]]
        });
    }
}

function highLevelCombination(combination) {
    let blockSize = 2;
    let highCombination = [];
    for (let block = 0; block < combination.length / blockSize; block++) {
        let arrayBlock = combination.slice(block * blockSize, (block + 1) * blockSize);
        highCombination.push(math.prod(arrayBlock));
    }
    return highCombination;
}

function gaussianRandom(variance) {
    let standardDev = Math.sqrt(variance);
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * standardDev;
}

function computeUnscaledReward(combination, coefficientsHigh, coefficientsLow) {
    let value = 0;
    let highCombination = highLevelCombination(combination);
    for (let i = 0; i < 4; i++) {
        value += coefficientsHigh[i] * highCombination[i];
    }
    for (let i = 0; i < 8; i++) {
        value += coefficientsLow[i] * combination[i];
    }
    return value;
}

function getNoisyReward(combination, landscape) {
    let unscaledReward = computeUnscaledReward(combination, landscape.coefficientsHigh, landscape.coefficientsLow);
    let value = landscape.rewardScalar * unscaledReward + rewardOffset;
    value += gaussianRandom(rewardVariance);
    value = Math.round(value);
    value = Math.max(landscape.minReward, Math.min(landscape.maxReward, value));
    return value;
}

function getAllCombinations() {
    let combinations = [];
    for (let i = 0; i < 256; i++) {
        let combination = [];
        let binary = i.toString(2);
        while (binary.length < 8) {
            binary = "0" + binary;
        }
        for (let j = 0; j < 8; j++) {
            if (binary[j] == "0") {
                combination.push(-1);
            }
            else {
                combination.push(1);
            }
        }
        combinations.push(combination);
    }
    return combinations;
}

function selectRandomLandscapes(landscapes) {
    // select landscapes such that for different types of rounds,
    // landscape trios are selected with a randomised order
    let tempLandscapeTrios = [...landscapes];
    let selectedLandscapes = [];
    // select a single landscape for the tutorial
    let randomIndex = Math.floor(Math.random() * tempLandscapeTrios.length);
    let randomTrio = tempLandscapeTrios[randomIndex];
    let randomLandscape = randomTrio[Math.floor(Math.random() * randomTrio.length)];
    selectedLandscapes.push(randomLandscape);
    tempLandscapeTrios.splice(randomIndex, 1);
    // select the landscapes for the pre-assisted rounds
    for (let i = 0; i < roundNumbers[0]; i+=3) {
        randomIndex = Math.floor(Math.random() * tempLandscapeTrios.length);
        randomTrio = tempLandscapeTrios[randomIndex];
        // shuffle the trio
        randomTrio = randomTrio.sort(() => 0.5 - Math.random());
        // append all landscapes from the trio
        for (let landscape of randomTrio) {
            selectedLandscapes.push(landscape);
        }
        tempLandscapeTrios.splice(randomIndex, 1);
    }
    // select the landscapes for the assisted rounds
    for (let i = 0; i < roundNumbers[1]; i+=3) {
        randomIndex = Math.floor(Math.random() * tempLandscapeTrios.length);
        randomTrio = tempLandscapeTrios[randomIndex];
        randomTrio = randomTrio.sort(() => 0.5 - Math.random());
        for (let landscape of randomTrio) {
            selectedLandscapes.push(landscape);
        }
        tempLandscapeTrios.splice(randomIndex, 1);
    }
    // select the landscapes for the post-assisted rounds
    for (let i = 0; i < roundNumbers[2]; i+=3) {
        randomIndex = Math.floor(Math.random() * tempLandscapeTrios.length);
        randomTrio = tempLandscapeTrios[randomIndex];
        randomTrio = randomTrio.sort(() => 0.5 - Math.random());
        for (let landscape of randomTrio) {
            selectedLandscapes.push(landscape);
        }
        tempLandscapeTrios.splice(randomIndex, 1);
    }
    return selectedLandscapes;
}

function initRandomLandscapes(roundTypes, landscapes) {
    // select landscapes and save their info
    let randomLandscapes = selectRandomLandscapes(landscapes);
    let landscapesInfo = [];
    let combinations = getAllCombinations();
    for (let randomLandscape of randomLandscapes) {
        let minReward = Math.floor(Math.random() * (70 - 20 + 1) + 20);
        // find the reward scalar
        let minUnscaledReward = 100;
        for (let combination of combinations) {
            let reward = computeUnscaledReward(combination, randomLandscape.coefficients_high, randomLandscape.coefficients_low);
            if (reward < minUnscaledReward) {
                minUnscaledReward = reward;
            }
        }
        let rewardScalar = (minReward - rewardOffset) / minUnscaledReward;
        // find the max reward
        let maxReward = 0;
        for (let combination of combinations) {
            let unscaledReward = computeUnscaledReward(combination, randomLandscape.coefficients_high, randomLandscape.coefficients_low);
            let reward = Math.round(rewardScalar * unscaledReward + rewardOffset);
            if (reward > maxReward) {
                maxReward = reward;
            }
        }
        let randomCombination = combinations[Math.floor(Math.random() * combinations.length)];
        landscapesInfo.push({
            id: randomLandscape.id,
            blockNr1: randomLandscape.block_nr1,
            blockNr2: randomLandscape.block_nr2,
            coefficientsLow: randomLandscape.coefficients_low,
            coefficientsHigh: randomLandscape.coefficients_high,
            maxReward: maxReward,
            minReward: minReward,
            rewardScalar: rewardScalar,
            initialCombination: randomCombination,
            highLowDifference: randomLandscape.high_low_difference,
        });
    }
    return landscapesInfo;
}

function initRounds(roundTypes, landscapes) {
    let roundsData = [];
    let landscapesInfo = initRandomLandscapes(roundTypes, landscapes);
    colourSettings = colourSettings.sort(() => 0.5 - Math.random());
    for (let i = 0; i < roundTypes.length; i++) {
        let roundType = roundTypes[i];
        let landscape = landscapesInfo[i];
        let round = {
            roundType: roundType, landscape: landscape, lowColour1: colourSettings[i].lowColour1,
            lowColour2: colourSettings[i].lowColour2, highColour1: colourSettings[i].highColour1,
            highColour2: colourSettings[i].highColour2, trials: []
        };
        roundsData.push(round);
    }
    let aiInstructionColours = {
        lowColour1: colourSettings[roundTypes.length].lowColour1,
        lowColour2: colourSettings[roundTypes.length].lowColour2,
        highColour1: colourSettings[roundTypes.length].highColour1,
        highColour2: colourSettings[roundTypes.length].highColour2
    };
    return { roundsData: roundsData, aiInstructionColours: aiInstructionColours };
}

function turkGetParam(name) {
    var regexS = "[\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var tmpURL = document.location.href;
    var results = regex.exec(tmpURL);
    if (results == null) {
        return "";
    } else {
        return results[1];
    }
}

export { initRounds, getNoisyReward, getAllCombinations, featureColours, turkGetParam };
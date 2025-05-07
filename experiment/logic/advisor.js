import { pseudoInverse } from "./pseudoinverse.js";

function highLevelCombination(combination) {
    let blockSize = 2;
    let highCombination = [];
    for (let block = 0; block < combination.length / blockSize; block++) {
        let arrayBlock = combination.slice(block * blockSize, (block + 1) * blockSize);
        highCombination.push(math.prod(arrayBlock));
    }
    return highCombination;
}

function equalArrays(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function stableSoftmax(values, temperature) {
    const scaledValues = values.map(value => value / temperature);
    const maxScaledValue = Math.max(...scaledValues);
    const shiftedValues = scaledValues.map(value => value - maxScaledValue);
    const numerator = shiftedValues.map(value => Math.exp(value));
    const denominator = numerator.reduce((acc, curr) => acc + curr, 0);
    const softmax = numerator.map(value => value / denominator);
    return softmax;
}


class Suggestion {
    isMatchingCombination(combination) {
        return;
    }

    getSuggestedValues() {
        return;
    }
}

class HighLevelSuggestion extends Suggestion {
    constructor(highLevelCombination) {
        super();
        this.highLevelCombination = highLevelCombination;
    }

    isMatchingCombination(combination) {
        return equalArrays(this.highLevelCombination, highLevelCombination(combination));
    }

    getSuggestedValues() {
        return [[0, 0, 0, 0, 0, 0, 0, 0], this.highLevelCombination];
    }
}

class LowLevelSuggestion extends Suggestion {
    constructor(lowLevelCombination1, lowLevelCombination2, blockNumber1, blockNumber2) {
        super();
        this.lowLevelCombination1 = lowLevelCombination1;
        this.lowLevelCombination2 = lowLevelCombination2;
        this.blockNumber1 = blockNumber1;
        this.blockNumber2 = blockNumber2;
    }

    isMatchingCombination(combination) {
        let blockCombination1 = combination.slice(2 * this.blockNumber1, 2 * (this.blockNumber1 + 1));
        let blockCombination2 = combination.slice(2 * this.blockNumber2, 2 * (this.blockNumber2 + 1));
        return equalArrays(blockCombination1, this.lowLevelCombination1) && equalArrays(blockCombination2, this.lowLevelCombination2);
    }

    getSuggestedValues() {
        let lowValues = [0, 0, 0, 0, 0, 0, 0, 0];
        lowValues[2 * this.blockNumber1] = this.lowLevelCombination1[0];
        lowValues[2 * this.blockNumber1 + 1] = this.lowLevelCombination1[1];
        lowValues[2 * this.blockNumber2] = this.lowLevelCombination2[0];
        lowValues[2 * this.blockNumber2 + 1] = this.lowLevelCombination2[1];
        let highValues = [0, 0, 0, 0];
        highValues[this.blockNumber1] = this.lowLevelCombination1[0] * this.lowLevelCombination1[1];
        highValues[this.blockNumber2] = this.lowLevelCombination2[0] * this.lowLevelCombination2[1];
        return [lowValues, highValues];
    }
}

function cartesianProduct(...arrays) {
    return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
}

function getAllHighLevelSuggestions() {
    let highLevelCombinations = cartesianProduct([-1, 1], [-1, 1], [-1, 1], [-1, 1]);
    let highLevelSuggestions = [];
    for (let highLevelCombination of highLevelCombinations) {
        highLevelSuggestions.push(new HighLevelSuggestion(highLevelCombination));
    }
    return highLevelSuggestions;
}

function getAllLowLevelSuggestions(blockNumber1, blockNumber2) {
    let lowLevelCombinations = cartesianProduct([-1, 1], [-1, 1]);
    let lowLevelSuggestions = [];
    for (let lowLevelCombination1 of lowLevelCombinations) {
        for (let lowLevelCombination2 of lowLevelCombinations) {
            lowLevelSuggestions.push(new LowLevelSuggestion(lowLevelCombination1, lowLevelCombination2, blockNumber1, blockNumber2));
        }
    }
    return lowLevelSuggestions;
}


class Advisor {
    constructor(allCombinations, blockNr1, blockNr2) {
        this.lowLevelBlockNr1 = blockNr1;
        this.lowLevelBlockNr2 = blockNr2;
        this.allHighLevelSuggestions = getAllHighLevelSuggestions();
        this.allLowLevelSuggestions = getAllLowLevelSuggestions(blockNr1, blockNr2);
        this.savedSelections = [];
        this.allCombinations = allCombinations;
        this.coefficients = [];
        this.temperature = 2;
        for (let i = 0; i < 12; i++) {
            this.coefficients.push(0.0);
        }
    }

    getCombinationRewardEstimate(combination) {
        let highCombination = highLevelCombination(combination);
        let value = 0.0;
        for (let i = 0; i < 8; i++) {
            value += this.coefficients[i] * combination[i];
        }
        for (let i = 0; i < 4; i++) {
            value += this.coefficients[8 + i] * highCombination[i];
        }
        return value;
    }

    getBestCombination() {
        let shuffledCombinations = this.allCombinations.slice();
        shuffledCombinations.sort(() => 0.5 - Math.random());
        let bestCombination = null;
        let bestValue = -Infinity;
        for (let combination of shuffledCombinations) {
            let value = this.getCombinationRewardEstimate(combination);
            if (value > bestValue) {
                bestValue = value;
                bestCombination = combination;
            }
        }
        return bestCombination;
    }

    sampleCombination() {
        let probabilities = this.combinationProbabilities();
        let cumulativeProbabilities = probabilities.reduce((acc, prob, i) => [...acc, prob + (acc[i-1] || 0)], []);
        let random = Math.random();
        let sampledIndex = cumulativeProbabilities.findIndex(cumProb => random < cumProb);
        return this.allCombinations[sampledIndex];
    }

    combinationProbabilities() {
        let rewardEstimates = this.allCombinations.map(combination => this.getCombinationRewardEstimate(combination));
        let probabilities = stableSoftmax(rewardEstimates, this.temperature);
        return probabilities;
    }

    updateWithCombination(combination, noisyReward) {
        this.savedSelections.push({ combination: combination, noisyReward: noisyReward });

        // compute coefficients (8 low-level and 4 high-level) via least squares
        let inputVariables = [];
        let outputVariables = [];
        for (let selection of this.savedSelections) {
            let inputVariable = selection.combination.concat(highLevelCombination(selection.combination));
            inputVariables.push(inputVariable);
            outputVariables.push(selection.noisyReward - 100);
        }
        inputVariables = math.matrix(inputVariables);

        let coefficients = math.multiply(pseudoInverse(inputVariables), math.reshape(outputVariables, [outputVariables.length, 1]));
        coefficients = math.reshape(coefficients, [12]);

        for (let i = 0; i < 12; i++) {
            this.coefficients[i] = coefficients.get([i]);
        }
    }

    getBestSuggestion(allSuggestions) {
        let bestCombination = this.getBestCombination();
        for (let suggestion of allSuggestions) {
            if (suggestion.isMatchingCombination(bestCombination)) {
                return suggestion;
            }
        }
        return null;
    }

    sampleSuggestionHighLevel() {
        let sampleCombination = this.sampleCombination();
        for (let suggestion of this.allHighLevelSuggestions) {
            if (suggestion.isMatchingCombination(sampleCombination)) {
                return suggestion;
            }
        }
    }

    sampleSuggestionLowLevel() {
        let sampleCombination = this.sampleCombination();
        for (let suggestion of this.allLowLevelSuggestions) {
            if (suggestion.isMatchingCombination(sampleCombination)) {
                return suggestion;
            }
        }
    }

    getBestSuggestionHighLevel() {
        return this.getBestSuggestion(this.allHighLevelSuggestions);
    }

    getBestSuggestionLowLevel() {
        return this.getBestSuggestion(this.allLowLevelSuggestions);
    }
}

export { Advisor, getAllHighLevelSuggestions, getAllLowLevelSuggestions };
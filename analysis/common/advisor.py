"""
Defines suggestion and AI advisor components for the bandit experiment.
- LowLevelSuggestion: wraps a local AI suggestion
- HighLevelSuggestion: wraps a global AI suggestion
- Advisor: learns feature weights, estimates rewards, and samples suggestions

Utilities:
- Suggestion: abstract interface
- high_level_combination: computes high-level features
- stable_softmax
- all_high_level_suggestions
- all_low_level_suggestions
"""

import numpy as np
from itertools import product
from abc import ABC, abstractmethod


def high_level_combination(combination):
    block_size = 2
    high_combination = []
    for block in range(len(combination) // block_size):
        array_block = list(combination[block * block_size: (block + 1) * block_size])
        high_combination.append(np.prod(array_block))
    return high_combination


def stable_softmax(values):
    shifted_values = values - np.max(values)
    numerator = np.exp(shifted_values)
    denominator = np.sum(numerator)
    softmax = numerator / denominator
    return softmax


class Suggestion(ABC):
    @abstractmethod
    def is_matching_combination(self, combination):
        pass

    @abstractmethod
    def suggestion_values(self):
        # return low- and high-level values in two arrays (unspecified values are set to None)
        pass


class HighLevelSuggestion(Suggestion):
    def __init__(self, high_level_combination):
        self._high_level_combination = high_level_combination

    def is_matching_combination(self, combination):
        return tuple(high_level_combination(combination)) == tuple(self._high_level_combination)

    def all_matching_combinations(self):
        all_combinations = list(product([-1, 1], repeat=8))
        matching_combinations = []
        for combination in all_combinations:
            if self.is_matching_combination(combination):
                matching_combinations.append(combination)
        return matching_combinations

    def suggestion_values(self):
        return [None for _ in range(8)], self._high_level_combination

    def mean_reward(self, coefficients):
        reward = 0
        for i in range(4):
            reward += self._high_level_combination[i] * coefficients[8 + i]
        return reward

    def __str__(self):
        return f"high-level: {self._high_level_combination}"

    def __eq__(self, other):
        return tuple(self._high_level_combination) == tuple(other._high_level_combination)

    def __hash__(self):
        return hash(tuple(self._high_level_combination))


class LowLevelSuggestion(Suggestion):
    def __init__(self, low_level_combination1, low_level_combination2, block_number1, block_number2):
        self._low_level_combination1 = low_level_combination1
        self._low_level_combination2 = low_level_combination2
        self._block_number1 = block_number1
        self._block_number2 = block_number2

    def is_matching_combination(self, combination):
        block_combination1 = combination[2 * self._block_number1: 2 * (self._block_number1 + 1)]
        block_combination2 = combination[2 * self._block_number2: 2 * (self._block_number2 + 1)]
        return tuple(block_combination1) == tuple(self._low_level_combination1) and \
            tuple(block_combination2) == tuple(self._low_level_combination2)

    def all_matching_combinations(self):
        all_combinations = list(product([-1, 1], repeat=8))
        matching_combinations = []
        for combination in all_combinations:
            if self.is_matching_combination(combination):
                matching_combinations.append(combination)
        return matching_combinations

    def suggestion_values(self):
        high_level_combination = [None for _ in range(4)]
        low_level_combination = [None for _ in range(8)]
        high_level_combination[self._block_number1] = np.prod(self._low_level_combination1)
        high_level_combination[self._block_number2] = np.prod(self._low_level_combination2)
        low_level_combination[2 * self._block_number1: 2 * (self._block_number1 + 1)] = self._low_level_combination1
        low_level_combination[2 * self._block_number2: 2 * (self._block_number2 + 1)] = self._low_level_combination2
        return low_level_combination, high_level_combination

    def mean_reward(self, coefficients):
        reward = 0
        for i in range(2):
            reward += self._low_level_combination1[i] * coefficients[2 * self._block_number1 + i]
            reward += self._low_level_combination2[i] * coefficients[2 * self._block_number2 + i]
        reward += np.prod(self._low_level_combination1) * coefficients[8 + self._block_number1]
        reward += np.prod(self._low_level_combination2) * coefficients[8 + self._block_number2]
        return reward

    def __str__(self):
        return f"block 1: {self._block_number1}, low-level: {self._low_level_combination1}, block 2: {self._block_number2}, low-level: {self._low_level_combination2}"

    def __eq__(self, other):
        return (tuple(self._low_level_combination1) == tuple(other._low_level_combination1) and
                tuple(self._low_level_combination2) == tuple(other._low_level_combination2) and
                self._block_number1 == other._block_number1 and
                self._block_number2 == other._block_number2) or \
            (tuple(self._low_level_combination1) == tuple(other._low_level_combination2) and
             tuple(self._low_level_combination2) == tuple(other._low_level_combination1) and
             self._block_number1 == other._block_number2 and
             self._block_number2 == other._block_number1)

    def __hash__(self):
        return hash((tuple(self._low_level_combination1), tuple(self._low_level_combination2), self._block_number1,
                     self._block_number2))


def all_high_level_suggestions():
    high_level_combinations = list(product([-1, 1], repeat=4))
    high_level_suggestions = []
    for high_combination in high_level_combinations:
        high_level_suggestions.append(HighLevelSuggestion(high_combination))
    return high_level_suggestions


def all_low_level_suggestions(block_nr1, block_nr2):
    low_level_combinations = list(product([-1, 1], repeat=2))
    low_level_suggestions = []
    for low_level_combination1 in low_level_combinations:
        for low_level_combination2 in low_level_combinations:
            low_level_suggestions.append(
                LowLevelSuggestion(low_level_combination1, low_level_combination2, block_nr1, block_nr2))
    return low_level_suggestions


class Advisor:
    def __init__(self, block_nr1, block_nr2):
        self._low_level_block_nr1, self._low_level_block_nr2 = block_nr1, block_nr2
        self._selections = []
        self._coefficients = [0 for _ in range(12)]
        self._mean_reward = 100
        self._high_level_suggestions = all_high_level_suggestions()
        self._low_level_suggestions = all_low_level_suggestions(block_nr1, block_nr2)

    def combination_reward_estimate(self, combination):
        high_combination = high_level_combination(combination)
        value = 0.0
        for i in range(8):
            value += self._coefficients[i] * combination[i]
        for i in range(4):
            value += self._coefficients[8 + i] * high_combination[i]
        return value

    def best_combination(self, all_combinations):
        reward_estimates = [self.combination_reward_estimate(combination) for combination in all_combinations]
        best_combinations_indices = np.flatnonzero(reward_estimates == np.max(reward_estimates))
        return all_combinations[np.random.choice(best_combinations_indices)]

    def combination_probabilities(self, all_combinations):
        combination_reward_estimates = [self.combination_reward_estimate(combination) for combination in all_combinations]
        return stable_softmax(np.array(combination_reward_estimates))

    def sample_combination(self, all_combinations):
        combination_probabilities = self.combination_probabilities(all_combinations)
        combination_index = np.random.choice(len(all_combinations), p=combination_probabilities)
        return all_combinations[combination_index]

    def update_with_selection(self, selection):
        self._selections.append(selection)
        # compute coefficients (8 low-level and 4 high-level) via least squares
        input_variables = []
        output_variables = []
        for selection in self._selections:
            input_variable = tuple(selection.get_combination()) + tuple(
                high_level_combination(selection.get_combination()))
            input_variables.append(input_variable)
            reward = selection.get_reward() - self._mean_reward
            output_variables.append(reward)
        input_variables = np.array(input_variables)
        output_variables = np.reshape(np.array(output_variables), (len(output_variables), 1))
        self._coefficients = np.reshape(np.linalg.pinv(a=input_variables, rcond=0.00001) @ output_variables, 12)

    def selections_matrix_rank(self):
        input_variables = []
        for selection in self._selections:
            input_variable = tuple(selection.get_combination()) + tuple(
                high_level_combination(selection.get_combination()))
            input_variables.append(input_variable)
        input_variables = np.array(input_variables)
        return np.linalg.matrix_rank(input_variables)

    def sample_suggestion_high_level(self, all_combinations):
        sampled_combination = self.sample_combination(all_combinations)
        for suggestion in self._high_level_suggestions:
            if suggestion.is_matching_combination(sampled_combination):
                return suggestion
        return None

    def sample_suggestion_low_level(self, all_combinations):
        sampled_combination = self.sample_combination(all_combinations)
        for suggestion in self._low_level_suggestions:
            if suggestion.is_matching_combination(sampled_combination):
                return suggestion
        return None

    def best_suggestion_high_level(self, all_combinations):
        best_combination = self.best_combination(all_combinations)
        for suggestion in self._high_level_suggestions:
            if suggestion.is_matching_combination(best_combination):
                return suggestion
        return None

    def best_suggestion_low_level(self, all_combinations):
        best_combination = self.best_combination(all_combinations)
        for suggestion in self._low_level_suggestions:
            if suggestion.is_matching_combination(best_combination):
                return suggestion
        return None

    def all_best_combinations(self, all_combinations):
        reward_estimates = [self.combination_reward_estimate(combination) for combination in all_combinations]
        best_combinations_indices = np.flatnonzero(reward_estimates == np.max(reward_estimates))
        return [all_combinations[i] for i in best_combinations_indices]

    def all_best_suggestions_high_level(self, all_combinations):
        best_combinations = self.all_best_combinations(all_combinations)
        best_suggestions = []
        for suggestion in self._high_level_suggestions:
            for combination in best_combinations:
                if suggestion.is_matching_combination(combination):
                    best_suggestions.append(suggestion)
                    break
        return best_suggestions

    def all_best_suggestions_low_level(self, all_combinations):
        best_combinations = self.all_best_combinations(all_combinations)
        best_suggestions = []
        for suggestion in self._low_level_suggestions:
            for combination in best_combinations:
                if suggestion.is_matching_combination(combination):
                    best_suggestions.append(suggestion)
                    break
        return best_suggestions

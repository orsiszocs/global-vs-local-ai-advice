"""
Defines reward landscapes and selections for the bandit experiment.
- Selection: wraps colour combination & reward
- Landscape: computes and scales rewards for colour combinations

Utilities:
- gaussian_random: noise generator
- generate_random_landscape
- load_landscapes
"""

import random
import numpy as np
from itertools import product, combinations
import json
from .advisor import high_level_combination


def gaussian_random(variance):
    # same gaussian random as the one implemented in javascript
    standard_dev = np.sqrt(variance)
    u = 1 - np.random.random()
    v = np.random.random()
    z = np.sqrt(-2.0 * np.log(u)) * np.cos(2.0 * np.pi * v)
    return z * standard_dev


class Selection:
    def __init__(self, combination, reward):
        self._combination = combination
        self._reward = reward

    def __str__(self):
        return f"combination: {self._combination}, reward: {self._reward}"

    def equals(self, other):
        return tuple(self._combination) == tuple(other.get_combination())

    def get_reward(self):
        return self._reward

    def get_combination(self):
        return self._combination

    def get_high_level_combination(self):
        return high_level_combination(self._combination)

    def get_reward_in_percentage(self, min_reward, max_reward):
        return (self._reward - min_reward) / (max_reward - min_reward) * 100


class Landscape:
    def combination_unscaled_reward(self, combination):
        value = 0
        high_combination = high_level_combination(combination)
        for i in range(4):
            value += self._coefficients_high[i] * high_combination[i]
        for i in range(8):
            value += self._coefficients_low[i] * combination[i]
        return value

    def __init__(self, coefficients_low, coefficients_high, block_nr1, block_nr2, id):
        # init the coefficients and the block numbers
        self._combinations = list(product([-1, 1], repeat=8))
        self._coefficients_low = coefficients_low
        self._coefficients_high = coefficients_high
        self._block_nr1 = block_nr1
        self._block_nr2 = block_nr2
        self._id = id
        self._unscaled_rewards = [self.combination_unscaled_reward(combination) for combination in self._combinations]

        self._average_reward = 100
        self._gaussian_variance = 4
        self._min_reward = None
        self._max_reward = None
        self._scalar = None

    def init_scaled_rewards(self):
        # initialise reward scaling
        self._min_reward = np.random.randint(20, 70)
        # find the scalar to achieve this minimum reward
        self._scalar = (self._min_reward - self._average_reward) / np.min(self._unscaled_rewards)
        scaled_rewards = [self._scalar * reward + self._average_reward for reward in self._unscaled_rewards]
        self._max_reward = np.max([np.rint(reward) for reward in scaled_rewards])

    def init_scaled_rewards_with_min_reward(self, min_reward):
        self._min_reward = min_reward
        self._scalar = (self._min_reward - self._average_reward) / np.min(self._unscaled_rewards)
        scaled_rewards = [self._scalar * reward + self._average_reward for reward in self._unscaled_rewards]
        self._max_reward = np.max([np.rint(reward) for reward in scaled_rewards])

    def get_max_reward(self):
        return self._max_reward

    def get_min_reward(self):
        return self._min_reward

    def get_combinations(self):
        return self._combinations

    def get_unscaled_rewards(self):
        return self._unscaled_rewards

    def get_random_combination(self):
        return np.random.choice(self._combinations)

    def get_coefficients_low(self):
        return self._coefficients_low

    def get_coefficients_high(self):
        return self._coefficients_high

    def get_block_nr1(self):
        return self._block_nr1

    def get_block_nr2(self):
        return self._block_nr2

    def get_id(self):
        return self._id

    def selection_with_noisy_reward(self, combination):
        unscaled_reward = self.combination_unscaled_reward(combination)
        scaled_reward = self._scalar * unscaled_reward + self._average_reward
        noisy_reward = np.rint(scaled_reward + gaussian_random(self._gaussian_variance))
        clipped_reward = max(self._min_reward, min(self._max_reward, noisy_reward))
        selection = Selection(combination, clipped_reward)
        return selection

    def selection_with_non_noisy_reward(self, combination):
        unscaled_reward = self.combination_unscaled_reward(combination)
        scaled_reward = np.rint(self._scalar * unscaled_reward + self._average_reward)
        clipped_reward = max(self._min_reward, min(self._max_reward, scaled_reward))
        selection = Selection(combination, clipped_reward)
        return selection

    def suggestion_value(self, suggestion):
        value = 0.0
        low_level_combination, high_level_combination = suggestion.suggestion_values()
        for i in range(4):
            if high_level_combination[i] is not None:
                value += self._coefficients_high[i] * high_level_combination[i]
        for i in range(8):
            if low_level_combination[i] is not None:
                value += self._coefficients_low[i] * low_level_combination[i]
        return value

    def scaled_suggestion_value(self, suggestion):
        unscaled_value = self.suggestion_value(suggestion)
        scaled_value = self._scalar * unscaled_value + self._average_reward
        clipped_value = max(self._min_reward, min(self._max_reward, scaled_value))
        return clipped_value

    def suggestion_value_in_percentage(self, suggestion):
        scaled_value = self.scaled_suggestion_value(suggestion)
        return (scaled_value - self._min_reward) / (self._max_reward - self._min_reward) * 100


def generate_random_landscape():
    # add the 6 linear equations that ensure equal variance for low- and high-level advice
    # (these 6 equations have rank 4)
    block_pairs = list(combinations([0, 1, 2, 3], 2))
    coefficient_matrix = []
    for i in range(len(block_pairs)):
        matrix_line = []
        for j in range(4):
            if j in block_pairs[i]:
                matrix_line.append(0)
                matrix_line.append(0)
            else:
                matrix_line.append(1)
                matrix_line.append(1)
        for j in range(4):
            if j in block_pairs[i]:
                matrix_line.append(-1)
            else:
                matrix_line.append(0)
        coefficient_matrix.append(matrix_line)
    # add the 8 linear equations that set the values of the low-level coefficients
    for i in range(8):
        coefficient_matrix.append([0] * 12)
        coefficient_matrix[-1][i] = 1
    coefficient_matrix = np.matrix(coefficient_matrix)
    # add the dependent values
    dependent_values = [0.0] * 6
    for i in range(8):
        # draw the squared coefficients from the squared uniform distribution
        dependent_values.append(np.random.uniform(low=0.0, high=1.0) ** 2)
    coefficients = np.linalg.lstsq(coefficient_matrix, dependent_values, rcond=None)[0]
    for i in range(len(coefficients)):
        if coefficients[i] < 0.0:
            # try again if there is a negative coefficient
            return generate_random_landscape()
        # take the root of the coefficients
        coefficients[i] = np.sqrt(coefficients[i])
    block_nrs = np.random.choice([0, 1, 2, 3], 2, replace=False)
    # randomly choose the signs of the low-level coefficients
    coefficient_scalar = random.choice(list(product([-1, 1], repeat=8)))
    coefficients_low = [coefficient_scalar[i] * coefficients[i] for i in range(8)]
    # set the sign of the high-level coefficients such that best high-level setting corresponds
    # to the best overall setting
    coefficients_high = coefficients[8:]
    for i in range(4):
        if coefficients_high[i] > abs(coefficients_low[2 * i]) or coefficients_high[i] > abs(
                coefficients_low[2 * i + 1]):
            coefficients_high[i] = np.random.choice([-1, 1]) * coefficients_high[i]
        else:
            same_low_coefficient_settings_sum = abs(coefficients_low[2 * i] + coefficients_low[2 * i + 1])
            different_low_coefficient_settings_sum = abs(-coefficients_low[2 * i] + coefficients_low[2 * i + 1])
            if same_low_coefficient_settings_sum < different_low_coefficient_settings_sum:
                coefficients_high[i] = -coefficients_high[i]
    return Landscape(coefficients_low, coefficients_high, int(block_nrs[0]), int(block_nrs[1]), 0)


def load_landscapes(filename):
    with open(filename, "r", encoding="utf-8") as file:
        loaded_data = json.load(file)
    landscapes = []
    for loaded_trio in loaded_data:
        for loaded_landscape in loaded_trio:
            landscape = Landscape(loaded_landscape["coefficients_low"], loaded_landscape["coefficients_high"],
                                  loaded_landscape["block_nr1"], loaded_landscape["block_nr2"], loaded_landscape["id"])
            landscapes.append(landscape)
    return landscapes

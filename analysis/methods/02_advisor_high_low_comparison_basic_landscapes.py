"""
Saves the AI values of the global and local advisors after being fed random (combination, reward) pairs
from randomly generated landscapes. Generates landscapes in batches of 30, and saves each batch in a
separate JSON file.
"""

from common import Advisor, generate_random_landscape
import numpy as np
from tqdm import tqdm
from copy import deepcopy
import json


def mean_advisor_rewards_after_random_selections(landscapes, nr_trials, advisor_type):
    # returns a list (for either high- or low-level) with the reward received (in percentage)
    # by randomly following the advisor's suggestion
    # item 0 = the reward received after the advisor is fed 0 random (combination, reward) pairs
    # item 1 = the reward received after the advisor is fed 1 random (combination, reward) pair
    # ...
    # item 19 = the reward received after the advisor is fed nr_trials - 1 random (combination, reward) pairs
    rounds_rewards = []
    for landscape in landscapes:
        all_combinations = landscape.get_combinations()
        advisor = Advisor(landscape.get_block_nr1(), landscape.get_block_nr2())
        round_rewards = []
        for _ in range(nr_trials):
            suggestion = advisor.sample_suggestion_high_level(all_combinations) if advisor_type == "high" else advisor.sample_suggestion_low_level(all_combinations)
            suggestion_value = landscape.suggestion_value_in_percentage(suggestion)
            round_rewards.append(suggestion_value)
            random_combination = all_combinations[np.random.randint(low=0, high=len(all_combinations))]
            random_selection = landscape.selection_with_noisy_reward(random_combination)
            advisor.update_with_selection(random_selection)
        rounds_rewards.append(round_rewards)
    return np.mean(rounds_rewards, axis=0)


batch_nrs = [i for i in range(0, 10)]
batch_size = 30
repeat_landscape = 300

nr_trials = 20

for batch_nr in batch_nrs:
    batch_json = []
    for i in tqdm(range(batch_size)):
        landscape = generate_random_landscape()
        landscapes = []
        for _ in range(repeat_landscape):
            landscape_copy = deepcopy(landscape)
            landscape_copy.init_scaled_rewards()
            landscapes.append(landscape_copy)
        high_rewards = mean_advisor_rewards_after_random_selections(landscapes, nr_trials, "high")
        low_rewards = mean_advisor_rewards_after_random_selections(landscapes, nr_trials, "low")
        batch_json.append({"coefficients_low": list(landscape.get_coefficients_low()),
                            "coefficients_high": list(landscape.get_coefficients_high()),
                            "block_nr1": landscape.get_block_nr1(),
                            "block_nr2": landscape.get_block_nr2(),
                            "high_rewards": list(high_rewards),
                           "low_rewards": list(low_rewards)})
    with open(f"outputs/advisor_high_low_comparison_basic_landscapes/{batch_nr}.json", "w",
                  encoding="utf-8") as file:
        json.dump(batch_json, file, ensure_ascii=False, indent=4)

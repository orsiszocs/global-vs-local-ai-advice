"""
Saves the AI values received by the global and local advisors after being fed random (combination, reward) pairs
from the preselected landscapes. Loads landscapes from a JSON file, and saves results in a new JSON file.
"""

from common import Advisor, Landscape
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
            suggestion = advisor.sample_suggestion_high_level(
                all_combinations) if advisor_type == "high" else advisor.sample_suggestion_low_level(all_combinations)
            suggestion_value = landscape.suggestion_value_in_percentage(suggestion)
            round_rewards.append(suggestion_value)
            random_combination = all_combinations[np.random.randint(low=0, high=len(all_combinations))]
            random_selection = landscape.selection_with_noisy_reward(random_combination)
            advisor.update_with_selection(random_selection)
        rounds_rewards.append(round_rewards)
    return np.mean(rounds_rewards, axis=0)


def load_landscape_trios():
    with open(f"landscapes/landscape_trios_100_from_100000.json", "r", encoding="utf-8") as file:
        landscape_trios_json = json.load(file)
    landscape_trios = []
    for trio_json in landscape_trios_json:
        landscape_trio = []
        for landscape_json in trio_json["trio"]:
            landscape = Landscape(landscape_json["coefficients_low"], landscape_json["coefficients_high"],
                                  landscape_json["block_nr1"], landscape_json["block_nr2"], 0)
            landscape_trio.append(landscape)
        landscape_trios.append(landscape_trio)
    return landscape_trios


repeat_landscape = 300
nr_trials = 20

trios = load_landscape_trios()
results_json = []
for trio in tqdm(trios):
    landscapes = []
    for _ in range(repeat_landscape):
        for i in range(3):
            landscape_copy = deepcopy(trio[i])
            landscape_copy.init_scaled_rewards()
            landscapes.append(landscape_copy)
    high_rewards = mean_advisor_rewards_after_random_selections(landscapes, nr_trials, "high")
    low_rewards = mean_advisor_rewards_after_random_selections(landscapes, nr_trials, "low")
    trio_json = []
    for landscape in trio:
        trio_json.append({"coefficients_low": list(landscape.get_coefficients_low()),
                          "coefficients_high": list(landscape.get_coefficients_high()),
                          "block_nr1": landscape.get_block_nr1(),
                          "block_nr2": landscape.get_block_nr2()})
    results_json.append({"trio": trio_json,
                         "high_rewards": list(high_rewards),
                         "low_rewards": list(low_rewards)})

with open(
        "outputs/advisor_high_low_comparison_preselected_landscapes/"
        "advisor_high_low_comparison_preselected_landscapes.json",
        "w",
        encoding="utf-8") as file:
    json.dump(results_json, file, ensure_ascii=False, indent=4)

"""
Simulates counterfactual advisor performance on participant data.
For each observed trial, draws 100 counterfactual suggestions from the opposite AI type.
Measures the average value of the advisor's suggestions and
the frequency with which the advisor's suggestions are followed.
"""



import json
from itertools import product
import statistics
from tqdm import tqdm
from common import Advisor, Selection


def ai_suggestion_reward(landscape_data, suggestion):
    reward_scalar = landscape_data["rewardScalar"]
    coefficients_low = landscape_data["coefficientsLow"]
    coefficients_high = landscape_data["coefficientsHigh"]
    min_reward = landscape_data["minReward"]
    max_reward = landscape_data["maxReward"]
    low_suggestion, high_suggestion = suggestion.suggestion_values()
    ai_reward = 0
    for i in range(len(low_suggestion)):
        if low_suggestion[i] is not None:
            ai_reward += low_suggestion[i] * coefficients_low[i]
    for i in range(len(high_suggestion)):
        if high_suggestion[i] is not None:
            ai_reward += high_suggestion[i] * coefficients_high[i]
    ai_reward = ai_reward * reward_scalar + 100
    ai_reward = max(min_reward, min(max_reward, ai_reward))
    ai_reward = (ai_reward - min_reward) / (max_reward - min_reward) * 100
    return ai_reward


def counterfactual_ai_followed_frequencies_rewards(landscape_data, trials, ai_type):
    advisor = Advisor(landscape_data["blockNr1"], landscape_data["blockNr2"])
    repeat_times = 100
    all_combinations = list(product([-1, 1], repeat=8))
    followed_frequencies = []
    ai_rewards = []
    for trial in trials:
        reward = trial["noisyReward"]
        combination = trial["combination"]
        repeat_frequencies = []
        repeat_ai_rewards = []
        for i in range(repeat_times):
            if ai_type == "low":
                ai_suggestion_other = advisor.sample_suggestion_high_level(all_combinations)
            else:
                ai_suggestion_other = advisor.sample_suggestion_low_level(all_combinations)
            if ai_suggestion_other.is_matching_combination(combination):
                repeat_frequencies.append(100)
            else:
                repeat_frequencies.append(0)
            repeat_ai_rewards.append(ai_suggestion_reward(landscape_data, ai_suggestion_other))
        followed_frequencies.append(statistics.mean(repeat_frequencies))
        ai_rewards.append(statistics.mean(repeat_ai_rewards))
        advisor.update_with_selection(Selection(combination, reward))
    return followed_frequencies, ai_rewards


data_path = "data/ColourCombo_101_flagged.json"
counterfactual_ai_json = {}

with (open(data_path) as file):
    all_data = json.load(file)
    for participant_data in tqdm(all_data):
        if not participant_data["outlier"]:
            rounds = participant_data["experimentData"]["roundsData"]
            rounds_json = []
            for round_ in rounds:
                landscape = round_["landscape"]
                trials = round_["trials"]
                if round_["roundType"] != "assisted":
                    continue
                ai_followed_frequencies, ai_rewards = \
                    counterfactual_ai_followed_frequencies_rewards(landscape, trials,
                                                                   participant_data["experimentData"]
                                                                   ["recommendationType"])
                rounds_json.append({
                    "landscape": landscape,
                    "aiFollowedFrequencies": ai_followed_frequencies,
                    "aiRewards": ai_rewards
                })
            counterfactual_ai_json[participant_data["id"]] = rounds_json
    json.dump(counterfactual_ai_json, open("outputs/counterfactual_advisor/counterfactual_advisor.json", "w"))

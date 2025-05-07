"""
Validates the saved experimental data. Checks the following:
- landscapes are non-repeating
- landscapes are chosen in trios
- the number and types of rounds are correct (1 tutorial + 3 individual + 6 assisted + 3 individual)
- the noisy rewards are reasonable (between min and max reward, on average close to the deterministic reward)
- the bonus payment is correctly computed
- AI suggestions are as expected (the coefficients are learned correctly, the sampled suggestion is often the argmax)
- all actions are saved (experiment start, clicks, ...)
- the actions and the selections are consistent
- the AI ratings are saved (1-7 range)
"""

import json
from itertools import product
import datetime
from common import Landscape, Advisor, Selection, HighLevelSuggestion, LowLevelSuggestion
from tqdm import tqdm

data_path = "data/ColourCombo_101_flagged.json"


def check_ai_ratings_saved(participant_data):
    for round_data in participant_data["roundsData"]:
        if round_data["roundType"] == "assisted":
            # the usefulness rating is in the 1-7 range
            assert 1 <= int(round_data["usefulAiRound"]) <= 7


def check_landscapes_chosen_in_trios(participant_data):
    rounds_data = participant_data["roundsData"]
    landscape_ids = [rounds_data["landscape"]["id"] for rounds_data in rounds_data][1:]
    for i in range(0, len(landscape_ids), 3):
        # landscapes are in the same trio based on id
        assert landscape_ids[i] // 3 == landscape_ids[i + 1] // 3 == landscape_ids[i + 2] // 3


def check_noisy_rewards(participant_data):
    rounds_data = participant_data["roundsData"]
    sum_difference_fixed_noisy_reward = 0
    for round_data in rounds_data:
        landscape_data = round_data["landscape"]
        # min reward has to be between 15 and 60
        assert 20 <= landscape_data["minReward"] <= 70
        trials_data = round_data["trials"]
        landscape = Landscape(landscape_data["coefficientsLow"], landscape_data["coefficientsHigh"],
                              landscape_data["blockNr1"], landscape_data["blockNr2"], landscape_data["id"])
        landscape.init_scaled_rewards_with_min_reward(landscape_data["minReward"])
        for trial_data in trials_data:
            noisy_reward = trial_data["noisyReward"]
            combination = trial_data["combination"]
            # noisy reward has to be between min and max reward
            assert landscape_data["minReward"] <= noisy_reward <= landscape_data["maxReward"]
            sum_difference_fixed_noisy_reward += landscape.selection_with_non_noisy_reward(
                combination).get_reward() - noisy_reward
    mean_difference_fixed_noisy_reward = sum_difference_fixed_noisy_reward / len(rounds_data) / len(
        rounds_data[0]["trials"])
    # the mean difference between the fixed noisy reward and the actual noisy reward has to be small
    assert abs(mean_difference_fixed_noisy_reward) <= 1


def check_distinct_landscapes(participant_data):
    rounds_data = participant_data["roundsData"]
    landscape_ids = [rounds_data["landscape"]["id"] for rounds_data in rounds_data]
    # there can be no repeating landscapes
    assert len(landscape_ids) == len(set(landscape_ids))


def check_bonus_rewards(participant_data):
    max_bonus = 3.6
    max_bonus_round = max_bonus / (len(participant_data["roundsData"]) - 1)
    total_bonus_payment = 0
    for round_data in participant_data["roundsData"][1:]:
        # exclude the tutorial round
        round_score = 0
        for trial_data in round_data["trials"]:
            round_score += trial_data["noisyReward"]
        round_score /= len(round_data["trials"])
        round_score_percentage = (round_score - round_data["landscape"]["minReward"]) / (
                round_data["landscape"]["maxReward"] - round_data["landscape"]["minReward"])
        if round_score_percentage < 0.5:
            round_bonus = 0
        else:
            round_bonus = (round_score_percentage - 0.5) / 0.5 * max_bonus_round
        # for each round, the bonus payment has to be correct
        assert abs(round_bonus - round_data["bonusPayment"]) < 0.0001
        total_bonus_payment += round_bonus
    # the total bonus payment has to be correct
    assert abs(total_bonus_payment - participant_data["bonusReward"]) <= 0.5


def check_number_rounds(participant_data):
    rounds_data = participant_data["roundsData"]
    # there have to be 13 rounds (1 tutorial + 3 individual + 6 assisted + 3 individual)
    assert len(rounds_data) == 13
    assert rounds_data[0]["roundType"] == "tutorial"
    for i in range(1, 4):
        assert rounds_data[i]["roundType"] == "individual"
    for i in range(4, 10):
        assert rounds_data[i]["roundType"] == "assisted"
    for i in range(10, 13):
        assert rounds_data[i]["roundType"] == "individual"


def check_correct_ai_suggestions(participant_data):
    advice_type = participant_data["recommendationType"]
    all_combinations = list(product([-1, 1], repeat=8))
    # the saved suggestion often has to be among the best suggestions
    total_suggestions = 0
    matching_suggestions = 0
    for round_data in participant_data["roundsData"]:
        if round_data["roundType"] == "assisted":
            landscape_data = round_data["landscape"]
            advisor = Advisor(landscape_data["blockNr1"], landscape_data["blockNr2"])
            for trial_data in round_data["trials"]:
                total_suggestions += 1
                combination = trial_data["combination"]
                saved_suggestion_low, saved_suggestion_high = trial_data["suggestion"]
                # the saved coefficients have to be the same as the expected advisor coefficients
                for i in range(len(advisor._coefficients)):
                    assert abs(advisor._coefficients[i] - trial_data["coefficients"][i]) < 0.0001
                # check if the saved suggestion is among the best suggestions
                if advice_type == "high":
                    saved_suggestion = HighLevelSuggestion(saved_suggestion_high)
                    expected_suggestions = advisor.all_best_suggestions_high_level(all_combinations)
                    if saved_suggestion in expected_suggestions:
                        matching_suggestions += 1
                else:
                    block_nr1 = landscape_data["blockNr1"]
                    block_nr2 = landscape_data["blockNr2"]
                    saved_suggestion = LowLevelSuggestion(saved_suggestion_low[2 * block_nr1: 2 * block_nr1 + 2],
                                                          saved_suggestion_low[2 * block_nr2: 2 * block_nr2 + 2],
                                                          block_nr1, block_nr2)
                    expected_suggestions = advisor.all_best_suggestions_low_level(all_combinations)
                    if saved_suggestion in expected_suggestions:
                        matching_suggestions += 1
                # update the advisor with the selection
                advisor.update_with_selection(Selection(combination, trial_data["noisyReward"]))
    # the saved suggestion has to be among the best suggestions in at least 50% of the cases
    assert matching_suggestions / total_suggestions >= 0.50


def check_all_actions_saved(participant_data):
    # check that there are 20 trials per round
    for round_data in participant_data["roundsData"]:
        assert len(round_data["trials"]) == 20
    # check that the key actions are saved
    all_possible_actions = [action_data["action"] for action_data in participant_data["allActionsData"]]
    all_possible_actions = list(set(all_possible_actions))
    key_actions = ["start experiment", "go to solo comprehension", "comprehension check solo", "start first round",
                   "start next round", "go to ai instructions", "comprehension check ai", "start first ai round",
                   "go to final quiz", "go to end page", "square clicked"]
    for key_action in key_actions:
        try:
            assert key_action in all_possible_actions
        except:
            if key_action == "square clicked":
                print("no square clicked in case of participant " + str(participant_data["prolificId"]))
            else:
                raise AssertionError


def check_actions_and_selections_consistent(participant_data):
    actions_data = participant_data["allActionsData"]
    # selection either equal to original random combination, or last clicked square action or last copy action
    action_index = 0
    for round_data in participant_data["roundsData"]:
        # skip this check for the tutorial round
        if round_data["roundType"] == "tutorial":
            continue
        initial_combination = round_data["landscape"]["initialCombination"]
        for trial_data in round_data["trials"]:
            trial_timestamp = datetime.datetime.strptime(trial_data["timestamp"], "%Y-%m-%dT%H:%M:%S.%fZ")
            # find the last saved action right before the selection
            while trial_timestamp > datetime.datetime.strptime(actions_data[action_index + 1]["timestamp"],
                                                               "%Y-%m-%dT%H:%M:%S.%fZ"):
                action_index += 1
            # the selection has to be consistent with the last saved action
            # it has to either correspond to the combination of the last "square clicked" or "combo copied" action
            if actions_data[action_index]["action"] in ["square clicked", "combo copied"]:
                assert tuple(trial_data["combination"]) == tuple(actions_data[action_index]["combination"])
            # or it has to correspond to the initial random combination
            else:
                assert tuple(trial_data["combination"]) == tuple(initial_combination)


with open(data_path) as file:
    all_data = json.load(file)
    participants_data = all_data
    for participant_data in tqdm(participants_data):
        if not participant_data["outlier"]:
            participant_data = participant_data["experimentData"]
            check_distinct_landscapes(participant_data)
            check_landscapes_chosen_in_trios(participant_data)
            check_number_rounds(participant_data)
            check_noisy_rewards(participant_data)
            check_bonus_rewards(participant_data)
            check_correct_ai_suggestions(participant_data)
            check_all_actions_saved(participant_data)
            check_actions_and_selections_consistent(participant_data)
            check_ai_ratings_saved(participant_data)

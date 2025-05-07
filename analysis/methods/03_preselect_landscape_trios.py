"""
Preselects 100 landscape trios from 100,000 random landscapes based on the sum of the absolute differences between the
sorted global and local suggestion values weighted by the frequency of the suggestions.
"""

import numpy as np
import json
from tqdm import tqdm
from common import all_low_level_suggestions, all_high_level_suggestions, generate_random_landscape


def sorted_global_local_suggestion_means(landscape):
    high_level_suggestions = all_high_level_suggestions()
    high_suggestion_means = []
    for suggestion in high_level_suggestions:
        high_suggestion_mean = landscape.suggestion_value(suggestion)
        high_suggestion_means.append(high_suggestion_mean)
    high_suggestion_means.sort()
    low_level_suggestions = all_low_level_suggestions(landscape.get_block_nr1(), landscape.get_block_nr2())
    low_suggestion_means = []
    for suggestion in low_level_suggestions:
        low_suggestion_mean = landscape.suggestion_value(suggestion)
        low_suggestion_means.append(low_suggestion_mean)
    low_suggestion_means.sort()
    return high_suggestion_means, low_suggestion_means


def weighted_global_local_means_abs_difference_sum(landscapes):
    global_means_sum = np.zeros(16)
    local_means_sum = np.zeros(16)
    weights = np.array(list(reversed([58.78557500000001, 11.128025000000001, 7.1568, 4.552925, 3.4429749999999997,
                                      2.6847250000000003, 2.1835500000000003, 1.8658499999999996, 1.6677750000000002,
                                      1.4245, 1.2241750000000002, 1.0107249999999999, 0.880725, 0.7597499999999999,
                                      0.693125, 0.5388])))
    for landscape in landscapes:
        global_means, local_means = sorted_global_local_suggestion_means(landscape)
        global_means_sum += np.array(global_means)
        local_means_sum += np.array(local_means)
    return np.sum(abs(global_means_sum - local_means_sum) * weights)


nr_trios = 100
total_trios = 100000

landscape_trios = []
for _ in tqdm(range(total_trios)):
    landscape1 = generate_random_landscape()
    landscape2 = generate_random_landscape()
    landscape3 = generate_random_landscape()
    landscape1.init_scaled_rewards()
    landscape2.init_scaled_rewards()
    landscape3.init_scaled_rewards()
    trio_score = weighted_global_local_means_abs_difference_sum([landscape1, landscape2, landscape3])
    if len(landscape_trios) < nr_trios:
        landscape_trios.append({"landscape1": landscape1, "landscape2": landscape2, "landscape3": landscape3,
                                "score": trio_score})
    else:
        max_score = max([trio["score"] for trio in landscape_trios])
        if trio_score < max_score:
            max_score_index = [trio["score"] for trio in landscape_trios].index(max_score)
            landscape_trios[max_score_index] = {"landscape1": landscape1, "landscape2": landscape2,
                                                "landscape3": landscape3, "score": trio_score}

landscape_trios_json = []
landscape_id = 0
for trio in landscape_trios:
    landscapes_json = []
    for landscape in [trio["landscape1"], trio["landscape2"], trio["landscape3"]]:
        landscapes_json.append({"coefficients_low": list(landscape.get_coefficients_low()),
                                "coefficients_high": list(landscape.get_coefficients_high()),
                                "block_nr1": landscape.get_block_nr1(),
                                "block_nr2": landscape.get_block_nr2()})
    landscape_trios_json.append({"trio": landscapes_json,
                                 "score": trio["score"]})

with open(f"landscapes/landscape_trios_{nr_trios}_from_{total_trios}.json", "w",
          encoding="utf-8") as file:
    json.dump(landscape_trios_json, file, ensure_ascii=False, indent=4)

# Global vs. Local Advice in Human-AI interaction

A code and data repository accompanying Szőcs, O., Zhou, H., & Wu, C. M. (2025). *The Forest for the Trees: Global vs. Local Advice in Human-AI Interaction*.
<!-- >TODO: link paper -->

## Table of contents

- [General](#general)
    - [Project overview](#project-overview)
    - [Installation](#installation)
    - [Dataset](#dataset)
- [Experiment code](#experiment-code)
    - [Setup](#setup)
    - [Running the task](#running-the-task)
- [Analysis code](#analysis-code)
    - [Setup](#setup-1)
    - [Methods pipeline](#methods-pipeline)
    - [Results pipeline](#results-pipeline)
- [Questions and issues](#questions-and-issues)

## General

### Project overview

This repository contains everything you need to reproduce our study on global (high-level) vs. local (low-level) AI advice in a hierarchical decision-making task. It includes:

- The HTML/JS/PHP code for running the colour-configuration experiment.  
- Raw and processed participant data (JSON).
- Scripts and notebooks to generate the reward landscapes used in the experiment.
- Analysis scripts and notebooks to clean, analyse, and visualise the data.  

### Installation

```bash
   git clone https://github.com/orsiszocs/global-vs-local-ai-advice.git
   cd global-vs-local-ai-advice
```

[Experiment code](#experiment-code) and [Analysis code](#analysis-code) have their own setup steps below. The former refers to the contents of the `experiment/` folder, while the latter to the contents of the `analysis/` folder.

### Dataset

The anonymised dataset is stored as an array of participant objects in `analysis/data/ColourCombo_101_flagged.json`. Each object has this general structure:

```js
{
    "id": "51>56",
    "workerID": "anon",
    "assignmentID": "anon",
    "experimentData": {
        "age": "34",
        "gender": 0,
        "usefulAi": 7,
        "followedAi": 7,
        "prolificId": "anon",
        "roundsData": [
            ..., {
            "trials": [{
                "timestamp": "2025-01-13T20:18:30.735Z",
                "suggestion": [[0, 0, 0, 0, 0, 0, 0, 0], [-1, 1, -1, 1]],
                "combination": [1, -1, 1, 1, 1, -1, 1, 1],
                "noisyReward": 111,
                "coefficients": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                ...],
            "landscape": {
                "id": 42,
                "blockNr1": 2,
                "blockNr2": 0,
                "maxReward": 191,
                "minReward": 29,
                "rewardScalar": 17.307808543287482,
                "coefficientsLow": [-0.34809894829249627, ...],
                "coefficientsHigh": [0.5196949568663821, ...],
                "initialCombination": [1, -1, 1, 1, 1, -1, -1, 1]
                },
            "roundType": "assisted",
            "lowColour1": "#dcbeff",
            "lowColour2": "#800000",
            "highColour1": "#ffe119",
            "highColour2": "#4363d8",
            "bonusPayment": 0.23833333333333329,
            "relativeScore": 0.8972222222222221,
            "usefulAiRound": "7"
        },
        ...], 
        "strategyAi": "I looked at the colours they suggested and just did trial and error and found i'd  find the colour combination quicker.",
        "bonusReward": 1.22,
        "strategyOwn": "it was just a case of trial and error. trying different combinations",
        "allActionsData": [..., {
            "action": "square clicked",
            "timestamp": "2025-01-13T20:06:46.813Z",
            "combination": [1, 1, 1, 1, -1, 1, 1, 1]
            }, ...],
        "recommendationType": "high",
        "aiInstructionColours": {
            "lowColour1": "#4363d8",
            "lowColour2": "#800000",
            "highColour1": "#ffe119",
            "highColour2": "#dcbeff"
        }
    },
    "reward": "1.22",
    "task_start": "2025-01-13 20:09:03",
    "task_end": "2025-01-13 20:33:20",
    "assigned": "1",
    "completed": "1",
    "outlier": false
}
```

**Field explanations**
- `id` Participant identifier combining cohort and start order.
- `reward` Bonus payment (£) obtained by the participant.
- `outlier` Boolean flag marking whether this participant's data was an outlier.
- `experimentData.gender` Encoded as `0 = Female`, `1 = Male`, and `2 = Other`.
- `experimentData.usefulAi` Participant’s agreement with &ldquo;The AI assistant was useful.&rdquo; on a 1-7 Likert scale. 
- `experimentData.followedAi` Participant’s agreement with &ldquo;I followed the AI’s suggestions.&rdquo; on a 1-7 Likert scale. 
- `experimentData.roundsData` Participant's rounds as an array.
- `experimentData.roundsData[].trials` Trials from a round as an array.
- `experimentData.roundsData[].trials[].suggestion` The low-level and high-level features suggested by the AI advisor.
- `experimentData.roundsData[].trials[].combination` Participant's selection.
- `experimentData.roundsData[].trials[].noisyReward` Participant's reward.
- `experimentData.roundsData[].trials[].coefficients` The AI advisor's coefficients when generating its suggestion.
- `experimentData.roundsData[].landscape.blockNr1` One of the two rectangles that the local AI refers to.
- `experimentData.roundsData[].landscape.coefficientsHigh` The high-level coefficients of this landscape as an array.
- `experimentData.roundsData[].landscape.initialCombination` The random combination shown to the participant in the beginning of the round.
- `experimentData.roundsData[].roundType` Round type: `"assisted"` (AI-assisted), `"individual"` (no AI support), or `"tutorial"` (the very first round).
- `experimentData.roundsData[].lowColour2` One of the square colours.
- `experimentData.roundsData[].usefulAiRound` Participant’s agreement with &ldquo;The AI assistant was useful in this round.&rdquo; on a 1-7 Likert scale.
- `experimentData.strategyAi` Participant's response to &ldquo;What strategies did you use when completing the rounds with the help of the AI?&rdquo;
- `experimentData.strategyOwn` Participant's response to &ldquo;What strategies did you use when completing the rounds on your own?&rdquo;
- `experimentData.recommendationType` AI condition: `"high"` (global) or `"low"` (local).


## Experiment code

### Setup

1. Prerequisites
    - PHP ≥ 7.2
    - MySQL (or MariaDB) ≥ 5.7
    - A local web-server environment of your choice (e.g. XAMPP, MAMP, LAMP, Docker, etc.)
    - A modern browser with ES module support
2. Launch your preferred PHP + MySQL stack so that PHP pages can run and connect to a database.
3. Serve the experiment by either:
    - Deploying the `experiment/` folder into your web-root. For example:
        - XAMPP (Windows): `C:\xampp\htdocs\experiment`
        - MAMP (Mac): `/Applications/MAMP/htdocs/experiment`
    - Or using PHP's built-in server from the repo root:

        `php -S localhost:8000 -t experiment/`
4. Set up the database
    - Create a database named `db` (or pick your own name).
    - Use `experiment/create_table.sql` to set up the `ColourCombo` table.
5. Configure `databasecall.php`
    - Open `experiment/databasecall.php` and find the TODO block. Update it with your host/user/password/database.

### Running the task

1. Open in your browser:
    
    `http://localhost/experiment/experiment.html?STUDY_ID=test&PROLIFIC_PID=test&SESSION_ID=test`
2. The page will auto-assign the AI condition. At the end of the experiment, a row is populated in the `ColourCombo` table.

## Analysis code

### Setup

1. Prerequisites
    - Conda or Miniconda
    - Python 3.11+
2. Create and activate environment
    ```bash
    cd analysis
    conda env create -f environment.yml
    conda activate global-vs-local-analysis
    ```
3. Register Jupyter kernel (optional)

    `python -m ipykernel install --user --name global-vs-local-analysis --display-name "Python (global-vs-local-analysis)"`
4. In your code editor, open the `analysis/` folder as your workspace root.

### Methods pipeline

The scripts and notebooks under `analysis/methods/` prepare reward landscape sets and simulate AI advisor behaviour.
- `01_advisor_suggestion_order.ipynb` Counts how often an AI suggestion is the true 1st, 2nd, …, 16th best suggestion across random landscapes.
- `02_advisor_high_low_comparison_basic_landscapes.py` Generates random landscapes and computes global vs. local AI values.
- `03_preselect_landscape_trios.py` From 100 000 random landscapes, preselects 100 trios minimising global vs. local AI value differences.
- `04_advisor_high_low_comparison_preselected_landscapes.py` Computes AI values for the 100 preselected landscape trios.
- `05_select_landscape_trios.ipynb` From the 100 preselected landscape trios, selects the final 20 trios minimising global–local reward imbalance.
- `06_advisor_high_low_comparison_histogram.ipynb` Compares AI value difference distribution between completely random and selected landscape trios.
- `07_visualise_landscape_and_suggestion_graphs.py` Draws each landscape as a graph and highlights suggestions.
- `08_linear_regression_performance.ipynb` Simulates the performance of linear regression + softmax over 20 trials.
- `09_landscape_coefficient_statistics.ipynb` Plots coefficients distributions from the final selected landscapes.

### Results pipeline

The scripts and notebooks under `analysis/results/` load experimental data, flag outliers, visualise data and perform statistical analyses.
- `01_flag_outliers.ipynb` Flags outliers by combined Z-score on distinct selections vs. average score.
- `02_time_and_payment.ipynb` Shows participants' completion time and total payment.
- `03_check_data_validity.py` Tests data integrity.
- `04_individual_performance_10.ipynb` Plots learning curves, free-text strategies, payments, and AI ratings for the 10-participant cohort.
- `05_individual_performance_40.ipynb` Plots learning curves, free-text strategies, payments, and AI ratings for the 40-participant cohort.
- `06_individual_performance_51.ipynb` Plots learning curves, free-text strategies, payments, and AI ratings for the 51-participant cohort.
- `07_simulate_counterfactual_advisor.py` For each real trial, simulates 100 counterfactual suggestions from the opposite AI type.
- `08_analysis_101.ipynb` Plots and analyses participant scores, rewards, AI adherence, counterfactual AI value and adherence, ratings, AI values, completion time.

## Questions and issues

If anything is unclear or you run into trouble, please contact Orsolya Szőcs at orsoszocs@gmail.com.

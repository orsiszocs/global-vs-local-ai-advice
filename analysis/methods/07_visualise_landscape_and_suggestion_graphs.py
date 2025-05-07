"""
Visualises reward landscapes as graphs, where nodes represent different colour configurations.
Connect the configurations that differ in exactly 2 features with an edge.
Randomly chooses a global and a local suggestion and highlights them in the graph.
Draws a graph with and without highlighting the suggestions.
Outputs PDF/PNG figures and JSON metadata per landscape.
"""

import networkx
import plotly.graph_objects as go
import PIL.Image as Image
import io
import numpy as np
import json
from copy import deepcopy
from tqdm import tqdm
from common import load_landscapes, all_high_level_suggestions, all_low_level_suggestions, high_level_combination


def are_neighbours_global(combination1, combination2):
    if tuple(high_level_combination(combination1)) != tuple(high_level_combination(combination2)):
        return False
    edit_distance = 0
    for i in range(len(combination1)):
        if combination1[i] != combination2[i]:
            edit_distance += 1
    if edit_distance == 2:
        return True
    return False


def are_neighbours_local(combination1, combination2):
    edit_distance = 0
    for i in range(len(combination1)):
        if combination1[i] != combination2[i]:
            edit_distance += 1
    if edit_distance == 1:
        return True
    return False


def are_neighbours(combination1, combination2):
    return are_neighbours_local(combination1, combination2) or are_neighbours_global(combination1, combination2)


def make_landscape_graph(combinations, rewards, suggestion_groups, graph_id):
    node_indices = []
    node_marker_symbols = []
    node_marker_colours = []
    node_marker_sizes = []
    special_node_indices = []
    for i in range(len(combinations)):
        node_indices.append(i)
        is_in_group = False
        for suggestion_group in suggestion_groups:
            if suggestion_group["suggestion"].is_matching_combination(combinations[i]):
                node_marker_symbols.append(suggestion_group["symbol"])
                node_marker_colours.append(rewards[i])
                node_marker_sizes.append(25)
                special_node_indices.append(i)
                is_in_group = True
                break
        if not is_in_group:
            node_marker_symbols.append("circle")
            node_marker_colours.append("rgb(153, 153, 153)")
            node_marker_sizes.append(15)

    landscape_graph = networkx.Graph()
    landscape_graph.add_nodes_from(node_indices)
    for i in range(len(combinations)):
        for j in range(i + 1, len(combinations)):
            if are_neighbours(combinations[i], combinations[j]):
                landscape_graph.add_edge(i, j)
                are_same_suggestion_group = False
                in_suggestion_group_1 = False
                in_suggestion_group_2 = False
                for suggestion_group in suggestion_groups:
                    if suggestion_group["suggestion"].is_matching_combination(combinations[i]):
                        in_suggestion_group_1 = True
                    if suggestion_group["suggestion"].is_matching_combination(combinations[j]):
                        in_suggestion_group_2 = True
                    if suggestion_group["suggestion"].is_matching_combination(combinations[i]) and \
                            suggestion_group["suggestion"].is_matching_combination(combinations[j]):
                        landscape_graph.add_weighted_edges_from([(i, j, 5)])
                        are_same_suggestion_group = True
                        break
                if not are_same_suggestion_group:
                    if in_suggestion_group_1 and in_suggestion_group_2:
                        landscape_graph.add_weighted_edges_from([(i, j, -0.2)])
                    else:
                        landscape_graph.add_weighted_edges_from([(i, j, 3)])
    pos = networkx.spring_layout(landscape_graph, k=1 / 10)
    edge_x_within_groups = []
    edge_y_within_groups = []
    edge_x_without_groups = []
    edge_y_without_groups = []

    for edge in landscape_graph.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        is_edge_within_groups = False
        for suggestion_group in suggestion_groups:
            if suggestion_group["suggestion"].is_matching_combination(combinations[edge[0]]) and \
                    suggestion_group["suggestion"].is_matching_combination(combinations[edge[1]]):
                edge_x_within_groups.append(x0)
                edge_x_within_groups.append(x1)
                edge_x_within_groups.append(None)
                edge_y_within_groups.append(y0)
                edge_y_within_groups.append(y1)
                edge_y_within_groups.append(None)
                is_edge_within_groups = True
                break
        if not is_edge_within_groups:
            edge_x_without_groups.append(x0)
            edge_x_without_groups.append(x1)
            edge_x_without_groups.append(None)
            edge_y_without_groups.append(y0)
            edge_y_without_groups.append(y1)
            edge_y_without_groups.append(None)

    edge_trace_within_groups = go.Scatter(
        x=edge_x_within_groups, y=edge_y_within_groups,
        line=dict(width=2.0, color="#000000"),
        hoverinfo='none',
        mode='lines',
    )

    edge_trace_without_groups = go.Scatter(
        x=edge_x_without_groups, y=edge_y_without_groups,
        line=dict(width=0.5, color="#999999"),
        hoverinfo='none',
        mode='lines',
    )

    edge_trace = go.Scatter(
        x=edge_x_within_groups + edge_x_without_groups, y=edge_y_within_groups + edge_y_without_groups,
        line=dict(width=0.5, color="#999999"),
        hoverinfo='none',
        mode='lines',
    )

    node_x = []
    node_y = []
    node_x_special = []
    node_y_special = []
    for node in landscape_graph.nodes():
        x, y = pos[node]
        if node in special_node_indices:
            node_x_special.append(x)
            node_y_special.append(y)
        else:
            node_x.append(x)
            node_y.append(y)

    tickmax, tickmin = 150, 50

    node_trace_with_suggestions = go.Scatter(
        x=node_x, y=node_y,
        mode='markers',
        hoverinfo='none',
        marker=dict(
            cauto=False,
            showscale=True,
            colorscale="viridis",
            reversescale=False,
            color="rgb(153, 153, 153)",
            size=15,
            symbol="circle",
            opacity=0.5,
            line=dict(
                color="black",
                width=3
            ),
            cmax=np.max(rewards),
            cmin=np.min(rewards),
            colorbar=dict(
                thickness=30,
                title=go.scatter.marker.colorbar.Title(
                    text="Rewards",
                    font=dict(
                        family="Libertine",
                        size=40,
                        color="black",
                    ),
                ),
                xanchor='left',
                # titleside='right',
                outlinecolor="black",
                outlinewidth=2,
                tickfont=dict(
                    size=40,
                ),
                # nticks = 5,
                tickmode="array",
                tickvals=[tickmin, 100, tickmax],
            )))

    node_trace_with_suggestions_special = go.Scatter(
        x=node_x_special, y=node_y_special,
        mode='markers',
        hoverinfo='none',
        marker=dict(
            cauto=False,
            showscale=True,
            colorscale="viridis",
            reversescale=False,
            size=30,
            symbol="square",
            opacity=1.0,
            line=dict(
                color="black",
                width=3
            ),
            cmax=np.max(rewards),
            cmin=np.min(rewards),
            colorbar=dict(
                thickness=30,
                title=go.scatter.marker.colorbar.Title(
                    text="Rewards",
                    font=dict(
                        family="Libertine",
                        size=40,
                        color="black",
                    ),
                ),
                xanchor='left',
                # titleside='right',
                outlinecolor="black",
                outlinewidth=2,
                tickfont=dict(
                    size=40,
                ),
                # nticks = 5,
                tickmode="array",
                tickvals=[tickmin, 100, tickmax],
            )))

    node_trace_with_suggestions_special.marker.color = [rewards[i] for i in special_node_indices]
    node_trace_with_suggestions_special.marker.symbol = [node_marker_symbols[i] for i in special_node_indices]
    node_trace_with_suggestions_special.marker.size = [25 for i in special_node_indices]

    fig_with_suggestions = go.Figure(data=[edge_trace_without_groups, edge_trace_within_groups, node_trace_with_suggestions, node_trace_with_suggestions_special],
                    layout=go.Layout(
                        showlegend=False,
                        margin=dict(b=0, l=0, r=0, t=0),
                        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                        plot_bgcolor="white",
                    ),
                    )
    fig_with_suggestions.update_layout(
        font=dict(
            family="Libertine",
            color="black"
        )
    )
    fig_with_suggestions.write_image(f"figures/landscape_and_suggestion_graphs/{graph_id}.pdf")
    img_bytes = fig_with_suggestions.to_image(format="png")
    img = Image.open(io.BytesIO(img_bytes))
    img.save(f"figures/landscape_and_suggestion_graphs/{graph_id}.png")

    combined_rewards = [rewards[node] for node in landscape_graph.nodes() if node not in special_node_indices] + \
                       [rewards[node] for node in special_node_indices]
    node_trace = go.Scatter(
        x=node_x + node_x_special, y=node_y + node_y_special,
        mode='markers',
        hoverinfo='none',
        marker=dict(
            cauto=False,
            showscale=True,
            colorscale="viridis",
            reversescale=False,
            opacity=1.0,
            size=15,
            color=combined_rewards,
            symbol='circle',
            line=dict(
                color="black",
                width=3
            ),
            cmax=np.max(rewards),
            cmin=np.min(rewards),
            colorbar=dict(
                thickness=30,
                title=go.scatter.marker.colorbar.Title(
                    text="Rewards",
                    font=dict(
                        family="Libertine",
                        size=40,
                        color="black",
                    ),
                ),
                xanchor='left',
                # titleside='right',
                outlinecolor="black",
                outlinewidth=2,
                tickfont=dict(
                    size=40,
                ),
                # nticks = 5,
                tickmode="array",
                tickvals=[tickmin, 100, tickmax],
            )))

    fig = go.Figure(data=[edge_trace, node_trace],
                    layout=go.Layout(
                        showlegend=False,
                        margin=dict(b=0, l=0, r=0, t=0),
                        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                        plot_bgcolor="white",
                    ),
                    )
    fig.update_layout(
        font=dict(
            family="Libertine",
            color="black"
        )
    )
    fig.write_image(f"figures/landscape_and_suggestion_graphs/{graph_id}_without_suggestions.pdf")
    img_bytes = fig.to_image(format="png")
    img = Image.open(io.BytesIO(img_bytes))
    img.save(f"figures/landscape_and_suggestion_graphs/{graph_id}_without_suggestions.png")


def save_suggestion_group_symbols(symbols):
    for symbol in symbols:
        node_trace = go.Scatter(
            x=[1], y=[1],
            mode='markers',
            hoverinfo='none',
            marker=dict(
                cauto=False,
                size=25,
                symbol=symbol,
                opacity=1.0,
                color="white",
                line=dict(
                    color="black",
                    width=3
                )))

        fig = go.Figure(data=[node_trace],
                        layout=go.Layout(
                            showlegend=False,
                            margin=dict(b=0, l=0, r=0, t=0),
                            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                            plot_bgcolor="white",
                        ),
                        )

        fig.write_image(f"figures/landscape_and_suggestion_graphs/{symbol}.pdf")
        img_bytes = fig.to_image(format="png")
        img = Image.open(io.BytesIO(img_bytes))
        img.save(f"figures/landscape_and_suggestion_graphs/{symbol}.png")


def are_clashing_groups(group1, group2):
    for combination1 in group1.all_matching_combinations():
        for combination2 in group2.all_matching_combinations():
            if tuple(combination1) == tuple(combination2):
                return True
    return False


def choose_suggestion_groups(landscape):
    marker_symbols = ["triangle-down", "triangle-up", "diamond", "cross", "star-triangle-up", "x", "star", "square"]
    save_suggestion_group_symbols(marker_symbols)
    high_level_groups = all_high_level_suggestions()
    low_level_groups = all_low_level_suggestions(landscape.get_block_nr1(), landscape.get_block_nr2())
    # choose the local group that has the average AI reward closest to 0
    local_group = low_level_groups[0]
    min_difference_from_average = abs(local_group.mean_reward(landscape.get_coefficients_low() + landscape.get_coefficients_high()))
    for group in low_level_groups[1:]:
        difference_from_average = abs(group.mean_reward(landscape.get_coefficients_low() + landscape.get_coefficients_high()))
        if difference_from_average < min_difference_from_average:
            local_group = group
            min_difference_from_average = difference_from_average
    # choose the global group that has the average AI reward closest to 0
    global_group = high_level_groups[0]
    min_difference_from_average = abs(global_group.mean_reward(landscape.get_coefficients_low() + landscape.get_coefficients_high()))
    for group in high_level_groups[1:]:
        difference_from_average = abs(group.mean_reward(landscape.get_coefficients_low() + landscape.get_coefficients_high()))
        if difference_from_average < min_difference_from_average:
            global_group = group
            min_difference_from_average = difference_from_average

    groups = [local_group, global_group]
    groups_with_symbols = []
    for i in range(len(groups)):
        groups_with_symbols.append({"suggestion": groups[i], "symbol": marker_symbols[i]})
    return groups_with_symbols

landscapes = load_landscapes("landscapes/landscape_trios_20.json")
combinations = landscapes[0].get_combinations()
for landscape in tqdm(landscapes):
    landscape.init_scaled_rewards_with_min_reward(30)
    rewards = []
    for combination in combinations:
        selection = landscape.selection_with_non_noisy_reward(combination)
        rewards.append(selection.get_reward())
    suggestion_groups = choose_suggestion_groups(landscape)
    make_landscape_graph(combinations, rewards, deepcopy(suggestion_groups), landscape.get_id())
    # save suggestion_groups in json
    suggestion_groups_dict = []
    for suggestion_group in suggestion_groups:
        suggestion_groups_dict.append({
            "suggestion": str(suggestion_group["suggestion"]),
            "symbol": suggestion_group["symbol"],
        })
    combinations_and_rewards = []
    for i in range(len(combinations)):
        combinations_and_rewards.append({
            "combination": str(tuple(combinations[i])),
            "reward": rewards[i]
        })
    landscape_json = {
        "suggestion_groups": suggestion_groups_dict,
        "landscape": {
            "id": landscape.get_id(),
            "block_nr1": landscape.get_block_nr1(),
            "block_nr2": landscape.get_block_nr2(),
            "coefficients_low": landscape.get_coefficients_low(),
            "coefficients_high": landscape.get_coefficients_high(),
            "combinations": combinations_and_rewards,
        },
    }
    with open(f"figures/landscape_and_suggestion_graphs/{landscape.get_id()}_suggestion_groups.json", "w") as file:
        json.dump(landscape_json, file, indent=4)

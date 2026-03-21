"""
Provided and written by Arthur Chen
"""

import re
import pandas as pd
from sentence_transformers import SentenceTransformer, util
from nltk.corpus import stopwords
import pulp


class SemanticILPAllocator:
    def __init__(self, projects, groups, alpha=0.5):
        self.projects = projects
        self.groups = groups
        self.alpha = alpha
        self.model = SentenceTransformer("allenai/scibert_scivocab_uncased")
        self.custom_stopwords = set(stopwords.words("english")).union(
            {
                "system",
                "systems",
                "software",
                "application",
                "applications",
                "data",
                "network",
                "networks",
                "technology",
                "technologies",
                "computer",
                "computing",
                "information",
                "process",
                "processes",
                "project",
                "projects",
            }
        )
        self.allocations = []
        self.quality_measure = {}

    def preprocess(self, text):
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r"[\n•\-\–\—]", " ", text)
        text = re.sub(r"[^\w\s]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return " ".join([w for w in text.split() if w not in self.custom_stopwords])

    def compute_similarity(self, statement, knowledge):
        if not statement or not knowledge:
            return 0.0
        emb1 = self.model.encode(statement, convert_to_tensor=True)
        emb2 = self.model.encode(knowledge, convert_to_tensor=True)
        return float(util.cos_sim(emb1, emb2)[0][0])

    def build_preference_table(self):
        pref_entries = []
        for group in self.groups:
            for pref in group["proj_preferences"]:
                project = next(
                    (p for p in self.projects if p["proj_id"] == str(pref["project"])),
                    None,
                )
                if not project:
                    continue
                sim_score = self.compute_similarity(
                    self.preprocess(pref["notes"]),
                    self.preprocess(project["req_skills"]),
                )
                rank_score = (8 - pref["rank"]) / 7
                final_score = self.alpha * sim_score + (1 - self.alpha) * rank_score
                pref_entries.append(
                    {
                        "group_id": group["group_id"],
                        "group_name": group["group_name"],
                        "proj_id": project["proj_id"],
                        "final_score": final_score,
                        "rank": pref["rank"],
                    }
                )
        return pd.DataFrame(pref_entries)

    def solve_ilp(self, df):
        pairs = [(r.group_id, r.proj_id) for r in df.itertuples()]
        group_ids = df["group_id"].unique()
        project_ids = df["proj_id"].unique()

        capacity = {p["proj_id"]: p["capacity"] for p in self.projects}
        weight = {(r.group_id, r.proj_id): r.final_score for r in df.itertuples()}

        prob = pulp.LpProblem("Group_Project_Allocation", pulp.LpMaximize)
        x = pulp.LpVariable.dicts("assign", pairs, cat="Binary")

        prob += pulp.lpSum(weight[g, p] * x[g, p] for g, p in pairs)

        for g in group_ids:
            prob += pulp.lpSum(x[g, p] for p in project_ids if (g, p) in x) <= 1

        for p in project_ids:
            prob += pulp.lpSum(x[g, p] for g in group_ids if (g, p) in x) <= capacity[p]

        prob.solve()

        results = []
        for (g, p), var in x.items():
            if pulp.value(var) == 1:
                proj = next(pr for pr in self.projects if pr["proj_id"] == p)
                group = next(gr for gr in self.groups if gr["group_id"] == g)
                results.append(
                    {
                        "group_id": g,
                        "group_name": group["group_name"],
                        "proj_id": p,
                    }
                )
        return results

    def allocate(self):
        pref_df = self.build_preference_table()
        allocations = self.solve_ilp(pref_df)

        # Quality measure calculation
        quality = {"top1": 0, "top3": 0, "top5": 0, "top7": 0}
        total_groups = len(self.groups)

        pref_lookup = {
            g["group_id"]: {str(p["project"]): p["rank"] for p in g["proj_preferences"]}
            for g in self.groups
        }

        for alloc in allocations:
            gid = alloc["group_id"]
            pid = alloc["proj_id"]
            assigned_rank = pref_lookup.get(gid, {}).get(pid, None)
            if assigned_rank:
                if assigned_rank <= 1:
                    quality["top1"] += 1
                if assigned_rank <= 3:
                    quality["top3"] += 1
                if assigned_rank <= 5:
                    quality["top5"] += 1
                if assigned_rank <= 7:
                    quality["top7"] += 1

        for k in quality:
            quality[k] = round(100 * quality[k] / total_groups, 2)

        self.allocations = allocations
        self.quality_measure = quality
        return allocations

    def save_quality(self, path: str):
        with open(path, "w") as f:
            for k, v in self.quality_measure.items():
                f.write(f"{k}: {v:.2f}%\n")

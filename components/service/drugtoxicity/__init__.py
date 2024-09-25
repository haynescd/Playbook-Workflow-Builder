import pandas as pd
import requests


def query_drug_cytotoxicty_from_chembl(drugs: list[dict]):
    """
    Query the ChEMBL database for cytotoxicity assay data for a given list of drugs.

    Args:
        drugs (list[dict]): List of drugs with a "term" key, each containing a drug name.

    Returns:
        list[dict]: A list of dictionaries containing cytotoxicity data sorted by drug name.
    """
    # Extract the drug terms from the input list of dictionaries
    large_drug_list = [drug["term"] for drug in drugs]

    batch_size = 100
    results = None
    # Query ChEMBL API in batches for large lists of drugs
    for batch in batch_generator(large_drug_list, batch_size):
        results = query_chembl_api(batch)

    # Specify columns to keep from the API response
    cols = [
        "activity_id",
        "assay_description",
        "assay_type",
        "molecule_pref_name",
        "standard_type",
        "standard_units",
        "standard_value",
        "target_pref_name",
        "pchembl_value",
    ]
    # Create a DataFrame from the API response
    drug_cytotoxicity_df = pd.DataFrame(results)[cols]
    # Convert specific columns to numeric types for further analysis
    drug_cytotoxicity_df[["pchembl_value", "standard_value"]] = drug_cytotoxicity_df[
        ["pchembl_value", "standard_value"]
    ].apply(pd.to_numeric)

    # Sort by molecule name and return the results as a list of dictionaries
    return drug_cytotoxicity_df.sort_values("molecule_pref_name").to_dict(
        orient="records"
    )


def batch_generator(large_drug_list: list[str], batch_size: int):
    """
    Generator function to yield batches from a large list.

    Args:
        large_drug_list (list[str]): List of drug names to query.
        batch_size (int): Number of items per batch.

    Yields:
        list[str]: A batch of drug names.
    """
    for i in range(0, len(large_drug_list), batch_size):
        yield large_drug_list[i : i + batch_size]


def query_chembl_api(drugs_to_query: list[str]):
    """
    Query the ChEMBL API for cytotoxicity assay data for a given list of drugs.

    Args:
        drugs_to_query (list[str]): List of drug names to query the ChEMBL API.

    Returns:
        list[dict]: A list of dictionaries containing cytotoxicity assay data from ChEMBL.
    """
    # Join drug names into a single comma-separated string
    drugs_str = ",".join(drug.upper() for drug in drugs_to_query)

    # Set threshold for pChEMBL activity value and limit to Toxicity Assays
    pchembl_value = 1  # Specify a minimum threshold of the pChEMBL activity value. Note that pCHEMBL = -log10(IC50, XC50, AC50, Ki, Kd, potency). Greater than or equal to 5 (10um) is a typical minimum rule of thumb for binding activity between a compound and a protein target.
    assay_type = "T"  # Only look for Toxicity Assays (Cytotoxicity)

    # Define the base URL for the ChEMBL API
    host = "https://www.ebi.ac.uk"  # This is the stem of the url
    url = f"{host}/chembl/api/data/activity?molecule_pref_name__in={drugs_str}&pchembl_value__gte={pchembl_value}&assay_type={assay_type}&format=json&limit=1000"

    # Query the API and convert the response to JSON
    response = requests.get(
        url
    ).json()  # This calls the information back from the API using the 'requests' module, and converts it to json format

    # Extract the list of activities from the response
    results = response["activities"]

    # If there are additional pages, fetch them
    while response["page_meta"]["next"]:
        response = requests.get(host + response["page_meta"]["next"]).json()
        results = results + response["activities"]
    return results


def produce_ranked_drug_candidates(
    drug_scores: list[dict], drug_cytotoxicity_chembl: list[dict]
):
    """
    Produce a ranked list of drug candidates based on confidence z-scores and cytotoxicity.

    Args:
        drug_scores (list[dict]): List of drugs with z-scores indicating confidence levels.
        drug_cytotoxicity_chembl (list[dict]): Cytotoxicity data from the ChEMBL database.

    Returns:
        list[dict]: Ranked list of drug candidates based on cytotoxicity and confidence z-scores.
    """
    # Convert drug scores and cytotoxicity data into DataFrames
    drug_scores_df = pd.DataFrame.from_dict(drug_scores).rename(
        columns={"zscore": "confidence_zscore", "term": "drug_name"}
    )
    drug_cytotoxicity_df = pd.DataFrame.from_dict(drug_cytotoxicity_chembl).rename(
        columns={"molecule_pref_name": "drug_name"}
    )

    # Calculate the mean cytotoxicity value for each drug
    mean_cytooxicity_df = (
        drug_cytotoxicity_df[["drug_name", "standard_value"]]
        .groupby("drug_name", as_index=False)
        .mean()
    )

    # Convert drug names to lowercase for consistency
    mean_cytooxicity_df["drug_name"] = mean_cytooxicity_df["drug_name"].str.lower()

    # Merge cytotoxicity data with drug scores based on drug names
    ranked_drug_candidates_df = pd.merge(
        mean_cytooxicity_df, drug_scores_df, on="drug_name"
    )

    # Rename column for clarity
    ranked_drug_candidates_df = ranked_drug_candidates_df.rename(
        columns={"standard_value": "cytotoxicity_mean"}
    )
    # Return the ranked list as a list of dictionaries
    return ranked_drug_candidates_df.sort_values("confidence_zscore").to_dict(
        orient="records"
    )

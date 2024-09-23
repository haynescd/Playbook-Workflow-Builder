import pandas as pd
import requests


def main(drugs: list[dict]):
    # Specify the input parameters:
    # Join the drugs into a suitable string to fulfil the search conditions of the API
    large_drug_list = [drug["term"] for drug in drugs]

    batch_size = 100
    results = None
    for batch in batch_generator(large_drug_list, batch_size):
        results = query_drug_cytotoxicty_from_chembl(batch)

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
    return (
        pd.DataFrame(results)[cols]
        .sort_values("molecule_pref_name")
        .to_dict(orient="records")
    )


def batch_generator(large_drug_list: list[str], batch_size: int):
    for i in range(0, len(large_drug_list), batch_size):
        yield large_drug_list[i : i + batch_size]


def query_drug_cytotoxicty_from_chembl(drugs_to_query: list[str]):
    drugs_str = ",".join(drug.upper() for drug in drugs_to_query)

    pchembl_value = 1  # Specify a minimum threshold of the pChEMBL activity value. Note that pCHEMBL = -log10(IC50, XC50, AC50, Ki, Kd, potency). Greater than or equal to 5 (10um) is a typical minimum rule of thumb for binding activity between a compound and a protein target.

    assay_type = "T"  # Only look for Toxicity Assays (Cytotoxicity)

    host = "https://www.ebi.ac.uk"  # This is the stem of the url
    url = f"{host}/chembl/api/data/activity?molecule_pref_name__in={drugs_str}&pchembl_value__gte={pchembl_value}&assay_type={assay_type}&format=json&limit=1000"

    response = requests.get(
        url
    ).json()  # This calls the information back from the API using the 'requests' module, and converts it to json format
    results = response["activities"]  # This is a list of the results for activities

    while response["page_meta"]["next"]:
        response = requests.get(host + response["page_meta"]["next"]).json()
        results = results + response["activities"]
    return results

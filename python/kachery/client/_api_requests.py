import os
import requests
from ._sha1_of_string import _sha1_of_string


kachery_base_url = os.environ.get("KACHERY_BASE_URL", "https://kachery.vercel.app")


def _initiate_file_upload_request(
    *, size: int, hash_alg: str, hash: str, zone: str
) -> dict:
    KACHERY_API_KEY = os.environ.get("KACHERY_API_KEY")
    if not KACHERY_API_KEY and zone != "scratch":
        raise Exception("KACHERY_API_KEY environment variable is not set")
    # difficulty is hard-coded at 13 for now. It's around 15 milliseconds of work.
    work_token = _create_work_token(hash, difficulty=13)
    payload = {
        "type": "initiateFileUploadRequest",
        "size": size,
        "hashAlg": hash_alg,
        "hash": hash,
        "zoneName": zone,
        "workToken": work_token,
    }
    url = f"{kachery_base_url}/api/initiateFileUpload"
    headers = {"Content-Type": "application/json"}
    if KACHERY_API_KEY:
        headers["Authorization"] = f"Bearer {KACHERY_API_KEY}"  # type: ignore
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise Exception(
            f'Error in {payload["type"]} ({resp.status_code}) {resp.reason}: {resp.text}'
        )
    response = resp.json()
    return response


def _finalize_file_upload_request(
    *, object_key: str, hash_alg: str, hash0: str, kachery_zone: str, size: int
) -> dict:
    KACHERY_API_KEY = os.environ.get("KACHERY_API_KEY")
    if not KACHERY_API_KEY and kachery_zone != "scratch":
        raise Exception("KACHERY_API_KEY environment variable is not set")
    payload = {
        "type": "finalizeFileUploadRequest",
        "objectKey": object_key,
        "hashAlg": hash_alg,
        "hash": hash0,
        "zoneName": kachery_zone,
        "size": size,
    }
    url = f"{kachery_base_url}/api/finalizeFileUpload"
    headers = {"Content-Type": "application/json"}
    if KACHERY_API_KEY:
        headers["Authorization"] = f"Bearer {KACHERY_API_KEY}"  # type: ignore
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise Exception(
            f'Error in {payload["type"]} ({resp.status_code}) {resp.reason}: {resp.text}'
        )
    response = resp.json()
    return response


def find_file_request(*, hash_alg: str, hash: str, zone: str) -> dict:
    KACHERY_API_KEY = os.environ.get("KACHERY_API_KEY")
    payload = {
        "type": "findFileRequest",
        "hashAlg": hash_alg,
        "hash": hash,
        "zoneName": zone,
    }
    url = f"{kachery_base_url}/api/findFile"
    headers = {
        "Content-Type": "application/json",
    }
    if KACHERY_API_KEY:
        headers["Authorization"] = f"Bearer {KACHERY_API_KEY}"
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise Exception(
            f'Error in {payload["type"]} ({resp.status_code}) {resp.reason}: {resp.text}'
        )
    response = resp.json()
    return response


def _create_work_token(hash: str, *, difficulty: int) -> str:
    while True:
        work_token = os.urandom(8).hex()
        if _check_work_token(work_token, hash, difficulty=difficulty):
            return work_token


def _check_work_token(work_token: str, hash: str, *, difficulty: int) -> bool:
    bits = _sha1_bits(hash + work_token)
    prefix = "0" * difficulty
    return bits.startswith(prefix)


def _sha1_bits(input: str) -> str:
    sha1 = _sha1_of_string(input)
    # covert to binary string of 0s and 1s
    return bin(int(sha1, 16))[2:].zfill(160)

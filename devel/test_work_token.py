import os
import time
import hashlib


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


def _sha1_of_string(txt: str) -> str:
    hh = hashlib.sha1(txt.encode("utf-8"))
    ret = hh.hexdigest()
    return ret


results = []
for j in range(100):
    timer = time.time()
    _create_work_token(_sha1_of_string("abc"), difficulty=13)
    elapsed = time.time() - timer
    results.append(elapsed)

print(f"Average time: {(sum(results) / len(results)) * 1000}")
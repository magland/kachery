import os
import hashlib
import json
from ._sha1_of_string import _sha1_of_string
from .mutable_local import get_mutable_local, set_mutable_local


def _compute_file_hash(path: str, algorithm: str) -> str:
    if not os.path.isabs(path):
        path = os.path.abspath(path)
    if not os.path.exists(path):
        raise Exception(f"File does not exist: {path}")
    size0 = os.path.getsize(path)
    if size0 > 1000 * 1000:
        a = get_mutable_local(f"@compute_sha1_cache/{_sha1_of_string(path)}")
        if a:
            a = json.loads(a)
            mtime = os.stat(path).st_mtime
            if a["size"] == size0 and a["mtime"] == mtime:
                return a["sha1"]
    if size0 > 1000 * 1000 * 100:
        print("Computing {} of {}".format(algorithm, path))
    BLOCKSIZE = 65536
    hashsum = getattr(hashlib, algorithm)()
    with open(path, "rb") as file:
        buf = file.read(BLOCKSIZE)
        while len(buf) > 0:
            hashsum.update(buf)
            buf = file.read(BLOCKSIZE)
    ret = hashsum.hexdigest()
    if size0 > 1000 * 1000:
        set_mutable_local(
            f"@compute_sha1_cache/{_sha1_of_string(path)}",
            json.dumps(
                {
                    "path": path,
                    "size": size0,
                    "mtime": os.stat(path).st_mtime,
                    "sha1": ret,
                }
            ),
        )
    return ret

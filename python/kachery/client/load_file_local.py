from typing import Union
import os
import shutil
import json
from .get_kachery_dir import get_kachery_dir
from ._compute_file_hash import _compute_file_hash


def load_file_local(uri: str, *, dest: Union[None, str] = None) -> Union[str, None]:
    query = _get_query_from_uri(uri)
    if uri.startswith("sha1://"):
        a = uri.split("?")[0].split("/")
        assert len(a) >= 3, f"Invalid or unsupported URI: {uri}"
        sha1 = a[2]
    elif uri.startswith("kachery:"):
        parts = uri.split(":")
        if len(parts) < 4:
            raise Exception(f"Invalid kachery URI: {uri}")
        alg = parts[2]
        assert alg == "sha1", f"Unsupported algorithm: {alg}"
        sha1 = parts[3]
    else:
        raise Exception(f"Unsupported URI for loading local file: {uri}")

    kachery_dir = get_kachery_dir()

    s = sha1
    parent_dir = f"{kachery_dir}/sha1/{s[0]}{s[1]}/{s[2]}{s[3]}/{s[4]}{s[5]}"
    filename = f"{parent_dir}/{sha1}"
    if os.path.exists(filename):
        if dest is not None:
            shutil.copyfile(filename, dest)
            return dest
        return filename

    if "location" in query:
        location = query["location"]
        if os.path.isabs(location) and os.path.exists(location):
            sha1_2 = _compute_file_hash(location, "sha1")
            if sha1_2 == sha1:
                if dest is not None:
                    shutil.copyfile(location, dest)
                    return dest
                return location

    # check for linked file
    s = sha1
    linked_file_record_parent_dir = (
        f"{kachery_dir}/linked_files/sha1/{s[0]}{s[1]}/{s[2]}{s[3]}/{s[4]}{s[5]}"
    )
    linked_file_record_path = f"{linked_file_record_parent_dir}/{sha1}"
    if os.path.exists(linked_file_record_path):
        with open(linked_file_record_path, "r") as f:
            a_txt = f.read()
        a = json.loads(a_txt)
        path0 = a["path"]
        size0 = a["size"]
        mtime0 = a["mtime"]
        if os.path.exists(path0):
            if os.path.getsize(path0) == size0 and os.stat(path0).st_mtime == mtime0:
                if dest is not None:
                    shutil.copyfile(path0, dest)
                    return dest
                return path0
            if (os.path.getsize(path0) == size0) and (
                _compute_file_hash(path0, algorithm="sha1") == sha1
            ):
                # file mtime has been updated, but hash is still the same
                with open(linked_file_record_path, "w") as f:
                    f.write(
                        json.dumps(
                            {
                                "path": path0,
                                "size": os.path.getsize(path0),
                                "mtime": os.stat(path0).st_mtime,
                                "sha1": sha1,
                            }
                        )
                    )
                if dest is not None:
                    shutil.copyfile(path0, dest)
                    return dest
                return path0
            else:
                print(f"Warning: sha1 of linked file has changed: {path0} {uri}")

    return None


def _get_query_from_uri(uri: str):
    a = uri.split("?")
    ret = {}
    if len(a) < 2:
        return ret
    b = a[1].split("&")
    for c in b:
        d = c.split("=")
        if len(d) == 2:
            ret[d[0]] = d[1]
    return ret

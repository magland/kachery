from typing import Optional
import os
import shutil
from ._load_http_file import _load_http_file
from ._load_github_file import _load_github_file
from .load_file_local import load_file_local
from ._load_sha1_file_from_cloud import _load_sha1_file_from_cloud


def load_file(
    uri: str,
    *,
    dest: Optional[str] = None,
    local_only: bool = False,
    _get_info: bool = False,
    verbose: bool = False
) -> Optional[str]:
    if uri.startswith("gh://"):
        if _get_info:
            raise Exception("Cannot use _get_info for this uri")
        return _load_github_file(uri)

    if uri.startswith("http://") or uri.startswith("https://"):
        if _get_info:
            raise Exception("Cannot use _get_info for this uri")
        return _load_http_file(uri)

    if local_only:
        if _get_info:
            raise Exception("Cannot use _get_info with local_only")
        return load_file_local(uri, dest=dest)
    if uri.startswith("/"):
        if _get_info:
            raise Exception("Cannot use _get_info for this uri")
        if os.path.exists(uri):
            if dest is not None:
                shutil.copyfile(uri, dest)
                return dest
            return uri
        else:
            return None
    if uri.startswith("sha1://"):
        if not _get_info:
            x = load_file_local(uri, dest=dest)
            if x is not None:
                return x
        sha1 = uri.split("?")[0].split("/")[2]
        fname_or_info = _load_sha1_file_from_cloud(
            sha1, verbose=verbose, dest=dest, _get_info=_get_info
        )
        if fname_or_info is None:
            return None
        elif isinstance(fname_or_info, dict):
            if not _get_info:
                raise Exception("Unexpected dict in load_file")
            return fname_or_info  # type: ignore
        elif isinstance(fname_or_info, str):
            if _get_info:
                raise Exception("Unexpected string in load_file")
            return fname_or_info
        else:
            raise Exception("Unexpected return value from _load_sha1_file_from_cloud")


def load_file_info(uri: str) -> dict:
    return load_file(uri, _get_info=True)  # type: ignore

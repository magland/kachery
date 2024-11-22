import os
from ._fs_operations import _makedirs


def get_kachery_dir(*, respect_sandbox: bool = True):
    from pathlib import Path

    if respect_sandbox and (os.getenv("KACHERY_USE_SANDBOX", "") == "1"):
        return os.environ["KACHERY_SANDBOX_DIR"]
    homedir = str(Path.home())
    hsd = os.getenv("KACHERY_DIR", f"{homedir}/.kachery")
    if not os.path.exists(hsd):
        _makedirs(hsd)
    return hsd

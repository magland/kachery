import os

from .client.load_file import load_file, load_file_info  # noqa: F401
from .client.cat_file import cat_file  # noqa: F401
from .client.store_file_local import store_file_local  # noqa: F401
from .client.store_file import store_file  # noqa: F401

# read the version from thisdir/version.txt
thisdir = os.path.dirname(os.path.realpath(__file__))
with open(os.path.join(thisdir, "version.txt")) as f:
    __version__ = f.read().strip()

import os

from .client.load_file import load_file, load_file_info  # noqa: F401
from .client.cat_file import cat_file  # noqa: F401
from .client.store_file_local import store_file_local  # noqa: F401
from .client.store_file import store_file  # noqa: F401
from .client.core import store_text, store_json, store_npy  # noqa: F401
from .client.core import load_text, load_json, load_npy  # noqa: F401
from .client.core import (
    store_text_local,
    store_json_local,
    store_npy_local,
)  # noqa: F401
from .client.load_bytes import load_bytes  # noqa: F401
from .client.get_kachery_dir import get_kachery_dir, use_sandbox  # noqa: F401
from .client.mutable_local import (  # noqa: F401
    delete_mutable_folder_local,
    delete_mutable_local,
    get_mutable_local,
    set_mutable_local,
)
from .client._sha1_of_dict import sha1_of_dict  # noqa: F401
from .client._custom_storage_backend import set_custom_storage_backend  # noqa: F401


# read the version from thisdir/version.txt
thisdir = os.path.dirname(os.path.realpath(__file__))
with open(os.path.join(thisdir, "version.txt")) as f:
    __version__ = f.read().strip()

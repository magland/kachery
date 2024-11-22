from tempfile import TemporaryDirectory
import requests
from .load_file_local import load_file_local


def _load_http_file(url: str):
    from .store_file_local import store_file_local

    with TemporaryDirectory(prefix="load_http_file") as tmpdir:
        tmp_filename = f"{tmpdir}/file.dat"
        with requests.get(url, stream=True) as r:
            if r.status_code == 404:
                raise Exception(f"File not found: {url}")
            r.raise_for_status()
            with open(tmp_filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        uri = store_file_local(tmp_filename)
        return load_file_local(uri)

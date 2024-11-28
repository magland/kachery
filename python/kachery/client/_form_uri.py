from typing import Union
from urllib.parse import quote


def _form_uri(
    *, alg: str, hash0: str, label: Union[str, None], uri_type: int, zone: str
) -> str:
    if uri_type == 1:
        uri = f"{alg}://{hash0}"
        if label is not None:
            uri = f"{uri}?label={quote(label)}"
        return uri
    elif uri_type == 2:
        uri = f"kachery:{zone}:{alg}:{hash0}"
        if label is not None:
            uri = f"{uri}:{quote(label)}"
        return uri
    else:
        raise Exception(f"Unexpected uri_type: {uri_type}")

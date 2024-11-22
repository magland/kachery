import os
import stat


all_dir_mode = (
    stat.S_IRUSR
    | stat.S_IWUSR
    | stat.S_IXUSR
    | stat.S_IRGRP
    | stat.S_IWGRP
    | stat.S_IXGRP
    | stat.S_IROTH
    | stat.S_IWOTH
    | stat.S_IXOTH
)
all_file_mode = (
    stat.S_IRUSR
    | stat.S_IWUSR
    | stat.S_IRGRP
    | stat.S_IWGRP
    | stat.S_IROTH
    | stat.S_IWOTH
)


def _makedirs(path: str):
    # This is specific to L. Frank's multi-user setup where they have a shared directory for kachery
    multiuser = (os.getenv("KACHERY_MULTI_USER", "0") == "1") or (
        os.getenv("KACHERY_CLOUD_MULTI_USER", "0") == "1"
    )
    if multiuser:
        os.makedirs(path, mode=all_dir_mode)
    else:
        os.makedirs(path)

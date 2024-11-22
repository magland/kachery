import os
import click
import kachery as k2


@click.group(help="Kachery command-line client")
def cli():
    pass


@click.command(help="Store file in kachery")
@click.argument("filename")
@click.option("--cache-locally", is_flag=True)
@click.option("--label", required=False, default="")
def store_file(filename: str, cache_locally: bool, label: str):
    if label == "":
        label = os.path.basename(filename)
    uri = k2.store_file(filename, label=label, cache_locally=cache_locally)
    print(uri)


@click.command(help="Load file from kachery")
@click.argument("uri")
@click.option("--dest", required=False, default="")
def load_file(uri: str, dest: str):
    print(f"Loading file: {uri}")
    fname = k2.load_file(uri, dest=dest if len(dest) > 0 else None)
    if fname is not None:
        print(fname)


@click.command(help="Load file info from kachery")
@click.argument("uri")
def load_file_info(uri: str):
    import json

    x = k2.load_file_info(uri)
    if x is None:
        return
    print(json.dumps(x, indent=4))


@click.command(help="Load file from kachery and write to stdout")
@click.argument("uri")
def cat_file(uri: str):
    k2.cat_file(uri)


@click.command(help="Store file in the local cache")
@click.argument("filename")
@click.option("--label", required=False, default="")
def store_file_local(filename: str, label: str):
    if label == "":
        label = os.path.basename(filename)
    uri = k2.store_file_local(filename, label=label)
    print(uri)


cli.add_command(store_file)
cli.add_command(load_file)
cli.add_command(load_file_info)
cli.add_command(cat_file)
cli.add_command(store_file_local)

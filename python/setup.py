from setuptools import setup, find_packages

# read version from kachery/version.txt
with open("kachery/version.txt") as f:
    __version__ = f.read().strip()

setup(
    name="kachery",
    version=__version__,
    author="Jeremy Magland, Luiz Tauffer, Alessio Buccino, Ben Dichter",
    author_email="jmagland@flatironinstitute.org",
    url="https://github.com/magland/kachery",
    description="",
    packages=find_packages(),
    include_package_data=True,
    package_data={"kachery": ["version.txt"]},
    install_requires=[
        "click",
        "simplejson",
        "numpy",
        "requests",
    ],
    entry_points={
        "console_scripts": [
            "kachery = kachery.cli:cli",
            "kachery-store = kachery.cli:store_file",
            "kachery-load = kachery.cli:load_file",
            "kachery-load-info = kachery.cli:load_file_info",
            "kachery-cat = kachery.cli:cat_file",
            "kachery-store-local = kachery.cli:store_file_local",
        ]
    },
)

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
        "PyYAML",
        "pydantic",  # intentionally do not specify version 1 or 2 since we support both
        "psutil",
        "requests",
    ],
    entry_points={
        "console_scripts": [
            "kachery=kachery.cli:main",
        ],
    },
)

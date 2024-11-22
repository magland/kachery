# Kachery

**Kachery** is a lightweight, content-addressable storage system designed for scientific research. It enables seamless collaboration by allowing researchers to easily store moderate-sized data files in the cloud and use them in web-based visualization tools and cloud analysis workflows.

> **Note**: Kachery is intended for scientific research purposes only.

## Installation

To install the latest version of `kachery`, run:

```bash
pip install --upgrade kachery
```

To install from source:

```bash
# Clone the repository
git clone https://github.com/magland/kachery.git
cd kachery/python
pip install -e .
```

## Key Features

- **Content-Addressable Storage**: Files are stored by their SHA-1 hash, ensuring unique identifiers and easy retrieval.
- **Cloud Integration**: Kachery integrates closely with [Figurl](https://github.com/flatironinstitute/figurl) for browser-based, interactive visualization of scientific datasets.
- **Collaborative Sharing**: Upload files once and retrieve them on any computer for shared research workflows.

## Getting Started

### Storing Data

From the command line:

```bash
echo "test-content" > test_content.txt
kachery-store test_content.txt
# Output:
# sha1://b971c6ef19b1d70ae8f0feb989b106c319b36230?label=test_content.txt
```

From Python:

```python
import numpy as np
import kachery as ka

# Store a file
uri1 = ka.store_file('/path/to/filename.dat', cache_locally=True)

# Store text
uri2 = ka.store_text('example text', label='example.txt')

# Store a JSON object
uri3 = ka.store_json({'example': 'dict'}, label='example.json')

# Store a NumPy array
array = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.int16)
uri4 = ka.store_npy(array, label='example.npy')
```

### Loading Data

From the command line:

```bash
kachery-load sha1://b971c6ef19b1d70ae8f0feb989b106c319b36230?label=test_content.txt
# Output:
# /home/<user>/.kachery/sha1/b9/71/c6/b971c6ef19b1d70ae8f0feb989b106c319b36230

# Output file contents to stdout
kachery-cat sha1://b971c6ef19b1d70ae8f0feb989b106c319b36230?label=test_content.txt
# Output:
# test-content
```

From Python:

```python
import kachery as ka

# Load a file
local_fname = ka.load_file('sha1://b971c6ef19b1d70ae8f0feb989b106c319b36230?label=test_content.txt')

# Load text
text = ka.load_text('sha1://d9e989f651cdd269d7f9bb8a215d024d8d283688?label=example.txt')

# Load a JSON object
x = ka.load_json('sha1://d0d9555e376ff13a08c6d56072808e27ca32d54a?label=example.json')

# Load a NumPy array
y = ka.load_npy("sha1://bb55205a2482c6db2ace544fc7d8397551110701?label=example.npy")
```

## Zones and Storage

Kachery organizes data into zones, each with distinct storage and access rules. Users can specify a zone by setting the `KACHERY_ZONE` environment variable.

### Scratch Zone: No Registration Required

The **scratch zone** can be used without registration. To use it, set the environment variable:

```bash
export KACHERY_ZONE=scratch
```

Files stored in the scratch zone are **temporary and may be deleted during regular cleanups**. This is ideal for lightweight and experimental use.

### Default Zone: Register to Access

For more persistent storage and access, use the **default zone**. To use it, you must:

1. Register at [kachery.vercel.app](https://kachery.vercel.app) using your GitHub account.
2. Go to settings and provide your name, an email address and a short description of your research purpose.
3. Set the `KACHERY_API_KEY` environment variable with your assigned API key.

The default zone allows uploads from all registered users and is suitable for light usage in scientific research. The intent is for files to be available for long-term use, but we may at some point delete files that have not been accessed for a long time.

For more detailed instruction on registration, see [Registration](doc/registration.md).

### Custom Zones for Heavier Usage and Greater Reliability

For users with heavier storage needs that is less prone to eventual deletion, we offer the following options:

- **Special Zones**: Contact us to create a custom zone with controlled upload access for your collaborators. (We still manage the storage bucket.)
- **Provision Your Own Bucket**: For large-scale usage, we can help you configure a dedicated storage bucket (e.g., AWS S3 or Cloudflare R2) to integrate with Kachery. Then you have control of your data and can determine when/how/if to delete it.

### Important Notes on Zones

- Files are stored based on their SHA-1 hash in a content-addressable storage system.
- Currently, downloads are open to all users, but uploads are restricted based on zone permissions.

## Limitations

- Kachery is designed for **moderate-sized files** (typically tens to hundreds of megabytes), mainly for use with Figurl visualizations. It is not intended for gigabyte-scale storage for individual files.
- No file management features are provided; files are stored permanently (except in the scratch zone) until deleted by administrators.

## Relationship with past versions

Compared with past versions of kachery (kachery-p2p, kachery-cloud), this version is meant to be simpler and maintainable in the long term. This version is largely compatible with kachery-cloud, but it has an improved method for managing zones.

## A Bit of Proof of Work

Mainly we trust users to use the system appropriately. But to protect to some degree against abuse, a bit of proof of work is required by upload clients in order to reduce the chances of abuse.

## Authors

Kachery was conceived and developed by Jeremy Magland at the Center for Computational Mathematics, Flatiron Institute.

## Acknowledgments

Earlier versions of Kachery were developed in collaboration with Jeff Soules and members of Loren Frank's lab.

## License

Apache License 2.0

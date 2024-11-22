import kachery as k2

uri = k2.store_json({'test': 2})
print(uri)

info = k2.load_file_info(uri)
print(info)

b = k2.load_json(uri)
print(b)

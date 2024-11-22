# Kachery Registration

If you just want to try out kachery, or do some light work, you don't need to register. You can just set the KACHERY_ZONE environment variable to "scratch" in order to use the scratch zone. Data on the scratch zone is regularly deleted.

Otherwise, to use the default zone (and other custom zones), you will need to register using your GitHub account.

Follow these steps:

* Go to [https://kachery.vercel.app/](https://kachery.vercel.app/) and log in with your GitHub account.
* Click on "Settings"
* Set your name, email address and provide a brief description of your research (kachery should only be used for scientific research purposes)
* Click to generate an API key
* Set the KACHERY_API_KEY environment variable to the API key you generated

That's it! By default, your data will get uploaded to the "default" zone which is available to all users. Or, to use a different zone, simply set the KACHERY_ZONE environment variable to the name of the zone you want to use. Keep in mind that you will only be able to upload data to a zone if you have been granted permission to do so by the owner.

To test:

```python
import kachery as ka
uri = ka.store_text('hello world: [random-string-goes-here]')
print(uri)

# ...

info = ka.load_file_info(uri)
print(info)

txt = ka.load_text(uri)
print(txt)
```
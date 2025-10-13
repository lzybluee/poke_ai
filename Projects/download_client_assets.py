import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import unquote

import requests

folders = [
    'audio',
    'audio/cries',
    'fx',
    'sprites',
    'sprites/afd',
    'sprites/afd-back',
    'sprites/afd-back-shiny',
    'sprites/afd-shiny',
    'sprites/ani',
    'sprites/ani-back',
    'sprites/ani-back-shiny',
    'sprites/ani-shiny',
    'sprites/categories',
    'sprites/dex',
    'sprites/dex-shiny',
    'sprites/gen1',
    'sprites/gen1-back',
    'sprites/gen2',
    'sprites/gen2-back',
    'sprites/gen2-back-shiny',
    'sprites/gen2-shiny',
    'sprites/gen3',
    'sprites/gen3-back',
    'sprites/gen3-back-shiny',
    'sprites/gen3-shiny',
    'sprites/gen4',
    'sprites/gen4-back',
    'sprites/gen4-back-shiny',
    'sprites/gen4-shiny',
    'sprites/gen5',
    'sprites/gen5-back',
    'sprites/gen5-back-shiny',
    'sprites/gen5-shiny',
    'sprites/gen5ani',
    'sprites/gen5ani-back',
    'sprites/gen5ani-back-shiny',
    'sprites/gen5ani-shiny',
    'sprites/gen6bgs',
    'sprites/home-centered',
    'sprites/home-centered-shiny',
    'sprites/misc',
    'sprites/trainers',
    'sprites/types'
]

suffix = ['.webm', '.png', '.mp4', '.gif', '.wav', '.jpg', '.mp3']

LOCAL_FOLDER = 'client-assets'


def download_asset(url, path):
    if os.path.exists(path):
        return

    retry = True
    while retry:
        try:
            response = requests.get(url, timeout=20)
            if response.status_code != 200:
                if response.status_code != 404:
                    print(f'{url} => {path} Error Code:', response.status_code)
                return
            if len(response.content) == 0:
                return
            with open(path, 'wb') as file:
                file.write(response.content)
            retry = False
            print(f'{url} => {path}')
        except Exception as e:
            print(f'{url} => {path} Error:', e)
            time.sleep(30)
            continue


def download_url(folder):
    url = f'https://play.pokemonshowdown.com/{folder}'
    print('>', url)
    html = requests.get(f'{url}/?view=dir').text
    result = re.findall(r'<a class="row" href="\./(.*?)">', html)
    for asset in result:
        if '.' in asset and asset[asset.rindex('.'):].lower() in suffix:
            path = os.path.join(LOCAL_FOLDER, *folder.split('/'), unquote(asset).replace('?', '-'))
            download_asset(f'{url}/{asset}', path)


def main():
    for folder in folders:
        if not os.path.exists(os.path.join(LOCAL_FOLDER, folder)):
            os.makedirs(os.path.join(LOCAL_FOLDER, folder))

    pool = ThreadPoolExecutor(8)
    for folder in folders:
        pool.submit(download_url, folder)


if __name__ == '__main__':
    main()

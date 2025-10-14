import os
import time

import requests

scripts = [
    "js/server/chat-formatter.js",
    "data/text.js",
    "data/pokedex-mini.js",
    "data/pokedex-mini-bw.js",
    "data/typechart.js",
    "data/pokedex.js",
    "data/moves.js",
    "data/items.js",
    "data/abilities.js",
    "data/search-index.js",
    "data/teambuilder-tables.js",
    "data/aliases.js",
    "data/commands.js",
    "data/graphics.js",
]

LOCAL_FOLDER = r'E:\Poke\poke_ai\Projects\client-scripts'


def download_script(url, path):
    if os.path.exists(path):
        return

    retry = True
    while retry:
        try:
            response = requests.get(url, timeout=20)
            if response.status_code != 200:
                print(f'{url} => {path} Error Code:', response.status_code)
                return
            with open(path, 'wb') as file:
                file.write(response.content)
            retry = False
            print(f'{url} => {path}')
        except Exception as e:
            print(f'{url} => {path} Error:', e)
            time.sleep(30)
            continue


def main():
    for script in scripts:
        url = f'https://play.pokemonshowdown.com/{script}'
        path = os.path.join(LOCAL_FOLDER, *script.split('/'))
        if not os.path.exists(os.path.dirname(path)):
            os.makedirs(os.path.dirname(path))
        download_script(url, path)


if __name__ == '__main__':
    main()

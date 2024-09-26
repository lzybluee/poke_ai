cd pokemon-showdown
node build
start /b node pokemon-showdown start 9102
sleep 10
cd ../showdown
start /b python run.py
cd ../showdown_factory
start /b python run.py
cd ../showdown_bss
start /b python run.py
cd ../pokemon-showdown-client
start /b npx http-server -p 9101
sleep 5
start "" "http://localhost:9101/play.pokemonshowdown.com/testclient.html?~~localhost:9102"
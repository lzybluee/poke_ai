cd pokemon-showdown
start /b node pokemon-showdown start 9102

:loop1
sleep 2
netstat -an | find "0.0.0.0:9102"
if %errorlevel%==0 (
    goto end1
) else (
    goto loop1
)
:end1

cd ../foul-play
start /b python run.py
cd ../foul-play_factory
start /b python run.py
cd ../foul-play_bss
start /b python run.py

cd ../pokemon-showdown-client
start /b npx http-server -p 9101

:loop2
sleep 2
netstat -an | find "0.0.0.0:9101"
if %errorlevel%==0 (
    goto end2
) else (
    goto loop2
)
:end2

start "" "http://localhost:9101/play.pokemonshowdown.com/testclient.html?~~localhost:9102"
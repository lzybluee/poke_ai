del config\config.js
xcopy /E /Y ..\poke_ai\Projects\pokemon-showdown-client\config play.pokemonshowdown.com\config
xcopy /E /Y ..\poke_ai\Projects\pokemon-showdown-client\data play.pokemonshowdown.com\data
xcopy /E /Y ..\poke_ai\Projects\pokemon-showdown-client\js play.pokemonshowdown.com\js
node build
pause
# Gasper !
  
>One Bot to rule 'em all!  
>Copyright (C) 2020 Florian Meyer  
>  
>Contact:  
>datflow@gasper.fun  
>DatFlow#0001 on Discord  
>https://discord.gasper.fun  
>  
>This program is free software: you can redistribute it and/or modify  
>it under the terms of the GNU Affero General Public License as published  
>by the Free Software Foundation, either version 3 of the License, or  
>(at your option) any later version.  
>  
>This program is distributed in the hope that it will be useful,  
>but WITHOUT ANY WARRANTY; without even the implied warranty of  
>MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the  
>GNU Affero General Public License for more details.  
>  
>You should have received a copy of the GNU Affero General Public License  
>along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Add Gasper to your server!
## Productive version
- [without permissions](https://discordapp.com/api/oauth2/authorize?client_id=673613224389640228&permissions=0&scope=bot, 'no role') (wouldn't create role, but some commands may not work): 
- [with admin permission](https://discordapp.com/api/oauth2/authorize?client_id=673613224389640228&permissions=8&scope=bot, 'admin shit')
- [with all relevant perms except admin](https://discordapp.com/api/oauth2/authorize?client_id=673613224389640228&permissions=2147483127&scope=bot, 'i can almost everything!')

## In-Dev version (may have downtimes)
- [without permissions](https://discordapp.com/api/oauth2/authorize?client_id=700263987249545226&permissions=0&scope=bot, 'no role') (wouldn't create role, but some commands may not work): 
- [with admin permission](https://discordapp.com/api/oauth2/authorize?client_id=700263987249545226&permissions=8&scope=bot, 'admin shit')
- [with all relevant perms except admin](https://discordapp.com/api/oauth2/authorize?client_id=700263987249545226&permissions=2147483127&scope=bot, 'i can almost everything!')
     
      
       
       
       
# Use Gasper as a template to create your own bot
## First of all:   
- Install the Typescript package global (`npm i -g typescript`)   
- Rename `src/template_config.ts` to `config.ts` and add your secret values there.\*  
- Run `npm i` in the bots main directory      
- Run `tsc`    
- Start the bot with `node dist/src/shard.js`

*\*Be careful who you add as bot owner as they have access to commands like `eval` and could reveal your token with it.*

## Hardcoded stuff:  
I hardcoded the channel IDs for the `suggestion` and the `bugreport` command.   
- I'll change this, when i created a dev-command for it.        

Also the default URLs, if there's no other URL provided by the user.       
- I'm not sure, if I'll take this to src/config.ts or if I'll create a dev-command for this.    

You'll find both files in `src/commands/util`.   

## Starting:    
run `npm i` & then `tsc` in the base directory. After this, you can already start with `node dist/src/shard.js`

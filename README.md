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


##First of all: 
Rename `src/template_config.ts` to `config.ts` and add your secret values then.
Be careful who you add as bot owner as they have access to commands like `eval` and could reveal your token with it.

##Hardcoded stuff:
I hardcoded the channel IDs for the `suggetion` and the `bugreport` command. 
Also the default URLs, if there's no other URL provided by the user. 
You'll find both files in `src/commands/util`. 

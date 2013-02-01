/*************************************************************************
 * @copyright 2012 yayramen.                                             *
 * @author yayramen                                                      *
 * @description This is the lonely module                                *
 *************************************************************************/

//Define Functions
global.lonely = function(){};

lonely.update = function(){ var a = false;
	config.hasOwnProperty("lonely") || (config.lonely = true,a = true);
	config.hasOwnProperty("lonelydj") || (config.lonelydj = 1,a = true);
	a && settings.save();core.lonely = false;
	if (config.installdone) lonely.check();
};

lonely.check = function() {
	var a = config.lonelydj+1;
	if (Module.has('queue')) {
		if (config.qued.length) return;
	}
	if (config.lonely) {
		if (core.djs.length < a && !core.lonely && core.djs.length > 0) { bot.addDj();core.lonely = true }
		else if ((core.djs.length > a || core.djs.length == 1) && core.lonely) { bot.remDj();core.lonely=false;}
	}
};

lonely.parse = function(a,b) {
	if (!a || !isNaN(a)) return;
	a = a.replace('{lonely}', basic.lightswitch(config.lonely));
	return a;
};

//Hook Events
bot.on('booted', lonely.update);
/*************************************************************************
 * @copyright 2012 yayramen.                                             *
 * @author yayramen                                                      *
 * @description This is the queue module                                 *
 *************************************************************************/

//Define Functions
global.queue = function(){};

queue.update = function(){ var a = false;
	config.hasOwnProperty("queue") || (config.queue = { on:false,enforce:true,timeout:15 }, a = true);
  config.hasOwnProperty("qued") || (config.qued = [], a = true);
  config.hasOwnProperty("away") || (config.away = { user:[],out:null }, a = true);
	a && settings.save();queue.refine();
	commands = botti._.union(commands, queue.commands);
  var bcmds = queue.commands.filter(function(e){ return e.bare == true; });
  if(!bcmds) core.cmds.bare += []; else core.cmds.bare += bcmds.map(function(e){ return e.command; });
};

queue.adddj = function(a) {
  var b = core.user[a.user[0].userid];
  if(b && queue.guarantee(b) && !Module.has("limit|list")) {
    b.droppedRoom = config.room, basic.updateidle(b), basic.save(b), Log(b.name + " started DJing"), basic.say(config.on.adddj, a.user[0].userid), basic.refreshdjs(), 
    core.nextdj && core.currentdj && core.nextdj.userid == core.djs[0] && (a = core.djs.indexOf(core.currentdj.userid), a = a == core.djs.length - 1 ? 0 : a + 1, 
    	core.nextdj = core.user[core.djs[a]], core.nextdj.userid && basic.say(config.on.nextdj, core.nextdj.userid, true))
  }
};

queue.refine = function() {
  for(var a = 0;a < config.qued.length;a++) { core.user[config.qued[a]] || config.qued.splice(a, 1) };
  for(a = core.djs.length - 1;0 <= a;a--) { 0 < config.qued.indexOf(core.djs[a]) && config.qued.splice(config.qued.indexOf(core.djs[a]), 1) };
  bot.emit('unqueued');
}

queue.autos = function() { 
  for(var a = 0;a < core.users.auto.length;a++) { var b = core.user[core.users.auto[a]];if(!b) { return } 0 < b.removed && (b.removed = 0) };core.users.auto = [];
};

queue.guarantee = function(a) {
  if (!config.queue.on && !config.away.user.length) return true;
  if(config.away.user.length) {
    if(-1 === config.away.user.indexOf(a.userid)) {
      return basic.say("Someone is waiting for that spot. Give them a second.", a.userid), bot.remDj(a.userid), false
    }
    if(-1 !== config.away.user.indexOf(a.userid)) {
      return config.away.user = [], clearTimeout(config.away.out), config.away.out = null, basic.say("Welcome back!", a.userid), true
    }
  }
  if(1 > config.qued.length) { return true };
  if(-1 === config.qued.indexOf(a.userid) || config.qued[0] != a.userid) {
    var b = config.on.queue.notnext.replace("{nextinqueue}", core.user[config.qued[0]].name);
    -1 == core.users.auto.indexOf(a.userid) && basic.say(b, a.userid);
    config.queue.enforce && (Log(core.user[a.userid].name + " was escorted: not next in queue"), bot.remDj(a.userid), a.removed++, core.users.auto.push(a.userid), 2 < a.removed && a.userid != config.uid && (bot.bootUser(a.userid, "Suspected Auto DJ"), Log(core.user[a.userid].name + " was booted: suspected auto dj")));
    return false
  }
  if(config.qued[0] == a.userid) {
    return clearTimeout(core.qtimeout), core.qtimeout = null, config.qued.shift(), bot.emit('unqueued'), true
  }
};

queue.advance = function() {
  if(config.queue.on && 0 < config.qued.length && !core.qtimeout && !config.away.user.length) {
    var a = config.on.queue.next.replace("{queuetimeout}", config.queue.timeout);basic.say(a, config.qued[0]);
    1 < config.qued.length && config.on.firstinqueue && basic.say(config.on.firstinqueue, config.qued[1], true);
    core.qtimeout = setTimeout(function() { config.qued.shift();bot.emit('unqueued');core.qtimeout = null;queue.advance() }, 1E3 * config.queue.timeout)
  } settings.save();
};

queue.parse = function(a,b) {
	if (!a || !isNaN(a) || config.installedmods.indexOf('queue') < 0) return a;
	a = a.replace('{queue}', basic.lightswitch(config.queue.on))
	.replace('{queueon}', basic.lightswitch(config.queue.on));
	return a;
};

queue.more = function(a,b) { config.qued.push(a);settings.save();basic.say(config.msg.queue.add,a,b);bot.emit('queued'); };

queue.vipadd = function(a,b) { config.qued.unshift(a);settings.save();basic.say(config.msg.queue.add,a,b);bot.emit('queued'); };

queue.less = function(a,b) { config.qued.splice(config.qued.indexOf(a), 1);settings.save();basic.say(config.msg.queue.remove,a,b);bot.emit('unqueued'); };

//Hook Events
bot.on('booted', queue.update);
bot.on('looped', queue.autos);
bot.on('removed', queue.refine);
bot.on('add_dj', queue.adddj);
bot.on('rem_dj', queue.advance);

//Define Commands
queue.commands = [{
  command: 'q+',
  callback: function(a, c, b) {
	  if(!config.queue.on) return basic.say(config.msg.queue.off, a, b);
	  if(-1 !== config.qued.indexOf(a)) return basic.say(config.msg.queue.alreadyin, a, b);
	  if(-1 !== core.djs.indexOf(a)) return basic.say(config.msg.queue.dj, a, b);
	  if(core.djs.length < core.maxdjs && !config.qued.length) return basic.say(config.on.queue.open, a, b);
    if(Module.has('vips') && config.vip.queue) return queue.vipadd(a,b);
	  queue.more(a,b);settings.save();
	},
  mode: 2,level: 0,bare: true,hint: 'Adds user to the queue'
}, {
  command: 'q-',
  callback: function(a, c, b) {
	  if(!config.queue.on) return basic.say(config.msg.queue.off, a, b);
	  if(-1 == config.qued.indexOf(a)) return basic.say(config.msg.queue.notin, a, b);
	  queue.less(a,b);settings.save();
	},
  mode: 2,level: 0,bare: true,hint: 'Removes user from the queue'
}, {
  command: 'q',
  callback: function(d, b, e) {
	  if(!config.queue.on) return basic.say(config.msg.queue.off, d, e);
	  if(1 > config.qued.length) return basic.say(config.msg.queue.empty, d, e);
	  for(var a = [], c = b = 0;c < config.qued.length;c++) { core.user[config.qued[c]] ? a.push(core.user[config.qued[c]].name) : b++ }
	  a = config.msg.queue.users.replace("{queueusers}", a.join(", "));
	  0 < b && (a = a + ", and " + b + " more.");
	  basic.say(a, d, e)
	},
  mode: 2,level: 0,bare: true,hint: 'lists the people in the queue'
}, {
  command: 'push',
  callback: function(c, b) {
	  var a = basic.find(b);
	  a && (-1 !== config.qued.indexOf(a.userid) && config.qued.splice(config.qued.indexOf(a.userid), 1), config.qued.unshift(a.userid), settings.save(),
	  basic.say(config.msg.queue.modadd, a.userid, false));config.qued.unshift();settings.save();
	},
  mode: 2,level: 3,hint: 'pushes user to the front of the queue'
}, {
  command: 'pull',
  callback: function(c, b) {
	  if("all" == b) return config.qued = [], basic.say("Cleared the queue");
	  var a = basic.find(b);
	  if(a) { if(-1 == config.qued.indexOf(a.userid)) { return } config.qued.splice(config.qued.indexOf(a.userid), 1);settings.save();
	  	basic.say(config.msg.queue.modremove, a.userid, false)
	  };config.qued.unshift();settings.save();
	},
  mode: 2,level: 3,hint: 'pushes user to the front of the queue'
}, {
  command: 'away',
  callback: function(a,b,c) {
    if (!basic.isdj(a)) return basic.say("You have to be a DJ for me to hold your spot.",a,c);
    if (config.away.user.length) return basic.say("Someone is already refreshing, hold on.",a,c);
    config.away.user.push(a);config.away.out = setTimeout(function(){ config.away.user = [];config.away.out = null; }, 60000);
    basic.say("All right, holding your spot. You have 60 seconds to refresh. Hurry up!",a,c);
  },
  mode:2,level:0,hint:'saves spot for user to refresh'
}];
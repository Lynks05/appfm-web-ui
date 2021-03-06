(function(vw){
  
  vw.cpm = {};

}(window.vw = window.vw || {}));
(function(vw){

  /**
   * This class is used to serialize Panel instanciation and allow saving AppFM view state across browser restart using localStorage feature
   * Some non exhaustive commands are :
   *  - module view
   *  - process view
   *  - file view
   *  - iframe view
   *  - static apps (logs, intro, etc.)
   *
   * 
   */

  vw.cpm.Command = function(command,data){
    this.command = command;
    this.data = data;
  }


  vw.cpm.Command.prototype.execute = function(app){
    var me = this;
    vw.cpm.utils.waitTill(app,"isInitiated",function(){
      if(me.command == "p"){
        app.processmanager.showRun(me.data.name,me.data.runid);
      }else if(me.command == "m"){
        app.modulesmanager.showModule(me.data)
      }else if(me.command == "f"){
        app.openFile(me.data);
      }else if(me.command == "i"){
        var items = me.data.split("\t");
        app.openIFrame(items[1],items[0]);
      }else if(me.command == "s"){
        if(me.data == "log"){
          app.logger.view();
        }else if(me.data == "help"){
          app.helpmanager.displayCLIHelp();
        }else{
          me.registerMessage(app);
        }
      }else if(me.command == "l"){
        if(!app.servicemanager.showService(me.data)){
          app.logger.warn("unknown panel system command : "+me.data);
        }
      }else if(me.command == "c"){
        app.request(me.data);
      }else{
        app.logger.warn("unknown panel command : "+me.command+"("+me.data+")");
      }
    },1000)
  }

  vw.cpm.Command.prototype.registerMessage = function(app){
    var me = this;
    var panel = app.view.createPanel("Unkown Application","");
    panel.focus();
  }

 

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.CLI = function($el,options){
    this.options = options;
    this.view = new vw.cpm.CLIView(this,$el);
    this.init();
    vw.cpm.INSTANCE = this;
    
  }

  



  
  vw.cpm.CLI.prototype.init = function(){
    var me = this;

    vw.cpm.SingletonCLI = this;

    this.logger = new vw.cpm.Logger(this,{});

    this.logger.info("Starting AppFM web ui");

    this.testmodule = "treetagger_fr";

    if (!store.enabled) {
      alert('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser. Your session won\'t be saved across page reloads');
      
    }

    


    this.activemenu = "";

    this.menus = {
      "default":{title:"Application Frame Mngr",body:$('<div></div>')},
      "corpus-menu":{title:"Corpora",body:$('<div></div>')},
      "module-menu":{title:"Modules",body:$('<div></div>')},
      "process-menu":{title:"Process",body:$('<div></div>')},
      "service-menu":{title:"Services",body:$('<div></div>')},
      "settings-menu":{title:"Settings",body:$('<div></div>')},
      "help-menu":{title:"Help",body:$('<div></div>')}
    }

    me.wssocketactive = false;


    this.reload();

    this.checkstatus();

    this.helpmanager = new vw.cpm.HelpManager(this,this.menus['help-menu'].body);



  
  }

  vw.cpm.CLI.prototype.checkstatus = function(){
    var me = this;
    if(this.longpolling){
      clearInterval(this.longpolling);
    }
    this.longpolling = setInterval(function(){
      $.ajax({
        type: "POST",
        data : {
          cmd: "status"
        },
        url: me.options.cpmbaseurl+"rest/cmd",
        success: function(data, textStatus, jqXHR) {
          if(data == "timeout"){
            me.logger.error("Couldn't connect to server : timeout");
            me.view.setStatusButton("offline");
          }else{
            if(me.wssocketactive){
              me.view.setStatusButton("online");
              clearInterval(me.longpolling);
              me.longpolling = undefined;
            }else{
              me.view.setStatusButton("limited");
            }
          }
        },
        error:function(jqXHR,textStatus,errorThrown){
          me.logger.error(errorThrown);
          me.view.setStatusButton("offline");
        },
        timeout: 20000 
      });
    },60000);
    if(this.resourceusagepolling){
      clearInterval(this.resourceusagepolling);
    }
    this.resourceusagepolling = setInterval(function(){
      $.ajax({
        type: "POST",
        data : {
          cmd: "resourceusage"
        },
        dataType : "json",
        url: me.options.cpmbaseurl+"rest/cmd",
        success: function(data, textStatus, jqXHR) {
          me.view.resourceInfo(data);
        },
        error:function(jqXHR,textStatus,errorThrown){
          me.view.resourceInfo({"proc":"?","mem":"?"});
        },
        timeout: 2000 
      });
    },2000);
  }

  vw.cpm.CLI.prototype.initWS = function(){
    var me = this;
    if(me.wssocketactive){
      return;
    }
    try{
      this.wssocket = new WebSocket("ws://"+me.options.cpmwshost);
      this.wssocket.onopen = function(e){
        me.logger.info("opening websocket connection");
        me.wssocketactive = true;
        me.view.setStatusButton("online");
      };
      this.wssocket.onclose = function(e){
        me.logger.info("websocket connection ended with code "+e.code+" ( "+e.reason+" )");
        me.wssocketactive = false;
        me.checkstatus();
        console.log(arguments);
        //me.view.setStatusButton("offline");
      };
      this.wssocket.onmessage = function(e){
        var obj = JSON.parse(e.data);
        
        if(obj.type == "kernel-started"){

        }else if(obj.type == "kernel-stopped"){

        }else if(obj.type == "process-ended"){
          if(_.indexOf(me.processmanager.startedprocess,obj.target)!=-1){
            vw.cpm.utils.showNotif("Process ended !","The run ("+obj.target+") of module "+obj.more+" has ended !",function(){
              me.processmanager.showRun(obj.more,obj.target);
            },me.options.cpmbaseurl+'public/img/system/process.png');
            me.processmanager.showRun(obj.more,obj.target);
            me.corpusmanager.refreshResults();
          }
          if(Object.keys(me.processmanager.onStop).indexOf(obj.target)!=-1){
            me.processmanager.onStop[obj.target].call(me,obj.more,obj.target);
          }
        }else if(obj.type == "process-started"){
          me.processmanager.fetchAll();
        }else if(obj.type == "process-deleted"){
          me.processmanager.fetchAll();
          me.corpusmanager.refreshResults();
        }else if(obj.type == "process-update"){
          /*if(_.indexOf(me.processmanager.startedprocess,obj.target)!=-1){
            // todo : should update view with status log
          }*/
          me.logger.info(obj.target+"\n"+obj.more);
        }else if(obj.type == "module-created"){
          me.modulesmanager.fetchAll();
        }else if(obj.type == "module-updated"){
          me.modulesmanager.fetchAll();
        }else if(obj.type == "service-started"){
          me.servicemanager.fetchAll();
        }else if(obj.type == "service-stopped"){
          me.servicemanager.fetchAll();
        }else{
          console.log(e);
          me.logger.info(obj.type+" "+obj.target+" "+obj.more);
        }
      };
      this.wssocket.onerror = function(e){
        console.log(arguments);
        me.checkstatus();
      };
    }catch(err){
      me.logger.warn(err);
      return;
    }
  }

  vw.cpm.CLI.prototype.reload = function(){
    var me = this;
    this.cpmsettingsmanager = new vw.cpm.CPMSettingsManager(this,this.menus['settings-menu'].body,{init:function(){
      var connectionInfo = store.get("connectionInfo");
      if(connectionInfo){
        if(me.options.cpmwshost != connectionInfo["CPM_WS_HOST"] || 
          me.options.cpmhost != connectionInfo["CPM_HOST"] ||
          me.options.cpmport !=connectionInfo["CPM_PORT"]){
          me.cpmsettingsmanager.updateConnection(connectionInfo["CPM_HOST"],connectionInfo["CPM_PORT"],connectionInfo["CPM_WS_HOST"])
        }
      }
      me.logger.info("Received appfm server settings");
      me.initmodules();
    }});
  }

  vw.cpm.CLI.prototype.isInitiated = function(){
    return this.cpmsettingsmanager.initiated && this.modulesmanager.initiated && this.processmanager.initiated && this.corpusmanager.initiated;
  }

  vw.cpm.CLI.prototype.initmodules = function(){
    var me = this;
    this.view.setStatusButton("online");

    this.modulesmanager = new vw.cpm.ModuleManager(this,this.menus['module-menu'].body);

    this.corpusmanager = new vw.cpm.CorpusManager(this,this.menus['corpus-menu'].body);

    this.servicemanager = new vw.cpm.ServiceManager(this,this.menus['service-menu'].body);

    this.processmanager = new vw.cpm.ProcessManager(this,this.menus['process-menu'].body);

    this.initWS();

    var firstrun = store.get('firstrun')
    if(!firstrun){
      var panel = this.openIFrame(this.options.cpmbaseurl+'/introslides',"Intro");
      //this.view.fullscreen(panel);
      me.demo();
      store.set('firstrun','done');
    }else if(this.view.panels.length==0){
      var panels = store.get(me.options.cpmhost+"-panels");
      if(panels && panels.length > 0){
        store.set(me.options.cpmhost+"-panels",[]);
        for (var i = panels.length - 1; i >= 0; i--) {
          vw.cpm.Panel.deserialize(this,panels[i]);
          this.logger.info("Loading panel : "+panels[i].cmd.command+" "+panels[i].cmd.data);
        }
      }else{
        var panel = this.openIFrame(this.options.cpmbaseurl+'/introslides',"Intro");
      }

    }

    
  }

  vw.cpm.CLI.prototype.setActiveMenu = function(menuitem){
    this.view.$el.find('#menu-content-title').empty();
    this.view.$el.find('#menu-content-body').children().detach();

    var menucontent = this.menus[menuitem];
    this.view.$el.find('#menu-content-title').append(menucontent.title);
    this.view.$el.find('#menu-content-body').append(menucontent.body);
  }

  vw.cpm.CLI.prototype.cpmRawCall = function(command,callback){
    var me = this;
    $.ajax({
        type: "POST",
        data : {
          cmd: command
        },
        url: me.options.cpmbaseurl+"rest/cmd",
        success: function(data, textStatus, jqXHR) {
          callback.call(me,data);
        },
        error:function(){

        }
      });
  }

  vw.cpm.CLI.prototype.cpmCall = function(command,callback){
    var me = this;
    $.ajax({
        type: "POST",
        data : {
          cmd: command+" --json"
        },
        url: me.options.cpmbaseurl+"rest/cmd",
        dataType : "json",
        success: function(data, textStatus, jqXHR) {
          callback.call(me,data);
        },
        error:function(jqXHR,textStatus,errorThrown){
          me.logger.error(errorThrown);
        },
      });
  }


  vw.cpm.CLI.prototype.request = function(command){
    var me = this;

    command = command.trim();


    if (command == "example"){
      me.example();
      return;
    }

    if(command == "help"){
      me.helpmanager.displayCLIHelp();
      return;
    }

    if(command == "brat"){
      this.openIFrame('http://'+me.options.cpmhost+':8001/index.xhtml',"brat");
      return;
    }

    if(command == "depgraph"){
      this.openIFrame('http://'+me.options.cpmhost+'/depgraph',"depgraph");
      return;
    }

    if(command.startsWith("file")){
      var elts = command.split(" ");
      me.openFile(elts[1]);
      return ;
    }

    if(command == "cadvisor"){
      this.openIFrame('http://'+me.options.cpmhost+':8082/',"cadvisor");
      return;
    }

    me.cpmRawCall(command,function(data){
      data = jQuery('<div />').text(data).html();
      data = '<code><pre class="pre-wrapped">'+data+'</pre></code>';
      var panel = me.view.createPanel(command,data,"cmd-"+command,new vw.cpm.Command("c",command));
      var refreshbutton = $('<div class="frame-tool-refresh"></div>');
      panel.addToolButton(refreshbutton);
      refreshbutton.on("click",function(){
        me.cpmRawCall(command,function(data){
          data = jQuery('<div />').text(data).html();
          data = '<code><pre class="pre-wrapped">'+data+'</pre></code>';
          var body = panel.$el.find('.frame-body');
          body.empty();
          body.append(data);
        });
      });
      if(command == "reload"){
        me.reload();
      }
    });

    
  }

  vw.cpm.CLI.prototype.openIFrame = function(url,title){
    var me = this;
    var name = url;
    if(title){
      name = title;
    }
    var panel = me.view.createPanel('<a href="'+url+'" target="_blank">'+name+'</a>',"","iframe-"+url,new vw.cpm.Command("i",name+"\t"+url));
    var refreshbutton = $('<div class="frame-tool-refresh"></div>');
    panel.addToolButton(refreshbutton);
    refreshbutton.on("click",function(){
      var iframe = panel.$el.find('iframe');
      iframe[0].src = iframe[0].src;
    });
    panel.$el.find('.frame-body').append('<iframe style="border-style:none;border:0;margin:0;padding:0;" width="100%" height="600px" src="'+url+'"></iframe>');
    return panel;
  }

  vw.cpm.CLI.prototype.openFile = function(filepath){
    var me = this;
    me.cpmRawCall("fs get "+filepath,function(data) {
        data = jQuery('<div />').text(data).html();
        //data = data.replace(/\s/g,'&nbsp;');
        //data = data.replace(/\n|\r|\r\n/g,'<br>');
        data = '<code><pre class="pre-wrapped">'+data+'</pre></code>';
        var panel = me.view.createPanel(filepath,data,"fs-"+filepath,new vw.cpm.Command("f",filepath));
        var dlbutton = $('<div class="frame-tool-download"></div>');
        panel.addToolButton(dlbutton);
        dlbutton.on("click",function(){
          vw.cpm.utils.windowOpenPost({file:filepath},me.options.cpmbaseurl+"file");
        });
      });
  }



  vw.cpm.CLI.prototype.cpmSettings = function(){
    
  }

  vw.cpm.CLI.prototype.example = function(){
    var me = this;
    var modal = new vw.cpm.ui.Modal();

    var $choice_app = $('<div></div>');
    $choice_app.append('<button id="test_app">Test_app</button>');
    $choice_app.find("#test_app").click(function(){

      modal.close();

      var testapp = new vw.cpm.TestApp(me);
      var panel = me.view.createPanel("Test App",testapp.view.$el,undefined,new vw.cpm.Command("s","testapp"));
      testapp.view.show();

      panel.focus();
    })

    modal.open($choice_app);
  }

  vw.cpm.CLI.prototype.demo = function(){
    var me = this;
    var intro = introJs();
    intro.setOptions({
      steps: [
        { 
          intro: "<h1>Welcome to AppFM</h1>the Application Frame Manager for NLP!<br>This short tutorial will present you the basic interface."
        },
        {
          element: document.querySelector('#cmd-bar-container'),
          intro: "This is the command bar. It sends direct raw command to the server.",
          position:'bottom'
        },
        {
          element: document.querySelectorAll('.frame')[0],
          intro: "Results of most commands are displayed in windows frame within content flow.",
          position:'bottom'
        },
        {
          element: document.querySelector('#app-title'),
          intro: "This button shows the currently opened frames",
          position: 'right'
        },
        {
          element: document.querySelector('#corpus-menu'),
          intro: "There is 3 main menus. This first one shows a list of all corpus handled by AppFM.",
          position: 'right'
        },
        {
          element: document.querySelector('#module-menu'),
          intro: "This one lists the modules available that can be executed over the data available in the previous menu.",
          position: 'right'
        },
        {
          element: document.querySelector('#process-menu'),
          intro: "This last one shows the list of past modules executions.",
          position: 'right'
        },
        {
          element: document.querySelector('#settings-menu'),
          intro: "Global settings can be reviewed here.",
          position: 'right'
        },
        {
          element: document.querySelector('#log-button'),
          intro: "Clicking here will show you some logged information.<br>The status button next to it should be green or yellow (in case optional websockets isn't supported by your browser or port is blocked)",
          position: 'top'
        },
        {
          element: document.querySelector('#help-menu'),
          intro: "...and if you need more help, this is where you can find further documentation.",
          position: 'right'
        }              
      ]
    });
    intro.onchange(function(element){
      if(element.id=="app-title"){
        me.view.openMenu("default");
      }else if(element.id=="corpus-menu"){
        me.view.openMenu("corpus-menu");
      }else if(element.id=="module-menu"){
        me.view.openMenu("module-menu");
      }else if(element.id=="process-menu"){
        me.view.openMenu("process-menu");
      }else if(element.id=="settings-menu"){
        me.view.openMenu("settings-menu");
      }else if(element.id=="help-menu"){
        me.view.openMenu("help-menu");
      }
    });
    intro.onexit(function(){
      me.view.closeMenu();
    });
    intro.oncomplete(function(){
      me.view.closeMenu();
    });
    intro.start();
  }

  vw.cpm.CLI.prototype.demoModule = function(){
    var me = this;
    var intro = introJs();
    var testmodule = me.testmodule;
    if (!me.modulesmanager.modules["testmodule"]){
      for (modulename in me.modulesmanager.modules){
        if (modulename != "_CMD" && modulename != "_MAP"){
          testmodule = modulename;
          break;
        }
      }
    }
    me.modulesmanager.showModule(testmodule);
    var testmoduleobj = me.modulesmanager.getModule(testmodule);
    intro.setOptions({
      steps: [
        { 
          intro: "<h1>Modules</h1>This short tutorial will present you how the basic actions availables with modules."
        },
        {
          element: document.querySelector('#module-menu'),
          intro: "Modules available are list here.<br>For the tutorial purpose, We'll open one for you.",
          position:'bottom'
        },
        {
          element:  document.querySelectorAll('.frame')[0],
          intro: "Here is the module view",
          position:'bottom'
        },
        {
          element: document.querySelectorAll('.frame')[0].querySelector(".module-header"),
          intro: "From this menu you can view the source, save modification, and run it",
          position: 'bottom'
        },
        {
          element: document.querySelectorAll('.frame')[0].querySelector(".module-run"),
          intro: "Let's go to the run section",
          position: 'bottom'
        },
        {
          element: document.querySelector('#corpus-menu'),
          intro: "You can then drag and drop files from corpus into the proper input fields.",
          position: 'right'
        },
        {
          element: document.querySelector('#corpus-menu'),
          intro: "You can then drag and drop files from corpus into the proper input fields.",
          position: 'right'
        },
        {
          element: document.querySelector('#process-menu'),
          intro: "This last one shows the list of past modules executions.",
          position: 'right'
        },
        // then run
        // a process view appears
        // that you can close and find at any moment within the process list
      ]
    });
    intro.onchange(function(element){
      if(element.id=="corpus-menu"){
        me.view.openMenu("corpus-menu");
      }else if(element.id=="module-menu"){
        me.view.openMenu("module-menu");
        
      }else if(element.classList.contains("module-run")){
        testmoduleobj.run();
      }else if(element.id=="process-menu"){
        me.view.openMenu("process-menu");
      }else if(element.id=="settings-menu"){
        me.view.openMenu("settings-menu");
      }else if(element.id=="help-menu"){
        me.view.openMenu("help-menu");
      }
    });
    intro.onexit(function(){
      me.view.closeMenu();
    });
    intro.oncomplete(function(){
      me.view.closeMenu();
    });
    intro.start();
  }

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ui = {}

  vw.cpm.ui.Modal = function(){
    var me = this;
    this.$el = $(vw.cpm.ui.Modal.template);
    this.$el.find('.cpm-modal-close').click(function(){
      me.close();
    });
    this.$el.find('.cpm-modal-content').perfectScrollbar({suppressScrollY:true});
    this.$el.hide();
  }

  vw.cpm.ui.Modal.prototype.open = function($content){
    if(vw.cpm.ui.Modal.alreadyExist){
      console.log("error : a modal is already open! this is a quick handmade framework that doesn't handle multiple opened modals..");
      return;
    }
    vw.cpm.ui.Modal.alreadyExist = true;
    
    $modalbg = $('<div id="cpm-modal-bg"></div>');
    $('body').append($modalbg);
    $modalbg.perfectScrollbar();
    this.$el.find(".cpm-modal-content").append($content);
    $modalbg.append(this.$el);
    this.$el.slideDown();
  }

  vw.cpm.ui.Modal.prototype.getContainer = function(){
    return this.$el.find(".cpm-modal-content");
  }

  vw.cpm.ui.Modal.prototype.close = function(instantaneously){
    if(instantaneously){
      this.$el.hide();
      $('body').find("#cpm-modal-bg").remove();
      vw.cpm.ui.Modal.alreadyExist = false;
    }else{
      this.$el.slideUp({complete:function(){
        $('body').find("#cpm-modal-bg").remove();
        vw.cpm.ui.Modal.alreadyExist = false;
      }});  
    }
    
    
  }

  vw.cpm.ui.Modal.alreadyExist = false;
  vw.cpm.ui.Modal.template = '<div class="cpm-modal"><div class="cpm-modal-header"><div class="cpm-modal-close"></div></div><div class="cpm-modal-content"></div></div>';



  vw.cpm.ui.WrapDiv = function(content,title,minheight,maxheight){
    var me = this;
    this.$el = $(vw.cpm.ui.WrapDiv.template);
    this.$el.find('.cpm-wrap-div-switch').click(function(){
      me.wrapToggle();
    });
    var $container = me.$el.find(".cpm-wrap-div-content");
    if(minheight){
      $container.css("min-height",minheight);
    }
    if(maxheight){
      $container.css("max-height",maxheight);
    }
    if(title){
      me.$el.find(".cpm-wrap-div-header").prepend(title);
    }
    $container.append(content);
  }

  vw.cpm.ui.WrapDiv.prototype.wrapToggle = function(){
  }
    
  vw.cpm.ui.WrapDiv.template = '<div class="cpm-wrap-div"><div class="cpm-wrap-div-header"><div class="cpm-wrap-div-switch"></div></div><div class="cpm-wrap-div-content"></div></div>';
  
  vw.cpm.ui.AjaxButton = {
    start : function($div){
      if($div){
        $div.addClass('ajax-submitted');
      }
    },
    stop : function($div){
      if($div){
        $div.removeClass('ajax-submitted');
      }
    }
  }


}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.utils = {}

  vw.cpm.utils.guids = [];
  vw.cpm.utils.guid = function(){
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    var guid = s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
    while(vw.cpm.utils.guids.indexOf(guid)!=-1){
      guid = s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
    }
    vw.cpm.utils.guids.push(guid);
    return guid;
  }

  vw.cpm.utils.showNotif = function(title,message,callback,icon){
    if (!Notification) {
      if(vw.cpm.SingletonCLI){
        vw.cpm.SingletonCLI.logger.warn('Desktop notifications not available in your browser. Try a more recent browser.');
      }
      return;
    }

    if (Notification.permission == "granted"){
      var notification = new Notification(title, {
        icon:icon,
        //icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
        body: message,
      });

      notification.onclick = callback;

    }

  }

  vw.cpm.utils.windowOpenPost = function(data,url){
    var windowOpenPostForm = '<form id="depgraphlibWindowOpenPostForm" method="post" action="'+url+'" target="_blank"></form>';
    var existingForm = jQuery('#depgraphlibWindowOpenPostForm');
    if(!existingForm.length){
      existingForm = jQuery(windowOpenPostForm);
      jQuery('body').append(existingForm);
    }
    existingForm.html('');
    for(param in data){
      var stringdata = null;
      if(typeof data[param] == 'string'){
        stringdata = data[param];
      }else{
        stringdata = JSON.stringify(data[param]);
      }
      existingForm.append('<input type="hidden" name="'+param+'" value="">');
      existingForm[0][param].value = stringdata;
    }
    document.getElementById('depgraphlibWindowOpenPostForm').submit();
  };

  vw.cpm.utils.waitTill = function(refObj,field,callback,refreshInterval){
    var interval = setInterval(function(){
      var cond = false;
      if(_.isFunction(refObj[field]) ){
        cond = refObj[field].call(refObj);
      }else{
        cond = refObj[field];
      }
      if(cond){
        clearInterval(interval);
        callback.call();
      }
    },refreshInterval);
  }

  vw.cpm.utils.getSelectionText =function() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
  }

  vw.cpm.utils.getParentDir = function(filepath){
    var index = filepath.lastIndexOf("/")
    if(index!=-1){
      return filepath.substring(0,index);
    }else{
      return filepath;
    }
    
  }

  vw.cpm.utils.extractVars = function(value,ref){
    var variables = [];

    if(typeof value == "object"){
      if(value.constructor === Array){
        for (var i = 0; i < value.length; i++) {
          variables = variables.concat(vw.cpm.utils.extractVars(value[i],ref));
        };
      }else{
        for (var i in value){
          variables = variables.concat(vw.cpm.utils.extractVars(value[i],ref));
        }
      }
    }else{
      var escapeddollar = value.replace("\\$","__DOLLAR_ESCAPED__");
      var regex = /\$(?:(?:\{(([a-zA-Z_\-\.@]+)(:.+)?)\})|([a-zA-Z_\-]+))/g;
      var match;
      while (match = regex.exec(escapeddollar)){
        var variable = {ref:ref,raw:value};
        if(match[1]){
          variable.name = match[2];
          if(match[3]){
            variable.attr = match[3].substring(1);
          }
        }else{
          variable.name = match[4];
        }
        variables.push(variable);
      }
      
    }

    return variables;

    
  }
    

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.CorpusManager = function(app,$el,options){
    this.loaded = 0;
    this.initiated = false;
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.CorpusManagerView(this,$el);
    this.filetree = {}
    this.init();
  }

  vw.cpm.CorpusManager.prototype.init = function(){
    var me = this;
    this.loaded = 0;
    me.fetch();
  }

  vw.cpm.CorpusManager.prototype.fetch = function(){
    var me = this;
    for (var i = me.app.cpmsettingsmanager.cpmsettings.corpus_dir.length - 1; i >= 0; i--) {
      var corpuspath = me.app.cpmsettingsmanager.cpmsettings.corpus_dir[i];
      var rendering = (function(path){
        var func = function(data){
          me.view.renderCorpora(data,path);
        }
        return func;
      })(corpuspath);

      me.lsDir(corpuspath,0,rendering);
    }
    me.lsDir(me.app.cpmsettingsmanager.cpmsettings.result_dir,0,function(data){
      me.view.renderResults(data);
    });
    /*$.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"corpus ls --json --all"},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        me.filetree = {"corpus":{"corpora":data.corpus},"results":{"results":data.results}}; // because...
        me.view.refresh();
      }
    })*/
  }

  vw.cpm.CorpusManager.prototype.refreshResults = function(){
    var me = this;
    me.lsDir(me.app.cpmsettingsmanager.cpmsettings.result_dir,0,function(data){
      me.view.renderResults(data);
    });
  }

  vw.cpm.CorpusManager.prototype.lsDir = function(filepath,offset,onsuccess){
    var me = this;
    var n2load = me.app.cpmsettingsmanager.cpmsettings.corpus_dir.length + 1;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"corpus lsdir "+filepath+" "+offset},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        //me.filetree = {"corpus":{"corpora":data.corpus},"results":{"results":data.results}}; // because...
        onsuccess.call(me,data,filepath);
        me.loaded += 1;
        if(me.loaded == n2load){
          me.initiated = true;
        }
      },
      error:function(){
        me.loaded += 1;
        if(me.loaded == n2load){
          me.initiated = true;
        }
      }
    });
  }




}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.CPMSettingsManager = function(app,$el,options){
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.CPMSettingsManagerView(this,$el);
    this.cpmsettings = {corpus_dir:"not connected",modules:[],result_dir:"not connected"};
    this.initiated = false;
    this.init();
  }

  vw.cpm.CPMSettingsManager.prototype.init = function(callback){
    var me = this;
    me.view.render();
    me.fetch();
  }

  vw.cpm.CPMSettingsManager.prototype.fetch = function(callback){
    var me = this;
    this.app.cpmCall("settings",function(data){
      me.initiated = true;
      me.cpmsettings = data;
      // set default module dir for newly created modules
      for (var i = 0; i < data.modules.length; i++) {
        if(data.modules[i].exist){
          me.defaultModulesDir = data.modules[i].name;
          break;    
        }
      };
      me.view.render();
      if(me.options.init){
        me.options.init.call(me.app);
      }
    });
  }

  vw.cpm.CPMSettingsManager.prototype.updateConnection = function(host,port,wshost,$button){
    console.log(host);
    var me = this;
    vw.cpm.ui.AjaxButton.start($button);
    $.ajax({
        type: "POST",
        data : {
          CPM_HOST:host,
          CPM_PORT:port,
          CPM_WS_HOST:wshost
        },
        dataType:"json",
        url: me.app.options.cpmbaseurl+"updateConnectionInfo",
        success: function(data, textStatus, jqXHR) {
          vw.cpm.ui.AjaxButton.stop($button);
          if(data.error){
            alert("wrong connection information. nothing changed!");
          }else if(data.success){
            store.set("connectionInfo",{
              CPM_HOST:host,
              CPM_PORT:port,
              CPM_WS_HOST:wshost
            });
            window.location.reload();  
          }else{
            console.log(data);
            alert("something went wrong. nothing changed!");
          }
          
        },
        error:function(){
          vw.cpm.ui.AjaxButton.stop($button);
          alert("wrong connection information. nothing changed!");
        }
      });
  }



}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.HelpManager = function(app,$el,options){
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.HelpManagerView(this,$el);
    this.init();
  }

  vw.cpm.HelpManager.prototype.init = function(){
    var me = this;

  }


  vw.cpm.HelpManager.prototype.displayCLIHelp = function(){
    var helpcontent = 'todo.. :/';
    this.app.view.createPanel("help",helpcontent,"system-help",new vw.cpm.Command("s","help"));
  }
  




}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.Logger = function(app,options){
    this.options = options;
    this.app = app;
    this.logs = [];
    this.refreshlog = false;
  }

  vw.cpm.Logger.prototype.appendLog = function(message,type){
    var d = new Date();
    var n = d.toUTCString();
    this.logs.push({"entry":message,"type":type,"date":n});
    this.refreshlog = true;
    this.refresh();
  }

  vw.cpm.Logger.prototype.info = function(message){
    this.appendLog(message,"info");
  }

  vw.cpm.Logger.prototype.debug = function(message){
    this.appendLog(message,"debug");
  }

  vw.cpm.Logger.prototype.warn = function(message){
    this.appendLog(message,"warn");
  }

  vw.cpm.Logger.prototype.error = function(message){
    this.appendLog(message,"error");
  }

  vw.cpm.Logger.prototype.refresh = function(){
    var me = this;
    var panel = me.app.view.getPanel("AppFM log",true);
    if (panel){
      panel.$el.find(".frame-body").empty();
      panel.$el.find(".frame-body").append(me.render());
      this.refreshlog = false;
    }
  }

  vw.cpm.Logger.prototype.view = function(){
    var me = this;
    var panel = me.app.view.getPanel("AppFM log",true);
    if (!panel){
      panel = me.app.view.createPanel("AppFM log",me.render(),"system-log",new vw.cpm.Command("s","log"));
    }else{
      if (me.refreshlog){
        panel.$el.find(".frame-body").empty();
        panel.$el.find(".frame-body").append(me.render());
      }  
    }
    
    this.refreshlog = false;
    panel.focus();
  }


  vw.cpm.Logger.prototype.render = function(){
    data = "";
    for (var i = this.logs.length - 1; i >= 0; i--) {
      var item =this.logs[i];
      data += item["type"]+" - "+item["date"]+" : "+item["entry"]+"\n";
    }
    return '<code><pre class="pre-wrapped">'+data+'</pre></code>';
  }



}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.Module = function(app,$el,moduledef){
    this.def = moduledef;
    this.lastSavedSource = moduledef.source;
    this.app = app;
    this.view = new vw.cpm.ModuleView(this,$el);
    this.synced = false;
  }

  vw.cpm.Module.prototype.init = function(){
    
  }

  vw.cpm.Module.prototype.fetch = function(){
    
  }

  vw.cpm.Module.prototype.sync = function(success,error,ignoreWarning){
    var me = this;
    me.def.source = me.view.editor.getValue();
    var synctype = "update "+me.def.modulename;
    if(me.def.creation){
      synctype = "create "+me.def.modulename+" "+vw.cpm.utils.getParentDir(me.def.sourcepath);
    }
    var force = "";
    if(ignoreWarning){
      force = " --force";
    }
    $.ajax({
      type: "POST",
      data : {
        cmd: "module "+synctype+force,
        data:me.def.source
      },
      url: me.app.options.cpmbaseurl+"rest/cmd",
      dataType : "json",
      success: function(data, textStatus, jqXHR) {
        if(data.success){
          if(me.def.creation || !me.def.module || ignoreWarning){
            me.app.modulesmanager.fetchAll();
            if(me.def.creation){
              delete me.def.creation;
            }
          }
          delete me.def.error;
          me.internalSyncToModel();
          me.lastSavedSource = me.def.source;
          if(success){
            success.call();  
          }
        }else if(data.warning){
           me.syncWarningOptions(data.warning,success,error);
        }else{
          me.def.error = data.error;
          alert(data.error);
          if(error){
            error.call();  
          }
        }
      },
      error:function(){
        if(error){
          error.call();  
        }
      }
    });
  }

  vw.cpm.Module.prototype.syncWarningOptions = function(modulelist,success,error){
    var me = this;
    var modal = new vw.cpm.ui.Modal();
    $html = $(vw.cpm.ModuleView.templateWarningSave);
    $html.find('.tpl-warning-save-message').html(modulelist);
    $html.find('.clone-module').click(function(){
      modal.close(true);
      me.app.modulesmanager.prepareCreateNewModule(me.def.source);
    });
    $html.find('.force-module-save').click(function(){
      modal.close();
      me.sync(function(){
        if(success){
          success.call();  
        }
        me.app.cpmRawCall("reload",function(){
          me.app.reload();  
        });
      },error,true);
    });
    $html.find('.abort-module-save').click(function(){
      modal.close();
    });
    modal.open($html);
  }

  vw.cpm.Module.confToYaml = function(conf){
    var out = "";
    for(var confname in conf){
      out += confname+" : "+conf[confname]+"\n";
    }
    return out;
  }

  vw.cpm.Module.prototype.run = function(conf,success,error,silent){
    var me = this;
    $.ajax({
      type: "POST",
      data : {
        cmd: "module run "+me.def.modulename,
        data:vw.cpm.Module.confToYaml(conf)
      },
      url: me.app.options.cpmbaseurl+"rest/cmd",
      dataType : "text",
      success: function(data, textStatus, jqXHR) {
        var runid = data;
        if(!silent){
          me.app.processmanager.startedprocess.push(runid);
          me.app.processmanager.showRun(me.def.modulename,runid);
          me.app.processmanager.fetchAll(); // very unoptimized          
        }
        if(success){
          success.call(me.view,data);
        }
      },
      error:function(){

      }
    });
  
  }

  

  vw.cpm.Module.prototype.internalSyncToSource = function(){
    this.def.source = YAML.stringify(this.def.module,99);
  }

  vw.cpm.Module.prototype.internalSyncToModel = function(){
    this.def.module = YAML.parse(this.def.source);
  }

  

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ModuleManager = function(app,$el,options){
    this.initiated = false;
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.ModuleManagerView(this,$el);
    this.init();
    this.moduletree = {};
    this.modules = {};
    this.modulesobj = [];
  }

  vw.cpm.ModuleManager.prototype.init = function(){
    var me = this;
    me.fetchAll();
  }

  vw.cpm.ModuleManager.prototype.fetchAll = function(){
    var me = this;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"module ls --json"},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        me.moduletree = data;
        me.modules = {};
        me.parseModuleTree(data);
        me.addDefaultModules();
        me.view.refresh();
        me.initiated = true;
      }
    })
  }

  vw.cpm.ModuleManager.prototype.search = function(query,onsuccess){
    var me = this;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"module search --json",data:query},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        onsuccess.call(me,data);
      },error:function(message){
        me.app.logger.error(message);
      }
    }) 
  }

  vw.cpm.ModuleManager.prototype.addDefaultModules = function(){
    this.modules["_CMD"]={
      module:{
        name:"_CMD",
        desc:"CMD",
        input:{
          CMD:{
            type:"VAL"
          },
          DOCKERFILE:{
            type:"VAL",
            value:"false"
          },
          CONTAINED:{
            type:"VAL",
            value:"false"
          }
        },
        output:{
          STDOUT:{
            type:"VAL"
          }
        },
        exec:[]
      },
      modulename:"_CMD",
      source:"",
      sourcepath:"/no/path"
    };
    this.modules["_MAP"]={
      module:{
        name:"_MAP",
        desc:"MAP",
        input:{
          IN:{
            type:"DIR"
          },
          RUN:{
            type:"MODVAL+"
          },
          REGEX:{
            type:"VAL"
          },
          CHUNK_SIZE:{
            type:"VAL",
            value:"10"
          }
        },
        output:{},
        exec:[]
      },
      modulename:"_MAP",
      source:"",
      sourcepath:"/no/path"
    };
  }

  vw.cpm.ModuleManager.prototype.parseModuleTree = function(tree){
    if(typeof tree == "object"){
      if(tree.constructor === Array){
        for (var i = tree.length - 1; i >= 0; i--) {
          this.parseModuleTree(tree[i])
        };  
      }else{
        if(tree.hasOwnProperty("folder") && tree.folder){
          this.parseModuleTree(tree.items);
        }else{
          this.modules[tree.modulename] = tree;
        }
      }
    }
  }

  vw.cpm.ModuleManager.prototype.fetch = function(modulename,callback){
    var me = this;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"module info "+modulename+" --json"},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        callback.call(me,data);
      }
    })

  }

  vw.cpm.ModuleManager.prototype.checkNameExist = function(modulepath,modulename,success,failure){
    var me = this;
    var regex = /^(_?[a-zA-Z][a-zA-Z0-9\-_]+(@[a-zA-Z0-9\-_]+)?)(#(?:\w|-)+)?$/;
    var match = regex.exec(modulename);
    if(!match){
      failure.call(me,"Module name isn't valid. Please choose another name.");
      return;
    }
    var allowedDirectory = false;
    for (var i = me.app.cpmsettingsmanager.cpmsettings.modules.length - 1; i >= 0; i--) {
      if(me.app.cpmsettingsmanager.cpmsettings.modules[i].exist && modulepath.indexOf(me.app.cpmsettingsmanager.cpmsettings.modules[i].name) == 0){
        allowedDirectory = true;
        break;
      }
    }
    if(!allowedDirectory){
      failure.call(me,"The directory you choose isn't located within modules directories.");
      return;
    }
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"module ls --name"},
      success:function(data,textStatus,jqXHR){
        var modulenames = data.split("\n");
        for (var i = 0; i < modulenames.length; i++) {
          modname = modulenames[i].trim();
          if(modname == modulename){
            failure.call(me,"Module name already exist. Please choose another name.");
            return;
          }
        }
        success.call();
      },
      error:function(){
        failure.call(me,"Error when retrieving existing modules.");
      }
    });
  }

  vw.cpm.ModuleManager.prototype.prepareCreateNewModule = function(source){
    var me = this;
    var modal = new vw.cpm.ui.Modal();
    $preconfig = $(vw.cpm.ModuleManagerView.templatePreConfigAddNew);
    $preconfig.find('input[name="directory"]').val(me.app.cpmsettingsmanager.defaultModulesDir);
    $preconfig.find('.create-module-preconfig-submit').click(function(){
      var modulename = $preconfig.find('input[name="name"]').val();
      var dirpath = $preconfig.find('input[name="directory"]').val();
      me.checkNameExist(dirpath,modulename,function(){
        modal.close();
        me.createNewModule(modulename,dirpath,source);
      },function(errormessage){
        var modalcontent = modal.getContainer();
        modalcontent.find(".error-message").remove();
        modalcontent.prepend('<div class="error-message">'+errormessage+'</div>');
      });
    });
    modal.open($preconfig);
  }

  vw.cpm.ModuleManager.prototype.createNewModule = function(modulename,containerdirpath,prefilledsource){
    var me = this;
    var panel = me.app.view.createPanel(modulename,"","moduledef-"+modulename,new vw.cpm.Command("m",modulename));
    var modulecontent = {
      name:modulename,
      desc:"please fill in a brief description",
      input:{
        IN : {
          type : "VAL",
          desc : "you can add some description here, baisc valid types are VAL,FILE,DIR. format and schema are optional field for documentation purpose for now.",
          format : "unknown",
          schema : "unknown"
        }
      },
      output:{
        OUT : {
          type : "VAL",
          desc : "you can add some description here, baisc valid types are VAL,FILE,DIR. format and schema are optional field for documentation purpose for now.",
          format : "unknown",
          schema : "unknown",
          value : "\"mandatory value (can use exec modules outputs : ${_CMD#mandatory_id_for_same_name_modules.STDOUT})\""
        }
      },
      exec:[
        {
          "_CMD#mandatory_id_for_same_name_modules" : {
            CMD : "echo \"Hello $IN ! \""
          }
        }
      ],
    };
    var sourcecontent = YAML.stringify(modulecontent,99);
    if(prefilledsource){
      sourcecontent = prefilledsource.replace(/name\s*:(.*)/g,"name : "+modulename);
      modulecontent = YAML.parse(sourcecontent);
    }
    var newmoduledef = {
      module:modulecontent,
      modulename:modulename,
      source:sourcecontent,
      sourcepath:containerdirpath+"/"+modulename+".module",
      creation:true
    };
    var module = new vw.cpm.Module(me.app,panel.$el.find(".frame-body"),newmoduledef);
    module.def.warning = "If you wish to prevent other users from modifying this module definition, please set proper unix permissions in the file ("+containerdirpath+"/"+modulename+".module"+") created in the server.";
    module.view.render();
    module.sync();
    return module;
  }

  vw.cpm.ModuleManager.prototype.showModule = function(modulename){
    var me = this;
    var panel = me.app.view.getPanelFromSID("moduledef-"+modulename,false,modulename,new vw.cpm.Command("m",modulename));
    var module = new vw.cpm.Module(me.app,panel.$el.find(".frame-body"),me.modules[modulename]);
    me.modulesobj.push(module);
    module.view.render();
    panel.focus();
  }

  vw.cpm.ModuleManager.prototype.getModule = function(modulename){
    for (var i in modulesobj){
      if(modulesobj[i].def.modulename==modulename){
        return modulename;
      }
    }
    return new vw.cpm.Module(me.app,undefined,me.modules[modulename]);
  }


}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.Process = function(app,$el,conf){
    this.app = app;
    this.init(conf);
    this.view = new vw.cpm.ProcessView(this,$el);
  }

  vw.cpm.Process.prototype.init = function(conf){
    this.moduledef = conf.moduledef;
    this.conf = conf.runconf;
    this.runid = conf.runid;
    this.info = {};
    this.synced = false;
  }

  vw.cpm.Process.prototype.sync = function($button,success){
    var me = this;
    vw.cpm.ui.AjaxButton.start($button);
    $.ajax({
      type: "POST",
      data : {
        cmd: "process get "+me.runid,
      },
      url: me.app.options.cpmbaseurl+"rest/cmd",
      dataType : "json",
      success: function(data, textStatus, jqXHR) {
        vw.cpm.ui.AjaxButton.stop($button);
        me.info = data;
        me.synced = true;
        me.view.refresh();
        if(success){
          success.call(this,data);
        }
      },
      error:function(){
        vw.cpm.ui.AjaxButton.stop($button);
        alert('could not parse process info json (run id = '+me.runid+')');
      }
    });
  }

  vw.cpm.Process.prototype.getStatus = function(callback){
    var me = this;
    $.ajax({
      type: "POST",
      data : {
        cmd: "process status "+me.runid+" --json",
      },
      url: me.app.options.cpmbaseurl+"rest/cmd",
      dataType : "json",
      success: function(data, textStatus, jqXHR) {
        callback.call(me.view,data);
      },
      error:function(){
        alert('could not parse process info json (run id = '+me.runid+')');
      }
    });
  }

  vw.cpm.Process.prototype.delete = function($button){
    var me = this;
    vw.cpm.ui.AjaxButton.start($button);
    $.ajax({
      type : "POST",
      data : {
        cmd : "process del "+me.runid
      },
      url : me.app.options.cpmbaseurl+"rest/cmd",
      success : function(data){
        vw.cpm.ui.AjaxButton.stop($button);
        if(data == "ok"){
          var panel = me.app.view.getPanelFromContent(me.view.$el);
          panel.delete();
          me.app.processmanager.remove(me.runid);
        }
      },
      error : function(){
        vw.cpm.ui.AjaxButton.stop($button);
        me.app.logger.error("error when trying to delete process result "+me.runid);
      }
    });
  }

  

  vw.cpm.Process.prototype.run = function(conf,success,error){
    var me = this;
    me.app.logger.debug(conf);
    if(success){
      success.call(me.view);
    }
  }

  vw.cpm.Process.pConf2mConf = function(pConf){
    var mConf = {}
    for (var key in pConf){
      if(key != "_RUN_DIR" && key != "_DEF_DIR"){
        mConf[key] = pConf[key].value;
      }
    }
    return mConf;
  }

  vw.cpm.Process.prototype.rerun = function(){
    var me = this;
    var conf = vw.cpm.Process.pConf2mConf(me.info.runconf);
    var module = new vw.cpm.Module(me.app,undefined,me.app.modulesmanager.modules[me.info.name]);
    module.run(conf);
  }

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ProcessManager = function(app,$el,options){
    this.initiated = false;
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.ProcessManagerView(this,$el);
    this.init();
    this.startedprocess = []; // for websocket update only those
    this.runs = {};
    this.onStop = {};
  }

  vw.cpm.ProcessManager.prototype.init = function(){
    var me = this;
    me.fetchAll();
  }

  vw.cpm.ProcessManager.prototype.showRun = function(modulename,runid){
    var me = this;
    var panel = this.app.view.getPanelFromSID("process-"+runid,false,'<span class="link">'+modulename + "</span> ( "+runid+" )",new vw.cpm.Command("p",{name:modulename,runid:runid}));
    panel.$el.find(".frame-title").find(".link").click(function(){
      me.app.modulesmanager.showModule(modulename);
    });
    var process = new vw.cpm.Process(this.app,panel.$el.find(".frame-body"),{moduledef:me.app.modulesmanager.modules[modulename].module,runconf:{},runid:runid});
    process.sync();
    panel.focus();
  }

  vw.cpm.ProcessManager.prototype.remove = function(runid){
    var me = this;
    var found = false;
    for (runmodulename in me.runs){
      for(var i = 0 ; i < me.runs[runmodulename].length ; i++){
        if(me.runs[runmodulename][i].runid == runid){
          me.runs[runmodulename].splice(i,1);
          if(me.runs[runmodulename].length == 0){
            delete me.runs[runmodulename];
          }
          found = true;
          break;
        }
      }
      if(found){
        break;
      }
    }
    me.view.refresh();
  }

  vw.cpm.ProcessManager.prototype.fetchAll = function(modulename,callback){
    var me = this;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"process ls -a"},
      dataType : 'text',
      success:function(data,textStatus,jqXHR){
        me.runs = {};
        var processes = data.split("\n");
        for (var i in processes){
          var process = processes[i].trim();
          if(process!=""){
            var pinfo = process.split(":");
            var runmodulename = pinfo[0].trim();
            regex = /(.*?)\((.*?)\)/;
            var match = regex.exec(pinfo.slice(1).join(":").trim());
            if(!match){
              continue;
            }
            var runid = match[1].trim();
            var date = match[2].trim();
            if(me.runs.hasOwnProperty(runmodulename)){
              me.runs[runmodulename].push({runid:runid,datecreated:date});
            }else{
              me.runs[runmodulename] = [{runid:runid,datecreated:date}];
            }
          }
        }
        me.view.refresh();
        me.initiated = true;
      }
    });

  }



}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ServiceManager = function(app,$el,options){
    this.initiated = false;
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.ServiceManagerView(this,$el);
    this.init();
    this.services = []; 
  }

  vw.cpm.ServiceManager.prototype.init = function(){
    var me = this;
    me.fetchAll();
  }

  vw.cpm.ServiceManager.prototype.showService = function(servicename){
    var me = this;
    for (var i = me.services.length - 1; i >= 0; i--) {
      if(me.services[i].name == servicename){
        var service = me.services[i];
        var title = service.name;
        if(service.url){
          title = '<a href="'+service.url+'" target="_blank">'+service.name+'</a>';
        }
        var panel = this.app.view.getPanelFromSID("service-"+servicename,false,title,new vw.cpm.Command("l",servicename));
        var serviceview = new vw.cpm.ServiceView(this.app,panel.$el.find(".frame-body"),service);
        break;
      }
    }
    
    panel.focus();
  }

  vw.cpm.ServiceManager.prototype.hasService = function(servicename){
    var me = this;
    for (var i = me.services.length - 1; i >= 0; i--) {
      if(me.services[i].name == servicename){
        return true;
      }
    }
    return false;
  }

  vw.cpm.ServiceManager.prototype.testService = function(serviceview,$button){
    var me = this;
    vw.cpm.ui.AjaxButton.start($button);
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"service test "+serviceview.service.name},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        vw.cpm.ui.AjaxButton.stop($button);
        var modal = new vw.cpm.ui.Modal();
        $content = $('<div><div>Results of the test are : </div><div class="service-test-result">'+data.result+'</div></div>');
        modal.open($content);
      },
      error:function(message){
        vw.cpm.ui.AjaxButton.stop($button);
        var modal = new vw.cpm.ui.Modal();
        $content = $('<div>Error happended when trying to launch test : '+message+'</div>');
        modal.open($content);
      }
    });
  }

  

  vw.cpm.ServiceManager.prototype.startService = function(serviceview,$button){
    var me = this;
    vw.cpm.ui.AjaxButton.start($button);
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"service start "+serviceview.service.name},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        vw.cpm.ui.AjaxButton.stop($button);
        if(data.error){
          me.app.logger.error(data.error);
        }else{
          serviceview.service.status = true;
          me.view.refresh();
          serviceview.refresh();
        }
      },
      error:function(){
        vw.cpm.ui.AjaxButton.stop($button);
      }
    });
  }

  vw.cpm.ServiceManager.prototype.stopService = function(serviceview,$button){
    var me = this;
    vw.cpm.ui.AjaxButton.start($button);
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"service stop "+serviceview.service.name},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        vw.cpm.ui.AjaxButton.stop($button);
        if(data.error){
          me.app.logger.error(data.error);
        }else{
          serviceview.service.status = false;
          me.view.refresh();
          serviceview.refresh();
        }
      },
      error:function(){
        vw.cpm.ui.AjaxButton.stop($button);
      }
    });
  }


  vw.cpm.ServiceManager.prototype.fetchAll = function(modulename,callback){
    var me = this;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"service ls"},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        if(data.error){
          me.app.logger.error(data.error);
        }else{
          me.services = data;
          me.view.refresh();
          me.initiated = true;          
        }
      }
    });

  }



}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.TestApp = function(appfm){
    this.appfm = appfm;
    this.view = new vw.cpm.TestAppView(this);
  };



  /*********************************
  *       View
  * *********************************/

  vw.cpm.TestAppView = function(model,$el){
    this.model = model;
    this.$el =  $el || $('<div></div>');
  }

  vw.cpm.TestAppView.prototype.show = function(){
    var me = this;
    this.$el.empty();
    if (!Object.keys(this.model.appfm.modulesmanager.modules).indexOf("es-search") ||
      !Object.keys(this.model.appfm.modulesmanager.modules).indexOf("elasticsearch-brat-index") ||
      !this.model.appfm.servicemanager.hasService("elasticsearch")
      ){
      this.$el.append("missing some of the required modules/services..");
    }else{
      this.$el.append(vw.cpm.TestAppView.template);
      this.$el.find("#testapp-submit").click(function(){
        var moduledata = me.model.appfm.modulesmanager.modules["es-search"];
        var module = new vw.cpm.Module(me.model.appfm,undefined,moduledata);
        var conf = {
          "NE": me.$el.find("#testapp-input").val()
        }
        module.run(conf,function(data){
          var runid = data;
          me.model.appfm.processmanager.onStop[runid]=function(){
            var process = new vw.cpm.Process(me.model.appfm,undefined,{moduledef:me.model.appfm.modulesmanager.modules["es-search"].module,runconf:{},runid:runid});
            process.sync(undefined,function(result){
              var html = jQuery('<div />').text(result.env["_CMD.STDOUT"].value).html();
              html = '<code><pre class="pre-wrapped">'+html+'</pre></code>';
              me.$el.find('#testapp-results').html(html);
              process.delete();
            });
          } 
          
        },undefined,true);
      });
    }

  }

  vw.cpm.TestAppView.template = '<div><input id="testapp-input" type="text"><br><button id="testapp-submit">Search</button><br><div id="testapp-results"></div></div>';

 

}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.CLIView = function(model,$el){
    this.$el = $el;
    this.el = $el[0];
    this.model = model;
    this.init();

    this.panels = [];
  };

  vw.cpm.CLIView.maxFrameHeight = 500;

  vw.cpm.CLIView.prototype.init=function(){
    var me = this;

    this.$fullscreencontainer = $(vw.cpm.CLIView.fullscreentemplate);
    $('body').append(this.$fullscreencontainer);

    vw.cpm.CLIView.maxFrameHeight = $(window).height()-178 ;

    $("#cmd-bar-container").perfectScrollbar({suppressScrollX:true});  

    $("#active-content").css('height',window.innerHeight-94);
    $("#active-content").perfectScrollbar({suppressScrollX:true});

    $("#menu-content-body").css('height',window.innerHeight-80);
    $("#menu-content-body").perfectScrollbar({suppressScrollX:true});
    $(window).on('resize',function(){
      $("#menu-content-body").css('height',window.innerHeight-80);
      $("#menu-content-body").perfectScrollbar({suppressScrollX:true});
      $("#active-content").css('height',window.innerHeight-94);
      $("#active-content").perfectScrollbar({suppressScrollX:true});
      vw.cpm.CLIView.maxFrameHeight = $(window).height()-178 ;
    });

    $("#log-button").click(function(){
      me.model.logger.view();
    });


    this.contentpanel = $("#active-content");

    this.cmdbar = $('#cmdbar').cmd({
        prompt: '$',
        width: '100%',
        commands: function(command) {
            me.model.request($('<div>'+command+'</div>').text());
        }
        /*
        keydown:function(e,term){
          console.log(arguments);
          console.log(this);
        }*/
    });

    $('#cmdbar').on("mousedown",function(e){
      if(e.which == 2 && vw.cpm.currentTextSelection){
        me.cmdbar.insert(vw.cpm.currentTextSelection);
        me.toggleCLI(true);
      }
    });

    

    jQuery("#app-title").click(function(){
      me.toggleCLI(false);
      me.setMenuActive(this);
      // set default menu if menu is to be opened and is empty
      if(me.model.activemenu =="default"){
        jQuery(".menu-open").switchClass("menu-open","menu-closed");
        jQuery(".menu-closed").switchClass("menu-closed","menu-open");
      }else{
        me.openMenu("default");
      }
      
    });

    $(".main-menu-item").click(function(){
      me.setMenuActive(this);
      if(me.model.activemenu == this.id){
        jQuery(".menu-open").switchClass("menu-open","menu-closed");
        jQuery(".menu-closed").switchClass("menu-closed","menu-open");
      }else{
        me.openMenu(this.id);
      }
    });

    // Menu animations
    jQuery("#menu").click(function(){
      me.toggleCLI(false);
    });

    jQuery("#menu-content").on("click",function(){
      me.toggleCLI(false);
    });

    jQuery("#active-content").on("click",function(){
      me.toggleCLI(false);
    });

    jQuery("#cmd-bar-container").on("click",function(){
      me.toggleCLI(true);
    });
  }

  vw.cpm.CLIView.activeMenu = undefined;

  vw.cpm.CLIView.prototype.setMenuActive = function(menubutton){
    if(vw.cpm.CLIView.activeMenu){
      var $activeli = $(vw.cpm.CLIView.activeMenu).parent("li");
      if($activeli.length!=0){
        $activeli.removeClass("main-menu-active");
      }
      if(menubutton.id == this.model.activemenu){
        vw.cpm.CLIView.activeMenu = undefined;
        return;
      }
    }
    var $li = $(menubutton).parent("li");
    vw.cpm.CLIView.activeMenu = menubutton;
    if($li.length!=0){
      $li.addClass("main-menu-active");
    }
  }

  vw.cpm.CLIView.prototype.closeMenu = function(){
    var me = this;
    me.model.activemenu = "default";
    me.model.setActiveMenu("default");
    jQuery(".menu-open").switchClass("menu-open","menu-closed");
  }

  vw.cpm.CLIView.prototype.openMenu = function(id){
    var me = this;
    jQuery(".menu-closed").switchClass("menu-closed","menu-open");
    me.model.setActiveMenu(id);
    me.model.activemenu = id;
  }

  vw.cpm.CLIView.prototype.setStatusButton = function(status){
    $("#status-button").removeClass();
    $("#status-button").addClass("status-button-"+status);
    if(status == "limited"){
      $("#status-button").attr("title","Websocket does not seem to work. You can try to reconnect via the settings page. Some feature won't be available till then...");
    }else{
      $("#status-button").attr("title",undefined);
    }
  }

  vw.cpm.CLIView.prototype.resourceInfo = function(infos){
    $("#resources-info").html("Proc : "+infos["proc"]+" | Mem : "+infos["mem"]);
  }

  vw.cpm.CLIView.prototype.toggleCLI = function(activate){
    if(activate){
      if(!this.cmdbar.isenabled()){
        this.cmdbar.enable();
        this.cmdbar.focus();
      }
    }else{
      if(this.cmdbar.isenabled()){
        this.cmdbar.disable();
      }
    }
  }

  vw.cpm.CLIView.prototype.refreshPanelList = function(){
    var me =this;
    var html = "";
    var serialized = [];
    for (var i = me.panels.length - 1; i >= 0; i--) {
      var panel = me.panels[i];
      serialized.push(panel.serialize());
      var title = panel.$el.find('.frame-title').text();
      var paneltype = "";
      if(panel.cmd){
        paneltype = "panel-"+panel.cmd.command+"-item";
      }
      html += '<div class="panel-item '+paneltype+'" uid="'+panel.uid+'" title="'+title+'">'+title+'</div><div class="panel-item-close" uid="'+panel.uid+'"></div>';
    }
    store.set(me.model.options.cpmhost+"-panels",serialized);
    this.model.menus["default"].body.empty();
    this.model.menus["default"].body.append(html);
    this.model.menus["default"].body.find(".panel-item").click(function(){
      var panel = me.getPanelFromUID($(this).attr("uid"));
      panel.focus();
    });
    this.model.menus["default"].body.find(".panel-item-close").click(function(){
      var panel = me.getPanelFromUID($(this).attr("uid"));
      panel.delete();
    });


  }

  vw.cpm.CLIView.prototype.getPanelFromSID = function(sid,do_not_create_new_if_not_found,title,cmd){
    var me = this;
    var index = -1;
    for(var i in me.panels){
      if(me.panels[i].semanticid != undefined && me.panels[i].semanticid==sid){
        index = i;
        break;
      }
    }
    if(index!=-1){
      return me.panels[index];
    }else if(do_not_create_new_if_not_found){
      return undefined;
    }else{
      return me.createPanel(title,"",sid,cmd);
    }
  }

  vw.cpm.CLIView.prototype.getPanel = function(title,do_not_create_new_if_not_found,cmd){
    var me = this;
    var index = -1;
    for(var i in me.panels){
      if(me.panels[i].$el.find(".frame-title").html()==title){
        index = i;
        break;
      }
    }
    if(index!=-1){
      return me.panels[index];
    }else if(do_not_create_new_if_not_found){
      return undefined;
    }else{
      return me.createPanel(title,undefined,undefined,cmd);
    }

  }

  vw.cpm.CLIView.prototype.getPanelFromUID = function(uid){
    var me = this;
    var index = -1;
    for(var i in me.panels){
      if(me.panels[i].uid==uid){
        index = i;
        break;
      }
    }
    if (index != -1){
      return me.panels[index];
    }else{
      return undefined;
    }
  }

  vw.cpm.CLIView.prototype.getPanelFromContent = function($el){
    if(!$el){
      return undefined;
    }
    return this.getPanelFromUID($el.parents(".frame").attr("uid"));
  }


  vw.cpm.CLIView.prototype.createPanel = function(title,data,sid,cmd){
    var panel = new vw.cpm.Panel(this.model,title,data,sid,cmd);
    
    return panel;
  }

  vw.cpm.CLIView.fullscreentemplate = '<div id="fullscreen-container"><div class="frame-header"><div class="frame-title"></div><div class="frame-tools"><div class="frame-tool frame-tool-quitfs"></div></div></div><div class="frame-body"></div></div>';


}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.CorpusManagerView = function(model,$el){
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.CorpusManagerView.prototype.init=function(){
    var me = this;
    this.$el.empty();
    var template = '<div class="treeview-fold treeview-unfolded" depth="0"><div class="treeview-node">Corpora</div><div id="corpora-corpora-container"></div></div><div class="treeview-fold treeview-unfolded" depth="0"><div class="treeview-node">Results</div><div id="corpora-results-container"></div></div>';
    this.$el.append(template);
    this.$el.find('.treeview-node').on("click",function(){
      var parent = $(this).parent();
      if(parent.hasClass("treeview-fold")){
        var children = parent.children();
        if(parent.hasClass("treeview-folded")){
          $(children[1]).slideDown();
          parent.removeClass("treeview-folded");
          parent.addClass("treeview-unfolded");
        }else{
          $(children[1]).slideUp();
          parent.removeClass("treeview-unfolded");
          parent.addClass("treeview-folded");
        }
      }
    });
  }

  vw.cpm.CorpusManagerView.prototype.renderCorpora = function(data,path){
    var me = this;
    var directory = {};
    directory[path] = data;
    var $html = me.renderDirectory([directory],"",1);
    this.$el.find("#corpora-corpora-container").append($html);
  }

  vw.cpm.CorpusManagerView.prototype.renderResults = function(data){
    var me = this;
    var $html = me.renderDirectory(data,me.model.app.cpmsettingsmanager.cpmsettings.result_dir,1);
    this.$el.find("#corpora-results-container").empty();
    this.$el.find("#corpora-results-container").append($html);
  }

  vw.cpm.CorpusManagerView.prototype.refresh = function(){
    var me = this;
    var corpus = vw.cpm.CorpusManagerView.renderSubTree(this.model.filetree.corpus,0,me.model.app.cpmsettingsmanager.cpmsettings.corpus_dir);
    var results = vw.cpm.CorpusManagerView.renderSubTree(this.model.filetree.results,0,me.model.app.cpmsettingsmanager.cpmsettings.result_dir);
    this.$el.html(corpus+results);

    this.$el.find('.treeview-node').on("click",function(){
      var parent = $(this).parent();
      if(parent.hasClass("treeview-fold")){
        var children = parent.children();
        if(parent.hasClass("treeview-folded")){
          $(children[1]).slideDown();
          parent.removeClass("treeview-folded");
          parent.addClass("treeview-unfolded");
        }else{
          $(children[1]).slideUp();
          parent.removeClass("treeview-unfolded");
          parent.addClass("treeview-folded");
        }
      }
    });
    this.$el.find('.treeview-node').not(".treeview-more").draggable({ appendTo: "body",opacity: 0.7, helper: "clone" });
    this.$el.find('.treeview-leaf').not(".treeview-more").draggable({ appendTo: "body",opacity: 0.7, helper: "clone" });
  }

  function compareTreeView(a,b){
    var at = typeof a;
    var bt = typeof b;
    
    if(a.hasOwnProperty("...")){
      return -1;
    }else if(b.hasOwnProperty("...")){
      return 1;
    }else if(at != bt){
      if(at == "string"){
        return -1;
      }else if(bt == "string"){
        return 1;
      }else{
        return 0; // should not happen since it means that both elements are objects
      }
    }else {
      return 0;
    }
  }

  vw.cpm.CorpusManagerView.renderSubTree = function(tree,offset,parentpath){
    var html = "";
    if(typeof tree == "object"){
      if(tree.constructor === Array){
        tree = tree.sort(compareTreeView);
        for (var i = tree.length - 1; i >= 0; i--) {
          html += vw.cpm.CorpusManagerView.renderSubTree(tree[i],offset,parentpath)
        };  
      }else{
        for (var i in tree) {
          if(i=="..."){
            if(tree[i] == "file"){
              html += '<div class="treeview-leaf treeview-more" style="margin-left:'+offset+'px;" filepath="'+parentpath+'">'+i+'</div>';
            }else{
              html += '<div class="treeview-node treeview-more" style="margin-left:'+offset+'px;" filepath="'+parentpath+'">'+i+'</div>';
            }
          }else{
            var folded = "treeview-folded";
            var hidden = 'style="display:none;"';
            var name = i;
            if(offset == 0){
              folded = "treeview-unfolded";
              hidden = "";
              name = "";
            }
            html += '<div class="treeview-fold '+folded+'"><div class="treeview-node" style="margin-left:'+offset+'px;" filepath="'+parentpath+name+'">'+i+'</div><div '+hidden+'>' + vw.cpm.CorpusManagerView.renderSubTree(tree[i],offset + 14,parentpath+name+"/")+'</div></div>';
          }
        };
      }

    }else if(typeof tree == "string"){
      html += '<div class="treeview-leaf" style="margin-left:'+offset+'px;" filepath="'+parentpath+tree+'">'+tree+'</div>';
    }
    return html;
  }

  vw.cpm.CorpusManagerView.prototype.renderDirectory = function(data,parentpath,depth){
    var me = this;
    var offset = depth*14;
    var html = "<div>";
    for (var i = 0; i < data.length; i++) {
      if(typeof data[i] == "object"){
        var filename = _.first(_.keys(data[i]));
        if(filename == "..."){
          html += '<div class="treeview-leaf treeview-more" style="margin-left:'+offset+'px;" filepath="'+parentpath+'" next="'+data[i][filename]+'">'+filename+'</div>';
        }else{
          var startingslash = "/";
          if(filename.indexOf("/")==0){
            startingslash = "";
          }
          html += '<div class="treeview-fold treeview-folded" depth="'+depth+'"><div class="treeview-node" style="margin-left:'+offset+'px;" filepath="'+parentpath+startingslash+filename+'">'+filename+'</div><div style="display:none;"></div></div>';
        }
      }else{
        var filename = data[i];
        var startingslash = "/";
        if(filename.indexOf("/")==0){
          startingslash = "";
        }
        html += '<div class="treeview-leaf" style="margin-left:'+offset+'px;" filepath="'+parentpath+startingslash+filename+'">'+filename+'</div>';
      }
    };
    html+="</div>";
    var $html = $(html);
    $html.find('.treeview-leaf').not(".treeview-more").click(function(){
      var that = this;
      var filepath = $(this).attr("filepath");
      me.model.app.openFile(filepath);
    });
    $html.find('.treeview-more').click(function(){
      var that = this;
      var filepath = $(this).attr("filepath");
      var parent = $(this).parent();
      var offset = $(this).attr("next");
      var depth = 0;
      $(that).addClass("treeview-leaf-waiting");
      if(parent.parent().hasClass("treeview-fold")){
        depth = parent.parent().attr("depth");
      }
      me.model.lsDir(filepath,offset,function(newdata,parentpath){
        var addedhtml = me.renderDirectory(newdata,parentpath,parseInt(depth)+1);
        $(that).removeClass("treeview-leaf-waiting");
        $(that).replaceWith(addedhtml);
      });
    });
    $html.find('.treeview-node').click(function(){
      var that = this;
      var filepath = $(this).attr("filepath");
      var parent = $(this).parent();
      var offset = 0;
      var depth = 0;
      $(that).addClass("treeview-node-waiting");
      if(parent.hasClass("treeview-fold")){
        depth = parent.attr("depth");
      }
      $(that).unbind("click");
      me.model.lsDir(filepath,offset,function(newdata,parentpath){
        var addedhtml = me.renderDirectory(newdata,parentpath,parseInt(depth)+1);
        var parent = $(that).parent(".treeview-fold");
        var children = parent.children();
        parent.removeClass("treeview-folded");
        parent.addClass("treeview-unfolded");
        $(that).removeClass("treeview-node-waiting");
        $(children[1]).append(addedhtml);
        $(children[1]).slideDown();
        $(that).on("click",function(){
          var parent = $(this).parent();
          if(parent.hasClass("treeview-fold")){
            var children = parent.children();
            if(parent.hasClass("treeview-folded")){
              $(children[1]).slideDown();
              parent.removeClass("treeview-folded");
              parent.addClass("treeview-unfolded");
            }else{
              $(children[1]).slideUp();
              parent.removeClass("treeview-unfolded");
              parent.addClass("treeview-folded");
            }
          }
        });
      });
    });
    $html.find('.treeview-node').not(".treeview-more").draggable({ appendTo: "body",opacity: 0.7, helper: "clone" });
    $html.find('.treeview-leaf').not(".treeview-more").draggable({ appendTo: "body",opacity: 0.7, helper: "clone" });
    return $html.children();
  }


}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.CPMSettingsManagerView = function(model,$el){
    this.id = vw.cpm.utils.guid();
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.CPMSettingsManagerView.prototype.init=function(){
    var me = this;
    
  }

  vw.cpm.CPMSettingsManagerView.prototype.render = function(){
    var me = this;
    this.$el.empty();
    
    var data = this.model.cpmsettings;
    var html ='<div><button class="cpm-refresh">Refresh</button></div>';
    html +='<div><button class="cpm-reconnect-ws">Reconnect (websockets)</button></div>';
    html += '<div class="settings-field-title"> Connection infos : </div>';
    html += '<div class="settings-field-body"><select id="server-chooser">';
    for (var server in me.model.app.options.servers) {
      var selected = ""
      if(this.model.app.options.cpmhost == me.model.app.options.servers[server]["CPM_HOST"]){
        selected = "selected"
      }
      html+= '<option value="'+server+'" '+selected+'>'+server+'</option>';
    }
    html += '</select></div>';
    html += '<div class="settings-field-body"><div>AppFM Host : </div><input type="text" name="cpmhost" value="'+this.model.app.options.cpmhost+'"></div>';
    html += '<div class="settings-field-body"><div>AppFM Port : </div><input type="text" name="cpmport" value="'+this.model.app.options.cpmport+'"></div>';
    html += '<div class="settings-field-body"><div>AppFM WS Host+Port : </div><input type="text" name="cpwsmhost" value="'+this.model.app.options.cpmwshost+'"></div>';
    html +='<div class="settings-field-body"><button class="cpm-reconnect">Connect</button></div>';
    html += '<div class="settings-field-title"> Corpus directories : </div><div class="settings-field-body">';
    for (var i = data.corpus_dir.length - 1; i >= 0; i--) {
      html += "<li> "+ data.corpus_dir[i]+'</li>';
    };
    html += '</ul></div>';
    html += '<div class="settings-field-title"> Result directory : </div><div class="settings-field-body">'+data.result_dir+'</div>';
    var moduledir = '<div class="settings-field-title"> Modules directories :</div><div class="settings-field-body"><ul>';
    for (var i = data.modules.length - 1; i >= 0; i--) {
      moduledir += "<li ";
      if(data.modules[i].exist){
        moduledir += '>';
      }else{
        moduledir += 'class="warning-field">';
      }
      moduledir+= data.modules[i].name+'</li>';
    };
    moduledir += '</ul></div>';
    html += moduledir;
    this.$el.append(html);

    this.$el.find('#server-chooser').on("change",function(){
      var servername = $(this).val();
      me.$el.find('input[name=cpmhost]').val(me.model.app.options.servers[servername]["CPM_HOST"]);
      me.$el.find('input[name=cpmport]').val(me.model.app.options.servers[servername]["CPM_PORT"]);
      me.$el.find('input[name=cpwsmhost]').val(me.model.app.options.servers[servername]["CPM_WS_HOST"]);
    });

    this.$el.find('.cpm-reconnect').click(function(){
      var host = me.$el.find('input[name=cpmhost]').val();
      var port = me.$el.find('input[name=cpmport]').val();
      var wshostport = me.$el.find('input[name=cpwsmhost]').val();
      me.model.updateConnection(host,port,wshostport);
    });

    
    this.$el.find(".cpm-refresh").click(function(){
      me.model.app.reload();
    });
    this.$el.find(".cpm-reconnect-ws").click(function(){
      me.model.app.initWS();
    });
  }

 
  



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.HelpManagerView = function(model,$el){
    this.id = vw.cpm.utils.guid();
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.HelpManagerView.prototype.init=function(){
    var me = this;
    this.$el.append(vw.cpm.HelpManagerView.template);

    this.$el.find("#help-main-wiki-page").on("click",function(){
      me.model.app.openIFrame(me.model.app.options.cpmbaseurl+'/dokuwiki/',"Wiki");
    });
    this.$el.find("#help-presa-slides").on("click",function(){
      me.model.app.openIFrame(me.model.app.options.cpmbaseurl+'/introslides',"Intro");
    });
    this.$el.find("#help-presa-overview").on("click",function(){
      me.model.app.openIFrame(me.model.app.options.cpmbaseurl+'/public/doc/appfm-overview.pdf',"AppFM Overview");
    });
    this.$el.find("#help-presa-limsi").on("click",function(){
      me.model.app.openIFrame(me.model.app.options.cpmbaseurl+'/public/doc/appfm-presentation.pdf',"Présentation 28/06/2016");
    });
    this.$el.find("#help-tutorial").on("click",function(){
      me.model.app.demo();
    });
    /*
    this.$el.find("#help-tutorial-module").on("click",function(){
      me.model.app.demoModule();
    });*/
    
    
  }

  vw.cpm.HelpManagerView.template = '<div id="help-tutorial" style="cursor:pointer;">Tutorial</div><div id="help-presa-limsi" style="cursor:pointer;">Séminaire LIMSI</div><div id="help-presa-slides" style="cursor:pointer;">Introduction slides</div><div id="help-presa-overview" style="cursor:pointer;">Architecture/Features Overview</div><div id="help-main-wiki-page" style="cursor:pointer;">Main wiki</div>';
  //<div id="help-tutorial-module" style="cursor:pointer;">Module tutorial</div>

  



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ModuleInputView = draw2d.shape.basic.Circle.extend({

    NAME : "Input",

    init : function(inputname,inputdata){
      this._super({stroke:3, color:"#3d3d3d", bgColor:"#3dff3d"});

      this.port = this.createPort("output", new draw2d.layout.locator.RightLocator(this));
      
      this.label = new draw2d.shape.basic.Label({text:inputname});

      //this.label.setStroke(0);
      this.add(this.label, new draw2d.layout.locator.BottomLocator(this));

      var data = inputdata;
      data.name = inputname;

      this.setUserData(data);
    },

    info : function(){
      var disabled = "";
      if(this.userData.name == "_RUN_DIR" || this.userData.name == "_DEF_DIR"){
        disabled = " disabled ";
      }
      var typevalue = "";
      if(this.userData.type){
        typevalue = this.userData.type;
      }
      var formatvalue = "";
      if(this.userData.format){
        formatvalue = this.userData.format;
      }
      var schemavalue = "";
      if(this.userData.schema){
        schemavalue = this.userData.schema;
      }
      var valuevalue = "";
      if(this.userData.value){
        valuevalue = this.userData.value;
      }

      var type = '<div>Type : <input class="mv-info-type" type="text" value="'+typevalue+'"'+disabled+'></div>';
      var format = '<div>Format : <input class="mv-info-format" type="text" value="'+formatvalue+'"'+disabled+'></div>';
      var schema = '<div>Schema : <input class="mv-info-schema" type="text" value="'+schemavalue+'"'+disabled+'></div>';
      var value = '<div>Default value : <input class="mv-info-value" type="text" value="'+valuevalue+'"'+disabled+'></div>';

      return $('<div><div>Name : <input class="mv-info-name" type="text" value="'+this.userData.name+'"'+disabled+'></div>'+type+format+schema+value+
        '</div>');
    }
  });

  vw.cpm.ModuleOutputView = draw2d.shape.basic.Circle.extend({

    NAME : "Output",

    init : function(outputname,outputdata){
      this._super({stroke:3, color:"#3d3d3d", bgColor:"#3dff3d"});

      this.port = this.createPort("input", new draw2d.layout.locator.LeftLocator(this));

      
      this.label = new draw2d.shape.basic.Label({text:outputname});

      //this.label.setStroke(0);
      this.add(this.label, new draw2d.layout.locator.BottomLocator(this)); 

      var data = outputdata;
      data.name = outputname;

      this.setUserData(data);
    },

    info : function(){
      var typevalue = "";
      if(this.userData.type){
        typevalue = this.userData.type;
      }
      var formatvalue = "";
      if(this.userData.format){
        formatvalue = this.userData.format;
      }
      var schemavalue = "";
      if(this.userData.schema){
        schemavalue = this.userData.schema;
      }
      var valuevalue = "";
      if(this.userData.value){
        valuevalue = this.userData.value;
      }

      var type = '<div>Type : <input class="mv-info-type" type="text" value="'+typevalue+'"></div>';
      var format = '<div>Format : <input class="mv-info-format" type="text" value="'+formatvalue+'"></div>';
      var schema = '<div>Schema : <input class="mv-info-schema" type="text" value="'+schemavalue+'"></div>';
      var value = '<div>Return value : <input class="mv-info-value" type="text" value="'+valuevalue+'"></div>';

      return $('<div><div>Name : <input class="mv-info-name" type="text" value="'+this.userData.name+'"></div>'+type+format+schema+value+
        '</div>');
    }
  });

  vw.cpm.ModuleConnectionView = function(start,end,labelname){
    var connection = new draw2d.Connection();
    //var label = new draw2d.shape.basic.Label({text:labelname, stroke:1, color:"#FF0000", fontColor:"#0d0d0d"});


    //connection.add(label, new draw2d.layout.locator.ParallelMidpointLocator());
    connection.setStroke(2);
    connection.setOutlineStroke(1);
    connection.setOutlineColor("#303030");
    connection.setRouter(null);
    connection.setColor("#91B93E");

    connection.setSource(start);
    connection.setTarget(end);

    var value = labelname;
    if(typeof labelname == "function"){
      //value = 
    }
    connection.setUserData({
      value:value
    });

    connection.info = function(){
      return $('<div>'+this.userData.value+'</div>');
    };

    return connection;
  }

  vw.cpm.ModuleMapBoxView = draw2d.shape.composite.Raft.extend({
    NAME : "ModuleMAP",

    init : function(def,execname,moduleval,namespace){
        this._super({width:200,height:200});

        var port = this.createPort("hybrid", new draw2d.layout.locator.LeftLocator(this));
        port.setName("input_"+execname+"_IN");


    },

    info : function(){
      return $('<div>map</div>');
    }


  });

  vw.cpm.ModuleBoxView = draw2d.shape.layout.VerticalLayout.extend({

    NAME: "Module",
  
    init : function(def,execname,moduleval,namespace)
    {
        this._super();
        // init the object with some good defaults for the activity setting.
        this.setUserData({def:def,name:execname,moduleval:moduleval,namespace:namespace});
        
        this.inputports = {};
        this.outputports = {};
        
        console.log(def);
        console.log(moduleval);
        //this.setCssClass("activity");
        this.setBackgroundColor("#f4f4f4");

        // UI representation
        this.setStroke(1);
        this.setColor("#e0e0e0");
        this.setRadius(1);  
        
        // Compose the top row of the shape
        //
        var top = this.createLabel(execname).setStroke(0);        
        this.label = top;
        
        // the middle part of the shape
        // This part contains the ports for the connection
        //
        var center =  new draw2d.shape.basic.Rectangle();  
        center.getHeight= function(){return 1;};
        center.setMinWidth(90);
        center.setColor("#e0e0e0");
        
        
        // finally compose the shape with top/middle/bottom in VerticalLayout
        //
        this.add(top);
        this.add(center);

        // the bottom of the activity shape
        //
        //
        //
        for(var inputname in def.module.input){
          var input = this.createLabel(inputname);   
          input.setMinHeight(30);
          input.setStroke(0);
          input.setBackgroundColor(null);
          input.setFontColor("#a0a0a0");
          var port = input.createPort("input", new draw2d.layout.locator.LeftLocator(input));
          port.setName("input_"+execname+"_"+inputname);
          this.inputports[inputname]=port;
          this.add(input);
        }

        for(var outputname in def.module.output){
          var output = this.createLabel(outputname);   
          output.setMinHeight(30);
          output.setStroke(0);
          output.setBackgroundColor(null);
          output.setFontColor("#a0a0a0");
          var port = output.createPort("output", new draw2d.layout.locator.RightLocator(output));
          port.setName("output_"+execname+"_"+outputname);
          this.outputports[outputname]=port;
          this.add(output);
        }
        
        
    },

    createLabel: function(txt){
       var label =new draw2d.shape.basic.Label({text:txt,padding:{left:10, top:3, right:10, bottom:5},resizeable:true});
       label.setStroke(1);
       label.setRadius(0);
       label.setBackgroundColor(null);
       label.setColor(this.bgColor.darker(0.2));
       label.onDoubleClick=function(angle){/* ignore them for the layout elements*/};
          
       return label;
     },

    info : function(){
      var inputs = "";
      for(var inputname in this.userData.moduleval.input){
        inputs += '<div>'+inputname+' : <input type="text" style="width:90%;" value="'+this.userData.moduleval.input[inputname]+'"></div>';
      }
      var outputs = "";
      if(this.userData.def.modulename!="_CMD" && this.userData.def.modulename!="_MAP"){
        for(var outputname in this.userData.def.module.output){
          outputs += '<div>'+outputname+' : <input type="text" style="width:90%;" value="'+this.userData.def.module.output[outputname].value+'" disabled></div>';
        }
      }
      var namespace = "";
      if(this.userData.namespace){
        namespace = this.userData.namespace;
      }
      return $('<div><div class="mv-info-title">'+this.userData.def.modulename+'</div>'+
        '<div>Namespace : <input type="text" value="'+namespace+'"></div>'+
        '<div style="font-size:1.45em;">Inputs</div>'+
        inputs+
        '<div style="font-size:1.45em;">Outputs</div>'+
        outputs+
        '</div>');
    }

   });





}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ModuleManagerView = function(model,$el){
    this.id = vw.cpm.utils.guid();
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.ModuleManagerView.prototype.init=function(){
    var me = this;

    $mastercontainer = $(vw.cpm.ModuleManagerView.template);
    me.$el.empty();
    me.$el.append($mastercontainer);

    me.$el.find("#modulemanager-menu").append('<div id="modulemanager-add-new">Create a new module</div>');
    me.$el.find("#modulemanager-menu").append('<input id="modulemanager-search" type="text">');
    me.$el.find("#modulemanager-add-new").click(function(){
      me.model.prepareCreateNewModule();
    });
    me.$el.find("#modulemanager-search").on("keyup",function(e){
      if(e.keyCode == 27){
        me.showAll();
        $(this).val("");
      }else{
        var query = $(this).val().trim();
        if(query){
          me.model.search(query,function(data){me.show(data);});
        }else{
          me.showAll();
        }
      }
    });
  }

  vw.cpm.ModuleManagerView.prototype.showAll = function(){
    this.$el.find(".treeview-leaf").each(function(i,e){
      var $node = $(e);
      if($node.hasClass("search-hidden")){
        $node.removeClass("search-hidden");
      }else if($node.hasClass("search-result")){
        $node.removeClass("search-result");
      }

    });
    this.$el.find('.treeview-node').each(function(i,e){
      if($(e).hasClass("search-hidden")){
        $(e).removeClass("search-hidden");
      }
    })
  }

  vw.cpm.ModuleManagerView.prototype.show = function(list){
    this.$el.find(".treeview-leaf").each(function(i,e){
      var $node = $(e);
      if(list.indexOf($node.html().trim()) == -1){
        if(!$node.hasClass("search-hidden")){
          $node.addClass("search-hidden");
        }
        if($node.hasClass("search-result")){
          $node.removeClass("search-result");
        }
      }else{
        if($node.hasClass("search-hidden")){
          $node.removeClass("search-hidden");
        }
        if(!$node.hasClass("search-result")){
          $node.addClass("search-result");
        }
        var $parents = $node.parents(".treeview-module-folder-content");
        $parents.each(function(ip,ep){
          var $ep = $(ep);
          var $epp = $ep.parent();
          if($epp.hasClass("treeview-folded")){
            $ep.show();
            $epp.removeClass("treeview-folded");
            $epp.addClass("treeview-unfolded");
          }
        });
      }
    });
    this.$el.find('.treeview-node').each(function(i,e){
      if(!$(e).hasClass("search-hidden")){
        $(e).addClass("search-hidden");
      }
    })
  }



  vw.cpm.ModuleManagerView.prototype.refresh = function(){
    var me = this;

    this.$el.find("#modulemanager-list").html(vw.cpm.ModuleManagerView.renderSubTree(this.model.moduletree,0));
    this.$el.find('.treeview-node').on("click",function(){
      var parent = $(this).parent();
      if(parent.hasClass("treeview-fold")){
        var children = parent.children();
        if(parent.hasClass("treeview-folded")){
          $(children[1]).slideDown();
          parent.removeClass("treeview-folded");
          parent.addClass("treeview-unfolded");
        }else{
          $(children[1]).slideUp();
          parent.removeClass("treeview-unfolded");
          parent.addClass("treeview-folded");
        }
      }
    });
    this.$el.find('.treeview-leaf').on("click",function(){
      var modulename = $(this).html();
      me.model.showModule(modulename);
    });
    this.$el.find('.treeview-leaf').draggable({ appendTo: "body",opacity: 0.7, helper: "clone" });
    this.$el.find('.treeview-leaf').droppable();
  }

  function compareTreeView(a,b){
    var at = typeof a;
    var bt = typeof b;
    
    if(a.hasOwnProperty("folder") && a.folder){
      return 1;
    }else if(b.hasOwnProperty("folder") && b.folder){
      return -1;
    }else if(at != bt){
      if(at == "string"){
        return -1;
      }else if(bt == "string"){
        return 1;
      }else{
        return 0; // should not happen since it means that both elements are objects
      }
    }else {
      return 0;
    }
  }

  vw.cpm.ModuleManagerView.renderSubTree = function(tree,offset){
    var html = "";
    var offsetsize = 14;
    if(typeof tree == "object"){
      if(tree.constructor === Array){
        tree = tree.sort(compareTreeView);
        for (var i = tree.length - 1; i >= 0; i--) {
          html += vw.cpm.ModuleManagerView.renderSubTree(tree[i],offset)
        };  
      }else{
        if(tree.hasOwnProperty("folder") && tree.folder){
          if(tree.foldername!=""){
            var folded = "treeview-folded";
            var hidden = 'style="display:none;"';
            if((offset / offsetsize) < 3){
              folded = "treeview-unfolded";
              hidden = "";
            }
            html += '<div class="treeview-fold '+folded+'"><div class="treeview-node treeview-module-folder" style="margin-left:'+offset+'px;">'+tree.foldername+'</div><div class="treeview-module-folder-content" '+hidden+'>' + vw.cpm.ModuleManagerView.renderSubTree(tree.items,offset + offsetsize)+'</div></div>';
          }else{
            html += vw.cpm.ModuleManagerView.renderSubTree(tree.items,offset)
          }
        }else if(tree.hasOwnProperty("module")){
          html += '<div class="treeview-leaf treeview-module-item draw2d_droppable" data-modname="'+tree.module.name+'" style="margin-left:'+offset+'px;">'+tree.module.name+'</div>';
        }else{
          html += '<div class="treeview-leaf treeview-module-item" style="margin-left:'+offset+'px; color:red;">'+tree.modulename+'</div>';
        }
        
      }

    }
    return html;
  }


  vw.cpm.ModuleManagerView.template = '<div><div id="modulemanager-menu"></div><div id="modulemanager-list"></div></div>';

  vw.cpm.ModuleManagerView.templatePreConfigAddNew = '<div>'+
    '<div style="padding:12px;">'+
      '<div>Parent Directory : </div><div><input style="width:80%;" type="text" name="directory"></div>'+
      '<div>Choose a name for your new module (allowed form : [a-zA-Z][a-zA-Z0-9\-_]+(@[a-zA-Z0-9\-_]+)? ): </div><div><input style="width:80%;" type="text" name="name"></div>'+
      '<button class="create-module-preconfig-submit" type="button">Ok</button>'+
      '<div style="margin-top:24px; font-size:0.75em;">For more information about how to create modules refer to help pages.</div>'+
    '</div>'+
  '</div>';

  



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ModuleView = function(model,$el){
    this.id = vw.cpm.utils.guid();
    this.model = model;
    if($el){
      this.$el = $el || $('<div></div>');
      this.el = this.$el[0];
      this.init();
    }
  };

  vw.cpm.ModuleView.prototype.init=function(){
  }


  vw.cpm.ModuleView.prototype.render=function(){
    var me = this;
    this.$el.empty();
    this.$el.append(vw.cpm.ModuleView.template);

    this.$el.find('.module-view-infos-panel').perfectScrollbar({suppressScrollX:true});

    /*if(me.model.def.hasOwnProperty("module")){
      me.renderGraphical();
    }else{
      me.renderSource();
    }
    me.setActiveMenu(".module-view-graphic");
    */
     me.renderInfo();
     me.setActiveMenu(".module-view-info");
     
    this.$el.find(".module-view-info").on("click",function(){
      me.$el.find(".module-content-view").empty();
      me.renderInfo();
      me.setActiveMenu(".module-view-info");
    });
   
    this.$el.find(".module-view-source").on("click",function(){
      me.$el.find(".module-content-view").empty();
      me.renderSource();
      me.setActiveMenu(".module-view-source");
    });
   /* this.$el.find(".module-view-graphic").on("click",function(){
      me.showGraphical();
      me.setActiveMenu(".module-view-graphic");
    });
    */
   
    this.$el.find(".module-save").on("click",function(){
      me.model.sync(function(){
        me.init();
        me.model.app.logger.info("successfully saved");
        me.$el.find(".module-save").addClass("success-action");
        setTimeout(function(){
          me.$el.find(".module-save").removeClass("success-action");
        },2000);
      },function(){
        me.init();
        me.model.app.logger.error("couldn't save. error happend!");
      });
    });
    this.$el.find(".module-run").on("click",function(){
      me.$el.find(".module-content-view").empty();
      // first sync to see if current module def is validated by server
      // then render run configuration form
      me.renderRunConfForm();
      me.setActiveMenu(".module-run");
    });
  }

  vw.cpm.ModuleView.prototype.setActiveMenu = function(activemenuclass){
    this.$el.find(".module-header-item").removeClass("active");
    this.$el.find(activemenuclass).addClass("active");
  }


  vw.cpm.ModuleView.prototype.renderInfo = function(){
    var me = this;

    var $info = $('<div></div>');

    if(me.model.def.module){
      var def = me.model.def.module;
      $info.append('<div style="font-size:24px; font-weight:bold; color:#373e48;">'+def.name+'</div>');
      if(def.desc){
        $info.append('<div style="font-size:10px;">'+def.desc+'</div>');
      }

      var inputs = vw.cpm.ModuleView.printInfoInputOutput(def,"input");
      var outputs = vw.cpm.ModuleView.printInfoInputOutput(def,"output");
      $info.append('<table width="100%" style="margin-top:12px;"><tr><td width="42%">'+inputs+'</td><td width="6%">=&gt;</td><td width="42%">'+outputs+'</td></tr></table>');

    }else{
      $info.append("This module contains error. You have to fix the source.");
    }


    this.$el.find(".module-content-view").append($info);
  }

  vw.cpm.ModuleView.printInfoInputOutput = function(def,field){
    var inputs = "<ul class=\"nostyle\">";
    for (inputname in def[field]){
      var format = "";
      var moreinfo = false;
      if(def[field][inputname].format){
        moreinfo = true;
        format = def[field][inputname].format;
      }
      var schema = " <span style=\"font-style:italic\">";
      if(def[field][inputname].schema){
        moreinfo = true;
        schema += def[field][inputname].schema;
      }
      schema += "</span>";
      var more = "";
      if(moreinfo){
        more = " ("+format+schema+")";
      }
      inputs += "<li><span style=\"font-weight:bold;\">"+inputname+"</span> : "+def[field][inputname].type+more+"</li>";
    }
    inputs += "</ul>";
    return inputs;
  }

  vw.cpm.ModuleView.prototype.renderSource = function(){
    var me = this;
    var content = me.model.def.source;//.replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/(?:\s)/g,"&nbsp;");

    if(me.model.def.error){
      this.$el.find(".module-content-view").append('<div class="error-msg">'+me.model.def.error+'</div>');  
    }
    if(me.model.def.creation){
      this.$el.find(".module-content-view").append('<div class="warning-msg"><div><div class="warning-close"></div></div><div>'+me.model.def.warning+'</div></div>');
    }
    this.$el.find(".module-content-view").append('<div id="source-'+this.id+'" class="module-source-editor"></div>');
    this.$el.find('#source-'+this.id).append(content);
    this.editor = ace.edit("source-"+this.id);
    var YamlMode = ace.require("ace/mode/yaml").Mode;

    // for built-in modules set read only
    if(me.model.def.modulename.indexOf("_")==0){
      this.setReadOnly(true);
    }
    
    
    this.editor.getSession().setTabSize(2);
    this.editor.getSession().setUseSoftTabs(true);
    this.editor.session.setMode(new YamlMode());

    
    this.$el.on("fullscreenOn",function(){
        me.$el.find(".module-source-editor").height(me.$el.find(".module-view-container").height()-me.$el.find(".module-header").height());
        me.editor.resize();
      });

    this.$el.on("fullscreenOff",function(){      
        me.$el.find(".module-source-editor").height(me.$el.find(".module-view-container").height()-me.$el.find(".module-header").height());
        me.editor.resize();
      });

    this.$el.find(".module-content-view").find(".warning-close").click(function(){
      $(this).parents(".warning-msg").remove();
    })

  }

  vw.cpm.ModuleView.prototype.renderRunConfForm=function(){
    var me = this;

    $form = $('<div></div>');
    var inputs = me.model.def.module.input;
    for(var inputname in inputs){
      $form.append('<div class="module-run-conf-form-field"><span style="font-weight:bold">'+inputname+'</span><span style="font-style:italic;"> ('+inputs[inputname].type+')</span><input type="text" value="" name="'+inputname+'"></div>')
    }
    $form.append('<center><button class="submit" type="button">Run</button></center>');

    this.$el.find(".module-content-view").append($form);

    $form.find("input").droppable({
      drop: function( event, ui ) {
        $(this).val(ui.draggable.attr("filepath"));
      }
    });

    $form.find(".submit").on("click",function(){
      var conf = {}
      for(var inputname in inputs){
        var value = $form.find('input[name="'+inputname+'"]').val()
        if(value && value.trim()!=""){
          conf[inputname] = value;
        }
      } 
      me.model.run(conf,function(){
        me.$el.find(".module-content-view").empty();
        me.renderSource();
        me.setActiveMenu(".module-view-info");
      });
    })
  }

  vw.cpm.ModuleView.prototype.showGraphical = function(){
    var me = this;
    me.$el.find(".module-content-view").empty();
    if(me.model.def.hasOwnProperty("module")){
      me.renderGraphical();
    }else{
      me.$el.find(".module-content-view").append("Unable to display graphical view of this module, definition contains error, please correct source file before");
    }
  }

  vw.cpm.ModuleView.prototype.renderGraphical=function(){
    return; // disabled
    var me = this;
    this.$el.find(".module-content-view").append(vw.cpm.ModuleView.templateGraphical);
    this.$el.find('.canvas-container').perfectScrollbar();
    this.$el.find(".canvas-view").attr('id',this.id);

    this.$el.find('.module-view-infos-panel').html(me.model.def.module.desc);

    // for built in module, disallow view
    if(me.model.def.modulename.indexOf("_")==0){
      return;
    }

    if(me.canvas){
      me.canvas.destroy();
    }
    me.canvas = new draw2d.Canvas(me.id);

    draw2d.Configuration.factory.createConnection = vw.cpm.ModuleConnectionView;

    me.canvas.onDrop = function(droppedDomNode, x, y, shiftKey, ctrlKey)
    {
        var module = me.model.app.modulesmanager.modules[droppedDomNode.data("modname")];
        var moduleboxview =  new vw.cpm.ModuleBoxView(module,module.module.name,{},"");
        me.canvas.add(moduleboxview,x,y);
        /*var type = $(droppedDomNode).data("shape");
        var figure = eval("new "+type+"();");
        // create a command for the undo/redo support
        var command = new draw2d.command.CommandAdd(this, figure, x, y);
        this.getCommandStack().execute(command);*/
    }

    this.$el.find(".mvti-output").click(function(e){
      var outputview = new vw.cpm.ModuleOutputView("new_output",{});
      me.canvas.add(outputview,50,50);
    });
    this.$el.find(".mvti-input").click(function(e){
      var inputview = new vw.cpm.ModuleInputView("new_input",{});
      me.canvas.add(inputview,50,50);

    });
    this.$el.find(".mvti-cmd").click(function(e){
      console.log(e);
      var module = me.model.app.modulesmanager.modules["_CMD"];
      var moduleboxview =  new vw.cpm.ModuleBoxView(module,module.module.name,{CMD:"",
          DOCKERFILE:"false",
          CONTAINED:"false"},"");
      me.canvas.add(moduleboxview,50,50);
    });
    this.$el.find(".mvti-map").click(function(e){
      var module = me.model.app.modulesmanager.modules["_MAP"];
      var moduleboxview =  new vw.cpm.ModuleMapBoxView(module,module.module.name,{IN:"",
          RUN:"",
          REGEX:"",
          CHUNK_SIZE:""},"");
      me.canvas.add(moduleboxview,50,50);
    });

    me.canvas.on("select", function(emitter, figure){
      console.log(emitter);
      
      if(figure){
        console.log(figure);
        me.$el.find('.module-view-infos-panel').empty();
        me.$el.find('.module-view-infos-panel').append(figure.info());
      }else{
        console.log(me.model.def);
        me.$el.find('.module-view-infos-panel').html(JSON.stringify(me.model.def.module));
      }
    });

    
    this.availableVariables = {};
    this.boundVariables = [];

    for(var inputname in me.model.def.module.input){
      var inputview = new vw.cpm.ModuleInputView(inputname,me.model.def.module.input[inputname]);
      me.canvas.add(inputview);
      this.availableVariables[inputname] = inputview.port;
    }

    var rundirinput = new vw.cpm.ModuleInputView("_RUN_DIR",{type:"DIR"});
    me.canvas.add(rundirinput);
    this.availableVariables["_RUN_DIR"] = rundirinput.port;

    var defdirinput = new vw.cpm.ModuleInputView("_DEF_DIR",{type:"DIR"});
    me.canvas.add(defdirinput);
    this.availableVariables["_DEF_DIR"] = defdirinput.port;

    for(var outputname in me.model.def.module.output){
      var outputview = new vw.cpm.ModuleOutputView(outputname,me.model.def.module.output[outputname]);
      me.canvas.add(outputview);
      this.boundVariables = this.boundVariables.concat(vw.cpm.utils.extractVars(me.model.def.module.output[outputname].value,outputview.port));
    }


    for (var i = 0; i < me.model.def.module.exec.length ; i++) {
      var execname = _.first(_.keys(me.model.def.module.exec[i]));
      regex = /(_?[a-zA-Z][a-zA-Z0-9\-_]+(@[a-zA-Z0-9\-_]+)?)(#((?:\w|-)+))?/;
      var match = regex.exec(execname);
      if(!match){
        alert("error when fetching execution modules pipeline ! ");
      }

      var moduleval = me.model.def.module.exec[i][execname];
      
      if(match[1] == "_MAP"){
        var mapcontainer = new vw.cpm.ModuleMapBoxView(module,execname,moduleval);
        me.canvas.add(mapcontainer,150*i+50,50);

        for(var j =0;j<moduleval.input.RUN.length;j++){
          var runitem = moduleval.input.RUN[j];
          var runitemexecname = _.first(_.keys(runitem));
          regex = /(_?[a-zA-Z][a-zA-Z0-9\-_]+(@[a-zA-Z0-9\-_]+)?)(#((?:\w|-)+))?/;
          var runitemmatch = regex.exec(runitemexecname);
          if(!runitemmatch){
            alert("error when fetching execution modules pipeline ! ");
          }

          var runitemmoduleval = runitem[runitemexecname];

          var runitemmodule = me.model.app.modulesmanager.modules[runitemmatch[1]];
          var runitemmoduleboxview =  new vw.cpm.ModuleBoxView(runitemmodule,runitemexecname,runitemmoduleval,runitemmatch[4]);

          this.availableVariables = vw.cpm.ModuleView.getOutputVars(runitemmodule,runitemexecname,runitemmoduleboxview,this.availableVariables,runitemmoduleval,"_MAP");
          this.availableVariables = vw.cpm.ModuleView.getOutputVars(runitemmodule,runitemexecname,runitemmoduleboxview,this.availableVariables,runitemmoduleval);
          var boundvariables = vw.cpm.ModuleView.getInputVars(runitemmoduleval.input,runitemmodule,runitemmoduleboxview);
          this.boundVariables = this.boundVariables.concat(boundvariables);
          me.canvas.add(runitemmoduleboxview,150*i+60,50+j*200);
        }
        mapcontainer.setDimension(200,moduleval.input.RUN.length*200+50);
      }else{
        var module = me.model.app.modulesmanager.modules[match[1]];
        var moduleboxview =  new vw.cpm.ModuleBoxView(module,execname,moduleval,match[4]);

        this.availableVariables = vw.cpm.ModuleView.getOutputVars(module,execname,moduleboxview,this.availableVariables,moduleval);
        this.boundVariables = this.boundVariables.concat(vw.cpm.ModuleView.getInputVars(moduleval.input,module,moduleboxview));

        me.canvas.add(moduleboxview,150*i+50,50);
      }

    };
    
    console.log(this.availableVariables);
    console.log(this.boundVariables);

    this.createConnections();

  }

  vw.cpm.ModuleView.prototype.showInfo = function(element){

  }

  vw.cpm.ModuleView.prototype.exportViewToModelObj = function(){
    var me = this;
    
    for (var i = 0; i < me.canvas.figures.data.length; i++) {
      me.canvas.figures.data[i];
    };
    for (var i = 0; i < me.canvas.lines.data.length; i++) {
      me.canvas.lines.data[i];
    };
  }

  vw.cpm.ModuleView.prototype.createConnections = function(){
    for (var i = 0; i < this.boundVariables.length; i++) {
      console.log(this.boundVariables[i]);
      
      if(this.availableVariables[this.boundVariables[i].name]){
        var entry = this.availableVariables[this.boundVariables[i].name];
        var connection = new vw.cpm.ModuleConnectionView(entry,this.boundVariables[i].ref,this.boundVariables[i].raw);
        this.canvas.add(connection);
      }
    };
  }

  vw.cpm.ModuleView.getInputVars = function(modulevalinputs,moduledefdata,moduleboxview){
    var variablesadd = [];
    for (var inputname in  modulevalinputs) {
      var input = modulevalinputs[inputname];
      if(typeof input == "object"){
        if(input.constructor === Array){
          for (var i = 0; i < input.length; i++) {
            variablesadd = variablesadd.concat(vw.cpm.utils.extractVars(input[i],moduleboxview.inputports[inputname]));
          };
        }else{
          for (var i in input){
            variablesadd = variablesadd.concat(vw.cpm.utils.extractVars(input[i],moduleboxview.inputports[inputname]));
          }
        }
      }else{
        variablesadd = variablesadd.concat(vw.cpm.utils.extractVars(input,moduleboxview.inputports[inputname]));
      }
    };
    return variablesadd;
  }

  vw.cpm.ModuleView.getOutputVars = function(moduledata,execname,moduleboxview,variables,moduleval,prefix){
    var prepend = "";
    if(prefix){
      prepend = prefix+".";
    }
    for (var output in moduledata.module.output) {
      variables[prepend+execname+"."+output] = moduleboxview.outputports[output];
    };
    return variables;    
  }

  vw.cpm.ModuleView.templateGraphical = '<div><div class="module-view-toolbox">'+
    '<span class="module-view-toolbox-item mvti-cmd">+ CMD</span>'+
    '<span class="module-view-toolbox-item mvti-map">+ MAP</span>'+
    '<span class="module-view-toolbox-item mvti-input">+ Input</span>'+
    '<span class="module-view-toolbox-item mvti-output">+ Output</span>'+
    '</div><div class="canvas-container"><div class="canvas-view"></div></div><div class="module-view-infos-panel"></div></div>';

  vw.cpm.ModuleView.template = '<div class="module-view-container"><div class="module-header">'+
  '<span class="module-view-info module-header-item" style="float:left; margin-left:8px; text-shadow:1px 1px #999999">informations</span>'+
  '<span class="module-view-source module-header-item" style="float:left; margin-left:8px; text-shadow:1px 1px #999999">source</span>'+
  //'<span class="module-view-graphic module-header-item" style="float:left; margin-left:20px;">view</span>'+
  '<span class="module-save module-header-item" style="float:left; margin-left:8px; text-shadow:1px 1px #999999">save</span>'+
  '<span class="module-run module-header-item" style="float:left; margin-left:8px; text-shadow:1px 1px #999999">run</span>'+
  '</div>'+
  '<div class="module-content-view"></div></div>';

  vw.cpm.ModuleView.templateWarningSave = '<div>'+
    '<div style="padding:12px;">'+
      '<div class="tpl-warning-save-message"></div>'+
      '<div style="width:30%; display:inline-block;"><center><button class="clone-module" type="button">Clone this module</button></center></div>'+
      '<div style="width:30%; display:inline-block;"><center><button class="force-module-save" type="button">Save this module anyway</button></center></div>'+
      '<div style="width:30%; display:inline-block;"><center><button class="abort-module-save" type="button">Abort saving</button></center></div>'+
    '</div>'+
  '</div>';

  vw.cpm.ModuleView.templateGraphic = '<div class="module-graphical-view"><div ></div>';



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.Panel = function(app,title,data,semanticid,cmd){
    this.app = app;
    this.semanticid = semanticid;
    this.$el = $(vw.cpm.Panel.frametemplate);
    this.app.view.contentpanel.find('#active-content-flow').prepend(this.$el);
    this.el = this.$el[0];
    this.uid = vw.cpm.Panel.uids++;
    this.cmd = cmd;
    this.init(title,data);
  };

  vw.cpm.Panel.prototype.init = function(title,data){
    var me = this;

    this.$el.attr("uid",this.uid);

    

    if(title != 'undefined'){
      me.$el.find(".frame-title").append(title);
    }
    if(data != 'undefined'){
      me.$el.find('.frame-body').append(data);
    }

    this.app.view.panels.push(me);
    this.app.view.refreshPanelList(); 


    me.$el.find(".frame-title").mouseup(function (e){
       vw.cpm.currentTextSelection = vw.cpm.utils.getSelectionText();
     });
    me.$el.find(".frame-body").mouseup(function (e){
       vw.cpm.currentTextSelection = vw.cpm.utils.getSelectionText();
     });

    me.$el.find(".frame-body").perfectScrollbar({wheelPropagation: true});
 
    me.$el.find('.frame-tool-pin').click(function(){
      me.stick();

    });

    me.$el.find('.frame-tool-close').click(function(){
      me.delete()
    });

    me.$el.find('.frame-tool-openfs').click(function(){
      me.fullscreen();

    });

    me.$el.find('.frame-tool-hide').click(function(){
      me.hide();
    });

    me.app.view.contentpanel[0].scrollTop = 0;
    me.app.view.contentpanel.perfectScrollbar("update");
  }



  vw.cpm.Panel.prototype.quitFullscreen = function(){
    var me = this;
    me.$el.removeClass("fullscreen");
    me.$el.find(".frame-body").trigger("fullscreenOff");
    me.$el.find(".frame-tool-quitfs").remove();
    me.$el.find(".frame-tools").children().show();
    // change content height 
    var content = me.$el.find(".frame-body").children().not(".ps-scrollbar-x-rail").not(".ps-scrollbar-y-rail");
    if(content.length == 1){
      if(content.prop("originalHeight")){
        content.height(content.prop("originalHeight"));
      }
    }
    
    var fb = me.$el.find(".frame-body");
    fb.height(fb.prop("originalHeight"));
    fb.perfectScrollbar('update');

    me.$el.find(".frame-body").trigger("fullscreenOff");
    /*
    me.app.view.$fullscreencontainer.fadeOut();
    var title = me.app.view.$fullscreencontainer.find(".frame-title").children();
    if(title.length == 0){
      me.$el.find(".frame-title").append(title);
    }
    var content = me.app.view.$fullscreencontainer.find(".frame-body").children();
    if(content.length != 0){
      if(content.length == 1){
        if(content.prop("originalHeight"))
          content.height(content.prop("originalHeight"));
      }
      me.$el.find(".frame-body").append(content);
      
    }
    */
  }

  vw.cpm.Panel.prototype.fullscreen = function(){
    var me = this;
    me.$el.addClass("fullscreen");
    me.$el.find(".frame-body").trigger("fullscreenOn");
    me.$el.find(".frame-tools").children().hide();
    me.$el.find(".frame-tools").append('<div class="frame-tool frame-tool-quitfs"></div>');
    // change content height
    var content = me.$el.find(".frame-body").children().not(".ps-scrollbar-x-rail").not(".ps-scrollbar-y-rail");
    if(content.length == 1){
      content.prop("originalHeight",content.height());
      content.height($(window).height()-100);
    }
    var fb = me.$el.find(".frame-body");
    fb.prop("originalHeight",fb.height());
    fb.height($(window).height()-70);
    fb.perfectScrollbar('update');
    me.$el.find(".frame-tool-quitfs").on("click",function(){
      me.quitFullscreen();
    });

    me.$el.find(".frame-body").trigger("fullscreenOn");

    /*
    me.app.view.$fullscreencontainer.fadeIn();
    var title = me.$el.find(".frame-title").children();
    if(title.length == 0){
      title = me.$el.find(".frame-title").html();
    }
    var content = me.$el.find(".frame-body").children();

    if(content.length==0){
      content = me.$el.find(".frame-body").html();
    }else if(content.length == 1){
      content.prop("originalHeight",content.height());
      content.height($(window).height()-100);
    }
    me.app.view.$fullscreencontainer.find(".frame-title").empty();
    me.app.view.$fullscreencontainer.find(".frame-body").empty();
    me.app.view.$fullscreencontainer.find(".frame-title").append(title);
    me.app.view.$fullscreencontainer.find(".frame-body").append(content);
    
    me.app.view.$fullscreencontainer.find(".frame-tool-quitfs").unbind("click");
    me.app.view.$fullscreencontainer.find(".frame-tool-quitfs").on("click",function(){
      me.quitFullscreen();
    });*/
  }

  vw.cpm.Panel.prototype.serialize = function(){
    return {cmd:this.cmd,uid:this.uid,sid:this.semanticid};
  }

  vw.cpm.Panel.deserialize = function(app,serialized){
    var cmd = new vw.cpm.Command(serialized.cmd.command,serialized.cmd.data);
    var panel = cmd.execute(app);
    return panel;
  }

  vw.cpm.Panel.prototype.show = function(){
    var me = this;
    var button = me.$el.find('.frame-tool-show');
    button.removeClass('frame-tool-show');
    button.addClass('frame-tool-hide');
    button.unbind("click");
    me.$el.find(".frame-body").slideDown({complete:function(){
      button.on("click",function(){
        me.hide();
      });
    }});
  }

  vw.cpm.Panel.prototype.hide = function(){
    var me = this;
    var button = me.$el.find('.frame-tool-hide');
    button.removeClass('frame-tool-hide');
    button.addClass('frame-tool-show');
    button.unbind("click");
    me.$el.find(".frame-body").slideUp({complete:function(){
      button.on("click",function(){
        me.show();
      });
    }});
  }

  vw.cpm.Panel.prototype.focus = function(){
    var me = this;
    me.app.view.contentpanel[0].scrollTop = me.$el[0].offsetTop-20;
  }

  vw.cpm.Panel.prototype.delete = function(){
    var me = this;
    var index = me.app.view.panels.indexOf(me);
    if(index!=-1){
      me.app.view.panels.splice(index,1);
      me.app.view.refreshPanelList(); 
    }

    if(me.exitCB){
      me.exitCB.call();
    }

    me.$el.animate({
          opacity: 0.25,
          height: "toggle"
        },{
        complete:function(){
          me.$el.remove();
        },
        duration : 200
      }
    );
  }

  vw.cpm.Panel.prototype.stick = function(){
    var me = this;
    //panel.detach();
    this.app.view.contentpanel.find('#active-content-sticky').append(me.$el); 
    var button = me.$el.find('.frame-tool-pin');
    button.removeClass('frame-tool-pin');
    button.addClass('frame-tool-unpin');
    button.unbind('click');
    button.click(function(){
      me.unstick();
    });
    me.app.view.contentpanel[0].scrollTop = 0;
    me.app.view.contentpanel.perfectScrollbar("update");
  }

  vw.cpm.Panel.prototype.unstick = function(){
    var me = this;
    //panel.detach();
    this.app.view.contentpanel.find('#active-content-flow').append(me.$el);
    var button = me.$el.find('.frame-tool-unpin');
    button.removeClass('frame-tool-unpin');
    button.addClass('frame-tool-pin');
    button.unbind('click');
    button.click(function(){
      me.stick();
    });
  }

  vw.cpm.Panel.prototype.addToolButton = function($button){
    $button.addClass("frame-tool");
    this.$el.find(".frame-tools").append($button);
  }

  vw.cpm.Panel.prototype.removeToolButton = function(buttonclass){
    this.$el.find(".frame-tools").find(buttonclass).remove();
  }

  vw.cpm.Panel.uids = 0;

  vw.cpm.Panel.maxFrameHeight = 650;

  vw.cpm.Panel.frametemplate = '<div class="frame"><div class="frame-header"><div class="frame-title"></div><div class="frame-tools"><div class="frame-tool frame-tool-close"></div><div class="frame-tool frame-tool-pin"></div><div class="frame-tool frame-tool-openfs"></div><div class="frame-tool frame-tool-hide"></div></div></div><div class="frame-body"></div></div>';





}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ProcessManagerView = function(model,$el){
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.ProcessManagerView.prototype.init=function(){
    var me = this;
    me.$el.empty();
  }

  vw.cpm.ProcessManagerView.prototype.refresh = function(){
    var me = this;


    var html ="";
    // list process results 
    for (var modulename in me.model.runs){
      html += '<div><div class="settings-field-title" style="cursor:pointer;">'+modulename+'</div><div class="settings-field-body"><ul class="run-list" style="font-size:12px;">'
      for(var i in me.model.runs[modulename]){
        html += '<li runid="'+me.model.runs[modulename][i].runid+'">'+me.model.runs[modulename][i].datecreated+'</li>';
      }
      html+= '</ul></div></div>';
    }
    
    me.$el.empty();
    me.$el.append(html);
    me.$el.find(".settings-field-title").on("click",function(){
      $(this).parent().find(".settings-field-body").toggle();
    });
    me.$el.find(".settings-field-body li").on("click",function(){
      me.model.showRun($(this).parents(".settings-field-body").prev().html().trim(),$(this).attr("runid"));
    });
  }

  


  



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ProcessView = function(model,$el){
    this.$el = $el ;
    this.model = model;
    this.init();
  };

  vw.cpm.ProcessView.prototype.init=function(){
    var me = this;
    
    
    this.shared = {};
    var panel = me.model.app.view.getPanelFromContent(this.$el);
    if(panel){
      panel.exitCB = function(){
        clearInterval(me.shared.interval);
      }
    }
  }

  
  vw.cpm.ProcessView.prototype.refresh=function(){
    var me = this;

    if(this.$el && me.model.synced){
      this.$el.empty();
      this.$el.append(vw.cpm.ProcessView.template);

      me.$el.find('.run-status .info-box-content').html('<div>'+me.model.info.status+'</div><div class="process-detailed-status"></div><button class="processresult-rerun" type="button">re-run</button><button class="processresult-refresh" type="button">refresh</button><button class="processresult-log" type="button">log</button><button class="processresult-delete" type="button">delete</button>');
      me.$el.find('.run-status .info-box-content .processresult-rerun').on("click",function(){
        me.model.rerun();
      });
      me.$el.find('.run-status .info-box-content .processresult-refresh').on("click",function(){
        me.model.sync($(this));
      });
      me.$el.find('.run-status .info-box-content .processresult-delete').on("click",function(){
        me.model.delete($(this));
      });

      me.$el.find('.processresult-log').on("click",function(){
        me.model.app.request("process log "+me.model.runid);
      });

      var config = "<ul>";
      for(var key in me.model.info.runconf){
        config += '<li><span style="font-weight:bold;">'+key+' : </span><span>'+vw.cpm.ProcessView.printVar(me.model.info.runconf[key],key)+'</span></li>';
      }
      config += "</ul>";
      me.$el.find('.run-config .info-box-content').html(config);

      var results = "<ul>";
      for(var key in me.model.info.env){
        if(me.model.info.runconf.hasOwnProperty(key)){
          continue;
        }
        results += '<li><span style="font-weight:bold;">'+key+' : </span><span>'+vw.cpm.ProcessView.printVar(me.model.info.env[key],key)+'</span></li>';
      }
      for(var key in me.model.info.parentEnv){
        if(me.model.info.runconf.hasOwnProperty(key)){
          continue;
        }
        results += '<li><span style="font-weight:bold;">'+key+' : </span><span>'+vw.cpm.ProcessView.printVar(me.model.info.parentEnv[key],key)+'</span></li>';
      }
      results += "</ul>";
      me.$el.find('.run-results .info-box-content').html(results);

      me.$el.find('.file-var').click(function(){
        me.model.app.openFile($(this).html().trim());
      });

      me.$el.find('.iframe-var').click(function(){
        me.model.app.openIFrame($(this).html().trim());
      });

      if(me.shared.interval){
        clearInterval(me.shared.interval);
      }
      me.shared.interval = setInterval(function(){
        me.model.getStatus(function(data){
          if(data.exited){
            clearInterval(me.shared.interval);
          }else{
            me.$el.find(".process-detailed-status").html('<code><pre class="pre-wrapped">'+data.info+'</pre></code>');
          }
        });
      },2000);


      me.$el.find('.info-box').each(function(i){
        $(this).find(".info-box-title").click(function(){
          $(this).parent().find('.info-box-content').toggle();
        })
      })
    }
  }

  vw.cpm.ProcessView.printVar = function(variable,variablename){
    if(variable.type == "FILE"){
      return '<span class="file-var link">'+variable.value+'</span>';
    }else if(variable.type == "FILE*"){
      var html = '<ul>';
      for (var i = 0; i < variable.value.length; i++) {
         html += '<li class="file-var link">'+variable.value[i]+'</li>';
      };
      html += '</ul>';
      return html;
    }else if(variable.type == "VAL" && variable.format == "url"){
      var html = '<span class="iframe-var" name="'+variablename+'">'+variable.value.replace("localhost",vw.cpm.INSTANCE.options.cpmhost)+'</span>';
      return html;
    }else if(typeof variable.value == "string" && variable.format == "html"){
      return variable.value;  
    }else{
      return JSON.stringify(variable.value).replace("/\n/","<br>").replace("/\s/","&nbsp;").replace("/\\\"/",'"');    
    }
    
  }



  vw.cpm.ProcessView.template = '<div class="run-status info-box"><div class="info-box-title">Status</div> <div class="info-box-content"></div></div>'+
    '<div class="run-config info-box"><div class="info-box-title">Config</div><div class="info-box-content"></div></div>'+
    '<div class="run-results info-box"><div class="info-box-title">Results</div> <div class="info-box-content"></div></div>';



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ServiceManagerView = function(model,$el){
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.ServiceManagerView.prototype.init=function(){
    var me = this;
    me.$el.empty();
  }

  vw.cpm.ServiceManagerView.prototype.refresh = function(){
    var me = this;


    var html ="";
    // list process results 
    for (var i in me.model.services){
      var service = me.model.services[i];
      var active = "";
      if(service.status){
        active = "active";
      }
      html += '<div class="service '+active+'"><div class="service-name">'+service.name+'</div></div>';
    }
    
    me.$el.empty();
    me.$el.append(html);
    me.$el.find(".service-name").on("click",function(){
      me.model.showService($(this).html().trim());
    });
  }


  vw.cpm.ServiceView = function(app,$el,model){
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.service = model;
    this.app = app;
    this.refresh();
  }

  vw.cpm.ServiceView.prototype.refresh = function(){
    var me = this;
    this.$el.empty();
    if(this.service.desc){
      this.$el.append('<div>'+this.service.desc+'</div>');  
    }
    this.$el.append('<div> Status : '+(this.service.status?"running":"stopped")+'</div>');
    if(this.service.status){
      this.$el.append('<div class="service-run-switch"><button>Stop</button></div>');
    }else{
      this.$el.append('<div class="service-run-switch"><button>Start</button></div>');
    }
    if(this.service.test){
      this.$el.append('<div><button class="service-test">Test service</button></div>'); 
      this.$el.find('.service-test').click(function(){
        if(!$(this).hasClass('ajax-submitted')){
          me.app.servicemanager.testService(me,$(this));        
        }
      });
    }

    this.$el.find('.service-run-switch').click(function(){
      if(!$(this).hasClass('ajax-submitted')){
        if(me.service.status){
          me.app.servicemanager.stopService(me,$(this));
        }else{
          me.app.servicemanager.startService(me,$(this));
        }        
      }
    });
    var ul = '<ul>';
    if(me.service.log){
      ul += '<li><span>log : </span>'+me.service.log;
    }
    for (var outputname in me.service.outputs) {
      ul += '<li><span>'+outputname+' : </span>'+vw.cpm.ProcessView.printVar(me.service.outputs[outputname],outputname);
    }
    ul += '</ul>';
    this.$el.append(ul);
    me.$el.find('.iframe-var').click(function(){
      me.app.openIFrame($(this).html().trim(),me.service.name+" "+$(this).attr('name'));
    });    
  }
  



  



}(window.vw = window.vw || {}));

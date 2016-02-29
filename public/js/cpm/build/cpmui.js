(function(vw){
  
  vw.cpm = {};

}(window.vw = window.vw || {}));
(function(vw){

  

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.CLI = function($el,options){
    this.options = options;
    this.view = new vw.cpm.CLIView(this,$el);
    this.init();
    
    
  }

  



  
  vw.cpm.CLI.prototype.init = function(){
    var me = this;

    this.foo = "bar";

    if (!store.enabled) {
      alert('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser. Your session won\'t be saved across page reloads');
      
    }
    console.log(store.get('test'));

    store.set('test',this.view.panels);  



    this.activemenu = "";

    this.menus = {
      "default":{title:"Application Frame Mngr",body:$('<div></div>')},
      "corpus-menu":{title:"Corpora",body:$('<div></div>')},
      "module-menu":{title:"Modules",body:$('<div></div>')},
      "process-menu":{title:"Process",body:$('<div></div>')},
      "settings-menu":{title:"Settings",body:$('<div></div>')},
      "help-menu":{title:"Help",body:$('<div></div>')}
    }

    this.reload();

    this.helpmanager = new vw.cpm.HelpManager(this,this.menus['help-menu'].body);

    

    var firstrun = store.get('firstrun')
    if(!firstrun){
      var panel = this.openIFrame(this.options.cpmbaseurl+'/introslides',"Intro");
      //this.view.fullscreen(panel);
      me.demo();
      store.set('firstrun','done');
    }else{
      var panel = this.openIFrame(this.options.cpmbaseurl+'/introslides',"Intro");

    }
  
  }

  vw.cpm.CLI.prototype.reload = function(){
    var me = this;
    this.cpmsettingsmanager = new vw.cpm.CPMSettingsManager(this,this.menus['settings-menu'].body,{init:function(){
      me.initmodules();
    }});
  }

  vw.cpm.CLI.prototype.initmodules = function(){
    this.modulesmanager = new vw.cpm.ModuleManager(this,this.menus['module-menu'].body);

    this.corpusmanager = new vw.cpm.CorpusManager(this,this.menus['corpus-menu'].body);

    this.processmanager = new vw.cpm.ProcessManager(this,this.menus['process-menu'].body);
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
        error:function(){

        }
      });
  }


  vw.cpm.CLI.prototype.request = function(command){
    var me = this;

    command = command.trim();

    if(command == "test"){
      var $panel = this.view.createPanel("test");
      var process = new vw.cpm.Process(this,$panel.find('.frame-body'),{moduledef:me.modulesmanager.modules['stanford-parser'],runconf:{IN:'/home/paul/custom/cpm/data/testcorpus/humanism.txt'},runid:"some run id"});
    }

    if(command == "help"){
      me.helpmanager.displayCLIHelp();
      return;
    }

    if(command == "brat"){
      this.openIFrame('http://'+me.options.hostname+':8001/index.xhtml',"brat");
      return;
    }

    if(command.startsWith("file")){
      var elts = command.split(" ");
      me.openFile(elts[1]);
      return ;
    }

    if(command == "cadvisor"){
      this.openIFrame('http://'+me.options.hostname+':8082/',"cadvisor");
      return;
    }

    me.cpmRawCall(command,function(data){
      data = jQuery('<div />').text(data).html();
      data = '<code><pre class="pre-wrapped">'+data+'</pre></code>';
      me.view.createPanel(command,data);
      console.log(data);
    });

    
  }

  vw.cpm.CLI.prototype.openIFrame = function(url,title){
    var me = this;
    var name = url;
    if(title){
      name = title;
    }
    $panel = me.view.createPanel('<a href="'+url+'" target="_blank">'+name+'</a>');
    $panel.find('.frame-body').append('<iframe style="border-style:none;border:0;margin:0;padding:0;" width="100%" height="600px" src="'+url+'"></iframe>');
    return $panel;
  }

  vw.cpm.CLI.prototype.openFile = function(filepath){
    var me = this;
    $.ajax({
      type: "POST",
      data : {
        file:filepath
      },
      url: me.options.cpmbaseurl+"rest/file",
      success: function(data, textStatus, jqXHR) {
        data = jQuery('<div />').text(data).html();
        //data = data.replace(/\s/g,'&nbsp;');
        //data = data.replace(/\n|\r|\r\n/g,'<br>');
        data = '<code><pre class="pre-wrapped">'+data+'</pre></code>';
        me.view.createPanel(filepath,data);
      },
      error:function(){

      }
    });
  }

  vw.cpm.CLI.prototype.getFileContent = function(filepath,callback){
    var me = this;
    $.ajax({
      type: "POST",
      data : {
        file:filepath
      },
      url: me.options.cpmbaseurl+"rest/file",
      success: function(data, textStatus, jqXHR) {
        callback.call(me,data);
      },
      error:function(){

      }
    });
  }


  vw.cpm.CLI.prototype.cpmSettings = function(){
    
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
          element: document.querySelector('#corpus-menu'),
          intro: "There is 3 main menus. This first one show a list of all corpus handled by AppFM.",
          position: 'right'
        },
        {
          element: document.querySelector('#module-menu'),
          intro: "This one list the modules available that can be executed over the data available in the previous menu.",
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
          element: document.querySelector('#help-menu'),
          intro: "...and if you need more help, this is where you can find further documentation.",
          position: 'right'
        }              
      ]
    });
    intro.onchange(function(element){
      if(element.id=="corpus-menu"){
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

  vw.cpm.ui.Modal.prototype.close = function(){
    this.$el.slideUp({complete:function(){
      $('body').find("#cpm-modal-bg").remove();
      vw.cpm.ui.Modal.alreadyExist = false;
    }});
    
  }

  vw.cpm.ui.Modal.alreadyExist = false;
  vw.cpm.ui.Modal.template = '<div class="cpm-modal"><div class="cpm-modal-header"><div class="cpm-modal-close"></div></div><div class="cpm-modal-content"></div></div>';

    

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
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.CorpusManagerView(this,$el);
    this.filetree = {}
    this.init();
  }

  vw.cpm.CorpusManager.prototype.init = function(){
    var me = this;
    me.fetch();
  }

  vw.cpm.CorpusManager.prototype.fetch = function(){
    var me = this;
    me.lsDir(me.app.cpmsettingsmanager.cpmsettings.corpus_dir,0,function(data){
      me.view.renderCorpora(data);
    });
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

  vw.cpm.CorpusManager.prototype.lsDir = function(filepath,offset,onsuccess){
    var me = this;
    $.ajax({
      type:"POST",
      url : me.app.options.cpmbaseurl + "rest/cmd",
      data:{cmd:"corpus lsdir "+filepath+" "+offset},
      dataType : 'json',
      success:function(data,textStatus,jqXHR){
        //me.filetree = {"corpus":{"corpora":data.corpus},"results":{"results":data.results}}; // because...
        onsuccess.call(me,data,filepath);
      }
    });
  }




}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.CPMSettingsManager = function(app,$el,options){
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.CPMSettingsManagerView(this,$el);
    this.cpmsettings = {};
    this.init();
  }

  vw.cpm.CPMSettingsManager.prototype.init = function(callback){
    var me = this;
    me.fetch();
  }

  vw.cpm.CPMSettingsManager.prototype.fetch = function(callback){
    var me = this;
    this.app.cpmCall("settings",function(data){
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
    this.app.view.createPanel("help",helpcontent);
  }
  




}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.Module = function(app,$el,moduledef){
    this.def = moduledef;
    this.app = app;
    this.view = new vw.cpm.ModuleView(this,$el);
    this.synced = false;
  }

  vw.cpm.Module.prototype.init = function(){
    
  }

  vw.cpm.Module.prototype.fetch = function(){
    
  }

  vw.cpm.Module.prototype.sync = function(success,error){
    var me = this;
    me.def.source = me.view.editor.getValue();
    var synctype = "update "+me.def.modulename;
    if(me.def.creation){
      synctype = "create "+me.def.modulename+" "+vw.cpm.utils.getParentDir(me.def.sourcepath);
    }
    console.log(me.def);
    $.ajax({
      type: "POST",
      data : {
        cmd: "module "+synctype,
        data:me.def.source
      },
      url: me.app.options.cpmbaseurl+"rest/cmd",
      dataType : "json",
      success: function(data, textStatus, jqXHR) {
        if(data.success){
          if(me.def.creation){
            me.app.modulesmanager.fetchAll();
            delete me.def.creation;  
          }
          success.call();
        }else{
          alert(me.error);
          error.call();
        }
      },
      error:function(){

      }
    });
  }

  vw.cpm.Module.confToYaml = function(conf){
    var out = "";
    for(var confname in conf){
      out += confname+" : "+conf[confname]+"\n";
    }
    return out;
  }

  vw.cpm.Module.prototype.run = function(conf,success,error){
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
        me.app.processmanager.showRun(me.def.modulename,runid);
        me.app.processmanager.fetchAll(); // very unoptimized
        success.call(me.view);
      },
      error:function(){

      }
    });
  
  }

  

  vw.cpm.Module.prototype.internalSyncToSource = function(){
    this.def.source = YAML.stringify(this.def.module);
  }

  vw.cpm.Module.prototype.internalSyncToModel = function(){
    this.def.module = YAML.parse(this.def.source);
  }

  

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ModuleManager = function(app,$el,options){
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

  vw.cpm.ModuleManager.prototype.checkNameExist = function(modulename,success,failure){
    var me = this;
    var regex = /^(_?[a-zA-Z][a-zA-Z0-9\-_]+(@[a-zA-Z0-9\-_]+)?)(#(?:\w|-)+)?$/;
    var match = regex.exec(modulename);
    if(!match){
      failure.call();
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
            failure.call();
            return;
          }
        }
        success.call();
      },
      error:function(){
        failure.call();
      }
    });
  }

  vw.cpm.ModuleManager.prototype.prepareCreateNewModule = function(){
    var me = this;
    var modal = new vw.cpm.ui.Modal();
    $preconfig = $(vw.cpm.ModuleManagerView.templatePreConfigAddNew);
    $preconfig.find('.create-module-preconfig-submit').click(function(){
      var modulename = $preconfig.find('input').val();
      var dirpath = "custom";
      me.checkNameExist(modulename,function(){
        modal.close();
        me.createNewModule(modulename,dirpath);
      },function(){
        var modalcontent = modal.getContainer();
        modalcontent.find(".error-message").remove();
        modalcontent.prepend('<div class="error-message">Module name already exist or isn\'t allowed, please choose another name</div>');
      });
    });
    modal.open($preconfig);
  }

  vw.cpm.ModuleManager.prototype.createNewModule = function(modulename,containerdirpath){
    var me = this;
    var $panel = me.app.view.createPanel(modulename);
    var newmoduledef = {
      module:{
        name:modulename,
        desc:"please fill in a brief description",
        input:{},
        output:{},
        exec:[],
      },
      modulename:modulename,
      source:"name : "+modulename+"\n\ndesc : > \n  please fill in a brief description",
      sourcepath:me.app.cpmsettingsmanager.defaultModulesDir+"/custom/"+modulename+".module",
      creation:true
    };
    var module = new vw.cpm.Module(me.app,$panel.find(".frame-body"),newmoduledef);
    module.view.render();
  }

  vw.cpm.ModuleManager.prototype.showModule = function(modulename){
    var me = this;
    var $panel = me.app.view.createPanel(modulename);
    var module = new vw.cpm.Module(me.app,$panel.find(".frame-body"),me.modules[modulename]);
    me.modulesobj.push(module);
    module.view.render();
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

  vw.cpm.Process.prototype.sync = function(){
    var me = this;
    $.ajax({
      type: "POST",
      data : {
        cmd: "process get "+me.runid,
      },
      url: me.app.options.cpmbaseurl+"rest/cmd",
      dataType : "json",
      success: function(data, textStatus, jqXHR) {
        me.info = data;
        me.synced = true;
        me.view.refresh();
      },
      error:function(){
        alert('could not parse process info json (run id = '+me.runid+')');
      }
    });
  }

  vw.cpm.Process.prototype.delete = function(){
    var me = this;
    $.ajax({
      type : "POST",
      data : {
        cmd : "process del "+me.runid
      },
      url : me.app.options.cpmbaseurl+"rest/cmd",
      success : function(data){
        if(data == "ok"){
          var $panel = me.app.view.getPanelFromContent(me.view.$el);
          me.app.view.deletePanel($panel);
          me.app.processmanager.remove(me.runid);
        }
      },
      error : function(){
        console.log("error when trying to delete process result "+me.runid);
      }
    });
  }

  

  vw.cpm.Process.prototype.run = function(conf,success,error){
    var me = this;
    console.log(conf);
    if(success){
      success.call(me.view);
    }
  }

}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ProcessManager = function(app,$el,options){
    this.options = options;
    this.app = app;
    this.view = new vw.cpm.ProcessManagerView(this,$el);
    this.init();
    this.runs = {};
  }

  vw.cpm.ProcessManager.prototype.init = function(){
    var me = this;
    me.fetchAll();
  }

  vw.cpm.ProcessManager.prototype.showRun = function(modulename,runid){
    var me = this;
    var $panel = this.app.view.createPanel('<span class="link">'+modulename + "</span> ( "+runid+" )");
    $panel.find(".frame-title").find(".link").click(function(){
      me.app.modulesmanager.showModule(modulename);
    });
    var process = new vw.cpm.Process(this.app,$panel.find(".frame-body"),{moduledef:me.app.modulesmanager.modules[modulename].module,runconf:{},runid:runid});
    process.sync();
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
      }
    });

  }



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
      // set default menu if menu is to be opened and is empty
      if(jQuery("#main").hasClass("menu-closed")){
        me.model.activemenu = "default";
        me.model.setActiveMenu("default");
      }
      

      jQuery(".menu-open").switchClass("menu-open","menu-closed");
      jQuery(".menu-closed").switchClass("menu-closed","menu-open");
      
    });

    $(".main-menu-item").click(function(){
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

  vw.cpm.CLIView.prototype.stick = function(panel){
    var me = this;
    //panel.detach();
    this.contentpanel.find('#active-content-sticky').append(panel); 
    var button = panel.find('.frame-tool-pin');
    button.removeClass('frame-tool-pin');
    button.addClass('frame-tool-unpin');
    button.unbind('click');
    button.click(function(){
      me.unstick(panel);
    });
    me.contentpanel[0].scrollTop = 0;
    me.contentpanel.perfectScrollbar("update");
  }

  vw.cpm.CLIView.prototype.unstick = function(panel){
    var me = this;
    //panel.detach();
    this.contentpanel.find('#active-content-flow').append(panel);
    var button = panel.find('.frame-tool-unpin');
    button.removeClass('frame-tool-unpin');
    button.addClass('frame-tool-pin');
    button.unbind('click');
    button.click(function(){
      me.stick(panel);
    });
  }

  vw.cpm.CLIView.prototype.getPanel = function(title,do_not_create_new_if_not_found){
    var me = this;
    var index = -1;
    for(var i in me.panels){
      if(me.panels[i].find(".frame-title").html()==title){
        index = i;
        break;
      }
    }
    if(index!=-1){
      return me.panels[i];
    }else if(do_not_create_new_if_not_found){
      return undefined;
    }else{
      return me.createPanel(title);
    }

  }

  vw.cpm.CLIView.prototype.getPanelFromContent = function($el){
    return $el.parents(".frame");
  }

  vw.cpm.CLIView.prototype.quitFullscreen = function($panel){
    var me = this;
    me.$fullscreencontainer.fadeOut();
    var title = me.$fullscreencontainer.find(".frame-title").children();
    if(title.length == 0){
      $panel.find(".frame-title").append(title);
    }
    var content = me.$fullscreencontainer.find(".frame-body").children()
    if(content.length != 0){
      if(content.length == 1){
        if(content.prop("originalHeight"))
          content.height(content.prop("originalHeight"));
      }
      $panel.find(".frame-body").append(content);
    }
    
  }

  vw.cpm.CLIView.prototype.fullscreen = function($panel){
    var me = this;
    me.$fullscreencontainer.fadeIn();
    var title = $panel.find(".frame-title").children();
    if(title.length == 0){
      title = $panel.find(".frame-title").html();
    }
    var content = $panel.find(".frame-body").children();

    if(content.length==0){
      content = $panel.find(".frame-body").html();
    }else if(content.length == 1){
      content.prop("originalHeight",content.height());
      content.height($(window).height()-100);
    }
    me.$fullscreencontainer.find(".frame-title").empty();
    me.$fullscreencontainer.find(".frame-body").empty();
    me.$fullscreencontainer.find(".frame-title").append(title);
    me.$fullscreencontainer.find(".frame-body").append(content);
    me.$fullscreencontainer.find(".frame-tool-quitfs").unbind("click");
    me.$fullscreencontainer.find(".frame-tool-quitfs").on("click",function(){
      me.quitFullscreen($panel);
    });
  }

  vw.cpm.CLIView.prototype.show = function($panel){
    var me = this;
    var button = $panel.find('.frame-tool-show');
    button.removeClass('frame-tool-show');
    button.addClass('frame-tool-hide');
    button.unbind("click");
    $panel.find(".frame-body").slideDown({complete:function(){
      button.on("click",function(){
        me.hide($panel);
      });
    }});
  }

  vw.cpm.CLIView.prototype.hide = function($panel){
    var me = this;
    var button = $panel.find('.frame-tool-hide');
    button.removeClass('frame-tool-hide');
    button.addClass('frame-tool-show');
    button.unbind("click");
    $panel.find(".frame-body").slideUp({complete:function(){
      button.on("click",function(){
        me.show($panel);
      });
    }});
  }

  vw.cpm.CLIView.prototype.deletePanel = function($panel){
    var me = this;
    var index = me.panels.indexOf($panel);
      if(index!=-1){
        me.panels.splice(index,1);
      }
      $panel.animate({
          opacity: 0.25,
          height: "toggle"
        },{
        complete:function(){
          $panel.remove();
        },
        duration : 200
      }
    );
  }

  vw.cpm.CLIView.prototype.createPanel = function(title,data){
    var me = this;
    var html = vw.cpm.CLIView.frametemplate;
    var $el = $(html);
    //$el.hide();
    //$el.show('drop');
    this.contentpanel.find('#active-content-flow').prepend($el);

    if(title != 'undefined'){
      $el.find(".frame-title").append(title);
    }
    if(data != 'undefined'){
      $el.find('.frame-body').append(data);
    }

    this.panels.push($el);


    $el.find(".frame-title").mouseup(function (e){
       vw.cpm.currentTextSelection = vw.cpm.utils.getSelectionText();
     });
    $el.find(".frame-body").mouseup(function (e){
       vw.cpm.currentTextSelection = vw.cpm.utils.getSelectionText();
     });
 
    $el.find('.frame-tool-pin').click(function(){
      me.stick($el);

    });

    $el.find('.frame-tool-close').click(function(){
      me.deletePanel($el)
    });

    $el.find('.frame-tool-openfs').click(function(){
      me.fullscreen($el);

    });

    $el.find('.frame-tool-hide').click(function(){
      me.hide($el);
    });

    me.contentpanel[0].scrollTop = 0;
    me.contentpanel.perfectScrollbar("update");

    return $el;
  }

  vw.cpm.CLIView.frametemplate = '<div class="frame"><div class="frame-header"><div class="frame-title"></div><div class="frame-tools"><div class="frame-tool frame-tool-close"></div><div class="frame-tool frame-tool-pin"></div><div class="frame-tool frame-tool-openfs"></div><div class="frame-tool frame-tool-hide"></div></div></div><div class="frame-body"></div></div>';
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

  vw.cpm.CorpusManagerView.prototype.renderCorpora = function(data){
    var me = this;
    var $html = me.renderDirectory(data,me.model.app.cpmsettingsmanager.cpmsettings.corpus_dir,1);
    this.$el.find("#corpora-corpora-container").append($html);
  }

  vw.cpm.CorpusManagerView.prototype.renderResults = function(data){
    var me = this;
    var $html = me.renderDirectory(data,me.model.app.cpmsettingsmanager.cpmsettings.result_dir,1);
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
          html += '<div class="treeview-fold treeview-folded" depth="'+depth+'"><div class="treeview-node" style="margin-left:'+offset+'px;" filepath="'+parentpath+"/"+filename+'">'+filename+'</div><div style="display:none;"></div></div>';
        }
      }else{
        var filename = data[i];
        html += '<div class="treeview-leaf" style="margin-left:'+offset+'px;" filepath="'+parentpath+"/"+filename+'">'+filename+'</div>';
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
    this.$el.empty();
    
    var data = this.model.cpmsettings;
    var html ='<div><button class="cpm-refresh">Refresh</button></div>';
    html += '<div class="settings-field-title"> Corpus directory : </div><div class="settings-field-body">'+data.corpus_dir+'</div>';
    html += '<div class="settings-field-title"> Result directory : </div><div class="settings-field-body">'+data.result_dir+'</div>';
    var moduledir = '<div class="settings-field-title"> Modules directories :</div><div class="settings-field-body"><ul>'
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

    var me = this;
    this.$el.find(".cpm-refresh").click(function(){
      me.model.app.reload();
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
    this.$el.find("#help-tutorial").on("click",function(){
      me.model.app.demo();
    });
    
  }

  vw.cpm.HelpManagerView.template = '<div id="help-tutorial" style="cursor:pointer;">Tutorial</div><div id="help-presa-slides" style="cursor:pointer;">Introduction slides</div><div id="help-main-wiki-page" style="cursor:pointer;">Main wiki</div>';

  



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
    me.$el.find("#modulemanager-add-new").click(function(){
      me.model.prepareCreateNewModule();
    });
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
            if(true || offset == 0){
              folded = "treeview-unfolded";
              hidden = "";
            }
            html += '<div class="treeview-fold '+folded+'"><div class="treeview-node treeview-module-folder" style="margin-left:'+offset+'px;">'+tree.foldername+'</div><div '+hidden+'>' + vw.cpm.ModuleManagerView.renderSubTree(tree.items,offset + 14)+'</div></div>';
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
      '<div>Choose a name for your new module (allowed form : [a-zA-Z][a-zA-Z0-9\-_]+(@[a-zA-Z0-9\-_]+)? ): <input type="text"></div>'+
      '<button class="create-module-preconfig-submit" type="button">Ok</button>'+
      '<div style="margin-top:24px; font-size:0.75em;">For more information about how to create modules refer to help pages.</div>'+
    '</div>'+
  '</div>';

  



}(window.vw = window.vw || {}));

(function(vw){

  vw.cpm.ModuleView = function(model,$el){
    this.id = vw.cpm.utils.guid();
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.ModuleView.prototype.init=function(){
    var me = this;
    this.$el.empty();
    this.$el.append(vw.cpm.ModuleView.template);

    this.$el.find('.module-view-infos-panel').perfectScrollbar({suppressScrollX:true});

    if(me.model.def.hasOwnProperty("module")){
      me.renderGraphical();
    }else{
      me.renderSource();
    }
    me.setActiveMenu(".module-view-graphic");

    this.$el.find(".module-view-source").on("click",function(){
      me.$el.find(".module-content-view").empty();
      me.renderSource();
      me.setActiveMenu(".module-view-source");
    });
    this.$el.find(".module-view-graphic").on("click",function(){
      me.showGraphical();
      me.setActiveMenu(".module-view-graphic");
    });
    this.$el.find(".module-save").on("click",function(){
      me.model.sync(function(){

      },function(){

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

  vw.cpm.ModuleView.prototype.render=function(){
  }

  vw.cpm.ModuleView.prototype.renderSource = function(){
    var me = this;
    var content = me.model.def.source;//.replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/(?:\s)/g,"&nbsp;");

    
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
        conf[inputname] = $form.find('input[name="'+inputname+'"]').val()
      } 
      me.model.run(conf,function(){
        me.showGraphical();
        me.setActiveMenu(".module-view-graphic");
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

  vw.cpm.ModuleView.template = '<div class="module-header">'+
  '<span class="module-view-source module-header-item" style="float:left; margin-left:8px;">source</span>'+
  '<span class="module-view-graphic module-header-item" style="float:left; margin-left:20px;">view</span>'+
  '<span class="module-run module-header-item" style="float:right; margin-right:8px;">run</span>'+
  '<span class="module-save module-header-item" style="float:right; margin-right:20px;">save</span>'+
  '</div>'+
  '<div class="module-content-view"></div>';

  vw.cpm.ModuleView.templateGraphic = '<div class="module-graphical-view"><div ></div>';



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
    this.$el = $el || $('<div></div>');
    this.el = this.$el[0];
    this.model = model;
    this.init();
  };

  vw.cpm.ProcessView.prototype.init=function(){
    var me = this;
    this.$el.append(vw.cpm.ProcessView.template);
    
  }

  
  vw.cpm.ProcessView.prototype.refresh=function(){
    var me = this;
    if(me.model.synced){
      me.$el.find('.run-status .info-box-content').html('<div>'+me.model.info.status+'</div><button class="processresult-refresh" type="button">refresh</button><button class="processresult-delete" type="button">delete</button>');
      me.$el.find('.run-status .info-box-content .processresult-refresh').on("click",function(){
        me.model.sync();
      });
      me.$el.find('.run-status .info-box-content .processresult-delete').on("click",function(){
        me.model.delete();
      });

      var config = "<ul>";
      for(var key in me.model.info.runconf){
        config += '<li><span style="font-weight:bold;">'+key+' : </span><span>'+vw.cpm.ProcessView.printVar(me.model.info.runconf[key])+'</span></li>';
      }
      config += "</ul>";
      me.$el.find('.run-config .info-box-content').html(config);

      var results = "<ul>";
      for(var key in me.model.info.env){
        if(me.model.info.runconf.hasOwnProperty(key)){
          continue;
        }
        results += '<li><span style="font-weight:bold;">'+key+' : </span><span>'+vw.cpm.ProcessView.printVar(me.model.info.env[key])+'</span></li>';
      }
      for(var key in me.model.info.parentEnv){
        if(me.model.info.runconf.hasOwnProperty(key)){
          continue;
        }
        results += '<li><span style="font-weight:bold;">'+key+' : </span><span>'+vw.cpm.ProcessView.printVar(me.model.info.parentEnv[key])+'</span></li>';
      }
      results += "</ul>";
      me.$el.find('.run-results .info-box-content').html(results);

      me.$el.find('.file-var').click(function(){
        me.model.app.openFile($(this).html().trim());
      });
    }
  }

  vw.cpm.ProcessView.printVar = function(variable){
    if(variable.type == "FILE"){
      return '<span class="file-var link">'+variable.value+'</span>';
    }else if(variable.type == "FILE*"){
      var html = '<ul>';
      for (var i = 0; i < variable.value.length; i++) {
         html += '<li class="file-var link">'+variable.value[i]+'</li>';
      };
      html += '</ul>';
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

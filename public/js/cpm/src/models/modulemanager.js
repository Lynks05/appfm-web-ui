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
        me.parseModuleTree(data);
        me.view.refresh();
      }
    })
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
    $preconfig = $('<div><div style="padding:12px;"><div>Choose folder in which to create new module</div><div>Name : <input type="text"></div></div><button class="create-module-preconfig-submit" type="button">Ok</div></div></div>');
    $preconfig.find('.create-module-preconfig-submit').click(function(){
      var modulename = $preconfig.find('input').val();
      var dirpath = "custom";
      me.checkNameExist(modulename,function(){
        modal.close();
        me.createNewModule(modulename,dirpath);
      },function(){
        var modalcontent = modal.getContainer();
        modalcontent.find(".module-creation-error").remove();
        modalcontent.prepend('<div class="module-creation-error">Module name already exist or isn\'t allowed, please choose another name</div>');
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
        exec:[]
      },
      modulename:modulename,
      source:"name : "+modulename+"\n\ndesc : > \n\tplease fill in a brief description",
      sourcepath:me.app.cpmsettingsmanager.defaultModulesDir+"/"+modulename+".module"
    };
    var module = new vw.cpm.Module(me.app,$panel.find(".frame-body"),newmoduledef);
    //me.model.modulesobj.push(module);
    module.view.render();
  }



}(window.vw = window.vw || {}));
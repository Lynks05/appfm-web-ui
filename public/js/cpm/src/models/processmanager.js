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
    var $panel = this.app.view.createPanel(modulename + " ( "+runid+" )");
    var process = new vw.cpm.Process(this.app,$panel.find(".frame-body"),{moduledef:me.app.modulesmanager.modules[modulename].module,runconf:{},runid:runid});
    process.sync();
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
            if(me.runs.hasOwnProperty(pinfo[0])){
              me.runs[pinfo[0]].push(pinfo[1]);
            }else{
              me.runs[pinfo[0]] = [pinfo[1]];
            }
          }
        }
        me.view.refresh();
      }
    });

  }



}(window.vw = window.vw || {}));
(function(vw){

  vw.cpm.ModuleInputView = draw2d.shape.basic.Circle.extend({

    NAME : "Input",

    init : function(inputname){
      this._super({stroke:3, color:"#3d3d3d", bgColor:"#3dff3d"});

      this.port = this.createPort("output", new draw2d.layout.locator.RightLocator(this));

      
      this.label = new draw2d.shape.basic.Label({text:inputname});

      //this.label.setStroke(0);
      this.add(this.label, new draw2d.layout.locator.BottomLocator(this)); 
    }
  });

  vw.cpm.ModuleOutputView = draw2d.shape.basic.Circle.extend({

    NAME : "Output",

    init : function(outputname){
      this._super({stroke:3, color:"#3d3d3d", bgColor:"#3dff3d"});

      this.port = this.createPort("input", new draw2d.layout.locator.LeftLocator(this));

      
      this.label = new draw2d.shape.basic.Label({text:outputname});

      //this.label.setStroke(0);
      this.add(this.label, new draw2d.layout.locator.BottomLocator(this)); 

    }
  });

  vw.cpm.ModuleConnectionView = function(start,end,labelname){
    var connection = new draw2d.Connection();
    var label = new draw2d.shape.basic.Label({text:labelname, stroke:1, color:"#FF0000", fontColor:"#0d0d0d"});


    connection.add(label, new draw2d.layout.locator.ParallelMidpointLocator());
    connection.setStroke(2);
    connection.setOutlineStroke(1);
    connection.setOutlineColor("#303030");
    connection.setRouter(null);
    connection.setColor("#91B93E");

    connection.setSource(start);
    connection.setTarget(end);
    return connection;
  }

  vw.cpm.ModuleMapBoxView = draw2d.shape.composite.Raft.extend({
    NAME : "ModuleMAP",

    init : function(def,execname,moduleval){
        this._super({width:200,height:200});

        var port = this.createPort("hybrid", new draw2d.layout.locator.LeftLocator(this));
          port.setName("input");


    }


  });

  vw.cpm.ModuleBoxView = draw2d.shape.layout.VerticalLayout.extend({

    NAME: "Module",
  
    init : function(def,execname,moduleval)
    {
        this._super();
        // init the object with some good defaults for the activity setting.
        this.setUserData({def:def,name:execname,moduleval:moduleval});
        
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

   });





}(window.vw = window.vw || {}));

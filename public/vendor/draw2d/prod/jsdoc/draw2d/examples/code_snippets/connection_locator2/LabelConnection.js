/**
 * @class example.connection_labeledit.LabelConnection
 * 
 * A simple Connection with a label wehich sticks in the middle of the connection..
 *
 * @author Andreas Herz
 * @extend draw2d.Connection
 */
var LabelConnection= draw2d.Connection.extend({
    
    init:function(attr)
    {
      this._super(attr);
    
      // Create any Draw2D figure as decoration for the connection
      //
      this.label = new draw2d.shape.basic.Label({
          text:"I'm a Label",
          color:"#0d0d0d",
          fontColor:"#0d0d0d",
          bgColor:"#ffffff"
      });
      
      // add the new decoration to the connection with a position locator.
      //
      this.addFigure(this.label, new draw2d.layout.locator.ManhattanMidpointLocator(this));
      
      this.label.installEditor(new draw2d.ui.LabelInplaceEditor());
    }
});

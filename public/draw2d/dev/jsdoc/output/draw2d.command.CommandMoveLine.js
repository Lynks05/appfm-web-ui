Ext.data.JsonP.draw2d_command_CommandMoveLine({"tagname":"class","name":"draw2d.command.CommandMoveLine","autodetected":{},"files":[{"filename":"CommandMoveLine.js","href":"CommandMoveLine.html#draw2d-command-CommandMoveLine"}],"inheritable":true,"author":[{"tagname":"author","name":"Andreas Herz","email":null}],"extends":"draw2d.command.Command","members":[{"name":"canExecute","tagname":"property","owner":"draw2d.command.CommandMoveLine","id":"property-canExecute","meta":{}},{"name":"constructor","tagname":"method","owner":"draw2d.command.CommandMoveLine","id":"method-constructor","meta":{}},{"name":"canExecute","tagname":"method","owner":"draw2d.command.Command","id":"method-canExecute","meta":{}},{"name":"cancel","tagname":"method","owner":"draw2d.command.Command","id":"method-cancel","meta":{"template":true}},{"name":"execute","tagname":"method","owner":"draw2d.command.CommandMoveLine","id":"method-execute","meta":{}},{"name":"getLabel","tagname":"method","owner":"draw2d.command.Command","id":"method-getLabel","meta":{}},{"name":"redo","tagname":"method","owner":"draw2d.command.CommandMoveLine","id":"method-redo","meta":{}},{"name":"setTranslation","tagname":"method","owner":"draw2d.command.CommandMoveLine","id":"method-setTranslation","meta":{}},{"name":"undo","tagname":"method","owner":"draw2d.command.CommandMoveLine","id":"method-undo","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-draw2d.command.CommandMoveLine","component":false,"superclasses":["draw2d.command.Command"],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'><a href='#!/api/draw2d.command.Command' rel='draw2d.command.Command' class='docClass'>draw2d.command.Command</a><div class='subclass '><strong>draw2d.command.CommandMoveLine</strong></div></div><h4>Files</h4><div class='dependency'><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine' target='_blank'>CommandMoveLine.js</a></div></pre><div class='doc-contents'><p>Command for the movement of figures.</p>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-property'>Properties</h3><div class='subsection'><div id='property-canExecute' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='draw2d.command.CommandMoveLine'>draw2d.command.CommandMoveLine</span><br/><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine-property-canExecute' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.CommandMoveLine-property-canExecute' class='name expandable'>canExecute</a> : boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Returns [true] if the command can be execute and the execution of the\ncommand modify the model. ...</div><div class='long'><p>Returns [true] if the command can be execute and the execution of the\ncommand modify the model. A CommandMove with [startX,startX] == [endX,endY] should\nreturn false. <br>\nthe execution of the Command doesn't modify the model.</p>\n</div></div></div></div></div><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-method'>Methods</h3><div class='subsection'><div id='method-constructor' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='draw2d.command.CommandMoveLine'>draw2d.command.CommandMoveLine</span><br/><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine-method-constructor' target='_blank' class='view-source'>view source</a></div><strong class='new-keyword'>new</strong><a href='#!/api/draw2d.command.CommandMoveLine-method-constructor' class='name expandable'>draw2d.command.CommandMoveLine</a>( <span class='pre'>figure</span> ) : <a href=\"#!/api/draw2d.command.CommandMoveLine\" rel=\"draw2d.command.CommandMoveLine\" class=\"docClass\">draw2d.command.CommandMoveLine</a><span class=\"signature\"></span></div><div class='description'><div class='short'>Create a new Command objects which can be execute via the CommandStack. ...</div><div class='long'><p>Create a new Command objects which can be execute via the CommandStack.</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>figure</span> : <a href=\"#!/api/draw2d.Figure\" rel=\"draw2d.Figure\" class=\"docClass\">draw2d.Figure</a><div class='sub-desc'><p>the figure to move</p>\n</div></li></ul><h3 class='pa'>Returns</h3><ul><li><span class='pre'><a href=\"#!/api/draw2d.command.CommandMoveLine\" rel=\"draw2d.command.CommandMoveLine\" class=\"docClass\">draw2d.command.CommandMoveLine</a></span><div class='sub-desc'>\n</div></li></ul><p>Overrides: <a href=\"#!/api/draw2d.command.Command-method-constructor\" rel=\"draw2d.command.Command-method-constructor\" class=\"docClass\">draw2d.command.Command.constructor</a></p></div></div></div><div id='method-canExecute' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/draw2d.command.Command' rel='draw2d.command.Command' class='defined-in docClass'>draw2d.command.Command</a><br/><a href='source/Command.html#draw2d-command-Command-method-canExecute' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.Command-method-canExecute' class='name expandable'>canExecute</a>( <span class='pre'></span> ) : boolean<span class=\"signature\"></span></div><div class='description'><div class='short'>Returns [true] if the command can be execute and the execution of the\ncommand modifies the model. ...</div><div class='long'><p>Returns [true] if the command can be execute and the execution of the\ncommand modifies the model. e.g.: a CommandMove with [startX,startX] == [endX,endY] should\nreturn false. The execution of this Command doesn't modify the model.</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>boolean</span><div class='sub-desc'><p>return try if the command modify the model or make any relevant changes</p>\n</div></li></ul></div></div></div><div id='method-cancel' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/draw2d.command.Command' rel='draw2d.command.Command' class='defined-in docClass'>draw2d.command.Command</a><br/><a href='source/Command.html#draw2d-command-Command-method-cancel' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.Command-method-cancel' class='name expandable'>cancel</a>( <span class='pre'></span> )<span class=\"signature\"><span class='template' >template</span></span></div><div class='description'><div class='short'>Will be called if the user cancel the operation. ...</div><div class='long'><p>Will be called if the user cancel the operation.</p>\n      <div class='rounded-box template-box'>\n      <p>This is a <a href=\"#!/guide/components\">template method</a>.\n         a hook into the functionality of this class.\n         Feel free to override it in child classes.</p>\n      </div>\n</div></div></div><div id='method-execute' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='draw2d.command.CommandMoveLine'>draw2d.command.CommandMoveLine</span><br/><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine-method-execute' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.CommandMoveLine-method-execute' class='name expandable'>execute</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Execute the command the first time ...</div><div class='long'><p>Execute the command the first time</p>\n<p>Overrides: <a href=\"#!/api/draw2d.command.Command-method-execute\" rel=\"draw2d.command.Command-method-execute\" class=\"docClass\">draw2d.command.Command.execute</a></p></div></div></div><div id='method-getLabel' class='member  inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><a href='#!/api/draw2d.command.Command' rel='draw2d.command.Command' class='defined-in docClass'>draw2d.command.Command</a><br/><a href='source/Command.html#draw2d-command-Command-method-getLabel' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.Command-method-getLabel' class='name expandable'>getLabel</a>( <span class='pre'></span> ) : String<span class=\"signature\"></span></div><div class='description'><div class='short'>Returns a label of the Command. ...</div><div class='long'><p>Returns a label of the Command. e.g. \"move figure\".</p>\n<h3 class='pa'>Returns</h3><ul><li><span class='pre'>String</span><div class='sub-desc'><p>the label for this command</p>\n</div></li></ul></div></div></div><div id='method-redo' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='draw2d.command.CommandMoveLine'>draw2d.command.CommandMoveLine</span><br/><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine-method-redo' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.CommandMoveLine-method-redo' class='name expandable'>redo</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Redo the command after the user has undo this command ...</div><div class='long'><p>Redo the command after the user has undo this command</p>\n<p>Overrides: <a href=\"#!/api/draw2d.command.Command-method-redo\" rel=\"draw2d.command.Command-method-redo\" class=\"docClass\">draw2d.command.Command.redo</a></p></div></div></div><div id='method-setTranslation' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='draw2d.command.CommandMoveLine'>draw2d.command.CommandMoveLine</span><br/><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine-method-setTranslation' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.CommandMoveLine-method-setTranslation' class='name expandable'>setTranslation</a>( <span class='pre'>dx, dy</span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>set the offset of the line translation ...</div><div class='long'><p>set the offset of the line translation</p>\n<h3 class=\"pa\">Parameters</h3><ul><li><span class='pre'>dx</span> : Number<div class='sub-desc'>\n</div></li><li><span class='pre'>dy</span> : Number<div class='sub-desc'>\n</div></li></ul></div></div></div><div id='method-undo' class='member  not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='draw2d.command.CommandMoveLine'>draw2d.command.CommandMoveLine</span><br/><a href='source/CommandMoveLine.html#draw2d-command-CommandMoveLine-method-undo' target='_blank' class='view-source'>view source</a></div><a href='#!/api/draw2d.command.CommandMoveLine-method-undo' class='name expandable'>undo</a>( <span class='pre'></span> )<span class=\"signature\"></span></div><div class='description'><div class='short'>Undo the command ...</div><div class='long'><p>Undo the command</p>\n<p>Overrides: <a href=\"#!/api/draw2d.command.Command-method-undo\" rel=\"draw2d.command.Command-method-undo\" class=\"docClass\">draw2d.command.Command.undo</a></p></div></div></div></div></div></div></div>","meta":{}});